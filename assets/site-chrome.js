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

  function navHTML(active) {
    var a = active || '';
    return '' +
    '<nav class="nav" id="nav" role="navigation" aria-label="Main navigation">' +
    '  <div class="nav-container">' +
    '    <a href="index.html" class="nav-logo" aria-label="CNT Home"><img src="' + LOGO + '" alt="CNT Promo & Ads Specialists, Inc." /></a>' +
    '    <ul class="nav-links" role="list">' +
    '      <li><a href="index.html#about" class="nav-link">About</a></li>' +
    '      <li class="nav-dropdown">' +
    '        <a href="index.html#services" class="nav-link">Services' +
    '          <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' +
    '        </a>' +
    '        <div class="mega-menu"><div class="mega-inner">' +
    '          <div class="mega-col"><span class="mega-label">Staffing</span>' +
    '            <a href="index.html#services">Executive Search</a><a href="index.html#services">Mass Hiring</a><a href="index.html#services">Contractual Staffing</a></div>' +
    '          <div class="mega-col"><span class="mega-label">Corporate</span>' +
    '            <a href="index.html#services">HR Outsourcing</a><a href="index.html#services">Payroll Management</a><a href="index.html#services">Compliance Advisory</a></div>' +
    '          <div class="mega-col"><span class="mega-label">Solutions</span>' +
    '            <a href="index.html#services">Training &amp; Development</a><a href="index.html#services">Background Screening</a><a href="index.html#services">Workforce Consulting</a></div>' +
    '        </div></div>' +
    '      </li>' +
    '      <li><a href="index.html#industries" class="nav-link">Industries</a></li>' +
    '      <li><a href="index.html#projects" class="nav-link">Success Stories</a></li>' +
    '      <li><a href="index.html#events" class="nav-link' + (a === 'events' ? ' active' : '') + '">Events</a></li>' +
    '      <li><a href="careers.html" class="nav-link' + (a === 'careers' ? ' active' : '') + '">Careers</a></li>' +
    '    </ul>' +
    '    <div class="nav-actions">' +
    '      <a href="index.html#contact" class="btn-nav">Contact Us</a>' +
    '      <button class="nav-toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
    '    </div>' +
    '  </div>' +
    '</nav>' +
    '<div class="mobile-menu" id="mobileMenu" role="dialog" aria-label="Mobile navigation">' +
    '  <ul>' +
    '    <li><a href="index.html#about">About</a></li>' +
    '    <li><a href="index.html#services">Services</a></li>' +
    '    <li><a href="status.html">Track My Application</a></li>' +
    '    <li><a href="index.html#industries">Industries</a></li>' +
    '    <li><a href="index.html#projects">Success Stories</a></li>' +
    '    <li><a href="index.html#events">Events</a></li>' +
    '    <li><a href="careers.html">Careers</a></li>' +
    '    <li><a href="index.html#contact">Contact</a></li>' +
    '  </ul>' +
    '  <a href="careers.html" class="btn-primary mobile-cta">Apply Now</a>' +
    '  <a href="status.html" class="btn-ghost mobile-cta">Track My Application</a>' +
    '</div>';
  }

  function footerHTML() {
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
    '      <li><a href="index.html#services">Executive Search</a></li><li><a href="index.html#services">Mass &amp; Bulk Hiring</a></li>' +
    '      <li><a href="index.html#services">HR Outsourcing</a></li><li><a href="index.html#services">Contractual Staffing</a></li>' +
    '      <li><a href="index.html#services">Background Screening</a></li><li><a href="index.html#services">Training &amp; Development</a></li></ul></div>' +
    '    <div class="footer-col"><h5>Industries</h5><ul>' +
    '      <li><a href="index.html#industries">Banking &amp; Finance</a></li><li><a href="index.html#industries">Healthcare</a></li>' +
    '      <li><a href="index.html#industries">Government</a></li><li><a href="index.html#industries">Technology</a></li>' +
    '      <li><a href="index.html#industries">Retail &amp; FMCG</a></li><li><a href="index.html#industries">Logistics</a></li></ul></div>' +
    '    <div class="footer-col"><h5>Company</h5><ul>' +
    '      <li><a href="index.html#about">About Us</a></li><li><a href="index.html#projects">Success Stories</a></li>' +
    '      <li><a href="careers.html">Careers</a></li><li><a href="index.html#contact">Contact</a></li></ul>' +
    '      <h5 style="margin-top:1.75rem">Stay Updated</h5>' +
    '      <div class="newsletter-form"><input type="email" placeholder="Your email" aria-label="Newsletter email" /><button aria-label="Subscribe">&rarr;</button></div>' +
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

  function init() {
    var header = document.getElementById('site-header');
    if (header) header.innerHTML = navHTML(header.getAttribute('data-active'));
    var footer = document.getElementById('site-footer');
    if (footer) footer.innerHTML = footerHTML();
    wireMobileMenu();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
