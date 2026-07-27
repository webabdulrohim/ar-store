/* Main Frontend Application Engine */

let storeState = {
  settings: {},
  products: [],
  services: [],
  fakeNotifs: [],
  activeCategory: 'Semua',
  activeSection: 'digital', // 'digital' or 'services'
  currentProduct: null,
  currentService: null,
  currentShareItem: null
};

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  await fetchSettingsAndNotifs();
  await fetchProducts();
  await fetchServices();

  // Auto open admin modal if URL contains /admin or /login
  if (window.location.pathname.includes('/admin') || window.location.pathname.includes('/login') || window.location.search.includes('admin')) {
    openAdminModal();
  }
}

// -------------------------------------------------------------
// DATA FETCHERS
// -------------------------------------------------------------

async function fetchSettingsAndNotifs() {
  try {
    const [setRes, notifRes] = await Promise.all([
      fetch('/api/settings'),
      fetch('/api/fake-notifications')
    ]);

    const setData = await setRes.json();
    const notifData = await notifRes.json();

    if (setData.success) {
      storeState.settings = setData.data;
      updateUIWithSettings();
    }

    if (notifData.success) {
      storeState.fakeNotifs = notifData.data;
      fakeNotifManager.init(
        storeState.fakeNotifs,
        storeState.settings.enable_fake_notif,
        storeState.settings.fake_notif_interval
      );
    }
  } catch (err) {
    console.error("Error loading store configuration:", err);
  }
}

function updateUIWithSettings() {
  const s = storeState.settings;
  if (!s) return;

  if (s.store_name) {
    document.getElementById('displayStoreName').textContent = s.store_name;
  }
  if (s.tagline) {
    document.getElementById('displayTagline').textContent = s.tagline;
  }
  if (s.whatsapp_number) {
    document.getElementById('displayWaNum').textContent = s.whatsapp_number;
    document.getElementById('displayWaFooter').textContent = s.whatsapp_number;
  }
  if (s.banner_url) {
    document.getElementById('displayBanner').src = s.banner_url;
  }
  if (s.logo_url) {
    const logoEl = document.getElementById('displayStoreLogo');
    if (logoEl) logoEl.src = s.logo_url;
  }

  // Update SEO
  SEO.updateMeta({
    title: s.site_title || `${s.store_name} - Produk Digital & Jasa Service`,
    description: s.site_description || s.tagline,
    url: window.location.href
  });
}

async function fetchProducts(category = 'Semua', search = '') {
  try {
    let url = `/api/products?`;
    if (category && category !== 'Semua') url += `category=${encodeURIComponent(category)}&`;
    if (search) url += `search=${encodeURIComponent(search)}`;

    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      storeState.products = data.data;
      renderProductsGrid();
      renderCategoryBar();
    }
  } catch (err) {
    console.error("Gagal memuat produk digital:", err);
  }
}

async function fetchServices(category = 'Semua', search = '') {
  try {
    let url = `/api/services?`;
    if (category && category !== 'Semua') url += `category=${encodeURIComponent(category)}&`;
    if (search) url += `search=${encodeURIComponent(search)}`;

    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      storeState.services = data.data;
      renderServicesGrid();
    }
  } catch (err) {
    console.error("Gagal memuat layanan jasa:", err);
  }
}

// -------------------------------------------------------------
// UI RENDERERS
// -------------------------------------------------------------

async function renderCategoryBar() {
  const container = document.getElementById('categoryBar');
  if (!container) return;

  let categories = ['Semua'];
  try {
    const res = await fetch('/api/categories');
    const data = await res.json();
    if (data.success) {
      if (storeState.activeSection === 'digital') {
        categories = ['Semua', ...data.data.product_categories];
      } else {
        categories = ['Semua', ...data.data.service_categories];
      }
    }
  } catch (err) {
    if (storeState.activeSection === 'digital') {
      categories = ['Semua', 'Aplikasi Premium', 'Streaming & Video', 'SMM / Social Media', 'Source Code & Script'];
    } else {
      categories = ['Semua', 'Service HP', 'Service Laptop/PC', 'Service AC', 'Service Mesin Cuci', 'Jasa Lainnya'];
    }
  }

  container.innerHTML = categories.map(cat => `
    <button class="cat-pill ${storeState.activeCategory === cat ? 'active' : ''}" onclick="handleCategorySelect('${cat}')">
      ${getCategoryIcon(cat)} ${cat}
    </button>
  `).join('');
}

