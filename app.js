const SUPABASE_URL = 'https://zjbgwmildygmyvderadf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yOk-XtOJtwWXfdGvfF9ZoA_KOGz_p-R';

async function supabaseFetch(endpoint, method = 'GET', body = null) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': method === 'POST' ? 'return=representation' : ''
    };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, options);
    const data = await res.json();

    if (!res.ok) {
      return { data: null, error: data.message || data.error_description || 'Something went wrong.' };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: 'Network error. Please check your connection.' };
  }
}

function setSession(user) { localStorage.setItem('firta_user', JSON.stringify(user)); }
function clearSession() { localStorage.removeItem('firta_user'); }
function getSession() {
  try { return JSON.parse(localStorage.getItem('firta_user')); }
  catch { return null; }
}
function requireAuth() {
  const user = getSession();
  if (!user) { window.location.href = 'login.html'; return null; }
  return user;
}

function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = msg;
  el.className = `alert alert-${type}`;
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}
function setButtonLoading(btn, text = 'Loading...') {
  btn.dataset.original = btn.innerHTML;
  btn.innerHTML = `<span class="spinner"></span> ${text}`;
  btn.disabled = true;
}
function resetButton(btn) {
  btn.innerHTML = btn.dataset.original || btn.innerHTML;
  btn.disabled = false;
}
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function showLoader() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.remove('hidden');
}
function hideLoader() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.add('hidden');
}
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function handleSignup(e) {
  e.preventDefault();
  hideAlert('signup-alert');

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();
  const password = document.getElementById('password').value;

  if (!name || !email || !phone || !password) {
    showAlert('signup-alert', '⚠️ Please fill in all required fields.', 'error'); return;
  }
  if (!isValidEmail(email)) {
    showAlert('signup-alert', '⚠️ Please enter a valid email address.', 'error'); return;
  }
  if (password.length < 6) {
    showAlert('signup-alert', '⚠️ Password must be at least 6 characters.', 'error'); return;
  }

  const btn = document.getElementById('signup-btn');
  setButtonLoading(btn, 'Creating account...');

  const { data: existing } = await supabaseFetch(`/users?email=eq.${encodeURIComponent(email)}&select=id`);
  if (existing && existing.length > 0) {
    showAlert('signup-alert', '⚠️ An account with this email already exists. <a href="login.html">Sign in</a>', 'error');
    resetButton(btn); return;
  }

  const { data, error } = await supabaseFetch('/users', 'POST', { name, email, phone, address, password });
  resetButton(btn);

  if (error) { showAlert('signup-alert', `❌ ${error}`, 'error'); return; }

  if (data && data.length > 0) setSession({ id: data[0].id, name: data[0].name, email: data[0].email });
  showAlert('signup-alert', '✅ Account created! Redirecting...', 'success');
  setTimeout(() => window.location.href = 'dashboard.html', 1200);
}

async function handleLogin(e) {
  e.preventDefault();
  hideAlert('login-alert');

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showAlert('login-alert', '⚠️ Please enter your email and password.', 'error'); return;
  }

  const btn = document.getElementById('login-btn');
  setButtonLoading(btn, 'Signing in...');

  const { data, error } = await supabaseFetch(
    `/users?email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(password)}&select=id,name,email`
  );
  resetButton(btn);

  if (error) { showAlert('login-alert', `❌ ${error}`, 'error'); return; }
  if (!data || data.length === 0) { showAlert('login-alert', '❌ Invalid email or password.', 'error'); return; }

  setSession({ id: data[0].id, name: data[0].name, email: data[0].email });
  showAlert('login-alert', '✅ Logged in! Redirecting...', 'success');
  setTimeout(() => window.location.href = 'dashboard.html', 1000);
}

async function loadDashboard() {
  const user = requireAuth();
  if (!user) return;

  const nameEl = document.getElementById('user-name');
  const welcomeEl = document.getElementById('welcome-name');
  if (nameEl) nameEl.textContent = user.name;
  if (welcomeEl) welcomeEl.textContent = user.name.split(' ')[0];

  showLoader();
  const { data: items, error } = await supabaseFetch(`/items?user_id=eq.${user.id}&order=created_at.desc`);
  hideLoader();

  const total = items ? items.length : 0;
  const lostCount = items ? items.filter(i => i.status === 'lost').length : 0;
  const safeCount = total - lostCount;

  const countEl = document.getElementById('item-count');
  const lostEl = document.getElementById('lost-count');
  const safeEl = document.getElementById('safe-count');
  if (countEl) countEl.textContent = total;
  if (lostEl) lostEl.textContent = lostCount;
  if (safeEl) safeEl.textContent = safeCount;

  if (error) {
    document.getElementById('items-container').innerHTML =
      `<p class="text-muted" style="padding:24px">Could not load items. ${error}</p>`;
    return;
  }
  renderItems(items || []);
}

