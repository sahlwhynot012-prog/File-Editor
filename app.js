(() => {
'use strict';
window.__PDFSTUDIO_VERSION = '2026.10.23.1';

/* =================================================================== helpers */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const HAS_GAS = typeof google !== 'undefined' && !!(google.script && google.script.run);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DPR = () => Math.min(window.devicePixelRatio || 1, 2);
const clone = o => JSON.parse(JSON.stringify(o));
const errMsg = e => String((e && e.message) || e);
let _n = 0;
const uid = () => (++_n).toString(36) + Math.random().toString(36).slice(2, 7);

const CFG = window.PDFSTUDIO_CONFIG || {};
/** Calls a Drive action: the Apps Script server when running there, otherwise Google's Drive API with your own sign-in. */
const gas = (fn, ...args) => {
  if (HAS_GAS) return new Promise((resolve, reject) => google.script.run.withSuccessHandler(resolve).withFailureHandler(reject)[fn](...args));
  if (DRV[fn]) return DRV[fn](...args);
  return Promise.reject(new Error('Unknown Drive action: ' + fn));
};

function hexParts(hex) {
  const n = parseInt(String(hex || '#000000').slice(1), 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}
function u8ToB64(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
function b64ToU8(b64) {
  const bin = atob(b64); const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}
const dataUrlToBytes = d => b64ToU8(d.slice(d.indexOf(',') + 1));
const fmtSize = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';

/* ===================================================================== icons */
const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const ICONS = {
  select: 'M4.04 4.69a.5.5 0 0 1 .65-.65l16 6.5a.5.5 0 0 1-.06.95l-6.13 1.58a2 2 0 0 0-1.43 1.44l-1.58 6.12a.5.5 0 0 1-.95.06z',
  hand: 'M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15',
  pen: 'M21.17 6.81a2.82 2.82 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5zM15 5l4 4',
  highlighter: 'm9 11-6 6v3h9l3-3M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4',
  eraser: 'm7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21M22 21H7M5 11l9 9',
  text: 'M4 7V4h16v3M9 20h6M12 4v16',
  note: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM8 9h8M8 13h5',
  line: 'M5 19 19 5',
  arrow: 'M7 17 17 7M8 7h9v9',
  rect: 'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  ellipse: 'M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0',
  mark: 'M3 6h18v12H3zM7 10h10M7 14h6',
  whiteout: 'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM4 13l9-9M11 20l9-9',
  image: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM7 9a2 2 0 1 0 4 0 2 2 0 1 0-4 0M21 15l-3.09-3.09a2 2 0 0 0-2.82 0L6 21',
  signature: 'm21 17-2.16-1.87a.5.5 0 0 0-.84.37v.5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1c0-2.55-3.99-3.97-8.5-4a2.5 2.5 0 0 0 0 5c4.15 0 4.75-11.3 5.71-13.5a2.5 2.5 0 1 1 3.31 3.28M3 21h18',
  stamp: 'M5 22h14M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.5c0-.66-.26-1.3-.73-1.77ZM14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13',
  folder: 'M6 14l1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  filePlus: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7zM14 2v4a2 2 0 0 0 2 2h4M9 15h6M12 12v6',
  file: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7zM14 2v4a2 2 0 0 0 2 2h4M8 13h8M8 17h5',
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  redo: 'm15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13',
  minus: 'M5 12h14', plus: 'M5 12h14M12 5v14',
  fit: 'M21 12H3M7 8l-4 4 4 4M17 8l4 4-4 4',
  search: 'M4 11a7 7 0 1 0 14 0 7 7 0 1 0-14 0M21 21l-4.3-4.3',
  enter: 'M9 10l-5 5 5 5M20 4v7a4 4 0 0 1-4 4H4',
  keyboard: 'M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8',
  printer: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  cloud: 'M12 13v8M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2M8 17l4-4 4 4',
  chev: 'm6 9 6 6 6-6', chevUp: 'm18 15-6-6-6 6',
  rotl: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5',
  rotr: 'M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8M21 3v5h-5',
  copy: 'M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2zM4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2',
  trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  x: 'M18 6 6 18M6 6l12 12',
  type: 'M4 7V4h16v3M9 20h6M12 4v16',
  underline: 'M6 4v6a6 6 0 0 0 12 0V4M4 20h16',
  strike: 'M16 4H9a3 3 0 0 0-2.83 4M14 12a4 4 0 0 1 0 8H6M4 12h16',
  redact: 'M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20M14.12 14.12a3 3 0 1 1-4.24-4.24',
  sidebar: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 3v18',
  wand: 'm21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72M14 7l3 3M5 6v4M19 14v4M10 2v2M7 8H3M21 16h-4M11 3H9',
};
function icon(name, size = 16, cls = '') {
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[name] || ''}"/></svg>`;
}
function hydrateIcons(root = document) {
  $$('[data-icon]', root).forEach(el => { el.outerHTML = icon(el.dataset.icon, +el.dataset.size || 16, el.className); });
}
Object.assign(ICONS, {
  home: 'm3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  share: 'M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14',
  lock: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM7 11V7a5 5 0 0 1 10 0v4',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  building: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18zM6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4',
  check: 'M20 6 9 17l-5-5',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
});
const IS_WIN = /Win/.test(navigator.platform || navigator.userAgent);
// Mac shows ⌘ ⇧ ⌥ ↩ ⌫ ⎋; Windows/Linux show the names printed on their keys. (Shortcuts use Ctrl on
// Windows: the Windows key is reserved by the OS and never reaches web pages.)
const kbdText = s => IS_MAC
  ? s.replace(/Ctrl\s*\+?\s*/g, '⌘').replace(/Shift\s*\+?\s*/g, '⇧').replace(/Alt\s*\+?\s*/g, '⌥')
     .replace(/\bEnter\b/g, '↩').replace(/\b(Delete|Backspace)\b/g, '⌫').replace(/\bEsc(ape)?\b/g, '⎋')
  : s.replace(/⌘/g, 'Ctrl').replace(/⇧/g, 'Shift').replace(/⌥/g, 'Alt').replace(/↩/g, 'Enter')
     .replace(/⌫/g, IS_WIN ? 'Del' : 'Delete').replace(/⎋/g, 'Esc');

/* macOS-style tooltips: data-tip="Label|Shortcut" */
const tipEl = document.createElement('div'); tipEl.className = 'tooltip'; document.body.appendChild(tipEl);
let tipTimer = 0, tipTarget = null;
function hideTip() { clearTimeout(tipTimer); tipEl.classList.remove('show'); }
document.addEventListener('mouseover', e => {
  const el = e.target.closest && e.target.closest('[data-tip]');
  if (el === tipTarget) return;
  tipTarget = el; hideTip();
  if (!el) return;
  tipTimer = setTimeout(() => {
    if (!document.body.contains(el)) return;
    const [label, key] = el.dataset.tip.split('|');
    tipEl.textContent = '';
    const l = document.createElement('span'); l.textContent = label; tipEl.appendChild(l);
    if (key) { const k = document.createElement('kbd'); k.textContent = kbdText(key); tipEl.appendChild(k); }
    tipEl.classList.add('show');
    const r = el.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    let x, y;
    if (el.closest('.palette')) { x = r.right + 10; y = r.top + r.height / 2 - h / 2; }
    else { x = r.left + r.width / 2 - w / 2; y = r.bottom + 8; }
    tipEl.style.left = clamp(x, 6, window.innerWidth - w - 6) + 'px';
    tipEl.style.top = clamp(y, 6, window.innerHeight - h - 6) + 'px';
  }, 500);
});
document.addEventListener('pointerdown', hideTip, true);

function toast(msg, ms = 2800, html = false) {
  const t = $('#toast');
  if (html) t.innerHTML = msg; else t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), ms);
}
function busy(msg) {
  if (msg) { $('#busyMsg').textContent = msg; $('#busy').classList.add('show'); }
  else $('#busy').classList.remove('show');
}
const openModal = id => $('#' + id).classList.add('show');
const closeModal = id => $('#' + id).classList.remove('show');

/** Promise-based prompt / confirm (no native prompt() inside Apps Script). */
function ask(title, initial = '', opts = {}) {
  return new Promise(resolve => {
    const multi = !!opts.multiline, isConfirm = !!opts.confirm;
    const inp = $('#askInput'), area = $('#askArea');
    $('#askTitle').textContent = title;
    $('#askText').textContent = opts.message || '';
    inp.style.display = (multi || isConfirm) ? 'none' : '';
    area.style.display = (multi && !isConfirm) ? '' : 'none';
    inp.type = opts.password ? 'password' : 'text';
    const field = multi ? area : inp;
    field.value = initial;
    $('#askOk').textContent = opts.okText || 'OK';
    $('#askCancel').textContent = opts.cancelText || 'Cancel';
    openModal('askModal');
    setTimeout(() => (isConfirm ? $('#askOk') : field).focus(), 30);
    const done = v => {
      closeModal('askModal');
      $('#askOk').onclick = $('#askCancel').onclick = null;
      field.onkeydown = null; $('#askOk').onkeydown = null;
      resolve(v);
    };
    $('#askOk').onclick = () => done(isConfirm ? true : field.value);
    $('#askCancel').onclick = () => done(null);
    const keys = e => {
      if (e.key === 'Escape') { e.preventDefault(); done(null); }
      else if (e.key === 'Enter' && (!multi || e.ctrlKey || e.metaKey)) { e.preventDefault(); done(isConfirm ? true : field.value); }
    };
    field.onkeydown = keys; $('#askOk').onkeydown = keys;
  });
}
const confirmBox = (title, message, okText) => ask(title, '', { confirm: true, message, okText });

/* ================================================================ pdf.js setup */
if (typeof pdfjsLib === 'undefined' || typeof PDFLib === 'undefined') return; // the start-up check explains this
const PDFJS_CDN = 'https:\/\/cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_CDN + 'pdf.worker.min.js';
// Load the worker as a same-origin blob so it runs inside the Apps Script sandbox.
const workerReady = fetch(PDFJS_CDN + 'pdf.worker.min.js')
  .then(r => r.text())
  .then(src => { pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([src], { type: 'text/javascript' })); })
  .catch(() => {});

/* ===================================================================== state */
const S = {
  sources: {},      // id -> { bytes, doc (pdf.js) }
  pages: [],        // { uid, src, idx, view:[x0,y0,x1,y1], baseRot, rot, annots:[] }
  images: {},       // key -> dataURL (kept out of undo snapshots)
  zoom: 1,
  tool: 'select',
  style: { color: '#dc2626', width: 3, opacity: 1, fill: false, fillColor: '#fde68a', hlMode: 'highlight',
           font: 'Helvetica', size: 16, bold: false, italic: false },
  toolColors: {}, toolWidths: {},
  sel: null,        // { page: uid, id }
  clip: null,
  pending: null,    // image / signature waiting to be placed
  pendingStamp: null,
  fileId: null, fileName: 'document.pdf', parentOf: null, docKey: null, editedAt: null, autoDrive: false,
  undo: [], redo: [], dirty: false,
  space: false, pdfMode: 'open', pickMode: 'open',
  form: {},          // source id -> { fieldName: value }
  tsel: new Set(), tanchor: null,   // thumbnail selection
  hover: null, guides: null, lastPtr: null,
  savedAt: null, savedWhere: '', saving: false, draftAt: null,
};

const TOOLS = [
  { id: 'select', icon: 'select', name: 'Select', key: 'v' },
  { id: 'hand', icon: 'hand', name: 'Pan', key: 'h' },
  '-',
  { id: 'pen', icon: 'pen', name: 'Pen', key: 'p' },
  { id: 'highlighter', icon: 'highlighter', name: 'Highlighter', key: 'i' },
  { id: 'eraser', icon: 'eraser', name: 'Eraser', key: 'e' },
  '-',
  { id: 'text', icon: 'text', name: 'Text', key: 't' },
  { id: 'note', icon: 'note', name: 'Note', key: 'n' },
  '-',
  { id: 'line', icon: 'line', name: 'Line', key: 'l' },
  { id: 'arrow', icon: 'arrow', name: 'Arrow', key: 'a' },
  { id: 'rect', icon: 'rect', name: 'Rectangle', key: 'r' },
  { id: 'ellipse', icon: 'ellipse', name: 'Ellipse', key: 'o' },
  { id: 'mark', icon: 'mark', name: 'Highlight area', key: 'm' },
  { id: 'whiteout', icon: 'whiteout', name: 'Cover', key: 'w' },
  { id: 'redact', icon: 'redact', name: 'Redact', key: 'x' },
  '-',
  { id: 'image', icon: 'image', name: 'Image', key: 'g' },
  { id: 'signature', icon: 'signature', name: 'Signature', key: 's' },
  { id: 'stamp', icon: 'stamp', name: 'Stamp', key: 'k' },
];
const DEFAULT_COLORS = { pen: '#1e40af', highlighter: '#facc15', mark: '#facc15', text: '#111827',
  note: '#f59e0b', line: '#dc2626', arrow: '#dc2626', rect: '#dc2626', ellipse: '#dc2626', whiteout: '#ffffff', redact: '#000000' };
const DEFAULT_WIDTHS = { pen: 3, highlighter: 16, line: 3, arrow: 3, rect: 3, ellipse: 3 };
const SWATCHES = ['#111827', '#ffffff', '#dc2626', '#f97316', '#facc15', '#16a34a', '#2563eb', '#7c3aed', '#db2777', '#6b7280'];
const PROPS = {
  pen: ['color', 'width', 'opacity'], highlighter: ['hlmode', 'color', 'width'], textmark: ['hlmode', 'color'], redact: [], line: ['color', 'width', 'opacity'],
  arrow: ['color', 'width', 'opacity'], rect: ['color', 'width', 'opacity', 'fill'], ellipse: ['color', 'width', 'opacity', 'fill'],
  mark: ['color'], whiteout: ['color'], text: ['color', 'opacity', 'font'], note: ['color'],
  stamp: ['color', 'opacity'], image: ['opacity'], signature: ['opacity'],
};
const HINTS = {
  select: 'Click to select · handles resize (Shift toggles aspect lock) · right-click for more · hold Alt to skip snapping · fill form fields here',
  hand: 'Drag to pan around', pen: 'Draw freely — hold Space to pan',
  highlighter: 'Drag across text to mark it · click a word to mark it · hold Alt to draw freehand', eraser: 'Click or drag over anything you added to erase it',
  text: 'Click anywhere to type · Ctrl+Enter or click away to finish', note: 'Click to drop a comment',
  line: 'Drag to draw · Shift snaps to 45°', arrow: 'Drag to draw · Shift snaps to 45°',
  rect: 'Drag to draw · Shift = square', ellipse: 'Drag to draw · Shift = circle',
  mark: 'Drag a box to highlight an area', whiteout: 'Covers content with a solid box — the text underneath stays in the file. Use Redact to remove it',
  redact: 'Drag over anything to remove it for good — pages with redactions are flattened when you export',
  image: 'Click on a page to place the image', signature: 'Click where you want to sign', stamp: 'Click to place the stamp',
};

const viewer = $('#viewer');
const mctx = document.createElement('canvas').getContext('2d');
let ioNear = null, ioFar = null, drag = null, activeEditor = null;

/* ============================================================ geometry utils */
function dims(p) {
  const w = p.view[2] - p.view[0], h = p.view[3] - p.view[1];
  const r = (((p.baseRot + p.rot) % 360) + 360) % 360;
  return r % 180 === 0 ? { w, h, r } : { w: h, h: w, r };
}
const FONT_FAMILIES = { Helvetica: 'Helvetica, Arial, sans-serif', Times: '"Times New Roman", Times, serif', Courier: '"Courier New", Courier, monospace' };
const cssFont = a => `${a.italic ? 'italic ' : ''}${a.bold ? 'bold ' : ''}${a.size}px ${FONT_FAMILIES[a.font] || FONT_FAMILIES.Helvetica}`;
const stampFont = sz => `bold ${sz}px Helvetica, Arial, sans-serif`;
function stdFont(a) {
  const names = {
    Helvetica: ['Helvetica', 'HelveticaBold', 'HelveticaOblique', 'HelveticaBoldOblique'],
    Times: ['TimesRoman', 'TimesRomanBold', 'TimesRomanItalic', 'TimesRomanBoldItalic'],
    Courier: ['Courier', 'CourierBold', 'CourierOblique', 'CourierBoldOblique'],
  }[a.font] || ['Helvetica', 'HelveticaBold', 'HelveticaOblique', 'HelveticaBoldOblique'];
  return PDFLib.StandardFonts[names[(a.bold ? 1 : 0) + (a.italic ? 2 : 0)]];
}
const textLines = a => a.text.replace(/\t/g, '    ').split('\n');
function textBox(a) {
  mctx.font = cssFont(a);
  const lines = textLines(a);
  const w = Math.max(4, ...lines.map(l => mctx.measureText(l).width));
  return { x: a.x, y: a.y, w, h: (lines.length - 1) * a.size * 1.2 + a.size * 1.25 };
}
function stampLayout(a) {
  mctx.font = stampFont(a.size);
  const tw = mctx.measureText(a.text).width, pad = a.size * 0.6;
  const w = tw + pad * 2, h = a.size * 1.7;
  return { x: a.x, y: a.y, w, h, baseY: a.y + h / 2 + a.size * 0.36 };
}
function arrowHead(a) {
  const ang = Math.atan2(a.y2 - a.y1, a.x2 - a.x1), len = Math.max(10, a.width * 3.5), sp = 0.45;
  return {
    tri: [[a.x2, a.y2],
          [a.x2 - len * Math.cos(ang - sp), a.y2 - len * Math.sin(ang - sp)],
          [a.x2 - len * Math.cos(ang + sp), a.y2 - len * Math.sin(ang + sp)]],
    base: [a.x2 - len * 0.8 * Math.cos(ang), a.y2 - len * 0.8 * Math.sin(ang)],
  };
}
function ellipsePts(a, n = 72) {
  const cx = a.x + a.w / 2, cy = a.y + a.h / 2, pts = [];
  for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; pts.push([cx + Math.cos(t) * a.w / 2, cy + Math.sin(t) * a.h / 2]); }
  return pts;
}
function bbox(a) {
  switch (a.type) {
    case 'ink': {
      let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
      for (const [x, y] of a.pts) { x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); y2 = Math.max(y2, y); }
      const pad = a.width / 2;
      return { x: x1 - pad, y: y1 - pad, w: x2 - x1 + 2 * pad, h: y2 - y1 + 2 * pad };
    }
    case 'line': case 'arrow': {
      const pad = Math.max(a.width, 6);
      const x = Math.min(a.x1, a.x2) - pad, y = Math.min(a.y1, a.y2) - pad;
      return { x, y, w: Math.abs(a.x2 - a.x1) + 2 * pad, h: Math.abs(a.y2 - a.y1) + 2 * pad };
    }
    case 'text': return textBox(a);
    case 'stamp': { const s = stampLayout(a); return { x: s.x, y: s.y, w: s.w, h: s.h }; }
    case 'note': return { x: a.x, y: a.y, w: 24, h: 24 };
    case 'textmark': {
      let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
      for (const r of a.rects) { x1 = Math.min(x1, r.x); y1 = Math.min(y1, r.y); x2 = Math.max(x2, r.x + r.w); y2 = Math.max(y2, r.y + r.h); }
      return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
    }
    default: return { x: a.x, y: a.y, w: a.w, h: a.h };
  }
}
function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
function hit(a, x, y, tol = 5) {
  if (a.type === 'textmark') return a.rects.some(r => x >= r.x - tol && x <= r.x + r.w + tol && y >= r.y - tol && y <= r.y + r.h + tol);
  if (a.type === 'ink') {
    for (let i = 0; i < a.pts.length; i++) {
      const p = a.pts[i], q = a.pts[i + 1] || p;
      if (segDist(x, y, p[0], p[1], q[0], q[1]) <= a.width / 2 + tol) return true;
    }
    return false;
  }
  if (a.type === 'line' || a.type === 'arrow') return segDist(x, y, a.x1, a.y1, a.x2, a.y2) <= a.width / 2 + tol;
  const b = bbox(a);
  return x >= b.x - tol && x <= b.x + b.w + tol && y >= b.y - tol && y <= b.y + b.h + tol;
}
function topHit(p, x, y, tol) {
  for (let i = p.annots.length - 1; i >= 0; i--) if (hit(p.annots[i], x, y, tol)) return p.annots[i];
  return null;
}
function moveAnnot(a, dx, dy) {
  if (a.type === 'textmark') { a.rects.forEach(r => { r.x += dx; r.y += dy; }); return; }
  if (a.type === 'ink') a.pts = a.pts.map(q => [q[0] + dx, q[1] + dy]);
  else if (a.type === 'line' || a.type === 'arrow') { a.x1 += dx; a.y1 += dy; a.x2 += dx; a.y2 += dy; }
  else { a.x += dx; a.y += dy; }
}
function resizeAnnot(a, o, b0, x, y) {
  const sx = Math.max(0.05, (x - b0.x) / b0.w), sy = Math.max(0.05, (y - b0.y) / b0.h);
  const fx = v => b0.x + (v - b0.x) * sx, fy = v => b0.y + (v - b0.y) * sy;
  switch (a.type) {
    case 'ink': a.pts = o.pts.map(q => [fx(q[0]), fy(q[1])]); break;
    case 'line': case 'arrow': a.x1 = fx(o.x1); a.y1 = fy(o.y1); a.x2 = fx(o.x2); a.y2 = fy(o.y2); break;
    case 'image': { const s = Math.max(sx, sy); a.w = Math.max(8, o.w * s); a.h = Math.max(8, o.h * s); break; }
    case 'text': case 'stamp': a.size = clamp(Math.round(o.size * sy * 10) / 10, 4, 300); break;
    case 'note': case 'textmark': break;
    default: a.w = Math.max(4, o.w * sx); a.h = Math.max(4, o.h * sy);
  }
}

