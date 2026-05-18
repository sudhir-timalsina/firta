// ============================================
//  FIRTA APP — FIXED VERSION
// ============================================

const SUPABASE_URL = 'https://zjbgwmildygmyvderadf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yOk-XtOJtwWXfdGvfF9ZoA_KOGz_p-R';


// ============================================
// SUPABASE FETCH WRAPPER
// ============================================

async function supabaseFetch(endpoint, method = 'GET', body = null) {

  try {

    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': method === 'POST'
        ? 'return=representation'
        : ''
    };

    const options = {
      method,
      headers
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1${endpoint}`,
      options
    );

    const data = await response.json();

    if (!response.ok) {

      return {
        data: null,
        error:
          data.message ||
          data.error_description ||
          'Something went wrong'
      };
    }

    return {
      data,
      error: null
    };

  } catch (error) {

    return {
      data: null,
      error: 'Network error'
    };
  }
}


// ============================================
// SESSION HELPERS
// ============================================

function setSession(user) {

  localStorage.setItem(
    'firta_user',
    JSON.stringify(user)
  );
}

function getSession() {

  try {

    return JSON.parse(
      localStorage.getItem('firta_user')
    );

  } catch {

    return null;
  }
}

function clearSession() {

  localStorage.removeItem('firta_user');
}

function requireAuth() {

  const user = getSession();

  if (!user) {

    window.location.href = 'login.html';

    return null;
  }

  return user;
}


// ============================================
// UI HELPERS
// ============================================

function showAlert(id, msg, type = 'error') {

  const el = document.getElementById(id);

  if (!el) return;

  el.innerHTML = msg;
  el.className = `alert alert-${type}`;
  el.style.display = 'block';
}

function hideAlert(id) {

  const el = document.getElementById(id);

  if (el) {
    el.style.display = 'none';
  }
}

function setButtonLoading(btn, text = 'Loading...') {

  btn.dataset.original = btn.innerHTML;

  btn.innerHTML = `
    <span class="spinner"></span>
    ${text}
  `;

  btn.disabled = true;
}

function resetButton(btn) {

  btn.innerHTML =
    btn.dataset.original || btn.innerHTML;

  btn.disabled = false;
}

function getParam(key) {

  return new URLSearchParams(
    window.location.search
  ).get(key);
}

function isValidEmail(email) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showLoader() {

  const el =
    document.getElementById('loading-overlay');

  if (el) {
    el.classList.remove('hidden');
  }
}

function hideLoader() {

  const el =
    document.getElementById('loading-overlay');

  if (el) {
    el.classList.add('hidden');
  }
}

function escapeHTML(str) {

  if (!str) return '';

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


// ============================================
// LOGIN
// ============================================

async function handleLogin(e) {

  e.preventDefault();

  hideAlert('login-alert');

  const email =
    document.getElementById('email')
      .value
      .trim();

  const password =
    document.getElementById('password')
      .value;

  if (!email || !password) {

    showAlert(
      'login-alert',
      'Please enter email and password'
    );

    return;
  }

  const btn =
    document.getElementById('login-btn');

  setButtonLoading(btn, 'Signing in...');

  const { data, error } =
    await supabaseFetch(
      `/users?email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(password)}&select=id,name,email`
    );

  resetButton(btn);

  if (error) {

    showAlert(
      'login-alert',
      error
    );

    return;
  }

  if (!data || data.length === 0) {

    showAlert(
      'login-alert',
      'Invalid credentials'
    );

    return;
  }

  setSession({
    id: data[0].id,
    name: data[0].name,
    email: data[0].email
  });

  window.location.href = 'dashboard.html';
}


// ============================================
// DASHBOARD
// ============================================

async function loadDashboard() {

  const user = requireAuth();

  if (!user) return;

  const nameEl =
    document.getElementById('user-name');

  if (nameEl) {
    nameEl.textContent = user.name;
  }

  showLoader();

  const { data: items } =
    await supabaseFetch(
      `/items?user_id=eq.${user.id}&order=created_at.desc`
    );

  hideLoader();

  renderItems(items || []);
}

function renderItems(items) {

  const container =
    document.getElementById(
      'items-container'
    );

  if (!container) return;

  if (items.length === 0) {

    container.innerHTML = `
      <div class="empty-state">
        <h3>No items yet</h3>
      </div>
    `;

    return;
  }

  container.innerHTML = `
    <div class="items-grid">
      ${items.map(itemCardHTML).join('')}
    </div>
  `;
}

function itemCardHTML(item) {

  return `
    <div class="item-card">

      <h3>
        ${escapeHTML(item.name)}
      </h3>

      <p>
        ${escapeHTML(item.contact)}
      </p>

      <a href="qr.html?id=${item.id}">
        View QR
      </a>

    </div>
  `;
}


// ============================================
// QR PAGE
// ============================================

async function loadQRPage() {

  const itemId = getParam('id');

  if (!itemId) return;

  const { data } =
    await supabaseFetch(
      `/items?id=eq.${itemId}`
    );

  if (!data || data.length === 0) return;

  const item = data[0];

  const baseUrl =
    window.location.href.replace(
      /qr\.html.*$/,
      ''
    );

  const itemUrl =
    `${baseUrl}item.html?id=${item.id}`;

  new QRCode(
    document.getElementById(
      'qr-code-container'
    ),
    {
      text: itemUrl,
      width: 200,
      height: 200
    }
  );
}


// ============================================
// LANGUAGE MAP
// ============================================

const LANG_MAP = {

  en: {
    code: 'en',
    name: 'English',
    flag: '🇬🇧',
    dir: 'ltr'
  },

  ne: {
    code: 'ne',
    name: 'नेपाली',
    flag: '🇳🇵',
    dir: 'ltr'
  },

  hi: {
    code: 'hi',
    name: 'हिन्दी',
    flag: '🇮🇳',
    dir: 'ltr'
  },

  fr: {
    code: 'fr',
    name: 'Français',
    flag: '🇫🇷',
    dir: 'ltr'
  },

  ar: {
    code: 'ar',
    name: 'العربية',
    flag: '🇸🇦',
    dir: 'rtl'
  },

  zh: {
    code: 'zh',
    name: '中文',
    flag: '🇨🇳',
    dir: 'ltr'
  },

  ja: {
    code: 'ja',
    name: '日本語',
    flag: '🇯🇵',
    dir: 'ltr'
  }
};


// ============================================
// DETECT USER LANGUAGE
// ============================================

function detectUserLanguage() {

  const langs =
    navigator.languages ||
    [navigator.language];

  for (const lang of langs) {

    const lower =
      lang.toLowerCase();

    if (LANG_MAP[lower]) {
      return LANG_MAP[lower];
    }

    const base =
      lower.split('-')[0];

    if (LANG_MAP[base]) {
      return LANG_MAP[base];
    }
  }

  return LANG_MAP.en;
}


// ============================================
// SAFE TRANSLATION
// ============================================

async function translateText(
  text,
  targetLang
) {

  if (!text || !text.trim()) {
    return text;
  }

  if (targetLang === 'en') {
    return text;
  }

  try {

    const response = await fetch(
      'https://api.mymemory.translated.net/get?q=' +
      encodeURIComponent(text) +
      '&langpair=en|' +
      targetLang
    );

    const data =
      await response.json();

    if (
      data &&
      data.responseData &&
      data.responseData.translatedText
    ) {

      return data.responseData.translatedText;
    }

    return text;

  } catch (error) {

    console.log(
      'Translation failed:',
      error
    );

    return text;
  }
}


// ============================================
// TRANSLATE BATCH
// ============================================

async function translateBatch(
  texts,
  targetLang
) {

  return Promise.all(
    texts.map(text =>
      translateText(
        text,
        targetLang
      )
    )
  );
}


// ============================================
// ITEM PAGE
// ============================================

async function loadItemPage() {

  const itemId =
    getParam('id');

  const content =
    document.getElementById(
      'item-content'
    );

  if (!itemId) return;

  showLoader();

  const { data, error } =
    await supabaseFetch(
      `/items?id=eq.${itemId}`
    );

  hideLoader();

  if (
    error ||
    !data ||
    data.length === 0
  ) {

    content.innerHTML =
      '<h2>Item not found</h2>';

    return;
  }

  const item = data[0];

  const langInfo =
    detectUserLanguage();

  document.documentElement.lang =
    langInfo.code;

  document.documentElement.dir =
    langInfo.dir;

  let strings = [];

  try {

    strings =
      await translateBatch(
        [
          item.name,
          item.contact,
          'This item belongs to someone.',
          'Help return it safely.',
          'Call Owner',
          'Send Email',
          'GPS Tracking',
          'Coming Soon'
        ],
        langInfo.code
      );

  } catch (error) {

    console.log(error);

    strings = [
      item.name,
      item.contact,
      'This item belongs to someone.',
      'Help return it safely.',
      'Call Owner',
      'Send Email',
      'GPS Tracking',
      'Coming Soon'
    ];
  }

  content.innerHTML = `
  
    <div class="language-bar">
      🌐 ${langInfo.flag}
      ${langInfo.name}
    </div>

    <div class="item-card">

      <div class="item-icon">
        📦
      </div>

      <h1>
        ${escapeHTML(strings[0])}
      </h1>

      <p>
        ${escapeHTML(strings[2])}
      </p>

      <p>
        ${escapeHTML(strings[3])}
      </p>

      <div class="contact-box">
        ${escapeHTML(strings[1])}
      </div>

      <div class="button-group">

        <a
          href="tel:${item.contact}"
          class="btn btn-call"
        >
          📞 ${escapeHTML(strings[4])}
        </a>

        <a
          href="mailto:${item.contact}"
          class="btn btn-email"
        >
          ✉️ ${escapeHTML(strings[5])}
        </a>

      </div>

      <div class="gps-card">

        <h3>
          📍 ${escapeHTML(strings[6])}
        </h3>

        <span>
          ${escapeHTML(strings[7])}
        </span>

      </div>

    </div>
  `;
}


// ============================================
// PAGE ROUTER
// ============================================

(function init() {

  const page =
    window.location.pathname
      .split('/')
      .pop() || 'index.html';

  if (page === 'login.html') {

    const form =
      document.getElementById(
        'login-form'
      );

    if (form) {

      form.addEventListener(
        'submit',
        handleLogin
      );
    }
  }

  if (page === 'dashboard.html') {
    loadDashboard();
  }

  if (page === 'qr.html') {
    loadQRPage();
  }

  if (page === 'item.html') {
    loadItemPage();
  }

})();
