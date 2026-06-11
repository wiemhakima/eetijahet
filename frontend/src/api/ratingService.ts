import api from './index';

export interface Rating {
  _id: string;
  delivery: string;
  client: { _id: string; firstName: string; lastName: string } | string;
  driver: string;
  stars: number;
  comment?: string;
  createdAt: string;
}

export interface DriverRatingStats {
  count: number;
  average: number;
}

export const ratingService = {
  submit: (deliveryId: string, stars: number, comment?: string) =>
    api.post<{ success: boolean; data: Rating }>('/v1/ratings', { deliveryId, stars, comment }),

  getDriverRatings: (driverId: string) =>
    api.get<{ success: boolean; data: Rating[]; stats: DriverRatingStats }>(`/v1/ratings/driver/${driverId}`),

  getOrderRating: (deliveryId: string) =>
    api.get<{ success: boolean; data: Rating | null }>(`/v1/ratings/order/${deliveryId}`),

  getMyRatings: () =>
    api.get<{ success: boolean; data: Array<{ _id: string; delivery: string; stars: number }> }>('/v1/ratings/my-ratings'),
};
