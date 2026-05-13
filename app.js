const SUPABASE_URL = 'https://zjbgwmildygmyvderadf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yOk-XtOJtwWXfdGvfF9ZoA_KOGz_p-R';


// ============================================
//  SUPABASE FETCH WRAPPER
// ============================================

/**
 * Makes a request to the Supabase REST API
 * @param {string} endpoint  e.g. '/users' or '/items?id=eq.123'
 * @param {string} method    GET | POST | PATCH | DELETE
 * @param {object} body      request body for POST / PATCH
 * @returns {Promise<{data, error}>}
 */
async function supabaseFetch(endpoint, method = 'GET', body = null) {
  try {
    const headers = {
      'Content-Type':  'application/json',
      'apikey':        SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer':        method === 'POST' ? 'return=representation' : ''
    };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res  = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, options);
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
//  SESSION HELPERS  (localStorage-based auth)
// ============================================

// Save logged-in user to localStorage
function setSession(user) {
  localStorage.setItem('firta_user', JSON.stringify(user));
}

// Get logged-in user from localStorage
function getSession() {
  try { return JSON.parse(localStorage.getItem('firta_user')); }
  catch { return null; }
}

// Clear session (logout)
function clearSession() {
  localStorage.removeItem('firta_user');
}

// Redirect to login if not logged in — call on protected pages
function requireAuth() {
  const user = getSession();
  if (!user) { window.location.href = 'login.html'; return null; }
  return user;
}


// ============================================
//  UI HELPERS
// ============================================

// Show error or success message inside a div
function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML     = msg;
  el.className     = `alert alert-${type}`;
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Hide an alert div
function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// Put a button into loading state
function setButtonLoading(btn, text = 'Loading...') {
  btn.dataset.original = btn.innerHTML;
  btn.innerHTML = `<span class="spinner"></span> ${text}`;
  btn.disabled  = true;
}

// Restore button from loading state
function resetButton(btn) {
  btn.innerHTML = btn.dataset.original || btn.innerHTML;
  btn.disabled  = false;
}

// Get a URL query param — e.g. getParam('id') from ?id=abc
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

// Simple email format check
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Show / hide the full-page loading overlay
function showLoader() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.remove('hidden');
}
function hideLoader() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.add('hidden');
}

// Escape HTML to prevent XSS when injecting user data into the DOM
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


