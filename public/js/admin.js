/* Admin Dashboard & Management JS Engine */

let adminToken = localStorage.getItem('ar_store_admin_token') || null;

async function checkAdminAuth() {
  if (!adminToken) return false;
  try {
    const res = await fetch('/api/admin/verify', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    return data.success;
  } catch (err) {
    return false;
  }
}

async function openAdminModal() {
  const modal = document.getElementById('adminModal');
  if (!modal) return;
  modal.classList.add('active');

  const loginForm = document.getElementById('adminLoginFormContainer');
  const dashboard = document.getElementById('adminDashboardContainer');

  try {
    const isAuth = await checkAdminAuth();
    if (isAuth) {
      if (loginForm) loginForm.style.display = 'none';
      if (dashboard) dashboard.style.display = 'block';
      loadAdminProducts();
      loadAdminServices();
      loadAdminCategories();
      loadAdminFakeNotifs();
      populateAdminSettingsForm();
      populateCategoryDropdowns();
    } else {
      if (loginForm) loginForm.style.display = 'block';
      if (dashboard) dashboard.style.display = 'none';
    }
  } catch (err) {
    console.error("Auth check failed:", err);
    if (loginForm) loginForm.style.display = 'block';
    if (dashboard) dashboard.style.display = 'none';
  }
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      adminToken = data.token;
      localStorage.setItem('ar_store_admin_token', adminToken);
      showToast('Login Admin Berhasil!', 'success');
      document.getElementById('adminLoginFormContainer').style.display = 'none';
      document.getElementById('adminDashboardContainer').style.display = 'block';
      loadAdminProducts();
      loadAdminServices();
      loadAdminCategories();
      loadAdminFakeNotifs();
      populateAdminSettingsForm();
      populateCategoryDropdowns();
    } else {
      showToast(data.message || 'Login gagal', 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan koneksi server', 'error');
  }
}

function handleAdminLogout() {
  adminToken = null;
  localStorage.removeItem('ar_store_admin_token');
  showToast('Admin berhasil logout', 'info');
  document.getElementById('adminLoginFormContainer').style.display = 'block';
  document.getElementById('adminDashboardContainer').style.display = 'none';
}

function switchAdminTab(tabName, btnElement) {
  const sideBtns = document.querySelectorAll('.admin-side-btn');
  const contents = document.querySelectorAll('.admin-tab-content');

  sideBtns.forEach(b => b.classList.remove('active'));
  contents.forEach(c => c.classList.remove('active'));

  if (btnElement) {
    btnElement.classList.add('active');
  }

  let targetId = '';
  if (tabName === 'products') {
    targetId = 'adminTabProducts';
    loadAdminProducts();
  } else if (tabName === 'services') {
    targetId = 'adminTabServices';
    loadAdminServices();
  } else if (tabName === 'categories') {
    targetId = 'adminTabCategories';
    loadAdminCategories();
  } else if (tabName === 'fake_notif') {
    targetId = 'adminTabFakeNotif';
    loadAdminFakeNotifs();
  } else if (tabName === 'settings') {
    targetId = 'adminTabSettings';
    populateAdminSettingsForm();
  }

  if (targetId) {
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.classList.add('active');
    }
  }
}

function toggleAdminSidebar() {
  const layout = document.querySelector('.admin-dashboard-layout');
  const label = document.getElementById('toggleSidebarLabel');
  if (!layout) return;

  layout.classList.toggle('sidebar-hidden');

  const isHidden = layout.classList.contains('sidebar-hidden');
  if (label) {
    label.textContent = isHidden ? 'Tampilkan Menu Admin' : 'Sembunyikan Menu Admin';
  }
}

// -------------------------------------------------------------
// IMAGE UPLOAD HELPER (LOCAL FILE PICKER & BASE64 FALLBACK)
// -------------------------------------------------------------

async function uploadImageFile(fileInput, targetUrlInputId, previewImgId) {
  if (!fileInput.files || fileInput.files.length === 0) return;
  const file = fileInput.files[0];

  showToast('Mengunggah gambar...', 'info');

  const fileToBase64 = (f) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(f);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  try {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById(targetUrlInputId).value = data.url;
      updateImagePreview(data.url, previewImgId);
      showToast('Gambar berhasil diunggah!', 'success');
      return;
    }
  } catch (err) {
    console.warn("FormData upload failed, trying base64 fallback...", err);
  }

  // Base64 fallback for 100% upload reliability
  try {
    const base64Data = await fileToBase64(file);
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ image_base64: base64Data })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById(targetUrlInputId).value = data.url;
      updateImagePreview(data.url, previewImgId);
      showToast('Gambar berhasil diunggah!', 'success');
    } else {
      showToast(data.message || 'Gagal mengunggah gambar', 'error');
    }
  } catch (err) {
    showToast('Gagal mengunggah gambar!', 'error');
  }
}

