const nodemailer = require('nodemailer');

class EmailDeliveryError extends Error {
  constructor(message = 'Email service is not configured correctly. Please contact the administrator.') {
    super(message);
    this.name = 'EmailDeliveryError';
  }
}

function getTransporter() {
  const { EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new EmailDeliveryError();
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    tls: {
      minVersion: 'TLSv1.2'
    },
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });
}

async function sendVerificationEmail({ to, token, fullName }) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const verificationLink = `${clientUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const transporter = getTransporter();

  try {
    await transporter.sendMail({
      from: `"Online Judge" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Verify your Online Judge account',
      html: `
        <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
          <h2 style="margin-bottom: 12px;">Welcome to Online Judge</h2>
          <p>${fullName ? `Hi ${fullName},` : 'Hello,'}</p>
          <p>Click the button below to verify your account.</p>
          <p style="margin: 24px 0;">
            
              href="${verificationLink}"
              style="background: #1f7a5f; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 999px; display: inline-block; font-weight: bold;"
            >
              Verify Email
            </a>
          </p>
          <p>If the button does not work, use this link:</p>
          <p><a href="${verificationLink}">${verificationLink}</a></p>
          <p>This link expires in 15 minutes.</p>
        </div>
      `
    });
  } catch (err) {
    console.error('Email delivery failed:', {
      message: err.message,
      code: err.code,
      command: err.command,
      response: err.response
    });
    throw new EmailDeliveryError();
  }
}

async function sendPasswordResetEmail({ to, token, fullName }) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${clientUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const transporter = getTransporter();

  try {
    await transporter.sendMail({
      from: `"Online Judge" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Reset your Online Judge password',
      html: `
        <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
          <h2 style="margin-bottom: 12px;">Password Reset Request</h2>
          <p>${fullName ? `Hi ${fullName},` : 'Hello,'}</p>
          <p>Click the button below to reset your password.</p>
          <p style="margin: 24px 0;">
            
              href="${resetLink}"
              style="background: #1f7a5f; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 999px; display: inline-block; font-weight: bold;"
            >
              Reset Password
            </a>
          </p>
          <p>If the button does not work, use this link:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    });
  } catch (err) {
    console.error('Password reset email delivery failed:', {
      message: err.message,
      code: err.code,
      command: err.command,
      response: err.response
    });
    throw new EmailDeliveryError();
  }
}

module.exports = { EmailDeliveryError, sendVerificationEmail, sendPasswordResetEmail };