/* ================================================================ rendering */
const MAX_PX = 16e6; // per-canvas pixel budget (iOS Safari blanks canvases past ~16.7M px)
const isMultiply = a => (a.type === 'textmark' && a.mode === 'highlight') || a.type === 'mark' || (a.type === 'ink' && a.hl);
function pixelRatio(p) {
  const d = dims(p), z = S.zoom;
  return clamp(Math.sqrt(MAX_PX / Math.max(1, d.w * z * d.h * z)), 0.2, DPR());
}
function fitCanvas(c, w, h) { if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } }
const imgEls = {};
function getImg(key) {
  const src = S.images[key];
  if (!src) return null;
  let im = imgEls[key];
  if (!im) {
    im = new Image();
    im.onload = () => S.pages.forEach(p => p._el && drawAnnots(p));
    im.src = src; imgEls[key] = im;
  }
  return im;
}
function poly(ctx, pts) {
  ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath();
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function drawAnnot(ctx, a) {
  if (a._editing) return;
  ctx.save();
  // highlights live on a multiply layer at full strength: overlaps never get darker
  ctx.globalAlpha = isMultiply(a) ? 1 : (a.opacity == null ? 1 : a.opacity);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = ctx.fillStyle = a.color || '#000';
  switch (a.type) {
    case 'ink': {
      const p = a.pts;
      ctx.lineWidth = a.width; ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
      if (p.length < 3) p.forEach(q => ctx.lineTo(q[0], q[1]));
      else {
        for (let i = 1; i < p.length - 1; i++) {
          ctx.quadraticCurveTo(p[i][0], p[i][1], (p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2);
        }
        const l = p[p.length - 1]; ctx.lineTo(l[0], l[1]);
      }
      ctx.stroke(); break;
    }
    case 'line':
      ctx.lineWidth = a.width; ctx.beginPath(); ctx.moveTo(a.x1, a.y1); ctx.lineTo(a.x2, a.y2); ctx.stroke(); break;
    case 'arrow': {
      const h = arrowHead(a);
      ctx.lineWidth = a.width; ctx.beginPath(); ctx.moveTo(a.x1, a.y1); ctx.lineTo(h.base[0], h.base[1]); ctx.stroke();
      poly(ctx, h.tri); ctx.fill(); break;
    }
    case 'rect':
      if (a.fill) { ctx.fillStyle = a.fill; ctx.fillRect(a.x, a.y, a.w, a.h); }
      ctx.lineJoin = 'miter'; ctx.lineWidth = a.width; ctx.strokeRect(a.x, a.y, a.w, a.h); break;
    case 'ellipse':
      ctx.beginPath(); ctx.ellipse(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, a.h / 2, 0, 0, Math.PI * 2);
      if (a.fill) { ctx.fillStyle = a.fill; ctx.fill(); }
      ctx.lineWidth = a.width; ctx.stroke(); break;
    case 'mark': ctx.fillRect(a.x, a.y, a.w, a.h); break;
    case 'textmark': a.rects.forEach(r => { const m = markRect(a, r); ctx.fillRect(m.x, m.y, m.w, m.h); }); break;
    case 'whiteout': ctx.globalAlpha = 1; ctx.fillRect(a.x, a.y, a.w, a.h); break;
    case 'redact': ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(a.x, a.y, a.w, a.h); break;
    case 'text':
      ctx.font = cssFont(a); ctx.textBaseline = 'alphabetic';
      textLines(a).forEach((ln, i) => ctx.fillText(ln, a.x, a.y + a.size * (1 + 1.2 * i)));
      break;
    case 'image': {
      const im = getImg(a.img);
      if (im && im.complete && im.naturalWidth) ctx.drawImage(im, a.x, a.y, a.w, a.h);
      else { ctx.globalAlpha = 0.25; ctx.fillStyle = '#888'; ctx.fillRect(a.x, a.y, a.w, a.h); }
      break;
    }
    case 'stamp': {
      const s = stampLayout(a);
      ctx.lineJoin = 'miter';
      ctx.lineWidth = 3; ctx.strokeRect(s.x, s.y, s.w, s.h);
      ctx.lineWidth = 1; ctx.strokeRect(s.x + 4, s.y + 4, s.w - 8, s.h - 8);
      ctx.font = stampFont(a.size); ctx.textAlign = 'center'; ctx.fillText(a.text, s.x + s.w / 2, s.baseY);
      break;
    }
    case 'note':
      ctx.globalAlpha = 1; roundRect(ctx, a.x, a.y, 24, 24, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      for (let i = 0; i < 3; i++) ctx.fillRect(a.x + 5, a.y + 7 + i * 4, i === 2 ? 9 : 14, 1.6);
      break;
  }
  ctx.restore();
}
/** Draws a list onto one canvas the way the screen composites it (highlights multiplied underneath). */
function drawAnnotsTo(ctx, list) {
  for (const a of list) if (isMultiply(a)) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; drawAnnot(ctx, a); ctx.restore(); }
  for (const a of list) if (!isMultiply(a)) drawAnnot(ctx, a);
}

/* ---- selection chrome: handles, hover outline, smart-guide lines */
const HANDLE_CURSOR = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', p1: 'crosshair', p2: 'crosshair' };
function handlesFor(a) {
  if (a.locked || a.type === 'note' || a.type === 'textmark') return [];
  if (a.type === 'line' || a.type === 'arrow') return [{ id: 'p1', x: a.x1, y: a.y1 }, { id: 'p2', x: a.x2, y: a.y2 }];
  const b = bbox(a), x1 = b.x, y1 = b.y, x2 = b.x + b.w, y2 = b.y + b.h, cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
  const all = [['nw', x1, y1], ['n', cx, y1], ['ne', x2, y1], ['e', x2, cy], ['se', x2, y2], ['s', cx, y2], ['sw', x1, y2], ['w', x1, cy]];
  const cornersOnly = a.type === 'text' || a.type === 'stamp';
  return all.filter(h => !cornersOnly || h[0].length === 2).map(([id, x, y]) => ({ id, x, y }));
}
function handleAt(a, x, y) {
  const r = 7 / S.zoom;
  return handlesFor(a).find(h => Math.abs(h.x - x) <= r && Math.abs(h.y - y) <= r) || null;
}
const UI_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif';
function drawSelection(ctx, a) {
  const b = bbox(a), z = S.zoom;
  ctx.save();
  ctx.globalAlpha = 1; ctx.lineWidth = 1.25 / z; ctx.strokeStyle = a.locked ? '#8e8e93' : '#0a84ff';
  if (a.type !== 'line' && a.type !== 'arrow') {
    if (a.locked) ctx.setLineDash([4 / z, 3 / z]);
    ctx.strokeRect(b.x - 1 / z, b.y - 1 / z, b.w + 2 / z, b.h + 2 / z);
    ctx.setLineDash([]);
  }
  for (const h of handlesFor(a)) {
    ctx.beginPath(); ctx.arc(h.x, h.y, 4.5 / z, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#0a84ff'; ctx.stroke();
  }
  if (a.locked) { // small padlock badge
    const s = 1 / z, lx = b.x + b.w + 5 * s, ly = b.y - 2 * s;
    ctx.fillStyle = '#8e8e93'; roundRect(ctx, lx, ly + 5 * s, 9 * s, 7 * s, 1.5 * s); ctx.fill();
    ctx.beginPath(); ctx.lineWidth = 1.4 * s; ctx.strokeStyle = '#8e8e93'; ctx.arc(lx + 4.5 * s, ly + 5 * s, 3 * s, Math.PI, 0); ctx.stroke();
  }
  if (a.type === 'note' && a.text) {
    const fs = 12 / z, lh = fs * 1.35, padB = 8 / z;
    const lines = a.text.split('\n').slice(0, 10).map(l => l.length > 50 ? l.slice(0, 49) + '…' : l);
    ctx.font = `${fs}px ${UI_FONT}`;
    const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + padB * 2;
    const h = lines.length * lh + padB * 2, bx = a.x + 30, by = a.y;
    ctx.fillStyle = '#fffbe6'; ctx.strokeStyle = '#d4a017'; ctx.lineWidth = 1 / z;
    roundRect(ctx, bx, by, w, h, 6 / z); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#333'; ctx.textBaseline = 'top';
    lines.forEach((l, i) => ctx.fillText(l, bx + padB, by + padB + i * lh));
  }
  ctx.restore();
}
function drawHover(ctx, a) {
  const b = bbox(a), z = S.zoom;
  ctx.save(); ctx.globalAlpha = 0.75; ctx.strokeStyle = '#0a84ff'; ctx.lineWidth = 1 / z;
  if (a.type === 'textmark') a.rects.forEach(r => ctx.strokeRect(r.x - 1 / z, r.y - 1 / z, r.w + 2 / z, r.h + 2 / z));
  else ctx.strokeRect(b.x - 2 / z, b.y - 2 / z, b.w + 4 / z, b.h + 4 / z);
  ctx.restore();
}
function drawGuides(ctx, g, d) {
  ctx.save(); ctx.strokeStyle = '#ff2d92'; ctx.lineWidth = 1 / S.zoom; ctx.beginPath();
  if (g.x != null) { ctx.moveTo(g.x, 0); ctx.lineTo(g.x, d.h); }
  if (g.y != null) { ctx.moveTo(0, g.y); ctx.lineTo(d.w, g.y); }
  ctx.stroke(); ctx.restore();
}

function drawAnnots(p, preview) {
  if (!p._el) return;
  scheduleThumb(p);
  if (!p._live) return;
  const d = dims(p), k = pixelRatio(p) * S.zoom;
  const W = Math.max(1, Math.round(d.w * k)), H = Math.max(1, Math.round(d.h * k));
  const [hl, an] = [p._el.hlC, p._el.annC].map(c => {
    fitCanvas(c, W, H);
    const ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H); ctx.setTransform(k, 0, 0, k, 0, 0);
    return ctx;
  });
  const list = preview ? p.annots.concat([preview]) : p.annots;
  for (const a of list) drawAnnot(isMultiply(a) ? hl : an, a);
  if (S.blankHover && S.blankHover.page === p.uid && S.tool === 'text') {
    const b = S.blankHover.blank, fs = b.fs || 14, top = b.line - fs * 1.1;
    an.save(); an.fillStyle = 'rgba(10,132,255,.10)'; an.strokeStyle = 'rgba(10,132,255,.75)'; an.lineWidth = 1.2 / S.zoom;
    an.beginPath(); an.roundRect(b.x - 2, top, b.w + 4, b.line + 2 - top, 3); an.fill();
    an.beginPath(); an.moveTo(b.x, b.line + 1); an.lineTo(b.x + b.w, b.line + 1); an.stroke(); an.restore();
  }
  if (S.hover && S.hover.page === p.uid && !(S.sel && S.sel.id === S.hover.id)) {
    const a = p.annots.find(x => x.id === S.hover.id); if (a) drawHover(an, a);
  }
  if (S.sel && S.sel.page === p.uid) {
    const a = p.annots.find(x => x.id === S.sel.id); if (a) drawSelection(an, a);
  }
  if (S.guides && S.guides.page === p.uid) drawGuides(an, S.guides, d);
}

/** Renders the PDF page off-screen and swaps it in, so zooming never flashes white. */
async function renderPdfLayer(p) {
  if (!p._el || !p._live) return;
  const key = S.zoom + ':' + p.rot;
  if (p._rendered === key) return;
  p._rendered = key;
  const el = p._el, d = dims(p), k = pixelRatio(p) * S.zoom;
  const c = document.createElement('canvas');
  c.className = 'pdf-layer'; c.width = Math.max(1, Math.round(d.w * k)); c.height = Math.max(1, Math.round(d.h * k));
  const ctx = c.getContext('2d', { alpha: false });
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
  try {
    if (p.src) {
      const pg = await S.sources[p.src].doc.getPage(p.idx + 1);
      if (p._el !== el || p._rendered !== key) return;
      if (p._task) { try { p._task.cancel(); } catch (e) {} }
      const task = pg.render({ canvasContext: ctx, viewport: pg.getViewport({ scale: k, rotation: d.r }) });
      p._task = task;
      await task.promise;
      if (p._task === task) p._task = null;
      if (p._el !== el || p._rendered !== key) return;
      if (!p._runs) pageRuns(p).then(r => { p._runs = r; }).catch(() => {});
      if (!el.formBuilt) { el.formBuilt = true; buildFormLayer(p, pg).catch(e => console.warn('form layer', e)); }
    }
    el.pdfC.replaceWith(c); el.pdfC = c;
    el.page.classList.remove('loading');
  } catch (e) {
    if (p._rendered === key) p._rendered = null;
    if (!e || e.name !== 'RenderingCancelledException') console.warn(e);
  }
}
/** Frees a far off-screen page's canvases (memory) and shows its skeleton again. */
function releasePage(p) {
  if (!p._el || !p._live) return;
  p._live = false; p._rendered = null;
  if (p._task) { try { p._task.cancel(); } catch (e) {} p._task = null; }
  const el = p._el;
  [el.pdfC, el.hlC, el.annC].forEach(c => { c.width = 0; c.height = 0; });
  el.page.classList.add('loading');
}
function goLive(p) {
  if (!p._el) return;
  p._live = true; renderPdfLayer(p); drawAnnots(p);
}

function buildPage(p, i) {
  const d = dims(p), z = S.zoom;
  const wrap = document.createElement('div');
  wrap.className = 'page-wrap'; wrap.dataset.uid = p.uid;
  const act = (a, ic, tip) => `<button data-act="${a}" data-tip="${tip}" aria-label="${tip}">${icon(ic, 14)}</button>`;
  wrap.innerHTML = `<div class="page-bar"><span class="page-label">Page ${i + 1} <em>of ${S.pages.length}</em></span><div class="page-actions">` +
    act('up', 'chevUp', 'Move Up') + act('down', 'chev', 'Move Down') +
    act('rotl', 'rotl', 'Rotate Left') + act('rotr', 'rotr', 'Rotate Right') +
    act('dup', 'copy', 'Duplicate Page') + act('blank', 'filePlus', 'Insert Blank Page') +
    act('del', 'trash', 'Delete Page') + '</div></div>';
  const page = document.createElement('div');
  page.className = 'page loading';
  page.style.width = d.w * z + 'px'; page.style.height = d.h * z + 'px'; page.style.setProperty('--z', z);
  const mk = cls => { const c = document.createElement('canvas'); c.className = cls; c.width = 0; c.height = 0; return c; };
  const pdfC = mk('pdf-layer'), hlC = mk('hl-layer'), annC = mk('ann-layer');
  const form = document.createElement('div'); form.className = 'form-layer';
  page.append(pdfC, hlC, annC, form); wrap.append(page);
  page.__page = p;
  p._el = { wrap, page, pdfC, hlC, annC, form, formBuilt: false }; p._rendered = null; p._live = false;
  page.addEventListener('pointerdown', e => onDown(e, p));
  page.addEventListener('pointermove', e => onHover(e, p));
  page.addEventListener('pointerleave', () => clearHover(p));
  page.addEventListener('contextmenu', e => onContext(e, p));
  return wrap;
}

function renderAll() {
  if (activeEditor) activeEditor.commit();
  if (ioNear) ioNear.disconnect();
  if (ioFar) ioFar.disconnect();
  S.pages.forEach(p => { if (p._task) { try { p._task.cancel(); } catch (e) {} p._task = null; } p._live = false; });
  ioNear = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) goLive(en.target.__page); }),
    { root: viewer, rootMargin: '1000px 0px' });
  ioFar = new IntersectionObserver(es => es.forEach(en => { if (!en.isIntersecting) releasePage(en.target.__page); }),
    { root: viewer, rootMargin: '3500px 0px' });
  const frag = document.createDocumentFragment();
  S.pages.forEach((p, i) => frag.appendChild(buildPage(p, i)));
  viewer.replaceChildren(frag);
  S.pages.forEach(p => { ioNear.observe(p._el.page); ioFar.observe(p._el.page); });
  $('#zoomVal').textContent = Math.round(S.zoom * 100) + '%';
  updatePageInfo();
  buildThumbs();
}

/* ================================================================ undo/redo */
const plainPage = p => ({ uid: p.uid, src: p.src, idx: p.idx, view: p.view, baseRot: p.baseRot, rot: p.rot, annots: p.annots });
const snapshot = () => JSON.stringify(S.pages.map(plainPage));
function pushUndo() {
  S.undo.push(snapshot());
  if (S.undo.length > 150) S.undo.shift();
  S.redo = []; S.dirty = true; updateUndoUI(); scheduleDraft();
}
function restore(json) {
  const data = JSON.parse(json);
  const same = data.length === S.pages.length && data.every((d, i) => d.uid === S.pages[i].uid && d.rot === S.pages[i].rot);
  S.sel = null;
  if (same) { data.forEach((d, i) => { S.pages[i].annots = d.annots; }); S.pages.forEach(p => drawAnnots(p)); }
  else { const st = viewer.scrollTop; S.pages = data; renderAll(); viewer.scrollTop = st; }
  updatePropbar();
}
function undo() { if (!S.undo.length) return; S.redo.push(snapshot()); restore(S.undo.pop()); S.dirty = true; updateUndoUI(); scheduleDraft(); }
function redo() { if (!S.redo.length) return; S.undo.push(snapshot()); restore(S.redo.pop()); S.dirty = true; updateUndoUI(); scheduleDraft(); }
function updateUndoUI() { $('#btnUndo').disabled = !S.undo.length; $('#btnRedo').disabled = !S.redo.length; updateMeta(); }
function updateMeta() {
  const n = S.pages.length;
  if (!n) { $('#docMeta').textContent = ''; return; }
  let st = '';
  const live = S.autoDrive && S.fileId;
  if (S.saving || S.autoBusy) st = 'Saving…';
  else if (S.dirty) st = live ? 'Edited · syncing to Drive' : S.draftAt ? 'Edited · saved on this device' : 'Edited';
  else if (S.savedAt) st = `${S.savedWhere} · ${ago(S.savedAt)}` + (live ? ' · auto-save on' : '');
  $('#docMeta').textContent = `${n} page${n === 1 ? '' : 's'}${st ? ' · ' + st : ''}`;
}

/* ================================================================ selection */
const findPage = id => S.pages.find(p => p.uid === id);
function selectedAnnot() {
  if (!S.sel) return null;
  const p = findPage(S.sel.page); if (!p) return null;
  const a = p.annots.find(x => x.id === S.sel.id);
  return a ? { p, a } : null;
}
function select(p, a) {
  const prev = selectedAnnot();
  S.sel = a ? { page: p.uid, id: a.id } : null;
  if (prev) drawAnnots(prev.p);
  if (a) { drawAnnots(p); styleFromAnnot(a); }
  updatePropbar();
}
function styleFromAnnot(a) {
  ['color', 'width', 'opacity', 'size', 'font', 'bold', 'italic'].forEach(k => { if (a[k] !== undefined) S.style[k] = a[k]; });
  if ('fill' in a) { S.style.fill = !!a.fill; if (a.fill) S.style.fillColor = a.fill; }
  if (a.mode) S.style.hlMode = a.mode;
  syncUI();
}
function addAnnot(p, a, sel = false) {
  pushUndo(); p.annots.push(a);
  if (sel) select(p, a); else drawAnnots(p);
}
function deleteSelected() {
  const cur = selectedAnnot(); if (!cur) return;
  if (cur.a.locked) { toast('This item is locked — right-click it to unlock.'); return; }
  pushUndo(); cur.p.annots = cur.p.annots.filter(b => b !== cur.a);
  S.sel = null; drawAnnots(cur.p); updatePropbar();
}
function duplicateSelected() {
  const cur = selectedAnnot(); if (!cur) return;
  const c = clone(cur.a); c.id = uid(); moveAnnot(c, 12, 12);
  addAnnot(cur.p, c, true);
}
let nudgeT = 0;
function nudge(dx, dy) {
  const cur = selectedAnnot(); if (!cur || cur.a.locked) return false;
  const now = Date.now(); if (now - nudgeT > 800) pushUndo(); nudgeT = now;
  moveAnnot(cur.a, dx, dy); drawAnnots(cur.p); return true;
}

/* ================================================================== styling */
let styleUndoT = 0;
function applyStyle(key, val) {
  S.style[key] = val;
  if (key === 'color') S.toolColors[S.tool] = val;
  if (key === 'width') S.toolWidths[S.tool] = val;
  syncUI();
  const cur = selectedAnnot(); if (!cur) return;
  const a = cur.a;
  const ok = {
    hlMode: a.type === 'textmark',
    color: 'color' in a, width: 'width' in a, opacity: 'opacity' in a, size: 'size' in a,
    font: a.type === 'text', bold: a.type === 'text', italic: a.type === 'text', fill: 'fill' in a, fillColor: 'fill' in a,
  }[key];
  if (!ok) return;
  const now = Date.now(); if (now - styleUndoT > 700) pushUndo(); styleUndoT = now;
  if (key === 'fill') a.fill = val ? S.style.fillColor : null;
  else if (key === 'fillColor') { if (a.fill) a.fill = val; }
  else if (key === 'hlMode') a.mode = val;
  else a[key] = val;
  drawAnnots(cur.p);
}
function syncUI() {
  const st = S.style;
  $('#color').value = st.color;
  $$('.sw').forEach(b => b.classList.toggle('active', b.dataset.c.toLowerCase() === st.color.toLowerCase()));
  $('#width').value = st.width; $('#widthVal').textContent = st.width + ' pt';
  $('#opacity').value = Math.round(st.opacity * 100); $('#opacityVal').textContent = Math.round(st.opacity * 100) + '%';
  $('#fill').checked = st.fill; $('#fillColor').value = st.fillColor;
  $('#font').value = st.font; $('#fontSize').value = st.size;
  $('#bold').classList.toggle('active', st.bold); $('#italic').classList.toggle('active', st.italic);
  $$('[data-hl]').forEach(b => b.classList.toggle('active', b.dataset.hl === st.hlMode));
}
function updatePropbar() {
  const cur = selectedAnnot();
  const kind = cur ? (cur.a.type === 'ink' ? (cur.a.hl ? 'highlighter' : 'pen') : cur.a.type) : S.tool;
  let show = PROPS[kind] || [];
  $$('#propbar .prop').forEach(el => { el.style.display = show.includes(el.dataset.for) ? '' : 'none'; });
  $('#hint').textContent = cur
    ? (cur.a.locked ? 'Locked — right-click to unlock' : kbdText('Selected — drag to move · drag handles to resize · Delete removes · Ctrl+D duplicates · right-click for more'))
    : (HINTS[S.tool] || '');
}

function setTool(id, force) {
  if (!force) {
    if (id === 'image') { $('#imgInput').click(); return; }
    if (id === 'signature') { openSignature(); return; }
    if (id === 'stamp') { openStamps(); return; }
  }
  if (activeEditor) activeEditor.commit();
  S.tool = id;
  const c = S.toolColors[id] || DEFAULT_COLORS[id]; if (c) S.style.color = c;
  const w = S.toolWidths[id] || DEFAULT_WIDTHS[id]; if (w) S.style.width = w;
  if (id === 'pen' || id === 'line' || id === 'arrow' || id === 'rect' || id === 'ellipse' || id === 'text') S.style.opacity = S.style.opacity < 0.5 ? 1 : S.style.opacity;
  if (id !== 'select') select(null);
  $$('.tool').forEach(b => b.classList.toggle('active', b.dataset.tool === id));
  viewer.dataset.tool = id;
  syncUI(); updatePropbar();
}

/* ============================================================ pointer input */
function pagePoint(e, p, rect) {
  const r = rect || p._el.page.getBoundingClientRect();
  return [(e.clientX - r.left) / S.zoom, (e.clientY - r.top) / S.zoom];
}
function capture(e) { e.preventDefault(); try { e.target.setPointerCapture(e.pointerId); } catch (err) {} }

function makeShape(t, x0, y0, x1, y1, shift) {
  const st = S.style;
  if (t === 'line' || t === 'arrow') {
    if (shift) {
      const ang = Math.round(Math.atan2(y1 - y0, x1 - x0) / (Math.PI / 4)) * (Math.PI / 4), len = Math.hypot(x1 - x0, y1 - y0);
      x1 = x0 + Math.cos(ang) * len; y1 = y0 + Math.sin(ang) * len;
    }
    return { id: uid(), type: t, x1: x0, y1: y0, x2: x1, y2: y1, color: st.color, width: st.width, opacity: st.opacity };
  }
  let w = x1 - x0, h = y1 - y0;
  if (shift) { const m = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w || 1) * m; h = Math.sign(h || 1) * m; }
  const box = { x: Math.min(x0, x0 + w), y: Math.min(y0, y0 + h), w: Math.abs(w), h: Math.abs(h) };
  if (t === 'mark') return { id: uid(), type: 'mark', ...box, color: st.color, opacity: 1 };
  if (t === 'whiteout') return { id: uid(), type: 'whiteout', ...box, color: st.color };
  if (t === 'redact') return { id: uid(), type: 'redact', ...box };
  return { id: uid(), type: t, ...box, color: st.color, width: st.width, opacity: st.opacity, fill: st.fill ? st.fillColor : null };
}
const meaningful = a => (a.type === 'line' || a.type === 'arrow') ? Math.hypot(a.x2 - a.x1, a.y2 - a.y1) > 3 : a.w > 3 && a.h > 3;

function placeImage(p, x, y, img) {
  addAnnot(p, { id: uid(), type: 'image', x: x - img.w / 2, y: y - img.h / 2, w: img.w, h: img.h, img: img.img, opacity: 1 }, true);
}

function onDown(e, p) {
  if (e.button === 2) return;
  const fe = document.activeElement;
  if (fe && fe.closest && fe.closest('.form-layer')) fe.blur();
  if (activeEditor) { activeEditor.commit(); e.preventDefault(); return; }
  closeMenus();
  const t = S.tool, st = S.style;
  if (S.space || t === 'hand' || e.button === 1) {
    drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, sl: viewer.scrollLeft, st: viewer.scrollTop };
    return capture(e);
  }
  const [x, y] = pagePoint(e, p);

  if (t === 'select') {
    const cur = selectedAnnot();
    if (cur && cur.p === p) {
      const h = handleAt(cur.a, x, y);
      if (h) {
        drag = { kind: 'resize', p, a: cur.a, h, orig: clone(cur.a), b0: bbox(cur.a), tg: snapTargets(p, cur.a.id), pushed: false };
        return capture(e);
      }
    }
    const a = topHit(p, x, y, 5 / S.zoom);
    if (!a) { select(null); return; }
    select(p, a);
    if (e.detail >= 2) { e.preventDefault(); if (!a.locked) editContent(p, a); return; }
    if (a.locked) return;
    drag = { kind: 'move', p, a, sx: x, sy: y, orig: clone(a), tg: snapTargets(p, a.id), pushed: false };
    return capture(e);
  }
  if (t === 'eraser') { drag = { kind: 'erase', p, pushed: false }; eraseAt(p, x, y); return capture(e); }
  if (t === 'highlighter' && !e.altKey && p._runs && p._runs.length) {
    const ri = runAt(p._runs, x, y, 3);
    if (ri >= 0) {
      const start = [ri, caretAt(p._runs[ri], x)];
      drag = { kind: 'textsel', p, runs: p._runs, start, end: start, moved: false, a: null };
      return capture(e);
    }
  }
  if (t === 'pen' || t === 'highlighter') {
    const hl = t === 'highlighter';
    drag = { kind: 'draw', p, rect: p._el.page.getBoundingClientRect(),
      a: { id: uid(), type: 'ink', pts: [[x, y]], color: st.color, width: st.width, opacity: hl ? 1 : st.opacity, hl } };
    return capture(e);
  }
  if (['line', 'arrow', 'rect', 'ellipse', 'mark', 'whiteout', 'redact'].includes(t)) {
    drag = { kind: 'shape', p, x0: x, y0: y, a: null }; return capture(e);
  }
  if (t === 'text') {
    e.preventDefault();
    const ex = topHit(p, x, y, 2 / S.zoom);
    if (ex && ex.type === 'text') { select(p, ex); editText(p, ex, false); return; }
    const na = { id: uid(), type: 'text', x, y: y - st.size * 0.6, text: '', size: st.size, font: st.font,
      bold: st.bold, italic: st.italic, color: st.color, opacity: st.opacity };
    const bl = e.altKey ? null : blankAt(blanksSync(p), x, y);
    if (bl) {   // worksheet fill: write on the blank, centered, scaled to fit
      const size0 = clamp(bl.fs || st.size, 8, 28), long = bl.w > 260;
      na.size = size0; na.fit = { x: bl.x, w: bl.w, base: bl.line - Math.min(3, size0 * 0.12), size0, center: !long };
      layoutFit(na);
    }
    S.blankHover = null;
    editText(p, na, true);
    return;
  }
  if ((t === 'image' || t === 'signature') && S.pending) {
    placeImage(p, x, y, S.pending); S.pending = null; setTool('select', true); return;
  }
  if (t === 'stamp' && S.pendingStamp) {
    const ps = S.pendingStamp;
    const a = { id: uid(), type: 'stamp', x, y, text: ps.text, color: ps.color, size: ps.size || 22, opacity: 0.9 };
    const b = bbox(a); a.x -= b.w / 2; a.y -= b.h / 2;
    addAnnot(p, a, true); setTool('select', true); return;
  }
  if (t === 'note') {
    e.preventDefault();
    const a = { id: uid(), type: 'note', x: x - 12, y: y - 12, text: '', color: st.color };
    ask('Sticky note', '', { multiline: true, okText: 'Add note', message: 'Ctrl+Enter to save.' }).then(v => {
      if (v === null || !v.trim()) return;
      a.text = v; addAnnot(p, a, false);
    });
  }
}

