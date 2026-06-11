
import networkx as nx
import numpy as np
import requests
from scipy.spatial import cKDTree
from datetime import datetime


# ─────────────────────────────────────────────────────────────────────────────
# Valhalla road geometry
# ─────────────────────────────────────────────────────────────────────────────

import polyline as _polyline   # pip install polyline --break-system-packages

_VALHALLA_URL = "https://valhalla1.openstreetmap.de/route"

def get_road_geometry(pickup: dict, dropoff: dict, timeout: int = 10) -> list:
    
    payload = {
        "locations": [
            {"lon": pickup["lon"],  "lat": pickup["lat"]},
            {"lon": dropoff["lon"], "lat": dropoff["lat"]},
        ],
        "costing":            "auto",
        "directions_options": {"units": "kilometers"},
    }

    resp = requests.post(_VALHALLA_URL, json=payload, timeout=timeout)
    resp.raise_for_status()
    data = resp.json()

    if "trip" not in data or "legs" not in data["trip"]:
        raise ValueError(f"Réponse Valhalla inattendue: {list(data.keys())}")

    # Valhalla encodes shape as polyline precision 6 (OSRM uses precision 5)
    shape = data["trip"]["legs"][0]["shape"]
    return [{"lat": lat, "lon": lon} for lat, lon in _polyline.decode(shape, 6)]

def _haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = (np.sin(dlat/2)**2 +
         np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon/2)**2)
    return R * 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))


# Cache KD-tree par graphe (id Python) pour ne le construire qu'une fois.
_kdtree_cache: dict = {}

def _get_nearest_node(graph, lat, lon):

    gid = id(graph)
    if gid not in _kdtree_cache:
        node_list = list(graph.nodes(data=True))
        if not node_list:
            return None, float("inf")
        coords = np.array([
            [d.get("lat", d.get("y", 0)), d.get("lon", d.get("x", 0))]
            for _, d in node_list
        ])
        _kdtree_cache.clear()          
        _kdtree_cache[gid] = (cKDTree(coords), [n for n, _ in node_list])

    tree, node_ids = _kdtree_cache[gid]
    dist, idx = tree.query([lat, lon])
    return node_ids[idx], dist         


def _travel_time_minutes(dist_m, speed_kmh):
    if speed_kmh <= 0:
        speed_kmh = 35.0
    return (dist_m / 1000.0) / speed_kmh * 60.0


