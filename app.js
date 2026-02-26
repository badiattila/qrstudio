/* ============================================================
   QR Studio — app.js
   ============================================================ */

// ---- State -------------------------------------------------------
const state = {
  type: 'url',
  data: {
    url:   { url: 'https://example.com' },
    text:  { text: '' },
    email: { to: '', subject: '', body: '' },
    phone: { phone: '' },
    sms:   { phone: '', message: '' },
    wifi:  { ssid: '', password: '', encryption: 'WPA', hidden: false },
    vcard: { firstName: '', lastName: '', phone: '', email: '', org: '', title: '', url: '' },
  },
  config: {
    errorCorrection: 'M',
    dotStyle:        'rounded',
    eyeStyle:        'extra-rounded',
    fgColor:         '#000000',
    bgColor:         '#ffffff',
    gradient:        false,
    gradientColor2:  '#6366f1',
    gradientType:    'linear',
    logo:            null,
    size:            300,
    margin:          10,
  },
  darkMode: false,
  history: [],
};

// ---- Constants ---------------------------------------------------
const INPUT_TYPES = [
  { id: 'url',   label: 'URL',   icon: '🔗' },
  { id: 'text',  label: 'Text',  icon: '📝' },
  { id: 'email', label: 'Email', icon: '✉️' },
  { id: 'phone', label: 'Phone', icon: '📞' },
  { id: 'sms',   label: 'SMS',   icon: '💬' },
  { id: 'wifi',  label: 'Wi-Fi', icon: '📶' },
  { id: 'vcard', label: 'vCard', icon: '👤' },
];

const EC_LEVELS = [
  { id: 'L', label: 'L', desc: '7% recovery — higher capacity' },
  { id: 'M', label: 'M', desc: '15% recovery — balanced (default)' },
  { id: 'Q', label: 'Q', desc: '25% recovery — good with logos' },
  { id: 'H', label: 'H', desc: '30% recovery — best with logos' },
];

const DOT_STYLES = [
  { id: 'square',        label: 'Square' },
  { id: 'rounded',       label: 'Rounded' },
  { id: 'dots',          label: 'Dots' },
  { id: 'classy',        label: 'Classy' },
  { id: 'classy-rounded',label: 'Classy+' },
  { id: 'extra-rounded', label: 'XRound' },
];

const EYE_STYLES = [
  { id: 'square',        label: 'Square' },
  { id: 'extra-rounded', label: 'Rounded' },
  { id: 'dot',           label: 'Dot' },
];

// Max byte capacity per EC level (QR version 40, byte mode)
const MAX_CAP = { L: 2953, M: 2331, Q: 1663, H: 1273 };

// ---- QR Instance -------------------------------------------------
let qrCode = null;
let updateTimer = null;

function getQROptions(overrides = {}) {
  const cfg  = state.config;
  const data = getEncodedData();

  const dotsOptions = { type: cfg.dotStyle };
  if (cfg.gradient) {
    dotsOptions.gradient = {
      type:       cfg.gradientType,
      rotation:   0,
      colorStops: [
        { offset: 0, color: cfg.fgColor },
        { offset: 1, color: cfg.gradientColor2 },
      ],
    };
  } else {
    dotsOptions.color = cfg.fgColor;
  }

  return {
    width:  cfg.size,
    height: cfg.size,
    type:   'svg',
    data:   data || 'QR Studio',
    image:  cfg.logo || undefined,
    margin: cfg.margin,
    qrOptions:          { errorCorrectionLevel: cfg.errorCorrection },
    dotsOptions,
    backgroundOptions:  { color: cfg.bgColor },
    cornersSquareOptions: { type: cfg.eyeStyle,  color: cfg.fgColor },
    cornersDotOptions:    { type: cfg.eyeStyle === 'dot' ? 'dot' : 'square', color: cfg.fgColor },
    imageOptions: { crossOrigin: 'anonymous', margin: 5, imageSize: 0.3 },
    ...overrides,
  };
}

