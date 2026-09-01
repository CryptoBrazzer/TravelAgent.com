/* ==========================================================================
   ESCAPE! — AI Travel Agent
   Interaction layer: localisation, scroll storytelling, modals, consent
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var LS = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------------------------------------------------------------- i18n */
  var LANGS = ['ru', 'uk', 'en'];
  var HTML_LANG = { ru: 'ru', uk: 'uk', en: 'en' };
  var lang = 'ru';

  function detectLang() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q && LANGS.indexOf(q) > -1) return q;
    var stored = LS.get('escape.lang');
    if (stored && LANGS.indexOf(stored) > -1) return stored;
    var nav = (navigator.languages || [navigator.language || 'ru']).join(',').toLowerCase();
    if (/\buk\b|\buk-/.test(nav)) return 'uk';
    if (/\bru\b|\bru-/.test(nav)) return 'ru';
    if (/\ben\b|\ben-/.test(nav)) return 'en';
    return 'ru';
  }

  function t(key) {
    var d = window.I18N && window.I18N[lang];
    if (d && d[key] != null) return d[key];
    var f = window.I18N && window.I18N.ru;
    return (f && f[key] != null) ? f[key] : '';
  }

  function applyLang(next, announce) {
    if (LANGS.indexOf(next) < 0) next = 'ru';
    lang = next;
    LS.set('escape.lang', lang);
    document.documentElement.lang = HTML_LANG[lang];

    $$('[data-i18n]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n'));
      if (v) el.textContent = v;
    });
    $$('[data-i18n-html]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n-html'));
      if (v) el.innerHTML = v;
    });
    $$('[data-i18n-alt]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n-alt'));
      if (v) el.setAttribute('alt', v);
    });
    $$('[data-i18n-placeholder]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n-placeholder'));
      if (v) el.setAttribute('placeholder', v);
    });
    $$('[data-i18n-aria-label]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n-aria-label'));
      if (v) el.setAttribute('aria-label', v);
    });

    $$('.langs button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });

    // section-specific strings owned by JS
    var amsNote = $('#amsNote');
    if (amsNote) amsNote.textContent = t(amsNote.dataset.state === 'rain' ? 'amsNoteRain' : 'amsNoteDry');
    var rainBtn = $('#rainBtn');
    if (rainBtn) rainBtn.textContent = t(rainBtn.dataset.state === 'rain' ? 'amsDry' : 'amsRain') || t('amsRain');
    var answer = $('#worldAnswer');
    if (answer && answer.dataset.intent) answer.innerHTML = t('ia' + answer.dataset.intent);

    document.title = t('metaTitle') || document.title;
    var md = document.querySelector('meta[name="description"]');
    if (md && t('metaDesc')) md.setAttribute('content', t('metaDesc'));
    reformatCounters();
    if (announce) toast(t('tLang'));
  }

  /* --------------------------------------------------------------- toast */
  var toastEl, toastTimer;
  function toast(msg) {
    if (!msg) return;
    toastEl = toastEl || $('#toast');
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3600);
  }

  /* -------------------------------------------------------------- header */
  function initHeader() {
    var header = $('#header');
    var burger = $('#burger');
    var drawer = $('#drawer');
    var sections = $$('main section[id]');
    var navLinks = $$('.nav a');

    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 24);
      var y = window.scrollY + 140, current = '';
      sections.forEach(function (s) { if (s.offsetTop <= y) current = s.id; });
      navLinks.forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + current);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function setDrawer(open) {
      burger.setAttribute('aria-expanded', String(open));
      if (open) {
        drawer.hidden = false;
        requestAnimationFrame(function () { drawer.classList.add('is-open'); });
        document.body.style.overflow = 'hidden';
      } else {
        drawer.classList.remove('is-open');
        document.body.style.overflow = '';
        setTimeout(function () { if (burger.getAttribute('aria-expanded') === 'false') drawer.hidden = true; }, 340);
      }
    }
    burger.addEventListener('click', function () {
      setDrawer(burger.getAttribute('aria-expanded') !== 'true');
    });
    $$('#drawer a').forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') setDrawer(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024 && burger.getAttribute('aria-expanded') === 'true') setDrawer(false);
    });

    $$('.langs button').forEach(function (b) {
      b.addEventListener('click', function () { applyLang(b.dataset.lang, true); });
    });
  }

  /* ------------------------------------------------------------- reveals */
  function initReveal() {
    var items = $$('.rv');
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------- generic observer */
  function whenVisible(el, cb, ratio) {
    if (!el) return;
    if (reduced || !('IntersectionObserver' in window)) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { cb(); io.disconnect(); } });
    }, { threshold: ratio == null ? 0.3 : ratio });
    io.observe(el);
  }

  /* --- progress of an element through the viewport, 0..1 --------------- */
  function scrollProgress(el) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    // p = 0 when the block's top enters at 88% of the viewport,
    // p = 1 once its bottom has risen to 35% — i.e. well before it scrolls away.
    var from = vh * 0.88;
    var to = vh * 0.35 - r.height;
    var span = from - to;
    if (span < 1) span = 1;
    return Math.max(0, Math.min(1, (from - r.top) / span));
  }

  var progressTargets = [];
  function onProgressScroll() {
    for (var i = 0; i < progressTargets.length; i++) {
      var tgt = progressTargets[i];
      tgt.fn(scrollProgress(tgt.el));
    }
  }
  function trackProgress(el, fn) {
    if (!el) return;
    if (reduced) { fn(1); return; }
    progressTargets.push({ el: el, fn: fn });
    fn(scrollProgress(el));
  }

  /* ------------------------------------------------------ fragmentation */
  function initFrag() {
    var frag = $('#frag');
    // let the chips be read in full colour first, then let them fall away
    whenVisible(frag, function () {
      setTimeout(function () { frag.classList.add('is-collapsed'); }, reduced ? 0 : 1600);
    }, 0.55);
  }

  /* --------------------------------------------------------- stat counts */
  var counters = [];
  function localeTag() { return lang === 'en' ? 'en-US' : (lang === 'uk' ? 'uk-UA' : 'ru-RU'); }
  function initCounters() {
    $$('[data-count]').forEach(function (el) {
      var target = parseFloat(el.dataset.count);
      var dec = parseInt(el.dataset.dec || '0', 10);
      var rec = { el: el, target: target, dec: dec, value: 0 };
      counters.push(rec);
      var write = function (v) {
        rec.value = v;
        el.textContent = v.toLocaleString(localeTag(), { minimumFractionDigits: dec, maximumFractionDigits: dec });
      };
      rec.write = write;
      whenVisible(el, function () {
        if (reduced) { write(target); return; }
        var start = performance.now(), dur = 1500;
        (function step(now) {
          var p = Math.min(1, (now - start) / dur);
          write(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        })(start);
      }, 0.5);
    });
  }
  function reformatCounters() {
    counters.forEach(function (c) { c.write(c.value); });
  }

  /* ------------------------------------------------------- AI think pipe */
  function initThink() {
    var pipe = $('#pipe');
    var out = $('#thinkOut');
    if (!pipe) return;
    var steps = $$('li', pipe);

    trackProgress($('#think'), function (p) {
      var reach = Math.floor(p * (steps.length + 1.4));
      steps.forEach(function (li, i) {
        li.classList.toggle('is-on', i <= reach);
        li.classList.toggle('is-done', i < reach);
      });
      if (out) out.classList.toggle('is-on', reach >= steps.length);
    });
  }

  /* ----------------------------------------------------- live timeline */
  function initTimeline() {
    var tl = $('#tl');
    if (!tl) return;
    var items = $$('li', tl);
    var prog = $('#tlProg');
    var notes = $$('#notes .note');

    trackProgress(tl.closest('.split'), function (p) {
      var reach = Math.floor(p * (items.length + 0.8));
      items.forEach(function (li, i) { li.classList.toggle('is-on', i <= reach); });
      if (prog) prog.style.setProperty('--p', Math.min(100, (reach + 1) / items.length * 100) + '%');
      var nReach = Math.floor(p * (notes.length + 1.2));
      notes.forEach(function (n, i) { n.classList.toggle('is-on', i <= nReach); });
    });
  }

  /* ------------------------------------------------------- replan demo */
  function initReplan() {
    var box = $('#replan');
    var btn = $('#replanBtn');
    if (!box || !btn) return;
    var fire = function () {
      box.classList.add('is-on');
      btn.disabled = true;
      btn.style.opacity = '.5';
    };
    btn.addEventListener('click', fire);
    whenVisible(box, function () { setTimeout(fire, reduced ? 0 : 900); }, 0.4);
  }

  /* ---------------------------------------------------------- EV route */
  function initRoute() {
    var route = $('#route');
    if (!route) return;
    var nodes = $$('.route__node', route);
    var fill = $('#routeFill');
    trackProgress(route, function (p) {
      var reach = Math.floor(p * (nodes.length + 0.6));
      nodes.forEach(function (n, i) { n.classList.toggle('is-on', i <= reach); });
      if (fill) fill.style.setProperty('--p', Math.min(100, (reach + 1) / nodes.length * 100) + '%');
    });
  }

  /* --------------------------------------------------- Amsterdam swap */
  function initAmsterdam() {
    var btn = $('#rainBtn');
    var note = $('#amsNote');
    var chain = $('#chain');
    if (!btn || !chain) return;
    var items = $$('li', chain);
    var original = items.map(function (li) {
      return { t: li.querySelector('b').textContent, s: li.querySelector('span:last-child').textContent };
    });

    btn.addEventListener('click', function () {
      var rain = btn.dataset.state !== 'rain';
      btn.dataset.state = rain ? 'rain' : 'dry';
      note.dataset.state = rain ? 'rain' : 'dry';
      note.textContent = t(rain ? 'amsNoteRain' : 'amsNoteDry');
      btn.textContent = t(rain ? 'amsDry' : 'amsRain') || t('amsRain');

      if (rain) {
        items[1].classList.add('is-alt');
        items[3].classList.add('is-alt');
        items[1].querySelector('b').textContent = t('am3');
        items[1].querySelector('span:last-child').textContent = t('am3s');
        items[1].querySelector('.ic use').setAttribute('href', '#i-tram');
        items[3].querySelector('span:last-child').textContent = t('amRainSlot') || '12:30';
      } else {
        items[1].classList.remove('is-alt');
        items[3].classList.remove('is-alt');
        items[1].querySelector('b').textContent = original[1].t;
        items[1].querySelector('span:last-child').textContent = original[1].s;
        items[1].querySelector('.ic use').setAttribute('href', '#i-bike');
        items[3].querySelector('span:last-child').textContent = original[3].s;
      }
    });
  }

  /* -------------------------------------------------------- world globe */
  function initWorld() {
    var globe = $('#globe');
    var pins = $$('.pinpt');
    var intents = $$('#intents button');
    var answer = $('#worldAnswer');

    if (pins.length) {
      var i = 0;
      whenVisible(globe, function () {
        pins.forEach(function (p, k) {
          setTimeout(function () { p.classList.add('is-on'); }, reduced ? 0 : k * 210);
        });
      }, 0.2);
      pins.forEach(function (p) {
        p.addEventListener('mouseenter', function () { p.classList.add('is-on'); });
      });
    }

    if (globe && reduced) {
      var svgEl = globe.querySelector('svg');
      if (svgEl && svgEl.pauseAnimations) svgEl.pauseAnimations();
    }

    if (globe && !reduced) {
      var g = $('#globeG');
      globe.addEventListener('pointermove', function (e) {
        var r = globe.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5;
        var dy = (e.clientY - r.top) / r.height - 0.5;
        if (g) g.setAttribute('transform', 'translate(' + (dx * 14).toFixed(1) + ',' + (dy * 10).toFixed(1) + ')');
      });
      globe.addEventListener('pointerleave', function () {
        if (g) g.setAttribute('transform', 'translate(0,0)');
      });
    }

    intents.forEach(function (b) {
      b.addEventListener('click', function () {
        intents.forEach(function (o) { o.classList.remove('is-on'); });
        b.classList.add('is-on');
        if (answer) {
          answer.dataset.intent = b.dataset.intent;
          answer.style.opacity = '0';
          setTimeout(function () {
            answer.innerHTML = t('ia' + b.dataset.intent);
            answer.style.opacity = '1';
          }, reduced ? 0 : 180);
        }
      });
    });
    if (answer && !answer.dataset.intent) answer.dataset.intent = '1';
    if (answer) answer.style.transition = 'opacity .22s ease';
  }

  /* ----------------------------------------------------------- flywheel */
  function initFlywheel() {
    var fly = $('#fly');
    if (!fly) return;
    var nodes = $$('.fly__n', fly);
    var steps = $$('#flySteps li');
    whenVisible(fly, function () { fly.classList.add('is-on'); }, 0.3);
    trackProgress(fly, function (p) {
      var reach = Math.floor(p * (nodes.length + 0.6));
      nodes.forEach(function (n, i) { n.classList.toggle('is-on', i <= reach); });
      steps.forEach(function (s, i) { s.classList.toggle('is-on', i <= reach); });
    });
  }

  /* --------------------------------------------------------- hero parallax */
  function initHeroParallax() {
    if (reduced) return;
    var img = $('.hero__media img');
    if (!img) return;
    var raf = false;
    window.addEventListener('scroll', function () {
      if (raf) return;
      raf = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, 700);
        img.style.transform = 'scale(1.06) translate3d(0,' + (y * 0.075).toFixed(1) + 'px,0)';
        raf = false;
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------------- modals */
  var lastFocus = null;
  function openModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    lastFocus = document.activeElement;
    m.hidden = false;
    requestAnimationFrame(function () { m.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
    var focusable = m.querySelector('input, button, textarea, a[href]');
    if (focusable) setTimeout(function () { focusable.focus(); }, 60);
  }
  function closeModal(m) {
    if (!m) return;
    m.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () { m.hidden = true; }, 320);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function initModals() {
    $$('[data-waitlist]').forEach(function (b) {
      b.addEventListener('click', function () { openModal('waitlist'); });
    });
    $$('[data-toast]').forEach(function (b) {
      b.addEventListener('click', function () { toast(t(b.dataset.toast === 'proLater' ? 'tLater' : b.dataset.toast)); });
    });
    $$('.modal').forEach(function (m) {
      m.addEventListener('click', function (e) { if (e.target === m) closeModal(m); });
      $$('[data-close]', m).forEach(function (b) {
        b.addEventListener('click', function () { closeModal(m); });
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var open = $('.modal.is-open');
      if (open) closeModal(open);
    });
    // focus trap
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var m = $('.modal.is-open');
      if (!m) return;
      var f = $$('a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])', m)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ----------------------------------------------------------- waitlist */
  function initWaitlist() {
    var form = $('#wlFormEl');
    if (!form) return;
    var plat = 'ios';
    $$('#wlPlat button').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('#wlPlat button').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        plat = b.dataset.plat;
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#wlName'), mail = $('#wlMail');
      var okName = name.value.trim().length > 0;
      var okMail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim());
      $('#fName').classList.toggle('is-err', !okName);
      $('#fMail').classList.toggle('is-err', !okMail);
      if (!okName) { name.focus(); return; }
      if (!okMail) { mail.focus(); return; }

      var list = [];
      try { list = JSON.parse(LS.get('escape.waitlist') || '[]'); } catch (err) { list = []; }
      list.push({
        name: name.value.trim(), email: mail.value.trim(), platform: plat,
        message: $('#wlMsg').value.trim(), lang: lang, at: new Date().toISOString()
      });
      LS.set('escape.waitlist', JSON.stringify(list));

      $('#wlForm').hidden = true;
      $('#wlDone').hidden = false;
      form.reset();
    });
  }

  /* ------------------------------------------------------------ consent */
  var CONSENT_KEY = 'escape.consent.v1';
  function readConsent() {
    try { return JSON.parse(LS.get(CONSENT_KEY) || 'null'); } catch (e) { return null; }
  }
  function writeConsent(c) {
    c.necessary = true;
    c.at = new Date().toISOString();
    LS.set(CONSENT_KEY, JSON.stringify(c));
    document.documentElement.dataset.consent = [
      c.analytics ? 'analytics' : '', c.functional ? 'functional' : '', c.marketing ? 'marketing' : ''
    ].filter(Boolean).join(' ') || 'necessary';
  }

  function initConsent() {
    var bar = $('#cookieBar');
    var prefsModal = $('#cookiePrefs');
    var switches = $$('.switch[data-cat]');
    var current = readConsent();

    function paint(c) {
      switches.forEach(function (s) {
        var cat = s.dataset.cat;
        var on = cat === 'necessary' ? true : !!(c && c[cat]);
        s.setAttribute('aria-checked', String(on));
      });
    }

    function showBar(show) {
      if (show) { bar.hidden = false; requestAnimationFrame(function () { bar.classList.add('is-open'); }); }
      else { bar.classList.remove('is-open'); setTimeout(function () { bar.hidden = true; }, 520); }
    }

    switches.forEach(function (s) {
      if (s.disabled) return;
      s.addEventListener('click', function () {
        s.setAttribute('aria-checked', s.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
      });
    });

    function decide(c) {
      writeConsent(c);
      paint(c);
      showBar(false);
      toast(t('tSaved'));
    }

    $('#ckAll').addEventListener('click', function () {
      decide({ analytics: true, functional: true, marketing: true });
    });
    $('#ckNone').addEventListener('click', function () {
      decide({ analytics: false, functional: false, marketing: false });
    });
    $('#ckMore').addEventListener('click', function () {
      paint(readConsent());
      openModal('cookiePrefs');
    });
    $('#cookieOpen').addEventListener('click', function () {
      paint(readConsent());
      openModal('cookiePrefs');
    });
    $('#cpSave').addEventListener('click', function () {
      var c = {};
      switches.forEach(function (s) {
        if (s.dataset.cat === 'necessary') return;
        c[s.dataset.cat] = s.getAttribute('aria-checked') === 'true';
      });
      decide(c);
      closeModal(prefsModal);
    });

    if (current) { paint(current); writeConsent(current); }
    else { paint(null); setTimeout(function () { showBar(true); }, 900); }
  }

  /* --------------------------------------------------------------- boot */
  function boot() {
    applyLang(detectLang(), false);
    initHeader();
    initReveal();
    initFrag();
    initCounters();
    initThink();
    initTimeline();
    initReplan();
    initRoute();
    initAmsterdam();
    initWorld();
    initFlywheel();
    initHeroParallax();
    initModals();
    initWaitlist();
    initConsent();

    if (progressTargets.length) {
      var ticking = false;
      var handler = function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { onProgressScroll(); ticking = false; });
      };
      window.addEventListener('scroll', handler, { passive: true });
      window.addEventListener('resize', handler);
      onProgressScroll();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
