"""
Model — données et opérations bas-niveau sur le graphe routier.
Aucune logique HTTP ici. Le Controller est le seul à instancier ce model.
"""

from dataclasses import dataclass, field
from typing import Optional
import pickle
import os
import numpy as np
from scipy.spatial import cKDTree


@dataclass
class RouteResult:
    path: list
    distance: float
    eta: float
    fallback: bool
    virtual_nodes: dict = field(default_factory=dict)


@dataclass
class SnapResult:
    snapped: list
    count: int


class RouteModel:
    """Encapsule le graphe NetworkX et expose les opérations de données."""

    GRAPH_PATH = "road_graph.pkl"

    def __init__(self):
        self.graph       = None
        self.node_count  = 0
        self.edge_count  = 0
        self.meta: dict  = {}
        self._kdtree_cache: dict = {}

    # ── Persistence ──────────────────────────────────────────────────────────

    def load(self) -> bool:
        if not os.path.exists(self.GRAPH_PATH):
            return False
        size_mb = os.path.getsize(self.GRAPH_PATH) / (1024 * 1024)
        with open(self.GRAPH_PATH, "rb") as f:
            data = pickle.load(f)
        self.graph      = data["graph"]
        self.node_count = len(data.get("nodes", []))
        self.edge_count = len(data.get("edges", []))
        self.meta = {
            "version":   data.get("version",   "unknown"),
            "source":    data.get("source",    "unknown"),
            "geomEdges": data.get("geomEdges", 0),
            "createdAt": data.get("createdAt", "unknown"),
            "size_mb":   round(size_mb, 1),
        }
        return True

    def save(self, builder_graph, nodes, edges, source_tag: str, version: str, created_at: str):
        geom_count = sum(1 for e in edges if e.get("waypoints"))
        data = {
            "graph":     builder_graph,
            "nodes":     nodes,
            "edges":     edges,
            "version":   version,
            "source":    source_tag,
            "geomEdges": geom_count,
            "createdAt": created_at,
        }
        with open(self.GRAPH_PATH, "wb") as f:
            pickle.dump(data, f)
        self.graph      = builder_graph
        self.node_count = len(nodes)
        self.edge_count = len(edges)
        return geom_count

    def is_loaded(self) -> bool:
        return self.graph is not None

    # ── Spatial helpers ───────────────────────────────────────────────────────

    def get_nearest_node(self, lat: float, lon: float):
        gid = id(self.graph)
        if gid not in self._kdtree_cache:
            node_list = list(self.graph.nodes(data=True))
            if not node_list:
                return None, float("inf")
            coords = np.array([
                [d.get("lat", d.get("y", 0)), d.get("lon", d.get("x", 0))]
                for _, d in node_list
            ])
            self._kdtree_cache.clear()
            self._kdtree_cache[gid] = (cKDTree(coords), [n for n, _ in node_list])
        tree, node_ids = self._kdtree_cache[gid]
        dist, idx = tree.query([lat, lon])
        return node_ids[idx], dist

    @staticmethod
    def haversine(lat1, lon1, lat2, lon2) -> float:
        R = 6_371_000
        dlat = np.radians(lat2 - lat1)
        dlon = np.radians(lon2 - lon1)
        a = (np.sin(dlat / 2) ** 2 +
             np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2) ** 2)
        return R * 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))

    @staticmethod
    def travel_time_minutes(dist_m: float, speed_kmh: float) -> float:
        if speed_kmh <= 0:
            speed_kmh = 35.0
        return (dist_m / 1_000.0) / speed_kmh * 60.0