function updateImagePreview(url, previewImgId) {
  const preview = document.getElementById(previewImgId);
  if (!preview) return;
  if (url && url.trim() !== '') {
    preview.src = url;
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
}

// -------------------------------------------------------------
// ADMIN CATEGORY MANAGEMENT (FULL CRUD)
// -------------------------------------------------------------

async function populateCategoryDropdowns(selectedProdCat = '', selectedServCat = '') {
  try {
    const res = await fetch('/api/categories');
    const data = await res.json();
    if (data.success) {
      const prodSelect = document.getElementById('pemCategory');
      const servSelect = document.getElementById('semCategory');

      if (prodSelect) {
        prodSelect.innerHTML = data.data.product_categories.map(c => `
          <option value="${c}" ${c === selectedProdCat ? 'selected' : ''}>${c}</option>
        `).join('');
        if (selectedProdCat) prodSelect.value = selectedProdCat;
      }

      if (servSelect) {
        servSelect.innerHTML = data.data.service_categories.map(c => `
          <option value="${c}" ${c === selectedServCat ? 'selected' : ''}>${c}</option>
        `).join('');
        if (selectedServCat) servSelect.value = selectedServCat;
      }
    }
  } catch (err) {
    console.error("Gagal load categories dropdown", err);
  }
}

async function loadAdminCategories() {
  const prodList = document.getElementById('adminProductCategoryList');
  const servList = document.getElementById('adminServiceCategoryList');
  if (!prodList || !servList) return;

  try {
    const res = await fetch('/api/categories');
    const data = await res.json();
    if (data.success) {
      const { product_categories, service_categories } = data.data;

      prodList.innerHTML = product_categories.map(cat => `
        <li class="admin-category-item">
          <span><i class="fa-solid fa-tag text-purple"></i> ${cat}</span>
          <div class="cat-actions">
            <button class="btn-sm btn-edit" onclick="openEditCategoryModal('product', '${cat}')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-sm btn-delete" onclick="deleteCategory('product', '${cat}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </li>
      `).join('');

      servList.innerHTML = service_categories.map(cat => `
        <li class="admin-category-item">
          <span><i class="fa-solid fa-tag text-cyan"></i> ${cat}</span>
          <div class="cat-actions">
            <button class="btn-sm btn-edit" onclick="openEditCategoryModal('service', '${cat}')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-sm btn-delete" onclick="deleteCategory('service', '${cat}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </li>
      `).join('');
    }
  } catch (err) {
    console.error("Gagal memuat kategori", err);
  }
}

function openAddCategoryModal() {
  document.getElementById('catModalTitle').innerHTML = `<i class="fa-solid fa-plus text-cyan"></i> Tambah Kategori Baru`;
  document.getElementById('catOldName').value = '';
  document.getElementById('catName').value = '';
  document.getElementById('categoryEditForm').reset();
  document.getElementById('categoryEditModal').classList.add('active');
}

function openEditCategoryModal(type, name) {
  document.getElementById('catModalTitle').innerHTML = `<i class="fa-solid fa-pen text-cyan"></i> Edit Kategori`;
  document.getElementById('catType').value = type;
  document.getElementById('catOldName').value = name;
  document.getElementById('catName').value = name;
  document.getElementById('categoryEditModal').classList.add('active');
}

async function handleSaveCategoryForm(e) {
  e.preventDefault();
  const type = document.getElementById('catType').value;
  const oldName = document.getElementById('catOldName').value;
  const newName = document.getElementById('catName').value;

  const url = '/api/admin/categories';
  const method = oldName ? 'PUT' : 'POST';
  const payload = oldName ? { type, oldName, newName } : { type, name: newName };

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      closeModal('categoryEditModal');
      loadAdminCategories();
      populateCategoryDropdowns();
      fetchProducts();
      fetchServices();
    } else {
      showToast(data.message || 'Gagal menyimpan kategori', 'error');
    }
  } catch (err) {
    showToast('Koneksi server gagal', 'error');
  }
}

