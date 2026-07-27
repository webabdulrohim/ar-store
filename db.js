const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'database.json');

const defaultData = {
  settings: {
    store_name: "AR-Store",
    tagline: "Pusat Aplikasi Premium, Sosmed Boost, Source Code & Jasa Service #1",
    whatsapp_number: "081214932916",
    enable_fake_notif: true,
    fake_notif_interval: 10,
    admin_username: "admin",
    admin_password_hash: bcrypt.hashSync("admin123", 10),
    site_title: "AR-Store - Aplikasi Premium, Followers Sosmed, Source Code & Jasa Service",
    site_description: "Jual Canva Pro, Youtube Premium, Followers Instagram, Likes, Views TikTok, Source Code Web & Script Bot WA serta Booking Jasa Service HP, Laptop/PC, AC, Mesin Cuci.",
    logo_url: "/favicon.svg",
    banner_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80"
  },
  product_categories: [
    "Aplikasi Premium",
    "Streaming & Video",
    "SMM / Social Media",
    "Source Code & Script",
    "Voucher & Lainnya"
  ],
  service_categories: [
    "Service HP",
    "Service Laptop/PC",
    "Service AC",
    "Service Mesin Cuci",
    "Jasa Lainnya"
  ],
  products: [
    {
      id: 1,
      name: "Canva Pro 1 Tahun (Invite Email Kamu)",
      category: "Aplikasi Premium",
      price: 25000,
      original_price: 75000,
      image_url: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80",
      description: "Invite Canva Pro ke akun pribadi kamu. Bebas akses 100M+ elemen premium, hapus background foto 1-klik, brand kit, & AI design 1 tahun full garansi.",
      badge: "BEST SELLER",
      fake_sales: 4850,
      fake_rating: 4.9,
      rating_count: 1240,
      is_available: true,
      input_fields: [
        { label: "Email Canva Kamu", name: "email", required: true, type: "email" },
        { label: "No. WhatsApp Aktif", name: "wa_number", required: true, type: "tel" }
      ],
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: "YouTube Premium 1 Bulan (No Ads & Background Play)",
      category: "Streaming & Video",
      price: 15000,
      original_price: 45000,
      image_url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80",
      description: "Nonton YouTube bebas iklan tanpa gangguan, download video offline, & akses YouTube Music Premium. Legal 100% via Undangan Keluarga.",
      badge: "PROMO",
      fake_sales: 3920,
      fake_rating: 4.9,
      rating_count: 980,
      is_available: true,
      input_fields: [
        { label: "Email Gmail YouTube", name: "email", required: true, type: "email" }
      ],
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: "1.000 Followers Instagram (Permanen & Garansi)",
      category: "SMM / Social Media",
      price: 35000,
      original_price: 65000,
      image_url: "https://images.unsplash.com/photo-1611262588024-d12430b98920?auto=format&fit=crop&w=600&q=80",
      description: "Layanan tambah Followers InstagramHQ. Proses cepat 1-24 jam. Tanpa butuh password akun (hanya link username/profile).",
      badge: "HOT",
      fake_sales: 5120,
      fake_rating: 4.8,
      rating_count: 1450,
      is_available: true,
      input_fields: [
        { label: "Link / Username Instagram", name: "ig_link", required: true, type: "text" }
      ],
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      name: "Source Code Web Toko Online WhatsApp (Fullstack Node.js + Express)",
      category: "Source Code & Script",
      price: 149000,
      original_price: 350000,
      image_url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80",
      description: "Full Source Code toko online modern terintegrasi WhatsApp, Panel Admin CRUD, Fake Sales Notif, Full SEO & Responsive Mobile. Siap deploy!",
      badge: "EXCLUSIVE",
      fake_sales: 1280,
      fake_rating: 5.0,
      rating_count: 310,
      is_available: true,
      input_fields: [
        { label: "Email Google Drive Pengiriman", name: "email", required: true, type: "email" },
        { label: "No. WhatsApp Pembeli", name: "wa", required: true, type: "tel" }
      ],
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      name: "CapCut Pro Premium 1 Tahun",
      category: "Aplikasi Premium",
      price: 30000,
      original_price: 90000,
      image_url: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80",
      description: "Unlock semua fitur CapCut Pro: Efek AI, Transisi Pro, Text-to-Speech Pro, Tanpa Watermark, Cloud Storage. Garansi Full 1 Tahun.",
      badge: "POPULER",
      fake_sales: 2150,
      fake_rating: 4.9,
      rating_count: 540,
      is_available: true,
      input_fields: [
        { label: "Email Akun CapCut", name: "email", required: true, type: "email" }
      ],
      created_at: new Date().toISOString()
    },
    {
      id: 6,
      name: "1.000 Likes Postingan Instagram",
      category: "SMM / Social Media",
      price: 15000,
      original_price: 30000,
      image_url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
      description: "Tambah Likes di postingan foto / reels Instagram kamu. Bikin feed dan konten kamu makin ramai & masuk Explore!",
      badge: "HEMAT",
      fake_sales: 3410,
      fake_rating: 4.8,
      rating_count: 790,
      is_available: true,
      input_fields: [
        { label: "Link Post/Reels Instagram", name: "post_link", required: true, type: "text" }
      ],
      created_at: new Date().toISOString()
    },
    {
      id: 7,
      name: "Source Code Script Bot WhatsApp Multi-Device (Auto Order / Responder)",
      category: "Source Code & Script",
      price: 99000,
      original_price: 250000,
      image_url: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=600&q=80",
      description: "Script Bot WhatsApp Baileys MD. Fitur balasan otomatis, blast pesan, auto responder toko online, gampang diinstal di VPS / Panel.",
      badge: "REKOMENDASI",
      fake_sales: 890,
      fake_rating: 4.9,
      rating_count: 210,
      is_available: true,
      input_fields: [
        { label: "Email Pengiriman File ZIP", name: "email", required: true, type: "email" }
      ],
      created_at: new Date().toISOString()
    },
    {
      id: 8,
      name: "ChatGPT Plus & Claude 3.5 Sonnet Pro 1 Bulan (Shared/Private)",
      category: "Aplikasi Premium",
      price: 45000,
      original_price: 120000,
      image_url: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=600&q=80",
      description: "Akses AI Tercanggih GPT-4o & Claude 3.5 Sonnet tanpa batasan limit gratisan. Cocok untuk programmer, penulisan artikel & analisis.",
      badge: "HOT AI",
      fake_sales: 1950,
      fake_rating: 4.9,
      rating_count: 480,
      is_available: true,
      input_fields: [
        { label: "No. WhatsApp Pengiriman Login", name: "wa", required: true, type: "tel" }
      ],
      created_at: new Date().toISOString()
    }
  ],
  services: [
    {
      id: 1,
      name: "Service HP - Ganti Baterai & LCD",
      category: "Service HP",
      price_range: "Mulai Rp 75.000",
      image_url: "https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?auto=format&fit=crop&w=600&q=80",
      description: "Perbaikan Smartphone Android & iPhone (Ganti LCD Pecah, Baterai Kembung, Mati Total, Lupa Pola, IC Power). Sparepart Asli & Garansi 30 Hari.",
      duration: "1 - 3 Jam (Bisa Ditunggu)",
      features: ["Sparepart Original", "Garansi 30 Hari", "Bisa Ditunggu", "Cek Kerusakan Gratis"],
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: "Service Laptop/PC - Ganti Thermal Paste & Install Ulang",
      category: "Service Laptop/PC",
      price_range: "Mulai Rp 50.000",
      image_url: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80",
      description: "Servis Komputer / Laptop Lemot, Panas / Overheat, Mati Total, Ganti Keyboard, Upgrade SSD/RAM, Cleaning Hardware & Install Windows Original.",
      duration: "Same-Day Service",
      features: ["Upgrade SSD & RAM", "Pembersihan Debu & Thermal Paste Premium", "Bonus Software", "Garansi Service"],
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: "Service AC - Cuci AC Split & Isi Freon",
      category: "Service AC",
      price_range: "Mulai Rp 60.000",
      image_url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
      description: "Perawatan & Perbaikan AC Rumah / Kantor: Cuci AC Berkala, AC Bocor Air, AC Tidak Dingin, Tambah/Isi Freon R32/R410/R22, Bongkar Pasang AC.",
      duration: "Teknisi Datang ke Rumah",
      features: ["Penyemprotan Bersih Detail", "Pengecekan Tekanan Freon", "Teknisi Berpengalaman", "Layanan Panggil Rumah"],
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      name: "Service Mesin Cuci - Matot / Tidak Bisa Pengering",
      category: "Service Mesin Cuci",
      price_range: "Mulai Rp 85.000",
      image_url: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80",
      description: "Servis Mesin Cuci 1 Tabung / 2 Tabung / Front Loading: Air Tidak Keluar, Suara Bising, Timer Rusak, Pengering Mati, Dinamo Terbakar.",
      duration: "Layanan On-site (Dipanggil)",
      features: ["Garansi Komponen 1 Bulan", "Suku Cadang Berkualitas", "Teknisi Jujur & Transparan"],
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      name: "Jasa Instalasi CCTV & Networking WiFi",
      category: "Jasa Lainnya",
      price_range: "Sesuai Kebutuhan (Survey Gratis)",
      image_url: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80",
      description: "Pemasangan Paket CCTV Online HD 4-8 Kamera, Setting Mikrotik, Perapihan Kabel LAN, Perluasan Jaringan WiFi Rumah & Kantor.",
      duration: "Jadwal Fleksibel",
      features: ["Monitoring via HP 24 Jam", "Kabel Rapi & Aman", "Free Survey & Konsultasi"],
      is_available: true,
      created_at: new Date().toISOString()
    }
  ],
  fake_notifications: [
    { id: 1, buyer_name: "Budi Santoso", city: "Jakarta Selatan", item_name: "Canva Pro 1 Tahun", time_ago: "2 menit yang lalu", avatar_bg: "#6366f1" },
    { id: 2, buyer_name: "Ahmad Rizky", city: "Bandung", item_name: "Source Code Web Toko Online WA", time_ago: "5 menit yang lalu", avatar_bg: "#a855f7" },
    { id: 3, buyer_name: "Siti Rahma", city: "Surabaya", item_name: "YouTube Premium 1 Bulan", time_ago: "7 menit yang lalu", avatar_bg: "#ec4899" },
    { id: 4, buyer_name: "Dedi Kurniawan", city: "Bekasi", item_name: "1.000 Followers Instagram", time_ago: "12 menit yang lalu", avatar_bg: "#10b981" },
    { id: 5, buyer_name: "Fajri Hidayat", city: "Medan", item_name: "CapCut Pro Premium", time_ago: "15 menit yang lalu", avatar_bg: "#f59e0b" },
    { id: 6, buyer_name: "Intan Permata", city: "Tangerang", item_name: "Script Bot WhatsApp Auto Order", time_ago: "18 menit yang lalu", avatar_bg: "#06b6d4" },
    { id: 7, buyer_name: "Hendra Wijaya", city: "Semarang", item_name: "ChatGPT Plus & Claude Pro", time_ago: "24 menit yang lalu", avatar_bg: "#8b5cf6" },
    { id: 8, buyer_name: "Rina Kusuma", city: "Depok", item_name: "Service Laptop Clean & Pasting", time_ago: "30 menit yang lalu", avatar_bg: "#ef4444" }
  ]
};

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const data = JSON.parse(raw);
    // Ensure product_categories and service_categories exist
    if (!data.product_categories) data.product_categories = defaultData.product_categories;
    if (!data.service_categories) data.service_categories = defaultData.service_categories;
    return data;
  } catch (err) {
    console.error("Error reading database file, resetting to default", err);
    return defaultData;
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  readDB,
  writeDB
};
