// prisma/seed.js — Seeds initial data for Velune
const { PrismaClient, Category, ArticleStatus, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ARTICLES = [
  {
    title: "The AI Tools Quietly Running India's Creative Economy",
    excerpt: "From Canva to Claude, a new generation of creators is building empires on intelligence they don't own — and that's perfectly fine.",
    category: Category.Tech,
    featured: true,
    hero: true,
    tags: ['AI', 'Creators', 'Economy'],
    readTime: '6 min',
    body: [
      "There's a particular kind of hustle happening in Mumbai co-working spaces and Bengaluru home offices that doesn't look like hustle at all. Designers shipping thirty decks a month. Writers maintaining five editorial blogs simultaneously. Founders running their own content operations while also, technically, running their companies.",
      "These aren't tech bros chasing the next unicorn. They're stylists maintaining editorial calendars, fitness coaches creating twelve-week programs, and interior designers packaging their knowledge into sellable courses — and all of them are doing it at a scale that would have required full creative teams just two years ago.",
      "The tool they have in common isn't a particular app or platform. It's a disposition: a willingness to use AI as infrastructure, the same way a previous generation decided to just use the cloud.",
      "Which tools, specifically? The ones that matter. Claude for first drafts, strategy documents, and research synthesis. Midjourney for mood boards. ElevenLabs for voiceovers. Descript for podcast editing.",
      "The economics are striking. A solo creator in 2024 might have needed ₹3–4 lakh per month in salaries to maintain a serious content operation. The same output in 2026 costs closer to ₹15,000 in SaaS subscriptions.",
      "The real question isn't whether AI will replace creators. It's whether creators who use AI will replace those who don't.",
    ],
  },
  {
    title: "The Modern Indian Man's Guide to Power Dressing in 2026",
    excerpt: "Forget loud logos. The real power move is knowing exactly when to go understated — and making it look effortless.",
    category: Category.Fashion,
    featured: true,
    tags: ['Style', 'Menswear', 'India'],
    readTime: '5 min',
    body: [
      "The boardroom has changed. The corner office has changed. But the one thing that hasn't changed is that what you wear still signals something.",
      "In 2026, power dressing means restraint. A single, well-made navy blazer worn over a plain white tee. Trousers with an actual break. Loafers that are clearly not from a mall.",
      "Three labels you should know: Bhusattva for occasion wear, Bloni for tailoring that photographs well, and Eka for when the meeting involves people who actually know clothes.",
    ],
  },
  {
    title: "The Sleep Protocol That's Quietly Changing How India Works",
    excerpt: "Eight hours isn't the goal anymore. The new science of sleep says it's about architecture, not duration.",
    category: Category.Health,
    featured: true,
    tags: ['Sleep', 'Wellness', 'Performance'],
    readTime: '7 min',
    body: [
      "We've been measuring sleep wrong. For decades, the conversation has been about duration — get eight hours, or you're doing it wrong.",
      "Sleep architecture — the cycling between light sleep, deep sleep, and REM — is now understood to be as important as total duration.",
      "The practical interventions are simple: consistent wake time, a cooler sleeping environment, no screens in the final hour, and magnesium glycinate at 200mg before sleep.",
    ],
  },
  {
    title: "Inside the World's Most Expensive Watch Auctions of 2026",
    excerpt: "A Patek Philippe just sold for ₹18 crore at Christie's. Here's what serious collectors know that you don't.",
    category: Category.Lifestyle,
    tags: ['Watches', 'Luxury', 'Collecting'],
    readTime: '8 min',
    body: [
      "The hammer came down at 4:47 PM Geneva time, and the room absorbed what had just happened with the careful stillness that expensive rooms tend to produce.",
      "This is what the watch market looks like in 2026: simultaneously more accessible via online bidding and more exclusive at the top than it has ever been.",
      "Three references worth studying: the Patek 5970 in white gold, the Rolex 6263 'Paul Newman' Daytona, and the A. Lange and Söhne Tourbograph Perpetual.",
    ],
  },
  {
    title: "The 5-Step Skincare Routine Every Man Actually Needs",
    excerpt: "Not 12 steps. Not a clinical setup. Just five products that will genuinely transform your skin in 30 days.",
    category: Category.Grooming,
    tags: ['Skincare', 'Men', 'Routine'],
    readTime: '4 min',
    body: [
      "Men's skincare in India has a communication problem. The category talks to men as if they need to be convinced that skin exists.",
      "Here's the thing: the research doesn't support complexity. The core of effective skincare is remarkably simple. Cleanse, moisturise, protect.",
      "Step one: a gentle, pH-balanced cleanser. Cetaphil Gentle Cleanser is ₹350 and outperforms products ten times its price. Step two: a niacinamide serum. Ten percent, from Minimalist. ₹299.",
    ],
  },
  {
    title: "10 Investment Pieces Every Style-Conscious Woman Should Own",
    excerpt: "A Birkin isn't accessible. But these are — and they'll serve you just as well for the next decade.",
    category: Category.Fashion,
    tags: ['Womenswear', 'Investment', 'Wardrobe'],
    readTime: '6 min',
    body: [
      "The concept of the investment piece has been weaponised by luxury brands to justify almost any price point. Let's reclaim it.",
      "A genuine investment piece is something that costs more than feels comfortable but that you will still be wearing and loving in ten years.",
    ],
  },
  {
    title: "Best Smart Home Setup Under ₹50,000 in 2026",
    excerpt: "Automation isn't just for the wealthy. This is the exact setup we'd build today if starting from scratch.",
    category: Category.Tech,
    tags: ['Smart Home', 'Tech', 'Gadgets'],
    readTime: '9 min',
    body: [
      "The smart home conversation spent most of the last decade aimed at either the very wealthy or the very patient. In 2026, there's a third option.",
      "The foundation is a Matter-compatible hub. We're currently recommending the Apple HomePod mini for iOS households.",
      "From there: smart plugs on every appliance you might want to schedule, a smart lock on the main door, and two or three ambient lighting zones.",
    ],
  },
  {
    title: "Morning Routines of India's Most Admired Founders",
    excerpt: "The 5 AM club is a myth. What high-performers actually do with their first two hours is more interesting.",
    category: Category.Lifestyle,
    tags: ['Productivity', 'Founders', 'Routine'],
    readTime: '7 min',
    body: [
      "The mythology of the 5 AM wake-up has done serious damage to how we think about high performance.",
      "We spoke with twelve founders about how they actually start their days. Almost none of them wake before 6:30.",
      "The pattern isn't discipline. It's design. They've removed the decisions that drain willpower before noon.",
    ],
  },
];

const AUTHORS = [
  { email: 'arjun@velune.com', name: 'Arjun Mehta', role: Role.EDITOR },
  { email: 'priya@velune.com', name: 'Priya Kapoor', role: Role.AUTHOR },
  { email: 'neha@velune.com', name: 'Dr. Neha Sharma', role: Role.AUTHOR },
  { email: 'rohan@velune.com', name: 'Rohan Singhvi', role: Role.AUTHOR },
  { email: 'karan@velune.com', name: 'Karan Patel', role: Role.AUTHOR },
];

const AUTHOR_MAP = {
  Tech: 'arjun@velune.com',
  Fashion: 'priya@velune.com',
  Health: 'neha@velune.com',
  Lifestyle: 'rohan@velune.com',
  Grooming: 'karan@velune.com',
};

async function main() {
  console.log('Seeding Velune database...');

  const hashedPassword = await bcrypt.hash('Velune@2026', 10);

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@velune.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@velune.com',
      name: 'Velune Admin',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  // Authors
  const authorMap = {};
  for (const a of AUTHORS) {
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: { password: hashedPassword },
      create: { ...a, password: hashedPassword },
    });
    authorMap[a.email] = user.id;
  }

  // Articles
  for (const article of ARTICLES) {
    const slugBase = article.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 80);

    await prisma.article.upsert({
      where: { slug: slugBase },
      update: {},
      create: {
        slug: slugBase,
        title: article.title,
        excerpt: article.excerpt,
        body: article.body,
        category: article.category,
        status: ArticleStatus.PUBLISHED,
        featured: article.featured ?? false,
        hero: article.hero ?? false,
        tags: article.tags,
        readTime: article.readTime,
        publishedAt: new Date(),
        authorId: authorMap[AUTHOR_MAP[article.category]] || admin.id,
      },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
