// frontend/src/models/RatingModel.ts
import api from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Model ────────────────────────────────────────────────────────────────────

export const RatingModel = {
  submit: (deliveryId: string, stars: number, comment?: string) =>
    api.post('/v1/ratings', { deliveryId, stars, comment }),

  getDriverRatings: (driverId: string) =>
    api.get(`/v1/ratings/driver/${driverId}`),

  getOrderRating: (deliveryId: string) =>
    api.get(`/v1/ratings/order/${deliveryId}`),

  getMyRatings: () =>
    api.get('/v1/ratings/my-ratings'),
};
