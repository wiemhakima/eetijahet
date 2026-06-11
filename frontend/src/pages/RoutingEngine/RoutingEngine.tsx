import './RoutingEngine.scss';

import ArmadaMap, { makeDeliveryPin, makePickupPin } from '../../components/ArmadaMap';
import { Marker, Polyline, Popup } from 'react-leaflet';
import React, { useEffect, useState } from 'react';

import { motion } from 'framer-motion';

// Google Maps teardrop pins — no CDN
const fromIcon = makePickupPin();
const toIcon   = makeDeliveryPin();

interface LocationData {
  lat: number;
  lng: number;
  display_name: string;
}

interface RouteData {
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

const RoutingEngine: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [fromCoords, setFromCoords] = useState<LocationData | null>(null);
  const [toCoords, setToCoords] = useState<LocationData | null>(null);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [fromSuggestions, setFromSuggestions] = useState<LocationData[]>([]);
  const [toSuggestions, setToSuggestions] = useState<LocationData[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  // Kuwait center coordinates
  const kuwaitCenter: [number, number] = [29.3759, 47.9774];

  // Loading animation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Search for locations using Nominatim API
  
  const searchLocation = async (query: string, isFrom: boolean) => {
    if (query.length < 3) {
      if (isFrom) {
        setFromSuggestions([]);
        setShowFromSuggestions(false);
      } else {
        setToSuggestions([]);
        setShowToSuggestions(false);
      }
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=kw&limit=10&addressdetails=1`
      );
      const data = await response.json();
      
      // Filter to only include results that are actually in Kuwait
      const kuwaitLocations: LocationData[] = data
        .filter((item: NominatimResult) => {
          const displayName = item.display_name as string;
          const lat = parseFloat(item.lat as string);
          const lng = parseFloat(item.lon as string);
          
          // Check if the location is within Kuwait's approximate boundaries
          const isInKuwait = lat >= 28.5 && lat <= 30.1 && lng >= 46.5 && lng <= 48.5;
          const containsKuwait = displayName.toLowerCase().includes('kuwait') || 
                                displayName.toLowerCase().includes('الكويت') ||
                                displayName.toLowerCase().includes('kuveyt');
          
          return isInKuwait && containsKuwait;
        })
        .map((item: NominatimResult) => ({
          lat: parseFloat(item.lat as string),
          lng: parseFloat(item.lon as string),
          display_name: item.display_name as string
        }))
        .slice(0, 5); // Limit to 5 results

      if (isFrom) {
        setFromSuggestions(kuwaitLocations);
        setShowFromSuggestions(kuwaitLocations.length > 0);
      } else {
        setToSuggestions(kuwaitLocations);
        setShowToSuggestions(kuwaitLocations.length > 0);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  // Calculate route using OSRM
  const calculateRoute = async () => {
    if (!fromCoords || !toCoords) return;

    setIsCalculatingRoute(true);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${fromCoords.lng},${fromCoords.lat};${toCoords.lng},${toCoords.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0];
        const coordinates: [number, number][] = routeData.geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] // Swap lng,lat to lat,lng for Leaflet
        );

        setRoute({
          coordinates,
          distance: routeData.distance,
          duration: routeData.duration
        });
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Handle location selection
  const selectLocation = (location: LocationData, isFrom: boolean) => {
    if (isFrom) {
      setFromLocation(location.display_name);
      setFromCoords(location);
      setShowFromSuggestions(false);
    } else {
      setToLocation(location.display_name);
      setToCoords(location);
      setShowToSuggestions(false);
    }
  };

  // Auto-calculate route when both locations are selected
  useEffect(() => {
    if (fromCoords && toCoords) {
      calculateRoute();
    }
  }, [fromCoords, toCoords]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Format distance
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  if (isLoading) {
    return (
      <div className="routing-engine-container">
        <div className="loading-screen">
          <motion.div
            className="loading-content"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="loading-icon"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" fill="#1a73e8"/>
              </svg>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Routing Engine
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Initializing map services...
            </motion.p>
            <motion.div
              className="loading-bar-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <motion.div
                className="loading-bar"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 1, duration: 1.5, ease: "easeInOut" }}
              />
            </motion.div>
            <motion.div
              className="built-by"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.5 }}
            >
              Built by <span className="brand">Ettijahat</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="routing-engine-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="routing-content">
        <div className="search-panel">
          <div className="search-inputs">
            <div className="input-group">
              <div className="input-icon from-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="3" fill="#34a853"/>
                  <circle cx="12" cy="12" r="8" stroke="#34a853" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Choose starting point"
                value={fromLocation}
                onChange={(e) => {
                  setFromLocation(e.target.value);
                  searchLocation(e.target.value, true);
                }}
                onFocus={() => fromSuggestions.length > 0 && setShowFromSuggestions(true)}
                className="location-input from-input"
              />
              {showFromSuggestions && fromSuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {fromSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => selectLocation(suggestion, true)}
                    >
                      <div className="suggestion-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#666"/>
                        </svg>
                      </div>
                      <span>{suggestion.display_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="input-group">
              <div className="input-icon to-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ea4335"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Choose destination"
                value={toLocation}
                onChange={(e) => {
                  setToLocation(e.target.value);
                  searchLocation(e.target.value, false);
                }}
                onFocus={() => toSuggestions.length > 0 && setShowToSuggestions(true)}
                className="location-input to-input"
              />
              {showToSuggestions && toSuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {toSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => selectLocation(suggestion, false)}
                    >
                      <div className="suggestion-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#666"/>
                        </svg>
                      </div>
                      <span>{suggestion.display_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {route && (
            <motion.div
              className="route-info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="route-stats">
                <div className="stat">
                  <span className="stat-value">{formatDistance(route.distance)}</span>
                  <span className="stat-label">Distance</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{formatDuration(route.duration)}</span>
                  <span className="stat-label">Duration</span>
                </div>
              </div>
            </motion.div>
          )}

          {isCalculatingRoute && (
            <div className="calculating-route">
              <div className="calculating-icon">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8Z" fill="#1a73e8"/>
                  </svg>
                </motion.div>
              </div>
              <span>Calculating route...</span>
            </div>
          )}
        </div>

        <div className="map-container">
          <ArmadaMap
            center={kuwaitCenter}
            zoom={10}
            height="100%"
            bounds={
              fromCoords && toCoords
                ? [
                    [Math.min(fromCoords.lat, toCoords.lat), Math.min(fromCoords.lng, toCoords.lng)],
                    [Math.max(fromCoords.lat, toCoords.lat), Math.max(fromCoords.lng, toCoords.lng)],
                  ]
                : undefined
            }
            boundsPadding={60}
            showBoundary={true}
          >
            {fromCoords && (
              <Marker position={[fromCoords.lat, fromCoords.lng]} icon={fromIcon}>
                <Popup>
                  <strong>From:</strong><br />
                  {fromCoords.display_name}
                </Popup>
              </Marker>
            )}

            {toCoords && (
              <Marker position={[toCoords.lat, toCoords.lng]} icon={toIcon}>
                <Popup>
                  <strong>To:</strong><br />
                  {toCoords.display_name}
                </Popup>
              </Marker>
            )}

            {route && (
              <Polyline


                positions={route.coordinates}
                color="#1a73e8"
                weight={4}
                opacity={0.8}
              />
            )}
          </ArmadaMap>
        </div>
      </div>
    </motion.div>
  );
};

export default RoutingEngine;
