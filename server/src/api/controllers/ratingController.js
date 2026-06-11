const Rating   = require('../../models/Rating');
const Delivery = require('../../models/Delivery');
const rv = require('../../views/responseView');
const ratingView = require('../../views/ratingView');

// POST /ratings
exports.createRating = async (req, res) => {
  try {
    const { deliveryId, stars, comment } = req.body;
    const clientId = req.user.id;

    if (!deliveryId || !stars) {
      return rv.send(res, ratingView.badRequest('deliveryId et stars sont requis'));
    }

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return rv.send(res, ratingView.notFound('Livraison introuvable'));
    }
    if (delivery.clientStatus !== 'delivered') {
      return rv.send(res, ratingView.badRequest("La livraison n'est pas encore terminée"));
    }
    if (delivery.client.toString() !== clientId) {
      return rv.send(res, rv.badRequest('Non autorisé'));
    }

    const existing = await Rating.findOne({ delivery: deliveryId });
    if (existing) {
      return rv.send(res, ratingView.badRequest('Vous avez déjà noté cette livraison'));
    }

    const rating = await Rating.create({
      delivery: deliveryId,
      client:   clientId,
      driver:   delivery.driver,
      stars,
      comment:  comment?.trim() || undefined,
    });

    return rv.send(res, ratingView.created(rating));
  } catch (err) {
    return rv.send(res, rv.serverError(err.message));
  }
};

// GET /ratings/order/:deliveryId
exports.getOrderRating = async (req, res) => {
  try {
    const rating = await Rating.findOne({ delivery: req.params.deliveryId })
      .populate('client', 'firstName lastName')
      .lean();
    return rv.send(res, rv.success({ data: rating || null }));
  } catch (err) {
    return rv.send(res, rv.serverError(err.message));
  }
};

// GET /ratings/my-ratings  (client: which deliveries I already rated)
exports.getMyRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ client: req.user.id }).select('delivery stars').lean();
    return rv.send(res, ratingView.list(ratings, undefined));
  } catch (err) {
    return rv.send(res, rv.serverError(err.message));
  }
};
