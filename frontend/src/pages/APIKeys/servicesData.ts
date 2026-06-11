// Shared service definitions for the API Keys creation flow
export interface ServiceParameter {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

export interface ServiceCodeSnippet {
  language: string;
  label: string;
  code: string;
}

export interface ApiService {
  id: string;
  name: string;
  slug: string;
  endpoint: string;
  method: string;
  category: 'Estimation' | 'Routing';
  color: string;
  gradientFrom: string;
  gradientTo: string;
  summary: string;
  fullDescription: string;
  features: string[];
  parameters: ServiceParameter[];
  codeSnippets: ServiceCodeSnippet[];
  responseExample: string;
  latency: string;
  permission: string;
}

export const API_SERVICES: ApiService[] = [
  {
    id: 'eta',
    name: 'Time Estimation',
    slug: 'time-estimation',
    endpoint: 'v1/public/eta',
    method: 'POST',
    category: 'Estimation',
    color: '#1a73e8',
    gradientFrom: '#1a73e8',
    gradientTo: '#4285f4',
    summary: 'Calculate estimated travel time between two points with real-time traffic data.',
    fullDescription: 'The Time Estimation API provides accurate ETA predictions between pickup and drop-off locations. It factors in real-time traffic patterns, time of day, and historical delivery performance based on millions of Kuwait delivery data points to give you reliable time estimates.',
    features: [
      'Accurate predictions based on Kuwait delivery data',
      'Real-time traffic pattern consideration',
      'Time-of-day aware calculations',
      'Sub-second response times',
      'High accuracy confidence scoring'
    ],
    parameters: [
      { name: 'pickup_lat', type: 'number', description: 'Latitude of pickup location', required: true },
      { name: 'pickup_lon', type: 'number', description: 'Longitude of pickup location', required: true },
      { name: 'drop_lat', type: 'number', description: 'Latitude of drop-off location', required: true },
      { name: 'drop_lon', type: 'number', description: 'Longitude of drop-off location', required: true },
      { name: 'pickup_time_utc', type: 'string', description: 'Pickup time in UTC (ISO 8601)', required: true },
    ],
    codeSnippets: [
      {
        language: 'curl',
        label: 'cURL',
        code: `curl -X POST https://api.etijahat.com/v1/public/eta \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "pickup_lat": 29.2951,
    "pickup_lon": 47.9095,
    "drop_lat": 29.3041,
    "drop_lon": 48.0764,
    "pickup_time_utc": "2025-01-15T10:30:00Z"
  }'`
      },
      {
        language: 'javascript',
        label: 'JavaScript',
        code: `const response = await fetch('https://api.etijahat.com/v1/public/eta', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    pickup_lat: 29.2951,
    pickup_lon: 47.9095,
    drop_lat: 29.3041,
    drop_lon: 48.0764,
    pickup_time_utc: '2025-01-15T10:30:00Z'
  })
});
const data = await response.json();
console.log(data);`
      },
      {
        language: 'python',
        label: 'Python',
        code: `import requests

response = requests.post(
    'https://api.etijahat.com/v1/public/eta',
    headers={
        'Content-Type': 'application/json',
        'x-api-key': 'YOUR_API_KEY'
    },
    json={
        'pickup_lat': 29.2951,
        'pickup_lon': 47.9095,
        'drop_lat': 29.3041,
        'drop_lon': 48.0764,
        'pickup_time_utc': '2025-01-15T10:30:00Z'
    }
)
print(response.json())`
      }
    ],
    responseExample: `{
  "eta_minutes": 24.5,
  "confidence_score": 0.95,
  "request_id": "req_a1b2c3d4"
}`,
    latency: '~120ms',
    permission: 'time_estimation'
  },
  {
    id: 'distance',
    name: 'Distance Estimation',
    slug: 'distance-estimation',
    endpoint: 'v1/public/distance',
    method: 'POST',
    category: 'Estimation',
    color: '#0d47a1',
    gradientFrom: '#0d47a1',
    gradientTo: '#1a73e8',
    summary: 'Measure accurate route distance between two geographic coordinates.',
    fullDescription: 'The Distance Estimation API calculates the estimated travel distance between two geographic points in Kuwait. Using road network data and intelligent routing algorithms, it provides accurate distance measurements that account for actual driving routes rather than straight-line distances.',
    features: [
      'Road-network aware distance calculation',
      'Accurate route-based measurements',
      'Supports any coordinates within Kuwait',
      'Fast response with high precision',
      'Integrated with routing engine'
    ],
    parameters: [
      { name: 'pickup_lat', type: 'number', description: 'Latitude of pickup location', required: true },
      { name: 'pickup_lon', type: 'number', description: 'Longitude of pickup location', required: true },
      { name: 'drop_lat', type: 'number', description: 'Latitude of drop-off location', required: true },
      { name: 'drop_lon', type: 'number', description: 'Longitude of drop-off location', required: true },
    ],
    codeSnippets: [
      {
        language: 'curl',
        label: 'cURL',
        code: `curl -X POST https://api.etijahat.com/v1/public/distance \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "pickup_lat": 29.2951,
    "pickup_lon": 47.9095,
    "drop_lat": 29.3041,
    "drop_lon": 48.0764
  }'`
      },
      {
        language: 'javascript',
        label: 'JavaScript',
        code: `const response = await fetch('https://api.etijahat.com/v1/public/distance', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    pickup_lat: 29.2951,
    pickup_lon: 47.9095,
    drop_lat: 29.3041,
    drop_lon: 48.0764
  })
});
const data = await response.json();
console.log(data);`
      },
      {
        language: 'python',
        label: 'Python',
        code: `import requests

response = requests.post(
    'https://api.etijahat.com/v1/public/distance',
    headers={
        'Content-Type': 'application/json',
        'x-api-key': 'YOUR_API_KEY'
    },
    json={
        'pickup_lat': 29.2951,
        'pickup_lon': 47.9095,
        'drop_lat': 29.3041,
        'drop_lon': 48.0764
    }
)
print(response.json())`
      }
    ],
    responseExample: `{
  "distance_meters": 968.4,
  "distance_km": 0.968,
  "confidence_score": 0.95,
  "request_id": "req_e5f6g7h8"
}`,
    latency: '~80ms',
    permission: 'distance_estimation'
  },
  {
    id: 'combined',
    name: 'Combined Estimation',
    slug: 'combined-estimation',
    endpoint: 'v1/public/combined',
    method: 'POST',
    category: 'Estimation',
    color: '#6c5ce7',
    gradientFrom: '#6c5ce7',
    gradientTo: '#a29bfe',
    summary: 'Get both time and distance estimates in a single optimized API call.',
    fullDescription: 'The Combined Estimation API delivers both time estimation and distance calculation in a single request, providing optimal performance for applications that need both metrics. This reduces API calls by 50% and ensures consistent results between time and distance calculations.',
    features: [
      'Two calculations in one API call',
      '50% fewer API requests needed',
      'Consistent time-distance correlation',
      'Optimized for delivery applications',
      'Best value per API credit'
    ],
    parameters: [
      { name: 'pickup_lat', type: 'number', description: 'Latitude of pickup location', required: true },
      { name: 'pickup_lon', type: 'number', description: 'Longitude of pickup location', required: true },
      { name: 'drop_lat', type: 'number', description: 'Latitude of drop-off location', required: true },
      { name: 'drop_lon', type: 'number', description: 'Longitude of drop-off location', required: true },
      { name: 'pickup_time_utc', type: 'string', description: 'Pickup time in UTC (ISO 8601)', required: true },
    ],
    codeSnippets: [
      {
        language: 'curl',
        label: 'cURL',
        code: `curl -X POST https://api.etijahat.com/v1/public/combined \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "pickup_lat": 29.2951,
    "pickup_lon": 47.9095,
    "drop_lat": 29.3041,
    "drop_lon": 48.0764,
    "pickup_time_utc": "2025-01-15T10:30:00Z"
  }'`
      },
      {
        language: 'javascript',
        label: 'JavaScript',
        code: `const response = await fetch('https://api.etijahat.com/v1/public/combined', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    pickup_lat: 29.2951,
    pickup_lon: 47.9095,
    drop_lat: 29.3041,
    drop_lon: 48.0764,
    pickup_time_utc: '2025-01-15T10:30:00Z'
  })
});
const data = await response.json();
console.log(data);`
      },
      {
        language: 'python',
        label: 'Python',
        code: `import requests

response = requests.post(
    'https://api.etijahat.com/v1/public/combined',
    headers={
        'Content-Type': 'application/json',
        'x-api-key': 'YOUR_API_KEY'
    },
    json={
        'pickup_lat': 29.2951,
        'pickup_lon': 47.9095,
        'drop_lat': 29.3041,
        'drop_lon': 48.0764,
        'pickup_time_utc': '2025-01-15T10:30:00Z'
    }
)
print(response.json())`
      }
    ],
    responseExample: `{
  "eta_minutes": 24.5,
  "distance_meters": 968.4,
  "confidence_score": 0.95,
  "request_id": "req_i9j0k1l2"
}`,
    latency: '~150ms',
    permission: 'combined_model'
  },
  {
    id: 'route_prediction',
    name: 'Route Prediction',
    slug: 'route-prediction',
    endpoint: 'v1/routing/predict_route',
    method: 'POST',
    category: 'Routing',
    color: '#00b894',
    gradientFrom: '#00b894',
    gradientTo: '#00cec9',
    summary: 'Calculate the optimal driving route between two points using the Armada AI road graph.',
    fullDescription: 'The Route Prediction API uses a real Kuwait road graph to compute the fastest driving path between two coordinates. It returns the full polyline path, distance in meters, and ETA in minutes — powered by the same graph engine used in production.',
    features: [
      'Real Kuwait road network graph',
      'A* shortest-path algorithm',
      'Full polyline path coordinates',
      'Accurate distance and ETA',
      'Fallback estimation when no path found'
    ],
    parameters: [
      { name: 'start', type: '[number, number]', description: 'Pickup coordinates [lat, lon]', required: true },
      { name: 'end',   type: '[number, number]', description: 'Drop-off coordinates [lat, lon]', required: true },
    ],
    codeSnippets: [
      {
        language: 'curl',
        label: 'cURL',
        code: `curl -X POST https://api.etijahat.com/v1/routing/predict_route \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "start": [29.3759, 47.9774],
    "end":   [29.3117, 48.0244]
  }'`
      },
      {
        language: 'javascript',
        label: 'JavaScript',
        code: `const response = await fetch('https://api.etijahat.com/v1/routing/predict_route', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    start: [29.3759, 47.9774],
    end:   [29.3117, 48.0244]
  })
});
const data = await response.json();
console.log(data);`
      },
      {
        language: 'python',
        label: 'Python',
        code: `import requests

response = requests.post(
    'https://api.etijahat.com/v1/routing/predict_route',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': 'YOUR_API_KEY'
    },
    json={
        'start': [29.3759, 47.9774],
        'end':   [29.3117, 48.0244]
    }
)
print(response.json())`
      }
    ],
    responseExample: `{
  "path": [[29.3759, 47.9774], [29.358, 47.986], [29.3117, 48.0244]],
  "distance": 8507.1,
  "eta": 13.6,
  "fallback": false
}`,
    latency: '~200ms',
    permission: 'route_prediction'
  },
];

export const getServiceBySlug = (slug: string): ApiService | undefined => {
  return API_SERVICES.find(s => s.slug === slug);
};

export const getServiceById = (id: string): ApiService | undefined => {
  return API_SERVICES.find(s => s.id === id);
};
