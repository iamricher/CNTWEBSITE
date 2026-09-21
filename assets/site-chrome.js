/* ============================================================
   CNT — shared site chrome (header + footer) injector.
   One source of truth for the navbar and footer used across the
   sub-pages, so they always match the homepage. Renders into:
     <div id="site-header" data-active="careers|events"></div>
     <div id="site-footer"></div>
   Requires assets/site-chrome.css.
   ============================================================ */

/* Canonical company stats — ONE source of truth so every page shows the
   same figures. Update here and all stat blocks that read it stay uniform. */
window.CNT_STATS = [
  { v: '30+',        l: 'Years in Business' },
  { v: '10,000+',    l: 'Workers Deployed'  },
  { v: 'Nationwide', l: 'Luzon · Visayas · Mindanao' }
];

(function () {
  'use strict';

  var LOGO = '/assets/img/cnt-logo.png';
  var FOOTER_LOGO = '/assets/img/cnt-logo-white.png';
  var YEAR = new Date().getFullYear();

  // ── LAUNCH CONFIG — fill these in before go-live ──────────────────────────
  // Google Analytics 4 Measurement ID (from analytics.google.com → Admin →
  // Data Streams). Leave blank to keep GA off. Loads only after cookie consent
  // and never on localhost / for bots (see analyticsEnabled + initGA).
  var GA_MEASUREMENT_ID = '';   // e.g. 'G-XXXXXXXXXX'
  // Registration numbers shown in the footer for trust (a big deal in PH
  // recruitment). Leave a field blank to hide it — nothing shows until set.
  var LICENSE = { dole: '', dti: '', sec: '' };   // e.g. dole: 'NCR-MDLYNG-123456-2026'

  function navHTML(active, base, overlay) {
    var a = active || '';
    // base is '' on the homepage (same-page anchors) or '/index' on sub-pages.
    var h = function (hash) { return base + '#' + hash; };
    return '' +
    '<nav class="nav' + (overlay ? ' nav-overlay' : '') + '" id="nav" role="navigation" aria-label="Main navigation">' +
    '  <div class="nav-container">' +
    '    <a href="' + (base || '/') + '" class="nav-logo" aria-label="CNT Home"><img src="' + LOGO + '" alt="CNT Promo & Ads Specialists, Inc." /></a>' +
    '    <ul class="nav-links" role="list">' +
    '      <li><a href="' + h('about') + '" class="nav-link' + (a === 'about' ? ' active' : '') + '">About</a></li>' +
    '      <li><a href="' + h('services') + '" class="nav-link' + (a === 'services' ? ' active' : '') + '">Services</a></li>' +
    '      <li><a href="' + h('reach') + '" class="nav-link">Locations</a></li>' +
    '      <li><a href="' + h('projects') + '" class="nav-link">Success Stories</a></li>' +
    '      <li><a href="' + h('events') + '" class="nav-link' + (a === 'events' ? ' active' : '') + '">Events</a></li>' +
    '      <li><a href="/careers" class="nav-link' + (a === 'careers' ? ' active' : '') + '">Careers</a></li>' +
    '    </ul>' +
    '    <div class="nav-actions">' +
    '      <a href="' + h('contact') + '" class="btn-nav">Contact Us</a>' +
    '      <button class="nav-toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
    '    </div>' +
    '  </div>' +
    '</nav>' +
    '<div class="mobile-menu" id="mobileMenu" role="dialog" aria-label="Mobile navigation">' +
    '  <ul>' +
    '    <li><a href="' + h('about') + '">About</a></li>' +
    '    <li><a href="' + h('services') + '">Services</a></li>' +
    '    <li><a href="' + h('reach') + '">Locations</a></li>' +
    '    <li><a href="' + h('industries') + '">Industries</a></li>' +
    '    <li><a href="' + h('projects') + '">Success Stories</a></li>' +
    '    <li><a href="' + h('events') + '">Events</a></li>' +
    '    <li><a href="/careers">Careers</a></li>' +
    '    <li><a href="/faq">FAQ</a></li>' +
    '    <li><a href="' + h('contact') + '">Contact</a></li>' +
    '  </ul>' +
    '  <a href="/careers" class="btn-primary mobile-cta">Apply Now</a>' +
    '  <a href="/status" class="btn-ghost mobile-cta">Track My Application</a>' +
    '</div>';
  }

  function footerHTML(base) {
    var h = function (hash) { return base + '#' + hash; };
    return '' +
    '<footer class="footer" role="contentinfo">' +
    '  <div class="footer-top"><div class="container"><div class="footer-grid">' +
    '    <div class="footer-brand">' +
    '      <img src="' + FOOTER_LOGO + '" alt="CNT Promo & Ads Specialists, Inc." class="footer-logo" />' +
    '      <p>Philippines\' most trusted employment agency and corporate staffing solutions provider — connecting exceptional talent with leading organizations since 1992.</p>' +
    '      <div class="social-links">' +
    '        <a href="https://www.facebook.com/CntPromoAds" target="_blank" rel="noopener" class="social-link" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>' +
    '        <a href="https://www.linkedin.com/company/cnt-promo-ads-specialists-inc/" class="social-link" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>' +
    '        <a href="https://www.tiktok.com/@cnt.jobhiring" target="_blank" rel="noopener" class="social-link" aria-label="TikTok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3c.26 2.2 1.6 3.63 3.8 3.9v2.63c-1.3.13-2.48-.3-3.8-1.03v5.9c0 3.4-2.55 5.83-5.87 5.42-2.9-.36-4.77-2.7-4.6-5.68.16-2.74 2.5-4.82 5.3-4.6v2.7c-.5-.1-1-.1-1.5.03-1.1.3-1.76 1.28-1.57 2.45.18 1.1 1.16 1.83 2.35 1.66 1.02-.15 1.72-1.06 1.72-2.2V3h2.44z"/></svg></a>' +
    '      </div>' +
    '    </div>' +
    '    <div class="footer-col"><h5>Services</h5><ul>' +
    '      <li><a href="/service?s=executive-search">Executive Search</a></li><li><a href="/service?s=mass-hiring">Mass &amp; Bulk Hiring</a></li>' +
    '      <li><a href="/service?s=hr-outsourcing">HR Outsourcing</a></li><li><a href="/service?s=payroll">Payroll Management</a></li>' +
    '      <li><a href="/service?s=training">Training &amp; Development</a></li><li><a href="/service?s=consulting">Workforce Consulting</a></li></ul></div>' +
    '    <div class="footer-col"><h5>Industries</h5><ul>' +
    '      <li><a href="' + h('industries') + '">Banking &amp; Finance</a></li><li><a href="' + h('industries') + '">Healthcare</a></li>' +
    '      <li><a href="' + h('industries') + '">Government</a></li><li><a href="' + h('industries') + '">Technology</a></li>' +
    '      <li><a href="' + h('industries') + '">Retail &amp; FMCG</a></li><li><a href="' + h('industries') + '">Logistics</a></li></ul></div>' +
    '    <div class="footer-col"><h5>Company</h5><ul>' +
    '      <li><a href="/about">About Us</a></li><li><a href="' + h('reach') + '">Locations</a></li>' +
    '      <li><a href="' + h('projects') + '">Success Stories</a></li><li><a href="' + h('events') + '">Events</a></li>' +
    '      <li><a href="/careers">Careers</a></li><li><a href="/faq">FAQ</a></li><li><a href="' + h('contact') + '">Contact</a></li></ul>' +
    '      <h5 style="margin-top:1.75rem">Stay Updated</h5>' +
    '      <p class="newsletter-copy">New job openings, events &amp; company announcements &mdash; straight to your inbox.</p>' +
    '      <div class="newsletter-form"><input type="email" id="nl-email" placeholder="you@email.com" autocomplete="email" aria-label="Email for job alerts, events and announcements" /><button id="nl-btn" aria-label="Subscribe"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div>' +
    '      <p id="nl-msg" class="newsletter-msg" aria-live="polite"></p>' +
    '    </div>' +
    '  </div></div></div>' +
    '  <div class="footer-bottom"><div class="container">' +
    licenseHTML() +
    '    <p>&copy; ' + YEAR + ' CNT Promo &amp; Ads Specialists, Inc. All rights reserved.</p>' +
    '    <div class="footer-bottom-links"><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a></div>' +
    '  </div></div>' +
    '  <div class="footer-red-bar"></div>' +
    '</footer>';
  }

  function wireMobileMenu() {
    var toggle = document.getElementById('navToggle');
    var menu = document.getElementById('mobileMenu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        menu.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // Overlay navbar (homepage): transparent over the hero, solid once scrolled.
  function wireOverlayScroll(nav) {
    if (!nav || !nav.classList.contains('nav-overlay')) return;
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // The overlay nav is fixed (out of flow), so a page's first .hero must reserve
  // room for it or its content would sit under the bar. This gives every overlay
  // sub-page the SAME clearance (a floor — it never shrinks a hero's own spacing).
  // Skipped on the homepage, whose hero is purpose-built for the overlay nav.
  function ensureHeroClearsNav(nav) {
    if (!nav || !nav.classList.contains('nav-overlay')) return;
    var header = document.getElementById('site-header');
    if (header && header.getAttribute('data-active') === 'home') return;
    // Each page names its hero differently (.hero, .about-hero, .svc-hero,
    // .faq-hero, .legal-hero…) — match the first block whose class contains "hero".
    var hero = document.querySelector('[class*="hero"]');
    if (!hero) return;
    // The overlay bar is ~76px tall (36px logo + 2×1.25rem) on every breakpoint;
    // 120px = that plus a comfortable, uniform gap below it on all sub-pages.
    var NEED = 120;
    var apply = function () {
      hero.style.paddingTop = '';                                  // read the true CSS value
      var cur = parseInt(getComputedStyle(hero).paddingTop, 10) || 0;
      if (cur < NEED) hero.style.paddingTop = NEED + 'px';         // floor; wider screens keep their bigger value
    };
    apply();
    window.addEventListener('resize', apply, { passive: true });
  }

  // Smooth in-page scrolling for same-page anchor links, offset by the navbar.
  function wireSmoothScroll(nav) {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href.length < 2) return; // skip bare "#"
      link.addEventListener('click', function (e) {
        var target;
        try { target = document.querySelector(href); } catch (_) { return; }
        if (!target) return;
        e.preventDefault();
        var offset = (nav ? nav.offsetHeight : 0) + 20;
        var top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }

  // Back-to-top button — injected on every page. Appears only once the visitor
  // has scrolled near the very bottom, then smooth-scrolls back to the top.
  function backToTop() {
    if (document.querySelector('.cnt-totop, .back-to-top')) return; // never double up
    var btn = document.createElement('button');
    btn.className = 'cnt-totop';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg>';
    document.body.appendChild(btn);
    var toggle = function () {
      var nearBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 600);
      btn.classList.toggle('visible', nearBottom);
    };
    window.addEventListener('scroll', toggle, { passive: true });
    window.addEventListener('resize', toggle, { passive: true });
    toggle();
    btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  // Google Analytics 4 — loads only when a real ID is configured, the visitor
  // hasn't declined cookies, and it's a real public visit (not localhost/bots).
  function initGA() {
    if (!GA_MEASUREMENT_ID || !/^G-/.test(GA_MEASUREMENT_ID)) return;
    if (!analyticsEnabled() || cookieConsent() === 'declined') return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
  }

  // Footer registration line — renders only the numbers that are filled in.
  function licenseHTML() {
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var parts = [];
    if (LICENSE.dole) parts.push('DOLE Reg. No. ' + esc(LICENSE.dole));
    if (LICENSE.dti)  parts.push('DTI Reg. No. ' + esc(LICENSE.dti));
    if (LICENSE.sec)  parts.push('SEC Reg. No. ' + esc(LICENSE.sec));
    return parts.length ? '<p class="footer-license">' + parts.join(' &nbsp;&middot;&nbsp; ') + '</p>' : '';
  }

  function init() {
    // PWA + mobile chrome (site-wide, once): brand theme-color for the mobile
    // browser UI, and the web app manifest for "Add to Home Screen".
    try {
      if (!document.querySelector('meta[name="theme-color"]')) {
        var mt = document.createElement('meta'); mt.name = 'theme-color'; mt.content = '#C8102E'; document.head.appendChild(mt);
      }
      if (!document.querySelector('link[rel="manifest"]')) {
        var lk = document.createElement('link'); lk.rel = 'manifest'; lk.href = '/site.webmanifest'; document.head.appendChild(lk);
      }
    } catch (_) {}
    // base is '' on the homepage (same-page anchors) or '/index' elsewhere.
    // Resolve it once from the header placeholder and reuse it for the footer.
    var header = document.getElementById('site-header');
    var base = header ? header.getAttribute('data-base') : null;
    if (base === null) base = '/'; // sub-pages point home to the clean root, not /index.html
    if (header) {
      var overlay = header.getAttribute('data-overlay') === '1';
      header.innerHTML = navHTML(header.getAttribute('data-active'), base, overlay);
    }
    var footer = document.getElementById('site-footer');
    if (footer) footer.innerHTML = footerHTML(base);
    wireMobileMenu();
    var nav = document.getElementById('nav');
    wireOverlayScroll(nav);
    ensureHeroClearsNav(nav);
    wireSmoothScroll(nav);
    backToTop();
    handleInitialHash();
    wireNewsletter();
    // Respect a prior "Decline" choice: skip first-party analytics entirely.
    if (analyticsEnabled() && cookieConsent() !== 'declined') { countVisit(); logPageView(); }
    initGA();
    cookieBanner();
  }

  // A nav link from a sub-page points at "/#section". On arrival the browser's
  // native hash jump fires before the loader hides and before lazy images lay
  // out, so it lands at the top instead of the section. Re-scroll (with the
  // sticky-nav offset) as the page settles — but never fight a user who has
  // already started scrolling.
  function handleInitialHash() {
    var hash = location.hash;
    if (!hash || hash.length < 2) return;
    var target; try { target = document.querySelector(hash); } catch (_) { return; }
    if (!target) return;
    var userMoved = false;
    var mark = function () { userMoved = true; };
    ['wheel', 'touchmove', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, mark, { passive: true, once: true });
    });
    var scrollNow = function () {
      if (userMoved) return;
      var t; try { t = document.querySelector(hash); } catch (_) { return; }
      if (!t) return;
      var navEl = document.getElementById('nav');
      var offset = (navEl ? navEl.offsetHeight : 0) + 20;
      var top = t.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
    };
    [140, 450, 950, 1600].forEach(function (ms) { setTimeout(scrollNow, ms); });
  }

  function cookieConsent() { try { return localStorage.getItem('cnt_cookie_consent'); } catch (_) { return null; } }
  function cookieBanner() {
    if (cookieConsent()) return;               // already accepted or declined
    var b = document.createElement('div');
    b.className = 'cookie-banner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Cookie notice');
    b.innerHTML = '<p>We use first-party cookies and analytics to understand how the site is used and to improve your experience. See our <a href="/privacy">Privacy Policy</a>.</p>' +
      '<div class="cookie-actions"><button class="ck-decline" type="button">Decline</button><button class="ck-accept" type="button">Accept</button></div>';
    document.body.appendChild(b);
    requestAnimationFrame(function () { b.classList.add('show'); });
    var close = function (val) { try { localStorage.setItem('cnt_cookie_consent', val); } catch (_) {} b.classList.remove('show'); setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 300); };
    b.querySelector('.ck-accept').addEventListener('click', function () { close('accepted'); });
    b.querySelector('.ck-decline').addEventListener('click', function () { close('declined'); });
  }

  // Footer subscribe → job alerts + events + announcements. Writes through the
  // cnt_subscribe() RPC into the `subscribers` table that api/notify-subscribers.js
  // emails on every new post (never touches the table directly — see subscribers.sql).
  function wireNewsletter() {
    var input = document.getElementById('nl-email');
    var btn = document.getElementById('nl-btn');
    var msg = document.getElementById('nl-msg');
    if (!input || !btn) return;
    var say = function (t, ok) { if (msg) { msg.textContent = t; msg.style.color = ok ? '#7CE0A0' : 'rgba(255,255,255,.55)'; } };
    var submit = function () {
      var email = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { say('Please enter a valid email.'); return; }
      var sb = window.getSupabase && window.getSupabase();
      if (!sb) { say('Unable to subscribe right now.'); return; }
      btn.disabled = true;
      Promise.resolve(sb.rpc('cnt_subscribe', { p_email: email, p_source: 'footer' })).then(function (res) {
        btn.disabled = false;
        if (res && res.error) { say('Something went wrong. Try again.'); return; }
        input.value = '';
        say('Subscribed! We’ll keep you posted. ✓', true);
      }, function () { btn.disabled = false; say('Something went wrong. Try again.'); });
    };
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
  }

  // Count one website visit per browser session (across any public page).
  // Fire-and-forget; failures never affect the page.
  // Only record REAL public visits so launch analytics stay trustworthy: skip
  // local/dev hosts, browser automation and obvious bots, and any device the
  // team has flagged as internal (visit any page once with ?internal=1).
  function analyticsEnabled() {
    try {
      if (location.protocol === 'file:') return false;
      var h = location.hostname || '';
      if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '0.0.0.0'
        || /\.local$/.test(h) || /^192\.168\./.test(h) || /^10\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
      if (navigator.webdriver) return false;
      if (/bot|crawl|spider|slurp|headless|lighthouse|pagespeed|gtmetrix|preview|monitor|scan/i.test(navigator.userAgent || '')) return false;
      try {
        if (new URLSearchParams(location.search).get('internal') === '1') localStorage.setItem('cnt_internal', '1');
        if (localStorage.getItem('cnt_internal') === '1') return false;
      } catch (_) {}
      return true;
    } catch (_) { return true; }
  }

  function countVisit() {
    try {
      if (sessionStorage.getItem('cnt_visited')) return;
      var sb = window.getSupabase && window.getSupabase();
      if (!sb) return;
      sessionStorage.setItem('cnt_visited', '1');
      Promise.resolve(sb.rpc('cnt_increment_visit')).catch(function () {});
    } catch (_) {}
  }

  // Persistent per-browser id used to count unique visitors.
  function visitorId() {
    var vid = localStorage.getItem('cnt_vid');
    if (!vid) {
      vid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
        : (Date.now().toString(36) + Math.random().toString(36).slice(2));
      try { localStorage.setItem('cnt_vid', vid); } catch (_) {}
    }
    return vid;
  }

  // Send one analytics view for an explicit path (shared by the page-load
  // logger and cntLogView, which SPAs call when a virtual view opens).
  function sendView(path) {
    try {
      var vid = visitorId();
      // External referrer host (traffic source), null for direct/internal visits.
      var ref = null;
      try { if (document.referrer) { var rh = new URL(document.referrer).hostname.replace(/^www\./, ''); if (rh && rh !== location.hostname.replace(/^www\./, '')) ref = rh; } } catch (_) {}
      // Campaign attribution: read UTM tags off the arrival URL. First-touch —
      // a tagged link sticks to this browser's following page views for 30 days,
      // so the whole visit is credited to the campaign even after they navigate
      // (and even when the platform strips document.referrer, e.g. in-app apps).
      var utm = null;
      try {
        var q = new URLSearchParams(location.search);
        var us = q.get('utm_source'), um = q.get('utm_medium'), uc = q.get('utm_campaign');
        if (us || uc) {
          utm = { s: us || null, m: um || null, c: uc || null };
          try { localStorage.setItem('cnt_utm', JSON.stringify({ v: utm, t: Date.now() })); } catch (_) {}
        } else {
          try {
            var saved = JSON.parse(localStorage.getItem('cnt_utm') || 'null');
            if (saved && saved.v && (Date.now() - saved.t) < 30 * 86400000) utm = saved.v;
          } catch (_) {}
        }
      } catch (_) {}
      var payload = { path: path, visitor_id: vid, referrer: ref };
      if (utm) { payload.utm_source = utm.s; payload.utm_medium = utm.m; payload.utm_campaign = utm.c; }
      // Fallback: direct Supabase insert (no geo) when /api/pv isn't reachable
      // (local dev, or a non-Vercel host).
      var direct = function () {
        var sb = window.getSupabase && window.getSupabase(); if (!sb) return;
        Promise.resolve(sb.from('page_views').insert(payload)).then(function (res) {
          if (res && res.error) sb.from('page_views').insert({ path: path, visitor_id: vid }).then(function () {}, function () {});
        }, function () {});
      };
      // Prefer the beacon: /api/pv attaches coarse geo (country/region/city)
      // from Vercel's edge headers before inserting the same row.
      try {
        fetch('/api/pv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true })
          .then(function (r) { if (!r || !r.ok) direct(); }, function () { direct(); });
      } catch (_) { direct(); }
    } catch (_) {}
  }

  // Log each page view (path + a persistent per-browser id) for analytics.
  function logPageView() {
    var path = (location.pathname || '/').replace(/\/index\.html$/, '/') || '/';
    // Keep the ?id= on event/post pages so each one can be measured
    // individually in Content Studio's per-post analytics.
    var id = new URLSearchParams(location.search).get('id');
    if (id && /(event|post)\.html$/.test(location.pathname)) path += '?id=' + id;
    sendView(path);
  }

  // Public: let an SPA log a virtual view (e.g. careers job details) with its
  // own path, so each posting can be measured individually.
  window.cntLogView = function (p) { if (p && analyticsEnabled() && cookieConsent() !== 'declined') sendView(String(p).slice(0, 300)); };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
