require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const db = require('./backend/db');
const { bootstrap } = require('./backend/bootstrap');
const { signToken, requireAuth } = require('./backend/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Static frontend
app.use('/', express.static(path.join(__dirname, 'public')));

// Health
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

// ---- Auth ----
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const { rows } = await db.query('SELECT id, email, password_hash, role FROM users WHERE email=$1', [email]);
  const user = rows[0];
  if (!user) return res.status(401).json({ message: 'Wrong credentials' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: 'Wrong credentials' });

  const token = signToken(user);
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

// ---- Venues REST ----
app.get('/api/venues', async (req, res) => {
  const { q, category, district, sort } = req.query;

  // Small, safe filtering
  const values = [];
  const where = [];

  if (q) {
    values.push(`%${q}%`);
    where.push(`(name ILIKE $${values.length} OR description ILIKE $${values.length})`);
  }
  if (category) {
    values.push(category);
    where.push(`category = $${values.length}`);
  }
  if (district) {
    values.push(district);
    where.push(`district = $${values.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sortSql = sort === 'name' ? 'ORDER BY name ASC' : sort === 'new' ? 'ORDER BY created_at DESC' : 'ORDER BY id ASC';

  const { rows } = await db.query(`SELECT * FROM venues ${whereSql} ${sortSql}` , values);
  res.json(rows);
});

app.get('/api/venues/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await db.query('SELECT * FROM venues WHERE id=$1', [id]);
  const venue = rows[0];
  if (!venue) return res.status(404).json({ message: 'Not found' });
  res.json(venue);
});

app.post('/api/venues', requireAuth, async (req, res) => {
  const v = req.body || {};
  if (!v.name || !v.category || !v.district) {
    return res.status(400).json({ message: 'name, category and district are required' });
  }

  const { rows } = await db.query(
    `INSERT INTO venues (name, category, district, address, description, website, phone, image_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [v.name, v.category, v.district, v.address || '', v.description || '', v.website || '', v.phone || '', v.image_url || '/assets/venue-placeholder.svg']
  );
  res.status(201).json(rows[0]);
});

app.put('/api/venues/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const v = req.body || {};

  const { rows: existingRows } = await db.query('SELECT * FROM venues WHERE id=$1', [id]);
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ message: 'Not found' });

  const updated = {
    name: v.name ?? existing.name,
    category: v.category ?? existing.category,
    district: v.district ?? existing.district,
    address: v.address ?? existing.address,
    description: v.description ?? existing.description,
    website: v.website ?? existing.website,
    phone: v.phone ?? existing.phone,
    image_url: v.image_url ?? existing.image_url
  };

  const { rows } = await db.query(
    `UPDATE venues
     SET name=$1, category=$2, district=$3, address=$4, description=$5, website=$6, phone=$7, image_url=$8
     WHERE id=$9
     RETURNING *`,
    [updated.name, updated.category, updated.district, updated.address, updated.description, updated.website, updated.phone, updated.image_url, id]
  );
  res.json(rows[0]);
});

app.delete('/api/venues/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { rowCount } = await db.query('DELETE FROM venues WHERE id=$1', [id]);
  if (rowCount === 0) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true });
});

// ---- Events ----
app.get('/api/events', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM events ORDER BY start_date ASC');
  res.json(rows);
});

app.post('/api/events', requireAuth, async (req, res) => {
  const e = req.body || {};
  if (!e.title || !e.start_date) return res.status(400).json({ message: 'title and start_date required' });
  const { rows } = await db.query(
    `INSERT INTO events (title, start_date, end_date, district, description, image_url)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [e.title, e.start_date, e.end_date || null, e.district || '', e.description || '', e.image_url || '/assets/event-1.svg']
  );
  res.status(201).json(rows[0]);
});

// Start (and ensure schema exists)
(async () => {
  try {
    const boot = await bootstrap();
    console.log('Bootstrap complete:', boot);
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
})();
