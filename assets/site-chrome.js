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

  // Click-to-chat channels. Fill in the handles to enable each one; empty = hidden.
  //   messenger : 'https://m.me/<your-page-username>'
  //   whatsapp  : 'https://wa.me/639XXXXXXXXX'
  //   viber     : 'viber://chat?number=%2B639XXXXXXXXX'
  //   phone     : 'tel:+639XXXXXXXXX'
  var CHAT = {
    facebook:  'https://cntpromoandads.odoo.com/website/social/facebook',
    messenger: '',
    whatsapp:  '',
    viber:     '',
    phone:     ''
  };
  var CHAT_SVG = {
    open: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 01-9 8.4 9.6 9.6 0 01-3-.5L3 21l1.6-4.5A8.4 8.4 0 1121 11.5z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.8 3.7-3.8 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0022 12z"/></svg>',
    messenger: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.3 2 2 6.2 2 11.6c0 2.9 1.3 5.4 3.4 7.1V22l3.1-1.7c.8.2 1.6.3 2.5.3 5.7 0 10-4.2 10-9.6S17.7 2 12 2zm1 12.9l-2.6-2.7-4.9 2.7 5.4-5.7 2.6 2.7 4.8-2.7-5.3 5.7z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.5 15.2L2 22l4.9-1.4A10 10 0 1012 2zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.2-3.7-.8-3.1-1.3-5.1-4.5-5.3-4.7-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1.1-2.5c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.3.6 1 1.3 1.6.9.8 1.6 1 1.9 1.2.2.1.4.1.5-.1l.7-.8c.2-.2.3-.2.5-.1l1.9 1c.2.1.4.2.4.3.1.2.1.8-.1 1.6z"/></svg>',
    viber: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7 2 3 5.4 3 9.8c0 2.2 1 4.2 2.7 5.6v3.2l3-1.7c.4.1.9.1 1.3.1 5 0 9-3.4 9-7.8S17 2 12 2zm4.9 11.5c-.2.5-1 .9-1.4 1-.4 0-.4.3-2.6-.6-2.1-.9-3.3-3-3.4-3.2-.1-.1-.8-1-.8-2s.5-1.4.7-1.6c.2-.2.4-.2.5-.2h.4c.1 0 .3 0 .5.4l.6 1.5c.1.1 0 .3 0 .4l-.3.4c-.1.2-.2.2-.1.4.1.2.5.9 1.1 1.4.6.5 1.1.7 1.3.8.2.1.3.1.4-.1l.5-.6c.2-.2.3-.1.5-.1l1.3.7c.2.1.3.1.4.2 0 .2 0 .7-.1 1.2z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.5-1.1a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z"/></svg>'
  };

  function navHTML(active, base, overlay) {
    var a = active || '';
    // base is '' on the homepage (same-page anchors) or 'index.html' on sub-pages.
    var h = function (hash) { return base + '#' + hash; };
    return '' +
    '<nav class="nav' + (overlay ? ' nav-overlay' : '') + '" id="nav" role="navigation" aria-label="Main navigation">' +
    '  <div class="nav-container">' +
    '    <a href="' + (base || 'index.html') + '" class="nav-logo" aria-label="CNT Home"><img src="' + LOGO + '" alt="CNT Promo & Ads Specialists, Inc." /></a>' +
    '    <ul class="nav-links" role="list">' +
    '      <li><a href="' + h('about') + '" class="nav-link">About</a></li>' +
    '      <li class="nav-dropdown">' +
    '        <a href="' + h('services') + '" class="nav-link">Services' +
    '          <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' +
    '        </a>' +
    '        <div class="mega-menu"><div class="mega-inner">' +
    '          <div class="mega-col"><span class="mega-label">Staffing</span>' +
    '            <a href="' + h('services') + '">Executive Search</a><a href="' + h('services') + '">Mass Hiring</a><a href="' + h('services') + '">Contractual Staffing</a></div>' +
    '          <div class="mega-col"><span class="mega-label">Corporate</span>' +
    '            <a href="' + h('services') + '">HR Outsourcing</a><a href="' + h('services') + '">Payroll Management</a><a href="' + h('services') + '">Compliance Advisory</a></div>' +
    '          <div class="mega-col"><span class="mega-label">Solutions</span>' +
    '            <a href="' + h('services') + '">Training &amp; Development</a><a href="' + h('services') + '">Background Screening</a><a href="' + h('services') + '">Workforce Consulting</a></div>' +
    '        </div></div>' +
    '      </li>' +
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
    '        <a href="https://cntpromoandads.odoo.com/website/social/facebook" class="social-link" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>' +
    '        <a href="https://www.linkedin.com/in/cnt-promo-and-ads-specialists-inc-24b7633a7/" class="social-link" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>' +
    '        <a href="#" class="social-link" aria-label="Tiktok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>' +
    '      </div>' +
    '    </div>' +
    '    <div class="footer-col"><h5>Services</h5><ul>' +
    '      <li><a href="' + h('services') + '">Executive Search</a></li><li><a href="' + h('services') + '">Mass &amp; Bulk Hiring</a></li>' +
    '      <li><a href="' + h('services') + '">HR Outsourcing</a></li><li><a href="' + h('services') + '">Contractual Staffing</a></li>' +
    '      <li><a href="' + h('services') + '">Background Screening</a></li><li><a href="' + h('services') + '">Training &amp; Development</a></li></ul></div>' +
    '    <div class="footer-col"><h5>Industries</h5><ul>' +
    '      <li><a href="' + h('industries') + '">Banking &amp; Finance</a></li><li><a href="' + h('industries') + '">Healthcare</a></li>' +
    '      <li><a href="' + h('industries') + '">Government</a></li><li><a href="' + h('industries') + '">Technology</a></li>' +
    '      <li><a href="' + h('industries') + '">Retail &amp; FMCG</a></li><li><a href="' + h('industries') + '">Logistics</a></li></ul></div>' +
    '    <div class="footer-col"><h5>Company</h5><ul>' +
    '      <li><a href="' + h('about') + '">About Us</a></li><li><a href="' + h('projects') + '">Success Stories</a></li>' +
    '      <li><a href="careers.html">Careers</a></li><li><a href="' + h('contact') + '">Contact</a></li></ul>' +
    '      <h5 style="margin-top:1.75rem">Stay Updated</h5>' +
    '      <div class="newsletter-form"><input type="email" id="nl-email" placeholder="Your email" aria-label="Newsletter email" /><button id="nl-btn" aria-label="Subscribe">&rarr;</button></div>' +
    '      <p id="nl-msg" style="font-size:.78rem;color:rgba(255,255,255,.5);margin-top:8px;min-height:1em"></p>' +
    '    </div>' +
    '  </div></div></div>' +
    '  <div class="footer-bottom"><div class="container">' +
    '    <p>&copy; ' + YEAR + ' CNT Promo &amp; Ads Specialists, Inc. All rights reserved.</p>' +
    '    <div class="footer-bottom-links"><a href="#">Privacy Policy</a><a href="#">Terms of Service</a><a href="events-admin.html">Content Admin</a></div>' +
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
    wireChat();
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

  // Floating click-to-chat button (Messenger / WhatsApp / Viber / FB / Call).
  function wireChat() {
    if (document.querySelector('.cnt-chat')) return;
    var order = [
      { k: 'messenger', label: 'Messenger', color: '#0084FF' },
      { k: 'whatsapp',  label: 'WhatsApp',  color: '#25D366' },
      { k: 'viber',     label: 'Viber',     color: '#7360F2' },
      { k: 'facebook',  label: 'Facebook',  color: '#1877F2' },
      { k: 'phone',     label: 'Call us',   color: '#DC2626' }
    ];
    var items = order.filter(function (d) { return CHAT[d.k]; });
    if (!items.length) return;
    var wrap = document.createElement('div');
    wrap.className = 'cnt-chat';
    wrap.innerHTML =
      '<button class="cnt-chat-fab" aria-label="Chat with us" aria-expanded="false">' +
        '<span class="ic-open">' + CHAT_SVG.open + '</span><span class="ic-close">' + CHAT_SVG.close + '</span>' +
      '</button>' +
      '<div class="cnt-chat-menu">' + items.map(function (d) {
        return '<a class="cnt-chat-item" href="' + CHAT[d.k] + '" target="_blank" rel="noopener">' +
          '<span class="cnt-chat-ico" style="background:' + d.color + '">' + CHAT_SVG[d.k] + '</span>' + d.label + '</a>';
      }).join('') + '</div>';
    document.body.appendChild(wrap);
    var fab = wrap.querySelector('.cnt-chat-fab');
    fab.addEventListener('click', function () {
      var open = wrap.classList.toggle('open');
      fab.setAttribute('aria-expanded', open);
    });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) { wrap.classList.remove('open'); fab.setAttribute('aria-expanded', 'false'); } });
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
      Promise.resolve(sb.from('page_views').insert({ path: path, visitor_id: vid })).catch(function () {});
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
