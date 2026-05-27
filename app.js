const SUPABASE_URL = 'https://zjbgwmildygmyvderadf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yOk-XtOJtwWXfdGvfF9ZoA_KOGz_p-R';

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

function setSession(user)  { localStorage.setItem('firta_user', JSON.stringify(user)); }
function clearSession()    { localStorage.removeItem('firta_user'); }
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
  el.innerHTML     = msg;
  el.className     = `alert alert-${type}`;
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
  btn.disabled  = true;
}
function resetButton(btn) {
  btn.innerHTML = btn.dataset.original || btn.innerHTML;
  btn.disabled  = false;
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
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}

async function handleSignup(e) {
  e.preventDefault();
  hideAlert('signup-alert');

  const name     = document.getElementById('name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const phone    = document.getElementById('phone').value.trim();
  const address  = document.getElementById('address').value.trim();
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

  const { data: existing } = await supabaseFetch(
    `/users?email=eq.${encodeURIComponent(email)}&select=id`
  );
  if (existing && existing.length > 0) {
    showAlert('signup-alert', '⚠️ An account with this email already exists. <a href="login.html">Sign in</a>', 'error');
    resetButton(btn); return;
  }

  const { data, error } = await supabaseFetch('/users', 'POST', {
    name, email, phone, address, password
  });
  resetButton(btn);

  if (error) { showAlert('signup-alert', `❌ ${error}`, 'error'); return; }

  if (data && data.length > 0) {
    setSession({ id: data[0].id, name: data[0].name, email: data[0].email });
  }
  showAlert('signup-alert', '✅ Account created! Redirecting...', 'success');
  setTimeout(() => window.location.href = 'dashboard.html', 1200);
}

async function handleLogin(e) {
  e.preventDefault();
  hideAlert('login-alert');

  const email    = document.getElementById('email').value.trim();
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
  if (!data || data.length === 0) {
    showAlert('login-alert', '❌ Invalid email or password.', 'error'); return;
  }

  setSession({ id: data[0].id, name: data[0].name, email: data[0].email });
  showAlert('login-alert', '✅ Logged in! Redirecting...', 'success');
  setTimeout(() => window.location.href = 'dashboard.html', 1000);
}

async function loadDashboard() {
  const user = requireAuth();
  if (!user) return;

  const nameEl    = document.getElementById('user-name');
  const welcomeEl = document.getElementById('welcome-name');
  if (nameEl)    nameEl.textContent    = user.name;
  if (welcomeEl) welcomeEl.textContent = user.name.split(' ')[0];

  showLoader();
  const { data: items, error } = await supabaseFetch(
    `/items?user_id=eq.${user.id}&order=created_at.desc`
  );
  hideLoader();

  // Update stat counts
  const total     = items ? items.length                                 : 0;
  const lostCount = items ? items.filter(i => i.status === 'lost').length : 0;
  const safeCount = total - lostCount;

  const totalEl = document.getElementById('item-count');
  const lostEl  = document.getElementById('lost-count');
  const safeEl  = document.getElementById('safe-count');
  if (totalEl) totalEl.textContent = total;
  if (lostEl)  lostEl.textContent  = lostCount;
  if (safeEl)  safeEl.textContent  = safeCount;

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

// Build one item card — includes Mark Lost / Mark Found toggle
function itemCardHTML(item) {
  const isLost  = item.status === 'lost';
  const created = new Date(item.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  return `
    <div class="item-card ${isLost ? 'item-card-lost' : ''}" id="card-${item.id}">

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

      <!-- Status strip -->
      <div class="item-status-strip ${isLost ? 'strip-lost' : 'strip-safe'}">
        <span>${isLost ? '🚨' : '🔒'}</span>
        <span>${isLost
          ? 'Marked as lost — finders can see your contact info'
          : 'Contact info is hidden from finders while safe'
        }</span>
      </div>

      <div style="font-size:12px;color:var(--gray-500);margin-bottom:16px;">
        Added ${created}
      </div>

      <div class="item-card-footer">
        <a href="qr.html?id=${item.id}" class="btn btn-primary btn-sm">
          📱 View QR
        </a>
        <button
          class="btn btn-sm ${isLost ? 'btn-success' : 'btn-danger'}"
          onclick="toggleStatus('${item.id}', '${item.status}', this)">
          ${isLost ? '✅ Mark Found' : '🔴 Mark Lost'}
        </button>
        <a href="item.html?id=${item.id}" class="btn btn-ghost btn-sm" target="_blank">
          👁 Preview
        </a>
      </div>
    </div>`;
}
// ── toggleStatus ──────────────────────────────────────────────────────────
// Called when owner clicks Mark Lost / Mark Found button
async function toggleStatus(itemId, currentStatus, btn) {
  const newStatus = currentStatus === 'lost' ? 'active' : 'lost';

  const confirmed = confirm(
    newStatus === 'lost'
      ? '🔴 Mark this item as LOST?\n\nFinders who scan the QR will be able to see your contact information and get in touch with you.'
      : '✅ Mark this item as FOUND / SAFE?\n\nYour contact info will be hidden from finders again.'
  );
  if (!confirmed) return;

  const original = btn.innerHTML;
  btn.innerHTML  = '<span class="spinner"></span>';
  btn.disabled   = true;

  const { error } = await supabaseFetch(
    `/items?id=eq.${itemId}`,
    'PATCH',
    { status: newStatus }
  );

  if (error) {
    btn.innerHTML = original;
    btn.disabled  = false;
    alert('❌ Could not update status. Please try again.');
    return;
  }

  // Reload the whole dashboard so stats + cards all update
  loadDashboard();
}

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
    showAlert('item-alert', '⚠️ Please fill in all fields.', 'error'); return;
  }

  const btn = document.getElementById('add-btn');
  setButtonLoading(btn, 'Saving item...');

  // New items always start as 'active' (safe — contact hidden)
  const { data, error } = await supabaseFetch('/items', 'POST', {
    name,
    contact,
    user_id: user.id,
    status:  'active'
  });

  resetButton(btn);

  if (error) { showAlert('item-alert', `❌ ${error}`, 'error'); return; }

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

  const baseUrl = window.location.href.replace(/qr\.html.*$/, '');
  const itemUrl = `${baseUrl}item.html?id=${item.id}`;

  new QRCode(document.getElementById('qr-code-container'), {
    text:         itemUrl,
    width:        200,
    height:       200,
    colorDark:    '#2563EB',
    colorLight:   '#FFFFFF',
    correctLevel: QRCode.CorrectLevel.H
  });

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
//  Detects finder's browser language via navigator.languages.
//  Translates ALL content (item name, contact info, every UI
//  string) from whatever language the owner used INTO the
//  finder's language using the free MyMemory API.
//
//  Example:
//  Japanese owner registers "青いバックパック"
//  Nepali finder scans → entire page renders in Nepali ✅
// ============================================

const LANG_MAP = {
  'en':    { code: 'en', name: 'English',    flag: '🇬🇧', dir: 'ltr' },
  'ne':    { code: 'ne', name: 'नेपाली',      flag: '🇳🇵', dir: 'ltr' },
  'hi':    { code: 'hi', name: 'हिन्दी',      flag: '🇮🇳', dir: 'ltr' },
  'zh':    { code: 'zh', name: '中文',         flag: '🇨🇳', dir: 'ltr' },
  'zh-cn': { code: 'zh', name: '中文(简体)',   flag: '🇨🇳', dir: 'ltr' },
  'zh-tw': { code: 'zh', name: '中文(繁體)',   flag: '🇹🇼', dir: 'ltr' },
  'es':    { code: 'es', name: 'Español',     flag: '🇪🇸', dir: 'ltr' },
  'fr':    { code: 'fr', name: 'Français',    flag: '🇫🇷', dir: 'ltr' },
  'ar':    { code: 'ar', name: 'العربية',     flag: '🇸🇦', dir: 'rtl' },
  'pt':    { code: 'pt', name: 'Português',   flag: '🇧🇷', dir: 'ltr' },
  'pt-br': { code: 'pt', name: 'Português',   flag: '🇧🇷', dir: 'ltr' },
  'de':    { code: 'de', name: 'Deutsch',     flag: '🇩🇪', dir: 'ltr' },
  'ja':    { code: 'ja', name: '日本語',       flag: '🇯🇵', dir: 'ltr' },
  'ko':    { code: 'ko', name: '한국어',       flag: '🇰🇷', dir: 'ltr' },
  'ru':    { code: 'ru', name: 'Русский',     flag: '🇷🇺', dir: 'ltr' },
  'it':    { code: 'it', name: 'Italiano',    flag: '🇮🇹', dir: 'ltr' },
  'tr':    { code: 'tr', name: 'Türkçe',      flag: '🇹🇷', dir: 'ltr' },
  'id':    { code: 'id', name: 'Indonesia',   flag: '🇮🇩', dir: 'ltr' },
  'ms':    { code: 'ms', name: 'Melayu',      flag: '🇲🇾', dir: 'ltr' },
  'th':    { code: 'th', name: 'ภาษาไทย',     flag: '🇹🇭', dir: 'ltr' },
  'vi':    { code: 'vi', name: 'Tiếng Việt',  flag: '🇻🇳', dir: 'ltr' },
  'bn':    { code: 'bn', name: 'বাংলা',        flag: '🇧🇩', dir: 'ltr' },
  'ur':    { code: 'ur', name: 'اردو',         flag: '🇵🇰', dir: 'rtl' },
  'sw':    { code: 'sw', name: 'Kiswahili',   flag: '🇰🇪', dir: 'ltr' },
};

function detectFinderLanguage() {
  const preferred = [...(navigator.languages || []), navigator.language || 'en'];
  for (const tag of preferred) {
    const lower = tag.toLowerCase();
    if (LANG_MAP[lower]) return LANG_MAP[lower];
    const base = lower.split('-')[0];
    if (LANG_MAP[base]) return LANG_MAP[base];
  }
  return LANG_MAP['en'];
}

async function translateText(text, targetLang) {
  if (!text || !text.trim()) return text;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${targetLang}`;
  try {
    const res  = await fetch(url);
    const json = await res.json();
    if (json.responseStatus === 200 && json.responseData?.translatedText) {
      return json.responseData.translatedText;
    }
    return text;
  } catch { return text; }
}

async function translateBatch(texts, targetLang) {
  return Promise.all(texts.map(t => translateText(t, targetLang)));
}

function getCacheKey(itemId, langCode) {
  return `firta_trans_${itemId}_${langCode}`;
}

// Builds the translated strings object — shared by first load and language switch
async function buildTranslatedStrings(item, langCode) {
  const isEnglish = langCode === 'en';

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

  // Dynamic content — could be in any language the owner used
  const DYNAMIC = [item.name, item.contact];

  let translatedUI, translatedDynamic;

  if (isEnglish) {
    translatedUI      = UI_ENGLISH;
    translatedDynamic = DYNAMIC;
  } else {
    [translatedUI, translatedDynamic] = await Promise.all([
      translateBatch(UI_ENGLISH, langCode),
      translateBatch(DYNAMIC, langCode),
    ]);
  }

  return {
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
}

function buildLangOptions(selectedKey) {
  return Object.entries(LANG_MAP)
    .filter(([key], _, arr) =>
      arr.findIndex(([, v]) => v.name === LANG_MAP[key].name) === arr.indexOf(arr.find(([k]) => k === key))
    )
    .map(([key, val]) =>
      `<option value="${key}" ${key === selectedKey ? 'selected' : ''}>${val.flag} ${val.name}</option>`
    ).join('');
}

// Builds the full item page HTML from translated strings
function buildItemPageHTML(strings, item, langInfo, langKey) {
  const isPhone = /^[\+\d\s\-\(\)]{6,}$/.test(item.contact);
  const isEmail = isValidEmail(item.contact);

  return `
    <div class="lang-bar">
      <div class="lang-detected">
        🌐 <span id="lang-status">${langInfo.flag} ${langInfo.name}</span>
      </div>
      <select class="lang-select" id="lang-select" onchange="handleLangSwitch(this.value)">
        ${buildLangOptions(langKey)}
      </select>
    </div>

    <div class="firta-badge">🔷 ${strings.badge}</div>

    <div class="item-hero-card page-fade">
      <div class="item-hero-icon">📦</div>
      <h1>${escapeHTML(strings.itemName)}</h1>
      <p class="item-subtitle">${strings.subtitle}</p>

      <div class="contact-section">
        <div class="contact-label">${strings.contactLabel}</div>
        <div class="contact-value">
          ${isPhone ? '📞' : isEmail ? '✉️' : '📋'}
          <span>${escapeHTML(strings.contactValue)}</span>
        </div>
      </div>

      <div class="contact-actions">
        ${isPhone ? `
        <a href="tel:${encodeURIComponent(item.contact)}" class="contact-btn call-btn">
          <span class="cb-icon">📞</span>
          <span>${strings.callBtn}</span>
        </a>` : `
        <div class="contact-btn" style="opacity:0.4;cursor:not-allowed">
          <span class="cb-icon">📞</span>
          <span>${strings.noPhone}</span>
        </div>`}

        ${isEmail ? `
        <a href="mailto:${encodeURIComponent(item.contact)}?subject=${encodeURIComponent(strings.emailSubject)}&body=${encodeURIComponent(strings.emailBody)}"
           class="contact-btn email-btn">
          <span class="cb-icon">✉️</span>
          <span>${strings.emailBtn}</span>
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
        <h3>${strings.gpsTitle}</h3>
        <p>${strings.gpsDesc}</p>
      </div>
      <span class="cs-badge">${strings.gpsBadge}</span>
    </div>`;
}

// Builds the "item is safe / not lost yet" page HTML
function buildSafePageHTML(langInfo) {
  return `
    <div class="lang-bar">
      <div class="lang-detected">🌐 <span>${langInfo.flag} ${langInfo.name}</span></div>
    </div>
    <div class="firta-badge">🔷 Registered on Firta</div>
    <div class="item-hero-card page-fade">
      <div class="item-safe-icon">🔒</div>
      <h1>Item is Safe</h1>
      <div class="safe-status-box">
        <div class="safe-status-icon">✅</div>
        <div class="safe-status-text">
          <strong>This item has not been reported lost.</strong>
          <p>The owner has not marked this item as lost yet. Contact information is private and not available at this time.</p>
        </div>
      </div>
      <div class="finder-tip">
        <div class="finder-tip-title">💡 Did you find this item?</div>
        <p>Hold onto it safely. If the owner realises it is missing, they will mark it as lost and contact information will appear here automatically. Please check back later.</p>
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


// ============================================
//  ITEM PUBLIC PAGE  (what finders see)
// ============================================
async function loadItemPage() {
  const itemId  = getParam('id');
  const content = document.getElementById('item-content');

  // Detect finder's language immediately
  const langInfo = detectFinderLanguage();
  const langKey  = Object.keys(LANG_MAP).find(k => LANG_MAP[k] === langInfo) || 'en';

  // Apply text direction right away (RTL for Arabic/Urdu)
  document.documentElement.setAttribute('lang', langInfo.code);
  document.documentElement.setAttribute('dir',  langInfo.dir);

  // No ID in URL
  if (!itemId) {
    if (content) content.innerHTML = `
      <div class="card text-center" style="padding:48px">
        <div style="font-size:48px;margin-bottom:16px">❓</div>
        <h2>Item Not Found</h2>
        <p class="text-muted mt-1">No item ID was provided in the URL.</p>
      </div>`;
    return;
  }

  // Show loading spinner
  if (content) content.innerHTML = `
    <div class="translating-overlay">
      <div class="spinner spinner-dark" style="width:32px;height:32px;margin:0 auto 16px"></div>
      <p>Loading item...</p>
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

  const item   = data[0];
  const isLost = item.status === 'lost';

  // Store on window so handleLangSwitch can re-render without re-fetching
  window._firtaItem = item;

  // ── ITEM IS SAFE — hide everything from finder ────────────────────────
  if (!isLost) {
    if (content) content.innerHTML = buildSafePageHTML(langInfo);
    const poweredEl = document.querySelector('.powered-by');
    if (poweredEl) poweredEl.innerHTML = `Powered by <a href="index.html">Firta</a> — Smart Lost &amp; Found`;
    return;
  }

  // ── ITEM IS LOST — translate and show contact info ────────────────────
  // Update spinner text
  if (content) content.innerHTML = `
    <div class="translating-overlay">
      <div class="spinner spinner-dark" style="width:32px;height:32px;margin:0 auto 16px"></div>
      <p>Translating to ${langInfo.flag} ${langInfo.name}...</p>
    </div>`;

  // Check sessionStorage cache
  const cacheKey = getCacheKey(item.id, langInfo.code);
  const cached   = sessionStorage.getItem(cacheKey);
  let strings;

  if (cached) {
    strings = JSON.parse(cached);
  } else {
    strings = await buildTranslatedStrings(item, langInfo.code);
    try { sessionStorage.setItem(cacheKey, JSON.stringify(strings)); } catch {}
  }

  if (content) content.innerHTML = buildItemPageHTML(strings, item, langInfo, langKey);

  const poweredEl = document.querySelector('.powered-by');
  if (poweredEl) poweredEl.innerHTML = `Powered by <a href="index.html">Firta</a>`;
}

// Called when finder manually picks a different language
async function handleLangSwitch(langKey) {
  const item = window._firtaItem;
  if (!item || item.status !== 'lost') return;

  const langInfo = LANG_MAP[langKey];
  if (!langInfo) return;

  document.documentElement.setAttribute('lang', langInfo.code);
  document.documentElement.setAttribute('dir',  langInfo.dir);

  const content  = document.getElementById('item-content');
  const statusEl = document.getElementById('lang-status');
  const selectEl = document.getElementById('lang-select');

  if (statusEl) statusEl.textContent = `Translating to ${langInfo.name}...`;
  if (selectEl) selectEl.disabled = true;

  const cacheKey = getCacheKey(item.id, langInfo.code);
  const cached   = sessionStorage.getItem(cacheKey);
  let strings;

  if (cached) {
    strings = JSON.parse(cached);
  } else {
    strings = await buildTranslatedStrings(item, langInfo.code);
    try { sessionStorage.setItem(cacheKey, JSON.stringify(strings)); } catch {}
  }

  if (content) content.innerHTML = buildItemPageHTML(strings, item, langInfo, langKey);
}


// ============================================
//  PAGE ROUTER
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
