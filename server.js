const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const { v4: uuid } = require('uuid');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── DATA FILE (persists on Render disk) ─────────────────────────────────────
const DATA_FILE = path.join(__dirname, 'data.json');

function readDB() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch(e) {}
  return {
    pos: [],
    colorVendors: [
      'RKP CHEMICALS',
      'UNIVERSAL',
      'PRERAK DYES & CHEMICALS CO.',
      'RAM RATAN & CO.',
      'MADHAV INTERNATIONAL'
    ],
    chemVendors: [
      'RKP CHEMICALS',
      'UNIVERSAL AGENCY',
      'SARAL DYE',
      'PRERAK DYE',
      'PYREX',
      'RAM RATAN',
      'JAI GURUDAV TRADING',
      'CHEMICAL DISTRIBUTOR',
      'BRIJ PRODUCT',
      'R.S.R.O WATER SOLUTION',
      'DWARKA DAS JAGANNATH',
      'BLUE TEX PVT LTD',
      'KESHAV INDUSTRIES',
      'ASSOCIATED TRADERS',
      'AQUATECH ENGINEERS',
      'AGRAWAL GUM MANUFACTURING CO. PVT. LTD.',
      'SHREE PANCHRATNA',
      'MADHAV INTERNATIONAL',
      'HIREN FABRIC',
      'DIVYA ART',
      'SHIVA ORGANICS',
      'ISCON CHEMICALS',
      'HARI HAR SHARAN & SONS',
      'PRAKASH CHEMICALS',
      'KHANDELWAL ORGOSOL PVT LTD',
      'SHILPA DYEING & PRINTING MILLS',
      'EVEREST FAB',
      'DHANKOTHARI SALES',
      'PARUL SILK MILK',
      'STARLIT ENTERPRISES'
    ],
  };
}

// Force-reset vendors to fresh list (call once via /api/reset-vendors)
app.get('/api/reset-vendors', (req, res) => {
  const db = readDB();
  db.colorVendors = [
    'RKP CHEMICALS',
    'UNIVERSAL',
    'PRERAK DYES & CHEMICALS CO.',
    'RAM RATAN & CO.',
    'MADHAV INTERNATIONAL'
  ];
  db.chemVendors = [
    'RKP CHEMICALS',
    'UNIVERSAL AGENCY',
    'SARAL DYE',
    'PRERAK DYE',
    'PYREX',
    'RAM RATAN',
    'JAI GURUDAV TRADING',
    'CHEMICAL DISTRIBUTOR',
    'BRIJ PRODUCT',
    'R.S.R.O WATER SOLUTION',
    'DWARKA DAS JAGANNATH',
    'BLUE TEX PVT LTD',
    'KESHAV INDUSTRIES',
    'ASSOCIATED TRADERS',
    'AQUATECH ENGINEERS',
    'AGRAWAL GUM MANUFACTURING CO. PVT. LTD.',
    'SHREE PANCHRATNA',
    'MADHAV INTERNATIONAL',
    'HIREN FABRIC',
    'DIVYA ART',
    'SHIVA ORGANICS',
    'ISCON CHEMICALS',
    'HARI HAR SHARAN & SONS',
    'PRAKASH CHEMICALS',
    'KHANDELWAL ORGOSOL PVT LTD',
    'SHILPA DYEING & PRINTING MILLS',
    'EVEREST FAB',
    'DHANKOTHARI SALES',
    'PARUL SILK MILK',
    'STARLIT ENTERPRISES'
  ];
  writeDB(db);
  res.json({ ok: true, colorVendors: db.colorVendors, chemVendors: db.chemVendors });
});

function writeDB(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

// ── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '20mb' })); // big enough for base64 images
app.use(express.static(path.join(__dirname, 'public')));

// ── API ROUTES ───────────────────────────────────────────────────────────────

// GET all POs (optionally filter by type)
app.get('/api/pos', (req, res) => {
  const db   = readDB();
  const type = req.query.type;
  const pos  = type ? db.pos.filter(p => p.type === type) : db.pos;
  res.json(pos);
});

// POST create new PO
app.post('/api/pos', (req, res) => {
  const db = readDB();
  const po = { ...req.body, id: uuid(), createdAt: new Date().toISOString() };
  db.pos.push(po);
  writeDB(db);
  res.json(po);
});

// PATCH update a PO (mark step done, add receiving, cancel, etc.)
app.patch('/api/pos/:id', (req, res) => {
  const db  = readDB();
  const idx = db.pos.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'PO not found' });
  db.pos[idx] = { ...db.pos[idx], ...req.body };
  writeDB(db);
  res.json(db.pos[idx]);
});

// DELETE a PO (used in FY reset)
app.delete('/api/pos/type/:type', (req, res) => {
  const db  = readDB();
  db.pos    = db.pos.filter(p => p.type !== req.params.type);
  writeDB(db);
  res.json({ ok: true });
});

// GET vendors
app.get('/api/vendors', (req, res) => {
  const db   = readDB();
  const type = req.query.type;
  res.json(type === 'COLOR' ? db.colorVendors : db.chemVendors);
});

// POST add vendor
app.post('/api/vendors', (req, res) => {
  const db   = readDB();
  const { type, name } = req.body;
  const key  = type === 'COLOR' ? 'colorVendors' : 'chemVendors';
  if (!db[key].includes(name)) db[key].push(name);
  writeDB(db);
  res.json(db[key]);
});

// DELETE vendor
app.delete('/api/vendors', (req, res) => {
  const db   = readDB();
  const { type, name } = req.body;
  const key  = type === 'COLOR' ? 'colorVendors' : 'chemVendors';
  db[key]    = db[key].filter(v => v !== name);
  writeDB(db);
  res.json(db[key]);
});

// ── SERVE FRONTEND ───────────────────────────────────────────────────────────
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log('FMS server running on port', PORT));
