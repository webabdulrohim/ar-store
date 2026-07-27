const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { readDB, writeDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'ar-store-secret-key-2026-secure-token';

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Setup for Local File Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.png';
    cb(null, 'img-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Hanya file gambar (JPG, PNG, WEBP, GIF, SVG) yang diperbolehkan!'));
    }
    cb(null, true);
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to verify Admin JWT Token
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Akses ditolak! Token tidak ditemukan.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token tidak valid atau telah kadaluarsa.' });
    }
    req.admin = user;
    next();
  });
}

// -------------------------------------------------------------
// FILE UPLOAD API (LOCAL IMAGE UPLOAD)
// -------------------------------------------------------------
app.post('/api/admin/upload', authenticateAdmin, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (req.file) {
      const fileUrl = `/uploads/${req.file.filename}`;
      return res.json({ success: true, message: 'Gambar berhasil diunggah!', url: fileUrl });
    }

    // Check if body contains base64 image
    const { image_base64 } = req.body || {};
    if (image_base64 && typeof image_base64 === 'string') {
      try {
        const matches = image_base64.match(/^data:image\/([a-zA-Z0-9+\-+]+);base64,(.+)$/);
        let ext = '.png';
        let buffer;

        if (matches && matches.length === 3) {
          ext = '.' + (matches[1] === 'jpeg' ? 'jpg' : matches[1]);
          buffer = Buffer.from(matches[2], 'base64');
        } else {
          buffer = Buffer.from(image_base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        }

        const filename = 'img-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);

        const fileUrl = `/uploads/${filename}`;
        return res.json({ success: true, message: 'Gambar berhasil diunggah!', url: fileUrl });
      } catch (b64Err) {
        console.error("Error saving base64 image:", b64Err);
      }
    }

    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Gagal mengunggah gambar' });
    }

    return res.status(400).json({ success: false, message: 'Pilih file gambar untuk diunggah!' });
  });
});

// -------------------------------------------------------------
// CATEGORY MANAGEMENT APIS
// -------------------------------------------------------------

app.get('/api/categories', (req, res) => {
  const db = readDB();
  res.json({
    success: true,
    data: {
      product_categories: db.product_categories || [],
      service_categories: db.service_categories || []
    }
  });
});

app.post('/api/admin/categories', authenticateAdmin, (req, res) => {
  const { type, name } = req.body; // type: 'product' or 'service'
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi!' });
  }

  const db = readDB();
  const categoryName = name.trim();

  if (type === 'product') {
    if (db.product_categories.includes(categoryName)) {
      return res.status(400).json({ success: false, message: 'Kategori produk tersebut sudah ada!' });
    }
    db.product_categories.push(categoryName);
  } else {
    if (db.service_categories.includes(categoryName)) {
      return res.status(400).json({ success: false, message: 'Kategori jasa tersebut sudah ada!' });
    }
    db.service_categories.push(categoryName);
  }

  writeDB(db);
  res.json({ success: true, message: 'Kategori baru berhasil ditambahkan!' });
});

app.put('/api/admin/categories', authenticateAdmin, (req, res) => {
  const { type, oldName, newName } = req.body;
  if (!oldName || !newName || !newName.trim()) {
    return res.status(400).json({ success: false, message: 'Nama kategori tidak valid!' });
  }

  const db = readDB();
  const targetArray = type === 'product' ? db.product_categories : db.service_categories;
  const index = targetArray.indexOf(oldName);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Kategori lama tidak ditemukan!' });
  }

  targetArray[index] = newName.trim();

  // Also update items with old category name
  if (type === 'product') {
    db.products.forEach(p => {
      if (p.category === oldName) p.category = newName.trim();
    });
  } else {
    db.services.forEach(s => {
      if (s.category === oldName) s.category = newName.trim();
    });
  }

  writeDB(db);
  res.json({ success: true, message: 'Nama kategori berhasil diperbarui!' });
});

app.delete('/api/admin/categories', authenticateAdmin, (req, res) => {
  const { type, name } = req.body;
  const db = readDB();
  const targetArray = type === 'product' ? db.product_categories : db.service_categories;
  const index = targetArray.indexOf(name);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan!' });
  }

  targetArray.splice(index, 1);
  writeDB(db);
  res.json({ success: true, message: 'Kategori berhasil dihapus!' });
});

// -------------------------------------------------------------
// PUBLIC API ENDPOINTS
// -------------------------------------------------------------

app.get('/api/settings', (req, res) => {
  const db = readDB();
  const { admin_password_hash, ...publicSettings } = db.settings;
  res.json({ success: true, data: publicSettings });
});

app.get('/api/products', (req, res) => {
  const db = readDB();
  const { category, search } = req.query;
  let products = db.products || [];

  if (category && category !== 'Semua') {
    products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
  }

  res.json({ success: true, data: products });
});

app.get('/api/products/:id', (req, res) => {
  const db = readDB();
  const product = db.products.find(p => p.id === parseInt(req.params.id));
  if (!product) {
    return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
  }
  res.json({ success: true, data: product });
});