def find_route(graph, pickup_lat, pickup_lon, drop_lat, drop_lon):
    start, start_dist = _get_nearest_node(graph, pickup_lat, pickup_lon)
    goal,  goal_dist  = _get_nearest_node(graph, drop_lat,   drop_lon)

    MAX_SNAP = 0.018   # ~2 km en degrés (distance euclidienne approx.)

    use_graph = (
        start is not None and
        goal  is not None and
        start != goal and
        start_dist < MAX_SNAP and
        goal_dist  < MAX_SNAP
    )

    if use_graph:
        try:
            # ── Construire le graphe de routage ──────────────────────────────
            # to_undirected() fusionne (u→v) et (v→u) en un seul edge.
            # Pour ne pas perdre les attributs de vitesse, on calcule
            # travel_time AVANT la conversion, puis on les copie.
            #
            # Algorithme :
            #   1. Pré-calculer travel_time sur le graphe dirigé original
            #   2. Convertir en non-orienté (avg des deux sens si besoin)
            #   3. Propager travel_time sur le non-orienté
            #   4. Lancer shortest_path
            #   5. Re-calculer distance/time depuis le graphe dirigé
            #      pour garder des valeurs exactes (pas de fusion d'arêtes)

            # Étape 1 : travel_time sur le graphe dirigé
            for u, v, data in graph.edges(data=True):
                dist_m    = data.get("distanceMeters", 0)
                speed_kmh = data.get("avgSpeedKmh", 40.0)
                data["travel_time"] = _travel_time_minutes(dist_m, speed_kmh)

            # Étape 2-3 : non-orienté avec travel_time
            undirected = graph.to_undirected()
            # to_undirected garde les attributs de u→v ; mais travel_time
            # vient d'être calculé, donc il est déjà présent sur chaque sens.

            if not nx.has_path(undirected, start, goal):
                raise ValueError("Aucun chemin dans le graphe")

            # Étape 4 : chemin optimal (minimise le temps, pas la distance)
            path = nx.shortest_path(
                undirected,
                source=start,
                target=goal,
                weight="travel_time"
            )

            # Étape 5 : totaux depuis le graphe dirigé (valeurs exactes)
            total_distance = 0.0
            total_time     = 0.0
            for i in range(len(path) - 1):
                u, v = path[i], path[i + 1]
                # Chercher l'arête dans un sens ou dans l'autre
                if graph.has_edge(u, v):
                    ed = graph[u][v]
                elif graph.has_edge(v, u):
                    ed = graph[v][u]
                else:
                    continue
                total_distance += ed.get("distanceMeters", 0)
                total_time     += ed.get("travel_time", 0)

            # 5 % de marge pour feux / accélérations
            eta = total_time * 1.05

            return {
                "path":     path,
                "distance": total_distance,
                "eta":      round(eta, 1),
                "fallback": False
            }

        except Exception as e:
            print(f"⚠️ Graphe : {e} → fallback")

    # ── FALLBACK ligne droite ──
    print("⚠️ Zone sans historique → fallback")
    dist_m = _haversine(pickup_lat, pickup_lon, drop_lat, drop_lon)
    # Vitesse urbaine moyenne 40 km/h + 5 % marge
    eta    = _travel_time_minutes(dist_m, 40.0) * 1.05

    virtual_nodes = {}
    for i in range(11):
        t   = i / 10
        nid = f"fallback_{i}"
        virtual_nodes[nid] = {
            "lat": pickup_lat + t * (drop_lat - pickup_lat),
            "lon": pickup_lon + t * (drop_lon - pickup_lon),
        }

    return {
        "path":          list(virtual_nodes.keys()),
        "distance":      dist_m,
        "eta":           round(eta, 1),
        "fallback":      True,
        "virtual_nodes": virtual_nodes
    }


# ─────────────────────────────────────────────────────────────────────────────
# snap_history_to_roads
# ─────────────────────────────────────────────────────────────────────────────

