// Email service — Nodemailer with Brevo (SMTP) transport
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendEmail({ to, subject, html, text }) {
  if (!process.env.SMTP_USER) {
    logger.warn('SMTP not configured — skipping email');
    return;
  }
  const transport = createTransport();
  await transport.sendMail({
    from: `"Velune" <${process.env.SMTP_FROM || 'hello@velune.com'}>`,
    to,
    subject,
    html,
    text,
  });
}

async function sendWelcomeEmail(email, confirmToken) {
  const confirmUrl = `${process.env.FRONTEND_URL}/newsletter/confirm?token=${confirmToken}`;
  await sendEmail({
    to: email,
    subject: 'Welcome to Velune — Confirm your subscription',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#0b0b0f;color:#f0ece3;padding:48px 40px;">
        <div style="font-family:'Playfair Display',Georgia,serif;font-size:22px;letter-spacing:0.3em;color:#f0ece3;margin-bottom:32px;">VELUNE</div>
        <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:32px;color:#f0ece3;margin:0 0 16px;">Welcome.</h1>
        <p style="font-size:15px;color:#8e8a83;line-height:1.75;margin:0 0 32px;">One click to confirm your subscription and you're in. Editorial stories in Tech, Fashion, Health, Lifestyle, and Grooming — weekly, no filler.</p>
        <a href="${confirmUrl}" style="display:inline-block;background:#c8a96e;color:#0b0b0f;font-family:Inter,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;text-decoration:none;padding:14px 32px;">Confirm Subscription</a>
        <p style="font-size:12px;color:#8e8a83;margin-top:40px;">If you didn't sign up, ignore this email.</p>
      </div>
    `,
    text: `Welcome to Velune. Confirm your subscription: ${confirmUrl}`,
  });
}

async function sendContactNotification(data) {
  await sendEmail({
    to: process.env.ADMIN_EMAIL || 'admin@velune.com',
    subject: `[Velune Contact] ${data.subject || 'New message'} — ${data.name}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;">
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Subject:</strong> ${data.subject || '—'}</p>
        <p><strong>Message:</strong></p>
        <p>${data.message.replace(/\n/g, '<br>')}</p>
      </div>
    `,
    text: `From: ${data.name} <${data.email}>\n\n${data.message}`,
  });
}

module.exports = { sendEmail, sendWelcomeEmail, sendContactNotification };
