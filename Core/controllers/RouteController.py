"""
Controller — logique métier : routage A*, snap-to-road, rebuild graph.
Reçoit des données brutes → appelle RouteModel → retourne des objets pour RouteView.
"""

import threading
import networkx as nx
import numpy as np
from datetime import datetime
from scipy.spatial import cKDTree

from models.RouteModel import RouteModel, RouteResult, SnapResult


# ── Status partagé (rebuild asynchrone) ────────────────────────────────────────

_status_cache: dict = {
    "running": False, "last_build": None, "message": "idle",
    "loaded": False, "nodes": 0, "edges": 0,
    "source": "unknown", "version": "unknown", "geomEdges": 0,
    "createdAt": "unknown", "size_mb": 0,
    "sample_edge_has_waypoints": False, "isOsmnx": False,
    "action_needed": "Cliquez Rebuild Graph pour télécharger les routes OSM",
}

_model = RouteModel()


def get_model() -> RouteModel:
    return _model


def get_status() -> dict:
    return _status_cache


def ensure_graph() -> bool:
    if not _model.is_loaded():
        ok = _model.load()
        if ok:
            _sync_status_from_model()
    return _model.is_loaded()


def _sync_status_from_model():
    is_osmnx = _model.meta.get("source") == "overpass"
    _status_cache.update({
        "loaded":    True,
        "nodes":     _model.node_count,
        "edges":     _model.edge_count,
        "source":    _model.meta.get("source", "unknown"),
        "version":   _model.meta.get("version", "unknown"),
        "geomEdges": _model.meta.get("geomEdges", 0),
        "createdAt": _model.meta.get("createdAt", "unknown"),
        "size_mb":   _model.meta.get("size_mb", 0),
        "sample_edge_has_waypoints": _model.meta.get("geomEdges", 0) > 0,
        "isOsmnx":   is_osmnx,
        "action_needed": None if is_osmnx else "Cliquez Rebuild Graph pour télécharger les routes OSM",
    })


# ── Routing ────────────────────────────────────────────────────────────────────

def find_route(pickup_lat, pickup_lon, drop_lat, drop_lon) -> RouteResult:
    graph = _model.graph
    start, sd = _model.get_nearest_node(pickup_lat, pickup_lon)
    goal,  gd = _model.get_nearest_node(drop_lat, drop_lon)
    MAX_SNAP = 0.018

    use_graph = (
        start is not None and goal is not None and
        start != goal and sd < MAX_SNAP and gd < MAX_SNAP
    )

    if use_graph:
        try:
            for u, v, data in graph.edges(data=True):
                data["travel_time"] = RouteModel.travel_time_minutes(
                    data.get("distanceMeters", 0), data.get("avgSpeedKmh", 40.0)
                )
            undirected = graph.to_undirected()
            if not nx.has_path(undirected, start, goal):
                raise ValueError("No path in graph")

            path = nx.shortest_path(undirected, start, goal, weight="travel_time")
            total_distance = total_time = 0.0
            for i in range(len(path) - 1):
                u, v = path[i], path[i + 1]
                ed = graph[u][v] if graph.has_edge(u, v) else (graph[v][u] if graph.has_edge(v, u) else {})
                total_distance += ed.get("distanceMeters", 0)
                total_time     += ed.get("travel_time", 0)

            return RouteResult(path=path, distance=total_distance,
                               eta=round(total_time * 1.05, 1), fallback=False)
        except Exception as e:
            print(f"⚠️ Graph error: {e} → fallback")

    # Fallback ligne droite
    dist_m = RouteModel.haversine(pickup_lat, pickup_lon, drop_lat, drop_lon)
    eta    = RouteModel.travel_time_minutes(dist_m, 40.0) * 1.05
    virtual_nodes = {f"fallback_{i}": {"lat": pickup_lat + i/10*(drop_lat-pickup_lat),
                                        "lon": pickup_lon + i/10*(drop_lon-pickup_lon)}
                     for i in range(11)}
    return RouteResult(path=list(virtual_nodes.keys()), distance=dist_m,
                       eta=round(eta, 1), fallback=True, virtual_nodes=virtual_nodes)


# ── Snap history ───────────────────────────────────────────────────────────────

def snap_history(gps_points: list, max_snap_m: float = 400) -> SnapResult:
    from route_service import snap_history_to_roads
    snapped = snap_history_to_roads(_model.graph, gps_points, max_snap_m=max_snap_m)
    return SnapResult(snapped=snapped, count=len(snapped))


# ── Rebuild ────────────────────────────────────────────────────────────────────