def _catmull_rom(coords, steps=6):
    """Lisse une liste de [lat, lon] avec un spline Catmull-Rom."""
    if len(coords) < 2:
        return coords
    pts = [coords[0]] + coords + [coords[-1]]
    out = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        for s in range(steps):
            t = s / steps; t2 = t * t; t3 = t2 * t
            out.append([
                0.5 * (2*p1[0] + (-p0[0]+p2[0])*t + (2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2 + (-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
                0.5 * (2*p1[1] + (-p0[1]+p2[1])*t + (2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2 + (-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3),
            ])
    out.append(list(coords[-1]))
    return out


def _build_edge_index(graph):
    """
    Construit un index spatial (KD-tree) sur les milieux des arêtes du graphe.
    Retourne (segments, seg_tree) pour une utilisation dans _snap_to_edge.
    """
    segments = []   # liste de (u, v, lat1, lon1, lat2, lon2)
    for u, v in graph.edges():
        ud = graph.nodes[u]
        vd = graph.nodes[v]
        lat1 = ud.get("lat", ud.get("y", 0))
        lon1 = ud.get("lon", ud.get("x", 0))
        lat2 = vd.get("lat", vd.get("y", 0))
        lon2 = vd.get("lon", vd.get("x", 0))
        segments.append((u, v, lat1, lon1, lat2, lon2))

    if not segments:
        return segments, None

    mids     = np.array([[(s[2] + s[4]) / 2, (s[3] + s[5]) / 2] for s in segments])
    seg_tree = cKDTree(mids)
    return segments, seg_tree


def _snap_to_edge(lat, lon, segments, seg_tree, k=20):

    if seg_tree is None or not segments:
        return lat, lon, None, float("inf")

    k = min(k, len(segments))
    _, indices = seg_tree.query([lat, lon], k=k)
    if not hasattr(indices, "__iter__"):
        indices = [indices]

    best_dist_sq = float("inf")
    best_snap    = (lat, lon)
    best_node    = None

    for idx in indices:
        u, v, lat1, lon1, lat2, lon2 = segments[idx]
        dlat   = lat2 - lat1
        dlon   = lon2 - lon1
        len_sq = dlat * dlat + dlon * dlon

        t = 0.0 if len_sq < 1e-14 else max(0.0, min(1.0,
            ((lat - lat1) * dlat + (lon - lon1) * dlon) / len_sq
        ))

        snap_lat = lat1 + t * dlat
        snap_lon = lon1 + t * dlon
        dist_sq  = (lat - snap_lat) ** 2 + (lon - snap_lon) ** 2

        if dist_sq < best_dist_sq:
            best_dist_sq = dist_sq
            best_snap    = (snap_lat, snap_lon)
            best_node    = u if t < 0.5 else v

    return best_snap[0], best_snap[1], best_node, np.sqrt(best_dist_sq)


def snap_history_to_roads(graph, gps_points, max_snap_m=400):
    """
    Map-match une séquence de points GPS d'historique conducteur sur le
    réseau routier du graphe.

    Algorithme en 3 phases :
      1. Snap-to-road  — chaque point GPS est projeté sur l'arête la plus
         proche (vraie projection, pas seulement le nœud le plus proche).
      2. Routage       — entre deux points consécutifs, le chemin le plus
         court dans le graphe est calculé ; les coordonnées des nœuds
         intermédiaires sont insérées → zéro ligne droite.
      3. Lissage       — spline Catmull-Rom pour des courbes naturelles.

    Paramètres
    ----------
    graph       : NetworkX DiGraph avec attributs lat/lon sur les nœuds
    gps_points  : liste de (lat, lon) — points bruts de l'historique
    max_snap_m  : distance max (mètres) pour accepter un snap sur route

    Retourne
    --------
    Liste de [lat, lon] collés aux rues, prêts pour l'affichage.
    """
    if not gps_points:
        return []
    if graph is None or len(graph.nodes) == 0:
        return [[p[0], p[1]] for p in gps_points]

    MAX_SNAP_DEG = max_snap_m / 111_000   # conversion approximative degrés

    # Travailler sur le graphe non-orienté pour permettre le routage dans les
    # deux sens (l'historique peut traverser des sens uniques)
    undirected = graph.to_undirected()
    for u, v, data in undirected.edges(data=True):
        dist_m = data.get("distanceMeters", 0)
        speed  = data.get("avgSpeedKmh", 35.0)
        data["travel_time"] = _travel_time_minutes(dist_m, speed)

    segments, seg_tree = _build_edge_index(undirected)

    # ── Phase 1 : snap chaque point GPS à l'arête la plus proche ─────────────
    snapped = []   # (snap_lat, snap_lon, nearest_node | None)
    for lat, lon in gps_points:
        s_lat, s_lon, node_id, dist = _snap_to_edge(lat, lon, segments, seg_tree)
        if dist > MAX_SNAP_DEG:
            snapped.append((lat, lon, None))     # hors réseau → position brute
        else:
            snapped.append((s_lat, s_lon, node_id))

    # ── Phase 2 : relier les points via le graphe ─────────────────────────────
    full_coords = []

    for i, (s_lat, s_lon, node_id) in enumerate(snapped):
        if i == 0:
            full_coords.append([s_lat, s_lon])
            continue

        _, _, prev_node = snapped[i - 1]

        # Les deux points sont sur le graphe et sur des nœuds différents
        if node_id is not None and prev_node is not None and prev_node != node_id:
            try:
                if nx.has_path(undirected, prev_node, node_id):
                    path = nx.shortest_path(
                        undirected, prev_node, node_id, weight="travel_time"
                    )
                    # Injecter les nœuds intermédiaires (le premier est déjà dans full_coords)
                    for path_node in path[1:]:
                        nd = undirected.nodes[path_node]
                        full_coords.append([
                            nd.get("lat", nd.get("y", 0)),
                            nd.get("lon", nd.get("x", 0)),
                        ])
                    # Remplacer la dernière coord par le point snapé exact (plus précis)
                    full_coords[-1] = [s_lat, s_lon]
                else:
                    full_coords.append([s_lat, s_lon])
            except Exception:
                full_coords.append([s_lat, s_lon])
        else:
            full_coords.append([s_lat, s_lon])

    # ── Phase 3 : lissage Catmull-Rom ────────────────────────────────────────
    if len(full_coords) >= 4:
        full_coords = _catmull_rom(full_coords, steps=6)

    return full_coords