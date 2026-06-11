"""
Flask entry point — MVC strict.
Routes uniquement. Toute logique → RouteController. Tout formatage JSON → RouteView.
"""

from flask import Flask, request
from flask_cors import CORS
import json
import os

from controllers.RouteController import (
    ensure_graph, get_status, find_route, snap_history, start_rebuild,
    get_model,
)
from views.RouteView import (
    route_response, snap_response, status_response, rebuild_started,
    nodes_response, edges_response, health_response,
    error_response, graph_not_loaded, rebuild_in_progress,
)

app = Flask(__name__)
CORS(app)

# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/predict_route", methods=["POST"])
def predict_route():
    if not ensure_graph():
        return graph_not_loaded()

    body = request.get_json()
    if not body:
        return error_response("Body JSON manquant", 400)

    start = body.get("start")
    end   = body.get("end")
    if not start or not end:
        return error_response("start et end requis", 400)

    try:
        result        = find_route(float(start[0]), float(start[1]),
                                   float(end[0]),   float(end[1]))
        model         = get_model()
        graph         = model.graph
        virtual_nodes = result.virtual_nodes
        path          = result.path
        is_fallback   = result.fallback

        def _resolve(node_id):
            if node_id in virtual_nodes:
                n = virtual_nodes[node_id]
                return [n["lat"], n["lon"]]
            if node_id in graph.nodes:
                nd  = graph.nodes[node_id]
                lat = nd.get("lat", nd.get("y"))
                lon = nd.get("lon", nd.get("x"))
                if lat is not None and lon is not None:
                    return [lat, lon]
            return None

        coords_path     = []
        route_waypoints = []

        for i, node in enumerate(path):
            coord = _resolve(node)
            if coord is None:
                continue
            coords_path.append(coord)
            route_waypoints.append({"id": node, "lat": coord[0], "lon": coord[1], "order": i})
            if i < len(path) - 1 and not is_fallback:
                nxt = path[i + 1]
                if graph.has_edge(node, nxt):
                    coords_path.extend(graph[node][nxt].get("waypoints", []))
                elif graph.has_edge(nxt, node):
                    wps = graph[nxt][node].get("waypoints", [])
                    if wps:
                        coords_path.extend(reversed(wps))

        simplified = _simplify_waypoints(route_waypoints, 0.0005)
        visual_path = coords_path

        if not is_fallback and len(route_waypoints) >= 2:
            try:
                from route_service import get_road_geometry
                road_geo    = get_road_geometry(route_waypoints[0], route_waypoints[-1])
                visual_path = [[p["lat"], p["lon"]] for p in road_geo]
            except Exception as ve:
                print(f"⚠️  Valhalla: {ve} — fallback local")

        return route_response(visual_path, simplified, result.distance, result.eta, is_fallback)

    except Exception as e:
        return error_response(str(e), 500)


@app.route("/snap_history", methods=["POST"])
def snap_history_route():
    if not ensure_graph():
        return graph_not_loaded()

    body = request.get_json()
    if not body or "points" not in body:
        return error_response("body JSON avec champ 'points' requis", 400)

    raw = body["points"]
    if not isinstance(raw, list) or len(raw) == 0:
        return error_response("'points' doit être une liste non vide", 400)

    try:
        gps_points = [(float(p[0]), float(p[1])) for p in raw]
        max_snap_m = float(body.get("max_snap_m", 400))
        result     = snap_history(gps_points, max_snap_m)
        return snap_response(result.snapped)
    except Exception as e:
        return error_response(str(e), 500)


@app.route("/graph_status", methods=["GET"])
def graph_status():
    return status_response(get_status())


@app.route("/graph_info", methods=["GET"])
def graph_info():
    return status_response(get_status())


