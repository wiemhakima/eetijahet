import networkx as nx
import numpy as np
from scipy.spatial import cKDTree
import heapq
import pickle
import sys
import os
import json

# Import the combined model (optional)
try:
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from combinedModel import predict_eta_distance
    USE_ML_MODEL = True
except Exception as e:
    print(f"Warning: Could not load ML model ({e}). Using simple time calculation.")
    USE_ML_MODEL = False


class RouteOptimizer:
    """
    Optimizes delivery routes using A* algorithm with ML-predicted weights
    """

    def __init__(self, graph_path="road_graph.pkl"):
        print(f"Loading graph from {graph_path}...")
        with open(graph_path, 'rb') as f:
            data = pickle.load(f)
            self.graph = data["graph"]
            self.nodes = data["nodes"]
            self.edges = data["edges"]

        # Build KD-tree for fast nearest neighbor search
        self.node_coords = np.array([[n["lat"], n["lon"]] for n in self.nodes])
        self.node_ids = [n["id"] for n in self.nodes]
        self.kdtree = cKDTree(self.node_coords)
        print(f"Graph loaded: {len(self.nodes)} nodes, {len(self.edges)} edges")

    def find_nearest_node(self, lat, lon):
        distance, index = self.kdtree.query([lat, lon])
        return self.node_ids[index]

    def predict_edge_weight(self, source_node, target_node, pickup_time_utc):
        source_data = next(n for n in self.nodes if n["id"] == source_node)
        target_data = next(n for n in self.nodes if n["id"] == target_node)

        if USE_ML_MODEL:
            try:
                # Pass a dictionary compatible with the new ML model
                order = {
                    "pickupLocation": {"latitude": source_data["lat"], "longitude": source_data["lon"]},
                    "destination": {"location": {"latitude": target_data["lat"], "longitude": target_data["lon"]}},
                    "pickup_time_utc_str": pickup_time_utc
                }
                result = predict_eta_distance(order)
                return result["estimated_eta_minutes"]
            except Exception as e:
                print(f"Warning: ML prediction failed ({e}). Using fallback calculation.")

        # Fallback: Use edge data from graph
        try:
            edge_data = self.graph[source_node][target_node]
            distance_meters = edge_data.get("distanceMeters", 0)
            avg_speed_kmh = edge_data.get("avgSpeedKmh", 40)
            distance_km = distance_meters / 1000
            time_hours = distance_km / avg_speed_kmh
            return time_hours * 60
        except:
            distance_km = self.haversine_distance(
                source_data["lat"], source_data["lon"],
                target_data["lat"], target_data["lon"]
            )
            return (distance_km / 40) * 60

    def haversine_distance(self, lat1, lon1, lat2, lon2):
        R = 6371
        lat1_rad = np.radians(lat1)
        lat2_rad = np.radians(lat2)
        delta_lat = np.radians(lat2 - lat1)
        delta_lon = np.radians(lon2 - lon1)
        a = np.sin(delta_lat/2)**2 + np.cos(lat1_rad)*np.cos(lat2_rad)*np.sin(delta_lon/2)**2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
        return R * c

    def heuristic(self, node_id, goal_node_id):
        node_data = next(n for n in self.nodes if n["id"] == node_id)
        goal_data = next(n for n in self.nodes if n["id"] == goal_node_id)
        distance_km = self.haversine_distance(
            node_data["lat"], node_data["lon"],
            goal_data["lat"], goal_data["lon"]
        )
        return (distance_km / 40) * 60

    def astar_route(self, start_node, goal_node, pickup_time_utc):
        open_set = [(0, start_node)]
        came_from = {}
        g_score = {start_node: 0}
        f_score = {start_node: self.heuristic(start_node, goal_node)}

        while open_set:
            current_f, current = heapq.heappop(open_set)
            if current == goal_node:
                path = [current]
                while current in came_from:
                    current = came_from[current]
                    path.append(current)
                path.reverse()
                return path, g_score[goal_node]

            for neighbor in self.graph.neighbors(current):
                edge_weight = self.predict_edge_weight(current, neighbor, pickup_time_utc)
                tentative_g = g_score[current] + edge_weight
                if neighbor not in g_score or tentative_g < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    f_score[neighbor] = tentative_g + self.heuristic(neighbor, goal_node)
                    heapq.heappush(open_set, (f_score[neighbor], neighbor))

        return None, None

    def calculate_route(self, pickup_coords, dropoff_coords, pickup_time_utc):
        start_node = self.find_nearest_node(*pickup_coords)
        goal_node = self.find_nearest_node(*dropoff_coords)
        print(f"Start node: {start_node}, Goal node: {goal_node}")

        path, total_time = self.astar_route(start_node, goal_node, pickup_time_utc)
        if not path:
            return {"success": False, "error": "No route found"}

        coordinates = []
        segments = []
        total_distance = 0
        for i in range(len(path)):
            node_data = next(n for n in self.nodes if n["id"] == path[i])
            coordinates.append([node_data["lat"], node_data["lon"]])
            if i < len(path) - 1:
                edge_data = self.graph[path[i]][path[i+1]]
                segment = {
                    "start": [node_data["lat"], node_data["lon"]],
                    "end": coordinates[i+1],
                    "distance_meters": edge_data.get("distanceMeters", 0),
                    "predicted_time_minutes": self.predict_edge_weight(path[i], path[i+1], pickup_time_utc),
                    "road_type": edge_data.get("roadType", "unknown")
                }
                segments.append(segment)
                total_distance += segment["distance_meters"]

        return {
            "success": True,
            "route": {
                "coordinates": coordinates,
                "segments": segments,
                "summary": {
                    "total_distance_meters": total_distance,
                    "total_time_minutes": total_time,
                    "number_of_segments": len(segments)
                }
            },
            "timestamp": pickup_time_utc
        }


if __name__ == "__main__":
    if len(sys.argv) == 6:
        pickup_lat = float(sys.argv[1])
        pickup_lon = float(sys.argv[2])
        drop_lat = float(sys.argv[3])
        drop_lon = float(sys.argv[4])
        pickup_time = sys.argv[5]

        optimizer = RouteOptimizer("road_graph.pkl")
        result = optimizer.calculate_route(
            (pickup_lat, pickup_lon),
            (drop_lat, drop_lon),
            pickup_time
        )
        print(json.dumps(result))
    else:
        print("Test mode - calculating sample route...")
        optimizer = RouteOptimizer("road_graph.pkl")
        pickup = (29.3759, 47.9774)
        dropoff = (29.2919, 47.9774)
        pickup_time = "2024-12-13T17:46:18+00:00"
        result = optimizer.calculate_route(pickup, dropoff, pickup_time)
        if result["success"]:
            print("\n✅ Route calculated successfully!")
            print(f"Total distance: {result['route']['summary']['total_distance_meters']}m")
            print(f"Total time: {result['route']['summary']['total_time_minutes']:.2f} minutes")
            print(f"Number of segments: {result['route']['summary']['number_of_segments']}")
        else:
            print(f"\n❌ Route calculation failed: {result.get('error')}")