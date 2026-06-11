import api from '../api';

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

export interface RouteSummary {
  total_distance_meters: number;
  total_time_minutes: number;
  number_of_segments: number;
}

export interface OptimizedRoute {
  success: boolean;
  route: {
    coordinates: [number, number][];
    segments: RouteSegment[];
    summary: RouteSummary;
  };
  timestamp: string;
  error?: string;
}

export const routingService = {
  /**
   * Optimize a single delivery route
   * @param pickup Pickup coordinates
   * @param dropoff Dropoff coordinates
   * @param pickupTime Pickup time in ISO 8601 format
   * @returns Optimized route with segments and summary
   */
  async optimizeRoute(
    pickup: Coordinates,
    dropoff: Coordinates,
    pickupTime: string
  ): Promise<OptimizedRoute> {
    try {
      const response = await api.post('/v1/routing/optimize', {
        pickup,
        dropoff,
        pickup_time_utc: pickupTime
      });
      
      return response.data;
    } catch (error) {
      console.error('Error optimizing route:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to optimize route';
      throw new Error(errorMessage);
    }
  }
};
