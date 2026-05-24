const { v4: uuidv4 } = require('uuid');
const prisma = require('../services/prisma');
const { sendWelcomeEmail } = require('../services/email');
const ApiError = require('../utils/ApiError');

// POST /api/newsletter/subscribe
async function subscribe(req, res) {
  const { email, name, source } = req.body;

  const existing = await prisma.subscriber.findUnique({ where: { email } });
  if (existing?.confirmed) {
    return res.json({ message: 'Already subscribed' });
  }

  const token = uuidv4();

  if (existing) {
    await prisma.subscriber.update({ where: { email }, data: { token, name } });
  } else {
    await prisma.subscriber.create({ data: { email, name, token, source } });
  }

  await sendWelcomeEmail(email, token).catch(() => {});

  res.status(201).json({ message: 'Confirmation email sent. Please check your inbox.' });
}

// GET /api/newsletter/confirm?token=xxx
async function confirm(req, res) {
  const { token } = req.query;
  if (!token) throw ApiError.badRequest('Token required');

  const subscriber = await prisma.subscriber.findUnique({ where: { token } });
  if (!subscriber) throw ApiError.notFound('Invalid or expired confirmation link');

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: { confirmed: true, token: null },
  });

  res.json({ message: 'Subscription confirmed. Welcome to Velune!' });
}

// POST /api/newsletter/unsubscribe
async function unsubscribe(req, res) {
  const { email } = req.body;
  await prisma.subscriber.deleteMany({ where: { email } }).catch(() => {});
  res.json({ message: 'Unsubscribed successfully' });
}

// GET /api/newsletter/stats (admin only)
async function stats(req, res) {
  const [total, confirmed] = await Promise.all([
    prisma.subscriber.count(),
    prisma.subscriber.count({ where: { confirmed: true } }),
  ]);
  res.json({ total, confirmed, pending: total - confirmed });
}

module.exports = { subscribe, confirm, unsubscribe, stats };