function renderItems(items) {
  const container = document.getElementById('items-container');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>No items yet</h3>
        <p>Add your first item and generate a QR code to protect it.</p>
        <a href="add-item.html" class="btn btn-primary">+ Add Your First Item</a>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="items-grid">${items.map(itemCardHTML).join('')}</div>`;
}

function itemCardHTML(item) {
  const isLost = item.status === 'lost';
  const created = new Date(item.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  return `
    <div class="item-card" id="card-${item.id}">
      <div class="item-card-top">
        <div class="item-icon">${isLost ? '🔴' : '📦'}</div>
        <div style="flex:1;min-width:0">
          <div class="item-name">${escapeHTML(item.name)}</div>
          <div class="item-contact">${escapeHTML(item.contact)}</div>
        </div>
        <span class="badge ${isLost ? 'badge-lost' : 'badge-active'}">
          ${isLost ? '🔴 Lost' : '✅ Safe'}
        </span>
      </div>

      ${isLost ? `
      <div class="item-lost-notice">
        <span>🚨</span>
        <span>Marked as lost — finder can now see your contact info</span>
      </div>` : `
      <div class="item-safe-notice">
        <span>🔒</span>
        <span>Contact info is hidden from finders while item is safe</span>
      </div>`}

      <div style="font-size:12px;color:var(--gray-500);margin-bottom:16px;">
        Added ${created}
      </div>

      <div class="item-card-footer">
        <a href="qr.html?id=${item.id}" class="btn btn-primary btn-sm">📱 View QR</a>

        <button
          class="btn btn-sm ${isLost ? 'btn-success' : 'btn-danger'}"
          onclick="toggleStatus('${item.id}', '${item.status}', this)">
          ${isLost ? '✅ Mark Found' : '🔴 Mark Lost'}
        </button>

        <a href="item.html?id=${item.id}" class="btn btn-ghost btn-sm" target="_blank">👁 Preview</a>
      </div>
    </div>`;
}

async function toggleStatus(itemId, currentStatus, btn) {
  const newStatus = currentStatus === 'lost' ? 'active' : 'lost';

  const confirmed = confirm(
    newStatus === 'lost'
      ? '🔴 Mark this item as LOST?\n\nFinders who scan the QR will be able to see your contact information.'
      : '✅ Mark this item as FOUND / SAFE?\n\nYour contact info will be hidden from finders again.'
  );
  if (!confirmed) return;

  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span>';
  btn.disabled = true;

  const { error } = await supabaseFetch(`/items?id=eq.${itemId}`, 'PATCH', { status: newStatus });

  if (error) {
    btn.innerHTML = originalText;
    btn.disabled = false;
    alert('❌ Could not update status. Please try again.');
    return;
  }

  loadDashboard();
}

function handleLogout() {
  clearSession();
  window.location.href = 'index.html';
}

async function handleAddItem(e) {
  e.preventDefault();
  hideAlert('item-alert');

  const user = getSession();
  if (!user) { window.location.href = 'login.html'; return; }

  const name = document.getElementById('item-name').value.trim();
  const contact = document.getElementById('item-contact').value.trim();

  if (!name || !contact) {
    showAlert('item-alert', '⚠️ Please fill in all fields.', 'error'); return;
  }

  const btn = document.getElementById('add-btn');
  setButtonLoading(btn, 'Saving item...');

  const { data, error } = await supabaseFetch('/items', 'POST', {
    name,
    contact,
    user_id: user.id,
    status: 'active'
  });

  resetButton(btn);

  if (error) { showAlert('item-alert', `❌ ${error}`, 'error'); return; }

  if (data && data.length > 0) {
    window.location.href = `qr.html?id=${data[0].id}`;
  }
}

async function loadQRPage() {
  const itemId = getParam('id');
  if (!itemId) {
    document.getElementById('qr-content').innerHTML = '<p class="text-muted">No item ID found.</p>';
    return;
  }

  showLoader();
  const { data, error } = await supabaseFetch(`/items?id=eq.${itemId}`);
  hideLoader();

  if (error || !data || data.length === 0) {
    document.getElementById('qr-content').innerHTML = '<p class="text-muted">Item not found.</p>';
    return;
  }

  const item = data[0];

  document.getElementById('qr-item-name').textContent = item.name;
  document.getElementById('qr-item-id').textContent = `ID: ${item.id}`;

  const baseUrl = window.location.href.replace(/qr\.html.*$/, '');
  const itemUrl = `${baseUrl}item.html?id=${item.id}`;

  new QRCode(document.getElementById('qr-code-container'), {
    text: itemUrl,
    width: 200,
    height: 200,
    colorDark: '#2563EB',
    colorLight: '#FFFFFF',
    correctLevel: QRCode.CorrectLevel.H
  });

  document.getElementById('download-btn').addEventListener('click', () => {
    const canvas = document.querySelector('#qr-code-container canvas');
    const img = document.querySelector('#qr-code-container img');
    const source = canvas || img;
    if (!source) return;
    const link = document.createElement('a');
    link.download = `firta-qr-${item.name.replace(/\s+/g, '-')}.png`;
    link.href = canvas ? canvas.toDataURL('image/png') : img.src;
    link.click();
  });
}

async function loadItemPage() {
  const itemId = getParam('id');
  const content = document.getElementById('item-content');

  if (!itemId) {
    if (content) content.innerHTML = `
      <div class="card text-center" style="padding:48px">
        <div style="font-size:48px;margin-bottom:16px">❓</div>
        <h2>Item Not Found</h2>
        <p class="text-muted mt-1">No item ID was provided in the URL.</p>
      </div>`;
    return;
  }

  showLoader();
  const { data, error } = await supabaseFetch(`/items?id=eq.${itemId}`);
  hideLoader();

  if (error || !data || data.length === 0) {
    if (content) content.innerHTML = `
      <div class="card text-center" style="padding:48px">
        <div style="font-size:48px;margin-bottom:16px">📭</div>
        <h2>Item Not Found</h2>
        <p class="text-muted mt-1">This item may have been removed.</p>
      </div>`;
    return;
  }

  const item = data[0];
  const isLost = item.status === 'lost';

  if (!isLost) {
    if (content) content.innerHTML = `
      <div class="firta-badge">🔷 Registered on Firta</div>

      <div class="item-hero-card page-fade">
        <div class="item-safe-icon">🔒</div>
        <h1>${escapeHTML(item.name)}</h1>
        <p class="item-subtitle">This item is registered on Firta.</p>

        <div class="safe-status-box">
          <div class="safe-status-icon">✅</div>
          <div class="safe-status-text">
            <strong>This item is currently safe with its owner.</strong>
            <p>
              The owner has not reported this item as lost.
              If you found this item, the owner may not be aware it is missing yet.
            </p>
          </div>
        </div>

        <div class="finder-tip">
          <div class="finder-tip-title">💡 Did you find this item?</div>
          <p>
            Hold on to it safely. The owner may mark it as lost soon and
            contact information will become visible here automatically.
            Try scanning the QR again in a little while.
          </p>
        </div>
      </div>

      <div class="coming-soon-card">
        <span class="cs-icon">📍</span>
        <div class="cs-text">
          <h3>Live GPS Tracking</h3>
          <p>Real-time location sharing between finder and owner</p>
        </div>
        <span class="cs-badge">Coming Soon</span>
      </div>`;
    return;
  }

  const isPhone = /^[\+\d\s\-\(\)]{6,}$/.test(item.contact);
  const isEmail = isValidEmail(item.contact);

  if (content) content.innerHTML = `
    <div class="firta-badge">🔷 Registered on Firta</div>

    <div class="item-hero-card page-fade">
      <div class="lost-alert-banner">
        <span class="lost-alert-icon">🔴</span>
        <div>
          <strong>This item has been reported lost</strong>
          <p>The owner is looking for it — please get in touch!</p>
        </div>
      </div>

      <div class="item-hero-icon">📦</div>
      <h1>${escapeHTML(item.name)}</h1>
      <p class="item-subtitle">Help return this item to its owner.</p>

      <div class="contact-section">
        <div class="contact-label">Owner Contact Information</div>
        <div class="contact-value">
          ${isPhone ? '📞' : isEmail ? '✉️' : '📋'}
          ${escapeHTML(item.contact)}
        </div>
      </div>

      <div class="contact-actions">
        ${isPhone ? `
        <a href="tel:${encodeURIComponent(item.contact)}" class="contact-btn call-btn">
          <span class="cb-icon">📞</span>
          Call Owner
        </a>` : `
        <div class="contact-btn" style="opacity:0.4;cursor:not-allowed">
          <span class="cb-icon">📞</span>
          No phone
        </div>`}

        ${isEmail ? `
        <a href="mailto:${encodeURIComponent(item.contact)}?subject=${encodeURIComponent('Found your item: ' + item.name)}&body=${encodeURIComponent('Hi,\n\nI found your item \'' + item.name + '\' registered on Firta.\n\nPlease contact me to arrange pickup.\n\nThank you!')}"
           class="contact-btn email-btn">
          <span class="cb-icon">✉️</span>
          Send Email
        </a>` : `
        <div class="contact-btn" style="opacity:0.4;cursor:not-allowed">
          <span class="cb-icon">✉️</span>
          No email
        </div>`}
      </div>
    </div>

    <div class="coming-soon-card">
      <span class="cs-icon">📍</span>
      <div class="cs-text">
        <h3>Live GPS Tracking</h3>
        <p>Real-time location sharing between finder and owner</p>
      </div>
      <span class="cs-badge">Coming Soon</span>
    </div>`;
}

(function init() {
  const page = window.location.pathname.split('/').pop() || 'index.html';

  if (page === 'signup.html') {
    const form = document.getElementById('signup-form');
    if (form) form.addEventListener('submit', handleSignup);
  }

  if (page === 'login.html') {
    const form = document.getElementById('login-form');
    if (form) form.addEventListener('submit', handleLogin);
    if (getSession()) window.location.href = 'dashboard.html';
  }

  if (page === 'dashboard.html') {
    loadDashboard();
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  }

  if (page === 'add-item.html') {
    requireAuth();
    const form = document.getElementById('add-item-form');
    if (form) form.addEventListener('submit', handleAddItem);
  }

  if (page === 'qr.html') {
    requireAuth();
    loadQRPage();
  }

  if (page === 'item.html') {
    loadItemPage();
  }
})();
