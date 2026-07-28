#!/usr/bin/env node
/**
 * Live RLS boundary tests (audit #7).
 *
 * The other suites check schema.sql *text*; this one hits the real PostgREST
 * endpoint with the public anon key and asserts the security boundary actually
 * holds. It only ever makes calls that are REJECTED or READ-ONLY, so it never
 * creates data in production.
 *
 * Verifies:
 *   - anon may NOT insert a pre-approved / non-'new' application  (audit #2)
 *   - anon may NOT read applications or the taxonomy table        (PII isolation)
 *   - anon MAY call cnt_taxonomy_options (the client dropdown feed)
 *
 * Usage: node scripts/test-rls-anon.js
 * (Reads the URL + anon key from assets/supabase-config.js.)
 */
const fs = require('fs');
const path = require('path');

const cfg = fs.readFileSync(path.join(__dirname, '..', 'assets', 'supabase-config.js'), 'utf8');
const URL = (cfg.match(/SUPABASE_URL\s*=\s*'([^']+)'/) || [])[1];
const KEY = (cfg.match(/SUPABASE_ANON_KEY\s*=\s*'([^']+)'/) || [])[1];
if (!URL || !KEY) { console.error('Could not read Supabase URL/anon key from config'); process.exit(1); }

let failures = 0, checks = 0;
const ok   = n      => { checks++; console.log('  \x1b[32m✓\x1b[0m ' + n); };
const fail = (n, w) => { checks++; failures++; console.log('  \x1b[31m✗\x1b[0m ' + n + '\n      ' + w); };
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' };

async function post(pathname, body) {
  const res = await fetch(URL + pathname, { method: 'POST', headers: H, body: JSON.stringify(body) });
  return { status: res.status, text: await res.text().catch(() => '') };
}
async function get(pathname) {
  const res = await fetch(URL + pathname, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
  let json = null; try { json = JSON.parse(await res.text()); } catch {}
  return { status: res.status, json };
}

(async () => {
  console.log('\nLive RLS boundary (anon key)');

  // 1. Injecting a pre-approved application must be REJECTED (audit #2).
  for (const bad of [
    { label: "stage='hired'",            row: { name: 'RLS Probe', email: 'rls-probe@example.invalid', stage: 'hired' } },
    { label: "client_status='approved'", row: { name: 'RLS Probe', email: 'rls-probe@example.invalid', client_status: 'approved' } },
    { label: 'endorsed_at preset',       row: { name: 'RLS Probe', email: 'rls-probe@example.invalid', endorsed_at: new Date().toISOString() } },
  ]) {
    const r = await post('/rest/v1/applications', bad.row);
    (r.status >= 400)
      ? ok('anon insert rejected — ' + bad.label + ' (HTTP ' + r.status + ')')
      : fail('anon insert rejected — ' + bad.label, 'expected 4xx, got HTTP ' + r.status + ' (a pre-set row may have been created!)');
  }

  // 2. anon must not read applicant PII.
  const apps = await get('/rest/v1/applications?select=id,email&limit=1');
  (apps.status === 200 && Array.isArray(apps.json) && apps.json.length === 0)
    ? ok('anon cannot read applications (0 rows)')
    : fail('anon cannot read applications', 'HTTP ' + apps.status + ' body ' + JSON.stringify(apps.json));

  // 3. anon must not read the taxonomy table directly (staff-only).
  const tax = await get('/rest/v1/taxonomy?select=name&limit=1');
  (tax.status >= 400 || (Array.isArray(tax.json) && tax.json.length === 0))
    ? ok('anon cannot read taxonomy table directly')
    : fail('anon cannot read taxonomy table', 'HTTP ' + tax.status + ' body ' + JSON.stringify(tax.json));

  // 4. anon MAY call the option-list RPC (feeds the client vacancy dropdowns).
  const rpc = await get('/rest/v1/rpc/cnt_taxonomy_options');
  (rpc.status === 200 && Array.isArray(rpc.json))
    ? ok('anon may call cnt_taxonomy_options (' + rpc.json.length + ' options)')
    : fail('anon may call cnt_taxonomy_options', 'HTTP ' + rpc.status + ' body ' + JSON.stringify(rpc.json));

  console.log('\n' + '─'.repeat(52));
  if (failures) { console.log('\x1b[31m' + failures + ' of ' + checks + ' checks FAILED\x1b[0m\n'); process.exit(1); }
  console.log('\x1b[32mAll ' + checks + ' checks passed\x1b[0m\n');
})().catch(e => { console.error('RLS test error:', e.message); process.exit(1); });