app.get('/api/services', (req, res) => {
  const db = readDB();
  const { category, search } = req.query;
  let services = db.services || [];

  if (category && category !== 'Semua') {
    services = services.filter(s => s.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    services = services.filter(s => s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q)));
  }

  res.json({ success: true, data: services });
});

app.get('/api/services/:id', (req, res) => {
  const db = readDB();
  const service = db.services.find(s => s.id === parseInt(req.params.id));
  if (!service) {
    return res.status(404).json({ success: false, message: 'Layanan jasa tidak ditemukan.' });
  }
  res.json({ success: true, data: service });
});

app.get('/api/fake-notifications', (req, res) => {
  const db = readDB();
  res.json({ success: true, data: db.fake_notifications || [] });
});

// -------------------------------------------------------------
// ADMIN AUTHENTICATION
// -------------------------------------------------------------

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();

  if (username !== db.settings.admin_username) {
    return res.status(400).json({ success: false, message: 'Username atau password admin salah!' });
  }

  const isValidPassword = bcrypt.compareSync(password, db.settings.admin_password_hash);
  if (!isValidPassword) {
    return res.status(400).json({ success: false, message: 'Username atau password admin salah!' });
  }

  const token = jwt.sign({ username: db.settings.admin_username, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, message: 'Login Admin Berhasil!', token });
});

app.get('/api/admin/verify', authenticateAdmin, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// -------------------------------------------------------------
// ADMIN CRUD: DIGITAL PRODUCTS
// -------------------------------------------------------------

app.post('/api/admin/products', authenticateAdmin, (req, res) => {
  const db = readDB();
  const { name, category, price, original_price, image_url, description, badge, fake_sales, fake_rating, is_available, input_fields } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ success: false, message: 'Nama, kategori, dan harga wajib diisi!' });
  }

  const newId = db.products.length > 0 ? Math.max(...db.products.map(p => p.id)) + 1 : 1;
  const newProduct = {
    id: newId,
    name,
    category,
    price: Number(price),
    original_price: original_price ? Number(original_price) : Number(price),
    image_url: image_url || '/favicon.svg',
    description: description || '',
    badge: badge || '',
    fake_sales: fake_sales !== undefined ? Number(fake_sales) : 100,
    fake_rating: fake_rating !== undefined ? Number(fake_rating) : 4.9,
    rating_count: Math.floor(Number(fake_sales || 100) * 0.25),
    is_available: is_available !== undefined ? Boolean(is_available) : true,
    input_fields: Array.isArray(input_fields) ? input_fields : [
      { label: "ID Pelanggan / User ID", name: "user_id", required: true, type: "text" }
    ],
    created_at: new Date().toISOString()
  };

  db.products.unshift(newProduct);
  writeDB(db);

  res.json({ success: true, message: 'Produk digital berhasil ditambahkan!', data: newProduct });
});

app.put('/api/admin/products/:id', authenticateAdmin, (req, res) => {
  const db = readDB();
  const productId = parseInt(req.params.id);
  const index = db.products.findIndex(p => p.id === productId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
  }

  const current = db.products[index];
  const { name, category, price, original_price, image_url, description, badge, fake_sales, fake_rating, is_available, input_fields } = req.body;

  db.products[index] = {
    ...current,
    name: name !== undefined ? name : current.name,
    category: category !== undefined ? category : current.category,
    price: price !== undefined ? Number(price) : current.price,
    original_price: original_price !== undefined ? Number(original_price) : current.original_price,
    image_url: image_url !== undefined ? image_url : current.image_url,
    description: description !== undefined ? description : current.description,
    badge: badge !== undefined ? badge : current.badge,
    fake_sales: fake_sales !== undefined ? Number(fake_sales) : current.fake_sales,
    fake_rating: fake_rating !== undefined ? Number(fake_rating) : current.fake_rating,
    is_available: is_available !== undefined ? Boolean(is_available) : current.is_available,
    input_fields: input_fields !== undefined ? input_fields : current.input_fields,
    updated_at: new Date().toISOString()
  };

  writeDB(db);
  res.json({ success: true, message: 'Produk digital berhasil diperbarui!', data: db.products[index] });
});

app.delete('/api/admin/products/:id', authenticateAdmin, (req, res) => {
  const db = readDB();
  const productId = parseInt(req.params.id);
  const index = db.products.findIndex(p => p.id === productId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
  }

  db.products.splice(index, 1);
  writeDB(db);
  res.json({ success: true, message: 'Produk digital berhasil dihapus!' });
});

// -------------------------------------------------------------
// ADMIN CRUD: SERVICES (JASA)
// -------------------------------------------------------------

