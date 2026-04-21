const SUPABASE_URL = 'https://zjbgwmildygmyvderadf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yOk-XtOJtwWXfdGvfF9ZoA_KOGz_p-R';  

async function supabaseFetch(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        // Return the inserted row
        'Prefer': method === 'POST' ? 'return=representation' : ''
      }
    };
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


// ============================================
//  SESSION HELPERS (simple localStorage auth)
// ============================================

// Save logged-in user to localStorage
function setSession(user) {
  localStorage.setItem('firta_user', JSON.stringify(user));
}

// Get logged-in user from localStorage
function getSession() {
  try {
    return JSON.parse(localStorage.getItem('firta_user'));
  } catch { return null; }
}

// Clear session (logout)
function clearSession() {
  localStorage.removeItem('firta_user');
}

// Redirect if not logged in (call on protected pages)
function requireAuth() {
  const user = getSession();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}


// ============================================
//  UI HELPERS
// ============================================

// Show an error or success message in a div
function showAlert(elementId, message, type = 'error') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = message;
  el.className = `alert alert-${type}`;
  el.style.display = 'block';
  // Scroll to alert
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Hide an alert div
function hideAlert(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.style.display = 'none';
}

// Set a button to loading state
function setButtonLoading(btn, loadingText = 'Loading...') {
  btn.dataset.original = btn.innerHTML;
  btn.innerHTML = `<span class="spinner"></span> ${loadingText}`;
  btn.disabled = true;
}

// Restore button from loading state
function resetButton(btn) {
  btn.innerHTML = btn.dataset.original || btn.innerHTML;
  btn.disabled = false;
}

// Get URL query param: e.g. getParam('id') from ?id=abc
function getParam(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

// Simple email validator
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Show or hide loading overlay
function showLoader() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.remove('hidden');
}
function hideLoader() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.add('hidden');
}


// ============================================
//  SIGNUP LOGIC
// ============================================
async function handleSignup(e) {
  e.preventDefault();
  hideAlert('signup-alert');

  const name    = document.getElementById('name').value.trim();
  const email   = document.getElementById('email').value.trim();
  const phone   = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();
  const password = document.getElementById('password').value;

  // Basic validation
  if (!name || !email || !phone || !password) {
    showAlert('signup-alert', '⚠️ Please fill in all required fields.', 'error');
    return;
  }
  if (!isValidEmail(email)) {
    showAlert('signup-alert', '⚠️ Please enter a valid email address.', 'error');
    return;
  }
  if (password.length < 6) {
    showAlert('signup-alert', '⚠️ Password must be at least 6 characters.', 'error');
    return;
  }

  const btn = document.getElementById('signup-btn');
  setButtonLoading(btn, 'Creating account...');

  // Check if email already exists
  const { data: existing } = await supabaseFetch(`/users?email=eq.${encodeURIComponent(email)}&select=id`);
  if (existing && existing.length > 0) {
    showAlert('signup-alert', '⚠️ An account with this email already exists. <a href="login.html">Sign in</a>', 'error');
    resetButton(btn);
    return;
  }

  // Insert new user
  // NOTE: In production, NEVER store plain text passwords!
  // Use Supabase Auth instead. This is simplified for learning.
  const { data, error } = await supabaseFetch('/users', 'POST', {
    name, email, phone, address,
    password // ⚠️ For demo only. Use Supabase Auth in production!
  });

  resetButton(btn);

  if (error) {
    showAlert('signup-alert', `❌ ${error}`, 'error');
    return;
  }

  // Save session and redirect
  if (data && data.length > 0) {
    setSession({ id: data[0].id, name: data[0].name, email: data[0].email });
  }
  showAlert('signup-alert', '✅ Account created! Redirecting...', 'success');
  setTimeout(() => window.location.href = 'dashboard.html', 1200);
}


// ============================================
//  LOGIN LOGIC
// ============================================
async function handleLogin(e) {
  e.preventDefault();
  hideAlert('login-alert');

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showAlert('login-alert', '⚠️ Please enter your email and password.', 'error');
    return;
  }

  const btn = document.getElementById('login-btn');
  setButtonLoading(btn, 'Signing in...');

  // Look up user by email + password
  const { data, error } = await supabaseFetch(
    `/users?email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(password)}&select=id,name,email`
  );

  resetButton(btn);

  if (error) {
    showAlert('login-alert', `❌ ${error}`, 'error');
    return;
  }

  if (!data || data.length === 0) {
    showAlert('login-alert', '❌ Invalid email or password.', 'error');
    return;
  }

  setSession({ id: data[0].id, name: data[0].name, email: data[0].email });
  showAlert('login-alert', '✅ Logged in! Redirecting...', 'success');
  setTimeout(() => window.location.href = 'dashboard.html', 1000);
}


