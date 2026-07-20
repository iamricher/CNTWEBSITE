#!/usr/bin/env node
/**
 * CNT ATS — résumé parser tests.
 *
 * Digitize reads whatever CV an applicant happens to upload, and every résumé
 * lays its sections out differently. The old parser gave each section its own
 * regex listing the headings that could follow it, so an unlisted heading
 * ("EMPLOYMENT RECORD") silently produced an empty field — Work Experience in
 * particular kept coming back blank.
 *
 * These tests pin the section splitter against the layouts we actually see,
 * so a future tweak can't quietly go back to dropping sections.
 *
 * The parser lives inside ats.html (single-file app, no build step), so we
 * lift the relevant block out of the file and evaluate it here.
 *
 * Usage: node scripts/test-resume-parser.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'ats.html'), 'utf8');

const START = '  const _SEC_PATTERNS=[';
const END   = '  // Fields Digitize can fill.';
const from = html.indexOf(START);
const to   = html.indexOf(END, from);
if (from < 0 || to < 0) {
  console.error('Could not locate the parser block in ats.html — did the markers move?');
  process.exit(1);
}
const src = html.slice(from, to);

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(src + '\n;this._parseResume=_parseResume;this._splitSections=_splitSections;', sandbox);
const { _parseResume, _splitSections } = sandbox;

let failures = 0, checks = 0;
const ok   = n      => { checks++; console.log('  \x1b[32m✓\x1b[0m ' + n); };
const fail = (n, w) => { checks++; failures++; console.log('  \x1b[31m✗\x1b[0m ' + n + '\n      ' + w); };
function has(name, got, needle) {
  const g = String(got || '');
  g.toLowerCase().includes(String(needle).toLowerCase())
    ? ok(name)
    : fail(name, 'expected to contain ' + JSON.stringify(needle) + ', got ' + JSON.stringify(g.slice(0, 120)));
}
function empty(name, got) {
  !String(got || '').trim() ? ok(name) : fail(name, 'expected empty, got ' + JSON.stringify(String(got).slice(0, 120)));
}

// ── 1. A typical Philippine BPO résumé ─────────────────────────
console.log('\nTypical PH résumé (all-caps headings)');
const ph = `MARIA C. SANTOS
San Carlos City, Pangasinan
maria.santos@gmail.com | 0917 555 1234

OBJECTIVE
To secure a customer service role where I can apply six years of BPO experience.

WORK EXPERIENCE
Team Leader, Acme BPO Inc. (2020 - 2024)
 - Handled a team of 15 agents for a US telco account.
Customer Service Representative, Beta Solutions (2018 - 2020)
 - Voice support for billing enquiries.

EDUCATIONAL BACKGROUND
Bachelor of Science in Information Technology 2016 - 2020
Pangasinan State University - San Carlos City, Pangasinan

CERTIFICATIONS
TESDA National Certificate II - Contact Center Services (2018)
Civil Service Professional Eligibility (2019)

SEMINARS ATTENDED
Customer Experience Summit, Manila (2022)
Leadership Bootcamp, Acme BPO (2021)

AWARDS AND RECOGNITION
Top Performing Team Leader, Q3 2022

SKILLS
Zendesk, Salesforce, MS Office, typing 55 wpm

LANGUAGES
English, Filipino, Ilocano

CHARACTER REFERENCES
Juan Dela Cruz - Operations Manager, Acme BPO - 0918 222 3333
`;
let r = _parseResume(ph);
has('work experience captured',      r.experience,      'Team Leader, Acme BPO');
has('experience keeps second job',   r.experience,      'Beta Solutions');
has('education captured',            r.education,       'Bachelor of Science in Information Technology');
has('certifications captured',       r.certifications,  'TESDA National Certificate');
has('seminars captured',             r.seminars,        'Customer Experience Summit');
has('awards captured',               r.awards,          'Top Performing Team Leader');
has('skills captured',               r.skills,          'Zendesk');
has('languages captured',            r.languages,       'Ilocano');
has('character references captured', r.char_references, 'Juan Dela Cruz');
has('summary captured',              r.summary,         'six years of BPO experience');
has('email found',                   r.email,           'maria.santos@gmail.com');
has('phone found',                   r.phone,           '0917');
has('degree inferred',               r.degree,          'Bachelor');
// sections must not bleed into one another
if (!/TESDA/i.test(r.education)) ok('education stops before certifications');
else fail('education stops before certifications', 'education swallowed the certifications block');
if (!/OBJECTIVE|Bachelor/i.test(r.experience)) ok('experience does not swallow neighbours');
else fail('experience does not swallow neighbours', r.experience.slice(0, 120));

// ── 2. The layout that used to break it ────────────────────────
console.log('\nUnusual headings (the case that returned blank before)');
const alt = `EMPLOYMENT RECORD
Sales Associate, Metro Retail (2019 - 2023)

ACADEMIC QUALIFICATIONS
BS Business Administration, Palaris Colleges, 2015 - 2019

TRAININGS
Basic Occupational Safety and Health (2021)

LICENSES
PRC Licensed Professional Teacher (2020)
`;
r = _parseResume(alt);
has('EMPLOYMENT RECORD → experience',   r.experience,     'Metro Retail');
has('ACADEMIC QUALIFICATIONS → edu',    r.education,      'Palaris Colleges');
has('TRAININGS → seminars',             r.seminars,       'Occupational Safety');
has('LICENSES → certifications',        r.certifications, 'PRC Licensed');

// ── 3. Title-case headings with colons ─────────────────────────
console.log('\nTitle-case headings with colons');
const colon = `Work Experience:
Barista, Coffee Shop (2022 - 2024)

Education:
Senior High School, Palaris Colleges, 2022

Skills:
Latte art, POS systems
`;
r = _parseResume(colon);
has('colon heading → experience', r.experience, 'Barista');
has('colon heading → education',  r.education,  'Senior High School');
has('colon heading → skills',     r.skills,     'Latte art');

// ── 4. Résumé typed entirely in capitals ───────────────────────
// Every line looks like a heading here; the caps heuristic must switch off
// rather than shredding the document into empty sections.
console.log('\nAll-caps résumé (caps heuristic must disengage)');
const caps = `WORK EXPERIENCE
AGENT, CONCENTRIX (2021 - 2024)
HANDLED INBOUND CALLS FOR A RETAIL ACCOUNT
EDUCATION
BS PSYCHOLOGY, UNIVERSITY OF PANGASINAN
`;
r = _parseResume(caps);
has('all-caps: experience survives', r.experience, 'CONCENTRIX');
has('all-caps: education survives',  r.education,  'PSYCHOLOGY');

// ── 5. Missing sections stay empty (no false positives) ────────
console.log('\nAbsent sections stay empty');
const bare = `Juan Dela Cruz
juan@example.com

WORK EXPERIENCE
Rider, FoodPanda (2023 - 2024)
`;
r = _parseResume(bare);
has('present section captured', r.experience, 'FoodPanda');
empty('no certifications invented', r.certifications);
empty('no seminars invented',       r.seminars);
empty('no awards invented',         r.awards);
empty('no references invented',     r.char_references);

// ── 6. Degree inference must not read skills as qualifications ─
// "MS Office" is on almost every PH BPO résumé and used to be detected as a
// master's degree, because the matcher scanned the whole document.
console.log('\nDegree inference');
r = _parseResume(`EDUCATION
Bachelor of Science in Information Technology, PSU, 2020

SKILLS
MS Office, MS Excel, MS Teams
`);
r.degree === 'Bachelor' ? ok('"MS Office" does not become a master\'s degree')
                        : fail('"MS Office" does not become a master\'s degree', 'got ' + r.degree);

r = _parseResume('EDUCATION\nMaster of Arts in Education, PNU, 2021\n');
r.degree === 'Master' ? ok('a real master\'s is still detected')
                      : fail('a real master\'s is still detected', 'got ' + r.degree);

r = _parseResume('EDUCATION\nM.S. in Psychology, UST, 2019\n');
r.degree === 'Master' ? ok('abbreviated M.S. is detected')
                      : fail('abbreviated M.S. is detected', 'got ' + r.degree);

r = _parseResume('EDUCATION\nSenior High School, Palaris Colleges, 2022\n\nSKILLS\nMS Word\n');
r.degree === 'High School' ? ok('high school not inflated by skills list')
                           : fail('high school not inflated by skills list', 'got ' + r.degree);

// ── 7. Junk input must not throw ───────────────────────────────
console.log('\nDefensive');
for (const junk of ['', '   ', 'no headings here at all, just prose about nothing']) {
  try { _parseResume(junk); ok('survives ' + JSON.stringify(junk.slice(0, 24))); }
  catch (e) { fail('survives ' + JSON.stringify(junk.slice(0, 24)), e.message); }
}

console.log('\n' + '─'.repeat(52));
if (failures) {
  console.log('\x1b[31m' + failures + ' of ' + checks + ' checks FAILED\x1b[0m\n');
  process.exit(1);
}
console.log('\x1b[32mAll ' + checks + ' checks passed\x1b[0m\n');