app.post('/api/admin/services', authenticateAdmin, (req, res) => {
  const db = readDB();
  const { name, category, price_range, image_url, description, duration, features, is_available } = req.body;

  if (!name || !category) {
    return res.status(400).json({ success: false, message: 'Nama dan kategori jasa wajib diisi!' });
  }

  const newId = db.services.length > 0 ? Math.max(...db.services.map(s => s.id)) + 1 : 1;
  const newService = {
    id: newId,
    name,
    category,
    price_range: price_range || 'Mulai Rp 50.000',
    image_url: image_url || '/favicon.svg',
    description: description || '',
    duration: duration || 'Proses Cepat',
    features: Array.isArray(features) ? features : ["Garansi Resmi", "Teknisi Berpengalaman"],
    is_available: is_available !== undefined ? Boolean(is_available) : true,
    created_at: new Date().toISOString()
  };

  db.services.unshift(newService);
  writeDB(db);

  res.json({ success: true, message: 'Layanan jasa berhasil ditambahkan!', data: newService });
});

app.put('/api/admin/services/:id', authenticateAdmin, (req, res) => {
  const db = readDB();
  const serviceId = parseInt(req.params.id);
  const index = db.services.findIndex(s => s.id === serviceId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Jasa tidak ditemukan.' });
  }

  const current = db.services[index];
  const { name, category, price_range, image_url, description, duration, features, is_available } = req.body;

  db.services[index] = {
    ...current,
    name: name !== undefined ? name : current.name,
    category: category !== undefined ? category : current.category,
    price_range: price_range !== undefined ? price_range : current.price_range,
    image_url: image_url !== undefined ? image_url : current.image_url,
    description: description !== undefined ? description : current.description,
    duration: duration !== undefined ? duration : current.duration,
    features: features !== undefined ? features : current.features,
    is_available: is_available !== undefined ? Boolean(is_available) : current.is_available,
    updated_at: new Date().toISOString()
  };

  writeDB(db);
  res.json({ success: true, message: 'Layanan jasa berhasil diperbarui!', data: db.services[index] });
});

app.delete('/api/admin/services/:id', authenticateAdmin, (req, res) => {
  const db = readDB();
  const serviceId = parseInt(req.params.id);
  const index = db.services.findIndex(s => s.id === serviceId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Jasa tidak ditemukan.' });
  }

  db.services.splice(index, 1);
  writeDB(db);
  res.json({ success: true, message: 'Layanan jasa berhasil dihapus!' });
});

// -------------------------------------------------------------
// ADMIN CRUD: FAKE SALES NOTIFICATIONS
// -------------------------------------------------------------

app.post('/api/admin/fake-notifications', authenticateAdmin, (req, res) => {
  const db = readDB();
  const { buyer_name, city, item_name, time_ago } = req.body;

  if (!buyer_name || !item_name) {
    return res.status(400).json({ success: false, message: 'Nama pembeli dan produk/jasa wajib diisi!' });
  }

  const colors = ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ef4444'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const newId = db.fake_notifications.length > 0 ? Math.max(...db.fake_notifications.map(f => f.id)) + 1 : 1;
  const newNotif = {
    id: newId,
    buyer_name,
    city: city || 'Indonesia',
    item_name,
    time_ago: time_ago || 'Baru saja',
    avatar_bg: randomColor
  };

  db.fake_notifications.unshift(newNotif);
  writeDB(db);

  res.json({ success: true, message: 'Notifikasi penjualan fake berhasil ditambahkan!', data: newNotif });
});

app.delete('/api/admin/fake-notifications/:id', authenticateAdmin, (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  const index = db.fake_notifications.findIndex(f => f.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Notifikasi tidak ditemukan.' });
  }

  db.fake_notifications.splice(index, 1);
  writeDB(db);
  res.json({ success: true, message: 'Notifikasi berhasil dihapus!' });
});

// -------------------------------------------------------------
// ADMIN SETTINGS MANAGEMENT
// -------------------------------------------------------------

app.put('/api/admin/settings', authenticateAdmin, (req, res) => {
  const db = readDB();
  const { store_name, tagline, whatsapp_number, enable_fake_notif, fake_notif_interval, admin_password, site_title, site_description, banner_url, logo_url } = req.body;

  if (store_name !== undefined) db.settings.store_name = store_name;
  if (tagline !== undefined) db.settings.tagline = tagline;
  if (whatsapp_number !== undefined) db.settings.whatsapp_number = whatsapp_number;
  if (enable_fake_notif !== undefined) db.settings.enable_fake_notif = Boolean(enable_fake_notif);
  if (fake_notif_interval !== undefined) db.settings.fake_notif_interval = Number(fake_notif_interval);
  if (site_title !== undefined) db.settings.site_title = site_title;
  if (site_description !== undefined) db.settings.site_description = site_description;
  if (banner_url !== undefined) db.settings.banner_url = banner_url;
  if (logo_url !== undefined) db.settings.logo_url = logo_url;

  if (admin_password && admin_password.trim() !== '') {
    db.settings.admin_password_hash = bcrypt.hashSync(admin_password, 10);
  }

  writeDB(db);
  res.json({ success: true, message: 'Pengaturan toko berhasil diperbarui!' });
});

// SPA Fallback Route
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 AR-Store Server running at http://localhost:${PORT}`);
});
