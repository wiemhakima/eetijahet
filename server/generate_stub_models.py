"""
Script to generate stub ML models for development.
The real models should be obtained from the team or retrained on actual data.
These stubs reproduce the correct input/output interface using synthetic data.
"""
import numpy as np
import pandas as pd
import joblib
import os
import math

from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
RNG = np.random.default_rng(42)

# Kuwait/GCC region bounding box
LAT_MIN, LAT_MAX = 28.5, 30.2
LON_MIN, LON_MAX = 47.0, 49.0

def haversine_meters(lat1, lon1, lat2, lon2):
    R = 6_371_000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))

def generate_samples(n=5000):
    pickup_lat = RNG.uniform(LAT_MIN, LAT_MAX, n)
    pickup_lon = RNG.uniform(LON_MIN, LON_MAX, n)
    drop_lat   = RNG.uniform(LAT_MIN, LAT_MAX, n)
    drop_lon   = RNG.uniform(LON_MIN, LON_MAX, n)
    day_of_week = RNG.choice(DAYS, n)
    hour_of_day = RNG.integers(0, 24, n)

    distances = np.array([
        haversine_meters(pickup_lat[i], pickup_lon[i], drop_lat[i], drop_lon[i])
        for i in range(n)
    ])

    # Rush-hour factor: 8-10, 17-19 are slower
    speed_kmh = np.where(
        np.isin(hour_of_day, [8, 9, 10, 17, 18, 19]), 25.0, 40.0
    )
    eta_minutes = (distances / 1000) / speed_kmh * 60 + RNG.normal(0, 2, n)
    eta_minutes = np.clip(eta_minutes, 1, None)

    return pickup_lat, pickup_lon, drop_lat, drop_lon, day_of_week, hour_of_day, distances, eta_minutes


def build_distance_model(pickup_lat, pickup_lon, drop_lat, drop_lon, distances):
    X = np.column_stack([pickup_lat, pickup_lon, drop_lat, drop_lon])
    model = GradientBoostingRegressor(n_estimators=100, max_depth=5, random_state=42)
    model.fit(X, distances)
    return model


def build_eta_model(pickup_lat, pickup_lon, drop_lat, drop_lon,
                    day_of_week, hour_of_day, distances, eta_minutes):
    df = pd.DataFrame({
        "pickup_lat":  pickup_lat,
        "pickup_lon":  pickup_lon,
        "drop_lat":    drop_lat,
        "drop_lon":    drop_lon,
        "day_of_week": day_of_week,
        "hour_of_day": hour_of_day,
        "distance":    distances,
    })

    preprocessor = ColumnTransformer(transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), ["day_of_week"]),
        ("num", "passthrough", ["pickup_lat", "pickup_lon", "drop_lat", "drop_lon",
                                "hour_of_day", "distance"]),
    ])

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", GradientBoostingRegressor(n_estimators=100, max_depth=5, random_state=42)),
    ])
    pipeline.fit(df, eta_minutes)
    return pipeline


if __name__ == "__main__":
    server_dir = os.path.dirname(os.path.abspath(__file__))

    print("Generating synthetic training data...")
    (pickup_lat, pickup_lon, drop_lat, drop_lon,
     day_of_week, hour_of_day, distances, eta_minutes) = generate_samples(5000)

    print("Training distance model...")
    distance_model = build_distance_model(pickup_lat, pickup_lon, drop_lat, drop_lon, distances)

    print("Training ETA model...")
    eta_model = build_eta_model(pickup_lat, pickup_lon, drop_lat, drop_lon,
                                day_of_week, hour_of_day, distances, eta_minutes)

    dist_path = os.path.join(server_dir, "distance_model.pkl")
    eta_path  = os.path.join(server_dir, "eta_model.pkl")

    joblib.dump(distance_model, dist_path)
    print(f"Saved {dist_path}  ({os.path.getsize(dist_path):,} bytes)")

    joblib.dump(eta_model, eta_path)
    print(f"Saved {eta_path}  ({os.path.getsize(eta_path):,} bytes)")

    # Quick sanity check
    import sys
    sys.path.insert(0, os.path.join(server_dir, "src", "scripts"))
    dist_check = distance_model.predict(np.array([[29.2, 48.0, 29.4, 48.1]]))[0]
    from datetime import datetime, timezone
    print(f"\nSanity check — distance: {dist_check:.0f} m  (haversine ≈ 23 km)")
    print("Done. Stub models saved successfully.")
