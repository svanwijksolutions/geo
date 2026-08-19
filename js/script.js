/* ==========================================================================
   Geo B.V. site-script
   header/footer inladen, menu, taalswitcher, tellers, formulier
   ========================================================================== */

(function () {
  'use strict';

  var SUPPORTED = ['nl', 'en'];
  var DEFAULT_LANG = 'nl';
  var STORE_LANG = 'geo-lang';
  var STORE_COOKIE = 'geo-cookie-ok';
  var dictionaries = {};
  var currentLang = DEFAULT_LANG;

  var FLAGS = {
    nl: '<svg viewBox="0 0 9 6" aria-hidden="true" focusable="false">' +
        '<rect width="9" height="6" fill="#fff"></rect>' +
        '<rect width="9" height="2" y="0" fill="#ae1c28"></rect>' +
        '<rect width="9" height="2" y="4" fill="#21468b"></rect>' +
        '</svg>',
    en: '<svg viewBox="0 0 60 30" aria-hidden="true" focusable="false">' +
        '<rect width="60" height="30" fill="#012169"></rect>' +
        '<path d="M0 0 60 30 M60 0 0 30" stroke="#fff" stroke-width="6"></path>' +
        '<path d="M0 0 60 30 M60 0 0 30" stroke="#c8102e" stroke-width="3"></path>' +
        '<path d="M30 0V30 M0 15H60" stroke="#fff" stroke-width="10"></path>' +
        '<path d="M30 0V30 M0 15H60" stroke="#c8102e" stroke-width="6"></path>' +
        '</svg>'
  };

  /* ---------- kleine helpers ---------- */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function lookup(dict, path) {
    var parts = path.split('.');
    var node = dict;
    for (var i = 0; i < parts.length; i++) {
      if (node === null || typeof node !== 'object' || !(parts[i] in node)) return null;
      node = node[parts[i]];
    }
    return typeof node === 'string' ? node : null;
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ---------- header en footer inladen ---------- */

  function injectPartial(url, targetId) {
    var host = document.getElementById(targetId);
    if (!host) return Promise.resolve();
    return fetch(url)
      .then(function (res) { return res.ok ? res.text() : ''; })
      .then(function (html) { if (html) host.innerHTML = html; })
      .catch(function () { /* stil falen, pagina blijft leesbaar */ });
  }

  /* ---------- navigatie ---------- */

  function markCurrentPage() {
    var page = document.body.getAttribute('data-page');
    if (!page) return;
    $$('[data-nav]').forEach(function (link) {
      if (link.getAttribute('data-nav') === page) {
        link.classList.add('is-current');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function setupMenu() {
    var toggle = $('.menu-toggle');
    var menu = $('.mobile-menu');
    if (!toggle || !menu) return;

    function openMenu() {
      menu.classList.add('open');
      document.body.classList.add('menu-open');
      document.body.style.overflow = 'hidden';
      toggle.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
      menu.classList.remove('open');
      document.body.classList.remove('menu-open');
      document.body.style.overflow = '';
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      if (menu.classList.contains('open')) { closeMenu(); } else { openMenu(); }
    });

    $$('.mobile-menu a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 992 && menu.classList.contains('open')) closeMenu();
    });
  }

  function setupScrolledHeader() {
    var header = $('.site-header');
    if (!header) return;
    var ticking = false;
    function update() {
      if (window.pageYOffset > 24) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- taal ---------- */

  function pickInitialLang() {
    var fromQuery = null;
    try {
      fromQuery = new URLSearchParams(window.location.search).get('lang');
    } catch (e) { fromQuery = null; }
    if (fromQuery && SUPPORTED.indexOf(fromQuery) !== -1) return fromQuery;

    var stored = null;
    try { stored = localStorage.getItem(STORE_LANG); } catch (e) { stored = null; }
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;

    var nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (nav.indexOf('nl') === 0) return 'nl';
    if (nav.indexOf('en') === 0) return 'en';
    return DEFAULT_LANG;
  }

  function loadDictionary(lang) {
    if (dictionaries[lang]) return Promise.resolve(dictionaries[lang]);
    return fetch('i18n/' + lang + '.json')
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (json) {
        if (json) dictionaries[lang] = json;
        return json;
      })
      .catch(function () { return null; });
  }

  function paintFlags() {
    $$('[data-flag]').forEach(function (el) {
      var code = el.getAttribute('data-flag');
      if (FLAGS[code] && !el.firstChild) el.innerHTML = FLAGS[code];
    });
  }

  function applyDictionary(dict) {
    if (!dict) return;

    $$('[data-i18n]').forEach(function (el) {
      var value = lookup(dict, el.getAttribute('data-i18n'));
      if (value !== null) el.textContent = value;
    });

    $$('[data-i18n-html]').forEach(function (el) {
      var value = lookup(dict, el.getAttribute('data-i18n-html'));
      if (value !== null) el.innerHTML = value;
    });

    $$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        var bits = pair.split(':');
        if (bits.length !== 2) return;
        var value = lookup(dict, bits[1].trim());
        if (value !== null) el.setAttribute(bits[0].trim(), value);
      });
    });

    var page = document.body.getAttribute('data-page');
    if (page) {
      var title = lookup(dict, 'meta.' + page + '.title');
      var desc = lookup(dict, 'meta.' + page + '.desc');
      if (title) document.title = title;
      var metaDesc = $('meta[name="description"]');
      if (desc && metaDesc) metaDesc.setAttribute('content', desc);
    }
  }

  function updateLangUI(lang) {
    var code = $('.lang-code');
    if (code) code.textContent = lang.toUpperCase();

    var currentFlag = $('.lang-current .lang-flag');
    if (currentFlag && FLAGS[lang]) {
      currentFlag.setAttribute('data-flag', lang);
      currentFlag.innerHTML = FLAGS[lang];
    }

    $$('[data-lang]').forEach(function (btn) {
      btn.setAttribute('aria-checked', btn.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
  }

  function setLanguage(lang, persist) {
    if (SUPPORTED.indexOf(lang) === -1) lang = DEFAULT_LANG;
    currentLang = lang;
    document.documentElement.setAttribute('lang', lang);
    if (persist) {
      try { localStorage.setItem(STORE_LANG, lang); } catch (e) { /* niets */ }
    }
    updateLangUI(lang);
    return loadDictionary(lang).then(applyDictionary);
  }

  function setupLangSwitch() {
    var wrap = $('.lang-switch');
    if (wrap) {
      var button = $('.lang-current', wrap);
      button.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = wrap.classList.toggle('open');
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      document.addEventListener('click', function (e) {
        if (!wrap.contains(e.target)) {
          wrap.classList.remove('open');
          button.setAttribute('aria-expanded', 'false');
        }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
          wrap.classList.remove('open');
          button.setAttribute('aria-expanded', 'false');
        }
      });
    }

    $$('[data-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setLanguage(btn.getAttribute('data-lang'), true);
        if (wrap) {
          wrap.classList.remove('open');
          var b = $('.lang-current', wrap);
          if (b) b.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  /* ---------- tellers ---------- */

  function runCounters() {
    var nodes = $$('[data-count]');
    if (!nodes.length) return;

    nodes.forEach(function (node) {
      var target = parseInt(node.getAttribute('data-count'), 10);
      if (isNaN(target)) return;
      var valueEl = node.querySelector('.value') || node;

      if (reducedMotion()) { valueEl.textContent = String(target); return; }

      var duration = 1400;
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        valueEl.textContent = String(Math.round(target * eased));
        if (progress < 1) window.requestAnimationFrame(step);
      }
      valueEl.textContent = '0';
      window.requestAnimationFrame(step);
    });
  }

  /* ---------- veilig scroll-reveal ---------- */

  function setupReveal() {
    var items = $$('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window) || reducedMotion()) {
      items.forEach(function (el) { el.classList.add('in-view'); });
      return;
    }

    document.body.classList.add('js-motion');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    items.forEach(function (el) { observer.observe(el); });

    // Vangnet: na 3,5 seconde is alles hoe dan ook zichtbaar.
    window.setTimeout(function () {
      $$('.reveal').forEach(function (el) { el.classList.add('in-view'); });
    }, 3500);
  }

  /* ---------- cookiemelding ---------- */

  function setupCookieBar() {
    var bar = $('.cookiebar');
    if (!bar) return;
    var accepted = null;
    try { accepted = localStorage.getItem(STORE_COOKIE); } catch (e) { accepted = null; }
    if (accepted === 'yes') return;

    window.setTimeout(function () { bar.classList.add('show'); }, 900);

    var button = $('.cookiebar button', bar) || bar.querySelector('button');
    if (button) {
      button.addEventListener('click', function () {
        bar.classList.remove('show');
        try { localStorage.setItem(STORE_COOKIE, 'yes'); } catch (e) { /* niets */ }
      });
    }
  }

  /* ---------- contactformulier (demo, geen verzending) ---------- */

  function setupForm() {
    var form = $('#contact-form');
    if (!form) return;
    var status = $('#form-status');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot: een ingevuld verborgen veld betekent een bot, stil negeren.
      var honey = form.querySelector('input[name="bedrijfsnaam-controle"]');
      if (honey && honey.value.trim() !== '') return;

      // Clientside-validatie van de verplichte velden blijft actief.
      if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
        if (typeof form.reportValidity === 'function') form.reportValidity();
        return;
      }

      // In de demo verstuurt het formulier niets. Toon alleen een bevestiging in beeld.
      if (status) {
        status.classList.add('show');
        if (typeof status.scrollIntoView === 'function') {
          status.scrollIntoView({ block: 'nearest' });
        }
      }
      form.reset();
    });
  }

  /* ---------- jaartal in de footer ---------- */

  function setYear() {
    var year = String(new Date().getFullYear());
    $$('.js-year').forEach(function (el) { el.textContent = year; });
  }

  /* ---------- start ---------- */

  function boot() {
    Promise.all([
      injectPartial('components/header.html', 'header-placeholder'),
      injectPartial('components/footer.html', 'footer-placeholder')
    ]).then(function () {
      paintFlags();
      markCurrentPage();
      setupMenu();
      setupScrolledHeader();
      setupLangSwitch();
      setYear();
      setupCookieBar();
      setupForm();
      setupReveal();
      runCounters();
      return setLanguage(pickInitialLang(), false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
