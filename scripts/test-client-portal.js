#!/usr/bin/env node
/**
 * CNT ATS — client portal guardrails (monitoring-only).
 *
 * Product decision (2026-08-17): the client portal is READ-ONLY monitoring.
 * Clients no longer endorse/approve/reject candidates and no longer file
 * vacancies. A client sees an ANONYMISED view of every applicant for their
 * account plus where each one is in the pipeline. So the invariants are:
 *   - the read path is SECURITY DEFINER, scoped to the caller's account, and
 *     selects NO direct identifiers (name/email/phone/CV) — anonymity is the
 *     crux and must be covered by a test;
 *   - the client write path (cnt_client_decide), the client CV access
 *     (cnt_client_can_read_cv + "resumes read client"), and client vacancy
 *     filing ("hr client insert"/"hr client read") are all GONE;
 *   - clients still have no direct policy on applications;
 *   - notifications remain RPC-only.
 *
 * Usage: node scripts/test-client-portal.js
 */
const fs = require('fs');
const path = require('path');

let failures = 0, checks = 0;
const ok   = n      => { checks++; console.log('  \x1b[32m✓\x1b[0m ' + n); };
const fail = (n, w) => { checks++; failures++; console.log('  \x1b[31m✗\x1b[0m ' + n + '\n      ' + w); };

const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8');

// ── 1. Read path: gated + anonymised + carries the stage ───────
console.log('\nClient read path (cnt_client_candidates)');
const m = sql.match(/create\s+or\s+replace\s+function\s+public\.cnt_client_candidates[\s\S]*?\$\$;/i);
if (!m) {
  fail('cnt_client_candidates present in schema.sql', 'function not found');
} else {
  ok('cnt_client_candidates present');
  const body = m[0];
  /security\s+definer/i.test(body)     ? ok('runs SECURITY DEFINER')                 : fail('SECURITY DEFINER', 'missing');
  /a\.client\s*=\s*public\.cnt_client_account\(\)/i.test(body) ? ok('scoped to the caller\'s client account') : fail('account scoping', 'missing');
  /public\.cnt_client_account\(\)\s+is\s+not\s+null/i.test(body) ? ok('returns nothing when caller is not a client') : fail('null-account guard', 'missing');
  // Anonymity: the SELECT must not expose any direct identifier or the CV path.
  const PII = [/\ba\.name\b/i, /\ba\.email\b/i, /\ba\.phone\b/i, /\ba\.linkedin\b/i, /\ba\.referred_by\b/i, /\ba\.resume_url\b/i, /\ba\.cover_note\b/i, /\ba\.proposed_salary\b/i];
  const leaked = PII.filter(re => re.test(body)).map(re => String(re));
  leaked.length === 0 ? ok('anonymised — selects no name/email/phone/CV/PII') : fail('anonymity', 'leaks: ' + leaked.join(', '));
  // Must NOT re-introduce the old endorsed-only decision filter.
  /client_status\s+in\s*\(/i.test(body) ? fail('no endorsement filter', 'still filters by client_status') : ok('no endorsement/decision filter (monitors whole pipeline)');
  // Carries where the candidate is.
  /stage_label/i.test(body) ? ok('returns the pipeline stage label') : fail('stage exposed', 'missing stage_label');
}

// ── 2. Stage list RPC for the tracker ──────────────────────────
console.log('\nClient stage list (cnt_client_stages)');
const st = sql.match(/create\s+or\s+replace\s+function\s+public\.cnt_client_stages[\s\S]*?\$\$;/i);
if (!st) {
  fail('cnt_client_stages present', 'function not found');
} else {
  ok('cnt_client_stages present');
  /security\s+definer/i.test(st[0]) ? ok('runs SECURITY DEFINER') : fail('SECURITY DEFINER', 'missing');
}

// ── 3. Retired client write + CV + vacancy paths are GONE ──────
console.log('\nRetired client paths are removed');
/create\s+or\s+replace\s+function\s+public\.cnt_client_decide/i.test(sql)
  ? fail('cnt_client_decide removed', 'still defined in schema.sql') : ok('cnt_client_decide is gone (clients decide nothing)');
/create\s+or\s+replace\s+function\s+public\.cnt_client_can_read_cv/i.test(sql)
  ? fail('cnt_client_can_read_cv removed', 'still defined') : ok('cnt_client_can_read_cv is gone (no client CV access)');
/create policy\s+"resumes read client"/i.test(sql)
  ? fail('resumes read client policy removed', 'still defined') : ok('no client CV storage policy');
/create policy[^;]*hr client insert/i.test(sql)
  ? fail('hr client insert removed', 'still defined') : ok('no client vacancy-insert policy');
/create policy[^;]*hr client read/i.test(sql)
  ? fail('hr client read removed', 'still defined') : ok('no client hiring_requests read policy');

// ── 4. Client cannot read applications directly ────────────────
console.log('\nNo direct client access to applications');
const appsPolicies = sql.match(/create policy[^;]*on public\.applications[^;]*;/gi) || [];
const clientOnApps = appsPolicies.filter(p => /cnt_client_account/i.test(p));
clientOnApps.length === 0
  ? ok('no applications policy grants clients direct access')
  : fail('no client policy on applications', 'found: ' + clientOnApps.join(' | '));

// ── 5. Notifications are reachable only through gated RPCs ─────
console.log('\nNotifications isolation (roadmap #7)');
/create table if not exists public\.notifications/i.test(sql)
  ? ok('notifications table present') : fail('notifications table present', 'not found');
/alter table public\.notifications enable row level security/i.test(sql)
  ? ok('notifications has RLS enabled') : fail('notifications RLS enabled', 'missing');
const notifPolicies = sql.match(/create policy[^;]*on public\.notifications[^;]*;/gi) || [];
notifPolicies.length === 0
  ? ok('no direct policies on notifications (RPC-only access)')
  : fail('notifications RPC-only', 'found policies: ' + notifPolicies.join(' | '));

const readFn = sql.match(/create\s+or\s+replace\s+function\s+public\.cnt_notifications\(/i);
readFn ? ok('cnt_notifications read RPC present') : fail('cnt_notifications present', 'not found');
const readBody = (sql.match(/create\s+or\s+replace\s+function\s+public\.cnt_notifications\([\s\S]*?\$\$;/i) || [])[0] || '';
/security\s+definer/i.test(readBody)                 ? ok('read RPC runs SECURITY DEFINER')                : fail('read RPC SECURITY DEFINER', 'missing');
/recipient_client\s*=\s*acct/i.test(readBody)        ? ok('clients scoped to their own account')           : fail('client scoping', 'missing');
/recipient_name\s+is\s+null\s+or\s+recipient_name\s*=\s*nm/i.test(readBody) ? ok('staff scoped to self or broadcast') : fail('staff scoping', 'missing');

const markFn = sql.match(/create\s+or\s+replace\s+function\s+public\.cnt_notifications_read\(/i);
markFn ? ok('cnt_notifications_read RPC present') : fail('cnt_notifications_read present', 'not found');
const trg = /create trigger cnt_app_notify_trg after update on public\.applications/i.test(sql);
trg ? ok('applications trigger creates notifications') : fail('cnt_app_notify_trg present', 'not found');

console.log('\n' + '─'.repeat(52));
if (failures) {
  console.log('\x1b[31m' + failures + ' of ' + checks + ' checks FAILED\x1b[0m\n');
  process.exit(1);
}
console.log('\x1b[32mAll ' + checks + ' checks passed\x1b[0m\n');
