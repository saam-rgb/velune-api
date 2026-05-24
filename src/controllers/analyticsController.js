const prisma = require('../services/prisma');

// GET /api/analytics/dashboard
async function dashboard(req, res) {
  const [totalViews, monthViews, articles, subscribers, topPosts] = await Promise.all([
    prisma.pageView.count(),
    prisma.pageView.count({
      where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.article.count({ where: { status: 'PUBLISHED' } }),
    prisma.subscriber.count({ where: { confirmed: true } }),
    prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { views: 'desc' },
      take: 5,
      select: { id: true, title: true, category: true, views: true, publishedAt: true, slug: true },
    }),
  ]);

  // Last 7 days traffic
  const weeklyTraffic = await Promise.all(
    Array.from({ length: 7 }).map(async (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      return prisma.pageView.count({ where: { date: { gte: start, lte: end } } });
    })
  );

  res.json({ totalViews, monthViews, articles, subscribers, topPosts, weeklyTraffic });
}

// POST /api/analytics/pageview
async function trackPageView(req, res) {
  const { path, articleId, source } = req.body;
  await prisma.pageView.create({ data: { path, articleId, source } }).catch(() => {});
  res.status(201).json({ ok: true });
}

module.exports = { dashboard, trackPageView };
