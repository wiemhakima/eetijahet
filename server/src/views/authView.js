const rv = require('./responseView');

const _shape = (user) => ({
  id:        user._id,
  firstName: user.firstName,
  lastName:  user.lastName,
  email:     user.email,
  role:      user.role,
  tier:      user.tier || 'free',
  company:   user.company,
  createdAt: user.createdAt,
});

exports.authenticated = (user, token) =>
  rv.success({ user: _shape(user), token });

exports.registered = (user, token) =>
  ({ statusCode: 201, success: true, token, data: _shape(user) });

exports.profile = (user) =>
  rv.success(_shape(user));

exports.updated = (user) =>
  rv.success(_shape(user));

exports.loggedOut = () =>
  rv.success({ message: 'Logged out successfully' });

exports.passwordReset = () =>
  rv.success({ message: 'Password reset successfully' });

exports.emailSent = (email) =>
  rv.success({ message: `Reset link sent to ${email}` });

exports.unauthorized  = (msg = 'Invalid credentials')  => rv.badRequest(msg);
exports.notFound      = (msg = 'User not found')        => rv.notFound(msg);
exports.conflict      = (msg = 'Email already in use')  => rv.conflict(msg);
exports.badRequest    = (msg)                           => rv.badRequest(msg);