@app.route("/rebuild_graph", methods=["POST"])
def rebuild_graph():
    if not start_rebuild.__module__:  # safety guard
        return rebuild_in_progress()

    body      = request.get_json(silent=True) or {}
    use_osmnx = bool(body.get("use_osmnx", True))
    limit     = int(body.get("limit", 2000))

    started = start_rebuild(use_osmnx, limit)
    if not started:
        return rebuild_in_progress()

    source_label = "OSMnx" if use_osmnx else "historical"
    return rebuild_started(use_osmnx, limit)


@app.route("/graph/nodes", methods=["GET"])
def graph_nodes():
    if not ensure_graph():
        return graph_not_loaded()
    model = get_model()
    nodes = []
    for node_id, data in model.graph.nodes(data=True):
        lat = data.get("lat", data.get("y"))
        lon = data.get("lon", data.get("x"))
        if lat is None or lon is None:
            continue
        nodes.append({"id": node_id, "lat": float(lat), "lon": float(lon),
                       "visit_count": int(model.graph.degree(node_id))})
    return nodes_response(nodes)


@app.route("/graph/edges", methods=["GET"])
def graph_edges():
    if not ensure_graph():
        return graph_not_loaded()
    model = get_model()
    edges = []
    for u, v, data in model.graph.edges(data=True):
        ud = model.graph.nodes.get(u, {})
        vd = model.graph.nodes.get(v, {})
        from_lat = ud.get("lat", ud.get("y"))
        from_lon = ud.get("lon", ud.get("x"))
        to_lat   = vd.get("lat", vd.get("y"))
        to_lon   = vd.get("lon", vd.get("x"))
        if None in (from_lat, from_lon, to_lat, to_lon):
            continue
        avg_speed = float(data.get("avgSpeedKmh", 40.0))
        distance  = float(data.get("distanceMeters", 0.0))
        edges.append({
            "from_id": u, "to_id": v,
            "from_lat": float(from_lat), "from_lon": float(from_lon),
            "to_lat": float(to_lat), "to_lon": float(to_lon),
            "avg_speed": avg_speed,
            "weight": round(distance / avg_speed if avg_speed > 0 else 0.0, 4),
        })
    return edges_response(edges)


@app.route("/health", methods=["GET"])
def health():
    return health_response()


@app.route("/roads", methods=["GET"])
def roads_geojson():
    script_dir   = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    geojson_path = os.path.join(project_root, "frontend", "public", "roads.geojson")
    if not os.path.exists(geojson_path):
        from flask import jsonify
        return jsonify({"type": "FeatureCollection", "features": []})
    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    from flask import jsonify
    return jsonify(data)


# ── Helpers (View-level geometry — pas de logique métier) ─────────────────────

def _simplify_waypoints(waypoints: list, tolerance: float = 0.0005) -> list:
    if len(waypoints) <= 2:
        return waypoints
    x1, y1 = waypoints[0]["lat"],  waypoints[0]["lon"]
    x2, y2 = waypoints[-1]["lat"], waypoints[-1]["lon"]
    dx, dy  = x2 - x1, y2 - y1
    line_sq = dx * dx + dy * dy
    max_dist, max_idx = 0.0, 0
    for i in range(1, len(waypoints) - 1):
        x0, y0 = waypoints[i]["lat"], waypoints[i]["lon"]
        if line_sq == 0:
            d = ((x0 - x1) ** 2 + (y0 - y1) ** 2) ** 0.5
        else:
            t = max(0.0, min(1.0, ((x0-x1)*dx + (y0-y1)*dy) / line_sq))
            d = (((x1+t*dx)-x0)**2 + ((y1+t*dy)-y0)**2)**0.5
        if d > max_dist:
            max_dist, max_idx = d, i
    if max_dist > tolerance:
        return _simplify_waypoints(waypoints[:max_idx+1], tolerance)[:-1] + \
               _simplify_waypoints(waypoints[max_idx:], tolerance)
    return [waypoints[0], waypoints[-1]]


if __name__ == "__main__":
    print("🚀 Flask MVC — http://127.0.0.1:8050")
    print("💡 Lazy loading : graphe chargé à la première requête")
    app.run(port=8050, debug=True)
