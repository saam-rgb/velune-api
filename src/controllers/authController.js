const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../services/prisma');
const ApiError = require('../utils/ApiError');

const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function signAccess(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
}

function signRefresh() {
  return uuidv4();
}

// POST /api/auth/register
async function register(req, res) {
  const { email, password, name } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict('Email already registered');

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashed, name },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  const accessToken = signAccess({ id: user.id, email: user.email, role: user.role });
  const refreshToken = signRefresh();

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });

  res.status(201).json({ user, accessToken, refreshToken });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw ApiError.unauthorized('Invalid credentials');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw ApiError.unauthorized('Invalid credentials');

  const accessToken = signAccess({ id: user.id, email: user.email, role: user.role });
  const refreshToken = signRefresh();

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });

  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser, accessToken, refreshToken });
}

// POST /api/auth/refresh
async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) throw ApiError.badRequest('Refresh token required');

  const record = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!record || record.expiresAt < new Date()) {
    if (record) await prisma.refreshToken.delete({ where: { id: record.id } });
    throw ApiError.unauthorized('Refresh token expired or invalid');
  }

  const { user } = record;
  const accessToken = signAccess({ id: user.id, email: user.email, role: user.role });
  const newRefresh = signRefresh();

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { token: newRefresh, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) },
  });

  res.json({ accessToken, refreshToken: newRefresh });
}

// POST /api/auth/logout
async function logout(req, res) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => {});
  }
  res.json({ message: 'Logged out' });
}

// GET /api/auth/me
async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, role: true, bio: true, avatarUrl: true, createdAt: true },
  });
  if (!user) throw ApiError.notFound('User not found');
  res.json(user);
}

// PATCH /api/auth/me
async function updateMe(req, res) {
  const { name, bio, avatarUrl } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { name, bio, avatarUrl },
    select: { id: true, email: true, name: true, role: true, bio: true, avatarUrl: true },
  });
  res.json(user);
}

module.exports = { register, login, refresh, logout, me, updateMe };
