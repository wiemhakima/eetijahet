// Vue générique : helpers de réponse JSON partagés entre toutes les vues.
// Aucune logique métier — uniquement la mise en forme du protocole HTTP.

exports.success = (data, statusCode = 200) => ({ success: true, data, statusCode });
exports.created = (data)  => ({ success: true, data, statusCode: 201 });
exports.deleted = (msg)   => ({ success: true, message: msg, statusCode: 200 });

exports.badRequest = (msg)  => ({ success: false, error: msg, statusCode: 400 });
exports.notFound   = (msg)  => ({ success: false, error: msg, statusCode: 404 });
exports.conflict   = (msg)  => ({ success: false, error: msg, statusCode: 409 });
exports.gone       = (msg, extra = {}) => ({ success: false, error: msg, ...extra, statusCode: 410 });
exports.serverError = (msg) => ({ success: false, error: msg, statusCode: 500 });

// Envoie la réponse sur res — les controllers appellent view.send(res, view.xxx())
exports.send = (res, payload) => {
  const { statusCode = 200, ...body } = payload;
  return res.status(statusCode).json(body);
};
