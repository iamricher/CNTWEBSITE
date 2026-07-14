/* ============================================================
   CNT — shared Supabase configuration
   Used by BOTH  careers.html  and  ats.html
   ------------------------------------------------------------
   HOW TO FILL THIS IN (one time):
   1. Create a free project at https://supabase.com
   2. Project → Settings → API
   3. Copy "Project URL"        → SUPABASE_URL below
   4. Copy the "anon public" key → SUPABASE_ANON_KEY below
   (The anon key is safe to publish — Row Level Security protects the data.
    NEVER put the "service_role" key here.)
   ============================================================ */

window.SUPABASE_URL      = 'https://mtaknpmvvldmnsizvtuy.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_GYmTJWeUriWXjFkO9j2J7w_cwJNV0Au';

/* --- do not edit below --------------------------------------------------- */
window.SUPABASE_READY =
  !!window.SUPABASE_URL &&
  window.SUPABASE_URL.indexOf('YOUR-PROJECT-ID') === -1 &&
  !!window.SUPABASE_ANON_KEY &&
  window.SUPABASE_ANON_KEY.indexOf('YOUR-ANON') === -1;

window.getSupabase = function () {
  if (!window.SUPABASE_READY) return null;
  if (!window.supabase || !window.supabase.createClient) return null;
  if (!window._sbClient) {
    window._sbClient = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );
  }
  return window._sbClient;
};