function getCategoryIcon(cat) {
  switch (cat) {
    case 'Aplikasi Premium': return '<i class="fa-solid fa-crown text-gold"></i>';
    case 'Streaming & Video': return '<i class="fa-solid fa-circle-play text-red"></i>';
    case 'SMM / Social Media': return '<i class="fa-solid fa-chart-line text-purple"></i>';
    case 'Source Code & Script': return '<i class="fa-solid fa-code text-cyan"></i>';
    case 'Service HP': return '<i class="fa-solid fa-mobile-screen-button"></i>';
    case 'Service Laptop/PC': return '<i class="fa-solid fa-laptop"></i>';
    case 'Service AC': return '<i class="fa-solid fa-snowflake"></i>';
    case 'Service Mesin Cuci': return '<i class="fa-solid fa-soap"></i>';
    case 'Jasa Lainnya': return '<i class="fa-solid fa-ellipsis"></i>';
    default: return '<i class="fa-solid fa-border-all"></i>';
  }
}

function renderProductsGrid() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  if (storeState.products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="fa-solid fa-box-open" style="font-size: 3rem; margin-bottom: 10px;"></i>
        <p>Tidak ada produk digital yang ditemukan.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = storeState.products.map(p => `
    <div class="product-card" onclick="openProductModal(${p.id})">
      <div class="card-img-wrapper">
        <img src="${p.image_url}" alt="${p.name}" class="card-img" loading="lazy">
        ${p.badge ? `<span class="card-badge">${p.badge}</span>` : ''}
      </div>
      <div class="card-body">
        <span class="card-category">${p.category}</span>
        <h3 class="card-title">${p.name}</h3>
        
        <div class="card-fake-stats">
          <span><i class="fa-solid fa-fire text-gold"></i> ${p.fake_sales ? p.fake_sales.toLocaleString('id-ID') : 100}+ Terjual</span>
          <span><i class="fa-solid fa-star text-yellow"></i> ${p.fake_rating || 4.9}</span>
        </div>

        <div class="card-price-row">
          <div class="price-group">
            ${p.original_price && p.original_price > p.price ? `<span class="price-orig">Rp ${p.original_price.toLocaleString('id-ID')}</span>` : ''}
            <span class="price-current">Rp ${p.price.toLocaleString('id-ID')}</span>
          </div>
          <button class="btn-buy-card" title="Beli Via WhatsApp">
            <i class="fa-brands fa-whatsapp"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderServicesGrid() {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;

  if (storeState.services.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="fa-solid fa-screwdriver-wrench" style="font-size: 3rem; margin-bottom: 10px;"></i>
        <p>Tidak ada layanan jasa yang ditemukan.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = storeState.services.map(s => `
    <div class="service-card" onclick="openServiceModal(${s.id})">
      <div class="service-img-wrapper">
        <img src="${s.image_url}" alt="${s.name}" class="service-img" loading="lazy">
        <span class="service-category-tag">${s.category}</span>
      </div>
      <div class="service-body">
        <h3 class="service-title">${s.name}</h3>
        <p class="service-desc">${s.description}</p>

        <div class="service-features-mini">
          ${(s.features || ["Garansi Resmi", "Teknisi Berpengalaman"]).map(f => `<span class="sf-chip"><i class="fa-solid fa-check text-green"></i> ${f}</span>`).join('')}
        </div>

        <div class="service-footer">
          <span class="service-price">${s.price_range}</span>
          <button class="btn btn-secondary glass" style="padding: 6px 14px; font-size: 0.8rem;">
            <i class="fa-solid fa-calendar-check"></i> Booking Jasa
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// -------------------------------------------------------------
// NAVIGATION & FILTERS
// -------------------------------------------------------------

function switchSection(section) {
  storeState.activeSection = section;
  storeState.activeCategory = 'Semua';

  const digitalSection = document.getElementById('digital-section');
  const servicesSection = document.getElementById('services-section');
  const tabDigitalBtn = document.getElementById('tabDigitalBtn');
  const tabServicesBtn = document.getElementById('tabServicesBtn');

  const mnHome = document.getElementById('mnHome');
  const mnProducts = document.getElementById('mnProducts');
  const mnServices = document.getElementById('mnServices');

  if (section === 'digital' || section === 'home') {
    digitalSection.style.display = 'block';
    servicesSection.style.display = 'none';
    tabDigitalBtn.classList.add('active');
    tabServicesBtn.classList.remove('active');

    if (mnHome) mnHome.classList.add('active');
    if (mnProducts) mnProducts.classList.add('active');
    if (mnServices) mnServices.classList.remove('active');

    fetchProducts();
  } else {
    digitalSection.style.display = 'none';
    servicesSection.style.display = 'block';
    tabDigitalBtn.classList.remove('active');
    tabServicesBtn.classList.add('active');

    if (mnHome) mnHome.classList.remove('active');
    if (mnProducts) mnProducts.classList.remove('active');
    if (mnServices) mnServices.classList.add('active');

    fetchServices();
  }

  renderCategoryBar();
}

function handleCategorySelect(category) {
  storeState.activeCategory = category;
  renderCategoryBar();

  if (storeState.activeSection === 'digital') {
    fetchProducts(category);
  } else {
    fetchServices(category);
  }
}

function filterProducts(category) {
  switchSection('digital');
  handleCategorySelect(category);
  document.getElementById('digital-section').scrollIntoView({ behavior: 'smooth' });
}

function filterServices(category) {
  switchSection('services');
  handleCategorySelect(category);
  document.getElementById('services-section').scrollIntoView({ behavior: 'smooth' });
}

let searchDebounce = null;
function handleSearch(query) {
  const inputDesktop = document.getElementById('searchInput');
  const inputMobile = document.getElementById('mobileSearchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  const clearMobileBtn = document.getElementById('mobileClearSearchBtn');

  // Sync inputs
  if (inputDesktop && inputDesktop.value !== query) inputDesktop.value = query;
  if (inputMobile && inputMobile.value !== query) inputMobile.value = query;

  if (query.trim() !== '') {
    if (clearBtn) clearBtn.style.display = 'block';
    if (clearMobileBtn) clearMobileBtn.style.display = 'block';
  } else {
    if (clearBtn) clearBtn.style.display = 'none';
    if (clearMobileBtn) clearMobileBtn.style.display = 'none';
  }

  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    if (storeState.activeSection === 'digital') {
      fetchProducts(storeState.activeCategory, query);
    } else {
      fetchServices(storeState.activeCategory, query);
    }
  }, 250);
}

function clearSearch() {
  const inputDesktop = document.getElementById('searchInput');
  const inputMobile = document.getElementById('mobileSearchInput');
  if (inputDesktop) inputDesktop.value = '';
  if (inputMobile) inputMobile.value = '';

  const clearBtn = document.getElementById('clearSearchBtn');
  const clearMobileBtn = document.getElementById('mobileClearSearchBtn');
  if (clearBtn) clearBtn.style.display = 'none';
  if (clearMobileBtn) clearMobileBtn.style.display = 'none';

  handleSearch('');
}

// -------------------------------------------------------------
// MODALS LOGIC & WHATSAPP ORDER SUBMISSION
// -------------------------------------------------------------

function openProductModal(id) {
  const product = storeState.products.find(p => p.id === id);
  if (!product) return;

  storeState.currentProduct = product;
  storeState.currentShareItem = {
    title: product.name,
    desc: `Beli ${product.name} cuma Rp ${product.price.toLocaleString('id-ID')} di AR-Store! Proses Cepat 24 Jam via WhatsApp.`,
    img: product.image_url
  };

  document.getElementById('pmImage').src = product.image_url;
  document.getElementById('pmName').textContent = product.name;
  document.getElementById('pmBadge').textContent = product.badge || 'POPULER';
  document.getElementById('pmPrice').textContent = `Rp ${product.price.toLocaleString('id-ID')}`;
  
  const origEl = document.getElementById('pmOrigPrice');
  if (product.original_price && product.original_price > product.price) {
    origEl.textContent = `Rp ${product.original_price.toLocaleString('id-ID')}`;
    origEl.style.display = 'inline';
  } else {
    origEl.style.display = 'none';
  }

  document.getElementById('pmFakeSales').textContent = `${(product.fake_sales || 1500).toLocaleString('id-ID')}+`;
  document.getElementById('pmFakeRating').textContent = product.fake_rating || '4.9';
  document.getElementById('pmRatingCount').textContent = product.rating_count || '320';
  document.getElementById('pmDescription').textContent = product.description;

  // Build Input Fields Dynamically
  const fieldsContainer = document.getElementById('pmFieldsContainer');
  const inputFields = product.input_fields || [
    { label: "ID Pelanggan / User ID", name: "user_id", required: true, type: "text" }
  ];

  fieldsContainer.innerHTML = inputFields.map(f => `
    <div class="form-group">
      <label class="form-label">${f.label} ${f.required ? '*' : ''}</label>
      <input type="${f.type || 'text'}" name="${f.name}" class="form-input dynamic-input" placeholder="Masukkan ${f.label}" ${f.required ? 'required' : ''}>
    </div>
  `).join('');

  // Update Dynamic SEO when modal opens
  SEO.updateMeta({
    title: `${product.name} - AR-Store`,
    description: `Beli ${product.name} seharga Rp ${product.price.toLocaleString('id-ID')} hanya di AR-Store. Terintegrasi WhatsApp!`,
    image: product.image_url
  });

  document.getElementById('productModal').classList.add('active');
}

function openServiceModal(id) {
  const service = storeState.services.find(s => s.id === id);
  if (!service) return;

  storeState.currentService = service;
  storeState.currentShareItem = {
    title: service.name,
    desc: `Booking ${service.name} (${service.category}) di AR-Store. Teknisi Berpengalaman & Garansi Resmi.`,
    img: service.image_url
  };

  document.getElementById('smImage').src = service.image_url;
  document.getElementById('smName').textContent = service.name;
  document.getElementById('smCategory').textContent = service.category;
  document.getElementById('smPriceRange').textContent = service.price_range;
  document.getElementById('smDuration').textContent = service.duration || '1-3 Jam';
  document.getElementById('smDescription').textContent = service.description;

  const featContainer = document.getElementById('smFeaturesList');
  featContainer.innerHTML = (service.features || ["Garansi Resmi 30 Hari", "Teknisi Berpengalaman"]).map(f => `
    <span class="sf-chip" style="margin-bottom: 6px;"><i class="fa-solid fa-shield-check text-green"></i> ${f}</span>
  `).join(' ');

  SEO.updateMeta({
    title: `${service.name} - AR-Store Jasa Service`,
    description: `Order ${service.name} (${service.category}). Dapatkan perbaikan profesional bergaransi via WhatsApp 081214932916.`,
    image: service.image_url
  });

  document.getElementById('serviceModal').classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function handleProductSubmit(e) {
  e.preventDefault();
  const product = storeState.currentProduct;
  if (!product) return;

  // Extract Dynamic Inputs
  const userFields = {};
  const inputs = document.querySelectorAll('.dynamic-input');
  inputs.forEach(input => {
    const label = input.previousElementSibling ? input.previousElementSibling.textContent.replace('*', '').trim() : input.name;
    userFields[label] = input.value;
  });

  const note = document.getElementById('pmNote').value;
  const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;

  const encodedMsg = WA.buildProductMessage({
    storeName: storeState.settings.store_name || 'AR-Store',
    product,
    userFields,
    note,
    paymentMethod
  });

  WA.sendToWhatsApp(storeState.settings.whatsapp_number, encodedMsg);
  closeModal('productModal');
  showToast('Mengarahkan ke WhatsApp CS AR-Store...', 'success');
}

function handleServiceSubmit(e) {
  e.preventDefault();
  const service = storeState.currentService;
  if (!service) return;

  const customerName = document.getElementById('smCustomerName').value;
  const customerPhone = document.getElementById('smCustomerPhone').value;
  const address = document.getElementById('smCustomerAddress').value;
  const issue = document.getElementById('smIssue').value;
  const date = document.getElementById('smServiceDate').value;

  const encodedMsg = WA.buildServiceMessage({
    storeName: storeState.settings.store_name || 'AR-Store',
    service,
    customerName,
    customerPhone,
    address,
    issue,
    date
  });

  WA.sendToWhatsApp(storeState.settings.whatsapp_number, encodedMsg);
  closeModal('serviceModal');
  showToast('Booking berhasil! Mengarahkan ke WhatsApp Teknisi...', 'success');
}

function openDirectWhatsApp() {
  const waNum = storeState.settings.whatsapp_number || '081214932916';
  const msg = encodeURIComponent(`Halo CS *${storeState.settings.store_name || 'AR-Store'}*,\nSaya mau bertanya mengenai Produk Digital / Jasa Service.`);
  WA.sendToWhatsApp(waNum, msg);
}

// -------------------------------------------------------------
// SOCIAL MEDIA SHARING WITH SEO
// -------------------------------------------------------------

function shareCurrentItem() {
  const item = storeState.currentShareItem || {
    title: storeState.settings.site_title || "AR-Store",
    desc: storeState.settings.site_description || "Toko Produk Digital & Jasa Service",
    img: storeState.settings.banner_url
  };

  const currentUrl = window.location.href;
  document.getElementById('shareUrlInput').value = currentUrl;

  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedText = encodeURIComponent(`${item.title}\n${item.desc}`);

  document.getElementById('shareWaBtn').href = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
  document.getElementById('shareFbBtn').href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  document.getElementById('shareTwBtn').href = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  document.getElementById('shareTgBtn').href = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;

  document.getElementById('shareModal').classList.add('active');
}

function copyShareUrl() {
  const input = document.getElementById('shareUrlInput');
  input.select();
  document.execCommand('copy');
  showToast('Link berhasil disalin ke clipboard!', 'success');
}

// -------------------------------------------------------------
// TOAST ALERT SYSTEM
// -------------------------------------------------------------

function showToast(message, type = 'success') {
  const toast = document.getElementById('toastAlert');
  const msgEl = document.getElementById('toastMessage');
  const iconEl = document.getElementById('toastIcon');

  msgEl.textContent = message;

  if (type === 'success') {
    iconEl.className = 'fa-solid fa-circle-check text-green';
    toast.style.borderColor = 'var(--accent-green)';
  } else if (type === 'error') {
    iconEl.className = 'fa-solid fa-circle-xmark text-red';
    toast.style.borderColor = 'var(--accent-red)';
  } else {
    iconEl.className = 'fa-solid fa-circle-info text-cyan';
    toast.style.borderColor = 'var(--accent-cyan)';
  }

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}
