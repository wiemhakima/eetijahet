import pickle
import json
from collections import defaultdict
from datetime import datetime

import numpy as np
import networkx as nx
import requests

KUWAIT_BBOX    = "28.5,46.5,30.1,49.0"   # south,west,north,east
OVERPASS_URL   = "https://overpass-api.de/api/interpreter"

HIGHWAY_FILTER = (
    "motorway|motorway_link|trunk|trunk_link|"
    "primary|primary_link|secondary|secondary_link|"
    "tertiary|tertiary_link|residential|living_street|"
    "service|unclassified|road"
)

ROAD_SPEED: dict[str, float] = {
    "motorway":       100.0,
    "motorway_link":   70.0,
    "trunk":           85.0,
    "trunk_link":      65.0,
    "primary":         65.0,
    "primary_link":    55.0,
    "secondary":       55.0,
    "secondary_link":  45.0,
    "tertiary":        45.0,
    "tertiary_link":   35.0,
    "residential":     30.0,
    "living_street":   15.0,
    "service":         20.0,
    "unclassified":    40.0,
    "road":            40.0,
}


def _road_speed(highway: object) -> float:
    if isinstance(highway, list):
        highway = highway[0] if highway else "road"
    return ROAD_SPEED.get(str(highway), 40.0)


def _haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6_371_000
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = (np.sin(dlat / 2) ** 2
         + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2) ** 2)
    return R * 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))



