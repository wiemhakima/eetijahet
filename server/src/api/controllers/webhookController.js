const ArmadaOrder = require('../../models/ArmadaOrder');
const logger      = require('../../utils/logger');
const rv = require('../../views/responseView');
const subscriptionView = require('../../views/subscriptionView');

exports.handleArmadaWebhook = async (req, res) => {
  // Respond 200 immediately — Armada retries on anything else
  rv.send(res, subscriptionView.webhook());

  const body     = req.body || {};
  const armadaId = body._id || body.id;

  if (!armadaId) {
    logger.warn('Webhook received with no armadaId — skipping');
    return;
  }

  const status = body.orderStatus || body.status || 'pending';

  try {
    const updated = await ArmadaOrder.findOneAndUpdate(
      { armadaId },
      {
        status,
        driverName:   body.driverName   || null,
        driverPhone:  body.driverPhone  || null,
        trackingLink: body.trackingLink || null,
        raw:          body,
      },
      { new: true }
    );

    if (!updated) return;

    const socket     = require('../../socket');
    const displayCode = updated.code || String(armadaId).slice(0, 8);

    if (updated.agency) {
      socket.notifyAgency(String(updated.agency), 'order_status_update', {
        type:    'order_status_update',
        title:   'Statut de commande mis à jour',
        message: `Commande ${displayCode} → ${status}`,
        orderId: updated._id,
        code:    updated.code,
        status,
        sound:   true,
      });
    }

    if (updated.merchant) {
      socket.notifyMerchant(String(updated.merchant), 'order_status_update', {
        type:    'order_status_update',
        title:   'Votre commande a été mise à jour',
        message: `Commande ${displayCode} → ${status}`,
        orderId: updated._id,
        code:    updated.code,
        status,
        sound:   true,
      });
    }

    if (status === 'failed') {
      if (updated.agency) {
        socket.notifyAgency(String(updated.agency), 'order_failed', {
          type:         'order_failed',
          title:        '⚠️ Commande échouée',
          message:      `La commande ${displayCode} a échoué`,
          orderId:      updated._id,
          code:         updated.code,
          status:       'failed',
          sound:        true,
          urgent:       true,
        });
      }

      if (updated.merchant) {
        socket.notifyMerchant(String(updated.merchant), 'order_failed', {
          type:    'order_failed',
          title:   '⚠️ Votre commande a échoué',
          message: `La commande ${displayCode} n'a pas pu être livrée`,
          orderId: updated._id,
          code:    updated.code,
          status:  'failed',
          sound:   true,
          urgent:  true,
        });
      }
    }
  } catch (err) {
    logger.error(`Webhook update error: ${err.message}`);
  }
};