async function deleteCategory(type, name) {
  if (!confirm(`Apakah kamu yakin ingin menghapus kategori "${name}"?`)) return;
  try {
    const res = await fetch('/api/admin/categories', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ type, name })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadAdminCategories();
      populateCategoryDropdowns();
      fetchProducts();
      fetchServices();
    } else {
      showToast(data.message || 'Gagal menghapus kategori', 'error');
    }
  } catch (err) {
    showToast('Koneksi server gagal', 'error');
  }
}

// -------------------------------------------------------------
// ADMIN CRUD: DIGITAL PRODUCTS
// -------------------------------------------------------------

async function loadAdminProducts() {
  const tbody = document.getElementById('adminProductsTableBody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Memuat data produk...</td></tr>`;

  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Belum ada produk digital.</td></tr>`;
        return;
      }
      tbody.innerHTML = data.data.map(p => `
        <tr>
          <td><img src="${p.image_url}" class="table-thumb" alt="${p.name}"></td>
          <td><strong>${p.name}</strong> ${p.badge ? `<span class="modal-badge">${p.badge}</span>` : ''}</td>
          <td><span class="sf-chip">${p.category}</span></td>
          <td><strong class="text-green">Rp ${p.price.toLocaleString('id-ID')}</strong></td>
          <td><i class="fa-solid fa-fire text-gold"></i> ${p.fake_sales.toLocaleString('id-ID')}</td>
          <td><i class="fa-solid fa-star text-yellow"></i> ${p.fake_rating}</td>
          <td>${p.is_available ? '<span class="text-green"><i class="fa-solid fa-circle-check"></i> Aktif</span>' : '<span class="text-red">Non-Aktif</span>'}</td>
          <td>
            <button class="btn-sm btn-edit" onclick="openEditProductModal(${p.id})"><i class="fa-solid fa-pen"></i> Edit</button>
            <button class="btn-sm btn-delete" onclick="deleteProduct(${p.id})"><i class="fa-solid fa-trash"></i> Hapus</button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Gagal memuat data.</td></tr>`;
  }
}

async function openAddProductModal() {
  document.getElementById('productEditForm').reset();
  await populateCategoryDropdowns();
  document.getElementById('pemTitle').innerHTML = `<i class="fa-solid fa-plus text-purple"></i> Tambah Produk Digital Baru`;
  document.getElementById('pemId').value = '';
  document.getElementById('pemImageUrl').value = '';
  updateImagePreview('', 'pemImagePreview');
  document.getElementById('productEditModal').classList.add('active');
}

async function openEditProductModal(id) {
  try {
    const res = await fetch(`/api/products/${id}`);
    const data = await res.json();
    if (data.success) {
      const p = data.data;
      await populateCategoryDropdowns(p.category);
      document.getElementById('pemTitle').innerHTML = `<i class="fa-solid fa-pen text-purple"></i> Edit Produk Digital`;
      document.getElementById('pemId').value = p.id;
      document.getElementById('pemName').value = p.name;
      document.getElementById('pemCategory').value = p.category;
      document.getElementById('pemPrice').value = p.price;
      document.getElementById('pemOrigPrice').value = p.original_price || '';
      document.getElementById('pemBadge').value = p.badge || '';
      document.getElementById('pemFakeSales').value = p.fake_sales || 100;
      document.getElementById('pemFakeRating').value = p.fake_rating || 4.9;
      document.getElementById('pemImageUrl').value = p.image_url;
      document.getElementById('pemDescription').value = p.description || '';
      updateImagePreview(p.image_url, 'pemImagePreview');

      document.getElementById('productEditModal').classList.add('active');
    }
  } catch (err) {
    showToast('Gagal memuat detail produk', 'error');
  }
}

async function handleSaveProductForm(e) {
  e.preventDefault();
  const id = document.getElementById('pemId').value;
  const imageUrl = document.getElementById('pemImageUrl').value;

  if (!imageUrl || imageUrl.trim() === '') {
    return showToast('Harap upload gambar produk terlebih dahulu!', 'error');
  }

  const payload = {
    name: document.getElementById('pemName').value,
    category: document.getElementById('pemCategory').value,
    price: document.getElementById('pemPrice').value,
    original_price: document.getElementById('pemOrigPrice').value,
    badge: document.getElementById('pemBadge').value,
    fake_sales: document.getElementById('pemFakeSales').value,
    fake_rating: document.getElementById('pemFakeRating').value,
    image_url: imageUrl,
    description: document.getElementById('pemDescription').value
  };

  const url = id ? `/api/admin/products/${id}` : `/api/admin/products`;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      closeModal('productEditModal');
      loadAdminProducts();
      fetchProducts();
    } else {
      showToast(data.message || 'Gagal menyimpan produk', 'error');
    }
  } catch (err) {
    showToast('Koneksi server gagal', 'error');
  }
}

async function deleteProduct(id) {
  if (!confirm('Apakah kamu yakin ingin menghapus produk ini?')) return;
  try {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Produk berhasil dihapus', 'success');
      loadAdminProducts();
      fetchProducts();
    }
  } catch (err) {
    showToast('Gagal menghapus produk', 'error');
  }
}

// -------------------------------------------------------------
// ADMIN CRUD: SERVICES (JASA)
// -------------------------------------------------------------

async function loadAdminServices() {
  const tbody = document.getElementById('adminServicesTableBody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Memuat data jasa...</td></tr>`;

  try {
    const res = await fetch('/api/services');
    const data = await res.json();
    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Belum ada layanan jasa.</td></tr>`;
        return;
      }
      tbody.innerHTML = data.data.map(s => `
        <tr>
          <td><img src="${s.image_url}" class="table-thumb" alt="${s.name}"></td>
          <td><strong>${s.name}</strong></td>
          <td><span class="sf-chip text-cyan">${s.category}</span></td>
          <td><strong class="text-gold">${s.price_range}</strong></td>
          <td><i class="fa-solid fa-clock"></i> ${s.duration}</td>
          <td>${s.is_available ? '<span class="text-green"><i class="fa-solid fa-circle-check"></i> Aktif</span>' : '<span class="text-red">Non-Aktif</span>'}</td>
          <td>
            <button class="btn-sm btn-edit" onclick="openEditServiceModal(${s.id})"><i class="fa-solid fa-pen"></i> Edit</button>
            <button class="btn-sm btn-delete" onclick="deleteService(${s.id})"><i class="fa-solid fa-trash"></i> Hapus</button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Gagal memuat data jasa.</td></tr>`;
  }
}

async function openAddServiceModal() {
  document.getElementById('serviceEditForm').reset();
  await populateCategoryDropdowns();
  document.getElementById('semTitle').innerHTML = `<i class="fa-solid fa-plus text-cyan"></i> Tambah Layanan Jasa Baru`;
  document.getElementById('semId').value = '';
  document.getElementById('semImageUrl').value = '';
  updateImagePreview('', 'semImagePreview');
  document.getElementById('serviceEditModal').classList.add('active');
}

async function openEditServiceModal(id) {
  try {
    const res = await fetch(`/api/services/${id}`);
    const data = await res.json();
    if (data.success) {
      const s = data.data;
      await populateCategoryDropdowns('', s.category);
      document.getElementById('semTitle').innerHTML = `<i class="fa-solid fa-pen text-cyan"></i> Edit Layanan Jasa`;
      document.getElementById('semId').value = s.id;
      document.getElementById('semName').value = s.name;
      document.getElementById('semCategory').value = s.category;
      document.getElementById('semPriceRange').value = s.price_range;
      document.getElementById('semDuration').value = s.duration || '';
      document.getElementById('semImageUrl').value = s.image_url;
      document.getElementById('semDescription').value = s.description || '';
      updateImagePreview(s.image_url, 'semImagePreview');

      document.getElementById('serviceEditModal').classList.add('active');
    }
  } catch (err) {
    showToast('Gagal memuat detail jasa', 'error');
  }
}

async function handleSaveServiceForm(e) {
  e.preventDefault();
  const id = document.getElementById('semId').value;
  const imageUrl = document.getElementById('semImageUrl').value;

  if (!imageUrl || imageUrl.trim() === '') {
    return showToast('Harap upload gambar jasa terlebih dahulu!', 'error');
  }

  const payload = {
    name: document.getElementById('semName').value,
    category: document.getElementById('semCategory').value,
    price_range: document.getElementById('semPriceRange').value,
    duration: document.getElementById('semDuration').value,
    image_url: imageUrl,
    description: document.getElementById('semDescription').value
  };

  const url = id ? `/api/admin/services/${id}` : `/api/admin/services`;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      closeModal('serviceEditModal');
      loadAdminServices();
      fetchServices();
    } else {
      showToast(data.message || 'Gagal menyimpan jasa', 'error');
    }
  } catch (err) {
    showToast('Koneksi server gagal', 'error');
  }
}

async function deleteService(id) {
  if (!confirm('Apakah kamu yakin ingin menghapus jasa ini?')) return;
  try {
    const res = await fetch(`/api/admin/services/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Jasa berhasil dihapus', 'success');
      loadAdminServices();
      fetchServices();
    }
  } catch (err) {
    showToast('Gagal menghapus jasa', 'error');
  }
}