window.addEventListener('pointermove', e => {
  if (!drag) return;
  if (drag.kind === 'pan') {
    viewer.scrollLeft = drag.sl - (e.clientX - drag.sx);
    viewer.scrollTop = drag.st - (e.clientY - drag.sy);
    return;
  }
  const p = drag.p;
  switch (drag.kind) {
    case 'draw': {
      const pts = drag.a.pts;
      const evs = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
      (evs.length ? evs : [e]).forEach(ev => {
        const [x, y] = pagePoint(ev, p, drag.rect), l = pts[pts.length - 1];
        if (Math.hypot(x - l[0], y - l[1]) >= 0.8 / S.zoom) pts.push([Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
      });
      drawAnnots(p, drag.a); break;
    }
    case 'shape': {
      const [x, y] = pagePoint(e, p);
      drag.a = makeShape(S.tool, drag.x0, drag.y0, x, y, e.shiftKey); drawAnnots(p, drag.a); break;
    }
    case 'move': {
      const [x, y] = pagePoint(e, p);
      let dx = x - drag.sx, dy = y - drag.sy;
      if (!drag.pushed) { if (Math.hypot(dx, dy) < 1 / S.zoom) return; pushUndo(); drag.pushed = true; }
      restoreFrom(drag.a, drag.orig);
      const b = bbox(drag.orig); b.x += dx; b.y += dy;
      S.guides = null;
      if (!e.altKey) {
        const thr = 6 / S.zoom;
        const gx = nearest([b.x, b.x + b.w / 2, b.x + b.w], drag.tg.xs, thr), gy = nearest([b.y, b.y + b.h / 2, b.y + b.h], drag.tg.ys, thr);
        if (gx) dx += gx.d;
        if (gy) dy += gy.d;
        if (gx || gy) S.guides = { page: p.uid, x: gx ? gx.t : null, y: gy ? gy.t : null };
      }
      moveAnnot(drag.a, dx, dy); drawAnnots(p); break;
    }
    case 'resize': {
      let [x, y] = pagePoint(e, p);
      if (!drag.pushed) { pushUndo(); drag.pushed = true; }
      const a = drag.a, h = drag.h.id, ends = h === 'p1' || h === 'p2';
      S.guides = null;
      if (!e.altKey) {
        const thr = 6 / S.zoom, g = { page: p.uid, x: null, y: null };
        const gx = nearest([x], drag.tg.xs, thr), gy = nearest([y], drag.tg.ys, thr);
        if (gx && (ends || /[ew]/.test(h))) { x = gx.t; g.x = gx.t; }
        if (gy && (ends || /[ns]/.test(h))) { y = gy.t; g.y = gy.t; }
        if (g.x != null || g.y != null) S.guides = g;
      }
      restoreFrom(a, drag.orig);
      if (ends) {
        const ox = h === 'p1' ? a.x2 : a.x1, oy = h === 'p1' ? a.y2 : a.y1;
        if (e.shiftKey) {
          const ang = Math.round(Math.atan2(y - oy, x - ox) / (Math.PI / 4)) * (Math.PI / 4), len = Math.hypot(x - ox, y - oy);
          x = ox + Math.cos(ang) * len; y = oy + Math.sin(ang) * len;
        }
        if (h === 'p1') { a.x1 = x; a.y1 = y; } else { a.x2 = x; a.y2 = y; }
      } else {
        const lock = a.type === 'image' ? !e.shiftKey : (a.type === 'text' || a.type === 'stamp') ? true : e.shiftKey;
        applyBox(a, drag.orig, drag.b0, boxFromHandle(drag.b0, h, x, y, lock), h);
      }
      drawAnnots(p); break;
    }
    case 'erase': { const [x, y] = pagePoint(e, p); eraseAt(p, x, y); break; }
    case 'textsel': {
      const [x, y] = pagePoint(e, p);
      const ri = runAt(drag.runs, x, y, 40);
      if (ri >= 0) drag.end = [ri, caretAt(drag.runs[ri], x)];
      if (drag.end[0] !== drag.start[0] || drag.end[1] !== drag.start[1]) drag.moved = true;
      const rects = selectionRects(drag.runs, drag.start, drag.end);
      drag.a = rects.length ? makeTextmark(rects) : null;
      drawAnnots(p, drag.a); break;
    }
  }
});
function endDrag() {
  if (!drag) return;
  const d = drag; drag = null;
  if (S.guides) { const g = findPage(S.guides.page); S.guides = null; if (g && g !== d.p) drawAnnots(g); if (d.p) drawAnnots(d.p); }
  if (d.kind === 'textsel') {
    const rects = d.moved ? selectionRects(d.runs, d.start, d.end) : wordRects(d.runs, d.start);
    if (rects.length) commitTextmark(d.p, makeTextmark(rects)); else drawAnnots(d.p);
    return;
  }
  if (d.kind === 'draw') {
    const a = d.a;
    if (a.pts.length === 1) a.pts.push([a.pts[0][0] + 0.1, a.pts[0][1] + 0.1]);
    addAnnot(d.p, a);
  } else if (d.kind === 'shape') {
    if (d.a && meaningful(d.a)) addAnnot(d.p, d.a, false); else drawAnnots(d.p);
  }
}
window.addEventListener('pointerup', endDrag);
window.addEventListener('pointercancel', endDrag);

function eraseAt(p, x, y) {
  const a = topHit(p, x, y, 6 / S.zoom);
  if (!a || a.locked) return;
  if (!drag.pushed) { pushUndo(); drag.pushed = true; }
  p.annots = p.annots.filter(b => b !== a);
  if (S.sel && S.sel.id === a.id) S.sel = null;
  drawAnnots(p);
}

/* ===================================================== resize, snap, hover */
function restoreFrom(a, o) { const c = clone(o); for (const k of Object.keys(c)) a[k] = c[k]; }
function snapTargets(p, exceptId) {
  const d = dims(p), xs = [0, d.w / 2, d.w], ys = [0, d.h / 2, d.h];
  for (const a of p.annots) {
    if (a.id === exceptId || a.type === 'textmark') continue;
    const b = bbox(a); xs.push(b.x, b.x + b.w / 2, b.x + b.w); ys.push(b.y, b.y + b.h / 2, b.y + b.h);
  }
  return { xs, ys };
}
function nearest(vals, targets, thr) {
  let best = null;
  for (const v of vals) for (const t of targets) {
    const dd = t - v;
    if (Math.abs(dd) <= thr && (!best || Math.abs(dd) < Math.abs(best.d))) best = { d: dd, t };
  }
  return best;
}
/** New bounding box for a handle drag. lock = keep aspect ratio. */
function boxFromHandle(b0, h, x, y, lock) {
  let x1 = b0.x, y1 = b0.y, x2 = b0.x + b0.w, y2 = b0.y + b0.h;
  if (h.includes('w')) x1 = Math.min(x, x2 - 2);
  if (h.includes('e')) x2 = Math.max(x, x1 + 2);
  if (h.includes('n')) y1 = Math.min(y, y2 - 2);
  if (h.includes('s')) y2 = Math.max(y, y1 + 2);
  if (lock && b0.w > 0 && b0.h > 0) {
    const ar = b0.w / b0.h;
    let w = x2 - x1, ht = y2 - y1;
    if (h.length === 2) { if (w / ht > ar) ht = w / ar; else w = ht * ar; }
    else if (h === 'e' || h === 'w') ht = w / ar;
    else w = ht * ar;
    if (h.includes('w')) x1 = x2 - w; else if (h.includes('e')) x2 = x1 + w; else { const cx = b0.x + b0.w / 2; x1 = cx - w / 2; x2 = cx + w / 2; }
    if (h.includes('n')) y1 = y2 - ht; else if (h.includes('s')) y2 = y1 + ht; else { const cy = b0.y + b0.h / 2; y1 = cy - ht / 2; y2 = cy + ht / 2; }
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}
function applyBox(a, o, b0, nb, h) {
  const sx = nb.w / (b0.w || 1), sy = nb.h / (b0.h || 1);
  const fx = v => nb.x + (v - b0.x) * sx, fy = v => nb.y + (v - b0.y) * sy;
  switch (a.type) {
    case 'ink': a.pts = o.pts.map(q => [fx(q[0]), fy(q[1])]); break;
    case 'text': case 'stamp': {
      a.size = clamp(Math.round(o.size * sy * 10) / 10, 4, 300);
      a.x = o.x; a.y = o.y;
      const nbx = bbox(a);
      a.x = h.includes('w') ? b0.x + b0.w - nbx.w : b0.x;
      a.y = h.includes('n') ? b0.y + b0.h - nbx.h : b0.y;
      break;
    }
    default: a.x = fx(o.x); a.y = fy(o.y); a.w = Math.max(2, o.w * sx); a.h = Math.max(2, o.h * sy);
  }
}
function onHover(e, p) {
  S.lastPtr = { page: p.uid, pt: pagePoint(e, p) };
  if (drag) return;
  const [x, y] = S.lastPtr.pt, pg = p._el.page;
  if (S.tool === 'text' && !S.space) {
    const bl = e.altKey || topHit(p, x, y, 2 / S.zoom) ? null : blankAt(blanksSync(p), x, y);
    pg.style.cursor = bl ? 'text' : '';
    const prev = S.blankHover;
    if ((prev ? prev.blank : null) !== bl || (prev && prev.page !== p.uid)) {
      S.blankHover = bl ? { page: p.uid, blank: bl } : null;
      if (prev && prev.page !== p.uid) { const pp = findPage(prev.page); if (pp) drawAnnots(pp); }
      drawAnnots(p);
    }
    return;
  }
  if (S.tool === 'highlighter') { pg.style.cursor = !e.altKey && p._runs && runAt(p._runs, x, y, 3) >= 0 ? 'text' : ''; return; }
  if (S.tool !== 'select' || S.space) { pg.style.cursor = ''; return; }
  const cur = selectedAnnot();
  const h = cur && cur.p === p ? handleAt(cur.a, x, y) : null;
  const a = h ? null : topHit(p, x, y, 5 / S.zoom);
  pg.style.cursor = h ? HANDLE_CURSOR[h.id] : a ? (a.locked ? 'default' : 'move') : '';
  const prev = S.hover, id = a ? a.id : null;
  if ((prev ? prev.id : null) === id && (!prev || prev.page === p.uid)) return;
  S.hover = a ? { page: p.uid, id } : null;
  if (prev && prev.page !== p.uid) { const pp = findPage(prev.page); if (pp) drawAnnots(pp); }
  drawAnnots(p);
}
function clearHover(p) {
  if (S.blankHover && S.blankHover.page === p.uid) { S.blankHover = null; drawAnnots(p); }
  if (S.hover && S.hover.page === p.uid) { S.hover = null; drawAnnots(p); }
}

/* ============================================================ text marks */
// Two rects are on the same text line when they overlap by more than half a line.
function sameLine(r, n) { return Math.min(r.y + r.h, n.y + n.h) - Math.max(r.y, n.y) > Math.min(r.h, n.h) * 0.5; }
function subtractRects(rects, cut) {
  let out = rects;
  for (const n of cut) {
    const next = [];
    for (const r of out) {
      if (!sameLine(r, n) || n.x >= r.x + r.w || n.x + n.w <= r.x) { next.push(r); continue; }
      if (n.x > r.x + 0.5) next.push({ ...r, w: n.x - r.x });
      if (n.x + n.w < r.x + r.w - 0.5) next.push({ ...r, x: n.x + n.w, w: r.x + r.w - (n.x + n.w) });
    }
    out = next;
  }
  return out.filter(r => r.w > 1);
}
/** True when the text is already marked the same way in the same color. */
function isMarked(p, m) {
  const ex = p.annots.filter(a => a.type === 'textmark' && a.mode === m.mode && a.color === m.color).flatMap(a => a.rects);
  if (!ex.length) return false;
  return m.rects.every(n => subtractRects([n], ex).reduce((s, r) => s + r.w, 0) < Math.max(2, n.w * 0.08));
}
/** Adds a mark without stacking: overlapping marks of the same kind are trimmed (or, with remove, the mark is erased). */
function applyTextmark(p, m, remove) {
  for (const a of p.annots) if (a.type === 'textmark' && a.mode === m.mode && !a.locked) a.rects = subtractRects(a.rects, m.rects);
  p.annots = p.annots.filter(a => a.type !== 'textmark' || a.rects.length);
  if (!remove) p.annots.push(m);
}
function commitTextmark(p, m) {
  const remove = isMarked(p, m);
  pushUndo(); applyTextmark(p, m, remove);
  if (S.sel && !p.annots.some(a => a.id === S.sel.id)) S.sel = null;
  drawAnnots(p);
}

/* ============================================================ context menu */
const ctxMenu = document.createElement('div');
ctxMenu.className = 'menu ctx'; ctxMenu.setAttribute('role', 'menu');
document.body.appendChild(ctxMenu);
function showMenu(x, y, items) {
  closeMenus(); hideTip();
  ctxMenu.textContent = '';
  for (const it of items) {
    if (it === '-') { const s = document.createElement('div'); s.className = 'menu-sep'; ctxMenu.appendChild(s); continue; }
    const b = document.createElement('button');
    b.setAttribute('role', 'menuitem'); b.disabled = !!it.disabled;
    if (it.danger) b.classList.add('danger');
    const l = document.createElement('span'); l.className = 'ml'; l.textContent = it.label; b.appendChild(l);
    if (it.key) { const k = document.createElement('span'); k.className = 'mk'; k.textContent = kbdText(it.key); b.appendChild(k); }
    b.onclick = () => { closeMenus(); it.run(); };
    ctxMenu.appendChild(b);
  }
  ctxMenu.classList.add('show');
  const w = ctxMenu.offsetWidth, h = ctxMenu.offsetHeight;
  ctxMenu.style.left = clamp(x, 6, innerWidth - w - 6) + 'px';
  ctxMenu.style.top = clamp(y, 6, innerHeight - h - 6) + 'px';
}
function copySelected() { const cur = selectedAnnot(); if (cur) S.clip = clone(cur.a); }
function cutSelected() { const cur = selectedAnnot(); if (!cur || cur.a.locked) return; copySelected(); deleteSelected(); }
function pasteClip(p, x, y) {
  if (!S.clip) return;
  const c = clone(S.clip); c.id = uid(); delete c.locked;
  const b = bbox(c);
  if (x == null) moveAnnot(c, 14, 14); else moveAnnot(c, x - (b.x + b.w / 2), y - (b.y + b.h / 2));
  if (x == null) S.clip = clone(c);
  setTool('select', true); addAnnot(p, c, true);
}
function reorder(p, a, where) {
  pushUndo();
  p.annots = p.annots.filter(b => b !== a);
  if (where === 'front') p.annots.push(a); else p.annots.unshift(a);
  drawAnnots(p);
}
function toggleLock(p, a) {
  pushUndo();
  if (a.locked) delete a.locked; else a.locked = true;
  drawAnnots(p); updatePropbar();
}
function onContext(e, p) {
  e.preventDefault();
  if (activeEditor) activeEditor.commit();
  const [x, y] = pagePoint(e, p), a = topHit(p, x, y, 5 / S.zoom), i = S.pages.indexOf(p);
  if (a) {
    if (S.tool !== 'select') setTool('select', true);
    select(p, a);
    const L = !!a.locked, editable = ['text', 'note', 'stamp'].includes(a.type);
    showMenu(e.clientX, e.clientY, [
      ...(editable ? [{ label: 'Edit…', run: () => editContent(p, a), disabled: L }, '-'] : []),
      { label: 'Cut', key: 'Ctrl+X', run: cutSelected, disabled: L },
      { label: 'Copy', key: 'Ctrl+C', run: copySelected },
      { label: 'Paste', key: 'Ctrl+V', run: () => pasteClip(p, x, y), disabled: !S.clip },
      { label: 'Duplicate', key: 'Ctrl+D', run: duplicateSelected, disabled: L },
      '-',
      { label: 'Bring to Front', run: () => reorder(p, a, 'front'), disabled: L },
      { label: 'Send to Back', run: () => reorder(p, a, 'back'), disabled: L },
      '-',
      { label: L ? 'Unlock' : 'Lock', run: () => toggleLock(p, a) },
      '-',
      { label: 'Delete', key: '⌫', run: deleteSelected, danger: true, disabled: L },
    ]);
  } else {
    select(null);
    showMenu(e.clientX, e.clientY, [
      { label: 'Paste', key: 'Ctrl+V', run: () => pasteClip(p, x, y), disabled: !S.clip },
      '-',
      { label: 'Rotate Page Left', run: () => pageAction('rotl', p.uid) },
      { label: 'Rotate Page Right', run: () => pageAction('rotr', p.uid) },
      { label: 'Duplicate Page', run: () => pageAction('dup', p.uid) },
      { label: 'Insert Blank Page After', run: () => pageAction('blank', p.uid) },
      '-',
      { label: `Delete Page ${i + 1}`, run: () => pageAction('del', p.uid), danger: true, disabled: S.pages.length === 1 },
    ]);
  }
}

/* =============================================================== text edit */
function editText(p, a, isNew) {
  if (activeEditor) activeEditor.commit();
  const z = S.zoom, ta = document.createElement('textarea');
  if (a.fit && (Math.abs(a.x - a.fit.ax) > 0.5 || Math.abs(a.y - a.fit.ay) > 0.5 || Math.abs(a.size - a.fit.as) > 0.05)) delete a.fit; // moved or resized by hand
  ta.className = 'text-editor'; ta.value = a.text || '';
  ta.style.color = a.color; ta.style.lineHeight = '1.2';
  a._editing = true; drawAnnots(p);
  p._el.page.appendChild(ta);
  const fit = () => {
    let cur = a;
    if (a.fit) { cur = { ...a, text: ta.value }; layoutFit(cur); }   // blank: re-center and shrink as you type
    const scaled = { ...cur, size: cur.size * z };
    Object.assign(ta.style, { left: cur.x * z + 'px', top: cur.y * z + 'px', font: cssFont(scaled) });
    mctx.font = cssFont(scaled);
    const tw = Math.max(...ta.value.split('\n').map(l => mctx.measureText(l).width));
    const w = a.fit ? tw + 6 : Math.max(60, tw) + a.size * z;
    ta.style.width = w + 'px'; ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px';
  };
  ta.addEventListener('input', fit); fit();
  setTimeout(() => ta.focus(), 0);
  let done = false;
  const commit = () => {
    if (done) return; done = true;
    const v = ta.value.replace(/\s+$/, '');
    ta.remove(); delete a._editing; activeEditor = null;
    if (isNew) { if (v.trim()) { a.text = v; layoutFit(a); addAnnot(p, a, false); } else drawAnnots(p); }
    else if (v !== a.text) {
      pushUndo();
      if (v.trim()) { a.text = v; layoutFit(a); } else { p.annots = p.annots.filter(b => b !== a); S.sel = null; }
      drawAnnots(p); updatePropbar();
    } else drawAnnots(p);
  };
  ta.addEventListener('blur', commit);
  ta.addEventListener('pointerdown', e => e.stopPropagation());
  ta.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); ta.blur(); }
  });
  activeEditor = { ta, commit };
}
async function editContent(p, a) {
  if (a.type === 'text') return editText(p, a, false);
  if (a.type === 'note' || a.type === 'stamp') {
    const v = await ask(a.type === 'note' ? 'Edit note' : 'Edit stamp text', a.text, { multiline: a.type === 'note' });
    if (v === null || v === a.text) return;
    pushUndo();
    if (!v.trim()) { p.annots = p.annots.filter(b => b !== a); S.sel = null; }
    else a.text = a.type === 'stamp' ? v.toUpperCase() : v;
    drawAnnots(p); updatePropbar();
  }
}


