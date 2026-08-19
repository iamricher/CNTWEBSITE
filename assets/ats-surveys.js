/* ============================================================
   CNT ATS — Interview surveys ("Send Interview", Odoo-style)
   ------------------------------------------------------------
   Staff build reusable questionnaires/tests, send a unique link to an
   applicant, and the applicant answers online at interview.html. Answers are
   auto-scored server-side (the answer key never leaves the DB — see
   supabase/2026-08-19-interview-surveys.sql).

   Self-contained: talks to Supabase via window.getSupabase() (the same
   authenticated staff session the ATS already holds) and reuses a couple of
   app globals (currentViewedApplicantId, findApplicant, showToast,
   cntLogActivity, cntUserName). Exposes:
     window.cntOpenSendSurvey()    — send/track forms for the open applicant
     window.cntOpenSurveyBuilder() — manage the reusable form templates
   ============================================================ */
(function () {
  'use strict';

  var ORIGIN = location.origin;
  function sb() { return (window.getSupabase && window.getSupabase()) || null; }
  function toast(m, t) { if (window.showToast) window.showToast(m, t || 'info'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function qid() { return 'q' + Math.random().toString(36).slice(2, 8); }
  function nowPlusDays(d) { var t = new Date(Date.now() + d * 864e5); t.setSeconds(0, 0); return t; }
  // value for <input type=datetime-local> in *local* time
  function toLocalInput(dt) {
    var p = function (n) { return String(n).padStart(2, '0'); };
    return dt.getFullYear() + '-' + p(dt.getMonth() + 1) + '-' + p(dt.getDate()) + 'T' + p(dt.getHours()) + ':' + p(dt.getMinutes());
  }
  function fmtDate(d) { try { return new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return d; } }

  // ── generic modal shell (Tailwind is available in ats.html) ──────────────
  function modal(title, icon, maxW) {
    document.getElementById('cnt-survey-modal') && document.getElementById('cnt-survey-modal').remove();
    var wrap = document.createElement('div');
    wrap.id = 'cnt-survey-modal';
    wrap.className = 'fixed inset-0 z-[320] flex items-center justify-center p-4 no-print';
    wrap.innerHTML =
      '<div class="absolute inset-0 bg-slate-900/50"></div>' +
      '<div class="relative bg-white w-full ' + (maxW || 'max-w-lg') + ' rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col" style="max-height:88vh;">' +
      '<div class="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-none">' +
      '<div class="flex items-center gap-2"><span class="material-icons-outlined" style="font-size:18px;color:#7f1d1d;">' + icon + '</span>' +
      '<span class="text-sm font-bold text-slate-900">' + esc(title) + '</span></div>' +
      '<button class="cnt-x text-slate-400 hover:text-slate-700 cursor-pointer"><span class="material-icons-outlined" style="font-size:20px;">close</span></button></div>' +
      '<div class="cnt-body p-5 overflow-y-auto"></div></div>';
    var close = function () { wrap.remove(); document.removeEventListener('keydown', onEsc); };
    function onEsc(e) { if (e.key === 'Escape') close(); }
    wrap.querySelector('.cnt-x').addEventListener('click', close);
    wrap.firstElementChild.addEventListener('click', close);
    document.addEventListener('keydown', onEsc);
    document.body.appendChild(wrap);
    return { root: wrap, body: wrap.querySelector('.cnt-body'), close: close };
  }

  var INPUT = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-800';
  var LABEL = 'block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1';
  var BTN_PRIMARY = 'bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed';
  var BTN_GHOST = 'text-slate-700 hover:bg-slate-100 px-3 py-2 rounded-lg text-xs font-semibold transition border border-slate-200 cursor-pointer inline-flex items-center gap-1.5';

  // ============================================================
  //  SEND / TRACK forms for the currently-open applicant
  // ============================================================
  window.cntOpenSendSurvey = function () {
    var app = (typeof findApplicant === 'function') ? findApplicant(currentViewedApplicantId) : null;
    if (!app) { toast('Open an applicant first.', 'info'); return; }
    if (!sb()) { toast('Not connected.', 'error'); return; }
    var m = modal('Send interview form — ' + (app.name || ''), 'quiz', 'max-w-xl');
    m.body.innerHTML = '<div class="text-center py-8 text-slate-400 text-sm">Loading…</div>';
    Promise.all([
      sb().from('interview_surveys').select('id,title,questions,job_role').eq('active', true).order('created_at', { ascending: false }),
      sb().from('interview_invites').select('*').eq('applicant_id', app._sid || -1).order('sent_at', { ascending: false })
    ]).then(function (r) {
      var surveys = (r[0] && r[0].data) || [];
      var invites = (r[1] && r[1].data) || [];
      renderSend(m, app, surveys, invites);
    }).catch(function () { m.body.innerHTML = '<div class="text-center py-8 text-red-600 text-sm">Could not load forms.</div>'; });
  };

  function renderSend(m, app, surveys, invites) {
    var role = app.role || '';
    // suggest a matching form first
    surveys.sort(function (a, b) { return (b.job_role && role && b.job_role.toLowerCase() === role.toLowerCase() ? 1 : 0) - (a.job_role && role && a.job_role.toLowerCase() === role.toLowerCase() ? 1 : 0); });
    var hist = invites.length ? invites.map(function (iv) { return inviteRow(iv); }).join('') :
      '<div class="text-xs text-slate-400 py-2">No forms sent yet.</div>';
    var opts = surveys.length
      ? surveys.map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.title) + (s.job_role ? ' · ' + esc(s.job_role) : '') + '</option>'; }).join('')
      : '';
    var noEmail = !app.email;
    m.body.innerHTML =
      '<div class="mb-5">' +
      '<div class="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Sent forms</div>' +
      '<div id="cnt-inv-list" class="flex flex-col gap-2">' + hist + '</div></div>' +
      '<div class="border-t border-slate-100 pt-4">' +
      '<div class="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-3">Send a new form</div>' +
      (surveys.length ?
        '<div class="grid grid-cols-1 gap-3">' +
        '<div><label class="' + LABEL + '">Form</label><select id="cnt-send-survey" class="' + INPUT + ' bg-white">' + opts + '</select></div>' +
        '<div><label class="' + LABEL + '">Answer deadline</label><input id="cnt-send-deadline" type="datetime-local" class="' + INPUT + '" value="' + toLocalInput(nowPlusDays(14)) + '">' +
        '<div class="text-[11px] text-slate-400 mt-1">Applicant must complete the form by this date. Leave for two weeks (default) or adjust.</div></div>' +
        (noEmail ? '<div class="text-[11px] rounded-lg px-3 py-2" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;">No email on file — the form will be created and you can copy the link to send manually.</div>' : '') +
        '</div>' +
        '<div class="flex items-center justify-between mt-4">' +
        '<button class="' + BTN_GHOST + '" onclick="cntOpenSurveyBuilder()"><span class="material-icons-outlined" style="font-size:15px;">tune</span> Manage forms</button>' +
        '<button id="cnt-send-go" class="' + BTN_PRIMARY + '"><span class="material-icons-outlined" style="font-size:15px;">send</span> ' + (noEmail ? 'Create link' : 'Send form') + '</button>' +
        '</div>'
        :
        '<div class="text-sm text-slate-500 mb-3">You haven’t built any interview forms yet.</div>' +
        '<button class="' + BTN_PRIMARY + '" onclick="cntOpenSurveyBuilder()"><span class="material-icons-outlined" style="font-size:15px;">add</span> Build your first form</button>'
      ) + '</div>';

    var go = document.getElementById('cnt-send-go');
    if (go) go.addEventListener('click', function () {
      var sid = document.getElementById('cnt-send-survey').value;
      var survey = surveys.find(function (s) { return String(s.id) === String(sid); });
      if (!survey) { toast('Pick a form first.', 'info'); return; }
      var dv = document.getElementById('cnt-send-deadline').value;
      var deadlineISO = dv ? new Date(dv).toISOString() : null;
      go.disabled = true; go.innerHTML = '<span class="material-icons-outlined animate-spin" style="font-size:15px;">progress_activity</span> Sending…';
      sendInvite(app, survey, deadlineISO).then(function (res) {
        // refresh the modal so the new invite shows in history
        window.cntOpenSendSurvey();
        if (res && res.link) copyLink(res.link, !!app.email);
      }).catch(function (e) {
        go.disabled = false; go.innerHTML = '<span class="material-icons-outlined" style="font-size:15px;">send</span> ' + (app.email ? 'Send form' : 'Create link');
        toast((e && e.message) || 'Could not send the form.', 'error');
      });
    });
  }

  function inviteRow(iv) {
    var link = ORIGIN + '/interview.html?t=' + iv.id;
    var st = iv.status, chip, tint;
    var expired = st === 'sent' && iv.deadline && new Date(iv.deadline) < new Date();
    if (st === 'submitted') { chip = 'Completed'; tint = 'background:#dcfce7;color:#166534;'; }
    else if (expired) { chip = 'Expired'; tint = 'background:#fef3c7;color:#92400e;'; }
    else { chip = 'Awaiting reply'; tint = 'background:#e0e7ff;color:#3730a3;'; }
    var score = (iv.status === 'submitted' && iv.max_score > 0)
      ? '<span class="text-[11px] font-bold text-slate-700">' + (+iv.score) + '/' + (+iv.max_score) +
        (iv.pass === true ? ' · <span style="color:#166534;">Pass</span>' : iv.pass === false ? ' · <span style="color:#b91c1c;">Below cut</span>' : '') + '</span>'
      : '';
    return '<div class="border border-slate-200 rounded-xl px-3 py-2.5">' +
      '<div class="flex items-center justify-between gap-2">' +
      '<div class="min-w-0"><div class="text-[13px] font-semibold text-slate-800 truncate">' + esc(iv.survey_title || 'Interview') + '</div>' +
      '<div class="text-[11px] text-slate-400">Sent ' + esc(fmtDate(iv.sent_at)) + (iv.deadline ? ' · due ' + esc(fmtDate(iv.deadline)) : '') + '</div></div>' +
      '<span class="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full flex-none" style="' + tint + '">' + chip + '</span>' +
      '</div>' +
      '<div class="flex items-center justify-between gap-2 mt-2">' + (score || '<span></span>') +
      '<div class="flex items-center gap-1.5">' +
      (iv.status === 'submitted' ? '<button class="text-[11px] font-semibold text-red-800 hover:underline cursor-pointer" onclick="cntViewSurveyAnswers(\'' + iv.id + '\')">View answers</button>' : '') +
      '<button class="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer" onclick="cntCopySurveyLink(\'' + esc(link) + '\')">Copy link</button>' +
      '</div></div></div>';
  }

  window.cntCopySurveyLink = function (link) { copyLink(link, false); };
  function copyLink(link, sent) {
    try {
      navigator.clipboard.writeText(link).then(function () { toast(sent ? 'Form sent — link also copied.' : 'Link copied to clipboard.', 'success'); },
        function () { prompt('Copy this interview link:', link); });
    } catch (e) { prompt('Copy this interview link:', link); }
  }

  function sendInvite(app, survey, deadlineISO) {
    var row = {
      survey_id: survey.id, survey_title: survey.title, questions: survey.questions || [],
      applicant_id: app._sid || null, applicant_name: app.name || null, applicant_email: app.email || null,
      deadline: deadlineISO, sent_by: window.cntUserName || null
    };
    return sb().from('interview_invites').insert(row).select('id').single().then(function (r) {
      if (r.error || !r.data) throw new Error((r.error && r.error.message) || 'Insert failed');
      var token = r.data.id, link = ORIGIN + '/interview.html?t=' + token;
      if (window.cntLogActivity) window.cntLogActivity(app, 'email', 'Interview form “' + (survey.title || '') + '” sent');
      if (!app.email) { toast('Interview form created — copy the link to send it.', 'success'); return { link: link, emailed: false }; }
      var deadlineTxt = deadlineISO ? ('\n\nPlease complete it by ' + fmtDate(deadlineISO) + '.') : '';
      var subject = 'Complete your interview' + (app.role ? ' for ' + app.role : '') + ' — CNT';
      var text = 'Dear ' + (app.name ? String(app.name).split(' ')[0] : 'Applicant') + ',\n\n' +
        'Thank you for your interest in joining CNT Promo & Ads Specialists, Inc. As part of our process, please complete this short interview form:\n\n' +
        link + deadlineTxt + '\n\nSimply open the link and answer the questions — it only takes a few minutes. Your responses go straight to our recruitment team.\n\n' +
        'Warm regards,\nCNT Recruitment Team';
      return sb().functions.invoke('send-email', { body: { to: app.email, subject: subject, text: text, kind: 'interview', applicant_ref: String(app._sid || app.id) } })
        .then(function (res) {
          if (res.error || (res.data && res.data.error)) { toast('Form created, but email failed to send — copy the link to send manually.', 'error'); return { link: link, emailed: false }; }
          toast('Interview form emailed to ' + app.email, 'success');
          return { link: link, emailed: true };
        });
    });
  }

  // ── view a submitted response ────────────────────────────────────────────
  window.cntViewSurveyAnswers = function (token) {
    sb().from('interview_invites').select('*').eq('id', token).single().then(function (r) {
      var iv = r && r.data; if (!iv) { toast('Could not load answers.', 'error'); return; }
      var m = modal('Answers — ' + (iv.applicant_name || ''), 'assignment_turned_in', 'max-w-xl');
      var qs = Array.isArray(iv.questions) ? iv.questions : [];
      var ans = iv.answers || {};
      var head = (iv.max_score > 0)
        ? '<div class="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100"><div class="text-2xl font-extrabold text-slate-900">' + (+iv.score) + '<span class="text-slate-400 text-lg">/' + (+iv.max_score) + '</span></div>' +
          '<div class="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full" style="' + (iv.pass === true ? 'background:#dcfce7;color:#166534;' : iv.pass === false ? 'background:#fee2e2;color:#b91c1c;' : 'background:#f1f5f9;color:#64748b;') + '">' + (iv.pass === true ? 'Pass' : iv.pass === false ? 'Below cut' : 'Scored') + '</div>' +
          '<div class="text-[11px] text-slate-400 ml-auto">Submitted ' + esc(fmtDate(iv.submitted_at)) + '</div></div>'
        : '<div class="text-[11px] text-slate-400 mb-4 pb-4 border-b border-slate-100">Submitted ' + esc(fmtDate(iv.submitted_at)) + '</div>';
      m.body.innerHTML = head + qs.map(function (q, i) { return answerBlock(q, i, ans[q.id != null ? q.id : ('q' + i)]); }).join('');
    });
  };

  function answerBlock(q, i, a) {
    var opts = Array.isArray(q.options) ? q.options : [];
    var correct = Array.isArray(q.correct) ? q.correct : null;
    var body = '';
    if (q.type === 'single' || q.type === 'multi') {
      var sel = (a && Array.isArray(a.selected)) ? a.selected : [];
      body = '<div class="flex flex-col gap-1 mt-1">' + opts.map(function (o, oi) {
        var chosen = sel.indexOf(oi) >= 0, isRight = correct && correct.indexOf(oi) >= 0;
        var ic = chosen ? (isRight ? '✓' : (correct ? '✗' : '•')) : (isRight ? '·' : '');
        var col = chosen ? (isRight ? '#166534' : (correct ? '#b91c1c' : '#334155')) : (isRight ? '#16a34a' : '#94a3b8');
        return '<div class="text-[13px] flex items-start gap-2" style="color:' + (chosen ? '#0f172a' : '#94a3b8') + ';font-weight:' + (chosen ? '600' : '400') + ';">' +
          '<span style="color:' + col + ';width:12px;flex:none;font-weight:700;">' + ic + '</span>' + esc(o) + (isRight && !chosen ? ' <span class="text-[10px] text-emerald-600 font-semibold">(correct)</span>' : '') + '</div>';
      }).join('') + '</div>';
    } else if (q.type === 'scale') {
      body = '<div class="text-[15px] font-bold text-slate-800 mt-1">' + (a && a.scale != null ? esc(a.scale) : '—') + (q.max ? ' <span class="text-xs text-slate-400 font-normal">/ ' + esc(q.max) + '</span>' : '') + '</div>';
    } else {
      body = '<div class="text-[13px] text-slate-700 mt-1 whitespace-pre-wrap bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">' + (a && a.text ? esc(a.text) : '<span class="text-slate-400">No answer</span>') + '</div>';
    }
    return '<div class="mb-4"><div class="text-[13px] font-semibold text-slate-800"><span class="text-red-800 font-extrabold mr-1">' + (i + 1) + '.</span>' + esc(q.text || '') + '</div>' + body + '</div>';
  }

  // ============================================================
  //  BUILDER — manage reusable form templates
  // ============================================================
  window.cntOpenSurveyBuilder = function () {
    if (!sb()) { toast('Not connected.', 'error'); return; }
    var m = modal('Interview forms', 'quiz', 'max-w-2xl');
    listSurveys(m);
  };

  function listSurveys(m) {
    m.body.innerHTML = '<div class="text-center py-8 text-slate-400 text-sm">Loading…</div>';
    sb().from('interview_surveys').select('*').order('created_at', { ascending: false }).then(function (r) {
      var surveys = (r && r.data) || [];
      var rows = surveys.length ? surveys.map(function (s) {
        var n = Array.isArray(s.questions) ? s.questions.length : 0;
        return '<div class="border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">' +
          '<div class="min-w-0"><div class="text-sm font-semibold text-slate-800 truncate">' + esc(s.title) + (s.active ? '' : ' <span class="text-[10px] text-slate-400 font-normal">(inactive)</span>') + '</div>' +
          '<div class="text-[11px] text-slate-400">' + n + ' question' + (n === 1 ? '' : 's') + (s.job_role ? ' · ' + esc(s.job_role) : '') + (s.pass_score != null ? ' · pass ' + s.pass_score + '%' : '') + '</div></div>' +
          '<div class="flex items-center gap-1.5 flex-none">' +
          '<button class="' + BTN_GHOST + '" onclick="cntEditSurvey(\'' + esc(s.id) + '\')"><span class="material-icons-outlined" style="font-size:15px;">edit</span> Edit</button>' +
          '<button class="text-slate-300 hover:text-red-600 cursor-pointer p-1" title="Delete" onclick="cntDeleteSurvey(\'' + esc(s.id) + '\',\'' + esc(String(s.title).replace(/'/g, '')) + '\')"><span class="material-icons-outlined" style="font-size:18px;">delete_outline</span></button>' +
          '</div></div>';
      }).join('') : '<div class="text-sm text-slate-400 py-6 text-center">No forms yet. Create one to send as an interview.</div>';
      m.body.innerHTML =
        '<div class="flex flex-col gap-2 mb-4">' + rows + '</div>' +
        '<button class="' + BTN_PRIMARY + '" onclick="cntEditSurvey(\'\')"><span class="material-icons-outlined" style="font-size:15px;">add</span> New form</button>';
      m._surveys = surveys;
    });
  }

  // draft model kept in memory; the editor re-renders from it
  var draft = null, draftModal = null;

  window.cntEditSurvey = function (id) {
    draftModal = modal(id ? 'Edit form' : 'New form', 'edit_note', 'max-w-2xl');
    if (!id) { draft = { title: '', description: '', job_role: '', pass_score: '', active: true, questions: [blankQ('single')] }; return renderEditor(); }
    sb().from('interview_surveys').select('*').eq('id', id).single().then(function (r) {
      var s = r && r.data; if (!s) { toast('Not found.', 'error'); return; }
      draft = {
        id: s.id, title: s.title || '', description: s.description || '', job_role: s.job_role || '',
        pass_score: (s.pass_score == null ? '' : s.pass_score), active: s.active !== false,
        questions: (Array.isArray(s.questions) && s.questions.length ? s.questions : [blankQ('single')]).map(fromDbQ)
      };
      renderEditor();
    });
  };

  function blankQ(type) { return { id: qid(), type: type, text: '', required: true, points: 1, options: [{ text: '', correct: false }, { text: '', correct: false }], max: 5, low: 'Low', high: 'High' }; }
  function fromDbQ(q) {
    var opts = [];
    if (Array.isArray(q.options)) { var cor = Array.isArray(q.correct) ? q.correct : []; opts = q.options.map(function (o, i) { return { text: o, correct: cor.indexOf(i) >= 0 }; }); }
    if ((q.type === 'single' || q.type === 'multi') && opts.length < 2) { while (opts.length < 2) opts.push({ text: '', correct: false }); }
    return { id: q.id || qid(), type: q.type || 'text', text: q.text || '', required: q.required !== false, points: q.points == null ? 1 : q.points, options: opts, max: q.max || 5, low: q.low || 'Low', high: q.high || 'High' };
  }

  var TYPES = [['single', 'Single choice'], ['multi', 'Multiple choice'], ['scale', 'Rating scale'], ['text', 'Free text']];

  function renderEditor() {
    var b = draftModal.body;
    b.innerHTML =
      '<div class="grid grid-cols-1 gap-3 mb-5">' +
      '<div><label class="' + LABEL + '">Form title</label><input id="d-title" class="' + INPUT + '" placeholder="e.g. Sales associate screening" value="' + esc(draft.title) + '"></div>' +
      '<div class="grid grid-cols-2 gap-3">' +
      '<div><label class="' + LABEL + '">For job role (optional)</label><input id="d-role" class="' + INPUT + '" placeholder="Suggests for matching applicants" value="' + esc(draft.job_role) + '"></div>' +
      '<div><label class="' + LABEL + '">Pass score % (optional)</label><input id="d-pass" type="number" min="0" max="100" class="' + INPUT + '" placeholder="e.g. 70" value="' + esc(draft.pass_score) + '"></div>' +
      '</div>' +
      '<div><label class="' + LABEL + '">Intro / instructions (optional)</label><input id="d-desc" class="' + INPUT + '" placeholder="Shown to the applicant above the questions" value="' + esc(draft.description) + '"></div>' +
      '</div>' +
      '<div class="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Questions</div>' +
      '<div id="d-questions" class="flex flex-col gap-3">' + draft.questions.map(renderQEditor).join('') + '</div>' +
      '<button class="' + BTN_GHOST + ' mt-3" onclick="cntSurveyAddQ()"><span class="material-icons-outlined" style="font-size:15px;">add</span> Add question</button>' +
      '<div class="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">' +
      '<label class="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer"><input id="d-active" type="checkbox" ' + (draft.active ? 'checked' : '') + ' class="accent-red-800"> Active (available to send)</label>' +
      '<div class="flex items-center gap-2"><button class="' + BTN_GHOST + '" onclick="cntOpenSurveyBuilder()">Cancel</button>' +
      '<button id="d-save" class="' + BTN_PRIMARY + '"><span class="material-icons-outlined" style="font-size:15px;">save</span> Save form</button></div>' +
      '</div>';
    // bind top fields
    bind('d-title', 'title'); bind('d-role', 'job_role'); bind('d-pass', 'pass_score'); bind('d-desc', 'description');
    document.getElementById('d-active').addEventListener('change', function (e) { draft.active = e.target.checked; });
    document.getElementById('d-save').addEventListener('click', saveDraft);
  }
  function bind(elId, key) { var el = document.getElementById(elId); if (el) el.addEventListener('input', function () { draft[key] = el.value; }); }

  function renderQEditor(q, i) {
    var isChoice = q.type === 'single' || q.type === 'multi';
    var typeSel = '<select class="d-q-type ' + INPUT + ' bg-white" data-i="' + i + '" style="max-width:170px;">' +
      TYPES.map(function (t) { return '<option value="' + t[0] + '"' + (q.type === t[0] ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select>';
    var opts = '';
    if (isChoice) {
      opts = '<div class="mt-2 flex flex-col gap-1.5">' + q.options.map(function (o, oi) {
        var mark = q.type === 'single' ? 'radio' : 'checkbox';
        return '<div class="flex items-center gap-2">' +
          '<label class="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase cursor-pointer flex-none" title="Mark as a correct answer">' +
          '<input type="' + mark + '" class="d-q-correct accent-emerald-600" data-i="' + i + '" data-oi="' + oi + '" ' + (o.correct ? 'checked' : '') + '> key</label>' +
          '<input class="d-q-opt ' + INPUT + '" data-i="' + i + '" data-oi="' + oi + '" placeholder="Option ' + (oi + 1) + '" value="' + esc(o.text) + '">' +
          (q.options.length > 2 ? '<button class="text-slate-300 hover:text-red-600 cursor-pointer flex-none" onclick="cntSurveyDelOpt(' + i + ',' + oi + ')"><span class="material-icons-outlined" style="font-size:16px;">close</span></button>' : '<span style="width:16px;flex:none;"></span>') +
          '</div>';
      }).join('') + '</div>' +
        '<div class="flex items-center gap-4 mt-2">' +
        '<button class="text-[11px] font-semibold text-red-800 hover:underline cursor-pointer" onclick="cntSurveyAddOpt(' + i + ')">+ Add option</button>' +
        '<label class="flex items-center gap-1.5 text-[11px] text-slate-500">Points <input type="number" min="0" class="d-q-points" data-i="' + i + '" value="' + esc(q.points) + '" style="width:52px;border:1px solid #e2e8f0;border-radius:6px;padding:2px 6px;"></label>' +
        '<span class="text-[10px] text-slate-400">Tick “key” on the correct option(s) to auto-score.</span>' +
        '</div>';
    } else if (q.type === 'scale') {
      opts = '<div class="grid grid-cols-3 gap-2 mt-2">' +
        '<div><label class="' + LABEL + '">Max (2–10)</label><input type="number" min="2" max="10" class="d-q-max ' + INPUT + '" data-i="' + i + '" value="' + esc(q.max) + '"></div>' +
        '<div><label class="' + LABEL + '">Low label</label><input class="d-q-low ' + INPUT + '" data-i="' + i + '" value="' + esc(q.low) + '"></div>' +
        '<div><label class="' + LABEL + '">High label</label><input class="d-q-high ' + INPUT + '" data-i="' + i + '" value="' + esc(q.high) + '"></div></div>';
    }
    return '<div class="border border-slate-200 rounded-xl p-3.5 bg-slate-50/40">' +
      '<div class="flex items-start gap-2">' +
      '<span class="text-red-800 font-extrabold text-sm mt-2 flex-none">' + (i + 1) + '.</span>' +
      '<div class="flex-1 min-w-0">' +
      '<input class="d-q-text ' + INPUT + ' font-semibold" data-i="' + i + '" placeholder="Question text" value="' + esc(q.text) + '">' +
      '<div class="flex items-center gap-2 mt-2 flex-wrap">' + typeSel +
      '<label class="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 cursor-pointer"><input type="checkbox" class="d-q-req accent-red-800" data-i="' + i + '" ' + (q.required ? 'checked' : '') + '> Required</label>' +
      (draft.questions.length > 1 ? '<button class="ml-auto text-slate-400 hover:text-red-600 cursor-pointer text-[11px] font-semibold inline-flex items-center gap-1" onclick="cntSurveyDelQ(' + i + ')"><span class="material-icons-outlined" style="font-size:15px;">delete_outline</span> Remove</button>' : '') +
      '</div>' + opts +
      '</div></div></div>';
  }

  // Pull current DOM values into the draft before any structural re-render,
  // so nothing typed is lost when adding/removing questions or options.
  function syncFromDom() {
    if (!draft) return;
    var b = draftModal.body;
    var t = document.getElementById('d-title'); if (t) draft.title = t.value;
    var r = document.getElementById('d-role'); if (r) draft.job_role = r.value;
    var p = document.getElementById('d-pass'); if (p) draft.pass_score = p.value;
    var d = document.getElementById('d-desc'); if (d) draft.description = d.value;
    b.querySelectorAll('.d-q-text').forEach(function (el) { draft.questions[+el.dataset.i].text = el.value; });
    b.querySelectorAll('.d-q-type').forEach(function (el) { draft.questions[+el.dataset.i].type = el.value; });
    b.querySelectorAll('.d-q-req').forEach(function (el) { draft.questions[+el.dataset.i].required = el.checked; });
    b.querySelectorAll('.d-q-points').forEach(function (el) { draft.questions[+el.dataset.i].points = el.value; });
    b.querySelectorAll('.d-q-opt').forEach(function (el) { draft.questions[+el.dataset.i].options[+el.dataset.oi].text = el.value; });
    b.querySelectorAll('.d-q-correct').forEach(function (el) { var q = draft.questions[+el.dataset.i]; q.options[+el.dataset.oi].correct = el.checked; });
    b.querySelectorAll('.d-q-max').forEach(function (el) { draft.questions[+el.dataset.i].max = el.value; });
    b.querySelectorAll('.d-q-low').forEach(function (el) { draft.questions[+el.dataset.i].low = el.value; });
    b.querySelectorAll('.d-q-high').forEach(function (el) { draft.questions[+el.dataset.i].high = el.value; });
  }

  window.cntSurveyAddQ = function () { syncFromDom(); draft.questions.push(blankQ('single')); renderEditor(); };
  window.cntSurveyDelQ = function (i) { syncFromDom(); draft.questions.splice(i, 1); renderEditor(); };
  window.cntSurveyAddOpt = function (i) { syncFromDom(); draft.questions[i].options.push({ text: '', correct: false }); renderEditor(); };
  window.cntSurveyDelOpt = function (i, oi) { syncFromDom(); draft.questions[i].options.splice(oi, 1); renderEditor(); };
  // when a question type changes, keep its data but re-render for the new controls
  document.addEventListener('change', function (e) {
    if (e.target && e.target.classList && e.target.classList.contains('d-q-type')) {
      syncFromDom(); draft.questions[+e.target.dataset.i].type = e.target.value;
      var q = draft.questions[+e.target.dataset.i];
      if ((q.type === 'single' || q.type === 'multi') && (!q.options || q.options.length < 2)) q.options = [{ text: '', correct: false }, { text: '', correct: false }];
      // single choice: keep at most one key
      if (q.type === 'single') { var seen = false; q.options.forEach(function (o) { if (o.correct && seen) o.correct = false; if (o.correct) seen = true; }); }
      renderEditor();
    }
    // single-choice "key" is exclusive
    if (e.target && e.target.classList && e.target.classList.contains('d-q-correct')) {
      var qq = draft.questions[+e.target.dataset.i];
      if (qq && qq.type === 'single' && e.target.checked) {
        draftModal.body.querySelectorAll('.d-q-correct[data-i="' + e.target.dataset.i + '"]').forEach(function (el) { if (el !== e.target) el.checked = false; });
      }
    }
  });

  function toDbQ(q) {
    var out = { id: q.id || qid(), type: q.type, text: (q.text || '').trim(), required: !!q.required };
    if (q.type === 'single' || q.type === 'multi') {
      var opts = q.options.map(function (o) { return (o.text || '').trim(); }).filter(function (x) { return x !== ''; });
      // keep correct indices aligned to the *filtered* option list
      var kept = q.options.filter(function (o) { return (o.text || '').trim() !== ''; });
      var correct = []; kept.forEach(function (o, i) { if (o.correct) correct.push(i); });
      out.options = opts; out.correct = correct; out.points = Math.max(0, parseInt(q.points, 10) || 0) || 1;
    } else if (q.type === 'scale') {
      out.max = Math.max(2, Math.min(10, parseInt(q.max, 10) || 5)); out.low = (q.low || '').trim(); out.high = (q.high || '').trim();
    }
    return out;
  }

  function saveDraft() {
    syncFromDom();
    if (!(draft.title || '').trim()) { toast('Give the form a title.', 'info'); return; }
    var clean = draft.questions.filter(function (q) { return (q.text || '').trim() !== ''; }).map(toDbQ);
    if (!clean.length) { toast('Add at least one question.', 'info'); return; }
    // validate choice questions have >= 2 options
    for (var i = 0; i < clean.length; i++) {
      if ((clean[i].type === 'single' || clean[i].type === 'multi') && clean[i].options.length < 2) {
        toast('Question ' + (i + 1) + ' needs at least two options.', 'info'); return;
      }
    }
    var passVal = String(draft.pass_score).trim() === '' ? null : Math.max(0, Math.min(100, parseInt(draft.pass_score, 10) || 0));
    var payload = {
      title: draft.title.trim(), description: (draft.description || '').trim() || null,
      job_role: (draft.job_role || '').trim() || null, pass_score: passVal, active: !!draft.active,
      questions: clean, updated_at: new Date().toISOString()
    };
    var btn = document.getElementById('d-save'); if (btn) { btn.disabled = true; btn.innerHTML = '<span class="material-icons-outlined animate-spin" style="font-size:15px;">progress_activity</span> Saving…'; }
    var op = draft.id
      ? sb().from('interview_surveys').update(payload).eq('id', draft.id)
      : sb().from('interview_surveys').insert(Object.assign({ created_by: window.cntUserName || null }, payload));
    op.then(function (r) {
      if (r.error) { if (btn) { btn.disabled = false; btn.innerHTML = 'Save form'; } toast(r.error.message || 'Could not save.', 'error'); return; }
      toast('Form saved.', 'success');
      window.cntOpenSurveyBuilder();
    });
  }

  window.cntDeleteSurvey = function (id, title) {
    if (!confirm('Delete the form “' + title + '”? Forms already sent to applicants keep working — they store their own copy of the questions.')) return;
    sb().from('interview_surveys').delete().eq('id', id).then(function (r) {
      if (r.error) { toast(r.error.message || 'Could not delete.', 'error'); return; }
      toast('Form deleted.', 'success'); window.cntOpenSurveyBuilder();
    });
  };
})();
