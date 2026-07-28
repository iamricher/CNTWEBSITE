/* ============================================================
   CNT — error monitoring (Sentry), shared by all pages.

   Inert until window.SENTRY_DSN is set in supabase-config.js. When a DSN is
   present it loads the Sentry browser SDK from jsDelivr (already allowed by the
   CSP) and initialises it, so production errors are captured instead of dying
   silently in the console. The DSN is a public URL — safe to embed.
   ============================================================ */
(function () {
  var dsn = window.SENTRY_DSN;
  if (!dsn) return;                       // monitoring off until configured
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@sentry/browser@8/build/bundle.min.js';
  s.crossOrigin = 'anonymous';
  s.onload = function () {
    try {
      window.Sentry.init({
        dsn: dsn,
        environment: 'production',
        release: 'cnt-ats',
        tracesSampleRate: 0,              // errors only — no performance tracing
        // Don't send applicant PII: scrub request bodies / large context.
        beforeSend: function (event) {
          if (event.request) delete event.request.data;
          return event;
        },
      });
    } catch (e) { /* never let monitoring break the app */ }
  };
  s.onerror = function () { /* offline / blocked — ignore */ };
  document.head.appendChild(s);
})();
