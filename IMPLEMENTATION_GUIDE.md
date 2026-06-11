# 🛠️ Implementation Guide - AI Routing System Development

## Document Information
- **Project**: Ettijahat AI Routing Engine
- **Version**: 1.0
- **Date**: March 12, 2026
- **Purpose**: Step-by-step guide to implement the missing routing components

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Phase 1: Graph Builder Implementation](#2-phase-1-graph-builder-implementation)
3. [Phase 2: Route Optimizer Implementation](#3-phase-2-route-optimizer-implementation)
4. [Phase 3: API Integration](#4-phase-3-api-integration)
5. [Phase 4: Frontend Integration](#5-phase-4-frontend-integration)
6. [Phase 5: Testing & Deployment](#6-phase-5-testing--deployment)
7. [Code Examples](#7-code-examples)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

### 1.1 Required Dependencies

**Python Dependencies** (Add to `Core/requirements.txt`):
```txt
# Existing dependencies
pymongo==4.6.0
pandas==2.0.3
numpy==1.24.3
xgboost==1.7.6
joblib==1.3.2

# New dependencies for routing
networkx==3.1
scipy==1.11.3
scikit-learn==1.3.1
flask==3.0.0
flask-cors==4.0.0
```

**Node.js Dependencies** (Add to `server/package.json`):
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "axios": "^1.5.0",
    "node-cache": "^5.1.2",
    "redis": "^4.6.10"
  }
}
```

### 1.2 Install Dependencies

```bash
# Python dependencies
cd Core
pip install -r requirements.txt

# Node.js dependencies
cd ../server
npm install
```

---

## 2. Phase 1: Graph Builder Implementation

### 2.1 Create Graph Builder Module

**File**: `Core/graph_builder.py`

```python
import networkx as nx
import numpy as np
import pandas as pd
from pymongo import MongoClient
from scipy.spatial import cKDTree
from sklearn.cluster import DBSCAN
import json
import pickle
from datetime import datetime

class GraphBuilder:
    """
    Builds a road network graph from historical delivery GPS traces
    """
    
    def __init__(self, mongodb_uri, db_name="heroku_v801wdr2"):
        """
        Initialize the graph builder
        
        Args:
            mongodb_uri: MongoDB connection string
            db_name: Database name
        """
        self.client = MongoClient(mongodb_uri)
        self.db = self.client[db_name]
        self.orders_collection = self.db["orders"]
        self.graph = nx.DiGraph()  # Directed graph for one-way streets
        self.nodes = []
        self.edges = []
        
    def load_historical_traces(self, limit=10000):
        """
        Load GPS traces from MongoDB orders
        
        Args:
            limit: Maximum number of orders to load
            
        Returns:
            List of traces with coordinates and metadata
        """
        print(f"Loading {limit} historical orders...")
        
        cursor = self.orders_collection.find({
            "pickupLocation": {"$exists": True},
            "destination.address.location": {"$exists": True},
            "gpsTrace": {"$exists": True, "$ne": []}
        }).limit(limit)
        
        traces = []
        for doc in cursor:
            pickup = doc.get("pickupLocation", {})
            destination = doc.get("destination", {}).get("address", {}).get("location", {})
            gps_trace = doc.get("gpsTrace", [])
            
            if gps_trace and len(gps_trace) > 1:
                trace = {
                    "order_id": str(doc["_id"]),
                    "pickup": {
                        "lat": pickup.get("latitude"),
                        "lon": pickup.get("longitude")
                    },
                    "dropoff": {
                        "lat": destination.get("latitude"),
                        "lon": destination.get("longitude")
                    },
                    "gps_points": [
                        {
                            "lat": point.get("lat"),
                            "lon": point.get("lon"),
                            "timestamp": point.get("timestamp"),
                            "speed": point.get("speed", 0)
                        }
                        for point in gps_trace
                    ]
                }
                traces.append(trace)
        
        print(f"Loaded {len(traces)} traces with GPS data")
        return traces
    
    def extract_road_segments(self, traces, cluster_distance=0.0001):
        """
        Extract road segments from GPS traces using clustering
        
        Args:
            traces: List of GPS traces
            cluster_distance: Distance threshold for clustering (in degrees, ~11m)
            
        Returns:
            nodes: List of clustered nodes
            edges: List of edges between nodes
        """
        print("Extracting road segments from GPS traces...")
        
        # Collect all GPS points
        all_points = []
        point_metadata = []
        
        for trace in traces:
            for i, point in enumerate(trace["gps_points"]):
                if point["lat"] and point["lon"]:
                    all_points.append([point["lat"], point["lon"]])
                    point_metadata.append({
                        "order_id": trace["order_id"],
                        "index": i,
                        "speed": point.get("speed", 0)
                    })
        
        if len(all_points) < 2:
            print("Not enough GPS points to build graph")
            return [], []
        
        # Convert to numpy array
        points_array = np.array(all_points)
        
        # Cluster nearby points using DBSCAN
        print(f"Clustering {len(all_points)} GPS points...")
        clustering = DBSCAN(eps=cluster_distance, min_samples=2, metric='euclidean')
        labels = clustering.fit_predict(points_array)
        
        # Create nodes from clusters
        unique_labels = set(labels)
        unique_labels.discard(-1)  # Remove noise points
        
        nodes = []
        label_to_node_id = {}
        
        for label in unique_labels:
            cluster_points = points_array[labels == label]
            centroid = cluster_points.mean(axis=0)
            
            node_id = f"n_{len(nodes)}"
            node = {
                "id": node_id,
                "lat": float(centroid[0]),
                "lon": float(centroid[1]),
                "type": "intersection",
                "visitCount": len(cluster_points)
            }
            nodes.append(node)
            label_to_node_id[label] = node_id
        
        print(f"Created {len(nodes)} nodes from clustering")
        
        # Create edges from sequential GPS points
        edges = []
        edge_counts = {}
        
        for trace in traces:
            gps_points = trace["gps_points"]
            
            for i in range(len(gps_points) - 1):
                p1 = [gps_points[i]["lat"], gps_points[i]["lon"]]
                p2 = [gps_points[i + 1]["lat"], gps_points[i + 1]["lon"]]
                
                if not (p1[0] and p1[1] and p2[0] and p2[1]):
                    continue
                
                # Find nearest nodes
                node1_id = self._find_nearest_node(p1, nodes)
                node2_id = self._find_nearest_node(p2, nodes)
                
                if node1_id and node2_id and node1_id != node2_id:
                    edge_key = (node1_id, node2_id)
                    
                    if edge_key not in edge_counts:
                        # Calculate distance
                        distance = self._haversine_distance(
                            p1[0], p1[1], p2[0], p2[1]
                        )
                        
                        edge_counts[edge_key] = {
                            "source": node1_id,
                            "target": node2_id,
                            "distanceMeters": distance,
                            "travelCount": 1,
                            "speeds": [gps_points[i].get("speed", 0)]
                        }
                    else:
                        edge_counts[edge_key]["travelCount"] += 1
                        edge_counts[edge_key]["speeds"].append(
                            gps_points[i].get("speed", 0)
                        )
        
        # Convert edge counts to edge list
        for edge_data in edge_counts.values():
            avg_speed = np.mean([s for s in edge_data["speeds"] if s > 0]) if edge_data["speeds"] else 30
            
            edge = {
                "source": edge_data["source"],
                "target": edge_data["target"],
                "distanceMeters": edge_data["distanceMeters"],
                "avgSpeedKmh": float(avg_speed),
                "travelCount": edge_data["travelCount"],
                "roadType": self._classify_road_type(avg_speed)
            }
            edges.append(edge)
        
        print(f"Created {len(edges)} edges")
        
        return nodes, edges
    
    def _find_nearest_node(self, point, nodes, max_distance=0.001):
        """
        Find the nearest node to a given point
        
        Args:
            point: [lat, lon]
            nodes: List of nodes
            max_distance: Maximum distance threshold
            
        Returns:
            node_id or None
        """
        min_dist = float('inf')
        nearest_node = None
        
        for node in nodes:
            dist = np.sqrt(
                (point[0] - node["lat"])**2 + 
                (point[1] - node["lon"])**2
            )
            
            if dist < min_dist and dist < max_distance:
                min_dist = dist
                nearest_node = node["id"]
        
        return nearest_node
    
    def _haversine_distance(self, lat1, lon1, lat2, lon2):
        """
        Calculate haversine distance between two points
        
        Returns:
            Distance in meters
        """
        R = 6371000  # Earth radius in meters
        
        lat1_rad = np.radians(lat1)
        lat2_rad = np.radians(lat2)
        delta_lat = np.radians(lat2 - lat1)
        delta_lon = np.radians(lon2 - lon1)
        
        a = np.sin(delta_lat/2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(delta_lon/2)**2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
        
        return R * c
    
    def _classify_road_type(self, avg_speed):
        """
        Classify road type based on average speed
        """
        if avg_speed > 60:
            return "highway"
        elif avg_speed > 40:
            return "primary"
        elif avg_speed > 25:
            return "secondary"
        else:
            return "residential"
    
    def build_graph(self, limit=10000):
        """
        Main method to build the complete graph
        
        Args:
            limit: Number of orders to process
            
        Returns:
            NetworkX graph object
        """
        print("=" * 60)
        print("BUILDING ROAD GRAPH")
        print("=" * 60)
        
        # Step 1: Load traces
        traces = self.load_historical_traces(limit)
        
        if not traces:
            print("No traces found. Cannot build graph.")
            return None
        
        # Step 2: Extract segments
        nodes, edges = self.extract_road_segments(traces)
        
        if not nodes or not edges:
            print("Failed to extract road segments")
            return None
        
        # Step 3: Build NetworkX graph
        print("Building NetworkX graph...")
        for node in nodes:
            self.graph.add_node(
                node["id"],
                lat=node["lat"],
                lon=node["lon"],
                type=node["type"],
                visitCount=node["visitCount"]
            )
        
        for edge in edges:
            self.graph.add_edge(
                edge["source"],
                edge["target"],
                distanceMeters=edge["distanceMeters"],
                avgSpeedKmh=edge["avgSpeedKmh"],
                travelCount=edge["travelCount"],
                roadType=edge["roadType"]
            )
        
        self.nodes = nodes
        self.edges = edges
        
        # Calculate statistics
        stats = {
            "nodeCount": len(nodes),
            "edgeCount": len(edges),
            "avgDegree": 2 * len(edges) / len(nodes) if nodes else 0,
            "dataSourceCount": len(traces)
        }
        
        print("\n" + "=" * 60)
        print("GRAPH STATISTICS")
        print("=" * 60)
        print(f"Nodes: {stats['nodeCount']}")
        print(f"Edges: {stats['edgeCount']}")
        print(f"Average Degree: {stats['avgDegree']:.2f}")
        print(f"Data Sources: {stats['dataSourceCount']}")
        print("=" * 60)
        
        return self.graph
    
    def save_graph(self, filepath="road_graph.pkl", format="pickle"):
        """
        Save graph to disk
        
        Args:
            filepath: Path to save file
            format: 'pickle' or 'json'
        """
        print(f"Saving graph to {filepath}...")
        
        if format == "pickle":
            with open(filepath, 'wb') as f:
                pickle.dump({
                    "graph": self.graph,
                    "nodes": self.nodes,
                    "edges": self.edges,
                    "version": "v1.0",
                    "createdAt": datetime.now().isoformat(),
                    "region": "kuwait"
                }, f)
        elif format == "json":
            graph_data = {
                "version": "v1.0",
                "createdAt": datetime.now().isoformat(),
                "region": "kuwait",
                "nodes": self.nodes,
                "edges": self.edges,
                "statistics": {
                    "nodeCount": len(self.nodes),
                    "edgeCount": len(self.edges),
                    "avgDegree": 2 * len(self.edges) / len(self.nodes) if self.nodes else 0
                }
            }
            
            with open(filepath, 'w') as f:
                json.dump(graph_data, f, indent=2)
        
        print(f"Graph saved successfully to {filepath}")
    
    def load_graph(self, filepath="road_graph.pkl"):
        """
        Load pre-built graph from disk
        
        Args:
            filepath: Path to graph file
        """
        print(f"Loading graph from {filepath}...")
        
        with open(filepath, 'rb') as f:
            data = pickle.load(f)
            self.graph = data["graph"]
            self.nodes = data["nodes"]
            self.edges = data["edges"]
        
        print(f"Graph loaded: {len(self.nodes)} nodes, {len(self.edges)} edges")
        return self.graph


# Example usage
if __name__ == "__main__":
    # MongoDB connection
    MONGODB_URI = "mongodb+srv://ettijahat-interns:pQrbiubxL0acOiCP@production.g8vjv.mongodb.net/"
    
    # Create graph builder
    builder = GraphBuilder(MONGODB_URI)
    
    # Build graph from 1000 orders
    graph = builder.build_graph(limit=1000)
    
    # Save graph
    if graph:
        builder.save_graph("Core/road_graph.pkl", format="pickle")
        builder.save_graph("Core/road_graph.json", format="json")
        print("\n✅ Graph building complete!")
```

### 2.2 Run Graph Builder

```bash
cd Core
python graph_builder.py
```

**Expected Output**:
```
============================================================
BUILDING ROAD GRAPH
============================================================
Loading 1000 historical orders...
Loaded 856 traces with GPS data
Extracting road segments from GPS traces...
Clustering 12,450 GPS points...
Created 3,421 nodes from clustering
Created 8,765 edges

============================================================
GRAPH STATISTICS
============================================================
Nodes: 3421
Edges: 8765
Average Degree: 5.12
Data Sources: 856
============================================================
Saving graph to Core/road_graph.pkl...
Graph saved successfully to Core/road_graph.pkl
Saving graph to Core/road_graph.json...
Graph saved successfully to Core/road_graph.json

✅ Graph building complete!
```

---

## 3. Phase 2: Route Optimizer Implementation

### 3.1 Create Route Optimizer Module

**File**: `Core/route_optimizer.py`

```python
import networkx as nx
import numpy as np
from scipy.spatial import cKDTree
import heapq
import pickle
import sys
import os

# Import the combined model
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from combinedModel import predict_eta_distance

class RouteOptimizer:
    """
    Optimizes delivery routes using A* algorithm with ML-predicted weights
    """
    
    def __init__(self, graph_path="road_graph.pkl"):
        """
        Initialize the route optimizer
        
        Args:
            graph_path: Path to the pre-built graph file
        """
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
        """
        Find the nearest graph node to given coordinates using KD-tree
        
        Args:
            lat: Latitude
            lon: Longitude
            
        Returns:
            node_id: ID of nearest node
        """
        distance, index = self.kdtree.query([lat, lon])
        return self.node_ids[index]
    
    def predict_edge_weight(self, source_node, target_node, pickup_time_utc):
        """
        Predict travel time for an edge using the ML model
        
        Args:
            source_node: Source node ID
            target_node: Target node ID
            pickup_time_utc: Pickup time in UTC (ISO 8601 format)
            
        Returns:
            predicted_time_minutes: Predicted travel time in minutes
        """
        # Get node coordinates
        source_data = next(n for n in self.nodes if n["id"] == source_node)
        target_data = next(n for n in self.nodes if n["id"] == target_node)
        
        # Call combined model
        result = predict_eta_distance(
            pickup_lat=source_data["lat"],
            pickup_lon=source_data["lon"],
            drop_lat=target_data["lat"],
            drop_lon=target_data["lon"],
            pickup_time_utc_str=pickup_time_utc
        )
        
        return result["estimated_eta_minutes"]
    
    def haversine_distance(self, lat1, lon1, lat2, lon2):
        """
        Calculate haversine distance (heuristic for A*)
        
        Returns:
            Distance in kilometers
        """
        R = 6371  # Earth radius in km
        
        lat1_rad = np.radians(lat1)
        lat2_rad = np.radians(lat2)
        delta_lat = np.radians(lat2 - lat1)
        delta_lon = np.radians(lon2 - lon1)
        
        a = np.sin(delta_lat/2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(delta_lon/2)**2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
        
        return R * c
    
    def heuristic(self, node_id, goal_node_id):
        """
        Heuristic function for A* (estimated time to goal)
        
        Args:
            node_id: Current node ID
            goal_node_id: Goal node ID
            
        Returns:
            Estimated time in minutes
        """
        node_data = next(n for n in self.nodes if n["id"] == node_id)
        goal_data = next(n for n in self.nodes if n["id"] == goal_node_id)
        
        distance_km = self.haversine_distance(
            node_data["lat"], node_data["lon"],
            goal_data["lat"], goal_data["lon"]
        )
        
        # Assume average speed of 40 km/h
        avg_speed_kmh = 40
        estimated_time_hours = distance_km / avg_speed_kmh
        estimated_time_minutes = estimated_time_hours * 60
        
        return estimated_time_minutes
    
    def astar_route(self, start_node, goal_node, pickup_time_utc):
        """
        A* pathfinding algorithm with ML-predicted edge weights
        
        Args:
            start_node: Starting node ID
            goal_node: Goal node ID
            pickup_time_utc: Pickup time in UTC
            
        Returns:
            path: List of node IDs
            total_cost: Total predicted travel time
        """
        # Priority queue: (f_score, node_id)
        open_set = [(0, start_node)]
        
        # Track best path to each node
        came_from = {}
        
        # Cost from start to node
        g_score = {start_node: 0}
        
        # Estimated total cost (g + h)
        f_score = {start_node: self.heuristic(start_node, goal_node)}
        
        while open_set:
            current_f, current = heapq.heappop(open_set)
            
            if current == goal_node:
                # Reconstruct path
                path = [current]
                while current in came_from:
                    current = came_from[current]
                    path.append(current)
                path.reverse()
                
                return path, g_score[goal_node]
            
            # Explore neighbors
            for neighbor in self.graph.neighbors(current):
                # Get predicted travel time for this edge
                edge_weight = self.predict_edge_weight(current, neighbor, pickup_time_utc)
                
                tentative_g = g_score[current] + edge_weight
                
                if neighbor not in g_score or tentative_g < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    f_score[neighbor] = tentative_g + self.heuristic(neighbor, goal_node)
                    heapq.heappush(open_set, (f_score[neighbor], neighbor))
        
        # No path found
        return None, None
    
    def calculate_route(self, pickup_coords, dropoff_coords, pickup_time_utc):
        """
        Calculate optimal route using A* algorithm
        
        Args:
            pickup_coords: (lat, lon) tuple
            dropoff_coords: (lat, lon) tuple
            pickup_time_utc: Pickup time in UTC (ISO 8601 format)
            
        Returns:
            Dictionary with route details
        """
        print(f"Calculating route from {pickup_coords} to {dropoff_coords}")
        
        # Find nearest nodes
        start_node = self.find_nearest_node(pickup_coords[0], pickup_coords[1])
        goal_node = self.find_nearest_node(dropoff_coords[0], dropoff_coords[1])
        
        print(f"Start node: {start_node}, Goal node: {goal_node}")
        
        # Run A* algorithm
        path, total_time = self.astar_route(start_node, goal_node, pickup_time_utc)
        
        if not path:
            return {
                "success": False,
                "error": "No route found"
            }
        
        # Convert path to coordinates
        coordinates = []
        segments = []
        total_distance = 0
        
        for i in range(len(path)):
            node_data = next(n for n in self.nodes if n["id"] == path[i])
            coordinates.append([node_data["lat"], node_data["lon"]])
            
            if i < len(path) - 1:
                # Get edge data
                edge_data = self.graph[path[i]][path[i+1]]
                
                segment = {
                    "start": [node_data["lat"], node_data["lon"]],
                    "end": coordinates[i+1] if i+1 < len(coordinates) else coordinates[i],
                    "distance_meters": edge_data.get("distanceMeters", 0),
                    "predicted_time_minutes": self.predict_edge_weight(
                        path[i], path[i+1], pickup_time_utc
                    ),
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


# Example usage
if __name__ == "__main__":
    # Initialize optimizer
    optimizer = RouteOptimizer("road_graph.pkl")
    
    # Test route
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
```

### 3.2 Test Route Optimizer

```bash
cd Core
python route_optimizer.py
```

---

## 4. Phase 3: API Integration

### 4.1 Create Routing Service

**File**: `server/src/services/routingService.js`

```javascript
/**
 * Routing Service
 * Handles route optimization requests
 */
const { execFile } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');
const NodeCache = require('node-cache');

// Create cache with 10 minute TTL
const routeCache = new NodeCache({ stdTTL: 600, checkperiod: 60 });

/**
 * Optimize route using Python ML service
 */
const optimizeRoute = async (data) => {
  try {
    const { pickup, dropoff, pickup_time_utc } = data;
    
    // Validate input
    if (!pickup || !dropoff || !pickup_time_utc) {
      throw new Error('Missing required parameters');
    }
    
    // Check cache
    const cacheKey = `${pickup.lat}_${pickup.lon}_${dropoff.lat}_${dropoff.lon}_${pickup_time_utc}`;
    const cachedResult = routeCache.get(cacheKey);
    
    if (cachedResult) {
      logger.debug('Returning cached route');
      return cachedResult;
    }
    
    // Call Python script
    const scriptPath = path.join(__dirname, '../../Core/route_optimizer.py');
    
    const result = await new Promise((resolve, reject) => {
      execFile(
        'python',
        [
          scriptPath,
          pickup.lat.toString(),
          pickup.lon.toString(),
          dropoff.lat.toString(),
          dropoff.lon.toString(),
          pickup_time_utc
        ],
        { timeout: 30000 },
        (err, stdout, stderr) => {
          if (err) {
            logger.error('Route optimization error:', err);
            return reject(err);
          }
          
          if (stderr) {
            logger.warn('Python stderr:', stderr);
          }
          
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseErr) {
            reject(new Error('Failed to parse route result'));
          }
        }
      );
    });
    
    // Cache result
    routeCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    logger.error('Routing service error:', error);
    throw error;
  }
};

module.exports = {
  optimizeRoute
};
```

### 4.2 Create Routing Controller

**File**: `server/src/api/controllers/routingController.js`

```javascript
/**
 * Routing Controller
 */
const routingService = require('../../services/routingService');
const logger = require('../../utils/logger');

/**
 * @desc    Optimize single route
 * @route   POST /api/v1/routing/optimize
 * @access  Private (API Key required)
 */
const optimizeRoute = async (req, res, next) => {
  try {
    logger.info('Route optimization request received');
    
    const result = await routingService.optimizeRoute(req.body);
    
    logger.info('Route optimization successful');
    res.status(200).json(result);
  } catch (error) {
    logger.error('Route optimization controller error:', error.message);
    next(error);
  }
};

module.exports = {
  optimizeRoute
};
```

### 4.3 Create Routing Routes

**File**: `server/src/api/routes/routingRoutes.js`

```javascript
/**
 * Routing Routes
 */
const express = require('express');
const { optimizeRoute } = require('../controllers/routingController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/v1/routing/optimize
 * @desc    Optimize delivery route
 * @access  Private
 */
router.post('/optimize', authenticate, optimizeRoute);

module.exports = router;
```

### 4.4 Register Routes

**File**: `server/src/api/routes/index.js` (Add this line)

```javascript
const routingRoutes = require('./routingRoutes');

// ... existing routes ...

router.use('/routing', routingRoutes);
```

---

## 5. Phase 4: Frontend Integration

### 5.1 Create Routing Service

**File**: `frontend/src/services/routingService.ts`

```typescript
import { publicApi } from '../api';

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface RouteSegment {
  start: [number, number];
  end: [number, number];
  distance_meters: number;
  predicted_time_minutes: number;
  road_type: string;
}

export interface OptimizedRoute {
  success: boolean;
  route: {
    coordinates: [number, number][];
    segments: RouteSegment[];
    summary: {
      total_distance_meters: number;
      total_time_minutes: number;
      number_of_segments: number;
    };
  };
  timestamp: string;
}

export const routingService = {
  async optimizeRoute(
    pickup: Coordinates,
    dropoff: Coordinates,
    pickupTime: string
  ): Promise<OptimizedRoute> {
    const response = await publicApi.post('/routing/optimize', {
      pickup,
      dropoff,
      pickup_time_utc: pickupTime
    });
    
    return response.data;
  }
};
```

### 5.2 Update Routing Engine Component

**File**: `frontend/src/pages/RoutingEngine/RoutingEngine.tsx` (Add this)

```typescript
import { routingService } from '../../services/routingService';

// Inside RoutingEngine component, add this function:
const calculateOptimizedRoute = async () => {
  if (!fromCoords || !toCoords) return;
  
  setIsCalculatingRoute(true);
  try {
    const pickupTime = new Date().toISOString();
    
    const result = await routingService.optimizeRoute(
      { lat: fromCoords.lat, lon: fromCoords.lng },
      { lat: toCoords.lat, lon: toCoords.lng },
      pickupTime
    );
    
    if (result.success) {
      setRoute({
        coordinates: result.route.coordinates,
        distance: result.route.summary.total_distance_meters,
        duration: result.route.summary.total_time_minutes * 60 // Convert to seconds
      });
    }
  } catch (error) {
    console.error('Error calculating optimized route:', error);
  } finally {
    setIsCalculatingRoute(false);
  }
};
```

---

## 6. Phase 5: Testing & Deployment

### 6.1 Unit Tests

**File**: `Core/test_graph_builder.py`

```python
import unittest
from graph_builder import GraphBuilder

class TestGraphBuilder(unittest.TestCase):
    def setUp(self):
        self.builder = GraphBuilder("mongodb://localhost:27017", "test_db")
    
    def test_haversine_distance(self):
        # Test distance calculation
        dist = self.builder._haversine_distance(29.3759, 47.9774, 29.2919, 47.9774)
        self.assertGreater(dist, 0)
        self.assertLess(dist, 100000)  # Less than 100km
    
    def test_classify_road_type(self):
        self.assertEqual(self.builder._classify_road_type(70), "highway")
        self.assertEqual(self.builder._classify_road_type(45), "primary")
        self.assertEqual(self.builder._classify_road_type(30), "secondary")
        self.assertEqual(self.builder._classify_road_type(20), "residential")

if __name__ == '__main__':
    unittest.main()
```

### 6.2 Integration Tests

```bash
# Test API endpoint
curl -X POST http://localhost:3000/api/v1/routing/optimize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "pickup": {"lat": 29.3759, "lon": 47.9774},
    "dropoff": {"lat": 29.2919, "lon": 47.9774},
    "pickup_time_utc": "2024-12-13T17:46:18+00:00"
  }'
```

### 6.3 Deployment Checklist

- [ ] Build and test graph with production data
- [ ] Deploy Python ML service
- [ ] Update Node.js API server
- [ ] Deploy frontend changes
- [ ] Configure monitoring
- [ ] Set up logging
- [ ] Run load tests
- [ ] Monitor initial performance

---

## 7. Code Examples

### 7.1 Complete API Request Example

```javascript
// Node.js example
const axios = require('axios');

async function testRouting() {
  try {
    const response = await axios.post(
      'http://localhost:3000/api/v1/routing/optimize',
      {
        pickup: { lat: 29.3759, lon: 47.9774 },
        dropoff: { lat: 29.2919, lon: 47.9774 },
        pickup_time_utc: new Date().toISOString()
      },
      {
        headers: {
          'Authorization': 'Bearer YOUR_API_KEY',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Route:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRouting();
```

---

## 8. Troubleshooting

### Common Issues

**Issue 1: Graph building fails with "No traces found"**
- **Solution**: Ensure MongoDB has orders with GPS traces
- Check: `db.orders.find({"gpsTrace": {$exists: true}}).count()`

**Issue 2: Route optimization is slow**
- **Solution**: Reduce graph size or implement caching
- Check: Graph statistics (number of nodes/edges)

**Issue 3: Python script not found**
- **Solution**: Verify Python path in Node.js service
- Check: `which python` or `where python`

**Issue 4: Memory issues with large graphs**
- **Solution**: Implement graph partitioning or use smaller regions
- Check: System memory usage

---

**End of Implementation Guide**
