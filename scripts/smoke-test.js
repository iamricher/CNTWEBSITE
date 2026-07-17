#!/usr/bin/env node
/**
 * CNT ATS — static smoke tests.
 *
 * The apps are single-file HTML with no build step, so nothing catches a typo
 * until it explodes in someone's browser. This runs the checks that have
 * actually caught real bugs during development:
 *
 *   1. every inline <script> parses
 *   2. required elements still exist (catches accidental deletions)
 *   3. every onclick/onchange handler points at a function that exists
 *   4. no secrets committed (service_role key, .env values)
 *   5. privacy + anti-spam controls are still on the public form
 *
 * Usage: node scripts/smoke-test.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let failures = 0;
let checks = 0;

function ok(name)        { checks++; console.log('  \x1b[32m✓\x1b[0m ' + name); }
function fail(name, why) { checks++; failures++; console.log('  \x1b[31m✗\x1b[0m ' + name + '\n      ' + why); }
function read(f)         { return fs.readFileSync(path.join(ROOT, f), 'utf8'); }
function inlineScripts(html) {
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  const out = []; let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

// ── 1. inline scripts parse ────────────────────────────────────
console.log('\nParsing inline scripts');
for (const file of ['ats.html', 'careers.html', 'index.html']) {
  let html;
  try { html = read(file); } catch { continue; }          // index.html is optional
  const scripts = inlineScripts(html);
  let bad = 0;
  scripts.forEach((code, i) => {
    try { new Function(code); }
    catch (e) { bad++; fail(file + ' script #' + (i + 1) + ' parses', e.message); }
  });
  if (!bad) ok(file + ' — ' + scripts.length + ' inline script(s) parse');
}

// ── 2. required elements still present ─────────────────────────
console.log('\nRequired elements');
const ats = read('ats.html');
const REQUIRED_IDS = [
  'view-dashboard', 'view-request', 'view-applications', 'view-job',
  'view-reports', 'view-settings',
  'dash-kpis', 'chart-by-position', 'chart-by-client', 'chart-by-stage',
  'chart-by-type', 'dash-candidate-list',
  'pipeline-filter-bar', 'pipeline-filters', 'filter-source',
  'filter-role', 'filter-location', 'filter-stage', 'client-dropdown-wrap',
  'job-facets', 'job-cards-container',
  'applications-list-container', 'applications-kanban-container',
  'set-list-client', 'set-list-position', 'set-list-location',
  'resume-modal', 'crud-modal', 'job-modal', 'interview-modal',
];
const missing = REQUIRED_IDS.filter(id => !ats.includes('id="' + id + '"'));
missing.length ? fail('all required ids present', 'missing: ' + missing.join(', '))
               : ok('all ' + REQUIRED_IDS.length + ' required ids present');

// ── 3. inline handlers resolve to real functions ───────────────
console.log('\nInline handlers resolve');
for (const file of ['ats.html', 'careers.html']) {
  let html; try { html = read(file); } catch { continue; }
  const called = new Set();
  const re = /\bon(?:click|change|submit|input)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(html))) {
    const fnRe = /(?:^|[^.\w])([A-Za-z_$][\w$]*)\s*\(/g;
    let f;
    while ((f = fnRe.exec(m[1]))) called.add(f[1]);
  }
  // things provided by the browser / libraries, not by us
  const BUILTIN = new Set(['event','this','if','return','var','let','const','alert','confirm',
    'window','document','console','String','Number','Boolean','Array','Object','JSON','Math','Date',
    'parseInt','parseFloat','setTimeout','encodeURI','encodeURIComponent','print','open','remove']);
  const defined = name =>
    new RegExp('function\\s+' + name + '\\s*\\(').test(html) ||
    new RegExp('(?:window\\.)?' + name + '\\s*=\\s*(?:async\\s*)?function').test(html) ||
    new RegExp('(?:const|let|var)\\s+' + name + '\\s*=').test(html) ||
    new RegExp('window\\.' + name + '\\s*=').test(html);
  const unresolved = [...called].filter(n => !BUILTIN.has(n) && !defined(n));
  unresolved.length ? fail(file + ' — handlers resolve', 'undefined: ' + unresolved.join(', '))
                    : ok(file + ' — all ' + called.size + ' handler function(s) defined');
}

// ── 4. no secrets committed ────────────────────────────────────
// Scan for real secret VALUES, not the words. Comments legitimately mention
// "service_role" to warn against using it — that must not trip the check.
console.log('\nSecret scan');
const stripComments = s => s
  .replace(/\/\*[\s\S]*?\*\//g, '')      // /* block */
  .replace(/(^|[^:])\/\/.*$/gm, '$1');   // // line  (leaves https:// intact)
const SECRET_PATTERNS = [
  [/sb_secret_[\w-]+/,                                   'Supabase secret key value'],
  [/eyJ[\w-]+\.[\w-]{30,}\.[\w-]+/,                      'JWT-looking secret value'],
  [/service_role\s*[:=]\s*['"][^'"]+['"]/i,              'service_role key assigned'],
  [/(?:SERVICE_ROLE|SECRET_KEY)\s*=\s*['"][^'"]+['"]/,   'secret assigned to a global'],
];
let leaked = [];
for (const file of ['ats.html', 'careers.html', 'assets/supabase-config.js']) {
  let src; try { src = stripComments(read(file)); } catch { continue; }
  for (const [re, label] of SECRET_PATTERNS) if (re.test(src)) leaked.push(file + ': ' + label);
}
leaked.length ? fail('no secrets in client code', leaked.join('; '))
              : ok('no service_role / secret key values in client code');

// ── 5. privacy + anti-spam controls on the public form ─────────
console.log('\nPublic form safeguards');
const careers = read('careers.html');
const SAFEGUARDS = [
  [/name="consent"/,          'consent checkbox'],
  [/RA 10173/,                'RA 10173 privacy notice'],
  [/name="company_website"/,  'honeypot field'],
  [/consent_at/,              'consent timestamp recorded'],
  [/cnt_last_apply/,          'submission throttle'],
];
const gone = SAFEGUARDS.filter(([re]) => !re.test(careers)).map(([, l]) => l);
gone.length ? fail('privacy/anti-spam controls present', 'missing: ' + gone.join(', '))
            : ok('all ' + SAFEGUARDS.length + ' privacy/anti-spam controls present');

// ── summary ────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(52));
if (failures) {
  console.log('\x1b[31m' + failures + ' of ' + checks + ' checks FAILED\x1b[0m\n');
  process.exit(1);
}
console.log('\x1b[32mAll ' + checks + ' checks passed\x1b[0m\n');
