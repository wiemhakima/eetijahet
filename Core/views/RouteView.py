"""
View — formate exclusivement les réponses JSON Flask.
Aucune logique de routage ici. Le Controller fournit des objets de données.
"""

from flask import jsonify


def route_response(visual_path, waypoints, distance, eta, fallback):
    return jsonify({
        "path":      visual_path,
        "waypoints": waypoints,
        "distance":  distance,
        "eta":       eta,
        "fallback":  fallback,
    })


def snap_response(snapped: list):
    return jsonify({"snapped": snapped, "count": len(snapped)})


def status_response(cache: dict):
    return jsonify(cache)


def rebuild_started(use_osmnx: bool, limit: int):
    return jsonify({
        "message":   f"Rebuild started ({'OSMnx' if use_osmnx else 'historical'}, limit={limit})",
        "use_osmnx": use_osmnx,
        "limit":     limit,
    })


def nodes_response(nodes: list):
    return jsonify({"nodes": nodes})


def edges_response(edges: list):
    return jsonify({"edges": edges})


def health_response():
    return jsonify({"status": "ok"})


def error_response(msg: str, status: int = 400):
    return jsonify({"error": msg}), status


def graph_not_loaded():
    return error_response("Graph not loaded — run /rebuild_graph first", 503)


def rebuild_in_progress():
    return jsonify({"message": "A rebuild is already in progress."}), 409
