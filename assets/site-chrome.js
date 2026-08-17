/* ============================================================
   CNT — shared site chrome (header + footer) injector.
   One source of truth for the navbar and footer used across the
   sub-pages, so they always match the homepage. Renders into:
     <div id="site-header" data-active="careers|events"></div>
     <div id="site-footer"></div>
   Requires assets/site-chrome.css.
   ============================================================ */
(function () {
  'use strict';

  var LOGO = 'https://uploads.onecompiler.io/43d4zm644/44q9vbk23/cnt_front.png';
  var FOOTER_LOGO = 'https://uploads.onecompiler.io/43d4zm644/44t7ga3md/CNT%20Promo%20&%20Ads%20Specialists,%20Inc.%202.png';
  var YEAR = new Date().getFullYear();

  function navHTML(active, base, overlay) {
    var a = active || '';
    // base is '' on the homepage (same-page anchors) or 'index.html' on sub-pages.
    var h = function (hash) { return base + '#' + hash; };
    return '' +
    '<nav class="nav' + (overlay ? ' nav-overlay' : '') + '" id="nav" role="navigation" aria-label="Main navigation">' +
    '  <div class="nav-container">' +
    '    <a href="' + (base || 'index.html') + '" class="nav-logo" aria-label="CNT Home"><img src="' + LOGO + '" alt="CNT Promo & Ads Specialists, Inc." /></a>' +
    '    <ul class="nav-links" role="list">' +
    '      <li><a href="' + h('about') + '" class="nav-link' + (a === 'about' ? ' active' : '') + '">About</a></li>' +
    '      <li><a href="' + h('services') + '" class="nav-link' + (a === 'services' ? ' active' : '') + '">Services</a></li>' +
    '      <li><a href="' + h('industries') + '" class="nav-link">Industries</a></li>' +
    '      <li><a href="' + h('projects') + '" class="nav-link">Success Stories</a></li>' +
    '      <li><a href="' + h('events') + '" class="nav-link' + (a === 'events' ? ' active' : '') + '">Events</a></li>' +
    '      <li><a href="careers.html" class="nav-link' + (a === 'careers' ? ' active' : '') + '">Careers</a></li>' +
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
    '    <li><a href="status.html">Track My Application</a></li>' +
    '    <li><a href="' + h('industries') + '">Industries</a></li>' +
    '    <li><a href="' + h('projects') + '">Success Stories</a></li>' +
    '    <li><a href="' + h('events') + '">Events</a></li>' +
    '    <li><a href="careers.html">Careers</a></li>' +
    '    <li><a href="' + h('contact') + '">Contact</a></li>' +
    '  </ul>' +
    '  <a href="careers.html" class="btn-primary mobile-cta">Apply Now</a>' +
    '  <a href="status.html" class="btn-ghost mobile-cta">Track My Application</a>' +
    '</div>';
  }

  function footerHTML(base) {
    var h = function (hash) { return base + '#' + hash; };
    return '' +
    '<footer class="footer" role="contentinfo">' +
    '  <div class="footer-top"><div class="container"><div class="footer-grid">' +
    '    <div class="footer-brand">' +
    '      <img src="' + FOOTER_LOGO + '" alt="CNT Promo & Ads Specialists, Inc." class="footer-logo" />' +
    '      <p>Philippines\' most trusted employment agency and corporate staffing solutions provider — connecting exceptional talent with leading organizations since 2009.</p>' +
    '      <div class="social-links">' +
    '        <a href="https://www.facebook.com/CntPromoAds" target="_blank" rel="noopener" class="social-link" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>' +
    '        <a href="https://www.linkedin.com/in/cnt-promo-and-ads-specialists-inc-24b7633a7/" class="social-link" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>' +
    '        <a href="https://www.tiktok.com/@cnt.jobhiring" target="_blank" rel="noopener" class="social-link" aria-label="TikTok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3c.26 2.2 1.6 3.63 3.8 3.9v2.63c-1.3.13-2.48-.3-3.8-1.03v5.9c0 3.4-2.55 5.83-5.87 5.42-2.9-.36-4.77-2.7-4.6-5.68.16-2.74 2.5-4.82 5.3-4.6v2.7c-.5-.1-1-.1-1.5.03-1.1.3-1.76 1.28-1.57 2.45.18 1.1 1.16 1.83 2.35 1.66 1.02-.15 1.72-1.06 1.72-2.2V3h2.44z"/></svg></a>' +
    '      </div>' +
    '    </div>' +
    '    <div class="footer-col"><h5>Services</h5><ul>' +
    '      <li><a href="services.html#executive-search">Executive Search</a></li><li><a href="services.html#mass-hiring">Mass &amp; Bulk Hiring</a></li>' +
    '      <li><a href="services.html#hr-outsourcing">HR Outsourcing</a></li><li><a href="services.html#contractual-staffing">Contractual Staffing</a></li>' +
    '      <li><a href="services.html#background-screening">Background Screening</a></li><li><a href="services.html#training">Training &amp; Development</a></li></ul></div>' +
    '    <div class="footer-col"><h5>Industries</h5><ul>' +
    '      <li><a href="' + h('industries') + '">Banking &amp; Finance</a></li><li><a href="' + h('industries') + '">Healthcare</a></li>' +
    '      <li><a href="' + h('industries') + '">Government</a></li><li><a href="' + h('industries') + '">Technology</a></li>' +
    '      <li><a href="' + h('industries') + '">Retail &amp; FMCG</a></li><li><a href="' + h('industries') + '">Logistics</a></li></ul></div>' +
    '    <div class="footer-col"><h5>Company</h5><ul>' +
    '      <li><a href="about.html">About Us</a></li><li><a href="' + h('projects') + '">Success Stories</a></li>' +
    '      <li><a href="careers.html">Careers</a></li><li><a href="' + h('contact') + '">Contact</a></li></ul>' +
    '      <h5 style="margin-top:1.75rem">Stay Updated</h5>' +
    '      <div class="newsletter-form"><input type="email" id="nl-email" placeholder="Your email" aria-label="Newsletter email" /><button id="nl-btn" aria-label="Subscribe">&rarr;</button></div>' +
    '      <p id="nl-msg" style="font-size:.78rem;color:rgba(255,255,255,.5);margin-top:8px;min-height:1em"></p>' +
    '    </div>' +
    '  </div></div></div>' +
    '  <div class="footer-bottom"><div class="container">' +
    '    <p>&copy; ' + YEAR + ' CNT Promo &amp; Ads Specialists, Inc. All rights reserved.</p>' +
    '    <div class="footer-bottom-links"><a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms of Service</a><a href="events-admin.html">Content Admin</a></div>' +
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

  function init() {
    // base is '' on the homepage (same-page anchors) or 'index.html' elsewhere.
    // Resolve it once from the header placeholder and reuse it for the footer.
    var header = document.getElementById('site-header');
    var base = header ? header.getAttribute('data-base') : null;
    if (base === null) base = 'index.html'; // sub-pages default
    if (header) {
      var overlay = header.getAttribute('data-overlay') === '1';
      header.innerHTML = navHTML(header.getAttribute('data-active'), base, overlay);
    }
    var footer = document.getElementById('site-footer');
    if (footer) footer.innerHTML = footerHTML(base);
    wireMobileMenu();
    var nav = document.getElementById('nav');
    wireOverlayScroll(nav);
    wireSmoothScroll(nav);
    wireNewsletter();
    countVisit();
    logPageView();
  }

  // Newsletter signup in the footer → newsletter_subscribers table.
  function wireNewsletter() {
    var input = document.getElementById('nl-email');
    var btn = document.getElementById('nl-btn');
    var msg = document.getElementById('nl-msg');
    if (!input || !btn) return;
    var say = function (t, ok) { if (msg) { msg.textContent = t; msg.style.color = ok ? '#7CE0A0' : 'rgba(255,255,255,.5)'; } };
    var submit = function () {
      var email = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { say('Please enter a valid email.'); return; }
      var sb = window.getSupabase && window.getSupabase();
      if (!sb) { say('Unable to subscribe right now.'); return; }
      btn.disabled = true;
      Promise.resolve(sb.from('newsletter_subscribers').insert({ email: email })).then(function (res) {
        btn.disabled = false;
        if (res && res.error && !/duplicate|unique/i.test(res.error.message || '')) { say('Something went wrong. Try again.'); return; }
        input.value = '';
        say('Thanks! You’re subscribed. ✓', true);
      }, function () { btn.disabled = false; say('Something went wrong. Try again.'); });
    };
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
  }

  // Count one website visit per browser session (across any public page).
  // Fire-and-forget; failures never affect the page.
  function countVisit() {
    try {
      if (sessionStorage.getItem('cnt_visited')) return;
      var sb = window.getSupabase && window.getSupabase();
      if (!sb) return;
      sessionStorage.setItem('cnt_visited', '1');
      Promise.resolve(sb.rpc('cnt_increment_visit')).catch(function () {});
    } catch (_) {}
  }

  // Log each page view (path + a persistent per-browser id) for analytics.
  function logPageView() {
    try {
      var sb = window.getSupabase && window.getSupabase();
      if (!sb) return;
      var vid = localStorage.getItem('cnt_vid');
      if (!vid) {
        vid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
          : (Date.now().toString(36) + Math.random().toString(36).slice(2));
        localStorage.setItem('cnt_vid', vid);
      }
      var path = (location.pathname || '/').replace(/\/index\.html$/, '/') || '/';
      // Keep the ?id= on event/post pages so each one can be measured
      // individually in Content Studio's per-post analytics.
      var id = new URLSearchParams(location.search).get('id');
      if (id && /(event|post)\.html$/.test(location.pathname)) path += '?id=' + id;
      Promise.resolve(sb.from('page_views').insert({ path: path, visitor_id: vid })).catch(function () {});
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
