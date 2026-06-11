const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema(
  {
    eventType: { type: String, index: true },
    armadaId:  { type: String, index: true },
    payload:   { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
