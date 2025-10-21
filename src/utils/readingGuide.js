// src/utils/readingGuide.js
// Módulo autónomo para guía de lectura / lector de voz (no modifica el componente)
// Se engancha al botón .guide-btn si existe

(function initReadingGuide() {
  if (typeof window === 'undefined') return;

  const STORAGE_KEY = 'fp_reading_settings';
  const DEFAULTS = { rate: 1, pitch: 1, voiceURI: null, highlightClass: 'reading-highlight' };

  function supportsSpeech() {
    return 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? Object.assign({}, DEFAULTS, JSON.parse(raw)) : Object.assign({}, DEFAULTS);
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function saveSettings(s) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) { /* noop */ }
  }

  const settings = loadSettings();
  let utterQueue = [];
  let isReading = false;
  let currentNode = null;
  let cancelOnEnd = false;

  // util: extrae texto limpio de un node (sin scripts, sin nav si quieres)
  function textFromNode(node) {
    if (!node) return '';
    // preferir elementos de contenido principal si existen
    return node.innerText || node.textContent || '';
  }

  // Divide en frases (simple) para poder resaltar por segmento
  function chunkText(text) {
    // split by sentence-ending punctuation, keep punctuation
    const sentences = text
      .replace(/\r?\n+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);
    return sentences.length ? sentences : [text];
  }

  function createUtter(text, opts = {}) {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = opts.rate || settings.rate;
    u.pitch = opts.pitch || settings.pitch;
    if (opts.voiceURI || settings.voiceURI) {
      const vURI = opts.voiceURI || settings.voiceURI;
      const voice = window.speechSynthesis.getVoices().find(v => v && v.voiceURI === vURI);
      if (voice) u.voice = voice;
    }
    u.lang = opts.lang || document.documentElement.lang || 'es-ES';
    return u;
  }

  function highlightNodeRange(node, textChunk) {
    // estrategia simple: envolver la primera ocurrencia del chunk en un span dentro del node
    // guardamos el original para restaurar después
    if (!node || !textChunk) return null;
    const inner = node.innerHTML;
    try {
      // escapar texto para regex
      const esc = textChunk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(esc, 'i');
      if (!re.test(inner)) return null;
      const replaced = inner.replace(re, `<span class="${settings.highlightClass}">$&</span>`);
      node.__reading_original = inner;
      node.innerHTML = replaced;
      return node.querySelector(`.${settings.highlightClass}`);
    } catch (e) {
      return null;
    }
  }

  function clearHighlight(node) {
    if (!node) return;
    // restaurar original si existe
    const root = node.__reading_original ? node : document.body;
    if (node.__reading_original) {
      node.innerHTML = node.__reading_original;
      delete node.__reading_original;
      return;
    }
    // fallback: quitar spans de la clase highlight en subtree
    const spans = root.querySelectorAll(`.${settings.highlightClass}`);
    spans.forEach(s => {
      const parent = s.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(s.textContent), s);
      parent.normalize?.();
    });
  }

  function speakChunksOf(node) {
    if (!supportsSpeech()) {
      alert('Tu navegador no soporta SpeechSynthesis. Usa un lector de pantalla o prueba en Chrome/Edge/Firefox con soporte.');
      return;
    }
    stopReading();
    const text = textFromNode(node) || '';
    if (!text.trim()) return;
    const chunks = chunkText(text);
    utterQueue = chunks.map(c => createUtter(c));
    currentNode = node;
    isReading = true;
    playQueue();
  }

  function playQueue() {
    if (!utterQueue || utterQueue.length === 0) {
      isReading = false;
      currentNode = null;
      return;
    }
    const u = utterQueue.shift();

    // highlight the chunk in node before speaking
    let highlightEl = highlightNodeRange(currentNode, u.text);
    // attach events
    u.onend = () => {
      if (highlightEl) {
        // restore the node (clear highlight)
        clearHighlight(currentNode);
        highlightEl = null;
      }
      if (cancelOnEnd) {
        cancelOnEnd = false;
        utterQueue = [];
        isReading = false;
        currentNode = null;
        return;
      }
      // small delay to allow smooth reading
      setTimeout(playQueue, 80);
    };
    u.onerror = () => {
      // on error, skip to next
      if (highlightEl) clearHighlight(currentNode);
      setTimeout(playQueue, 80);
    };

    // start
    window.speechSynthesis.speak(u);
  }

  function pauseReading() {
    if (!supportsSpeech()) return;
    window.speechSynthesis.pause();
  }

  function resumeReading() {
    if (!supportsSpeech()) return;
    window.speechSynthesis.resume();
  }

  function stopReading() {
    if (!supportsSpeech()) return;
    cancelOnEnd = true;
    window.speechSynthesis.cancel();
    // restore highlights
    if (currentNode) clearHighlight(currentNode);
    utterQueue = [];
    isReading = false;
    currentNode = null;
  }

  function readSelectionOrMain() {
    const sel = window.getSelection();
    let nodeToRead = null;
    if (sel && sel.toString().trim()) {
      // leer la selección: buscar el contenedor
      nodeToRead = sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentNode : sel.anchorNode) : null;
    } else {
      // heurística: busca main, article o el elemento con id 'root' -> body
      nodeToRead = document.querySelector('main, article, #root') || document.body;
    }
    if (nodeToRead) speakChunksOf(nodeToRead);
  }

  // UI helpers (opcional): crear un pequeño tooltip con controles (play/pause/stop)
  function createMiniControls() {
    // si ya existe, devolver
    if (document.getElementById('fp-reading-controls')) return;
    const wrap = document.createElement('div');
    wrap.id = 'fp-reading-controls';
    wrap.style.position = 'fixed';
    wrap.style.right = '16px';
    wrap.style.bottom = '16px';
    wrap.style.zIndex = 9999;
    wrap.style.display = 'flex';
    wrap.style.gap = '8px';
    wrap.style.alignItems = 'center';
    wrap.style.background = 'rgba(0,0,0,0.6)';
    wrap.style.color = '#fff';
    wrap.style.padding = '6px 8px';
    wrap.style.borderRadius = '8px';
    wrap.style.fontSize = '14px';

    const play = document.createElement('button'); play.textContent = '▶'; play.title = 'Leer/Continuar';
    const pause = document.createElement('button'); pause.textContent = '⏸'; pause.title = 'Pausar';
    const stop = document.createElement('button'); stop.textContent = '■'; stop.title = 'Detener';
    play.onclick = () => {
      if (!isReading) readSelectionOrMain();
      else resumeReading();
    };
    pause.onclick = pauseReading;
    stop.onclick = stopReading;

    wrap.appendChild(play); wrap.appendChild(pause); wrap.appendChild(stop);
    document.body.appendChild(wrap);
  }

  // conectar al botón .guide-btn si existe
  function attachToButton() {
    const btn = document.querySelector('.guide-btn, #guide-btn, .accessibility-dropdown .guide-btn');
    if (!btn) return;
    // toggle behaviour: si hay selección, leer selección; si no, leer main
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!supportsSpeech()) {
        alert('Lectura no disponible en este navegador.');
        return;
      }
      // if currently reading -> stop; else start
      if (isReading) {
        stopReading();
      } else {
        readSelectionOrMain();
      }
      createMiniControls();
    });
  }

  // expose a tiny API on window for debugging / controls
  window.FastPassReader = {
    readSelectionOrMain,
    stop: stopReading,
    pause: pauseReading,
    resume: resumeReading,
    settings,
    saveSettings: (s) => { Object.assign(settings, s); saveSettings(settings); }
  };

  // when voices are loaded, keep them available
  function ensureVoicesLoaded(cb) {
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length) return cb(voices);
    window.speechSynthesis.onvoiceschanged = () => cb(window.speechSynthesis.getVoices());
  }

  // init once DOM ready
  function domReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  domReady(() => {
    attachToButton();
    // optional: bind keyboard shortcut Alt+R to toggle read
    document.addEventListener('keydown', (ev) => {
      if (ev.altKey && (ev.key === 'r' || ev.key === 'R')) {
        ev.preventDefault();
        if (isReading) stopReading();
        else readSelectionOrMain();
      }
    });
    // pre-load voices for faster start
    ensureVoicesLoaded(() => { /* no-op for now */ });
  });
})();