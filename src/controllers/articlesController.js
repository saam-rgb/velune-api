const prisma = require('../services/prisma');
const cache = require('../services/cache');
const ApiError = require('../utils/ApiError');

const CACHE_TTL = 300;

function buildSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 100);
}

function estimateReadTime(body) {
  let text = Array.isArray(body) ? body.join(' ') : String(body);
  // Strip HTML tags if body is an HTML string
  text = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text.split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}

// GET /api/articles
async function list(req, res) {
  const { category, status = 'PUBLISHED', featured, page = 1, limit = 12, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  // Authenticated users can pass status=ALL to see every status
  const resolvedStatus = req.user ? status : 'PUBLISHED';
  const statusFilter = resolvedStatus === 'ALL' ? undefined : resolvedStatus;

  const cacheKey = `articles:${category||'all'}:${resolvedStatus}:${featured||'all'}:${page}:${limit}:${search||''}`;
  // Don't cache ALL-status queries (dashboard only, low traffic)
  const cached = resolvedStatus !== 'ALL' ? await cache.get(cacheKey) : null;
  if (cached) return res.json(cached);

  const where = {
    ...(category && { category }),
    ...(statusFilter && { status: statusFilter }),
    ...(featured !== undefined && { featured: featured === 'true' }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ],
    }),
  };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: [{ hero: 'desc' }, { publishedAt: 'desc' }],
      skip,
      take: Number(limit),
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  const result = { articles, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  if (resolvedStatus !== 'ALL') await cache.set(cacheKey, result, CACHE_TTL);

  res.json(result);
}

// GET /api/articles/:slug
async function getBySlug(req, res) {
  const { slug } = req.params;
  const cacheKey = `article:${slug}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.json(cached);

  const article = await prisma.article.findUnique({
    where: { slug },
    include: { author: { select: { id: true, name: true, bio: true, avatarUrl: true } } },
  });

  if (!article || (article.status !== 'PUBLISHED' && !req.user)) {
    throw ApiError.notFound('Article not found');
  }

  // Increment views (fire-and-forget)
  prisma.article.update({ where: { id: article.id }, data: { views: { increment: 1 } } }).catch(() => {});

  await cache.set(cacheKey, article, CACHE_TTL);
  res.json(article);
}

// POST /api/articles
async function create(req, res) {
  const { title, excerpt, body, category, tags, featured, hero, coverImage, status } = req.body;

  const slug = buildSlug(title);
  const existing = await prisma.article.findUnique({ where: { slug } });
  if (existing) throw ApiError.conflict('An article with this title already exists');

  const resolvedStatus = status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';

  const article = await prisma.article.create({
    data: {
      slug,
      title,
      excerpt,
      body,
      category,
      tags: tags || [],
      featured: featured ?? false,
      hero: hero ?? false,
      coverImage,
      readTime: estimateReadTime(body),
      authorId: req.user.id,
      status: resolvedStatus,
      publishedAt: resolvedStatus === 'PUBLISHED' ? new Date() : null,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  await cache.delPattern('articles:*');
  res.status(201).json(article);
}

// PATCH /api/articles/:id
async function update(req, res) {
  const { id } = req.params;
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) throw ApiError.notFound('Article not found');

  const isOwner = article.authorId === req.user.id;
  if (!isOwner && !['ADMIN', 'EDITOR'].includes(req.user.role)) {
    throw ApiError.forbidden('You cannot edit this article');
  }

  const { title, excerpt, body, category, tags, featured, hero, coverImage, status } = req.body;
  const updates = {
    ...(title && { title, slug: buildSlug(title) }),
    ...(excerpt !== undefined && { excerpt }),
    ...(body !== undefined && { body, readTime: estimateReadTime(body) }),
    ...(category && { category }),
    ...(tags !== undefined && { tags }),
    ...(featured !== undefined && { featured }),
    ...(hero !== undefined && { hero }),
    ...(coverImage !== undefined && { coverImage }),
    ...(status && { status, publishedAt: status === 'PUBLISHED' ? new Date() : undefined }),
  };

  const updated = await prisma.article.update({
    where: { id },
    data: updates,
    include: { author: { select: { id: true, name: true } } },
  });

  await cache.del(`article:${article.slug}`);
  await cache.delPattern('articles:*');

  res.json(updated);
}

// DELETE /api/articles/:id
async function remove(req, res) {
  const { id } = req.params;
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) throw ApiError.notFound('Article not found');

  const isOwner = article.authorId === req.user.id;
  if (!isOwner && !['ADMIN', 'EDITOR'].includes(req.user.role)) {
    throw ApiError.forbidden();
  }

  await prisma.article.delete({ where: { id } });
  await cache.del(`article:${article.slug}`);
  await cache.delPattern('articles:*');

  res.json({ message: 'Article deleted' });
}

// GET /api/articles/:slug/related
async function related(req, res) {
  const { slug } = req.params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) throw ApiError.notFound();

  const articles = await prisma.article.findMany({
    where: { category: article.category, status: 'PUBLISHED', id: { not: article.id } },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    include: { author: { select: { id: true, name: true } } },
  });

  res.json(articles);
}

module.exports = { list, getBySlug, create, update, remove, related };