/* ============================================================ text detection */
const runCache = new Map();
/** Positions of every text run on a page, in page view units (scale 1, current rotation). */
function pageRuns(p) {
  if (!p.src) return Promise.resolve([]);
  const total = (((p.baseRot + p.rot) % 360) + 360) % 360;
  const key = p.src + ':' + p.idx + ':' + total;
  if (!runCache.has(key)) runCache.set(key, (async () => {
    const pg = await S.sources[p.src].doc.getPage(p.idx + 1);
    const vp = pg.getViewport({ scale: 1, rotation: total });
    const tc = await pg.getTextContent();
    const runs = [];
    for (const it of tc.items) {
      if (!it.str || !(it.width > 0)) continue;
      const tx = pdfjsLib.Util.transform(vp.transform, it.transform);
      const fh = Math.hypot(tx[2], tx[3]);
      if (!fh || Math.abs(Math.atan2(tx[1], tx[0])) > 0.05) continue; // horizontal text only
      const st = tc.styles[it.fontName] || {};
      const asc = clamp(st.ascent > 0 ? st.ascent : 0.8, 0.6, 1);
      const desc = clamp(st.descent < 0 ? -st.descent : 0.2, 0.1, 0.35);
      runs.push({ str: it.str, chars: Array.from(it.str), x: tx[4], y: tx[5] - fh * asc, w: it.width, h: fh * (asc + desc), b: tx[5], fs: fh, eol: !!it.hasEOL, cx: null });
    }
    return runs;
  })());
  return runCache.get(key);
}
function runCx(r) {
  if (r.cx) return r.cx;
  mctx.font = `${Math.max(1, r.h)}px Helvetica, Arial, sans-serif`;
  const acc = [0]; let t = 0;
  for (const ch of r.chars) { t += mctx.measureText(ch).width; acc.push(t); }
  const k = t ? r.w / t : 0;
  return (r.cx = acc.map(v => v * k));
}
function runAt(runs, x, y, tol) {
  let best = -1, bd = Infinity;
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    if (!r.str.trim()) continue;
    const dx = x < r.x ? r.x - x : x > r.x + r.w ? x - r.x - r.w : 0;
    const dy = y < r.y ? r.y - y : y > r.y + r.h ? y - r.y - r.h : 0;
    const d = dx + dy * 2;
    if (d < bd) { bd = d; best = i; }
  }
  return bd <= tol ? best : -1;
}
function caretAt(r, x) {
  const cx = runCx(r), rel = x - r.x;
  for (let i = 0; i < cx.length - 1; i++) if (rel < (cx[i] + cx[i + 1]) / 2) return i;
  return cx.length - 1;
}
function segRect(r, from, to) {
  const cx = runCx(r);
  if (to <= from || !r.chars.slice(from, to).join('').trim()) return null;
  return { x: r.x + cx[from], y: r.y, w: cx[to] - cx[from], h: r.h };
}
function mergeLines(rects) {
  const out = [];
  for (const r of rects) {
    const l = out[out.length - 1];
    if (l && Math.abs(r.y - l.y) < l.h * 0.35 && Math.abs(r.h - l.h) < l.h * 0.5 &&
        r.x >= l.x - 1 && r.x - (l.x + l.w) < l.h * 1.6) {
      const y1 = Math.min(l.y, r.y), y2 = Math.max(l.y + l.h, r.y + r.h);
      l.w = Math.max(l.x + l.w, r.x + r.w) - l.x; l.y = y1; l.h = y2 - y1;
    } else out.push({ ...r });
  }
  return out;
}
/** Rectangles covering the text between two caret positions [run, char]. */
function selectionRects(runs, a, b) {
  if (b[0] < a[0] || (b[0] === a[0] && b[1] < a[1])) [a, b] = [b, a];
  const rects = [];
  for (let k = a[0]; k <= b[0]; k++) {
    const r = runs[k];
    const seg = segRect(r, k === a[0] ? a[1] : 0, k === b[0] ? b[1] : r.chars.length);
    if (seg) rects.push(seg);
  }
  return mergeLines(rects);
}
function wordRects(runs, [ri, ci]) {
  const r = runs[ri], W = /[\p{L}\p{N}'’_-]/u;
  let a = ci, b = ci;
  while (a > 0 && W.test(r.chars[a - 1])) a--;
  while (b < r.chars.length && W.test(r.chars[b])) b++;
  const seg = segRect(r, a, b);
  return seg ? [seg] : [];
}

/* ============================================================ worksheet blanks */
// A "blank" is a place to write: a run of underscores / dots / dashes in the text, or a thin horizontal line drawn in the page.
const blankCache = new Map();
const blankKey = p => p.src + ':' + p.idx + ':' + ((((p.baseRot + p.rot) % 360) + 360) % 360);
function pageBlanks(p) {
  if (!p.src) return Promise.resolve([]);
  const key = blankKey(p), total = (((p.baseRot + p.rot) % 360) + 360) % 360;
  if (!blankCache.has(key)) blankCache.set(key, (async () => {
    const runs = await pageRuns(p), out = [];
    const kindOf = c => c === '_' ? '_' : /[.…·]/.test(c) ? '.' : /[-–—]/.test(c) ? '-' : '';
    const text = [];
    for (const r of runs) {
      const cx = runCx(r), ch = r.chars;
      for (let i = 0; i < ch.length;) {
        const k = kindOf(ch[i]); if (!k) { i++; continue; }
        let j = i; while (j < ch.length && kindOf(ch[j]) === k) j++;
        if (j - i >= (k === '_' ? 2 : 4)) text.push({ x: r.x + cx[i], w: cx[j] - cx[i], base: r.b, fs: r.fs, line: r.b + r.fs * 0.1, kind: 'text' });
        i = j;
      }
    }
    text.sort((a, b) => a.base - b.base || a.x - b.x);
    for (const b of text) {
      const l = out[out.length - 1];
      if (l && l.kind === 'text' && Math.abs(l.base - b.base) < b.fs * 0.2 && b.x - (l.x + l.w) < b.fs * 0.6) l.w = b.x + b.w - l.x;
      else out.push({ ...b });
    }
    try {   // thin horizontal lines drawn as vector graphics
      const pg = await S.sources[p.src].doc.getPage(p.idx + 1);
      const vp = pg.getViewport({ scale: 1, rotation: total });
      const ol = await pg.getOperatorList(), OPS = pdfjsLib.OPS, U = pdfjsLib.Util;
      let ctm = [1, 0, 0, 1, 0, 0]; const stack = [], lines = [];
      const toV = (x, y) => U.applyTransform([x, y], U.transform(vp.transform, ctm));
      const add = (x1, y1, x2, y2) => {
        if (Math.abs(y1 - y2) > 0.8 || Math.abs(x2 - x1) < 18) return;
        lines.push({ x: Math.min(x1, x2), w: Math.abs(x2 - x1), y: (y1 + y2) / 2 });
      };
      for (let i = 0; i < ol.fnArray.length; i++) {
        const fn = ol.fnArray[i], ar = ol.argsArray[i];
        if (fn === OPS.save) stack.push(ctm);
        else if (fn === OPS.restore) { if (stack.length) ctm = stack.pop(); }
        else if (fn === OPS.transform) ctm = U.transform(ctm, ar);
        else if (fn === OPS.paintFormXObjectBegin) { stack.push(ctm); if (ar && ar[0]) ctm = U.transform(ctm, ar[0]); }
        else if (fn === OPS.paintFormXObjectEnd) { if (stack.length) ctm = stack.pop(); }
        else if (fn === OPS.constructPath) {
          const nx = ol.fnArray[i + 1]; if (nx === OPS.clip || nx === OPS.eoClip) continue;
          const [ops, co] = ar; let c = 0, cur = null;
          for (const o of ops) {
            if (o === OPS.moveTo) { cur = toV(co[c], co[c + 1]); c += 2; }
            else if (o === OPS.lineTo) { const n = toV(co[c], co[c + 1]); c += 2; if (cur) add(cur[0], cur[1], n[0], n[1]); cur = n; }
            else if (o === OPS.curveTo) { cur = toV(co[c + 4], co[c + 5]); c += 6; }
            else if (o === OPS.curveTo2 || o === OPS.curveTo3) { cur = toV(co[c + 2], co[c + 3]); c += 4; }
            else if (o === OPS.rectangle) {
              const [x, y, w, h] = [co[c], co[c + 1], co[c + 2], co[c + 3]]; c += 4;
              const a = toV(x, y), b = toV(x + w, y + h);
              if (Math.abs(b[1] - a[1]) <= 2.5) add(a[0], (a[1] + b[1]) / 2, b[0], (a[1] + b[1]) / 2);
            }
          }
        }
      }
      for (const l of lines) {
        if (out.some(b => Math.abs(b.line - l.y) < 3 && Math.abs(b.x - l.x) < 6 && Math.abs(b.w - l.w) < 8)) continue;
        // match the type size of printed text just above/left of the line
        const near = runs.filter(r => r.b <= l.y + 3 && l.y - r.b < 22 && r.x < l.x + l.w && r.x + r.w > l.x - 200).sort((a, b) => b.b - a.b)[0];
        out.push({ x: l.x, w: l.w, base: l.y, fs: near ? near.fs : 0, line: l.y, kind: 'line' });
      }
    } catch (e) { console.warn('line scan', e); }
    return out;
  })());
  return blankCache.get(key);
}
/** Cached blanks for hover and clicks; loads in the background on first use. */
function blanksSync(p) {
  const k = blankKey(p);
  if (p._bk !== k) { p._bk = k; p._blanks = []; pageBlanks(p).then(b => { if (p._bk === k) p._blanks = b; }).catch(() => {}); }
  return p._blanks;
}
function blankAt(list, x, y) {
  let best = null, bd = Infinity;
  for (const b of list) {
    const fs = b.fs || 14;
    if (x < b.x - 4 || x > b.x + b.w + 4) continue;
    const dy = b.line - y;                       // > 0 when the click is above the line
    if (dy < -fs * 0.4 || dy > fs * 1.3) continue;
    const d = Math.abs(dy - fs * 0.5) + (b.kind === 'text' ? 0 : 4);
    if (d < bd) { bd = d; best = b; }
  }
  return best;
}
/** Sizes and positions a text box so it sits on its blank: centered on short blanks, shrunk to fit. */
function layoutFit(a) {
  const f = a.fit; if (!f) return;
  const pad = 3, avail = Math.max(8, f.w - pad * 2), at = size => { mctx.font = cssFont({ ...a, size }); return Math.max(1, ...textLines(a).map(l => mctx.measureText(l).width)); };
  let size = f.size0, w = at(size);
  if (w > avail) { size = Math.max(5, size * avail / w); w = at(size); }
  a.size = Math.round(size * 10) / 10; w = at(a.size);
  const n = textLines(a).length;
  a.x = f.center ? f.x + (f.w - w) / 2 : f.x + pad;
  a.y = f.base - a.size - (n - 1) * a.size * 1.2;
  f.ax = a.x; f.ay = a.y; f.as = a.size;
}
function makeTextmark(rects) {
  const m = S.style.hlMode;
  return { id: uid(), type: 'textmark', mode: m, rects: rects.map(r => ({ ...r })), color: S.style.color, opacity: 1 };
}
function markRect(a, r) {
  const t = Math.max(0.8, r.h * 0.07);
  if (a.mode === 'underline') return { x: r.x, y: r.y + r.h * 0.84 - t / 2, w: r.w, h: t };
  if (a.mode === 'strike') return { x: r.x, y: r.y + r.h * 0.52 - t / 2, w: r.w, h: t };
  return r;
}
function setHlMode(m) {
  const sel = selectedAnnot();
  if (!sel && S.tool === 'highlighter') {
    if (m !== 'highlight' && S.style.color === '#facc15') applyStyle('color', '#dc2626');
    if (m === 'highlight' && S.style.color === '#dc2626') applyStyle('color', '#facc15');
  }
  applyStyle('hlMode', m);
}
/** Finds every occurrence of the search text and marks it on every page. */
async function highlightAll() {
  const raw = $('#findInput').value.trim();
  if (!raw) { toast('Type a word or phrase in Search first'); $('#findInput').focus(); return; }
  const needle = Array.from(raw.toLowerCase().replace(/\s+/g, ' '));
  busy('Finding matches…');
  const adds = [];
  try {
    for (const p of S.pages) {
      const runs = p._runs || (p._runs = await pageRuns(p));
      const hay = [], map = [];
      const push = (c, m) => {
        const ws = /\s/.test(c);
        if (ws && (!hay.length || hay[hay.length - 1] === ' ')) return;
        hay.push(ws ? ' ' : c.toLowerCase()); map.push(m);
      };
      runs.forEach((r, ri) => {
        r.chars.forEach((c, ci) => push(c, [ri, ci]));
        const n = runs[ri + 1];
        if (!n) return;
        const sameLine = Math.abs(n.y - r.y) < r.h * 0.5, gap = n.x - (r.x + r.w);
        if (r.eol || !sameLine || gap > r.h * 0.2) push(' ', null);
      });
      for (let i = 0; i + needle.length <= hay.length; i++) {
        let ok = true;
        for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) { ok = false; break; }
        if (!ok) continue;
        const ms = map.slice(i, i + needle.length).filter(Boolean);
        if (!ms.length) continue;
        const first = ms[0], last = ms[ms.length - 1];
        const rects = selectionRects(runs, first, [last[0], last[1] + 1]);
        if (rects.length) adds.push([p, makeTextmark(rects)]);
        i += needle.length - 1;
      }
    }
  } finally { busy(); }
  if (!adds.length) {
    const anyText = S.pages.some(p => p._runs && p._runs.length);
    toast(anyText ? `No matches for “${raw}”` : 'No selectable text found — this PDF may be a scanned image.', 4000);
    return;
  }
  const remove = adds.every(([p, m]) => isMarked(p, m));
  pushUndo();
  adds.forEach(([p, m]) => applyTextmark(p, m, remove));
  S.sel = null;
  S.pages.forEach(p => drawAnnots(p));
  scrollToPage(S.pages.indexOf(adds[0][0]), true);
  toast(`${remove ? 'Removed marks from' : 'Marked'} ${adds.length} match${adds.length === 1 ? '' : 'es'} for “${raw}”`);
}

/* ======================================================== open any file type */
const OFFICE_EXT = /\.(docx?|odt|rtf|xlsx?|ods|pptx?|odp|html?)$/i;
const TEXT_EXT = /\.(txt|md|markdown|log|json|js|ts|css|csv|tsv|xml|ya?ml|ini|cfg)$/i;
const baseName = n => (n || 'document').replace(/\.[a-z0-9]{1,5}$/i, '') || 'document';
function kindOf(mime = '') {
  if (mime === 'application/pdf') return ['pdf', 'PDF'];
  if (/^image\//.test(mime)) return ['image', 'Image'];
  if (/spreadsheet|excel|csv|tab-separated/.test(mime)) return ['sheet', mime.includes('google-apps') ? 'Google Sheet' : 'Spreadsheet'];
  if (/presentation|powerpoint/.test(mime)) return ['slides', mime.includes('google-apps') ? 'Google Slides' : 'Presentation'];
  if (/document|word|rtf/.test(mime)) return ['doc', mime.includes('google-apps') ? 'Google Doc' : 'Document'];
  if (/^text\//.test(mime)) return ['text', 'Text'];
  return ['pdf', 'File'];
}
/** Images → a PDF with one page per image (respects photo orientation). */
async function imagesToPdf(blobs) {
  const out = await PDFLib.PDFDocument.create();
  for (const blob of blobs) {
    const bmp = await createImageBitmap(blob);
    const k = Math.min(1, 3000 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    const ctx = c.getContext('2d');
    const jpg = /jpe?g|webp|heic|bmp/i.test(blob.type);
    if (jpg) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    const bytes = dataUrlToBytes(c.toDataURL(jpg ? 'image/jpeg' : 'image/png', 0.92));
    const img = jpg ? await out.embedJpg(bytes) : await out.embedPng(bytes);
    let w = bmp.width * 0.75, h = bmp.height * 0.75;
    const s = Math.min(1, 1200 / Math.max(w, h)); w *= s; h *= s;
    out.addPage([w, h]).drawImage(img, { x: 0, y: 0, width: w, height: h });
  }
  return out.save();
}
/** Plain text → typeset letter-size pages. */
async function textToPdf(text, name) {
  const L = PDFLib, out = await L.PDFDocument.create();
  const mono = /\.(csv|tsv|json|js|ts|css|log|xml|ya?ml|ini|cfg)$/i.test(name);
  const kit = fontKit(out), font = await kit.pick(mono ? L.StandardFonts.Courier : L.StandardFonts.Helvetica, text, false, false), clean = kit.clean(font);
  const size = mono ? 9.5 : 11, lh = size * 1.45, W = 612, H = 792, M = 60, maxW = W - 2 * M;
  const width = t => font.widthOfTextAtSize(t, size);
  const lines = [];
  text.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n').forEach(par => {
    par = clean(par);
    if (!par.trim()) { lines.push(''); return; }
    let cur = '';
    for (const tok of par.split(/(\s+)/)) {
      if (width(cur + tok) <= maxW) { cur += tok; continue; }
      if (cur.trim()) lines.push(cur.trimEnd());
      cur = tok.trimStart();
      while (width(cur) > maxW) {
        let n = cur.length; while (n > 1 && width(cur.slice(0, n)) > maxW) n--;
        lines.push(cur.slice(0, n)); cur = cur.slice(n);
      }
    }
    lines.push(cur.trimEnd());
  });
  let page = null, y = 0;
  for (const ln of lines) {
    if (!page || y < M) { page = out.addPage([W, H]); y = H - M - size; }
    if (ln) page.drawText(ln, { x: M, y, size, font, color: L.rgb(0.1, 0.1, 0.12) });
    y -= lh;
  }
  if (!page) out.addPage([W, H]);
  return out.save();
}
/** Any supported local file → { bytes, name } of a PDF. */
async function fileToPdf(file) {
  const name = file.name || 'file';
  if (file.type === 'application/pdf' || /\.pdf$/i.test(name)) return { bytes: new Uint8Array(await file.arrayBuffer()), name };
  if (/^image\//.test(file.type) || /\.(png|jpe?g|gif|webp|bmp|avif)$/i.test(name)) {
    busy('Converting image…'); return { bytes: await imagesToPdf([file]), name: baseName(name) + '.pdf' };
  }
  if (OFFICE_EXT.test(name) || (driveReady() && /\.(csv|tsv)$/i.test(name))) {
    if (!(await ensureDrive())) throw new Error(`Sign in with Google to open "${name}": Word, Excel and PowerPoint files are converted through Google Drive.`);
    busy(`Converting ${name}…`);
    const r = await gas('convertUpload', { b64: u8ToB64(new Uint8Array(await file.arrayBuffer())), name, mime: file.type });
    return { bytes: b64ToU8(r.b64), name: baseName(name) + '.pdf' };
  }
  if (TEXT_EXT.test(name) || /^text\//.test(file.type)) {
    busy('Converting text…'); return { bytes: await textToPdf(await file.text(), name), name: baseName(name) + '.pdf' };
  }
  throw new Error(`"${name}" isn't a supported file type.`);
}
/** Opens (or inserts) one or more local files of any supported type. */
async function openFiles(files, mode) {
  let at = mode === 'insert' && S.pages.length ? currentPageIndex() + 1 : null;
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    try {
      const r = await fileToPdf(f);
      busy();
      if (mode === 'open' && i === 0) { await openPdfBytes(r.bytes, r.name, null); at = S.pages.length; }
      else { const n = await insertPdfBytes(r.bytes, f.name, at); if (at != null) at += n; }
    } catch (e) {
      busy(); toast(errMsg(e), 6000);
      if (mode === 'open' && i === 0) return;
    }
  }
}

/* ============================================================ google account + drive */
// NOTE: write web addresses as https:\/\/ in this file. Apps Script's HTML server treats a bare // as a comment, even inside strings.
// FULL_DRIVE (config.js) lets the built-in file browser show your whole Drive; otherwise only files this app made or opened.
const DR_SCOPE = 'https:\/\/www.googleapis.com/auth/drive' + (CFG.FULL_DRIVE ? '' : '.file');
const DR_API = 'https:\/\/www.googleapis.com/drive/v3';
const DR_FILES = DR_API + '/files';
const DR_UPLOAD = 'https:\/\/www.googleapis.com/upload/drive/v3/files';
const GM = { doc: 'application/vnd.google-apps.document', sheet: 'application/vnd.google-apps.spreadsheet',
  slides: 'application/vnd.google-apps.presentation', drawing: 'application/vnd.google-apps.drawing' };
const OFFICE_MAP = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': GM.doc, 'application/msword': GM.doc,
  'application/vnd.oasis.opendocument.text': GM.doc, 'application/rtf': GM.doc, 'text/rtf': GM.doc,
  'text/plain': GM.doc, 'text/html': GM.doc, 'text/markdown': GM.doc,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': GM.sheet, 'application/vnd.ms-excel': GM.sheet,
  'application/vnd.oasis.opendocument.spreadsheet': GM.sheet, 'text/csv': GM.sheet, 'text/tab-separated-values': GM.sheet,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': GM.slides,
  'application/vnd.ms-powerpoint': GM.slides, 'application/vnd.oasis.opendocument.presentation': GM.slides,
};
const EXT_MIME = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', doc: 'application/msword',
  odt: 'application/vnd.oasis.opendocument.text', rtf: 'application/rtf', txt: 'text/plain', md: 'text/markdown',
  html: 'text/html', htm: 'text/html',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xls: 'application/vnd.ms-excel',
  ods: 'application/vnd.oasis.opendocument.spreadsheet', csv: 'text/csv', tsv: 'text/tab-separated-values',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt: 'application/vnd.ms-powerpoint', odp: 'application/vnd.oasis.opendocument.presentation',
};
const IMG_MIMES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp'];
const OPENABLE_MIMES = ['application/pdf', ...Object.values(GM), ...Object.keys(OFFICE_MAP), ...IMG_MIMES];

// Signed-in state. In the Apps Script app Google signs you in already; on the website we use Google Identity Services.
const D = { token: null, exp: 0, user: null, last: null, gasTok: null, gasExp: 0 };
try { D.last = JSON.parse(localStorage.getItem('pdfstudio-user') || 'null'); } catch (e) {}
const driveReady = () => HAS_GAS || !!D.user;
const driveLive = () => HAS_GAS || !!(D.user && D.token && Date.now() < D.exp);
const enc = encodeURIComponent;

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src; s.async = true;
    s.onload = res; s.onerror = () => rej(new Error('Could not load ' + src));
    document.head.appendChild(s);
  });
}
let gisClient = null, tokenWait = null;
function gis() {
  if (gisClient) return Promise.resolve(gisClient);
  const ready = window.google && google.accounts && google.accounts.oauth2 ? Promise.resolve() : loadScript('https:\/\/accounts.google.com/gsi/client');
  return ready.then(() => {
    gisClient = google.accounts.oauth2.initTokenClient({
      client_id: CFG.CLIENT_ID, scope: DR_SCOPE,
      callback: r => { const w = tokenWait; tokenWait = null; if (w) (r.error ? w.rej(new Error(r.error_description || r.error)) : w.res(r)); },
      error_callback: e => {
        const w = tokenWait; tokenWait = null;
        if (w) w.rej(new Error(e && e.type === 'popup_closed' ? 'Sign-in was cancelled.' : 'The Google sign-in window was blocked. Allow pop-ups for this site and try again.'));
      },
    });
    return gisClient;
  });
}
function requestToken(prompt) {
  return gis().then(c => new Promise((res, rej) => { tokenWait = { res, rej }; c.requestAccessToken({ prompt }); }));
}
function takeToken(r) { D.token = r.access_token; D.exp = Date.now() + Math.max(60, (r.expires_in || 3600) - 90) * 1000; }

async function driveToken() {
  if (HAS_GAS) {
    if (!D.gasTok || Date.now() > D.gasExp) { D.gasTok = await gas('getToken'); D.gasExp = Date.now() + 40 * 60000; }
    return D.gasTok;
  }
  if (D.token && Date.now() < D.exp) return D.token;
  if (!CFG.CLIENT_ID) throw new Error('NOCONFIG');
  if (!D.user && !D.last) throw new Error('Sign in with Google first.');
  takeToken(await requestToken(''));
  return D.token;
}
async function dapi(url, opts = {}, retried = false) {
  const res = await fetch(url, { ...opts, headers: { Authorization: 'Bearer ' + (await driveToken()), ...(opts.headers || {}) } });
  if (res.status === 401 && !retried) { D.token = null; D.gasTok = null; return dapi(url, opts, true); }
  if (!res.ok) {
    let m = res.statusText || ('Error ' + res.status);
    try { const j = await res.json(); if (j.error && j.error.message) m = j.error.message; } catch (e) {}
    throw new Error(m);
  }
  if (opts.raw) return res;
  return res.status === 204 ? null : res.json();
}
const jsonOpts = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
function multipart(meta, bytes, mime) {
  const b = 'psb' + Date.now();
  const head = `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: ${mime}\r\n\r\n`;
  return { body: new Blob([head, bytes, `\r\n--${b}--`]), headers: { 'Content-Type': 'multipart/related; boundary=' + b } };
}