// -------------------------------------------------------------
// ADMIN CRUD: FAKE NOTIFICATIONS
// -------------------------------------------------------------

async function loadAdminFakeNotifs() {
  const tbody = document.getElementById('adminFakeNotifTableBody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Memuat data notif fake...</td></tr>`;

  try {
    const res = await fetch('/api/fake-notifications');
    const data = await res.json();
    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Belum ada notifikasi fake.</td></tr>`;
        return;
      }
      tbody.innerHTML = data.data.map(f => `
        <tr>
          <td><strong>${f.buyer_name}</strong></td>
          <td>${f.city}</td>
          <td><span class="text-cyan">${f.item_name}</span></td>
          <td>${f.time_ago}</td>
          <td>
            <button class="btn-sm btn-delete" onclick="deleteFakeNotif(${f.id})"><i class="fa-solid fa-trash"></i> Hapus</button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Gagal memuat notif fake.</td></tr>`;
  }
}

function openAddFakeNotifModal() {
  document.getElementById('fakeNotifForm').reset();
  document.getElementById('fakeNotifEditModal').classList.add('active');
}

async function handleSaveFakeNotifForm(e) {
  e.preventDefault();
  const payload = {
    buyer_name: document.getElementById('fnBuyerName').value,
    city: document.getElementById('fnCity').value,
    item_name: document.getElementById('fnItemName').value,
    time_ago: document.getElementById('fnTimeAgo').value
  };

  try {
    const res = await fetch('/api/admin/fake-notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Fake notif berhasil ditambahkan!', 'success');
      closeModal('fakeNotifEditModal');
      loadAdminFakeNotifs();
      fetchSettingsAndNotifs();
    }
  } catch (err) {
    showToast('Gagal menambahkan fake notif', 'error');
  }
}

async function deleteFakeNotif(id) {
  try {
    const res = await fetch(`/api/admin/fake-notifications/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Fake notif dihapus', 'success');
      loadAdminFakeNotifs();
      fetchSettingsAndNotifs();
    }
  } catch (err) {
    showToast('Gagal menghapus fake notif', 'error');
  }
}

