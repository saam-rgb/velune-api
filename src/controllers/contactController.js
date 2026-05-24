const prisma = require('../services/prisma');
const { sendContactNotification } = require('../services/email');

// POST /api/contact
async function send(req, res) {
  const { name, email, subject, message } = req.body;

  const record = await prisma.contactMessage.create({
    data: { name, email, subject, message },
  });

  await sendContactNotification({ name, email, subject, message }).catch(() => {});

  res.status(201).json({ message: 'Message received. We will be in touch.' });
}

// GET /api/contact (admin)
async function list(req, res) {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(messages);
}

module.exports = { send, list };