// ============================================
//  DASHBOARD LOGIC
// ============================================
async function loadDashboard() {
  const user = requireAuth();
  if (!user) return;

  // Fill in user info
  const nameEl = document.getElementById('user-name');
  const welcomeEl = document.getElementById('welcome-name');
  if (nameEl) nameEl.textContent = user.name;
  if (welcomeEl) welcomeEl.textContent = user.name.split(' ')[0];

  showLoader();

  // Fetch items for this user
  const { data: items, error } = await supabaseFetch(
    `/items?user_id=eq.${user.id}&order=created_at.desc`
  );

  hideLoader();

  const countEl = document.getElementById('item-count');
  if (countEl) countEl.textContent = items ? items.length : 0;

  if (error) {
    document.getElementById('items-container').innerHTML =
      `<p class="text-muted">Could not load items. ${error}</p>`;
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
  const created = new Date(item.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
  return `
    <div class="item-card">
      <div class="item-card-top">
        <div class="item-icon">📦</div>
        <div>
          <div class="item-name">${escapeHTML(item.name)}</div>
          <div class="item-contact">${escapeHTML(item.contact)}</div>
        </div>
        <span class="badge badge-active">Active</span>
      </div>
      <div style="font-size:12px; color:var(--gray-500); margin-bottom:16px;">
        Added ${created}
      </div>
      <div class="item-card-footer">
        <a href="qr.html?id=${item.id}" class="btn btn-primary btn-sm">
          📱 View QR
        </a>
        <a href="item.html?id=${item.id}" class="btn btn-ghost btn-sm" target="_blank">
          👁 Preview
        </a>
      </div>
    </div>`;
}

// Escape HTML to prevent XSS
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Handle logout
function handleLogout() {
  clearSession();
  window.location.href = 'index.html';
}


// ============================================
//  ADD ITEM LOGIC
// ============================================
async function handleAddItem(e) {
  e.preventDefault();
  hideAlert('item-alert');

  const user = getSession();
  if (!user) { window.location.href = 'login.html'; return; }

  const name    = document.getElementById('item-name').value.trim();
  const contact = document.getElementById('item-contact').value.trim();

  if (!name || !contact) {
    showAlert('item-alert', '⚠️ Please fill in all fields.', 'error');
    return;
  }

  const btn = document.getElementById('add-btn');
  setButtonLoading(btn, 'Saving item...');

  const { data, error } = await supabaseFetch('/items', 'POST', {
    name,
    contact,
    user_id: user.id
  });

  resetButton(btn);

  if (error) {
    showAlert('item-alert', `❌ ${error}`, 'error');
    return;
  }

  if (data && data.length > 0) {
    // Redirect to QR page with the new item's ID
    window.location.href = `qr.html?id=${data[0].id}`;
  }
}


// ============================================
//  QR PAGE LOGIC
// ============================================
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

  // Show item name and ID
  document.getElementById('qr-item-name').textContent = item.name;
  document.getElementById('qr-item-id').textContent = `ID: ${item.id}`;

  // Build the public URL (the URL someone gets when they scan the QR)
  // This creates an absolute URL to item.html
  const baseUrl = window.location.href.replace(/qr\.html.*$/, '');
  const itemUrl = `${baseUrl}item.html?id=${item.id}`;

  // Generate QR code using QRCode.js
  // QRCode is loaded via CDN in the HTML file
  new QRCode(document.getElementById('qr-code-container'), {
    text: itemUrl,
    width: 200,
    height: 200,
    colorDark: '#2563EB',   // Primary blue
    colorLight: '#FFFFFF',
    correctLevel: QRCode.CorrectLevel.H  // High error correction
  });

  // Setup download button
  document.getElementById('download-btn').addEventListener('click', () => {
    // Find the generated canvas or img
    const canvas = document.querySelector('#qr-code-container canvas');
    const img    = document.querySelector('#qr-code-container img');

    if (canvas) {
      const link = document.createElement('a');
      link.download = `firta-qr-${item.name.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } else if (img) {
      const link = document.createElement('a');
      link.download = `firta-qr-${item.name.replace(/\s+/g, '-')}.png`;
      link.href = img.src;
      link.click();
    }
  });
}


// ============================================
//  ITEM PUBLIC PAGE LOGIC
// ============================================
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

  // Detect if contact is a phone or email
  const isPhone = /^[\+\d\s\-\(\)]{6,}$/.test(item.contact);
  const isEmail = isValidEmail(item.contact);

  if (content) {
    content.innerHTML = `
      <div class="firta-badge">🔷 Registered on Firta</div>

      <div class="item-hero-card page-fade">
        <div class="item-hero-icon">📦</div>
        <h1>${escapeHTML(item.name)}</h1>
        <p class="item-subtitle">This item belongs to someone — help return it!</p>

        <div class="contact-section">
          <div class="contact-label">Contact Information</div>
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
          <a href="mailto:${encodeURIComponent(item.contact)}?subject=Found your item: ${encodeURIComponent(item.name)}&body=Hi, I found your item '${encodeURIComponent(item.name)}' registered on Firta. Please contact me to arrange pickup." class="contact-btn email-btn">
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
}


// ============================================
//  PAGE ROUTER – Run the right function
//  based on the current page's filename
// ============================================
(function init() {
  const page = window.location.pathname.split('/').pop() || 'index.html';

  if (page === 'signup.html') {
    const form = document.getElementById('signup-form');
    if (form) form.addEventListener('submit', handleSignup);
  }

  if (page === 'login.html') {
    const form = document.getElementById('login-form');
    if (form) form.addEventListener('submit', handleLogin);
    // If already logged in, redirect to dashboard
    if (getSession()) window.location.href = 'dashboard.html';
  }

  if (page === 'dashboard.html') {
    loadDashboard();
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  }

  if (page === 'add-item.html') {
    requireAuth(); // Redirect if not logged in
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