const ROLE_OUT = { reader: 'reader', commenter: 'commenter', writer: 'writer' };
const DRV = {
  async me() {
    const j = await dapi(DR_API + '/about?fields=user(displayName,emailAddress,photoLink)');
    const u = j.user || {}, email = u.emailAddress || '';
    return { name: u.displayName || email, email, photo: u.photoLink || '', domain: email.split('@')[1] || '' };
  },
  async getPdf(id) {
    const m = await dapi(`${DR_FILES}/${enc(id)}?fields=id,name,mimeType,size&supportsAllDrives=true`);
    const base = { id: m.id, name: m.name, mime: m.mimeType };
    const bytes64 = async url => u8ToB64(new Uint8Array(await (await dapi(url, { raw: true })).arrayBuffer()));
    if (m.mimeType === 'application/pdf' || IMG_MIMES.includes(m.mimeType)) {
      base.kind = m.mimeType === 'application/pdf' ? 'pdf' : 'image';
      base.b64 = await bytes64(`${DR_FILES}/${enc(id)}?alt=media&supportsAllDrives=true`);
      return base;
    }
    if (Object.values(GM).includes(m.mimeType)) {
      base.kind = 'converted';
      base.b64 = await bytes64(`${DR_FILES}/${enc(id)}/export?mimeType=application%2Fpdf`);
      return base;
    }
    const target = OFFICE_MAP[m.mimeType];
    if (!target) throw new Error(`"${m.name}" can’t be opened: unsupported file type.`);
    const copy = await dapi(`${DR_FILES}/${enc(id)}/copy?supportsAllDrives=true&fields=id`, jsonOpts('POST', { name: 'PDF Studio temp — ' + m.name, mimeType: target }));
    try { base.kind = 'converted'; base.b64 = await bytes64(`${DR_FILES}/${enc(copy.id)}/export?mimeType=application%2Fpdf`); }
    finally { dapi(`${DR_FILES}/${enc(copy.id)}?supportsAllDrives=true`, { method: 'DELETE' }).catch(() => {}); }
    return base;
  },
  async convertUpload(p) {
    const ext = String(p.name || '').split('.').pop().toLowerCase();
    const src = OFFICE_MAP[p.mime] ? p.mime : EXT_MIME[ext], target = OFFICE_MAP[src];
    if (!target) throw new Error(`"${p.name}" isn’t a supported file type.`);
    const mp = multipart({ name: 'PDF Studio temp — ' + p.name, mimeType: target }, b64ToU8(p.b64), src);
    const made = await dapi(`${DR_UPLOAD}?uploadType=multipart&supportsAllDrives=true&fields=id`, { method: 'POST', ...mp });
    try {
      const r = await dapi(`${DR_FILES}/${enc(made.id)}/export?mimeType=application%2Fpdf`, { raw: true });
      return { b64: u8ToB64(new Uint8Array(await r.arrayBuffer())) };
    } finally { dapi(`${DR_FILES}/${enc(made.id)}?supportsAllDrives=true`, { method: 'DELETE' }).catch(() => {}); }
  },
  async listFiles(query) {
    let q = 'trashed = false and (' + OPENABLE_MIMES.map(m => `mimeType = '${m}'`).join(' or ') + ')';
    const fl = S.driveFilter || 'all';
    if (fl === 'pdf') q += " and mimeType = 'application/pdf'";
    if (fl === 'shared') q += ' and sharedWithMe = true';
    if (fl === 'starred') q += ' and starred = true';
    if (query) q += ` and name contains '${String(query).replace(/['\\]/g, '\\$&')}'`;
    const u = new URLSearchParams({ q, orderBy: 'modifiedTime desc', pageSize: '100', supportsAllDrives: 'true', includeItemsFromAllDrives: 'true',
      fields: 'files(id,name,mimeType,modifiedTime,size,shared,webViewLink)' });
    const j = await dapi(`${DR_FILES}?${u}`);
    return (j.files || []).map(f => ({ id: f.id, name: f.name, mime: f.mimeType, updated: Date.parse(f.modifiedTime) || 0, size: +f.size || 0, shared: !!f.shared, url: f.webViewLink }));
  },
  async savePdf(p) {
    const bytes = b64ToU8(p.b64), name = String(p.name || 'document.pdf');
    const fields = 'id,name,webViewLink';
    if (p.mode === 'overwrite' && p.fileId) {
      const f = await dapi(`${DR_UPLOAD}/${enc(p.fileId)}?uploadType=media&supportsAllDrives=true&fields=${fields}`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/pdf' }, body: new Blob([bytes], { type: 'application/pdf' }) });
      return { id: f.id, name: f.name, url: f.webViewLink };
    }
    let parent = null;
    const anchor = p.fileId || p.parentOf;
    if (anchor) { try { const m = await dapi(`${DR_FILES}/${enc(anchor)}?fields=parents&supportsAllDrives=true`); parent = m.parents && m.parents[0]; } catch (e) {} }
    const send = async parents => {
      const mp = multipart({ name, mimeType: 'application/pdf', ...(parents ? { parents } : {}) }, bytes, 'application/pdf');
      return dapi(`${DR_UPLOAD}?uploadType=multipart&supportsAllDrives=true&fields=${fields}`, { method: 'POST', ...mp });
    };
    let f;
    try { f = await send(parent ? [parent] : null); } catch (e) { if (!parent) throw e; f = await send(null); }   // folder not accessible → My Drive
    return { id: f.id, name: f.name, url: f.webViewLink };
  },

  /* ---- sharing ---- */
  async shareInfo(id) {
    const pf = 'permissions(id,type,role,emailAddress,displayName,photoLink,domain)';
    const [m, pr] = await Promise.all([
      dapi(`${DR_FILES}/${enc(id)}?fields=id,name,webViewLink,capabilities(canShare)&supportsAllDrives=true`),
      dapi(`${DR_FILES}/${enc(id)}/permissions?fields=${pf}&supportsAllDrives=true`),
    ]);
    const people = []; let general = { type: 'restricted', role: 'reader', ids: [] };
    for (const p of pr.permissions || []) {
      if (p.type === 'anyone') general = { type: 'anyone', role: p.role, ids: [...(general.ids || []), p.id] };
      else if (p.type === 'domain') {
        if (general.type === 'anyone') general.ids.push(p.id);
        else general = { type: 'domain', role: p.role, domain: p.domain, ids: [p.id] };
      } else people.push({ id: p.id, type: p.type, role: p.role, email: p.emailAddress || '', name: p.displayName || p.emailAddress || '', photo: p.photoLink || '' });
    }
    return { id: m.id, name: m.name, link: m.webViewLink, canShare: !(m.capabilities && m.capabilities.canShare === false), general, people };
  },
  async shareAdd(id, o) {
    const errors = [];
    for (const email of o.emails) {
      const u = new URLSearchParams({ supportsAllDrives: 'true', sendNotificationEmail: o.notify ? 'true' : 'false' });
      if (o.notify && o.message) u.set('emailMessage', o.message);
      try { await dapi(`${DR_FILES}/${enc(id)}/permissions?${u}`, jsonOpts('POST', { type: 'user', role: ROLE_OUT[o.role] || 'reader', emailAddress: email })); }
      catch (e) { errors.push(email + ': ' + errMsg(e)); }
    }
    return errors;
  },
  shareUpdate: (id, permId, role) => dapi(`${DR_FILES}/${enc(id)}/permissions/${enc(permId)}?supportsAllDrives=true`, jsonOpts('PATCH', { role: ROLE_OUT[role] || 'reader' })),
  shareRemove: (id, permId) => dapi(`${DR_FILES}/${enc(id)}/permissions/${enc(permId)}?supportsAllDrives=true`, { method: 'DELETE' }),
  /** type: 'restricted' | 'domain' | 'anyone' */
  async shareGeneral(id, o, current) {
    const role = ROLE_OUT[o.role] || 'reader';
    if (o.type === current.type && current.ids.length) {   // only the role changes
      for (const pid of current.ids) await DRV.shareUpdate(id, pid, o.role || 'reader');
      return;
    }
    for (const pid of current.ids) await DRV.shareRemove(id, pid);
    if (o.type === 'anyone') await dapi(`${DR_FILES}/${enc(id)}/permissions?supportsAllDrives=true`, jsonOpts('POST', { type: 'anyone', role, allowFileDiscovery: false }));
    else if (o.type === 'domain') await dapi(`${DR_FILES}/${enc(id)}/permissions?supportsAllDrives=true`, jsonOpts('POST', { type: 'domain', domain: o.domain, role, allowFileDiscovery: false }));
  },
};

/** Sign in on the website. Opens Google's own account chooser; the app never sees a password. */
async function webSignIn() {
  if (!CFG.CLIENT_ID) throw new Error('NOCONFIG');
  takeToken(await requestToken(D.last ? '' : 'select_account'));
  D.user = await DRV.me();
  D.last = { name: D.user.name, email: D.user.email, photo: D.user.photo };
  try { localStorage.setItem('pdfstudio-user', JSON.stringify(D.last)); } catch (e) {}
  updateAccountUI();
}
async function ensureDrive() {
  if (HAS_GAS) return true;
  if (!CFG.CLIENT_ID) { openModal('setupModal'); return false; }
  if (D.user && D.token && Date.now() < D.exp) return true;
  try { await webSignIn(); refreshHomeSoon(); return true; }
  catch (e) { toast('Google sign-in didn’t finish: ' + errMsg(e), 6000); return false; }
}
function signOut() {
  try { if (D.token && window.google && google.accounts) google.accounts.oauth2.revoke(D.token, () => {}); } catch (e) {}
  D.token = null; D.user = null; D.last = null;
  try { localStorage.removeItem('pdfstudio-user'); } catch (e) {}
  updateAccountUI(); refreshHomeSoon(); toast('Signed out');
}
async function initGasUser() {
  if (!HAS_GAS) return;
  try { D.user = await DRV.me(); updateAccountUI(); refreshHomeSoon(); } catch (e) { console.warn('account', e); }
}

/** Google's file picker (website version): lets people open any of their Drive files with the narrow drive.file permission. */
async function pickFromDrive(mode) {
  if (!(await ensureDrive())) return;
  if (CFG.FULL_DRIVE || !CFG.API_KEY || !CFG.APP_ID) { openDriveList(mode); return; }
  try {
    if (!(window.gapi && gapi.load)) await loadScript('https:\/\/apis.google.com/js/api.js');
    await new Promise(r => gapi.load('picker', r));
    const P = google.picker;
    const all = new P.DocsView(P.ViewId.DOCS).setIncludeFolders(true).setLabel('My Drive');
    const pdfs = new P.DocsView(P.ViewId.PDFS).setIncludeFolders(true).setLabel('PDFs');
    const shared = new P.DocsView(P.ViewId.DOCS).setOwnedByMe(false).setIncludeFolders(true).setLabel('Shared with me');
    new P.PickerBuilder()
      .addView(all).addView(pdfs).addView(shared).addView(new P.DocsUploadView())
      .setOAuthToken(await driveToken()).setDeveloperKey(CFG.API_KEY).setAppId(CFG.APP_ID)
      .setTitle(mode === 'insert' ? 'Insert from Google Drive' : 'Open from Google Drive')
      .setCallback(d => { if (d.action === google.picker.Action.PICKED && d.docs && d.docs[0]) openFromDrive(d.docs[0].id, mode); })
      .build().setVisible(true);
  } catch (e) { toast('Couldn’t open the Google Drive picker: ' + errMsg(e), 6000); openDriveList(mode); }
}

/* ============================================================== open / load */
async function addSource(bytes) {
  await workerReady;
  const task = pdfjsLib.getDocument({ data: bytes.slice() });
  task.onPassword = (cb, reason) => {
    ask(reason === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD ? 'Wrong password — try again' : 'This PDF is password-protected',
      '', { password: true, okText: 'Unlock' })
      .then(pw => { if (pw === null) task.destroy(); else cb(pw); });
  };
  const doc = await task.promise;
  const id = uid();
  S.sources[id] = { bytes, doc };
  return { id, doc };
}
async function pagesFromSource(id, doc) {
  const out = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const pg = await doc.getPage(i);
    out.push({ uid: uid(), src: id, idx: i - 1, view: Array.from(pg.view), baseRot: pg.rotate || 0, rot: 0, annots: [] });
  }
  return out;
}
function fitZoom() {
  if (!S.pages.length) return 1;
  const maxW = Math.max(...S.pages.slice(0, 50).map(p => dims(p).w));
  return clamp((viewer.clientWidth - 140) / maxW, 0.25, 5);
}
function startDoc(pages, name, fileId, parentOf, form, key) {
  S.pages = pages; S.undo = []; S.redo = []; S.sel = null; S.dirty = false;
  S.form = form || {}; S.tsel = new Set(); S.tanchor = null; S.hover = null; S.formHinted = false;
  S.savedAt = null; S.saving = false;
  clearTimeout(draftT); clearTimeout(driveT); storedSources.clear(); coverBase.clear();
  S.draftAt = null; S.draftOk = true; S.autoDrive = false; S.autoWarned = false; S.editedAt = null;
  S.fileId = fileId || null; S.parentOf = parentOf || null; S.fileName = name || 'document.pdf';
  S.docKey = key || (fileId ? 'drive:' + fileId : parentOf ? 'drive:' + parentOf : 'local:' + uid());
  textCache.clear();
  document.body.classList.remove('nodoc', 'show-home');
  $('#docName').textContent = S.fileName;
  S.zoom = Math.min(fitZoom(), 1.6);
  renderAll(); viewer.scrollTop = 0;
  updateUndoUI(); updateSaveUI(); updatePropbar(); setAutoDrive(false);
}
async function openPdfBytes(bytes, name, fileId, parentOf) {
  busy('Opening…');
  try {
    const src = await addSource(bytes);
    for (const k of Object.keys(S.sources)) if (k !== src.id) { try { S.sources[k].doc.destroy(); } catch (e) {} delete S.sources[k]; }
    startDoc(await pagesFromSource(src.id, src.doc), name, fileId, parentOf);
  } catch (e) { toast('Could not open PDF: ' + errMsg(e), 6000); }
  finally { busy(); }
}
async function insertPdfBytes(bytes, name, at) {
  busy('Inserting pages…');
  try {
    const src = await addSource(bytes);
    const pages = await pagesFromSource(src.id, src.doc);
    pushUndo();
    if (at == null) at = S.pages.length ? currentPageIndex() + 1 : 0;
    S.pages.splice(at, 0, ...pages);
    renderAll(); scrollToPage(at);
    toast(`Inserted ${pages.length} page${pages.length > 1 ? 's' : ''} from ${name}`);
    return pages.length;
  } catch (e) { toast('Could not insert file: ' + errMsg(e), 6000); return 0; }
  finally { busy(); }
}
function openBlank() {
  startDoc([{ uid: uid(), src: null, idx: 0, view: [0, 0, 612, 792], baseRot: 0, rot: 0, annots: [] }], 'Untitled.pdf', null);
  setTool('text', true);
}
/** Edits are kept automatically, so switching documents only needs the current one flushed to storage. */
async function confirmDiscard() {
  if (!S.pages.length || !(S.dirty || S.savedAt)) return true;
  clearTimeout(draftT); await saveDraft();
  if (S.dirty && !S.draftOk) return !!(await confirmBox('Discard changes?', 'Your edits couldn’t be kept on this device.', 'Discard'));
  return true;
}
async function openFromDrive(id, mode = 'open') {
  if (!(await ensureDrive())) return;
  if (mode === 'open') {
    try {
      const ex = await DB.get('docs', 'drive:' + id);
      if (ex && !ex.driveOnly && ex.unsaved) {
        const mine = await ask('Open your unsaved edits?', '', { confirm: true, okText: 'Open My Edits', cancelText: 'Open Drive Version',
          message: `You have unsaved edits to “${ex.name}” from ${ago(ex.savedAt)}.` });
        if (mine) { await restoreDoc(ex); return; }
        await deleteDoc(ex);
      }
    } catch (e) {}
  }
  busy('Getting file from Drive…');
  try {
    const r = await gas('getPdf', id);
    let bytes = b64ToU8(r.b64);
    if (r.kind === 'image') { busy('Converting image…'); bytes = await imagesToPdf([new Blob([bytes], { type: r.mime })]); }
    busy();
    const isPdf = r.kind === 'pdf';
    const name = isPdf ? r.name : baseName(r.name) + '.pdf';
    if (mode === 'insert') await insertPdfBytes(bytes, r.name);
    else { await openPdfBytes(bytes, name, isPdf ? r.id : null, isPdf ? null : r.id); setTimeout(recordOpened, 700); }
  } catch (e) { busy(); toast('Drive error: ' + errMsg(e), 6000); }
}

/* Drive picker */
function openDrivePicker(mode) { if (HAS_GAS) openDriveList(mode); else pickFromDrive(mode); }
function openDriveList(mode) {
  S.pickMode = mode;
  $('#driveNote').hidden = HAS_GAS || !!CFG.FULL_DRIVE;
  S.driveFilter = 'all'; $$('#driveTabs button').forEach(b => b.classList.toggle('on', b.dataset.f === 'all'));
  $('#driveTitle').textContent = mode === 'insert' ? 'Insert from Drive' : 'Open from Drive';
  $('#driveSearch').value = '';
  openModal('driveModal');
  setTimeout(() => $('#driveSearch').focus(), 50);
  loadDriveList('');
}
let driveReq = 0;
async function loadDriveList(q) {
  const list = $('#driveList');
  const m = q.match(/[-\w]{25,}/);
  if (m && /drive|docs\.google|^[-\w]{25,}$/.test(q.trim())) {
    list.innerHTML = '';
    const b = document.createElement('button');
    b.className = 'drive-item'; b.innerHTML = '<span class="fi link">' + icon('link', 15) + '</span><span class="fn">Open this link</span><span class="fm"></span>';
    b.onclick = () => { closeModal('driveModal'); openFromDrive(m[0], S.pickMode); };
    list.appendChild(b); return;
  }
  const req = ++driveReq;
  list.innerHTML = '<div class="muted">Loading…</div>';
  try {
    const files = await gas('listFiles', q);
    if (req !== driveReq) return;
    list.innerHTML = files.length ? '' : '<div class="muted">No matching files found.</div>';
    files.forEach(f => {
      const b = document.createElement('button');
      b.className = 'drive-item';
      const [kind, label] = kindOf(f.mime);
      b.innerHTML = `<span class="fi k-${kind}">` + icon(kind === 'image' ? 'image' : 'file', 15) + '</span><span class="fn"></span><span class="fm"></span>';
      b.querySelector('.fn').textContent = f.name;
      b.querySelector('.fm').textContent = label + ' · ' + new Date(f.updated).toLocaleDateString() + (f.size ? ' · ' + fmtSize(f.size) : '');
      b.onclick = () => { closeModal('driveModal'); openFromDrive(f.id, S.pickMode); };
      list.appendChild(b);
    });
  } catch (e) { if (req === driveReq) list.textContent = 'Error: ' + errMsg(e); }
}

/* ============================================================ unicode fonts */
// Note: URLs inside JS strings are written with \/\/ because Apps Script strips anything after a bare
// double slash as a comment when it serves HTML files, which would cut these lines in half.
const FONTKIT_URL = 'https:\/\/cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js';
const NOTO = 'https:\/\/cdn.jsdelivr.net/npm/@expo-google-fonts/';
const UNI = {
  latin: ['noto-sans@0.4.2/400Regular/NotoSans_400Regular.ttf', 'noto-sans@0.4.2/700Bold/NotoSans_700Bold.ttf',
          'noto-sans@0.4.2/400Regular_Italic/NotoSans_400Regular_Italic.ttf', 'noto-sans@0.4.2/700Bold_Italic/NotoSans_700Bold_Italic.ttf'],
  jp: ['noto-sans-jp@0.4.4/400Regular/NotoSansJP_400Regular.ttf', 'noto-sans-jp@0.4.4/700Bold/NotoSansJP_700Bold.ttf'],
  kr: ['noto-sans-kr@0.4.4/400Regular/NotoSansKR_400Regular.ttf', 'noto-sans-kr@0.4.4/700Bold/NotoSansKR_700Bold.ttf'],
};
let fontkitP = null;
const fontBytes = new Map();
function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src; s.onload = res;
    s.onerror = () => rej(new Error('Could not load ' + src)); document.head.appendChild(s);
  });
}
const getFontkit = () => fontkitP || (fontkitP = (window.fontkit ? Promise.resolve() : loadScript(FONTKIT_URL))
  .then(() => window.fontkit).catch(e => { fontkitP = null; throw e; }));
function uniFile(text, bold, italic) {
  if (/\p{Script=Hangul}/u.test(text)) return NOTO + UNI.kr[bold ? 1 : 0];
  if (/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text)) return NOTO + UNI.jp[bold ? 1 : 0];
  return NOTO + UNI.latin[(bold ? 1 : 0) + (italic ? 2 : 0)];
}
function getFontBytes(url) {
  if (!fontBytes.has(url)) fontBytes.set(url, fetch(url)
    .then(r => { if (!r.ok) throw new Error('font ' + r.status); return r.arrayBuffer(); })
    .catch(e => { fontBytes.delete(url); throw e; }));
  return fontBytes.get(url);
}
/** Fonts for one output PDF: the 14 standard fonts, with Noto fallbacks for anything they can't encode. */
function fontKit(out) {
  const std = {}, uni = {}, sets = new Map();
  let warned = false;
  const charset = f => {
    if (!sets.has(f)) { let s = null; try { s = new Set(f.getCharacterSet()); } catch (e) {} sets.set(f, s); }
    return sets.get(f);
  };
  const ok = (s, c) => c === 10 || (s ? s.has(c) : c >= 32 && c < 256);
  const kit = {
    std: async n => std[n] || (std[n] = await out.embedFont(n)),
    async pick(stdName, text, bold, italic) {
      const f = await kit.std(stdName), s = charset(f);
      if (Array.from(text).every(ch => ok(s, ch.codePointAt(0)))) return f;
      const url = uniFile(text, bold, italic);
      try {
        if (!uni[url]) uni[url] = (async () => {
          out.registerFontkit(await getFontkit());
          return out.embedFont(await getFontBytes(url), { subset: true });
        })();
        return await uni[url];
      } catch (e) {
        delete uni[url];
        if (!warned) { warned = true; toast('Couldn’t load the Unicode font — some characters were replaced with “?”.', 5000); }
        return f;
      }
    },
    clean: f => { const s = charset(f); return t => Array.from(t).map(ch => ok(s, ch.codePointAt(0)) ? ch : '?').join(''); },
    has: (f, ch) => ok(charset(f), ch.codePointAt(0)),
    async uni(url) {
      try {
        if (!uni[url]) uni[url] = (async () => {
          out.registerFontkit(await getFontkit());
          return out.embedFont(await getFontBytes(url), { subset: true });
        })();
        return await uni[url];
      } catch (e) {
        delete uni[url];
        if (!warned) { warned = true; toast('Couldn’t load the Unicode font — some characters were replaced with “?”.', 5000); }
        return null;
      }
    },
    /** Splits text into runs, each in a font that can draw it (standard font first, then the right Noto). */
    async runs(stdName, text, bold, italic) {
      const base = await kit.std(stdName), out2 = [];
      for (const ch of Array.from(text)) {
        let f = base;
        if (!kit.has(base, ch)) {
          for (const url of [uniFile(ch, bold, italic), NOTO + UNI.latin[(bold ? 1 : 0) + (italic ? 2 : 0)], NOTO + UNI.jp[bold ? 1 : 0]]) {
            const u = await kit.uni(url);
            if (u && kit.has(u, ch)) { f = u; break; }
          }
        }
        const last = out2[out2.length - 1];
        if (last && last.f === f) last.t += ch; else out2.push({ f, t: ch });
      }
      return out2.map(r => ({ f: r.f, t: kit.clean(r.f)(r.t) }));
    },
  };
  return kit;
}