class GraphBuilder:

    def __init__(self, bbox: str = KUWAIT_BBOX):
        self.bbox  = bbox
        self.graph = nx.DiGraph()
        self.nodes: list[dict] = []
        self.edges: list[dict] = []

    # ── Étape 1 : fetch ──────────────────────────────────────────────────────

    def fetch_osm_data(self, status_cb=None) -> dict:
        """Télécharge les ways + nœuds OSM Kuwait depuis Overpass API."""
        query = f"""
[out:json][timeout:180];
(
  way["highway"~"^({HIGHWAY_FILTER})$"]({self.bbox});
);
out body;
>;
out skel qt;
"""
        if status_cb:
            status_cb("Connexion Overpass API (OpenStreetMap)… (1-3 min)")
        print("▶ Overpass API query…")

        resp = requests.post(OVERPASS_URL, data={"data": query}, timeout=200)
        resp.raise_for_status()
        data = resp.json()

        n_ways  = sum(1 for e in data["elements"] if e["type"] == "way")
        n_nodes = sum(1 for e in data["elements"] if e["type"] == "node")
        print(f"  ✓ {n_ways} ways, {n_nodes} nœuds OSM reçus")
        return data

    # ── Étape 2-5 : construction ─────────────────────────────────────────────

    def build_graph(self, osm_data: dict | None = None, status_cb=None) -> nx.DiGraph:
        """
        Construit le graphe NetworkX depuis les données OSM.

        Paramètres
        ----------
        osm_data  : dict optionnel (JSON Overpass pré-chargé).
                    Si None, téléchargé automatiquement.
        status_cb : callable(str) pour les mises à jour de progression.
        """
        print("=" * 60)
        print("BUILDING GRAPH — Overpass API / OSM")
        print("=" * 60)

        if osm_data is None:
            osm_data = self.fetch_osm_data(status_cb=status_cb)

        elements = osm_data.get("elements", [])

        # ── Étape 2 : parser les nœuds OSM ───────────────────────────────────
        if status_cb:
            status_cb("Parsing des nœuds OSM…")

        all_nodes: dict[int, tuple[float, float]] = {}   # id → (lat, lon)
        for el in elements:
            if el["type"] == "node":
                all_nodes[el["id"]] = (el["lat"], el["lon"])

        print(f"  {len(all_nodes)} nœuds OSM chargés")

        # ── Étape 3 : parser les ways ─────────────────────────────────────────
        ways: list[dict] = []
        for el in elements:
            if el["type"] != "way":
                continue
            tags    = el.get("tags", {})
            highway = tags.get("highway", "road")
            oneway  = tags.get("oneway", "no")
            nids    = [n for n in el.get("nodes", []) if n in all_nodes]
            if len(nids) < 2:
                continue
            ways.append({
                "nodes":    nids,
                "highway":  highway,
                "oneway":   oneway,   # "yes" | "-1" | "no" | …
            })

        print(f"  {len(ways)} ways valides")

        # ── Étape 4 : trouver les intersections ───────────────────────────────
        #   Un nœud est une intersection si :
        #     a) il est extrémité (premier ou dernier) d'un way, OU
        #     b) il apparaît dans ≥ 2 ways différents
        if status_cb:
            status_cb(f"Calcul des intersections ({len(ways)} ways)…")

        node_way_count: dict[int, int] = defaultdict(int)
        for way in ways:
            seen: set[int] = set()
            for nid in way["nodes"]:
                if nid not in seen:
                    node_way_count[nid] += 1
                    seen.add(nid)

        intersections: set[int] = set()
        for way in ways:
            intersections.add(way["nodes"][0])
            intersections.add(way["nodes"][-1])
        for nid, cnt in node_way_count.items():
            if cnt >= 2:
                intersections.add(nid)

        print(f"  {len(intersections)} intersections trouvées")

        # ── Étape 5 : découper les ways en segments entre intersections ────────
        #   Un segment = succession de nœuds entre deux intersections.
        #   L'edge stocke TOUS les nœuds intermédiaires comme waypoints.
        if status_cb:
            status_cb("Création des edges (segments de rue)…")

        graph_nodes: dict[int, dict] = {}   # id → {lat, lon}
        graph_edges: list[dict] = []

        for way in ways:
            nids    = way["nodes"]
            highway = way["highway"]
            speed   = _road_speed(highway)
            oneway  = way["oneway"]

            # Enregistrer chaque nœud d'intersection
            for nid in nids:
                if nid in intersections and nid not in graph_nodes:
                    lat, lon = all_nodes[nid]
                    graph_nodes[nid] = {"lat": lat, "lon": lon}

            # Découper le way aux intersections
            seg_start = 0
            for i in range(len(nids)):
                if nids[i] in intersections and i > seg_start:
                    self._add_segment(
                        graph_edges,
                        nids[seg_start:i + 1],
                        all_nodes, highway, speed, oneway,
                    )
                    seg_start = i

        print(f"  {len(graph_nodes)} nœuds graphe (intersections OSM)")
        print(f"  {len(graph_edges)} edges créés")

        # ── Étape 6 : construire le DiGraph NetworkX ──────────────────────────
        if status_cb:
            status_cb(
                f"Construction NetworkX ({len(graph_nodes)} nœuds, "
                f"{len(graph_edges)} edges)…"
            )

        self.graph = nx.DiGraph()

        for nid, attrs in graph_nodes.items():
            self.graph.add_node(
                str(nid),
                lat=attrs["lat"],
                lon=attrs["lon"],
                type="osm_intersection",
            )

        geom_count = 0
        for edge in graph_edges:
            self.graph.add_edge(
                str(edge["source"]),
                str(edge["target"]),
                distanceMeters=edge["distanceMeters"],
                avgSpeedKmh=edge["avgSpeedKmh"],
                roadType=edge["roadType"],
                waypoints=edge["waypoints"],
            )
            if edge["waypoints"]:
                geom_count += 1

        self.nodes = [{"id": str(nid), **attrs} for nid, attrs in graph_nodes.items()]
        self.edges = graph_edges

        print(f"\n✅ Graphe OSM final :")
        print(f"   {len(self.nodes)} intersections | {len(self.edges)} segments")
        print(f"   {geom_count} edges avec géométrie courbe")
        return self.graph

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _add_segment(
        edges: list,
        node_ids: list[int],
        all_nodes: dict,
        highway: str,
        speed: float,
        oneway: str,
    ) -> None:
        """
        Crée un ou deux edges à partir d'un segment de way.

        node_ids  : liste ordonnée des nœuds du segment (du nœud source
                    au nœud target, inclus).
        all_nodes : mapping node_id → (lat, lon).
        oneway    : valeur du tag OSM oneway.

        Les waypoints sont les nœuds intermédiaires (hors src et dst),
        utilisés pour dessiner la courbe exacte de la rue.
        """
        # Coordonnées de tous les nœuds du segment
        coords = [all_nodes[nid] for nid in node_ids if nid in all_nodes]
        if len(coords) < 2:
            return

        # Distance totale le long du segment (en mètres)
        dist = sum(
            _haversine(coords[k][0], coords[k][1],
                       coords[k + 1][0], coords[k + 1][1])
            for k in range(len(coords) - 1)
        )

        src = node_ids[0]
        dst = node_ids[-1]

        # Points intermédiaires uniquement (pas les extrémités)
        waypoints_fwd = [[lat, lon] for lat, lon in coords[1:-1]]
        waypoints_rev = list(reversed(waypoints_fwd))

        base = {
            "distanceMeters": dist,
            "avgSpeedKmh":    speed,
            "roadType":       highway,
        }

        if oneway == "-1":
            # Sens unique : circulation de dst → src uniquement
            edges.append({**base, "source": dst, "target": src,
                          "waypoints": waypoints_rev})
        elif oneway in ("yes", "1", "true"):
            # Sens unique : circulation de src → dst uniquement
            edges.append({**base, "source": src, "target": dst,
                          "waypoints": waypoints_fwd})
        else:
            # Double sens
            edges.append({**base, "source": src, "target": dst,
                          "waypoints": waypoints_fwd})
            edges.append({**base, "source": dst, "target": src,
                          "waypoints": waypoints_rev})

    # ── Sauvegarde ────────────────────────────────────────────────────────────

    def save_graph(self, filepath: str = "road_graph.pkl") -> int:
        geom_count = sum(1 for e in self.edges if e.get("waypoints"))
        print(f"\nSauvegarde → {filepath}")
        data = {
            "graph":     self.graph,
            "nodes":     self.nodes,
            "edges":     self.edges,
            "version":   "v9.0-overpass",
            "source":    "overpass",
            "geomEdges": geom_count,
            "createdAt": datetime.now().isoformat(),
        }
        with open(filepath, "wb") as f:
            pickle.dump(data, f)
        print("✅ Sauvegardé")
        return geom_count


# ── Point d'entrée standalone ─────────────────────────────────────────────────

if __name__ == "__main__":
    builder = GraphBuilder()
    graph   = builder.build_graph()
    if graph:
        builder.save_graph("road_graph.pkl")
        print("\n✅ Graph building complete")
    else:
        print("❌ Échec")
