/**
 * Email Service — Nodemailer + Google Workspace SMTP
 * Used for sending tracking links, driver-assigned notifications, and delivery confirmations.
 */
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587', 10);

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
  port:   EMAIL_PORT,
  secure: EMAIL_PORT === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

transporter.verify()
  .then(() => logger.info('✅ Email service ready'))
  .catch((err) => logger.warn(`⚠️ Email not configured: ${err.message}`));

// ── sendOrderCodeToClient ─────────────────────────────────────────────────────
// Sent to a client when a merchant creates an order for them.
// Contains a 6-digit numeric access code they use to track without logging in.

exports.sendOrderCodeToClient = async (email, clientName, trackingCode, accessCode) => {
  const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/track`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .code-box { background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0; }
        .code { font-size: 42px; font-weight: bold; color: #166534; letter-spacing: 10px; font-family: monospace; }
        .tracking-box { background: #fef3c7; border-radius: 8px; padding: 12px; text-align: center; margin-bottom: 20px; }
        .btn { display: inline-block; background: #22c55e; color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; }
        .footer { text-align: center; padding: 20px; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="font-size: 44px; margin-bottom: 10px;">📦</div>
          <h1 style="margin: 0; font-size: 22px;">Your Order is Ready!</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${clientName}</strong>,</p>
          <p>Your delivery order has been created. Use the code below to track it in real-time:</p>

          <div class="code-box">
            <div style="font-size: 12px; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Your Access Code</div>
            <div class="code">${accessCode}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 10px;">Valid for 7 days</div>
          </div>

          <div class="tracking-box">
            <div style="font-size: 12px; color: #92400e; margin-bottom: 4px;">Order Reference</div>
            <div style="font-size: 20px; font-weight: bold; color: #f59e0b; letter-spacing: 3px;">${trackingCode}</div>
          </div>

          <p style="text-align: center;">
            <a href="${trackingUrl}" class="btn">📍 Track My Delivery</a>
          </p>

          <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 20px;">
            Go to the tracking page, enter your email address and the 6-digit code above to view your delivery status.
          </p>
        </div>
        <div class="footer">
          <p>Armada Delivery — Kuwait 🇰🇼</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Armada Delivery <emihakima@gmail.com>',
      to: email,
      subject: `📦 Your delivery code: ${accessCode} — Order #${trackingCode}`,
      html,
    });
    logger.info(`✅ Order code email sent to: ${email} (code: ${accessCode})`);
    return { success: true };
  } catch (error) {
    logger.error(`❌ Order code email error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ── sendMerchantCredentials ───────────────────────────────────────────────────
// Sent to a new merchant when the agency creates their account.

exports.sendMerchantCredentials = async (email, storeName, contactName, password, commission) => {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;

  const html = `
    <div style="font-family: Arial; max-width: 500px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0;">🏪 Welcome to Armada!</h1>
      </div>
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
        <p>Hello <strong>${contactName}</strong>,</p>
        <p>Your merchant account for <strong>${storeName}</strong> has been created.</p>
        <div style="background: #dcfce7; border: 1px solid #22c55e; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p style="margin: 0 0 10px;"><strong>📧 Email:</strong> ${email}</p>
          <p style="margin: 0 0 10px;"><strong>🔐 Password:</strong> ${password}</p>
          <p style="margin: 0;"><strong>💰 Commission:</strong> ${commission}%</p>
        </div>
        <p style="text-align: center;">
          <a href="${loginUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Log in now
          </a>
        </p>
        <p style="color: #64748b; font-size: 13px; margin-top: 20px;">
          Please change your password after your first login.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Armada Delivery <emihakima@gmail.com>',
      to: email,
      subject: `🏪 Welcome ${storeName} — Your Armada credentials`,
      html,
    });
    logger.info(`✅ Merchant credentials email sent to: ${email}`);
    return { success: true };
  } catch (error) {
    logger.error(`❌ Merchant credentials email error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ── sendTrackingLink ──────────────────────────────────────────────────────────
// Sent to client when a delivery is created.

exports.sendTrackingLink = async (clientEmail, clientName, trackingCode) => {
  const frontendUrl  = process.env.FRONTEND_URL || 'http://localhost:5173';
  const trackingUrl  = `${frontendUrl}/track?code=${trackingCode}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .tracking-box { background: #f0fdf4; border: 2px solid #22c55e; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
        .tracking-code { font-size: 32px; font-weight: bold; color: #166534; letter-spacing: 4px; }
        .btn { display: inline-block; background: #22c55e; color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-size: 18px; font-weight: bold; margin-top: 10px; }
        .footer { text-align: center; padding: 20px; color: #94a3b8; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚚 Votre livraison est en route !</h1>
        </div>
        <div class="content">
          <p>Bonjour <strong>${clientName}</strong>,</p>
          <p>Votre commande a été créée et sera bientôt livrée.</p>
          <div class="tracking-box">
            <p style="margin: 0 0 10px; color: #64748b;">Votre code de suivi :</p>
            <div class="tracking-code">${trackingCode}</div>
          </div>
          <p style="text-align: center;">
            <a href="${trackingUrl}" class="btn">📍 Suivre ma livraison</a>
          </p>
          <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
            Cliquez sur le bouton ci-dessus pour suivre votre livreur en temps réel.
          </p>
        </div>
        <div class="footer">
          <p>Armada Delivery - Service de livraison</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Armada Delivery <emihakima@gmail.com>',
      to: clientEmail,
      subject: `🚚 Suivez votre livraison - Code: ${trackingCode}`,
      html,
    });
    logger.info(`✅ Tracking email sent to: ${clientEmail}`);
    return { success: true };
  } catch (error) {
    logger.error(`❌ Tracking email error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ── sendDispatchedEmail ───────────────────────────────────────────────────────
// Sent ONCE when clientStatus → in_transit (livreur parti avec le colis).
// Contains the secret UUID tracking token, not the short trackingCode.

exports.sendDispatchedEmail = async (clientEmail, clientName, trackingToken) => {
  const frontendUrl  = process.env.FRONTEND_URL || 'http://localhost:5173';
  const trackingUrl  = `${frontendUrl}/track/${trackingToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 32px; text-align: center; }
        .content { padding: 32px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 16px 44px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; }
        .footer { text-align: center; padding: 20px; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="font-size: 52px; margin-bottom: 10px;">🚚</div>
          <h1 style="margin: 0; font-size: 22px;">Votre commande est en route !</h1>
        </div>
        <div class="content">
          <p>Bonjour <strong>${clientName}</strong>,</p>
          <p>Votre livreur a récupéré votre colis et est en route vers vous.</p>
          <p>Suivez la position de votre livreur en temps réel :</p>
          <p style="text-align: center; margin: 28px 0;">
            <a href="${trackingUrl}" class="btn">📍 Suivre ma commande</a>
          </p>
          <p style="font-size: 13px; color: #94a3b8; text-align: center;">
            Ce lien est valable 7 jours après la livraison.<br>
            Aucun compte requis.
          </p>
        </div>
        <div class="footer">
          <p>Armada Delivery — Service de livraison</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Armada Delivery <emihakima@gmail.com>',
      to: clientEmail,
      subject: '🚚 Votre commande est en route',
      html,
    });
    logger.info(`✅ Dispatched email sent to: ${clientEmail}`);
    return { success: true };
  } catch (error) {
    logger.error(`❌ Dispatched email error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ── sendDriverAssigned ────────────────────────────────────────────────────────
// Sent when a driver accepts the delivery.

exports.sendDriverAssigned = async (clientEmail, clientName, driverName, trackingCode) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const trackingUrl = `${frontendUrl}/track?code=${trackingCode}`;

  const html = `
    <div style="font-family: Arial; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #22c55e;">🚚 Un livreur arrive !</h2>
      <p>Bonjour <strong>${clientName}</strong>,</p>
      <p><strong>${driverName}</strong> est en route pour votre livraison.</p>
      <p>
        <a href="${trackingUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          📍 Suivre en direct
        </a>
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Armada Delivery <emihakima@gmail.com>',
      to: clientEmail,
      subject: `🚚 Votre livreur ${driverName} est en route !`,
      html,
    });
    logger.info(`✅ Driver-assigned email sent to: ${clientEmail}`);
    return { success: true };
  } catch (error) {
    logger.error(`❌ Driver-assigned email error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ── sendDeliveryCompleted ─────────────────────────────────────────────────────
// Sent when the driver marks the delivery as delivered.

exports.sendDeliveryCompleted = async (clientEmail, clientName, trackingCode) => {
  const html = `
    <div style="font-family: Arial; max-width: 500px; margin: 0 auto; padding: 20px; text-align: center;">
      <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
      <h2 style="color: #22c55e;">Livraison terminée !</h2>
      <p>Bonjour <strong>${clientName}</strong>,</p>
      <p>Votre commande <strong>#${trackingCode}</strong> a été livrée avec succès.</p>
      <p style="color: #64748b;">Merci d'avoir utilisé Armada Delivery !</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Armada Delivery <emihakima@gmail.com>',
      to: clientEmail,
      subject: `✅ Livraison terminée - #${trackingCode}`,
      html,
    });
    logger.info(`✅ Completion email sent to: ${clientEmail}`);
    return { success: true };
  } catch (error) {
    logger.error(`❌ Completion email error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ── sendGestionnaireWelcome ───────────────────────────────────────────────────
// Sent to a new gestionnaire_agency when the agency admin creates their account.

exports.sendGestionnaireWelcome = async ({ email, firstName, agencyName, password }) => {
  const loginUrl   = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
  const platformUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const brand       = agencyName || 'Etijahat';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;
                border-radius:12px;overflow:hidden;
                box-shadow:0 4px 20px rgba(0,0,0,0.1);">

      <div style="background:linear-gradient(135deg,#1e3a5f,#3b82f6);
                  padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;">${brand}</h1>
        <p style="color:#bfdbfe;margin:6px 0 0;font-size:14px;">
          Plateforme de livraison
        </p>
      </div>

      <div style="background:#fff;padding:32px;">
        <h2 style="color:#1e293b;font-size:18px;margin-top:0;">
          Bienvenue, ${firstName} ! 👋
        </h2>
        <p style="color:#64748b;line-height:1.6;">
          Votre compte <strong>Gestionnaire</strong> a été créé sur
          la plateforme <strong>${brand}</strong>.
          Voici vos identifiants de connexion :
        </p>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;
                    border-radius:10px;padding:20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                <span style="color:#64748b;font-size:13px;">🌐 Plateforme</span>
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;">
                <a href="${platformUrl}" style="color:#3b82f6;font-weight:600;font-size:13px;">
                  ${platformUrl}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                <span style="color:#64748b;font-size:13px;">📧 Email</span>
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;
                         text-align:right;font-weight:600;color:#1e293b;font-size:13px;">
                ${email}
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                <span style="color:#64748b;font-size:13px;">🔐 Mot de passe</span>
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;">
                <code style="background:#fef9c3;padding:4px 10px;border-radius:6px;
                             font-size:14px;font-weight:700;color:#854d0e;letter-spacing:1px;">
                  ${password}
                </code>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;">
                <span style="color:#64748b;font-size:13px;">👤 Rôle</span>
              </td>
              <td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b;font-size:13px;">
                Gestionnaire — ${brand}
              </td>
            </tr>
          </table>
        </div>

        <a href="${loginUrl}"
           style="display:block;background:#3b82f6;color:#fff;padding:14px;
                  border-radius:8px;text-decoration:none;font-weight:600;
                  text-align:center;font-size:15px;">
          Se connecter maintenant →
        </a>

        <p style="color:#94a3b8;font-size:12px;margin-top:20px;
                  text-align:center;line-height:1.5;">
          ⚠️ Pour votre sécurité, changez votre mot de passe après la première connexion.<br/>
          Ne partagez pas ces identifiants.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to:      email,
      subject: `Vos accès — ${brand}`,
      html,
    });
    logger.info(`✅ Gestionnaire welcome email sent to: ${email}`);
    return { success: true };
  } catch (error) {
    logger.error(`❌ Gestionnaire welcome email error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ── sendTeamInvite ─────────────────────────────────────────────────────────────
// Sent to a newly created team member with their login credentials.

// ── sendForgotPasswordEmail ────────────────────────────────────────────────────
// Sent when a user requests a password reset link.

exports.sendForgotPasswordEmail = async (email, firstName, resetUrl) => {
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 500px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: #2563eb; padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .body { padding: 30px; text-align: right; }
        .body p { color: #374151; line-height: 1.8; font-size: 15px; }
        .btn { display: block; width: fit-content; margin: 24px auto; padding: 14px 32px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; }
        .footer { padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin-top: 16px; color: #92400e; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>🔐 Etijahat</h1></div>
        <div class="body">
          <p>مرحباً <strong>${firstName}</strong>،</p>
          <p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
          <p>انقر على الزر أدناه لإعادة تعيين كلمة المرور:</p>
          <a href="${resetUrl}" class="btn">إعادة تعيين كلمة المرور</a>
          <div class="warning">
            ⚠️ هذا الرابط صالح لمدة <strong>ساعة واحدة</strong> فقط.
            إذا لم تطلب إعادة التعيين، تجاهل هذا البريد.
          </div>
        </div>
        <div class="footer">
          <p>© 2026 Etijahat — Armada Delivery Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'إعادة تعيين كلمة المرور — Etijahat',
      html,
    });
    logger.info(`✅ Forgot-password email sent to: ${email}`);
    return { success: true };
  } catch (error) {
    logger.error(`❌ Forgot-password email error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ── sendPasswordChangedEmail ───────────────────────────────────────────────────
// Confirmation sent after a successful password reset.

exports.sendPasswordChangedEmail = async (email, firstName) => {
  const html = `
    <div style="font-family:Arial;max-width:500px;margin:auto;padding:30px;text-align:right;direction:rtl;">
      <h2 style="color:#2563eb">✅ تم تغيير كلمة المرور بنجاح</h2>
      <p>مرحباً <strong>${firstName}</strong>،</p>
      <p>تم تغيير كلمة المرور الخاصة بحسابك بنجاح.</p>
      <p>إذا لم تقم بهذا التغيير، يرجى التواصل معنا فوراً.</p>
      <p style="color:#9ca3af;font-size:12px">© 2026 Etijahat</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'تم تغيير كلمة المرور — Etijahat',
      html,
    });
    logger.info(`✅ Password-changed email sent to: ${email}`);
    return { success: true };
  } catch (error) {
    logger.error(`❌ Password-changed email error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ── sendTeamInvite ─────────────────────────────────────────────────────────────
// Sent to a newly created team member with their login credentials.

exports.sendTeamInvite = async (email, firstName, password, role, agencyName) => {
  const loginUrl  = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
  const roleName  = role === 'admin' ? 'Administrateur' : 'Gestionnaire';
  const roleEmoji = role === 'admin' ? '👑' : '👨‍💼';
  const brand     = agencyName || 'Armada Delivery';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Arial, sans-serif;">
      <div style="max-width: 500px; margin: 0 auto; padding: 20px;">

        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 40px 20px; text-align: center; border-radius: 16px 16px 0 0;">
          <div style="font-size: 48px; margin-bottom: 12px;">👥</div>
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Welcome to the Team!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">${brand}</p>
        </div>

        <div style="background: white; padding: 32px 24px; border-radius: 0 0 16px 16px;">

          <p style="font-size: 16px; color: #374151; margin: 0 0 16px;">
            Hello <strong>${firstName}</strong>,
          </p>
          <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0 0 24px;">
            You have been invited as <strong style="color: #1d4ed8;">${roleEmoji} ${roleName}</strong>. Use the credentials below to log in:
          </p>

          <div style="border: 2px solid #22c55e; border-radius: 12px; padding: 24px; margin-bottom: 20px; background: #f0fdf4;">
            <div style="text-align: center; font-size: 12px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">
              YOUR LOGIN CREDENTIALS
            </div>
            <div style="background: white; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px;">
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">📧 Email</div>
              <div style="font-size: 16px; color: #111827; font-weight: 600; margin-top: 4px;">${email}</div>
            </div>
            <div style="background: white; border-radius: 8px; padding: 12px 16px;">
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">🔑 Password</div>
              <div style="font-size: 24px; color: #111827; font-weight: 700; letter-spacing: 3px; margin-top: 4px;">${password}</div>
            </div>
          </div>

          <div style="border: 2px solid #f59e0b; border-radius: 12px; padding: 16px; text-align: center; background: #fffbeb; margin-bottom: 24px;">
            <div style="font-size: 12px; color: #b45309; text-transform: uppercase; letter-spacing: 1px;">Your Role</div>
            <div style="font-size: 18px; color: #d97706; font-weight: 700; margin-top: 4px;">${roleEmoji} ${roleName}</div>
          </div>

          <div style="text-align: center;">
            <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Log in now
            </a>
          </div>

          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin: 24px 0 0;">
            Please change your password after your first login.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to:      email,
      subject: `👥 Team Invitation - ${brand}`,
      html,
    });
    logger.info(`Team invite sent to: ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ TEAM INVITE EMAIL ERROR ══════════════');
    console.error('  Code   :', error.code);
    console.error('  Message:', error.message);
    console.error('  Command:', error.command);
    console.error('════════════════════════════════════════');
    logger.error(`❌ Team invite email error: ${error.message}`);
    return { success: false, error: error.message };
  }
};