function initQR() {
  const container = document.getElementById('qrCanvas');
  container.innerHTML = '';
  qrCode = new QRCodeStyling(getQROptions());
  qrCode.append(container);
}

function updateQR() {
  if (!qrCode) { initQR(); return; }
  qrCode.update(getQROptions());
  updateCapacity();
  updateWarnings();
}

function scheduleUpdate(immediate = false) {
  clearTimeout(updateTimer);
  if (immediate) {
    updateQR();
  } else {
    updateTimer = setTimeout(updateQR, 180);
  }
}

// ---- Data Encoding -----------------------------------------------
function wifiEsc(s) {
  return s.replace(/\\/g, '\\\\')
          .replace(/;/g, '\\;')
          .replace(/,/g, '\\,')
          .replace(/"/g, '\\"');
}

function getEncodedData() {
  const d = state.data[state.type];
  switch (state.type) {
    case 'url':
      return d.url || '';

    case 'text':
      return d.text || '';

    case 'email': {
      if (!d.to) return '';
      let uri = `mailto:${d.to}`;
      const p = [];
      if (d.subject) p.push(`subject=${encodeURIComponent(d.subject)}`);
      if (d.body)    p.push(`body=${encodeURIComponent(d.body)}`);
      if (p.length)  uri += '?' + p.join('&');
      return uri;
    }

    case 'phone':
      return d.phone ? `tel:${d.phone}` : '';

    case 'sms':
      if (!d.phone) return '';
      return d.message
        ? `sms:${d.phone}?body=${encodeURIComponent(d.message)}`
        : `sms:${d.phone}`;

    case 'wifi':
      if (!d.ssid) return '';
      return `WIFI:T:${d.encryption || 'WPA'};S:${wifiEsc(d.ssid)};P:${wifiEsc(d.password || '')};H:${d.hidden ? 'true' : 'false'};;`;

    case 'vcard': {
      if (!d.firstName && !d.lastName) return '';
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${[d.firstName, d.lastName].filter(Boolean).join(' ')}`,
        `N:${d.lastName || ''};${d.firstName || ''};;;`,
      ];
      if (d.phone) lines.push(`TEL:${d.phone}`);
      if (d.email) lines.push(`EMAIL:${d.email}`);
      if (d.org)   lines.push(`ORG:${d.org}`);
      if (d.title) lines.push(`TITLE:${d.title}`);
      if (d.url)   lines.push(`URL:${d.url}`);
      lines.push('END:VCARD');
      return lines.join('\r\n');
    }

    default: return '';
  }
}

// ---- Capacity & Warnings -----------------------------------------
function updateCapacity() {
  const data  = getEncodedData();
  const bytes = new TextEncoder().encode(data).length;
  const max   = MAX_CAP[state.config.errorCorrection];
  const pct   = Math.min(100, Math.round((bytes / max) * 100));

  document.getElementById('capacityText').textContent = `${pct}%`;
  const bar = document.getElementById('capacityBar');
  bar.style.width = `${pct}%`;
  bar.className = [
    'h-2 rounded-full transition-all duration-300',
    pct < 60 ? 'bg-green-500' : pct < 85 ? 'bg-yellow-500' : 'bg-red-500',
  ].join(' ');
}

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}
function relativeLum([r, g, b]) {
  return [r, g, b].reduce((acc, c, i) => {
    const s = c / 255;
    const lin = s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    return acc + lin * [0.2126, 0.7152, 0.0722][i];
  }, 0);
}
function contrastRatio(fg, bg) {
  const L1 = relativeLum(hexToRgb(fg));
  const L2 = relativeLum(hexToRgb(bg));
  const hi = Math.max(L1, L2), lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

function updateWarnings() {
  const warns = [];
  const data  = getEncodedData();
  const bytes = new TextEncoder().encode(data).length;
  const max   = MAX_CAP[state.config.errorCorrection];
  const pct   = (bytes / max) * 100;
  const cfg   = state.config;

  if (!data) {
    warns.push({ t: 'info', msg: 'Enter content above to preview your QR code.' });
  } else {
    if (pct > 90)
      warns.push({ t: 'error', msg: `QR is ${Math.round(pct)}% full — reduce content or lower error correction.` });
    else if (pct > 75)
      warns.push({ t: 'warn', msg: `QR is ${Math.round(pct)}% full — approaching capacity limit.` });

    const cr = contrastRatio(cfg.fgColor, cfg.bgColor);
    if (cr < 2.5)
      warns.push({ t: 'error', msg: 'Very low contrast — QR may fail to scan. Use darker foreground or lighter background.' });
    else if (cr < 4)
      warns.push({ t: 'warn', msg: 'Moderate contrast — may struggle in poor lighting.' });

    if (cfg.logo && cfg.errorCorrection === 'L')
      warns.push({ t: 'error', msg: 'Logo requires error correction H or Q to ensure scannability.' });
    else if (cfg.logo && cfg.errorCorrection === 'M')
      warns.push({ t: 'warn', msg: 'Consider H or Q error correction when embedding a logo.' });
  }

  const clr = { error: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800', warn: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800', info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
  const ico  = { error: '⚠️', warn: '⚡', info: 'ℹ️' };

  document.getElementById('warnings').innerHTML = warns.map(w =>
    `<div class="flex gap-2 items-start p-2.5 rounded-lg border text-xs ${clr[w.t]}">
       <span class="mt-px">${ico[w.t]}</span><span>${w.msg}</span>
     </div>`
  ).join('');
}

// ---- Form Fields -------------------------------------------------
const FIELDS = {
  url: [
    { id: 'url', type: 'url', label: 'URL', placeholder: 'https://example.com' },
  ],
  text: [
    { id: 'text', type: 'textarea', label: 'Text', placeholder: 'Enter any text…' },
  ],
  email: [
    { id: 'to',      type: 'email',    label: 'To',      placeholder: 'recipient@example.com' },
    { id: 'subject', type: 'text',     label: 'Subject', placeholder: 'Optional subject' },
    { id: 'body',    type: 'textarea', label: 'Body',    placeholder: 'Optional message' },
  ],
  phone: [
    { id: 'phone', type: 'tel', label: 'Phone number', placeholder: '+1 555 000 0000' },
  ],
  sms: [
    { id: 'phone',   type: 'tel',      label: 'Phone number', placeholder: '+1 555 000 0000' },
    { id: 'message', type: 'textarea', label: 'Message',      placeholder: 'Pre-filled message (optional)' },
  ],
  wifi: [
    { id: 'ssid',       type: 'text',     label: 'Network name (SSID)', placeholder: 'My WiFi Network' },
    { id: 'password',   type: 'password', label: 'Password',            placeholder: 'Leave blank for open networks' },
    { id: 'encryption', type: 'select',   label: 'Security type',       options: ['WPA', 'WEP', 'nopass'] },
    { id: 'hidden',     type: 'checkbox', label: 'Hidden network' },
  ],
  vcard: [
    { id: 'firstName', type: 'text',  label: 'First name',   placeholder: 'John' },
    { id: 'lastName',  type: 'text',  label: 'Last name',    placeholder: 'Doe' },
    { id: 'phone',     type: 'tel',   label: 'Phone',        placeholder: '+1 555 000 0000' },
    { id: 'email',     type: 'email', label: 'Email',        placeholder: 'john@example.com' },
    { id: 'org',       type: 'text',  label: 'Organization', placeholder: 'Company name' },
    { id: 'title',     type: 'text',  label: 'Job title',    placeholder: 'Software Engineer' },
    { id: 'url',       type: 'url',   label: 'Website',      placeholder: 'https://example.com' },
  ],
};

const INPUT_CLS = 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors';

function renderField({ id, type, label, placeholder = '', options = [] }) {
  if (type === 'textarea') {
    return `<div>
      <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">${label}</label>
      <textarea id="field_${id}" rows="3" placeholder="${placeholder}" class="${INPUT_CLS} resize-none"></textarea>
    </div>`;
  }
  if (type === 'select') {
    return `<div>
      <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">${label}</label>
      <select id="field_${id}" class="${INPUT_CLS}">
        ${options.map(o => `<option value="${o}">${o}</option>`).join('')}
      </select>
    </div>`;
  }
  if (type === 'checkbox') {
    return `<div class="flex items-center gap-3 py-1">
      <input type="checkbox" id="field_${id}" class="w-4 h-4 text-indigo-600 rounded border-gray-300 dark:border-gray-600 focus:ring-indigo-500 cursor-pointer">
      <label for="field_${id}" class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">${label}</label>
    </div>`;
  }
  if (type === 'password') {
    return `<div>
      <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">${label}</label>
      <div class="pw-wrap">
        <input type="password" id="field_${id}" placeholder="${placeholder}" class="${INPUT_CLS}">
        <button type="button" class="pw-toggle" onclick="togglePw('field_${id}',this)" aria-label="Show/hide password">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
        </button>
      </div>
    </div>`;
  }
  return `<div>
    <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">${label}</label>
    <input type="${type}" id="field_${id}" placeholder="${placeholder}" class="${INPUT_CLS}">
  </div>`;
}

function togglePw(fieldId, btn) {
  const el = document.getElementById(fieldId);
  el.type = el.type === 'password' ? 'text' : 'password';
}

function renderInputForm() {
  const fields = FIELDS[state.type];
  const form   = document.getElementById('inputForm');
  form.innerHTML = fields.map(renderField).join('');

  fields.forEach(f => {
    const el = document.getElementById(`field_${f.id}`);
    if (!el) return;
    const ev = f.type === 'checkbox' ? 'change' : 'input';
    el.addEventListener(ev, e => {
      state.data[state.type][f.id] = f.type === 'checkbox' ? e.target.checked : e.target.value;
      scheduleUpdate(f.type === 'select' || f.type === 'checkbox');
    });
    // Restore
    const cur = state.data[state.type][f.id];
    if (f.type === 'checkbox') el.checked = cur || false;
    else el.value = cur || '';
    // Restore select
    if (f.type === 'select' && cur) el.value = cur;
  });
}

// ---- Selector Renderers ------------------------------------------
function btnCls(active) {
  return active
    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 text-gray-600 dark:text-gray-400';
}

function renderTypeSelector() {
  const c = document.getElementById('typeSelector');
  c.innerHTML = INPUT_TYPES.map(t =>
    `<button data-type="${t.id}" class="type-btn flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-medium border-2 ${btnCls(state.type === t.id)}">
       <span class="text-xl leading-none">${t.icon}</span>
       <span>${t.label}</span>
     </button>`
  ).join('');
  c.querySelectorAll('.type-btn').forEach(b => b.addEventListener('click', () => {
    state.type = b.dataset.type;
    renderTypeSelector();
    renderInputForm();
    scheduleUpdate(true);
  }));
}

function renderECSelector() {
  const c = document.getElementById('ecSelector');
  c.innerHTML = EC_LEVELS.map(e =>
    `<button data-ec="${e.id}" title="${e.desc}" class="ec-btn py-2 text-sm font-bold rounded-lg border-2 ${btnCls(state.config.errorCorrection === e.id)}">${e.label}</button>`
  ).join('');
  c.querySelectorAll('.ec-btn').forEach(b => b.addEventListener('click', () => {
    state.config.errorCorrection = b.dataset.ec;
    renderECSelector();
    scheduleUpdate(true);
  }));
}

function renderDotStyles() {
  const c = document.getElementById('dotStyleSelector');
  c.innerHTML = DOT_STYLES.map(s =>
    `<button data-s="${s.id}" class="dot-btn py-2 text-xs font-medium rounded-lg border-2 ${btnCls(state.config.dotStyle === s.id)}">${s.label}</button>`
  ).join('');
  c.querySelectorAll('.dot-btn').forEach(b => b.addEventListener('click', () => {
    state.config.dotStyle = b.dataset.s;
    renderDotStyles();
    scheduleUpdate(true);
  }));
}

function renderEyeStyles() {
  const c = document.getElementById('eyeStyleSelector');
  c.innerHTML = EYE_STYLES.map(s =>
    `<button data-s="${s.id}" class="eye-btn py-2 text-xs font-medium rounded-lg border-2 ${btnCls(state.config.eyeStyle === s.id)}">${s.label}</button>`
  ).join('');
  c.querySelectorAll('.eye-btn').forEach(b => b.addEventListener('click', () => {
    state.config.eyeStyle = b.dataset.s;
    renderEyeStyles();
    scheduleUpdate(true);
  }));
}

// ---- Color Controls ----------------------------------------------
function syncColorPair(pickerId, textId, key) {
  const picker = document.getElementById(pickerId);
  const text   = document.getElementById(textId);
  picker.addEventListener('input', e => {
    text.value = e.target.value;
    state.config[key] = e.target.value;
    scheduleUpdate(true);
  });
  text.addEventListener('input', e => {
    const v = e.target.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      picker.value = v;
      state.config[key] = v;
      scheduleUpdate(true);
    }
  });
}

function initColorControls() {
  syncColorPair('fgColor', 'fgColorText', 'fgColor');
  syncColorPair('bgColor', 'bgColorText', 'bgColor');

  document.getElementById('gradientColor2').addEventListener('input', e => {
    state.config.gradientColor2 = e.target.value;
    scheduleUpdate(true);
  });

  document.getElementById('gradientToggle').addEventListener('change', e => {
    state.config.gradient = e.target.checked;
    document.getElementById('gradientOptions').classList.toggle('hidden', !e.target.checked);
    scheduleUpdate(true);
  });

  ['gradLinear', 'gradRadial'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
      state.config.gradientType = id === 'gradLinear' ? 'linear' : 'radial';
      document.getElementById('gradLinear').className = state.config.gradientType === 'linear'
        ? 'px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white font-medium flex-1'
        : 'px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium flex-1';
      document.getElementById('gradRadial').className = state.config.gradientType === 'radial'
        ? 'px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white font-medium flex-1'
        : 'px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium flex-1';
      scheduleUpdate(true);
    });
  });
}

// ---- Logo Controls -----------------------------------------------
function initLogoControls() {
  document.getElementById('logoUpload').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      state.config.logo = ev.target.result;
      document.getElementById('logoLabel').textContent = file.name.length > 20
        ? file.name.slice(0, 18) + '…'
        : file.name;
      document.getElementById('removeLogo').classList.remove('hidden');
      // Auto-upgrade EC if too low for logo
      if (state.config.errorCorrection === 'L' || state.config.errorCorrection === 'M') {
        state.config.errorCorrection = 'H';
        renderECSelector();
      }
      scheduleUpdate(true);
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('removeLogo').addEventListener('click', () => {
    state.config.logo = null;
    document.getElementById('logoLabel').textContent = 'Click to upload';
    document.getElementById('removeLogo').classList.add('hidden');
    document.getElementById('logoUpload').value = '';
    scheduleUpdate(true);
  });
}

// ---- Range Controls ----------------------------------------------
function initRangeControls() {
  document.getElementById('sizeRange').addEventListener('input', e => {
    state.config.size = parseInt(e.target.value);
    document.getElementById('sizeValue').textContent = `${state.config.size}px`;
    scheduleUpdate(false);
  });
  document.getElementById('marginRange').addEventListener('input', e => {
    state.config.margin = parseInt(e.target.value);
    document.getElementById('marginValue').textContent = `${state.config.margin}px`;
    scheduleUpdate(false);
  });
}

// ---- Export ------------------------------------------------------
function initExportControls() {
  document.getElementById('downloadSVG').addEventListener('click', () => {
    if (!getEncodedData()) return showToast('Enter content first');
    qrCode.download({ name: 'qr-studio', extension: 'svg' });
    showToast('SVG downloaded');
  });

  document.getElementById('downloadPNG').addEventListener('click', () => {
    if (!getEncodedData()) return showToast('Enter content first');
    const hiRes = new QRCodeStyling({ ...getQROptions(), type: 'canvas', width: 1200, height: 1200 });
    hiRes.download({ name: 'qr-studio', extension: 'png' });
    showToast('PNG downloaded (1200×1200)');
  });

  document.getElementById('copyClipboard').addEventListener('click', async () => {
    if (!getEncodedData()) return showToast('Enter content first');
    try {
      const blob = await qrCode.getRawData('svg');
      const text = await blob.text();
      await navigator.clipboard.writeText(text);
      showToast('SVG copied to clipboard');
    } catch {
      showToast('Clipboard unavailable — try downloading');
    }
  });
}

// ---- Toast -------------------------------------------------------
function showToast(msg) {
  // Remove existing
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = 'toast fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-full shadow-lg z-50 pointer-events-none whitespace-nowrap';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.3s';
    el.style.opacity    = '0';
    setTimeout(() => el.remove(), 300);
  }, 2000);
}

// ---- History -----------------------------------------------------
function initHistoryControls() {
  document.getElementById('saveHistory').addEventListener('click', () => {
    if (!getEncodedData()) return showToast('Nothing to save');
    saveToHistory();
  });
  document.getElementById('clearHistory').addEventListener('click', () => {
    state.history = [];
    localStorage.removeItem('qrstudio_history');
    renderHistory();
    showToast('History cleared');
  });
}

async function saveToHistory() {
  const entry = {
    id:        Date.now(),
    type:      state.type,
    data:      JSON.parse(JSON.stringify(state.data[state.type])),
    config:    JSON.parse(JSON.stringify(state.config)),
    encoded:   getEncodedData(),
    label:     getHistoryLabel(),
    timestamp: new Date().toLocaleDateString(),
    thumbnail: null,
  };

  try {
    const thumbQR = new QRCodeStyling({ ...getQROptions(), width: 80, height: 80, margin: 2 });
    const blob     = await thumbQR.getRawData('svg');
    entry.thumbnail = await blob.text();
  } catch { /* no thumbnail */ }

  state.history.unshift(entry);
  if (state.history.length > 20) state.history.pop();
  localStorage.setItem('qrstudio_history', JSON.stringify(state.history));
  renderHistory();
  showToast('Saved to history');
}

function getHistoryLabel() {
  const d = state.data[state.type];
  switch (state.type) {
    case 'url':   return d.url   || 'URL';
    case 'text':  return (d.text || '').slice(0, 20) || 'Text';
    case 'email': return d.to    || 'Email';
    case 'phone': return d.phone || 'Phone';
    case 'sms':   return d.phone || 'SMS';
    case 'wifi':  return d.ssid  || 'Wi-Fi';
    case 'vcard': return [d.firstName, d.lastName].filter(Boolean).join(' ') || 'vCard';
    default:      return state.type;
  }
}

function loadHistory() {
  try {
    const raw = localStorage.getItem('qrstudio_history');
    if (raw) state.history = JSON.parse(raw);
  } catch { state.history = []; }
}

function renderHistory() {
  const section = document.getElementById('historySection');
  const list    = document.getElementById('historyList');

  if (!state.history.length) {
    section.classList.add('hidden');
    return;
  }
  section.classList.remove('hidden');

  list.innerHTML = state.history.map(h =>
    `<div class="flex-shrink-0 w-24 cursor-pointer group history-item" data-id="${h.id}">
       <div class="history-thumb w-20 h-20 rounded-lg overflow-hidden border-2 border-transparent group-hover:border-indigo-400 transition-all bg-gray-100 dark:bg-gray-700">
         ${h.thumbnail || '<div class="w-full h-full flex items-center justify-center text-2xl">📷</div>'}
       </div>
       <div class="text-xs text-center mt-1 text-gray-600 dark:text-gray-400 truncate w-20" title="${h.label}">${h.label}</div>
       <div class="text-xs text-center text-gray-400 dark:text-gray-500">${h.timestamp}</div>
       <button class="del-btn w-full mt-1 text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" data-id="${h.id}">Remove</button>
     </div>`
  ).join('');

  list.querySelectorAll('.history-item').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.classList.contains('del-btn')) return;
      const h = state.history.find(x => x.id === parseInt(el.dataset.id));
      if (!h) return;
      state.type = h.type;
      state.data[h.type] = JSON.parse(JSON.stringify(h.data));
      Object.assign(state.config, h.config);
      renderAll();
      scheduleUpdate(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('Restored from history');
    });
  });
  list.querySelectorAll('.del-btn').forEach(b => {
    b.addEventListener('click', e => {
      e.stopPropagation();
      state.history = state.history.filter(x => x.id !== parseInt(b.dataset.id));
      localStorage.setItem('qrstudio_history', JSON.stringify(state.history));
      renderHistory();
    });
  });
}

// ---- Dark Mode ---------------------------------------------------
function initDarkMode() {
  const saved = localStorage.getItem('qrstudio_dark');
  state.darkMode = saved !== null
    ? saved === 'true'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyDarkMode();
  document.getElementById('darkToggle').addEventListener('click', () => {
    state.darkMode = !state.darkMode;
    localStorage.setItem('qrstudio_dark', state.darkMode);
    applyDarkMode();
  });
}
function applyDarkMode() {
  document.documentElement.classList.toggle('dark', state.darkMode);
  document.getElementById('sunIcon').classList.toggle('hidden', !state.darkMode);
  document.getElementById('moonIcon').classList.toggle('hidden', state.darkMode);
}

// ---- Render All --------------------------------------------------
function renderAll() {
  renderTypeSelector();
  renderInputForm();
  renderECSelector();
  renderDotStyles();
  renderEyeStyles();

  // Restore config into controls
  document.getElementById('fgColor').value      = state.config.fgColor;
  document.getElementById('fgColorText').value  = state.config.fgColor;
  document.getElementById('bgColor').value      = state.config.bgColor;
  document.getElementById('bgColorText').value  = state.config.bgColor;
  document.getElementById('gradientToggle').checked = state.config.gradient;
  document.getElementById('gradientOptions').classList.toggle('hidden', !state.config.gradient);
  document.getElementById('gradientColor2').value = state.config.gradientColor2;
  document.getElementById('sizeRange').value    = state.config.size;
  document.getElementById('sizeValue').textContent = `${state.config.size}px`;
  document.getElementById('marginRange').value  = state.config.margin;
  document.getElementById('marginValue').textContent = `${state.config.margin}px`;
}

// ---- Init --------------------------------------------------------
function init() {
  // Apply dark mode immediately before render
  const saved = localStorage.getItem('qrstudio_dark');
  state.darkMode = saved !== null
    ? saved === 'true'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyDarkMode();

  loadHistory();
  renderAll();
  initColorControls();
  initLogoControls();
  initRangeControls();
  initExportControls();
  initHistoryControls();
  initQR();
  updateCapacity();
  updateWarnings();
  renderHistory();
}

document.addEventListener('DOMContentLoaded', init);