/* =================================================================== export */
function makeXform(view, r) {
  const [x0, y0, x1, y1] = view;
  const f = r === 90 ? (vx, vy) => [x0 + vy, y0 + vx]
          : r === 180 ? (vx, vy) => [x1 - vx, y0 + vy]
          : r === 270 ? (vx, vy) => [x1 - vy, y1 - vx]
          : (vx, vy) => [x0 + vx, y1 - vy];
  const o = f(0, 0), ex = f(1, 0);
  return { pt: f, ang: Math.atan2(ex[1] - o[1], ex[0] - o[0]) * 180 / Math.PI };
}
function cleaner(font) {
  let set = null;
  try { set = new Set(font.getCharacterSet()); } catch (e) {}
  return s => Array.from(s).map(ch => {
    const c = ch.codePointAt(0);
    return (set ? set.has(c) : (c >= 32 && c < 256)) ? ch : '?';
  }).join('');
}
/** The page as an image, exactly as shown on screen (used for redaction, protected pages and PNG export). */
async function rasterPage(p, scale, withAnnots) {
  const d = dims(p), c = document.createElement('canvas');
  c.width = Math.round(d.w * scale); c.height = Math.round(d.h * scale);
  const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
  if (p.src) {
    const pg = await S.sources[p.src].doc.getPage(p.idx + 1);
    await pg.render({ canvasContext: ctx, viewport: pg.getViewport({ scale, rotation: d.r }) }).promise;
  }
  if (withAnnots) {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawAnnotsTo(ctx, p.annots.filter(a => a.type !== 'note' && a.type !== 'redact'));
    p.annots.filter(a => a.type === 'redact').forEach(a => drawAnnot(ctx, a)); // redactions always on top
  }
  return c;
}
/** Draws font runs one after another along the text direction (works on rotated pages too). */
function drawRuns(page, runs, T, vx, vy, size, color, opacity) {
  const rad = T.ang * Math.PI / 180;
  let [x, y] = T.pt(vx, vy);
  for (const r of runs) {
    if (!r.t) continue;
    page.drawText(r.t, { x, y, size, font: r.f, color, opacity, rotate: PDFLib.degrees(T.ang) });
    const w = r.f.widthOfTextAtSize(r.t, size);
    x += Math.cos(rad) * w; y += Math.sin(rad) * w;
  }
}
async function drawToPdf(out, page, a, T, F, imgs) {
  const L = PDFLib;
  const col = L.rgb(...hexParts(a.color || '#000000'));
  const multiply = isMultiply(a);
  const op = multiply ? 1 : (a.opacity == null ? 1 : a.opacity);
  const bm = multiply ? L.BlendMode.Multiply : undefined;
  const P = q => T.pt(q[0], q[1]), n2 = v => v.toFixed(2);
  const path = (pts, close) => pts.map((q, i) => { const [x, y] = P(q); return (i ? 'L' : 'M') + n2(x) + ' ' + n2(-y); }).join(' ') + (close ? ' Z' : '');
  // same quadratic smoothing the canvas uses, so saved ink matches the screen
  const curve = pts => {
    if (pts.length < 3) return path(pts);
    let [x, y] = P(pts[0]), d = `M${n2(x)} ${n2(-y)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      // quadratic (as drawn on the canvas) → exact cubic: c1 = p0 + ⅔(q − p0), c2 = p + ⅔(q − p)
      const [qx, qy] = P(pts[i]), [mx, my] = P([(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]);
      const c1x = x + 2 / 3 * (qx - x), c1y = y + 2 / 3 * (qy - y), c2x = mx + 2 / 3 * (qx - mx), c2y = my + 2 / 3 * (qy - my);
      d += ` C${n2(c1x)} ${n2(-c1y)} ${n2(c2x)} ${n2(-c2y)} ${n2(mx)} ${n2(-my)}`;
      x = mx; y = my;
    }
    [x, y] = P(pts[pts.length - 1]);
    return d + ` L${n2(x)} ${n2(-y)}`;
  };
  const strokeD = (d, w) => page.drawSvgPath(d, { x: 0, y: 0, borderColor: col, borderWidth: w, borderOpacity: op,
    borderLineCap: L.LineCapStyle.Round, blendMode: bm });
  const stroke = (pts, w, close) => strokeD(path(pts, close), w);
  const fillPoly = (pts, color, opacity) => page.drawSvgPath(path(pts, true), { x: 0, y: 0, color, opacity, borderWidth: 0, blendMode: bm });
  const rp = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

  switch (a.type) {
    case 'ink': strokeD(curve(a.pts.length > 1 ? a.pts : [a.pts[0], [a.pts[0][0] + 0.1, a.pts[0][1] + 0.1]]), a.width); break;
    case 'line': stroke([[a.x1, a.y1], [a.x2, a.y2]], a.width); break;
    case 'arrow': { const h = arrowHead(a); stroke([[a.x1, a.y1], h.base], a.width); fillPoly(h.tri, col, op); break; }
    case 'rect':
      if (a.fill) fillPoly(rp(a.x, a.y, a.w, a.h), L.rgb(...hexParts(a.fill)), op);
      stroke(rp(a.x, a.y, a.w, a.h), a.width, true); break;
    case 'ellipse': {
      const pts = ellipsePts(a);
      if (a.fill) fillPoly(pts, L.rgb(...hexParts(a.fill)), op);
      stroke(pts, a.width, true); break;
    }
    case 'mark': fillPoly(rp(a.x, a.y, a.w, a.h), col, op); break;
    case 'textmark': a.rects.forEach(r => { const m = markRect(a, r); fillPoly(rp(m.x, m.y, m.w, m.h), col, op); }); break;
    case 'whiteout': fillPoly(rp(a.x, a.y, a.w, a.h), col, 1); break;
    case 'redact': break; // baked into the flattened page image
    case 'text': {
      const lines = textLines(a);
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i]) continue;
        const runs = await F.runs(stdFont(a), lines[i], a.bold, a.italic);
        drawRuns(page, runs, T, a.x, a.y + a.size * (1 + 1.2 * i), a.size, col, op);
      }
      break;
    }
    case 'image': {
      let im = imgs[a.img];
      if (!im) {
        const src = S.images[a.img]; if (!src) return;
        const bytes = dataUrlToBytes(src);
        im = imgs[a.img] = src.startsWith('data:image/png') ? await out.embedPng(bytes) : await out.embedJpg(bytes);
      }
      const [x, y] = T.pt(a.x, a.y + a.h);
      page.drawImage(im, { x, y, width: a.w, height: a.h, rotate: L.degrees(T.ang), opacity: op });
      break;
    }
    case 'stamp': {
      const s = stampLayout(a);
      stroke(rp(s.x, s.y, s.w, s.h), 3, true);
      stroke(rp(s.x + 4, s.y + 4, s.w - 8, s.h - 8), 1, true);
      const runs = await F.runs(L.StandardFonts.HelveticaBold, a.text, true, false);
      const tw = runs.reduce((w, r) => w + r.f.widthOfTextAtSize(r.t, a.size), 0);
      drawRuns(page, runs, T, s.x + (s.w - tw) / 2, s.baseY, a.size, col, op);
      break;
    }
    case 'note': {
      const [ax, ay] = T.pt(a.x, a.y + 24), [bx, by] = T.pt(a.x + 24, a.y);
      const ctx = out.context;
      const dict = ctx.obj({
        Type: 'Annot', Subtype: 'Text', Name: 'Comment', F: 4,
        Rect: [Math.min(ax, bx), Math.min(ay, by), Math.max(ax, bx), Math.max(ay, by)],
        C: hexParts(a.color),
      });
      dict.set(L.PDFName.of('Contents'), L.PDFHexString.fromText(a.text || ''));
      dict.set(L.PDFName.of('T'), L.PDFHexString.fromText('PDF Studio'));
      dict.set(L.PDFName.of('M'), L.PDFString.fromDate(new Date()));
      page.node.addAnnot(ctx.register(dict));
      break;
    }
  }
}

/* ---- forms */
async function fillForm(doc, vals) {
  const L = PDFLib;
  let form; try { form = doc.getForm(); } catch (e) { return; }
  const allText = Object.values(vals).filter(v => typeof v === 'string').join(' ');
  for (const [name, v] of Object.entries(vals)) {
    try {
      const f = form.getField(name);
      if (f instanceof L.PDFTextField) f.setText(String(v == null ? '' : v));
      else if (f instanceof L.PDFCheckBox) { if (v) f.check(); else f.uncheck(); }
      else if (f instanceof L.PDFRadioGroup || f instanceof L.PDFDropdown || f instanceof L.PDFOptionList) { if (v) f.select(v); else f.clear(); }
    } catch (e) { console.warn('form field', name, e); }
  }
  try { form.updateFieldAppearances(); return; } catch (e) { /* text Helvetica can't draw (Greek, Cyrillic, CJK…) */ }
  try {
    doc.registerFontkit(await getFontkit());
    form.updateFieldAppearances(await doc.embedFont(await getFontBytes(uniFile(allText, false, false))));
  } catch (e) {
    // last resort: keep the values and let the PDF viewer draw the fields itself
    doc._skipAppearances = true;
    try { form.acroForm.dict.set(L.PDFName.of('NeedAppearances'), L.PDFBool.True); } catch (e2) {}
  }
}
const formFieldCount = doc => { try { return doc.getForm().getFields().length; } catch (e) { return 0; } };

async function loadLibDocs() {
  const libDocs = {};
  for (const p of S.pages) {
    if (!p.src || p.src in libDocs) continue;
    try { libDocs[p.src] = await PDFLib.PDFDocument.load(S.sources[p.src].bytes, { updateMetadata: false }); }
    catch (e) { libDocs[p.src] = null; }
  }
  return libDocs;
}
/** When the document is still one source PDF in its original page order, edit that PDF in place:
 *  form fields stay fillable and bookmarks, links and metadata survive. */
function inPlaceSource(libDocs) {
  const src = S.pages[0] && S.pages[0].src;
  if (!src || !libDocs[src] || S.pages.length !== libDocs[src].getPageCount()) return null;
  return S.pages.every((p, i) => p.src === src && p.idx === i && !p.annots.some(a => a.type === 'redact')) ? src : null;
}
function flattenPlan(libDocs) {
  let redacted = 0, locked = 0;
  for (const p of S.pages) {
    if (p.annots.some(a => a.type === 'redact')) redacted++;
    else if (p.src && !libDocs[p.src]) locked++;
  }
  const forms = !inPlaceSource(libDocs) && Object.values(libDocs).some(d => d && formFieldCount(d));
  return { redacted, locked, forms };
}
async function buildPdf(libDocs) {
  const L = PDFLib;
  libDocs = libDocs || await loadLibDocs();
  const inPlace = inPlaceSource(libDocs);
  for (const [src, vals] of Object.entries(S.form)) if (libDocs[src] && Object.keys(vals).length) await fillForm(libDocs[src], vals);
  let out;
  if (inPlace) out = libDocs[inPlace];
  else {
    out = await L.PDFDocument.create();
    // copied pages can't carry a live form: bake the filled values into the page
    for (const d of Object.values(libDocs)) if (d && formFieldCount(d)) { try { d.getForm().flatten(); } catch (e) { console.warn(e); } }
  }
  const F = fontKit(out), imgs = {}, outPages = inPlace ? out.getPages() : null;
  for (let i = 0; i < S.pages.length; i++) {
    const p = S.pages[i], d = dims(p);
    const redacted = p.annots.some(a => a.type === 'redact');
    let page, view = p.view, rot = d.r, list = p.annots;
    if (inPlace) page = outPages[i];
    else if (redacted || (p.src && !libDocs[p.src])) {
      // flatten: the image replaces the page content, so redacted text is gone for good
      const c = await rasterPage(p, 2.5, redacted);
      const jpg = await out.embedJpg(dataUrlToBytes(c.toDataURL('image/jpeg', 0.9)));
      page = out.addPage([d.w, d.h]);
      page.drawImage(jpg, { x: 0, y: 0, width: d.w, height: d.h });
      view = [0, 0, d.w, d.h]; rot = 0;
      if (redacted) list = p.annots.filter(a => a.type === 'note');
    } else if (p.src) { const [cp] = await out.copyPages(libDocs[p.src], [p.idx]); page = out.addPage(cp); }
    else page = out.addPage([view[2] - view[0], view[3] - view[1]]);
    page.setRotation(L.degrees(rot));
    const T = makeXform(view, rot);
    for (const a of list) {
      try { await drawToPdf(out, page, a, T, F, imgs); } catch (e) { console.warn('Could not export', a.type, e); }
    }
  }
  out.setProducer('PDF Studio'); out.setModificationDate(new Date());
  return out.save({ updateFieldAppearances: !out._skipAppearances });
}
let flattenAck = '';
async function buildWithBusy() {
  if (activeEditor) activeEditor.commit();
  busy('Preparing…');
  let libDocs;
  try { libDocs = await loadLibDocs(); } catch (e) { busy(); toast('Export failed: ' + errMsg(e), 6000); return null; }
  busy();
  const plan = flattenPlan(libDocs), parts = [];
  if (plan.redacted) parts.push(`${plan.redacted} page${plan.redacted > 1 ? 's' : ''} with redactions will be flattened into images, so the hidden content is permanently removed.`);
  if (plan.locked) parts.push(`${plan.locked} protected page${plan.locked > 1 ? 's' : ''} can’t be copied as-is and will be flattened into images.`);
  if (plan.redacted || plan.locked) parts.push('Text on flattened pages can no longer be selected or searched.');
  if (plan.forms) parts.push('Because pages were rearranged or combined, form fields will be flattened: filled-in values are kept but can’t be edited afterwards.');
  const msg = parts.join(' ');
  if (msg && msg !== flattenAck) {
    if (!(await confirmBox('Before you export', msg, 'Continue'))) return null;
    flattenAck = msg;
  }
  busy('Building PDF…');
  try { return await buildPdf(libDocs); }
  catch (e) { toast('Export failed: ' + errMsg(e), 6000); return null; }
  finally { busy(); }
}
function markSaved(where) {
  S.dirty = false; S.saving = false; S.savedAt = Date.now(); S.savedWhere = where;
  S.editedAt = S.editedAt || Date.now(); saveDraft(); updateMeta();
}
async function download() {
  const bytes = await buildWithBusy(); if (!bytes) return;
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const a = document.createElement('a'); a.href = url; a.download = S.fileName;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  markSaved('Downloaded');
}
async function printPdf() {
  const bytes = await buildWithBusy(); if (!bytes) return;
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const w = window.open(url, '_blank');
  if (!w) toast('Pop-up blocked — use Download instead.');
}
async function exportPagePng() {
  const i = currentPageIndex(), p = S.pages[i]; if (!p) return;
  busy('Rendering page…');
  try {
    const c = await rasterPage(p, 2, true);
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = S.fileName.replace(/\.pdf$/i, '') + `-page${i + 1}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  } catch (e) { toast('PNG export failed: ' + errMsg(e)); }
  finally { busy(); }
}
async function saveToDrive(mode) {
  if (!S.pages.length) return;
  if (!(await ensureDrive())) return;
  let name = S.fileName;
  if (mode === 'overwrite') {
    if (!S.fileId) { toast('This file did not come from Drive — use "Save as New Copy".'); return; }
    const ok = await confirmBox('Replace the original?',
      `This replaces "${S.fileName}" in Drive. Drive keeps version history, so you can always restore the old one.`, 'Replace');
    if (!ok) return;
  } else {
    const n = await ask('Save copy to Drive as', S.fileName.replace(/\.pdf$/i, '') + (S.fileId ? ' (edited)' : '') + '.pdf');
    if (n === null || !n.trim()) return;
    name = /\.pdf$/i.test(n.trim()) ? n.trim() : n.trim() + '.pdf';
  }
  const bytes = await buildWithBusy(); if (!bytes) return;
  S.saving = true; updateMeta();
  busy('Uploading to Drive…');
  try {
    const res = await gas('savePdf', { b64: u8ToB64(bytes), name, fileId: S.fileId, parentOf: S.parentOf, mode });
    S.fileId = res.id; S.parentOf = null; S.fileName = res.name; $('#docName').textContent = res.name;
    setAutoDrive(true);
    markSaved('Saved to Drive');
    updateSaveUI();
    toast(`Saved to Drive · <a href="${encodeURI(res.url)}" target="_blank" rel="noopener">Open in Drive</a>`, 7000, true);
  } catch (e) { toast('Save failed: ' + errMsg(e), 7000); }
  finally { S.saving = false; updateMeta(); busy(); }
}
function updateSaveUI() { const b = $('#saveOverwrite'); if (b) b.disabled = !S.fileId; updateMeta(); }

/* ================================================================ form layer */
async function buildFormLayer(p, pg) {
  const anns = await pg.getAnnotations({ intent: 'display' });
  const widgets = anns.filter(w => w.subtype === 'Widget' && w.fieldName && !w.hidden && !w.pushButton &&
    (w.fieldType === 'Tx' || w.fieldType === 'Btn' || w.fieldType === 'Ch'));
  if (!widgets.length || !p._el) return;
  const d = dims(p), vp = pg.getViewport({ scale: 1, rotation: d.r });
  const layer = p._el.form, vals = S.form[p.src] || (S.form[p.src] = {});
  for (const w of widgets) {
    const [x1, y1, x2, y2] = vp.convertToViewportRectangle(w.rect);
    const x = Math.min(x1, x2), y = Math.min(y1, y2), wd = Math.abs(x2 - x1), ht = Math.abs(y2 - y1);
    const name = w.fieldName, has = Object.prototype.hasOwnProperty.call(vals, name);
    let el;
    if (w.fieldType === 'Tx') {
      el = document.createElement(w.multiLine ? 'textarea' : 'input');
      el.value = has ? vals[name] : (w.fieldValue || '');
      if (w.maxLen) el.maxLength = w.maxLen;
      el.addEventListener('input', () => setField(p.src, name, el.value, el));
      const fs = (w.defaultAppearanceData && w.defaultAppearanceData.fontSize) || Math.min(ht * 0.68, 12);
      el.style.fontSize = `calc(${fs}px * var(--z))`;
    } else if (w.fieldType === 'Btn') {
      el = document.createElement('input');
      if (w.radioButton) {
        el.type = 'radio'; el.name = 'f_' + p.src + '_' + name; el.value = w.buttonValue;
        el.checked = has ? vals[name] === w.buttonValue : w.fieldValue === w.buttonValue;
        el.addEventListener('change', () => { if (el.checked) setField(p.src, name, w.buttonValue, el); });
      } else {
        el.type = 'checkbox';
        el.checked = has ? !!vals[name] : !!(w.fieldValue && w.fieldValue !== 'Off');
        el.addEventListener('change', () => setField(p.src, name, el.checked, el));
      }
    } else {
      el = document.createElement('select');
      (w.options || []).forEach(o => { const op = document.createElement('option'); op.value = o.exportValue; op.textContent = o.displayValue; el.appendChild(op); });
      const cur = has ? vals[name] : (Array.isArray(w.fieldValue) ? w.fieldValue[0] : w.fieldValue);
      if (cur != null) el.value = cur;
      el.addEventListener('change', () => setField(p.src, name, el.value, el));
      el.style.fontSize = `calc(${Math.min(ht * 0.62, 12)}px * var(--z))`;
    }
    el.className = 'ff ff-' + w.fieldType.toLowerCase();
    if (w.readOnly) el.disabled = true;
    Object.assign(el.style, { left: x / d.w * 100 + '%', top: y / d.h * 100 + '%', width: wd / d.w * 100 + '%', height: ht / d.h * 100 + '%' });
    el.setAttribute('aria-label', w.alternativeText || name);
    el.title = w.alternativeText || name;
    el.dataset.field = name;
    el.addEventListener('pointerdown', e => e.stopPropagation());
    layer.appendChild(el);
  }
  if (!S.formHinted) { S.formHinted = true; toast('This PDF has fillable fields — click them with the Select tool to fill them in.', 5000); }
}
function setField(src, name, v, el) {
  (S.form[src] || (S.form[src] = {}))[name] = v;
  // keep every widget of the same field in sync (fields can repeat across pages)
  S.pages.forEach(p => p._el && p.src === src && p._el.form.querySelectorAll('[data-field]').forEach(o => {
    if (o === el || o.dataset.field !== name || o.type === 'radio') return;
    if (o.type === 'checkbox') o.checked = !!v; else if (o.value !== v) o.value = v;
  }));
  S.dirty = true; updateMeta(); scheduleDraft();
}

/* ================================================================== pages */
function currentPageIndex() {
  if (!S.pages.length) return 0;
  const mid = viewer.getBoundingClientRect().top + viewer.clientHeight / 3;
  let best = 0;
  S.pages.forEach((p, i) => { if (p._el && p._el.wrap.getBoundingClientRect().top <= mid) best = i; });
  return best;
}
function updatePageInfo() {
  $('#pageNum').value = S.pages.length ? currentPageIndex() + 1 : 0;
  $('#pageCount').textContent = 'of ' + S.pages.length;
  updateMeta(); markCurrentThumb();
}
function scrollToPage(i, flash) {
  const p = S.pages[clamp(i, 0, S.pages.length - 1)]; if (!p || !p._el) return;
  viewer.scrollTo({ top: p._el.wrap.offsetTop - 12, behavior: 'smooth' });
  if (flash) { p._el.page.classList.remove('flash'); void p._el.page.offsetWidth; p._el.page.classList.add('flash'); }
}
function rotatePage(p, deg) {
  const { w: W, h: H } = dims(p);
  const f = deg > 0 ? (x, y) => [H - y, x] : (x, y) => [y, W - x];
  for (const a of p.annots) {
    switch (a.type) {
      case 'ink': a.pts = a.pts.map(q => f(q[0], q[1])); break;
      case 'line': case 'arrow': [a.x1, a.y1] = f(a.x1, a.y1); [a.x2, a.y2] = f(a.x2, a.y2); break;
      case 'textmark':
        a.rects = a.rects.map(r => {
          const c1 = f(r.x, r.y), c2 = f(r.x + r.w, r.y + r.h);
          return { x: Math.min(c1[0], c2[0]), y: Math.min(c1[1], c2[1]), w: Math.abs(c1[0] - c2[0]), h: Math.abs(c1[1] - c2[1]) };
        });
        break;
      case 'rect': case 'ellipse': case 'mark': case 'whiteout': case 'redact': {
        const c1 = f(a.x, a.y), c2 = f(a.x + a.w, a.y + a.h);
        a.x = Math.min(c1[0], c2[0]); a.y = Math.min(c1[1], c2[1]); a.w = Math.abs(c1[0] - c2[0]); a.h = Math.abs(c1[1] - c2[1]);
        break;
      }
      default: {
        const b = bbox(a), cx = b.x + b.w / 2, cy = b.y + b.h / 2, c = f(cx, cy);
        a.x += c[0] - cx; a.y += c[1] - cy;
      }
    }
  }
  p.rot = (((p.rot + deg) % 360) + 360) % 360;
}
async function pageAction(act, puid) {
  const i = S.pages.findIndex(p => p.uid === puid); if (i < 0) return;
  const p = S.pages[i];
  switch (act) {
    case 'up': if (i === 0) return; pushUndo(); [S.pages[i - 1], S.pages[i]] = [S.pages[i], S.pages[i - 1]]; break;
    case 'down': if (i === S.pages.length - 1) return; pushUndo(); [S.pages[i + 1], S.pages[i]] = [S.pages[i], S.pages[i + 1]]; break;
    case 'rotl': pushUndo(); rotatePage(p, -90); break;
    case 'rotr': pushUndo(); rotatePage(p, 90); break;
    case 'dup': {
      pushUndo(); const c = clone(plainPage(p)); c.uid = uid(); c.annots.forEach(a => { a.id = uid(); });
      S.pages.splice(i + 1, 0, c); break;
    }
    case 'blank': {
      pushUndo(); const d = dims(p);
      S.pages.splice(i + 1, 0, { uid: uid(), src: null, idx: 0, view: [0, 0, d.w, d.h], baseRot: 0, rot: 0, annots: [] });
      break;
    }
    case 'del': {
      if (S.pages.length === 1) { toast("Can't delete the only page."); return; }
      if (!(await confirmBox(`Delete page ${i + 1}?`, 'You can undo this with Ctrl+Z.', 'Delete'))) return;
      pushUndo(); S.pages.splice(i, 1); break;
    }
  }
  S.sel = null;
  const st = viewer.scrollTop; renderAll(); viewer.scrollTop = st; updatePropbar();
}

/* =================================================================== zoom */
let zoomT = 0;
/** Zooms instantly by resizing pages (canvases stretch via CSS), keeps the point under the cursor
 *  fixed, then re-renders sharp pages in the background. */
function zoomTo(z, anchor) {
  z = clamp(z, 0.25, 5);
  if (!S.pages.length || Math.abs(z - S.zoom) < 1e-4) return;
  if (activeEditor) activeEditor.commit();
  const vr = viewer.getBoundingClientRect();
  const ax = anchor ? anchor.x : vr.left + vr.width / 2, ay = anchor ? anchor.y : vr.top + vr.height / 2;
  let ref = null;
  for (const p of S.pages) {
    const r = p._el.page.getBoundingClientRect();
    if (ay <= r.bottom + 14) { ref = { p, lx: (ax - r.left) / S.zoom, ly: (ay - r.top) / S.zoom }; break; }
  }
  if (!ref) { const p = S.pages[S.pages.length - 1], r = p._el.page.getBoundingClientRect(); ref = { p, lx: (ax - r.left) / S.zoom, ly: (ay - r.top) / S.zoom }; }
  S.zoom = z;
  for (const p of S.pages) {
    const d = dims(p), st = p._el.page.style;
    st.width = d.w * z + 'px'; st.height = d.h * z + 'px'; st.setProperty('--z', z);
  }
  const r2 = ref.p._el.page.getBoundingClientRect();
  viewer.scrollLeft += r2.left + ref.lx * z - ax;
  viewer.scrollTop += r2.top + ref.ly * z - ay;
  $('#zoomVal').textContent = Math.round(z * 100) + '%';
  clearTimeout(zoomT);
  zoomT = setTimeout(() => S.pages.forEach(p => { if (p._live) { renderPdfLayer(p); drawAnnots(p); } }), 150);
}
function setZoom(z) { zoomTo(z); }
viewer.addEventListener('wheel', e => {
  if (!(e.ctrlKey || e.metaKey) || !S.pages.length) return;
  e.preventDefault();
  const f = clamp(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.04 : 0.002)), 0.5, 2);
  zoomTo(S.zoom * f, { x: e.clientX, y: e.clientY });
}, { passive: false });

/* ============================================================== thumbnails */
const THUMB_W = 132;
let thumbIO = null, tdrag = null;
const thumbTimers = {};
const dropLine = document.createElement('div'); dropLine.className = 'drop-line';
function scheduleThumb(p) {
  clearTimeout(thumbTimers[p.uid]);
  thumbTimers[p.uid] = setTimeout(() => drawThumbAnn(p), 450);
}
function buildThumbs() {
  const box = $('#thumbs'); if (!box) return;
  if (thumbIO) thumbIO.disconnect();
  thumbIO = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) renderThumb(en.target.__page); }),
    { root: box, rootMargin: '400px 0px' });
  for (const id of [...S.tsel]) if (!findPage(id)) S.tsel.delete(id);
  const frag = document.createDocumentFragment();
  S.pages.forEach((p, i) => {
    const d = dims(p), h = Math.round(THUMB_W * d.h / d.w);
    const t = document.createElement('div');
    t.className = 'thumb' + (S.tsel.has(p.uid) ? ' sel' : '');
    t.dataset.uid = p.uid; t.__page = p;
    t.setAttribute('role', 'option'); t.setAttribute('aria-label', 'Page ' + (i + 1));
    t.innerHTML = `<div class="th-img" style="width:${THUMB_W}px;height:${h}px"><canvas class="th-pdf"></canvas><canvas class="th-ann"></canvas></div><div class="th-num">${i + 1}</div>`;
    p._thumb = { el: t, pdf: t.querySelector('.th-pdf'), ann: t.querySelector('.th-ann'), done: false };
    frag.appendChild(t);
  });
  frag.appendChild(dropLine);
  box.replaceChildren(frag);
  S.pages.forEach(p => thumbIO.observe(p._thumb.el));
  $('#sbCount').textContent = S.pages.length;
  markCurrentThumb(true);
}
async function renderThumb(p) {
  const th = p._thumb; if (!th || th.done) return;
  th.done = true;
  const d = dims(p), sc = THUMB_W / d.w * DPR();
  th.pdf.width = th.ann.width = Math.round(d.w * sc); th.pdf.height = th.ann.height = Math.round(d.h * sc);
  const ctx = th.pdf.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, th.pdf.width, th.pdf.height);
  if (p.src) {
    try { const pg = await S.sources[p.src].doc.getPage(p.idx + 1); await pg.render({ canvasContext: ctx, viewport: pg.getViewport({ scale: sc, rotation: d.r }) }).promise; }
    catch (e) {}
  }
  drawThumbAnn(p);
}
function drawThumbAnn(p) {
  const th = p._thumb; if (!th || !th.done) return;
  const d = dims(p), sc = THUMB_W / d.w * DPR(), ctx = th.ann.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, th.ann.width, th.ann.height);
  ctx.setTransform(sc, 0, 0, sc, 0, 0);
  drawAnnotsTo(ctx, p.annots);
}
let curThumb = null;
function markCurrentThumb(force) {
  const p = S.pages[currentPageIndex()]; if (!p || !p._thumb) return;
  if (curThumb === p.uid && !force) return;
  curThumb = p.uid;
  $$('.thumb.cur').forEach(t => t.classList.remove('cur'));
  p._thumb.el.classList.add('cur');
  if (!tdrag && !$('#sidebar').classList.contains('hidden')) p._thumb.el.scrollIntoView({ block: 'nearest' });
}
function refreshThumbSel() { $$('.thumb').forEach(t => t.classList.toggle('sel', S.tsel.has(t.dataset.uid))); }
function thumbClick(p, e) {
  const i = S.pages.indexOf(p);
  if (e.shiftKey && S.tanchor != null) {
    const a = Math.min(S.tanchor, i), b = Math.max(S.tanchor, i);
    S.tsel = new Set(S.pages.slice(a, b + 1).map(q => q.uid));
  } else if (e.metaKey || e.ctrlKey) {
    if (S.tsel.has(p.uid)) S.tsel.delete(p.uid); else S.tsel.add(p.uid);
    S.tanchor = i;
  } else { S.tsel = new Set([p.uid]); S.tanchor = i; scrollToPage(i); }
  refreshThumbSel();
}
function targetPages() {
  const sel = S.pages.filter(p => S.tsel.has(p.uid));
  return sel.length ? sel : [S.pages[currentPageIndex()]].filter(Boolean);
}
async function bulk(act) {
  const ps = targetPages(); if (!ps.length) return;
  if (act === 'del') {
    if (ps.length >= S.pages.length) { toast('A document needs at least one page.'); return; }
    if (!(await confirmBox(`Delete ${ps.length} page${ps.length > 1 ? 's' : ''}?`, 'You can undo this with Ctrl+Z.', 'Delete'))) return;
    pushUndo(); S.pages = S.pages.filter(p => !ps.includes(p)); S.tsel.clear();
  } else if (act === 'rotl' || act === 'rotr') {
    pushUndo(); ps.forEach(p => rotatePage(p, act === 'rotl' ? -90 : 90));
  } else if (act === 'dup') {
    pushUndo();
    const next = [];
    S.pages.forEach(p => {
      next.push(p);
      if (ps.includes(p)) { const c = clone(plainPage(p)); c.uid = uid(); c.annots.forEach(a => { a.id = uid(); }); next.push(c); }
    });
    S.pages = next;
  }
  S.sel = null;
  const st = viewer.scrollTop; renderAll(); viewer.scrollTop = st; updatePropbar();
}
function initThumbs() {
  const box = $('#thumbs');
  box.addEventListener('pointerdown', e => {
    const t = e.target.closest('.thumb');
    if (!t || e.button !== 0) return;
    tdrag = { p: t.__page, sx: e.clientX, sy: e.clientY, active: false, idx: null };
  });
  window.addEventListener('pointermove', e => {
    if (!tdrag) return;
    if (!tdrag.active) {
      if (Math.hypot(e.clientX - tdrag.sx, e.clientY - tdrag.sy) < 6) return;
      tdrag.active = true;
      if (!S.tsel.has(tdrag.p.uid)) { S.tsel = new Set([tdrag.p.uid]); refreshThumbSel(); }
      document.body.classList.add('thumb-dragging');
      $$('.thumb').forEach(t => t.classList.toggle('moving', S.tsel.has(t.dataset.uid)));
    }
    const thumbs = $$('.thumb', box), br = box.getBoundingClientRect();
    let idx = thumbs.length;
    for (let i = 0; i < thumbs.length; i++) { const r = thumbs[i].getBoundingClientRect(); if (e.clientY < r.top + r.height / 2) { idx = i; break; } }
    tdrag.idx = idx;
    const ref = thumbs[Math.min(idx, thumbs.length - 1)].getBoundingClientRect();
    dropLine.style.top = (idx < thumbs.length ? ref.top - 5 : ref.bottom + 5) - br.top + box.scrollTop + 'px';
    dropLine.classList.add('show');
    if (e.clientY < br.top + 36) box.scrollTop -= 14; else if (e.clientY > br.bottom - 36) box.scrollTop += 14;
  });
  window.addEventListener('pointerup', e => {
    if (!tdrag) return;
    const d = tdrag; tdrag = null;
    dropLine.classList.remove('show'); document.body.classList.remove('thumb-dragging');
    $$('.thumb.moving').forEach(t => t.classList.remove('moving'));
    if (!d.active) { thumbClick(d.p, e); return; }
    if (d.idx == null) return;
    const moving = S.pages.filter(p => S.tsel.has(p.uid)), rest = S.pages.filter(p => !S.tsel.has(p.uid));
    const before = S.pages.slice(0, d.idx).filter(p => !S.tsel.has(p.uid)).length;
    const next = [...rest.slice(0, before), ...moving, ...rest.slice(before)];
    if (next.every((p, i) => p === S.pages[i])) return;
    pushUndo(); S.pages = next;
    const st = viewer.scrollTop; renderAll(); viewer.scrollTop = st;
    scrollToPage(before);
  });
  $$('[data-tact]').forEach(b => b.onclick = () => bulk(b.dataset.tact));
  const sb = $('#sidebar');
  let show = window.innerWidth > 1100;
  try { const v = localStorage.getItem('pdfstudio.sidebar'); if (v != null) show = v === '1'; } catch (e) {}
  sb.classList.toggle('hidden', !show);
  $('#btnSidebar').classList.toggle('active', show);
  $('#btnSidebar').onclick = () => {
    const nowShow = sb.classList.contains('hidden');
    sb.classList.toggle('hidden', !nowShow); $('#btnSidebar').classList.toggle('active', nowShow);
    try { localStorage.setItem('pdfstudio.sidebar', nowShow ? '1' : '0'); } catch (e) {}
    if (nowShow) markCurrentThumb(true);
  };
}

