require('dotenv').config();

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { migrate } = require('./migrate');

const DEFAULT_VENUE_IMAGE = '/assets/venue-placeholder.svg';
const DEFAULT_EVENT_IMAGES = ['/assets/event-1.svg', '/assets/event-2.svg'];

const manualVenues = [
  {
    name: 'Café Ån',
    category: 'Äta',
    district: 'Öster',
    address: 'Ågatan 12',
    description: 'Mysig fika vid vattnet med bakverk och kaffe.',
    website: 'https://example.com',
    phone: '036-00 00 01',
    image_url: DEFAULT_VENUE_IMAGE,
  },
  {
    name: 'Spira Kulturhus',
    category: 'Uppleva',
    district: 'Spira',
    address: 'Kulturvägen 1',
    description: 'Konserter, föreställningar och kultur året runt.',
    website: 'https://example.com',
    phone: '036-00 00 03',
    image_url: DEFAULT_VENUE_IMAGE,
  },
  {
    name: 'Stadshotellet',
    category: 'Sova',
    district: 'Resecentrum',
    address: 'Stationsgatan 2',
    description: 'Bo centralt med gångavstånd till allt.',
    website: 'https://example.com',
    phone: '036-00 00 04',
    image_url: DEFAULT_VENUE_IMAGE,
  },
  {
    name: 'City Galleria',
    category: 'Shoppa',
    district: 'Väster',
    address: 'Storgatan 5',
    description: 'Butiker, kedjor och lokala favoriter i samma kvarter.',
    website: 'https://example.com',
    phone: '036-00 00 02',
    image_url: DEFAULT_VENUE_IMAGE,
  },
];

const sampleEvents = [
  {
    title: 'City Walk: Historien i centrum',
    start_date: '2026-03-15',
    end_date: '2026-05-30',
    district: 'City',
    description: 'Digital och interaktiv stadsvandring genom centrala Jönköping.',
    image_url: DEFAULT_EVENT_IMAGES[0],
  },
  {
    title: 'Street Food Festival',
    start_date: '2026-05-22',
    end_date: '2026-05-24',
    district: 'Rådhusparken',
    description: 'Smaker från hela världen med mat, musik och kvällsliv.',
    image_url: DEFAULT_EVENT_IMAGES[1],
  },
  {
    title: 'Vår på Öster',
    start_date: '2026-04-18',
    end_date: '2026-04-18',
    district: 'Öster',
    description: 'Lokala aktörer på Öster bjuder in till kampanjer, aktiviteter och kvällsöppet.',
    image_url: DEFAULT_EVENT_IMAGES[0],
  },
];

function normalizeDistrict(district) {
  const value = String(district || '').trim();
  if (!value) return 'City';
  if (value === 'Stationen') return 'Resecentrum';
  return value;
}

function normalizeUrl(url) {
  if (!url) return '';
  const value = String(url).trim();
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/')) return `https://${value.slice(1)}`;
  return `https://${value}`;
}

function inferCategory(name = '') {
  const n = name.toLowerCase();
  if (/café|cafe|restaurang|food|bar|bistro|konditori|sushi|pizza|burger|coffee|te|bak/i.test(n)) return 'Äta';
  if (/hotel|vandrarhem|hostel|stay|boende/i.test(n)) return 'Sova';
  if (/museum|galleri|ateljé|atelje|konst|kultur|bio|theater|teater|musik|dive|upplevelse|event/i.test(n)) return 'Uppleva';
  return 'Shoppa';
}

function buildDescription(store) {
  const district = normalizeDistrict(store.district);
  const category = inferCategory(store.name);
  return `${store.name} är en venue i ${district}. Kategori: ${category}. Information hämtad från det utökade projektunderlaget.`;
}

function loadStoreVenues() {
  const filePath = path.join(__dirname, '..', 'data', 'stores.json');
  if (!fs.existsSync(filePath)) return [];

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const unique = new Map();

  for (const store of raw) {
    const name = String(store.name || '').trim();
    if (!name) continue;

    const key = name.toLowerCase();
    if (unique.has(key)) continue;

    unique.set(key, {
      name,
      category: inferCategory(name),
      district: normalizeDistrict(store.district),
      address: '',
      description: buildDescription(store),
      website: normalizeUrl(store.url),
      phone: '',
      image_url: DEFAULT_VENUE_IMAGE,
    });
  }

  return Array.from(unique.values());
}

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@citypulse.local';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(password, 10);

  await db.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, 'admin')
     ON CONFLICT (email)
     DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
    [email, hash]
  );
}

async function seedVenuesIfEmpty() {
  const { rows } = await db.query('SELECT COUNT(*)::int AS c FROM venues');
  if (rows[0].c > 0) return { inserted: 0, skipped: true };

  const venues = [...manualVenues, ...loadStoreVenues()];
  for (const v of venues) {
    await db.query(
      `INSERT INTO venues (name, category, district, address, description, website, phone, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [v.name, v.category, v.district, v.address, v.description, v.website, v.phone, v.image_url]
    );
  }

  return { inserted: venues.length, skipped: false };
}

async function seedEventsIfEmpty() {
  const { rows } = await db.query('SELECT COUNT(*)::int AS c FROM events');
  if (rows[0].c > 0) return { inserted: 0, skipped: true };

  for (const e of sampleEvents) {
    await db.query(
      `INSERT INTO events (title, start_date, end_date, district, description, image_url)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [e.title, e.start_date, e.end_date, e.district, e.description, e.image_url]
    );
  }

  return { inserted: sampleEvents.length, skipped: false };
}

async function bootstrap() {
  await migrate();
  await ensureAdmin();
  const venues = await seedVenuesIfEmpty();
  const events = await seedEventsIfEmpty();
  return { venues, events };
}

module.exports = {
  bootstrap,
  ensureAdmin,
  seedVenuesIfEmpty,
  seedEventsIfEmpty,
  loadStoreVenues,
};