// ============================================
//  SIGNUP
// ============================================
async function handleSignup(e) {
  e.preventDefault();
  hideAlert('signup-alert');

  const name     = document.getElementById('name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const phone    = document.getElementById('phone').value.trim();
  const address  = document.getElementById('address').value.trim();
  const password = document.getElementById('password').value;

  // Validation
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

  // Check if email already registered
  const { data: existing } = await supabaseFetch(
    `/users?email=eq.${encodeURIComponent(email)}&select=id`
  );
  if (existing && existing.length > 0) {
    showAlert('signup-alert', '⚠️ An account with this email already exists. <a href="login.html">Sign in</a>', 'error');
    resetButton(btn);
    return;
  }

  // Insert new user
  // ⚠️  Password stored as plain text — for demo only.
  //     Use Supabase Auth in production for proper security.
  const { data, error } = await supabaseFetch('/users', 'POST', {
    name, email, phone, address, password
  });

  resetButton(btn);

  if (error) {
    showAlert('signup-alert', `❌ ${error}`, 'error');
    return;
  }

  if (data && data.length > 0) {
    setSession({ id: data[0].id, name: data[0].name, email: data[0].email });
  }
  showAlert('signup-alert', '✅ Account created! Redirecting...', 'success');
  setTimeout(() => window.location.href = 'dashboard.html', 1200);
}


// ============================================
//  LOGIN
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
//  DASHBOARD
// ============================================
async function loadDashboard() {
  const user = requireAuth();
  if (!user) return;

  // Fill in user name in header
  const nameEl    = document.getElementById('user-name');
  const welcomeEl = document.getElementById('welcome-name');
  if (nameEl)    nameEl.textContent    = user.name;
  if (welcomeEl) welcomeEl.textContent = user.name.split(' ')[0];

  showLoader();
  const { data: items, error } = await supabaseFetch(
    `/items?user_id=eq.${user.id}&order=created_at.desc`
  );
  hideLoader();

  // Update total count stat
  const countEl = document.getElementById('item-count');
  if (countEl) countEl.textContent = items ? items.length : 0;

  if (error) {
    document.getElementById('items-container').innerHTML =
      `<p class="text-muted" style="padding:24px">Could not load items. ${error}</p>`;
    return;
  }

  renderItems(items || []);
}

// Render the items grid or empty state
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

// Build one item card HTML string
function itemCardHTML(item) {
  const created = new Date(item.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  return `
    <div class="item-card">
      <div class="item-card-top">
        <div class="item-icon">📦</div>
        <div style="flex:1;min-width:0">
          <div class="item-name">${escapeHTML(item.name)}</div>
          <div class="item-contact">${escapeHTML(item.contact)}</div>
        </div>
        <span class="badge badge-active">Active</span>
      </div>
      <div style="font-size:12px;color:var(--gray-500);margin-bottom:16px;">
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

// Handle logout
function handleLogout() {
  clearSession();
  window.location.href = 'index.html';
}


// ============================================
//  ADD ITEM
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
    window.location.href = `qr.html?id=${data[0].id}`;
  }
}


// ============================================
//  QR PAGE
// ============================================
async function loadQRPage() {
  const itemId = getParam('id');
  if (!itemId) {
    document.getElementById('qr-content').innerHTML =
      '<p class="text-muted">No item ID found.</p>';
    return;
  }

  showLoader();
  const { data, error } = await supabaseFetch(`/items?id=eq.${itemId}`);
  hideLoader();

  if (error || !data || data.length === 0) {
    document.getElementById('qr-content').innerHTML =
      '<p class="text-muted">Item not found.</p>';
    return;
  }

  const item = data[0];

  document.getElementById('qr-item-name').textContent = item.name;
  document.getElementById('qr-item-id').textContent   = `ID: ${item.id}`;

  // Build the public URL embedded in the QR code
  const baseUrl = window.location.href.replace(/qr\.html.*$/, '');
  const itemUrl = `${baseUrl}item.html?id=${item.id}`;

  // Generate QR using QRCode.js (loaded from CDN in qr.html)
  new QRCode(document.getElementById('qr-code-container'), {
    text:         itemUrl,
    width:        200,
    height:       200,
    colorDark:    '#2563EB',
    colorLight:   '#FFFFFF',
    correctLevel: QRCode.CorrectLevel.H
  });

  // Download button
  document.getElementById('download-btn').addEventListener('click', () => {
    const canvas = document.querySelector('#qr-code-container canvas');
    const img    = document.querySelector('#qr-code-container img');
    if (!canvas && !img) return;
    const link    = document.createElement('a');
    link.download = `firta-qr-${item.name.replace(/\s+/g, '-')}.png`;
    link.href     = canvas ? canvas.toDataURL('image/png') : img.src;
    link.click();
  });
}


// ============================================
//  MULTILINGUAL SYSTEM — REAL DYNAMIC TRANSLATION
//
//  How it works:
//  1. Reads navigator.languages to detect the
//     finder's browser language (e.g. 'ne' for Nepali)
//  2. If the page language already matches, no
//     translation needed — renders immediately
//  3. Otherwise, translates ALL dynamic content
//     (item name, contact info, UI strings) from
//     whatever language the owner wrote in, INTO
//     the finder's language — using MyMemory API
//     (free, no API key needed, 5000 words/day)
//  4. Caches the result in sessionStorage so
//     switching tabs doesn't re-translate
//  5. Shows a language switcher so finder can
//     manually override if auto-detect is wrong
//
//  Example:
//  Japanese owner registers "青いバックパック"
//  Nepali finder scans → page renders in Nepali:
//  "नीलो ब्याकप्याक"  ✅
// ============================================


// ── LANGUAGE MAP ─────────────────────────────────────────────────────────
// Maps browser language codes to MyMemory language codes + display info.
// MyMemory uses ISO 639-1 codes. RTL flag drives CSS direction.
const LANG_MAP = {
  'en':    { code: 'en',    name: 'English',    flag: '🇬🇧', dir: 'ltr' },
  'ne':    { code: 'ne',    name: 'नेपाली',      flag: '🇳🇵', dir: 'ltr' },
  'hi':    { code: 'hi',    name: 'हिन्दी',      flag: '🇮🇳', dir: 'ltr' },
  'zh':    { code: 'zh',    name: '中文',         flag: '🇨🇳', dir: 'ltr' },
  'zh-cn': { code: 'zh',   name: '中文(简体)',    flag: '🇨🇳', dir: 'ltr' },
  'zh-tw': { code: 'zh',   name: '中文(繁體)',    flag: '🇹🇼', dir: 'ltr' },
  'es':    { code: 'es',    name: 'Español',     flag: '🇪🇸', dir: 'ltr' },
  'fr':    { code: 'fr',    name: 'Français',    flag: '🇫🇷', dir: 'ltr' },
  'ar':    { code: 'ar',    name: 'العربية',     flag: '🇸🇦', dir: 'rtl' },
  'pt':    { code: 'pt',    name: 'Português',   flag: '🇧🇷', dir: 'ltr' },
  'pt-br': { code: 'pt',   name: 'Português',   flag: '🇧🇷', dir: 'ltr' },
  'de':    { code: 'de',    name: 'Deutsch',     flag: '🇩🇪', dir: 'ltr' },
  'ja':    { code: 'ja',    name: '日本語',       flag: '🇯🇵', dir: 'ltr' },
  'ko':    { code: 'ko',    name: '한국어',       flag: '🇰🇷', dir: 'ltr' },
  'ru':    { code: 'ru',    name: 'Русский',     flag: '🇷🇺', dir: 'ltr' },
  'it':    { code: 'it',    name: 'Italiano',    flag: '🇮🇹', dir: 'ltr' },
  'tr':    { code: 'tr',    name: 'Türkçe',      flag: '🇹🇷', dir: 'ltr' },
  'id':    { code: 'id',    name: 'Indonesia',   flag: '🇮🇩', dir: 'ltr' },
  'ms':    { code: 'ms',    name: 'Melayu',      flag: '🇲🇾', dir: 'ltr' },
  'th':    { code: 'th',    name: 'ภาษาไทย',     flag: '🇹🇭', dir: 'ltr' },
  'vi':    { code: 'vi',    name: 'Tiếng Việt',  flag: '🇻🇳', dir: 'ltr' },
  'bn':    { code: 'bn',    name: 'বাংলা',        flag: '🇧🇩', dir: 'ltr' },
  'ur':    { code: 'ur',    name: 'اردو',         flag: '🇵🇰', dir: 'rtl' },
  'sw':    { code: 'sw',    name: 'Kiswahili',   flag: '🇰🇪', dir: 'ltr' },
};

// ── detectFinderLanguage ──────────────────────────────────────────────────
// Reads navigator.languages (priority list from browser settings).
// Returns the LANG_MAP entry for the best match, defaulting to English.
function detectFinderLanguage() {
  const preferred = [
    ...(navigator.languages || []),
    navigator.language || 'en'
  ];

  for (const tag of preferred) {
    const lower = tag.toLowerCase();
    // Try exact match first (e.g. 'pt-br')
    if (LANG_MAP[lower]) return LANG_MAP[lower];
    // Then base code (e.g. 'pt' from 'pt-BR')
    const base = lower.split('-')[0];
    if (LANG_MAP[base]) return LANG_MAP[base];
  }
  return LANG_MAP['en'];
}

// ── translateText ─────────────────────────────────────────────────────────
// Translates a string using MyMemory free API.
// No API key required. 5000 words/day free limit.
// Returns the translated string, or the original on failure.
async function translateText(text, targetLang) {
  if (!text || !text.trim()) return text;

  // MyMemory needs a language pair like "en|ne" but since we don't
  // know the source language, we use "autodetect|targetCode"
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${targetLang}`;

  try {
    const res  = await fetch(url);
    const json = await res.json();

    if (json.responseStatus === 200 && json.responseData?.translatedText) {
      return json.responseData.translatedText;
    }
    // If MyMemory returns an error or quota exceeded, return original
    return text;
  } catch {
    return text;
  }
}

// ── translateBatch ────────────────────────────────────────────────────────
// Translates multiple strings in parallel.
// Returns an array of translated strings in the same order.
async function translateBatch(texts, targetLang) {
  return Promise.all(texts.map(t => translateText(t, targetLang)));
}

// ── getCacheKey ───────────────────────────────────────────────────────────
function getCacheKey(itemId, langCode) {
  return `firta_trans_${itemId}_${langCode}`;
}

// ── buildItemPageHTML ─────────────────────────────────────────────────────
// Builds the full item.html inner HTML from (possibly translated) strings.
function buildItemPageHTML(strings, item, langInfo) {
  const isPhone = /^[\+\d\s\-\(\)]{6,}$/.test(item.contact);
  const isEmail = isValidEmail(item.contact);

  const langOptions = Object.entries(LANG_MAP)
    // deduplicate by display name
    .filter(([key], _, arr) =>
      arr.findIndex(([, v]) => v.name === LANG_MAP[key].name) === arr.indexOf(arr.find(([k]) => k === key))
    )
    .map(([key, val]) =>
      `<option value="${key}" ${key === langInfo._key ? 'selected' : ''}>${val.flag} ${val.name}</option>`
    ).join('');

  return `
    <!-- Language bar -->
    <div class="lang-bar">
      <div class="lang-detected">
        🌐 <span id="lang-status">Translating to ${langInfo.flag} ${langInfo.name}...</span>
      </div>
      <select class="lang-select" id="lang-select" onchange="handleLangSwitch(this.value)">
        ${langOptions}
      </select>
    </div>

    <div class="firta-badge">🔷 ${strings.badge}</div>

    <div class="item-hero-card page-fade">
      <div class="item-hero-icon">📦</div>
      <h1 id="item-title">${escapeHTML(strings.itemName)}</h1>
      <p class="item-subtitle" id="item-subtitle">${strings.subtitle}</p>

      <div class="contact-section">
        <div class="contact-label" id="contact-label">${strings.contactLabel}</div>
        <div class="contact-value">
          ${isPhone ? '📞' : isEmail ? '✉️' : '📋'}
          <span id="contact-value">${escapeHTML(strings.contactValue)}</span>
        </div>
      </div>

      <div class="contact-actions">
        ${isPhone ? `
        <a href="tel:${encodeURIComponent(item.contact)}" class="contact-btn call-btn">
          <span class="cb-icon">📞</span>
          <span id="call-btn-text">${strings.callBtn}</span>
        </a>` : `
        <div class="contact-btn" style="opacity:0.4;cursor:not-allowed">
          <span class="cb-icon">📞</span>
          <span>${strings.noPhone}</span>
        </div>`}

        ${isEmail ? `
        <a href="mailto:${encodeURIComponent(item.contact)}?subject=${encodeURIComponent(strings.emailSubject)}&body=${encodeURIComponent(strings.emailBody)}"
           class="contact-btn email-btn">
          <span class="cb-icon">✉️</span>
          <span id="email-btn-text">${strings.emailBtn}</span>
        </a>` : `
        <div class="contact-btn" style="opacity:0.4;cursor:not-allowed">
          <span class="cb-icon">✉️</span>
          <span>${strings.noEmail}</span>
        </div>`}
      </div>
    </div>

    <div class="coming-soon-card">
      <span class="cs-icon">📍</span>
      <div class="cs-text">
        <h3 id="gps-title">${strings.gpsTitle}</h3>
        <p id="gps-desc">${strings.gpsDesc}</p>
      </div>
      <span class="cs-badge" id="gps-badge">${strings.gpsBadge}</span>
    </div>`;
}

// ── ITEM PUBLIC PAGE ──────────────────────────────────────────────────────
async function loadItemPage() {
  const itemId  = getParam('id');
  const content = document.getElementById('item-content');

  // Detect finder's language from browser settings
  const langInfo    = detectFinderLanguage();
  langInfo._key     = Object.keys(LANG_MAP).find(k => LANG_MAP[k] === langInfo) || 'en';
  const targetCode  = langInfo.code;
  const isEnglish   = targetCode === 'en';

  // Apply direction (RTL for Arabic/Urdu)
  document.documentElement.setAttribute('lang', targetCode);
  document.documentElement.setAttribute('dir',  langInfo.dir);

  if (!itemId) {
    if (content) content.innerHTML = `
      <div class="card text-center" style="padding:48px">
        <div style="font-size:48px;margin-bottom:16px">❓</div>
        <h2>Item Not Found</h2>
        <p class="text-muted mt-1">No item ID was provided in the URL.</p>
      </div>`;
    return;
  }

  // Show a translating spinner while we fetch + translate
  if (content) content.innerHTML = `
    <div class="translating-overlay">
      <div class="spinner spinner-dark" style="width:32px;height:32px;margin:0 auto 16px"></div>
      <p id="translate-status">Loading item...</p>
    </div>`;

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
  window._firtaItem = item; // store for re-render on language switch

  // --- Check session cache first ---
  const cacheKey = getCacheKey(item.id, targetCode);
  const cached   = sessionStorage.getItem(cacheKey);

  let strings;

  if (cached) {
    // Use cached translation — instant re-render
    strings = JSON.parse(cached);
    renderItemPage(strings, item, langInfo, content, false);
    return;
  }

  // --- UI strings to translate ---
  // These are the fixed labels. Translated in parallel with item content.
  const UI_ENGLISH = [
    'Registered on Firta',
    'This item belongs to someone — help return it!',
    'Contact Information',
    'Call Owner',
    'Send Email',
    'No phone available',
    'No email available',
    'Live GPS Tracking',
    'Real-time location sharing between finder and owner',
    'Coming Soon',
    `Found your item: ${item.name}`,
    `Hi,\n\nI found your item '${item.name}' registered on Firta.\n\nPlease contact me to arrange pickup.\n\nThank you!`,
  ];

  // Dynamic content from the database (owner entered this — could be any language)
  const DYNAMIC = [
    item.name,
    item.contact,
  ];

  // Update status text
  const statusEl = document.getElementById('translate-status');
  if (statusEl) statusEl.textContent = `Translating to ${langInfo.name}...`;

  // If target is English, skip API call for UI strings (they're already English)
  // but still translate dynamic content in case owner wrote in another language
  let translatedUI, translatedDynamic;

  if (isEnglish) {
    translatedUI     = UI_ENGLISH;
    translatedDynamic = DYNAMIC; // keep as-is for English
  } else {
    // Translate everything in parallel — UI strings + owner's content
    [translatedUI, translatedDynamic] = await Promise.all([
      translateBatch(UI_ENGLISH, targetCode),
      translateBatch(DYNAMIC, targetCode),
    ]);
  }

  // Build strings object
  strings = {
    badge:        translatedUI[0],
    subtitle:     translatedUI[1],
    contactLabel: translatedUI[2],
    callBtn:      translatedUI[3],
    emailBtn:     translatedUI[4],
    noPhone:      translatedUI[5],
    noEmail:      translatedUI[6],
    gpsTitle:     translatedUI[7],
    gpsDesc:      translatedUI[8],
    gpsBadge:     translatedUI[9],
    emailSubject: translatedUI[10],
    emailBody:    translatedUI[11],
    // Owner's content — translated from whatever language they used
    itemName:     translatedDynamic[0],
    contactValue: translatedDynamic[1],
  };

  // Cache so switching tabs doesn't re-translate
  try { sessionStorage.setItem(cacheKey, JSON.stringify(strings)); } catch {}

  renderItemPage(strings, item, langInfo, content, true);
}

// ── renderItemPage ────────────────────────────────────────────────────────
function renderItemPage(strings, item, langInfo, content, freshTranslation) {
  content.innerHTML = buildItemPageHTML(strings, item, langInfo);

  // Update language status text in bar
  const langStatus = document.getElementById('lang-status');
  if (langStatus) {
    langStatus.textContent = freshTranslation
      ? `${langInfo.flag} Translated to ${langInfo.name}`
      : `${langInfo.flag} ${langInfo.name}`;
  }

  // Update powered-by footer
  const poweredEl = document.querySelector('.powered-by');
  if (poweredEl) poweredEl.innerHTML = `Powered by <a href="index.html">Firta</a>`;
}

// ── handleLangSwitch ──────────────────────────────────────────────────────
// Called when finder manually picks a language from the dropdown.
async function handleLangSwitch(langKey) {
  const item = window._firtaItem;
  if (!item) return;

  const langInfo  = LANG_MAP[langKey];
  if (!langInfo) return;
  langInfo._key   = langKey;

  // Update direction immediately
  document.documentElement.setAttribute('lang', langInfo.code);
  document.documentElement.setAttribute('dir',  langInfo.dir);

  const content = document.getElementById('item-content');

  // Show translating state
  const langStatus = document.getElementById('lang-status');
  if (langStatus) langStatus.textContent = `Translating to ${langInfo.name}...`;
  const selectEl = document.getElementById('lang-select');
  if (selectEl) selectEl.disabled = true;

  // Check cache first
  const cacheKey = getCacheKey(item.id, langInfo.code);
  const cached   = sessionStorage.getItem(cacheKey);

  let strings;

  if (cached) {
    strings = JSON.parse(cached);
  } else {
    const isEnglish = langInfo.code === 'en';

    const UI_ENGLISH = [
      'Registered on Firta',
      'This item belongs to someone — help return it!',
      'Contact Information',
      'Call Owner',
      'Send Email',
      'No phone available',
      'No email available',
      'Live GPS Tracking',
      'Real-time location sharing between finder and owner',
      'Coming Soon',
      `Found your item: ${item.name}`,
      `Hi,\n\nI found your item '${item.name}' registered on Firta.\n\nPlease contact me to arrange pickup.\n\nThank you!`,
    ];
    const DYNAMIC = [item.name, item.contact];

    let translatedUI, translatedDynamic;
    if (isEnglish) {
      translatedUI      = UI_ENGLISH;
      translatedDynamic = DYNAMIC;
    } else {
      [translatedUI, translatedDynamic] = await Promise.all([
        translateBatch(UI_ENGLISH, langInfo.code),
        translateBatch(DYNAMIC, langInfo.code),
      ]);
    }

    strings = {
      badge:        translatedUI[0],
      subtitle:     translatedUI[1],
      contactLabel: translatedUI[2],
      callBtn:      translatedUI[3],
      emailBtn:     translatedUI[4],
      noPhone:      translatedUI[5],
      noEmail:      translatedUI[6],
      gpsTitle:     translatedUI[7],
      gpsDesc:      translatedUI[8],
      gpsBadge:     translatedUI[9],
      emailSubject: translatedUI[10],
      emailBody:    translatedUI[11],
      itemName:     translatedDynamic[0],
      contactValue: translatedDynamic[1],
    };

    try { sessionStorage.setItem(cacheKey, JSON.stringify(strings)); } catch {}
  }

  renderItemPage(strings, item, langInfo, content, !cached);
}

//  PAGE ROUTER
//  Runs the right function based on filename
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