/* ============================================================ documents: autosave + recents */
const DB = (() => {
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    if (!window.indexedDB) return rej(new Error('IndexedDB unavailable'));
    const r = indexedDB.open('pdf-studio', 2);
    r.onupgradeneeded = () => {
      for (const n of ['drafts', 'sources', 'docs']) if (!r.result.objectStoreNames.contains(n)) r.result.createObjectStore(n);
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => { dbp = null; rej(r.error); };
  }));
  const run = (store, mode, fn) => open().then(db => new Promise((res, rej) => {
    const t = db.transaction(store, mode), req = fn(t.objectStore(store));
    t.oncomplete = () => res(req && req.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
  }));
  return {
    get: (s, k) => run(s, 'readonly', st => st.get(k)),
    all: s => run(s, 'readonly', st => st.getAll()),
    put: (s, k, v) => run(s, 'readwrite', st => st.put(v, k)),
    del: (s, k) => run(s, 'readwrite', st => st.delete(k)),
    clear: s => run(s, 'readwrite', st => st.clear()),
  };
})();
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}

const MAX_FULL_DOCS = 12, MAX_META_DOCS = 40;
let draftT = 0;
const storedSources = new Set();
const srcKey = (docKey, id) => docKey + '|' + id;
const docOpenId = d => d.openId || d.fileId || d.parentOf || '';

function scheduleDraft() {
  S.editedAt = Date.now();
  clearTimeout(draftT); draftT = setTimeout(saveDraft, 1200);
  scheduleDriveSave();
}

/** A small picture of page 1 (with your edits) for the Home screen. */
const coverBase = new Map();
async function makeCover() {
  const p = S.pages[0]; if (!p) return null;
  const d = dims(p), W = 260, sc = W / d.w;
  const key = p.src + ':' + p.idx + ':' + d.r;
  let base = coverBase.get(key);
  if (!base) {
    base = document.createElement('canvas'); base.width = W; base.height = Math.max(1, Math.round(d.h * sc));
    const bx = base.getContext('2d'); bx.fillStyle = '#fff'; bx.fillRect(0, 0, base.width, base.height);
    if (p.src && S.sources[p.src]) {
      const pg = await S.sources[p.src].doc.getPage(p.idx + 1);
      await pg.render({ canvasContext: bx, viewport: pg.getViewport({ scale: sc, rotation: d.r }) }).promise;
    }
    coverBase.clear(); coverBase.set(key, base);
  }
  const c = document.createElement('canvas'); c.width = base.width; c.height = base.height;
  const ctx = c.getContext('2d'); ctx.drawImage(base, 0, 0);
  ctx.setTransform(sc, 0, 0, sc, 0, 0); drawAnnotsTo(ctx, p.annots);
  return c.toDataURL('image/jpeg', 0.72);
}

async function saveDraft() {
  if (!S.pages.length) return;
  if (!S.dirty && !S.savedAt) return;           // untouched documents aren't kept; edited or saved ones are
  if (!S.docKey) S.docKey = 'local:' + uid();
  const key = S.docKey;
  try {
    const ids = [...new Set(S.pages.map(p => p.src).filter(Boolean))];
    for (const id of ids) if (!storedSources.has(id)) { await DB.put('sources', srcKey(key, id), S.sources[id].bytes); storedSources.add(id); }
    const images = {};
    S.pages.forEach(p => p.annots.forEach(a => { if (a.img && S.images[a.img]) images[a.img] = S.images[a.img]; }));
    const cover = await makeCover().catch(() => null);
    const prev = await DB.get('docs', key).catch(() => null);
    await DB.put('docs', key, {
      key, name: S.fileName, fileId: S.fileId, parentOf: S.parentOf, openId: S.fileId || S.parentOf || '',
      savedAt: S.editedAt || Date.now(), openedAt: Date.now(), unsaved: !!S.dirty, autoDrive: !!S.autoDrive,
      pageCount: S.pages.length, cover, pages: S.pages.map(plainPage), images, sources: ids, form: S.form,
    });
    for (const id of (prev && prev.sources) || []) if (!ids.includes(id)) DB.del('sources', srcKey(key, id)).catch(() => {});
    S.draftAt = Date.now(); S.draftOk = true; updateMeta();
    pruneDocs();
  } catch (e) { S.draftOk = false; console.warn('Draft not saved', e); }
}
async function deleteDoc(rec) {
  try {
    await DB.del('docs', rec.key);
    for (const id of rec.sources || []) await DB.del('sources', srcKey(rec.key, id));
  } catch (e) {}
}
async function pruneDocs() {
  try {
    const all = (await DB.all('docs')).filter(d => d && d.key && d.key !== S.docKey).sort((a, b) => b.savedAt - a.savedAt);
    const full = all.filter(d => !d.driveOnly), meta = all.filter(d => d.driveOnly);
    for (const d of full.slice(MAX_FULL_DOCS - 1)) await deleteDoc(d);
    for (const d of meta.slice(MAX_META_DOCS)) await deleteDoc(d);
  } catch (e) {}
}
async function restoreDoc(rec) {
  busy('Opening…');
  try {
    const map = {};
    for (const id of rec.sources) {
      const bytes = await DB.get('sources', srcKey(rec.key, id));
      if (!bytes) throw new Error('part of this document is missing');
      map[id] = (await addSource(new Uint8Array(bytes))).id;
    }
    const keep = new Set(Object.values(map));
    for (const k of Object.keys(S.sources)) if (!keep.has(k)) { try { S.sources[k].doc.destroy(); } catch (e) {} delete S.sources[k]; }
    Object.assign(S.images, rec.images || {});
    const form = {};
    for (const [k, v] of Object.entries(rec.form || {})) if (map[k]) form[map[k]] = v;
    startDoc(rec.pages.map(p => ({ ...p, src: p.src ? map[p.src] : null })), rec.name, rec.fileId, rec.parentOf, form, rec.key);
    S.dirty = !!rec.unsaved; S.editedAt = rec.savedAt; setAutoDrive(!!rec.autoDrive);
    if (!S.dirty) { S.savedAt = rec.savedAt; S.savedWhere = rec.fileId ? 'Saved to Drive' : 'Saved'; }
    updateMeta(); updateSaveUI();
    if (S.dirty) scheduleDraft(); else saveDraft();
  } catch (e) { toast('Couldn’t open this document: ' + errMsg(e), 6000); }
  finally { busy(); }
}
/** Remember a document opened from Drive, so it shows up in Recent even before you edit it. */
async function recordOpened() {
  if (!S.pages.length || !(S.fileId || S.parentOf)) return;
  const key = S.docKey;
  try {
    const ex = await DB.get('docs', key);
    if (ex && !ex.driveOnly && ex.unsaved) return;
    await DB.put('docs', key, { key, name: S.fileName, fileId: S.fileId, parentOf: S.parentOf, openId: S.fileId || S.parentOf,
      driveOnly: true, openedAt: Date.now(), savedAt: Date.now(), pageCount: S.pages.length, cover: await makeCover().catch(() => null) });
    pruneDocs();
  } catch (e) {}
}
function ago(t) {
  const s = (Date.now() - t) / 1000;
  if (s < 45) return 'just now';
  if (s < 3600) return Math.round(s / 60) + ' min ago';
  if (s < 86400) return Math.round(s / 3600) + ' h ago';
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: s > 31536000 ? 'numeric' : undefined });
}
setInterval(() => updateMeta(), 30000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { clearTimeout(draftT); saveDraft(); } });
window.addEventListener('pagehide', () => { clearTimeout(draftT); saveDraft(); });

/* ---- keep the Drive copy up to date (only for files you have saved to Drive from here) ---- */
let driveT = 0;
function scheduleDriveSave() {
  clearTimeout(driveT);
  if (S.autoDrive && S.fileId && S.dirty) driveT = setTimeout(autoSaveDrive, 6000);
}
async function autoSaveDrive() {
  if (!S.autoDrive || !S.fileId || !S.dirty || S.saving || S.autoBusy || !driveLive()) return;
  S.autoBusy = true;
  const t0 = S.editedAt;
  try {
    const libDocs = await loadLibDocs(), plan = flattenPlan(libDocs);
    if (plan.redacted || plan.locked || plan.forms) { S.autoSkip = true; return; }   // would flatten pages: only on an explicit save
    S.autoSkip = false;
    const bytes = await buildPdf(libDocs);
    await gas('savePdf', { b64: u8ToB64(bytes), name: S.fileName, fileId: S.fileId, parentOf: null, mode: 'overwrite' });
    if (S.editedAt === t0) markSaved('Saved to Drive'); else { S.savedAt = Date.now(); S.savedWhere = 'Saved to Drive'; scheduleDriveSave(); }
  } catch (e) {
    console.warn('auto-save', e);
    if (!S.autoWarned) { S.autoWarned = true; toast('Couldn’t auto-save to Drive: ' + errMsg(e) + '. Your changes are kept on this device.', 7000); }
    driveT = setTimeout(autoSaveDrive, 60000);
  } finally { S.autoBusy = false; updateMeta(); }
}
function setAutoDrive(on) {
  S.autoDrive = !!on; S.autoWarned = false;
  const it = $('#autoDriveItem'); if (it) it.classList.toggle('on', S.autoDrive);
  if (S.autoDrive) scheduleDriveSave(); else clearTimeout(driveT);
  updateMeta(); if (S.dirty || S.savedAt) saveDraft();
}

/* ============================================================ home screen */
function showHome() { document.body.classList.add('show-home'); refreshHome(); }
function hideHome() { document.body.classList.remove('show-home'); }
async function goHome() {
  if (activeEditor) activeEditor.commit();
  if (S.pages.length) { clearTimeout(draftT); await saveDraft(); }
  showHome();
}
let homeReq = 0, homeSoonT = 0;
function refreshHomeSoon() { clearTimeout(homeSoonT); homeSoonT = setTimeout(() => { if (isHomeVisible()) refreshHome(); }, 80); }
const isHomeVisible = () => document.body.classList.contains('nodoc') || document.body.classList.contains('show-home');

function avatar(u, size = 28) {
  const el = document.createElement('span'); el.className = 'avatar'; el.style.setProperty('--sz', size + 'px');
  const name = (u && (u.name || u.email)) || '?';
  if (u && u.photo) { const im = document.createElement('img'); im.src = u.photo; im.alt = ''; im.referrerPolicy = 'no-referrer'; im.onerror = () => { im.remove(); el.textContent = name[0].toUpperCase(); }; el.appendChild(im); }
  else el.textContent = name[0].toUpperCase();
  let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  el.style.setProperty('--hue', h);
  return el;
}
function updateAccountUI() {
  const box = $('#homeAcct'), tb = $('#btnAcct'), who = $('#acctWho'), out = $('#acctSignOut'), inn = $('#acctSignIn');
  if (!box) return;
  box.replaceChildren();
  const u = D.user;
  if (u) {
    const chip = document.createElement('div'); chip.className = 'acct-chip';
    chip.appendChild(avatar(u, 30));
    const t = document.createElement('div'); t.className = 'acct-txt';
    t.innerHTML = '<b></b><span></span>'; t.firstChild.textContent = u.name || u.email; t.lastChild.textContent = u.email;
    chip.appendChild(t); box.appendChild(chip);
    if (!HAS_GAS) {
      const b = document.createElement('button'); b.className = 'btn'; b.textContent = 'Sign out'; b.onclick = signOut; box.appendChild(b);
    }
  } else if (!HAS_GAS) {
    const b = document.createElement('button'); b.className = 'btn-primary signin';
    b.innerHTML = icon('user', 15) + '<span></span>';
    b.lastChild.textContent = D.last ? 'Continue as ' + (D.last.name || D.last.email) : 'Sign in with Google';
    b.onclick = () => ensureDrive(); box.appendChild(b);
  }
  // toolbar account button
  tb.replaceChildren(); tb.dataset.tip = u ? (u.name || u.email) : 'Sign in with Google';
  if (u) tb.appendChild(avatar(u, 22)); else tb.innerHTML = icon('user', 17);
  who.textContent = u ? (u.name ? u.name + ' · ' : '') + u.email : 'Not signed in';
  out.hidden = !u || HAS_GAS; inn.hidden = !!u || HAS_GAS;
  tb.hidden = HAS_GAS && !u;
}

function card(o) {
  const el = document.createElement('div'); el.className = 'rcard'; el.tabIndex = 0; el.setAttribute('role', 'button');
  const th = document.createElement('div'); th.className = 'rthumb';
  if (o.cover) { const im = document.createElement('img'); im.src = o.cover; im.alt = ''; im.loading = 'lazy'; th.appendChild(im); }
  else th.innerHTML = icon(o.icon || 'file', 30);
  el.appendChild(th);
  const nm = document.createElement('div'); nm.className = 'rname'; nm.textContent = o.title; nm.title = o.title; el.appendChild(nm);
  const sb = document.createElement('div'); sb.className = 'rsub';
  if (o.badge) { const b = document.createElement('i'); b.className = 'dot ' + o.badge; sb.appendChild(b); }
  sb.appendChild(document.createTextNode(o.sub)); el.appendChild(sb);
  if (o.actions && o.actions.length) {
    const ac = document.createElement('div'); ac.className = 'ractions';
    for (const a of o.actions) {
      const b = document.createElement('button'); b.innerHTML = icon(a.icon, 14); b.dataset.tip = a.tip; b.setAttribute('aria-label', a.tip);
      b.onclick = e => { e.stopPropagation(); a.run(); }; ac.appendChild(b);
    }
    el.appendChild(ac);
  }
  const go = () => o.open();
  el.onclick = go; el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
  return el;
}
async function refreshHome() {
  const req = ++homeReq;
  updateAccountUI();
  $('#homeBack').hidden = !S.pages.length; $('#homeBackName').textContent = S.fileName;
  let docs = [];
  try { docs = (await DB.all('docs')).filter(d => d && d.key); } catch (e) {}
  if (req !== homeReq) return;
  const recency = d => d.driveOnly ? d.openedAt : Math.max(d.savedAt || 0, d.openedAt || 0);
  docs.sort((a, b) => recency(b) - recency(a));
  const seen = new Set();
  const list = docs.filter(d => { const k = docOpenId(d); if (!k) return true; if (seen.has(k)) return false; seen.add(k); return true; });
  const grid = $('#recentGrid'); grid.replaceChildren();
  $('#recentEmpty').hidden = list.length > 0;
  for (const d of list) {
    const ago_ = ago(recency(d));
    const sub = d.driveOnly ? 'Opened ' + ago_ : (d.unsaved ? 'Edited ' + ago_ : 'Saved ' + ago_);
    const actions = [];
    if (docOpenId(d)) actions.push({ icon: 'share', tip: 'Share…', run: () => openShare(docOpenId(d), d.name) });
    actions.push({ icon: 'x', tip: 'Remove from Recent', run: async () => { await deleteDoc(d); refreshHome(); } });
    grid.appendChild(card({
      cover: d.cover, title: d.name, sub: sub + (d.pageCount ? ` · ${d.pageCount} p` : ''),
      badge: d.unsaved ? (d.fileId && d.autoDrive ? 'sync' : 'draft') : (d.fileId ? 'drive' : ''),
      actions, open: () => openRecent(d),
    }));
  }
  // files in Google Drive that aren't in Recent yet
  const sec = $('#driveSec'), dg = $('#driveGrid');
  if (!driveLive()) { sec.hidden = true; return; }
  sec.hidden = false;
  try {
    const files = (await DRV.listFiles('')).filter(f => !seen.has(f.id)).slice(0, 12);
    if (req !== homeReq) return;
    dg.replaceChildren();
    $('#driveEmpty').hidden = files.length > 0;
    for (const f of files) {
      const [kind] = kindOf(f.mime);
      dg.appendChild(card({
        icon: kind === 'image' ? 'image' : 'file', title: f.name, sub: 'Modified ' + ago(f.updated), badge: f.shared ? 'shared' : 'drive',
        actions: [{ icon: 'share', tip: 'Share…', run: () => openShare(f.id, f.name) }],
        open: () => openFromDrive(f.id),
      }));
    }
  } catch (e) { if (req === homeReq) { dg.replaceChildren(); $('#driveEmpty').hidden = false; $('#driveEmpty').textContent = 'Couldn’t load your Drive files: ' + errMsg(e); } }
}
async function openRecent(rec) {
  if (rec.driveOnly) { if (await ensureDrive()) openFromDrive(rec.openId); return; }
  await restoreDoc(rec);
}

/* ============================================================ sharing */
const ROLE_LABEL = { reader: 'Viewer', commenter: 'Commenter', writer: 'Editor', owner: 'Owner', organizer: 'Organizer', fileOrganizer: 'Editor' };
let SH = null;   // { id, name, info }
async function startShare() {
  if (!S.fileId) {
    const ok = await confirmBox('Save to Google Drive first', 'Sharing works through Google Drive. Save a copy of this document there, then choose who can open it.', 'Save to Drive');
    if (!ok) return;
    await saveToDrive('copy');
    if (!S.fileId) return;
  }
  openShare(S.fileId, S.fileName);
}
async function openShare(id, name) {
  if (!(await ensureDrive())) return;
  SH = { id, name, info: null };
  $('#shareTitle').textContent = 'Share “' + name + '”';
  $('#shareEmails').value = ''; $('#shareMsg').value = '';
  openModal('shareModal'); renderShare();
  try { SH.info = await DRV.shareInfo(id); renderShare(); }
  catch (e) { $('#shareError').textContent = 'Couldn’t load sharing settings: ' + errMsg(e) + (HAS_GAS ? '' : ' (PDF Studio can only share files it created or that you opened with it.)'); renderShare(); }
}
function shareWorking(on) { $('#shareModal').classList.toggle('working', !!on); }
async function shareDo(fn, okMsg) {
  if (!SH) return;
  shareWorking(true); $('#shareError').textContent = '';
  try { await fn(); SH.info = await DRV.shareInfo(SH.id); if (okMsg) toast(okMsg); }
  catch (e) { $('#shareError').textContent = errMsg(e); }
  finally { shareWorking(false); renderShare(); }
}
function renderShare() {
  if (!SH) return;
  const info = SH.info, gen = info ? info.general : null;
  const status = $('#shareStatus');
  status.textContent = !info ? '' : gen.type === 'anyone' ? 'Public' : gen.type === 'domain' ? 'Organization' : 'Private';
  status.className = 'share-status ' + (!info ? '' : gen.type);
  // people
  const box = $('#sharePeople'); box.replaceChildren();
  if (!info) { box.innerHTML = '<div class="muted small pad">Loading…</div>'; }
  else {
    const people = info.people.slice().sort((a, b) => (a.role === 'owner' ? -1 : 0) - (b.role === 'owner' ? -1 : 0));
    if (!people.length) box.innerHTML = '<div class="muted small pad">Only you can open this right now.</div>';
    for (const p of people) {
      const row = document.createElement('div'); row.className = 'person';
      row.appendChild(avatar({ name: p.name, photo: p.photo }, 30));
      const t = document.createElement('div'); t.className = 'ptxt'; t.innerHTML = '<b></b><span></span>';
      t.firstChild.textContent = p.name; t.lastChild.textContent = p.email; row.appendChild(t);
      if (p.role === 'owner' || !info.canShare) { const l = document.createElement('span'); l.className = 'prole'; l.textContent = ROLE_LABEL[p.role] || p.role; row.appendChild(l); }
      else {
        const sel = document.createElement('select'); sel.className = 'prole-sel';
        for (const [v, l] of [['reader', 'Viewer'], ['commenter', 'Commenter'], ['writer', 'Editor']]) sel.add(new Option(l, v, false, v === p.role));
        sel.onchange = () => shareDo(() => DRV.shareUpdate(SH.id, p.id, sel.value), 'Access updated');
        row.appendChild(sel);
        const rm = document.createElement('button'); rm.className = 'prm'; rm.innerHTML = icon('x', 14); rm.dataset.tip = 'Remove access'; rm.setAttribute('aria-label', 'Remove access for ' + p.name);
        rm.onclick = () => shareDo(() => DRV.shareRemove(SH.id, p.id), 'Removed ' + p.name);
        row.appendChild(rm);
      }
      box.appendChild(row);
    }
  }
  // general access
  const domain = D.user && D.user.domain, workspace = domain && !/^(gmail|googlemail)\.com$/i.test(domain);
  const orgName = (gen && gen.domain) || domain;
  const opts = [
    { t: 'restricted', icon: 'lock', title: 'Private', sub: 'Only the people above can open it' },
    ...(workspace || (gen && gen.type === 'domain') ? [{ t: 'domain', icon: 'building', title: 'My organization', sub: 'Anyone at ' + orgName + ' with the link' }] : []),
    { t: 'anyone', icon: 'globe', title: 'Public', sub: 'Anyone on the internet with the link' },
  ];
  const g = $('#shareGeneral'); g.replaceChildren(); g.style.setProperty('--n', opts.length);
  for (const o of opts) {
    const b = document.createElement('button'); b.className = 'gen' + (gen && gen.type === o.t ? ' on' : ''); b.disabled = !info || !info.canShare;
    b.innerHTML = icon(o.icon, 20) + '<b></b><span></span>' + (gen && gen.type === o.t ? '<i class="tick">' + icon('check', 13) + '</i>' : '');
    b.querySelector('b').textContent = o.title; b.querySelector('span').textContent = o.sub;
    b.onclick = async () => {
      if (!info || gen.type === o.t) return;
      if (o.t === 'anyone' && !(await confirmBox('Make this public?', 'Anyone on the internet who has the link will be able to open “' + SH.name + '”.', 'Make Public'))) return;
      const role = gen.type === 'restricted' ? 'reader' : gen.role;
      shareDo(() => DRV.shareGeneral(SH.id, { type: o.t, role, domain: domain || gen.domain }, gen),
        o.t === 'restricted' ? 'Now private' : o.t === 'domain' ? 'Shared with your organization' : 'Now public');
    };
    g.appendChild(b);
  }
  const rr = $('#shareGenRole'); rr.hidden = !gen || gen.type === 'restricted';
  if (gen && gen.type !== 'restricted') {
    $('#shareGenLabel').textContent = gen.type === 'anyone' ? 'Anyone with the link can' : 'Anyone at ' + orgName + ' can';
    $('#shareGenRoleSel').value = gen.role === 'writer' ? 'writer' : gen.role === 'commenter' ? 'commenter' : 'reader';
  }
  $('#shareNote').hidden = !(S.dirty && S.fileId === SH.id && !S.autoDrive);
  $('#shareCopy').disabled = !info; $('#shareSend').disabled = !info || !info.canShare;
  $('#shareEmails').disabled = !info || !info.canShare;
  if (info && !info.canShare) $('#shareError').textContent = 'You don’t have permission to change sharing on this file.';
}
function initShare() {
  $('#shareSend').onclick = () => {
    const emails = $('#shareEmails').value.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
    if (!emails.length) { toast('Type one or more email addresses'); return; }
    const bad = emails.filter(e => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
    if (bad.length) { $('#shareError').textContent = 'That doesn’t look like an email address: ' + bad[0]; return; }
    const o = { emails, role: $('#shareRole').value, notify: $('#shareNotify').checked, message: $('#shareMsg').value.trim() };
    shareDo(async () => {
      const errs = await DRV.shareAdd(SH.id, o);
      if (errs.length) throw new Error(errs.join(' · '));
      $('#shareEmails').value = '';
    }, 'Shared with ' + emails.length + (emails.length === 1 ? ' person' : ' people'));
  };
  $('#shareEmails').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#shareSend').click(); } });
  $('#shareNotify').onchange = e => { $('#shareMsg').hidden = !e.target.checked; };
  $('#shareGenRoleSel').onchange = e => {
    const gen = SH && SH.info && SH.info.general; if (!gen) return;
    shareDo(() => DRV.shareGeneral(SH.id, { type: gen.type, role: e.target.value, domain: gen.domain }, gen), 'Link access updated');
  };
  $('#shareCopy').onclick = async () => {
    const link = SH && SH.info && SH.info.link; if (!link) return;
    try { await navigator.clipboard.writeText(link); toast('Link copied'); }
    catch (e) { await ask('Copy link', link); }
  };
  $('#shareDone').onclick = () => closeModal('shareModal');
}

/* =================================================================== find */
const textCache = new Map();
let lastFind = { q: '', i: -1 };
async function pageText(p) {
  if (!p.src) return '';
  const k = p.src + ':' + p.idx;
  if (textCache.has(k)) return textCache.get(k);
  const pg = await S.sources[p.src].doc.getPage(p.idx + 1);
  const tc = await pg.getTextContent();
  const s = tc.items.map(it => it.str).join(' ').replace(/\s+/g, ' ').toLowerCase();
  textCache.set(k, s); return s;
}
async function findNext() {
  const q = $('#findInput').value.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!q || !S.pages.length) return;
  const start = q === lastFind.q ? lastFind.i + 1 : currentPageIndex();
  for (let k = 0; k < S.pages.length; k++) {
    const i = (start + k) % S.pages.length;
    if ((await pageText(S.pages[i])).includes(q)) {
      lastFind = { q, i }; scrollToPage(i, true);
      toast(`Found on page ${i + 1}`); return;
    }
  }
  lastFind = { q, i: -1 }; toast('No matches');
}

