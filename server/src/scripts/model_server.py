#!/usr/bin/env python3

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone, timedelta
from functools import lru_cache
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse
import signal
import threading
import time

# Get the root directory of the server
script_dir = os.path.dirname(os.path.abspath(__file__))
server_dir = os.path.dirname(os.path.dirname(script_dir))  # Go up two levels to server root

# GCC timezone (UTC+3)
GCC_TZ = timezone(timedelta(hours=3))

# Pre-compute day of week mapping for faster lookup
DAY_OF_WEEK = {
    0: "Monday",
    1: "Tuesday",
    2: "Wednesday",
    3: "Thursday",
    4: "Friday",
    5: "Saturday",
    6: "Sunday"
}

print("Loading models...", file=sys.stderr)
start_time = time.time()

# Load models with correct paths
distance_model = joblib.load(os.path.join(server_dir, "distance_model.pkl"))
eta_model = joblib.load(os.path.join(server_dir, "eta_model.pkl"))

print(f"Models loaded in {time.time() - start_time:.2f} seconds", file=sys.stderr)

# Create a cache for the prediction function
@lru_cache(maxsize=2048)
def _cached_predict(
    pickup_lat_rounded,
    pickup_lon_rounded,
    drop_lat_rounded,
    drop_lon_rounded,
    day_of_week,
    hour_of_day
):
    """
    Internal cached prediction function that works with hashable inputs
    """
    # Prepare input for distance model - use numpy arrays for faster processing
    distance_input = np.array([[
        pickup_lat_rounded,
        pickup_lon_rounded,
        drop_lat_rounded,
        drop_lon_rounded
    ]])

    # Estimate distance (meters)
    distance = distance_model.predict(distance_input)[0]

    # Prepare input for ETA model
    eta_input = pd.DataFrame({
        "pickup_lat": [pickup_lat_rounded],
        "pickup_lon": [pickup_lon_rounded],
        "drop_lat": [drop_lat_rounded],
        "drop_lon": [drop_lon_rounded],
        "day_of_week": [day_of_week],
        "hour_of_day": [hour_of_day],
        "distance": [distance]
    })

    # Predict ETA
    eta = eta_model.predict(eta_input)[0]
    
    return distance, eta

def predict_eta_distance(
    pickup_lat,
    pickup_lon,
    drop_lat,
    drop_lon,
    pickup_time_utc_str  # e.g. "2024-12-13T17:46:18+00:00"
):
    """
    Predict ETA and distance based on pickup and dropoff coordinates and time
    """
    # Parse and convert time
    pickup_time_utc = datetime.fromisoformat(pickup_time_utc_str)
    pickup_time_gcc = pickup_time_utc.astimezone(GCC_TZ)
    
    # Get day of week using faster lookup
    day_of_week = DAY_OF_WEEK[pickup_time_gcc.weekday()]
    hour_of_day = pickup_time_gcc.hour
    
    # Round coordinates to 5 decimal places for caching
    # This provides ~1.1m precision which is sufficient for most use cases
    pickup_lat_rounded = round(float(pickup_lat), 5)
    pickup_lon_rounded = round(float(pickup_lon), 5)
    drop_lat_rounded = round(float(drop_lat), 5)
    drop_lon_rounded = round(float(drop_lon), 5)
    
    # Get prediction from cached function
    distance, eta = _cached_predict(
        pickup_lat_rounded,
        pickup_lon_rounded,
        drop_lat_rounded,
        drop_lon_rounded,
        day_of_week,
        hour_of_day
    )

    # Format the response
    return {
        "distance_meters": round(float(distance), 2),
        "estimated_eta_minutes": round(float(eta), 2),
        "pickup_local_time": pickup_time_gcc.isoformat(),
        "day_of_week": day_of_week,
        "hour_of_day": hour_of_day
    }

class ModelServer(BaseHTTPRequestHandler):
    """
    HTTP server that serves model predictions
    """
    def _set_headers(self, status_code=200, content_type='application/json'):
        self.send_response(status_code)
        self.send_header('Content-type', content_type)
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests - for health checks"""
        if self.path == '/health':
            self._set_headers()
            self.wfile.write(json.dumps({'status': 'ok'}).encode())
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({'error': 'Not found'}).encode())
    
    def do_POST(self):
        """Handle POST requests for predictions"""
        if self.path == '/predict':
            # Get request body size
            content_length = int(self.headers['Content-Length'])
            
            # Read request body
            post_data = self.rfile.read(content_length)
            
            try:
                # Parse JSON data
                data = json.loads(post_data.decode('utf-8'))
                
                # Extract parameters
                pickup_lat = data.get('pickup_lat')
                pickup_lon = data.get('pickup_lon')
                drop_lat = data.get('drop_lat')
                drop_lon = data.get('drop_lon')
                pickup_time_utc = data.get('pickup_time_utc')
                
                # Validate parameters
                if None in (pickup_lat, pickup_lon, drop_lat, drop_lon, pickup_time_utc):
                    self._set_headers(400)
                    self.wfile.write(json.dumps({
                        'error': 'Missing required parameters'
                    }).encode())
                    return
                
                # Make prediction
                start_time = time.time()
                result = predict_eta_distance(
                    pickup_lat=pickup_lat,
                    pickup_lon=pickup_lon,
                    drop_lat=drop_lat,
                    drop_lon=drop_lon,
                    pickup_time_utc_str=pickup_time_utc
                )
                prediction_time = time.time() - start_time
                
                # Add timing information
                result['_meta'] = {
                    'prediction_time_ms': round(prediction_time * 1000, 2)
                }
                
                # Return result
                self._set_headers()
                self.wfile.write(json.dumps(result).encode())
                
            except json.JSONDecodeError:
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'error': 'Invalid JSON'
                }).encode())
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({
                    'error': str(e)
                }).encode())
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({'error': 'Not found'}).encode())

def run_server(host='0.0.0.0', port=8000):
    """Run the HTTP server"""
    server_address = (host, port)
    httpd = HTTPServer(server_address, ModelServer)
    print(f"Starting model server on {host}:{port}", file=sys.stderr)
    httpd.serve_forever()

if __name__ == "__main__":
    # Get host and port from command line arguments or use defaults
    host = sys.argv[1] if len(sys.argv) > 1 else '0.0.0.0'
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 8000
    
    # Handle graceful shutdown
    def signal_handler(sig, frame):
        print("Shutting down model server...", file=sys.stderr)
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Run the server
    run_server(host, port)
