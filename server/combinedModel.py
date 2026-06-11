import joblib
import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timezone, timedelta
from functools import lru_cache

# GCC timezone (UTC+3)
GCC_TZ = timezone(timedelta(hours=3))

# Get the directory of the current script
current_dir = os.path.dirname(os.path.abspath(__file__))

# Load models with correct paths
distance_model = joblib.load(os.path.join(current_dir, "distance_model.pkl"))
eta_model = joblib.load(os.path.join(current_dir, "eta_model.pkl"))

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

# Create a cache for the prediction function
# This will store up to 1024 most recent predictions
@lru_cache(maxsize=1024)

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

# Example usage
if __name__ == "__main__":
    result = predict_eta_distance(
        pickup_lat=29.20019115719432,
        pickup_lon=48.046559766864746,
        drop_lat=29.3220333,
        drop_lon=48.0387141,
        pickup_time_utc_str="2025-05-13T21:16:42.876+00:00"
    )

    print("🚀 Prediction Result:")
    print(json.dumps(result, indent=2))
