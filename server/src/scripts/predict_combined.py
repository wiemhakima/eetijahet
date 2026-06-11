#!/usr/bin/env python3

import sys
import json
import os
from datetime import datetime

# Get the root directory of the server
script_dir = os.path.dirname(os.path.abspath(__file__))
server_dir = os.path.dirname(os.path.dirname(script_dir))  # Go up two levels to server root

# Add the server directory to the Python path
sys.path.append(server_dir)

# Import the combined model
from combinedModel import predict_eta_distance

# Check if we have the correct number of arguments
if len(sys.argv) != 6:
    print("Error: Incorrect number of arguments")
    print("Usage: python predict_combined.py pickup_lat pickup_lon drop_lat drop_lon pickup_time_utc")
    sys.exit(1)

try:
    # Parse arguments
    pickup_lat = float(sys.argv[1])
    pickup_lon = float(sys.argv[2])
    drop_lat = float(sys.argv[3])
    drop_lon = float(sys.argv[4])
    pickup_time_utc = sys.argv[5]  # ISO 8601 format string
    
    # Call the prediction function
    result = predict_eta_distance(
        pickup_lat=pickup_lat,
        pickup_lon=pickup_lon,
        drop_lat=drop_lat,
        drop_lon=drop_lon,
        pickup_time_utc_str=pickup_time_utc
    )
    
    # Print the result as JSON
    print(json.dumps(result))
    
except Exception as e:
    print(f"Error during prediction: {str(e)}", file=sys.stderr)
    sys.exit(1)
