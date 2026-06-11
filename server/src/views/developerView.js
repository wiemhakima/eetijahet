// Vue Developer : formate exclusivement les réponses JSON liées aux developers.
// Aucune requête DB ici — le Controller fournit les données brutes Mongoose.

const rv = require('./responseView');

const _shape = (user) => ({
  id:           user._id,
  firstName:    user.firstName,
  lastName:     user.lastName,
  email:        user.email,
  tier:         user.tier      || 'free',
  role:         user.role      || 'developer',
  credits:      user.activeApiSettings?.totalCredits  ?? 0,
  usedCredits:  user.activeApiSettings?.usedCredits   ?? 0,
  joinedAt:     user.createdAt,
});

exports.list = (users, pagination) =>
  rv.success({ users: users.map(_shape), pagination });

exports.one = (user) =>
  rv.success(_shape(user));

exports.impersonated = (user, token) =>
  rv.success({ developer: _shape(user), token, expiresIn: '15m' });

exports.saved = (user) =>
  rv.success(_shape(user));

exports.deleted = () =>
  rv.deleted('Developer deleted successfully');

exports.notFound   = (msg = 'Developer not found') => rv.notFound(msg);
exports.badRequest = (msg)                          => rv.badRequest(msg);