def start_rebuild(use_osmnx: bool, limit: int) -> bool:
    """Lance le rebuild en thread. Retourne False si un rebuild est déjà en cours."""
    if _status_cache["running"]:
        return False
    thread = threading.Thread(
        target=_run_rebuild, args=(use_osmnx, limit), daemon=True
    )
    thread.start()
    return True


def _run_rebuild(use_osmnx: bool, limit: int):
    global _status_cache
    _status_cache["running"] = True
    _status_cache["message"] = "Initialisation…"

    try:
        def _progress(msg):
            _status_cache["message"] = msg

        from graph_builder import GraphBuilder
        builder = GraphBuilder()

        if use_osmnx:
            builder_graph = builder.build_graph(status_cb=_progress)
            source_tag    = "overpass"
            version       = "v9.0-overpass"
        else:
            _run_historical_mode(builder, limit, _progress)
            source_tag = "historical"
            version    = "v7.0-historical"
            builder_graph = builder.graph

        built_at   = datetime.now().isoformat()
        geom_count = _model.save(
            builder_graph, builder.nodes, builder.edges,
            source_tag, version, built_at
        )
        final_msg = f"✓ {_model.node_count} nœuds · {_model.edge_count} arêtes · {geom_count} courbes [{source_tag}]"
        is_osmnx  = source_tag == "overpass"

        _status_cache.update({
            "last_build": built_at, "message": final_msg, "loaded": True,
            "nodes": _model.node_count, "edges": _model.edge_count,
            "source": source_tag, "version": version, "geomEdges": geom_count,
            "createdAt": built_at,
            "sample_edge_has_waypoints": geom_count > 0,
            "isOsmnx":   is_osmnx,
            "action_needed": None if is_osmnx else "Cliquez Rebuild Graph pour télécharger les routes OSM",
        })

    except Exception as exc:
        import traceback
        print(traceback.format_exc())
        _status_cache["message"] = f"Erreur : {exc}"
    finally:
        _status_cache["running"] = False


def _run_historical_mode(builder, limit, progress_cb):
    """Construit le graphe depuis les données GPS MongoDB (fallback)."""
    progress_cb("Chargement des trajets MongoDB…")
    from pymongo import MongoClient
    from sklearn.cluster import DBSCAN

    MONGO_URI = "mongodb+srv://ettijahat-interns:pQrbiubxL0acOiCP@production.g8vjv.mongodb.net/"
    client    = MongoClient(MONGO_URI)
    db        = client["heroku_v801wdr2"]
    cursor    = db["driverlogs"].find(
        {"location": {"$exists": True, "$not": {"$size": 0}, "$ne": None}},
        {"location": 1}
    ).limit(limit)

    coords_list = []
    for doc in cursor:
        loc = doc.get("location", [])
        if isinstance(loc, list) and len(loc) == 2:
            try:
                lng, lat = float(loc[0]), float(loc[1])
                if 28.0 <= lat <= 30.5 and 46.5 <= lng <= 49.0:
                    coords_list.append([lat, lng])
            except (ValueError, TypeError):
                pass

    if len(coords_list) < 10:
        raise RuntimeError("Pas assez de données GPS MongoDB.")

    progress_cb(f"Clustering {len(coords_list)} points GPS…")
    coords = np.array(coords_list)
    labels = DBSCAN(eps=0.0003, min_samples=2).fit_predict(coords)

    g = nx.DiGraph()
    nodes_tmp = []
    for label in set(labels) - {-1}:
        mask     = labels == label
        centroid = coords[mask].mean(axis=0)
        nid      = f"n_{len(nodes_tmp)}"
        nodes_tmp.append({"id": nid, "lat": float(centroid[0]), "lon": float(centroid[1])})
        g.add_node(nid, lat=float(centroid[0]), lon=float(centroid[1]))

    nc   = np.array([[n["lat"], n["lon"]] for n in nodes_tmp])
    tree = cKDTree(nc)
    for i, j in tree.query_pairs(r=0.0045):
        n1, n2 = nodes_tmp[i], nodes_tmp[j]
        dist   = RouteModel.haversine(n1["lat"], n1["lon"], n2["lat"], n2["lon"])
        if dist < 50:
            continue
        for src, dst in [(n1["id"], n2["id"]), (n2["id"], n1["id"])]:
            g.add_edge(src, dst, distanceMeters=dist, avgSpeedKmh=40.0,
                       roadType="unclassified", waypoints=[])

    builder.graph = g
    builder.nodes = nodes_tmp
    builder.edges = [{"source": u, "target": v, **dict(d)} for u, v, d in g.edges(data=True)]