/* ============================================================== images */
function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('Could not read that file'));
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => reject(new Error('Unsupported image'));
      im.onload = () => {
        const max = 1800, k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
        const w = Math.round(im.naturalWidth * k), h = Math.round(im.naturalHeight * k);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(im, 0, 0, w, h);
        const jpg = /jpe?g/i.test(file.type);
        resolve({ src: c.toDataURL(jpg ? 'image/jpeg' : 'image/png', 0.92), w, h });
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
function registerImage(src) { const key = 'img' + uid(); S.images[key] = src; return key; }
function fitSize(w, h, max) { const k = Math.min(1, max / Math.max(w, h)); return { w: w * k, h: h * k }; }
async function imageFromFile(file) {
  const r = await loadImageFile(file);
  const s = fitSize(r.w, r.h, 260);
  return { img: registerImage(r.src), w: s.w, h: s.h };
}

/* =========================================================== signatures */
const SIG_KEY = 'pdfstudio.signatures';
const sig = { ctx: null, drawing: false, last: null, color: '#111827', mode: 'draw', dirty: false };
function loadSigs() { try { return JSON.parse(localStorage.getItem(SIG_KEY) || '[]'); } catch (e) { return []; } }
function saveSigs(list) { try { localStorage.setItem(SIG_KEY, JSON.stringify(list.slice(0, 6))); } catch (e) {} }
function initSignaturePad() {
  const c = $('#sigPad'); c.width = 1200; c.height = 440;
  sig.ctx = c.getContext('2d');
  const pt = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
  c.addEventListener('pointerdown', e => {
    if (sig.mode !== 'draw') return;
    c.setPointerCapture(e.pointerId); sig.drawing = true; sig.last = pt(e);
  });
  c.addEventListener('pointermove', e => {
    if (!sig.drawing) return;
    const evs = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
    (evs.length ? evs : [e]).forEach(ev => {
      const p = pt(ev), ctx = sig.ctx;
      const pressure = ev.pointerType === 'pen' && ev.pressure ? ev.pressure : 0.5;
      ctx.strokeStyle = sig.color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineWidth = 3 + pressure * 6;
      ctx.beginPath(); ctx.moveTo(sig.last[0], sig.last[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
      sig.last = p; sig.dirty = true;
    });
  });
  const up = () => { sig.drawing = false; };
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
}
function clearSig() { sig.ctx.clearRect(0, 0, 1200, 440); sig.dirty = false; }
async function drawTypedSig() {
  clearSig();
  const text = $('#sigText').value.trim(); if (!text) return;
  const fam = $('#sigFont').value;
  try { await document.fonts.load(`100px "${fam}"`); } catch (e) {}
  const ctx = sig.ctx; let size = 170;
  ctx.font = `${size}px "${fam}", cursive`;
  const w = ctx.measureText(text).width;
  if (w > 1100) size = size * 1100 / w;
  ctx.font = `${size}px "${fam}", cursive`;
  ctx.fillStyle = sig.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 600, 230); sig.dirty = true;
}
function trimmedSig() {
  const c = $('#sigPad'), d = sig.ctx.getImageData(0, 0, c.width, c.height).data;
  let x1 = c.width, y1 = c.height, x2 = 0, y2 = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
    if (d[(y * c.width + x) * 4 + 3] > 8) { if (x < x1) x1 = x; if (x > x2) x2 = x; if (y < y1) y1 = y; if (y > y2) y2 = y; }
  }
  if (x2 <= x1 || y2 <= y1) return null;
  const pad = 10, w = x2 - x1 + pad * 2, h = y2 - y1 + pad * 2;
  const o = document.createElement('canvas'); o.width = w; o.height = h;
  o.getContext('2d').drawImage(c, x1 - pad, y1 - pad, w, h, 0, 0, w, h);
  return { src: o.toDataURL('image/png'), w, h };
}
function useSignature(src, w, h) {
  // default size: 190pt wide, but never taller than 80pt
  let dw = 190, dh = 190 * h / w;
  if (dh > 80) { dw = dw * 80 / dh; dh = 80; }
  S.pending = { img: registerImage(src), w: dw, h: dh };
  closeModal('sigModal'); setTool('signature', true);
  toast('Click where you want to sign');
}
function renderSavedSigs() {
  const box = $('#sigSaved'); box.innerHTML = '';
  const list = loadSigs();
  if (!list.length) { box.innerHTML = '<span class="muted small">No saved signatures yet.</span>'; return; }
  list.forEach((s, i) => {
    const d = document.createElement('div'); d.className = 'sig-thumb'; d.title = 'Use this signature';
    d.innerHTML = '<img alt="signature"><button class="del" title="Remove">×</button>';
    d.querySelector('img').src = s.src;
    d.onclick = () => useSignature(s.src, s.w, s.h);
    d.querySelector('.del').onclick = ev => { ev.stopPropagation(); const l = loadSigs(); l.splice(i, 1); saveSigs(l); renderSavedSigs(); };
    box.appendChild(d);
  });
}
function openSignature() { clearSig(); $('#sigText').value = ''; renderSavedSigs(); openModal('sigModal'); }

/* =============================================================== stamps */
function stampPresets() {
  return [
    ['APPROVED', '#16a34a'], ['REJECTED', '#dc2626'], ['DRAFT', '#6b7280'],
    ['CONFIDENTIAL', '#dc2626'], ['PAID', '#16a34a'], ['FINAL', '#2563eb'],
    ['RECEIVED', '#2563eb'], ['VOID', '#dc2626'], ['SIGN HERE', '#f97316'],
    ['REVIEWED', '#7c3aed'], ['URGENT', '#dc2626'], [new Date().toLocaleDateString(), '#2563eb'],
  ];
}
function openStamps() {
  const g = $('#stampGrid'); g.innerHTML = '';
  stampPresets().forEach(([text, color]) => {
    const b = document.createElement('button');
    b.className = 'stamp-btn'; b.textContent = text; b.style.color = color;
    b.onclick = () => chooseStamp(text, color);
    g.appendChild(b);
  });
  openModal('stampModal');
}
function chooseStamp(text, color) {
  S.pendingStamp = { text: text.toUpperCase(), color, size: 22 };
  closeModal('stampModal'); setTool('stamp', true);
  toast('Click on a page to place the stamp');
}

/* ================================================================ menus */
function closeMenus() { $$('.menu.show').forEach(m => m.classList.remove('show')); }
function toggleMenu(btn) {
  const m = $('#' + btn.dataset.menu), wasOpen = m.classList.contains('show');
  closeMenus(); if (wasOpen) return;
  const r = btn.getBoundingClientRect();
  m.classList.add('show');
  m.style.top = r.bottom + 6 + 'px';
  m.style.left = Math.max(8, Math.min(window.innerWidth - m.offsetWidth - 8, r.right - m.offsetWidth)) + 'px';
}

/* ================================================================ wiring */
function buildUI() {
  hydrateIcons();
  // menus live outside the frosted toolbar so they aren't clipped by it
  $$('.menu').forEach(m => document.body.appendChild(m));
  // shortcut list: one physical-looking key per token (⌘ ⇧ Z on Mac)
  const MACKEY = { Ctrl: '⌘', Shift: '⇧', Alt: '⌥' };
  $$('#helpModal kbd').forEach(k => {
    const wrap = document.createElement('span'); wrap.className = 'keys';
    k.textContent.trim().split(/\s+/).forEach(t => {
      const key = document.createElement('kbd'); key.textContent = IS_MAC ? (MACKEY[t] || kbdText(t)) : kbdText(t); wrap.appendChild(key);
    });
    k.replaceWith(wrap);
  });
  const nav = $('#tools');
  TOOLS.forEach(t => {
    if (t === '-') { const sp = document.createElement('div'); sp.className = 'sep'; nav.appendChild(sp); return; }
    const b = document.createElement('button');
    b.className = 'tool'; b.dataset.tool = t.id; b.innerHTML = icon(t.icon, 18);
    b.dataset.tip = `${t.name}|${t.key.toUpperCase()}`;
    b.onclick = () => setTool(t.id);
    nav.appendChild(b);
  });
  const sw = $('#swatches');
  SWATCHES.forEach(c => {
    const b = document.createElement('button'); b.className = 'sw'; b.dataset.c = c; b.style.background = c; b.title = c;
    b.onclick = () => applyStyle('color', c); sw.appendChild(b);
  });

  $('#color').addEventListener('input', e => applyStyle('color', e.target.value));
  $('#width').addEventListener('input', e => applyStyle('width', +e.target.value));
  $('#opacity').addEventListener('input', e => applyStyle('opacity', e.target.value / 100));
  $('#fill').addEventListener('change', e => applyStyle('fill', e.target.checked));
  $('#fillColor').addEventListener('input', e => applyStyle('fillColor', e.target.value));
  $('#font').addEventListener('change', e => applyStyle('font', e.target.value));
  $('#fontSize').addEventListener('input', e => { const v = +e.target.value; if (v >= 4 && v <= 300) applyStyle('size', v); });
  $('#bold').onclick = () => applyStyle('bold', !S.style.bold);
  $('#italic').onclick = () => applyStyle('italic', !S.style.italic);

  // file opening
  $('#btnOpenDrive').onclick = async () => { if (await confirmDiscard()) openDrivePicker('open'); };
  $('#wDrive').onclick = async () => { if (await confirmDiscard()) openDrivePicker('open'); };
  $('#btnHome').onclick = goHome;
  $('#homeBack').onclick = hideHome;
  $('#btnShare').onclick = startShare;
  $('#autoDriveItem').onclick = () => {
    closeMenus();
    if (!S.fileId) { toast('Save to Drive first. After that, edits are kept up to date automatically.', 4500); return; }
    setAutoDrive(!S.autoDrive); toast(S.autoDrive ? 'Auto-save to Drive is on' : 'Auto-save to Drive is off');
  };
  $('#acctSignOut').onclick = () => { closeMenus(); signOut(); };
  $('#acctSignIn').onclick = () => { closeMenus(); ensureDrive(); };
  $('#acctHome').onclick = () => { closeMenus(); goHome(); };
  $('#setupOrigin').textContent = location.origin;
  $('#setupCopy').onclick = () => { try { navigator.clipboard.writeText(location.origin); toast('Copied'); } catch (e) {} };
  initShare();
  const local = async mode => { if (mode === 'open' && !(await confirmDiscard())) return; S.pdfMode = mode; $('#pdfInput').click(); };
  $('#btnOpenLocal').onclick = () => local('open');
  $('#wLocal').onclick = () => local('open');
  $('#wBlank').onclick = openBlank;
  $$('[data-insert]').forEach(b => b.onclick = () => { closeMenus(); b.dataset.insert === 'drive' ? openDrivePicker('insert') : local('insert'); });
  $('#pdfInput').addEventListener('change', e => {
    const files = Array.from(e.target.files || []); e.target.value = '';
    if (files.length) openFiles(files, S.pdfMode);
  });
  $('#imgInput').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { S.pending = await imageFromFile(f); setTool('image', true); toast('Click on a page to place the image'); }
    catch (err) { toast(errMsg(err)); }
  });
  let dsT = 0;
  $$('#driveTabs button').forEach(b => b.onclick = () => {
    S.driveFilter = b.dataset.f; $$('#driveTabs button').forEach(x => x.classList.toggle('on', x === b)); loadDriveList($('#driveSearch').value.trim());
  });
  $('#driveSearch').addEventListener('input', e => { clearTimeout(dsT); dsT = setTimeout(() => loadDriveList(e.target.value.trim()), 350); });

  // toolbar
  $('#btnUndo').onclick = undo; $('#btnRedo').onclick = redo;
  $('#btnZoomIn').onclick = () => setZoom(S.zoom * 1.2);
  $('#btnZoomOut').onclick = () => setZoom(S.zoom / 1.2);
  $('#btnFit').onclick = () => setZoom(fitZoom());
  $('#zoomVal').onclick = () => setZoom(1);
  $('#pageNum').addEventListener('change', e => scrollToPage(+e.target.value - 1, true));
  $('#btnFind').onclick = findNext;
  $('#btnHlAll').onclick = highlightAll;
  $$('[data-hl]').forEach(b => b.onclick = () => setHlMode(b.dataset.hl));
  $('#findInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); findNext(); } });
  $('#btnDownload').onclick = download;
  $('#btnPrint').onclick = printPdf;
  $('#btnPng').onclick = exportPagePng;
  $('#btnHelp').onclick = () => openModal('helpModal');
  $$('[data-menu]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); toggleMenu(b); }));
  $$('[data-save]').forEach(b => b.onclick = () => { closeMenus(); saveToDrive(b.dataset.save); });
  $('#docName').onclick = async () => {
    const n = await ask('Rename document', S.fileName); if (n === null || !n.trim()) return;
    S.fileName = /\.pdf$/i.test(n.trim()) ? n.trim() : n.trim() + '.pdf'; $('#docName').textContent = S.fileName;
  };
  document.addEventListener('click', e => {
    if (!e.target.closest('.menu') && !e.target.closest('[data-menu]')) closeMenus();
    const c = e.target.closest('[data-close]'); if (c) closeModal(c.dataset.close);
  });
  $$('.modal').forEach(m => m.addEventListener('pointerdown', e => {
    if (e.target === m && m.id !== 'askModal') closeModal(m.id);
  }));

  viewer.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    pageAction(b.dataset.act, b.closest('.page-wrap').dataset.uid);
  });
  let scrollRaf = 0;
  viewer.addEventListener('scroll', () => { cancelAnimationFrame(scrollRaf); scrollRaf = requestAnimationFrame(updatePageInfo); });

  // signature modal
  initSignaturePad();
  $$('[data-sigtab]').forEach(b => b.onclick = () => {
    sig.mode = b.dataset.sigtab;
    $$('[data-sigtab]').forEach(x => x.classList.toggle('active', x === b));
    $('#sigTypeRow').hidden = sig.mode !== 'type';
    clearSig(); if (sig.mode === 'type') { drawTypedSig(); $('#sigText').focus(); }
  });
  $('#sigText').addEventListener('input', drawTypedSig);
  $('#sigFont').addEventListener('change', drawTypedSig);
  $$('.sc').forEach(b => b.onclick = () => {
    sig.color = b.dataset.sc; $$('.sc').forEach(x => x.classList.toggle('active', x === b));
    if (sig.mode === 'type') drawTypedSig();
  });
  $('#sigClear').onclick = () => { clearSig(); $('#sigText').value = ''; };
  $('#sigUse').onclick = () => {
    const t = trimmedSig(); if (!t) { toast('Draw or type a signature first'); return; }
    const list = loadSigs(); list.unshift(t); saveSigs(list);
    useSignature(t.src, t.w, t.h);
  };

  // stamps
  $('#stampCustom').onclick = () => {
    const t = $('#stampText').value.trim(); if (!t) { $('#stampText').focus(); return; }
    chooseStamp(t, $('#stampColor').value);
  };
  $('#stampText').addEventListener('keydown', e => { if (e.key === 'Enter') $('#stampCustom').click(); });
}

/* keyboard */
document.addEventListener('keydown', e => {
  const ae = document.activeElement;
  const typing = ae && (/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) || ae.isContentEditable);
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (mod && k === 's') {
    e.preventDefault();
    if (!S.pages.length) return;
    if (HAS_GAS) saveToDrive(S.fileId ? 'overwrite' : 'copy'); else download();
    return;
  }
  if (mod && k === 'o' && !$('.modal.show')) { e.preventDefault(); $('#btnOpenLocal').click(); return; }
  if (typing || $('.modal.show') || !S.pages.length) return;
  if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && k === 'y') { e.preventDefault(); redo(); return; }
  if (mod && (k === '=' || k === '+')) { e.preventDefault(); setZoom(S.zoom * 1.2); return; }
  if (mod && k === '-') { e.preventDefault(); setZoom(S.zoom / 1.2); return; }
  if (mod && k === '0') { e.preventDefault(); setZoom(fitZoom()); return; }
  if (mod && k === 'd') { e.preventDefault(); duplicateSelected(); return; }
  const inThumbs = ae && ae.id === 'thumbs';
  if (mod && k === 'a' && inThumbs) { e.preventDefault(); S.tsel = new Set(S.pages.map(p => p.uid)); refreshThumbSel(); return; }
  if (mod && k === 'c') { copySelected(); return; }
  if (mod && k === 'x') { if (selectedAnnot()) { e.preventDefault(); cutSelected(); } return; }
  if (mod && k === 'f') { e.preventDefault(); $('#findInput').focus(); return; }
  if (mod || e.altKey) return;
  if ((e.key === 'Delete' || e.key === 'Backspace') && inThumbs) { e.preventDefault(); bulk('del'); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedAnnot()) { e.preventDefault(); deleteSelected(); } return; }
  if (e.key === 'Escape') {
    closeMenus();
    select(null); S.pending = null; S.pendingStamp = null;
    if (['image', 'signature', 'stamp'].includes(S.tool)) setTool('select', true);
    return;
  }
  const arrows = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] }[k];
  if (arrows) { const m = e.shiftKey ? 10 : 1; if (nudge(arrows[0] * m, arrows[1] * m)) e.preventDefault(); return; }
  if (e.key === ' ') { e.preventDefault(); if (!S.space) { S.space = true; viewer.classList.add('space'); } return; }
  const t = TOOLS.find(x => x !== '-' && x.key === k);
  if (t) setTool(t.id);
});
document.addEventListener('keyup', e => { if (e.key === ' ') { S.space = false; viewer.classList.remove('space'); } });

/* paste: images from clipboard, or copied annotations */
document.addEventListener('paste', async e => {
  const ae = document.activeElement;
  if (ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName)) return;
  if (!S.pages.length || $('.modal.show')) return;
  const p = S.pages[currentPageIndex()];
  const item = Array.from((e.clipboardData && e.clipboardData.items) || []).find(i => i.type.startsWith('image/'));
  if (item) {
    e.preventDefault();
    try {
      const img = await imageFromFile(item.getAsFile());
      const d = dims(p), vr = viewer.getBoundingClientRect(), r = p._el.page.getBoundingClientRect();
      const cy = clamp((vr.top + vr.height / 2 - r.top) / S.zoom, img.h / 2, d.h - img.h / 2);
      placeImage(p, d.w / 2, cy, img); setTool('select', true);
    } catch (err) { toast(errMsg(err)); }
    return;
  }
  if (S.clip) {
    e.preventDefault();
    const lp = S.lastPtr && findPage(S.lastPtr.page);
    if (lp && lp._live) pasteClip(lp, S.lastPtr.pt[0], S.lastPtr.pt[1]);
    else pasteClip((S.sel && findPage(S.sel.page)) || p);
  }
});

/* drag & drop */
let dragDepth = 0;
document.addEventListener('dragenter', e => { e.preventDefault(); dragDepth++; document.body.classList.add('dragging'); });
document.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; document.body.classList.remove('dragging'); } });
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', async e => {
  e.preventDefault(); dragDepth = 0; document.body.classList.remove('dragging');
  const files = Array.from(e.dataTransfer.files || []);
  if (!S.pages.length || document.body.classList.contains('show-home')) { if (files.length) openFiles(files, 'open'); return; }
  const docs = files.filter(f => !f.type.startsWith('image/'));
  if (docs.length) await openFiles(docs, 'insert');
  for (const f of files) {
    if (f.type.startsWith('image/')) {
      const pageEl = e.target.closest && e.target.closest('.page');
      const p = pageEl ? pageEl.__page : S.pages[currentPageIndex()];
      try {
        const img = await imageFromFile(f);
        const [x, y] = pageEl ? pagePoint(e, p) : [dims(p).w / 2, dims(p).h / 2];
        placeImage(p, x, y, img); setTool('select', true);
      } catch (err) { toast(errMsg(err)); }
    }
  }
});

window.addEventListener('beforeunload', e => { if (S.dirty && !(S.draftOk && S.draftAt && S.draftAt >= (S.editedAt || 0))) { e.preventDefault(); e.returnValue = ''; } });
window.addEventListener('resize', () => closeMenus());

/* ================================================================== start */
buildUI();
initThumbs();
viewer.addEventListener('pointerleave', () => { S.lastPtr = null; });
setTool('select', true);
updateUndoUI(); updateSaveUI();
window.__PDFSTUDIO_READY = true;
initGasUser();
/* Website: stay signed in across visits. Show the remembered account right away, then quietly get a fresh
   Google token (tokens last about an hour). Browsers only allow Google's small pop-up after a click, so if the
   quiet attempt is blocked we retry on the first click or key press. */
let silentBusy = false;
async function silentSignIn() {
  if (HAS_GAS || !CFG.CLIENT_ID || !D.last || silentBusy || driveLive()) return;
  silentBusy = true;
  try {
    takeToken(await requestToken('none'));
    D.user = await DRV.me();
    D.last = { name: D.user.name, email: D.user.email, photo: D.user.photo };
    try { localStorage.setItem('pdfstudio-user', JSON.stringify(D.last)); } catch (e) {}
    updateAccountUI(); refreshHomeSoon();
  } catch (e) { /* needs a click first; the listener below retries */ }
  silentBusy = false;
}
if (!HAS_GAS && D.last && CFG.CLIENT_ID) {
  D.user = D.last; D.token = null;
  setTimeout(silentSignIn, 600);
  ['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, () => { if (!driveLive()) silentSignIn(); }, { capture: true }));
  setInterval(() => { if (D.user && D.token && Date.now() > D.exp - 120000) { D.token = null; } }, 60000);
}
updateAccountUI();
if (window.INITIAL_FILE_ID && HAS_GAS) openFromDrive(window.INITIAL_FILE_ID); else refreshHome();
pruneDocs();

})();
