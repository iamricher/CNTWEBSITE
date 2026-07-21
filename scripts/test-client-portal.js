#!/usr/bin/env node
/**
 * CNT ATS — client portal guardrails.
 *
 * The one invariant the whole portal rests on: a client must never be able to
 * read applicant PII. RLS is row-level and cannot hide columns, so clients read
 * endorsed candidates ONLY through the cnt_client_candidates() function. The
 * fixed column list in that function body is the security boundary — this test
 * fails if a PII column ever appears in it, or if the function loses its
 * SECURITY DEFINER / status filter / account scoping.
 *
 * Usage: node scripts/test-client-portal.js
 */
const fs = require('fs');
const path = require('path');

let failures = 0, checks = 0;
const ok   = n      => { checks++; console.log('  \x1b[32m✓\x1b[0m ' + n); };
const fail = (n, w) => { checks++; failures++; console.log('  \x1b[31m✗\x1b[0m ' + n + '\n      ' + w); };

const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8');

// ── 1. The anonymised read path must expose no PII ─────────────
console.log('\nClient read path (cnt_client_candidates)');
const m = sql.match(/create\s+or\s+replace\s+function\s+public\.cnt_client_candidates[\s\S]*?\$\$;/i);
if (!m) {
  fail('cnt_client_candidates present in schema.sql', 'function not found');
} else {
  ok('cnt_client_candidates present');
  const body = m[0];
  const FORBIDDEN = ['name', 'email', 'phone', 'resume_url', 'linkedin', 'referred_by', 'referral_relation'];
  const leaked = FORBIDDEN.filter(c => new RegExp('\\b' + c + '\\b').test(body));
  leaked.length
    ? fail('no PII columns in client read path', 'found forbidden column(s): ' + leaked.join(', '))
    : ok('no PII columns (name/email/phone/resume_url/linkedin/referred_by) exposed');
  /security\s+definer/i.test(body)     ? ok('runs SECURITY DEFINER')                 : fail('SECURITY DEFINER', 'missing');
  /client_status\s+in\s*\(\s*'endorsed'/i.test(body) ? ok('filters to endorsed/approved/rejected') : fail('status filter', 'missing');
  /a\.client\s*=\s*public\.cnt_client_account\(\)/i.test(body) ? ok('scoped to the caller\'s client account') : fail('account scoping', 'missing');
}

// ── 2. The decision RPC must be gated ──────────────────────────
console.log('\nClient decision path (cnt_client_decide)');
const d = sql.match(/create\s+or\s+replace\s+function\s+public\.cnt_client_decide[\s\S]*?\$\$;/i);
if (!d) {
  fail('cnt_client_decide present', 'function not found');
} else {
  ok('cnt_client_decide present');
  const body = d[0];
  /security\s+definer/i.test(body)                 ? ok('runs SECURITY DEFINER')                  : fail('SECURITY DEFINER', 'missing');
  /cur\s*<>\s*'endorsed'/i.test(body)              ? ok('only decides from endorsed')             : fail('endorsed-only transition', 'missing');
  /decision\s+not\s+in\s*\(\s*'approved'\s*,\s*'rejected'\s*\)/i.test(body) ? ok('rejects invalid decisions') : fail('decision whitelist', 'missing');
  /client\s*=\s*acct/i.test(body)                  ? ok('scoped to the caller\'s account')        : fail('account scoping', 'missing');
}

// ── 3. Client cannot read applications directly ────────────────
console.log('\nNo direct client access to applications');
// The only applications policies should reference cnt_is_staff/cnt_is_manager or
// the public insert — never cnt_client_account. Clients go through the RPC only.
const appsPolicies = sql.match(/create policy[^;]*on public\.applications[^;]*;/gi) || [];
const clientOnApps = appsPolicies.filter(p => /cnt_client_account/i.test(p));
clientOnApps.length === 0
  ? ok('no applications policy grants clients direct access')
  : fail('no client policy on applications', 'found: ' + clientOnApps.join(' | '));

// ── 4. hiring_requests client insert is constrained ────────────
console.log('\nClient vacancy insert is constrained');
const hrInsert = (sql.match(/create policy[^;]*hr client insert[^;]*;/i) || [])[0] || '';
/client_submitted\s*=\s*true/i.test(hrInsert) && /status\s*=\s*'Pending'/i.test(hrInsert) && /account\s*=\s*public\.cnt_client_account\(\)/i.test(hrInsert)
  ? ok('client insert forced to own account, Pending, client_submitted')
  : fail('constrained client insert', 'policy: ' + (hrInsert || 'not found'));

console.log('\n' + '─'.repeat(52));
if (failures) {
  console.log('\x1b[31m' + failures + ' of ' + checks + ' checks FAILED\x1b[0m\n');
  process.exit(1);
}
console.log('\x1b[32mAll ' + checks + ' checks passed\x1b[0m\n');