// -------------------------------------------------------------
// ADMIN SETTINGS FORM
// -------------------------------------------------------------

async function populateAdminSettingsForm() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.success) {
      const s = data.data;
      document.getElementById('setStoreName').value = s.store_name || '';
      document.getElementById('setTagline').value = s.tagline || '';
      document.getElementById('setWaNumber').value = s.whatsapp_number || '';
      document.getElementById('setFakeInterval').value = s.fake_notif_interval || 10;
      document.getElementById('setEnableFakeNotif').value = s.enable_fake_notif ? "true" : "false";
      document.getElementById('setSiteTitle').value = s.site_title || '';
      document.getElementById('setSiteDesc').value = s.site_description || '';
      
      const logoUrl = s.logo_url || '/favicon.svg';
      const bannerUrl = s.banner_url || '';

      document.getElementById('setLogoUrl').value = logoUrl;
      document.getElementById('setBannerUrl').value = bannerUrl;

      updateImagePreview(logoUrl, 'setLogoPreview');
      updateImagePreview(bannerUrl, 'setBannerPreview');
    }
  } catch (err) {
    console.error("Gagal load settings untuk admin", err);
  }
}

async function handleSettingsSubmit(e) {
  e.preventDefault();
  const payload = {
    store_name: document.getElementById('setStoreName').value,
    tagline: document.getElementById('setTagline').value,
    whatsapp_number: document.getElementById('setWaNumber').value,
    fake_notif_interval: document.getElementById('setFakeInterval').value,
    enable_fake_notif: document.getElementById('setEnableFakeNotif').value === "true",
    admin_password: document.getElementById('setAdminPass').value,
    site_title: document.getElementById('setSiteTitle').value,
    site_description: document.getElementById('setSiteDesc').value,
    logo_url: document.getElementById('setLogoUrl').value,
    banner_url: document.getElementById('setBannerUrl').value
  };

  try {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Pengaturan toko & gambar profil berhasil disimpan!', 'success');
      document.getElementById('setAdminPass').value = '';
      fetchSettingsAndNotifs();
    } else {
      showToast(data.message || 'Gagal menyimpan pengaturan', 'error');
    }
  } catch (err) {
    showToast('Koneksi server gagal', 'error');
  }
}
