/* ============================================================
   CNT ATS — Supabase integration (loads after ats-ui.js)
   Extracted from ats.html (roadmap #8). Classic script (NOT a module):
   ats-ui.js and ats-data.js share the page global scope, in that load
   order. Inline on* handlers in ats.html call functions defined here.
   ============================================================ */
(function(){
  'use strict';
  const sb = window.getSupabase ? window.getSupabase() : null;

  // Clean slate — clear demo/sample data so only real records appear
  if (typeof accountData !== 'undefined'){ Object.keys(accountData).forEach(k=>{ if(Array.isArray(accountData[k])) accountData[k].length=0; }); }
  if (typeof hiringRequests !== 'undefined' && Array.isArray(hiringRequests)){ hiringRequests.length=0; }

  // Map a Supabase application row → the ATS applicant object shape
  function mapRow(r){
    return {
      id:'web-'+r.id, _web:true, _sid:r.id,
      name:r.name, role:r.role||'General Application',
      account:r.client||'Website', location:r.location||'—',
      stage:normStage(r.stage||'new'), phone:r.phone||'', email:r.email||'',
      interviewDate:r.interview_date||'', interviewTime:r.interview_time||'', interviewType:r.interview_type||'', interviewRound:r.interview_round||'', interviewVenue:r.interview_link||'',
      source:r.source||'Website', salary:'', notes:r.cover_note||'',
      appliedDate:r.applied_date||(r.created_at?String(r.created_at).slice(0,10):''),
      job_id:r.job_id||null,          // the posting this application belongs to
      experience:r.experience||'', resumePath:r.resume_url||null,
      client_status:r.client_status||'none', client_reason:r.client_reason||'', endorsed_at:r.endorsed_at||null, decided_at:r.decided_at||null,
      preemp_requirements_at:r.preemp_requirements_at||null, contract_signed_at:r.contract_signed_at||null, oriented_at:r.oriented_at||null, deployed_at:r.deployed_at||null, newhire_reported_at:r.newhire_reported_at||null,
      priority:r.priority||0, refuse_reason:r.refuse_reason||'', kanban_state:r.kanban_state||'normal', activity:Array.isArray(r.activity)?r.activity:[],
      requirements:(r.requirements&&typeof r.requirements==='object')?r.requirements:{}, requirement_docs:(r.requirement_docs&&typeof r.requirement_docs==='object')?r.requirement_docs:{},
      interview_scorecard:(r.interview_scorecard&&typeof r.interview_scorecard==='object')?r.interview_scorecard:{},
      recruiter:r.recruiter||'', tags:r.tags||'', degree:r.degree||'', medium:r.medium||'', referred_by:r.referred_by||'', referral_relation:r.referral_relation||'', linkedin:r.linkedin||'', proposed_salary:r.proposed_salary||'', availability:r.availability||'', offer_validity:r.offer_validity||'',
      work_experience:r.work_experience||'', education:r.education||'', languages:r.languages||'',
      certifications:r.certifications||'', seminars:r.seminars||'', awards:r.awards||'', char_references:r.char_references||''
    };
  }

  // Newest-first, capped. The ATS is a working pipeline, not an archive — pulling
  // every row ever would eventually stall the browser. Older records stay in the
  // database and remain reachable via Reports/CSV export.
  const APPLICATIONS_PAGE_LIMIT = 1000;
  async function loadApplications(){
    if(!sb) return;
    const { data, error, count } = await sb.from('applications')
      .select('*',{count:'exact'})
      .order('created_at',{ascending:false})
      .limit(APPLICATIONS_PAGE_LIMIT);
    if(error){ console.error('load applications', error); if(window.showToast) showToast('Could not load website applications','error'); return; }
    if(typeof count==='number' && count>APPLICATIONS_PAGE_LIMIT && window.showToast){
      showToast('Showing the newest '+APPLICATIONS_PAGE_LIMIT+' of '+count+' applications','info');
    }
    let added=0; const seen=_lastSeen();
    (data||[]).forEach(r=>{
      if(!findApplicant('web-'+r.id)){ addApplicant(mapRow(r)); added++; }
      const ts = r.created_at ? new Date(r.created_at).getTime() : 0;
      if(ts > seen) addNotif(notifFromApplication(r));   // new since last visit → notification badge
    });
    if(added && window.showToast) showToast(added+' website application'+(added!==1?'s':'')+' loaded','success');
  }

  // Stage write-back — wrap executeStageChange
  if (typeof executeStageChange === 'function'){
    const _origStage = executeStageChange;
    executeStageChange = function(id,targetStage){
      _origStage(id,targetStage);
      const app = findApplicant(id);
      if(app) logAudit('stage_change','applicant', app._sid||id, (app.name||id)+' → '+targetStage);
      if(app) cntLogActivity(app, 'stage', 'Moved to '+getStageName(targetStage));
      if (sb && app && app._web){
        sb.from('applications').update({ stage:targetStage }).eq('id',app._sid)
          .then(({error})=>{ if(error) console.error('stage writeback',error); });
      }
      // Opt-in, default-off: auto-send the stage's email if that stage enabled it.
      if(app && typeof _maybeAutoStageEmail==='function') _maybeAutoStageEmail(app, targetStage);
    };
  }

  // CV download link — wrap triggerResumeModal
  if (typeof triggerResumeModal === 'function'){
    const _origTRM = triggerResumeModal;
    triggerResumeModal = function(id){
      _origTRM(id);
      const a=findApplicant(id);
      showUploadedResume(a);
      renderEndorsement(a);
      renderWorkflow(a);
      // Clear any banner left over from the previously viewed applicant
      const dg=document.getElementById('cnt-digitize-banner');
      if(dg){ dg.className='hidden'; dg.innerHTML=''; }
      // Read the CV automatically — fills only blank fields, never overwrites
      if(window.cntDigitizeResume) cntDigitizeResume(id,{auto:true});
    };
  }

  // Size the CV frame to the room actually left in the scroll area rather than
  // to a slice of the viewport. The résumé column is sticky, so anything taller
  // than its own scroll viewport can never be scrolled into view — the bottom
  // of the CV would simply be unreachable.
  // Size the CV frame to the room actually left in the scroll area rather than
  // to a slice of the viewport. The résumé column is sticky — the notes now sit
  // in the form column, so the CV stays pinned and full height while the notes
  // scroll beside it. Anything taller than the scroll viewport could never be
  // scrolled into view, which is why this measures instead of guessing.
  const CV_MIN=280;
  function _fitResumeFrame(){
    const sc=document.querySelector('#resume-modal .print-area');
    const ifr=document.querySelector('#cnt-uploaded-resume iframe');
    if(!ifr||!sc||!sc.clientHeight) return;
    const offset=ifr.getBoundingClientRect().top - sc.getBoundingClientRect().top;
    const avail=sc.clientHeight - offset - 12;
    ifr.style.height=Math.max(CV_MIN, avail)+'px';
    // On a screen too short to fit even the minimum, sticky would pin the pane
    // and strand the overflow. Release it so the column can scroll normally.
    const right=document.getElementById('profile-right');
    if(right) right.classList.toggle('xl:sticky', avail>=CV_MIN);
  }
  window.addEventListener('resize', _fitResumeFrame);

  // Show the applicant's actually-uploaded resume inside the profile "Resume" card
  async function showUploadedResume(app){
    document.getElementById('cnt-uploaded-resume')?.remove();
    const strict = document.getElementById('profile-resume-content');
    const roleEl = document.getElementById('resume-role-display');
    let chip = document.getElementById('cnt-cv-link');
    if(!chip && roleEl){ chip=document.createElement('div'); chip.id='cnt-cv-link'; chip.style.cssText='margin-top:8px;'; roleEl.parentElement.appendChild(chip); }
    if(chip) chip.innerHTML='';
    if(!(app && app._web && app.resumePath && sb)){ if(strict) strict.style.display=''; return; }

    const box=document.createElement('div'); box.id='cnt-uploaded-resume';
    box.innerHTML='<div style="padding:14px 16px;color:#64748b;font-size:13px;">Loading uploaded resume…</div>';
    if(strict){ strict.style.display='none'; strict.parentElement.insertBefore(box, strict); }
    const { data, error } = await sb.storage.from('resumes').createSignedUrl(app.resumePath, 3600);
    if(error || !data){ box.innerHTML='<div style="padding:16px;color:#ef4444;font-size:13px;">Uploaded resume unavailable.</div>'; if(strict) strict.style.display=''; return; }
    const url=data.signedUrl;
    const isPdf=/\.pdf(\?|$)/i.test(app.resumePath);
    if(chip) chip.innerHTML='<a href="'+url+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#7f1d1d;"><span class="material-icons-outlined" style="font-size:16px;">description</span>View uploaded CV</a>';
    const actions='<div style="display:flex;gap:10px;align-items:center;justify-content:space-between;padding:11px 16px;border-bottom:1px solid #e2e8f0;background:#fff;flex-wrap:wrap;">'
      +'<span style="font-size:12px;color:#334155;font-weight:600;display:inline-flex;align-items:center;gap:6px;"><span class="material-icons-outlined" style="font-size:16px;color:#7f1d1d;">upload_file</span>Uploaded by applicant</span>'
      +'<span style="display:flex;gap:12px;align-items:center;">'
      +'<a href="'+url+'" target="_blank" rel="noopener" style="font-size:12px;font-weight:600;color:#7f1d1d;display:inline-flex;align-items:center;gap:5px;"><span class="material-icons-outlined" style="font-size:15px;">open_in_new</span>Open</a>'
      +'<a href="'+url+'" download style="font-size:12px;font-weight:600;color:#7f1d1d;display:inline-flex;align-items:center;gap:5px;"><span class="material-icons-outlined" style="font-size:15px;">download</span>Download</a>'
      +'</span></div>';
    if(isPdf){
      box.innerHTML=actions+'<iframe src="'+url+'#toolbar=1&view=FitH" style="width:100%;height:400px;border:0;display:block;background:#f8fafc;" title="Uploaded resume"></iframe>';
      _fitResumeFrame();
    } else {
      // Word files can't render in an iframe, but mammoth can turn a .docx
      // into HTML we can show. Only .docx — the legacy binary .doc format is
      // not something it can read, so that still falls through to the link.
      box.innerHTML=actions+'<div id="cnt-docx-mount"></div>';
      const mount=box.querySelector('#cnt-docx-mount');
      mount.innerHTML='<div style="padding:14px 16px;color:#64748b;font-size:13px;">Converting document…</div>';
      let shown=false;
      if(/\.docx(\?|$)/i.test(app.resumePath) && window.cntRenderDocxPreview){
        try{ mount.innerHTML=''; await window.cntRenderDocxPreview(mount,url); shown=true; _fitResumeFrame(); }
        catch(e){ console.warn('docx preview failed',e); }
      }
      if(!shown){
        mount.innerHTML='<div style="padding:30px 16px;text-align:center;color:#64748b;font-size:13px;"><span class="material-icons-outlined" style="font-size:42px;color:#cbd5e1;">description</span><p style="margin-top:8px;">This document can’t be previewed inline.</p><a href="'+url+'" target="_blank" rel="noopener" style="display:inline-block;margin-top:12px;background:#7f1d1d;color:#fff;padding:9px 18px;border-radius:8px;font-weight:600;">Open / Download resume</a></div>';
      }
    }
  }

  // ── Job Positions: full backend management (post / edit / remove → website) ──
  let _editingJobSid = null;

  function _applyJobs(rows){
    if(!rows || typeof jobDatabase==='undefined') return false;
    Object.keys(jobDatabase).forEach(k=>delete jobDatabase[k]);
    rows.forEach(j=>{
      if(!jobDatabase[j.client]) jobDatabase[j.client]=[];
      jobDatabase[j.client].push({ _sid:j.id, role:j.role, account:j.client, location:j.location,
        needed:j.openings||1, salary:j.salary_range||'', priority:(j.priority||'normal').toLowerCase(),
        about:j.about||'', responsibilities:j.responsibilities||'', must_have:j.must_have||'', nice_to_have:j.nice_to_have||'', we_offer:j.we_offer||'',
        employment_type:j.employment_type||'Full-Time', recruiter:j.recruiter||'', status:j.status||'open',
        deadline:j.deadline||'', created_at:j.created_at||null,
        department:j.department||'', industry:j.industry||'', working_schedule:j.working_schedule||'',
        contract_template:j.contract_template||'', expected_skills:j.expected_skills||'', interviewers:j.interviewers||'', hide_salary:!!j.hide_salary,
        base_salary:(j.base_salary!=null?j.base_salary:''), client_max_salary:(j.client_max_salary!=null?j.client_max_salary:'') });
    });
    return true;
  }
  async function loadJobsFromBackend(){
    if(typeof jobDatabase==='undefined') return;
    _applyJobs(cacheGet('jobs'));                                // instant from cache
    if(!sb) return;
    const { data, error } = await sb.from('jobs').select('*');   // all statuses — ATS shows published + unpublished
    if(error){ console.error('load jobs',error); return; }
    cacheSet('jobs',data||[]);
    _applyJobs(data||[]);                                        // then the live copy
  }

  // The Odoo-style editor writes extra columns (department, industry, …). If the
  // 2026-07-29-job-odoo-fields migration hasn't run yet, Postgres rejects them —
  // so retry once without those keys and nudge the user to run the migration.
  const _JOB_EXT=['department','industry','working_schedule','contract_template','expected_skills','interviewers','hide_salary','base_salary','client_max_salary'];
  const _extMiss=e=>/column|schema cache|42703/i.test((e&&(e.message||e.code))||'');
  const _stripExt=o=>{ const c=Object.assign({},o); _JOB_EXT.forEach(k=>delete c[k]); return c; };
  async function _jobsUpdate(payload,id){
    let {error}=await sb.from('jobs').update(payload).eq('id',id);
    if(error && _extMiss(error)){ ({error}=await sb.from('jobs').update(_stripExt(payload)).eq('id',id));
      if(!error && window.showToast) showToast('Saved. Run the job-fields migration to store Department/Skills/Interviewers.','info'); }
    if(error) throw error;
  }
  async function _jobsInsert(payload){
    let {data,error}=await sb.from('jobs').insert(payload).select('id').single();
    if(error && _extMiss(error)){ ({data,error}=await sb.from('jobs').insert(_stripExt(payload)).select('id').single());
      if(!error && window.showToast) showToast('Posted. Run the job-fields migration to store Department/Skills/Interviewers.','info'); }
    if(error) throw error; return data;
  }

  if (typeof openCreateJobModal === 'function'){
    const _origOpenJob = openCreateJobModal;
    openCreateJobModal = function(){ _editingJobSid=null; _origOpenJob(); if(window.cntFillJobRecruiters) cntFillJobRecruiters();
      ['job-client-max','job-base-salary','job-salary'].forEach(function(id){ var e=document.getElementById(id); if(e) e.value=''; });
      if(window.cntCompUpdate) window.cntCompUpdate(); };
  }

  window.editJobPosition = function(sid){
    let job=null;
    for(const k of Object.keys(jobDatabase)){ const j=jobDatabase[k].find(x=>x._sid===sid); if(j){job=j;break;} }
    if(!job) return;
    // Build the options around this job's own values first — a <select> drops
    // any value it has no option for, so setting .value directly would blank
    // the field whenever a client/position/location has changed in Settings.
    _fillPicker('job-account',_taxNames('client'),'Select a client…',job.account||'');
    _fillPicker('job-role',_taxNames('position'),'Select a position…',job.role||'');
    _fillPicker('job-location',_taxNames('location'),'Select a location…',job.location||'');
    cntFillJobRecruiters(job.recruiter||'');
    document.getElementById('job-needed').value=job.needed;
    { const cm=document.getElementById('job-client-max'); if(cm){ const v=window.cntParseMoney(job.client_max_salary); cm.value=(!isNaN(v)&&v>0)?window.cntFmtMoney(v):''; } }
    { const bs=document.getElementById('job-base-salary'); if(bs){ const v=window.cntParseMoney(job.base_salary); bs.value=(!isNaN(v)&&v>0)?window.cntFmtMoney(v):''; } }
    { const hs=document.getElementById('job-hide-salary'); if(hs) hs.checked=!!job.hide_salary; }
    if(window.cntCompUpdate) window.cntCompUpdate();
    document.getElementById('job-priority').value=(job.priority||'normal').toLowerCase();
    { const et=document.getElementById('job-employment'); if(et) et.value=job.employment_type||'Full-Time';
      const dl=document.getElementById('job-deadline'); if(dl) dl.value=(job.deadline||'').slice(0,10); }
    document.getElementById('job-about').value=job.about||'';
    document.getElementById('job-responsibilities').value=job.responsibilities||'';
    document.getElementById('job-must').value=job.must_have||'';
    document.getElementById('job-nice').value=job.nice_to_have||'';
    document.getElementById('job-offer').value=job.we_offer||'';
    // Odoo-style fields
    document.getElementById('job-department').value=job.department||'';
    document.getElementById('job-industry').value=job.industry||'';
    document.getElementById('job-schedule').value=job.working_schedule||'';
    document.getElementById('job-contract').value=job.contract_template||'';
    if(window.cntJobSetSkills) cntJobSetSkills(job.expected_skills||'');
    if(window.cntJobSetInterviewers) cntJobSetInterviewers(job.interviewers||'');
    if(window.cntJobSetPublished) cntJobSetPublished((job.status||'open')!=='paused');
    if(window.cntJobSyncTitle) cntJobSyncTitle();
    if(window.switchJobTab) switchJobTab('recruitment');
    if(window.cntFillJobRecruiters) cntFillJobRecruiters();
    _editingJobSid=sid;
    document.getElementById('job-modal').classList.remove('hidden');
  };

  window.deleteJobPosition = async function(sid){
    if(!sb) return;
    let found=null, acc=null;
    for(const k of Object.keys(jobDatabase)){ const j=jobDatabase[k].find(x=>x._sid===sid); if(j){found=j;acc=k;break;} }
    if(!confirm('Remove "'+(found?found.role+' · '+found.location:'this position')+'" from the website careers page?')) return;
    const { error } = await sb.from('jobs').delete().eq('id',sid);
    if(error){ console.error('delete job',error); if(window.showToast) showToast('Remove failed: '+error.message,'error'); return; }
    if(acc) jobDatabase[acc]=jobDatabase[acc].filter(x=>x._sid!==sid);
    logAudit('job_remove','job', sid, found?found.role+' · '+found.location:'');
    if(window.showToast) showToast('Removed from website careers page','info');
    renderAll(); if(typeof renderJobPositions==='function') renderJobPositions();
  };

  if (typeof handleJobSubmit === 'function'){
    const _origJobSubmit = handleJobSubmit;
    handleJobSubmit = function(e){
      const editingSid = _editingJobSid;
      // ── Salary cap: hard business rule. Require Base + Client Maximum, and
      // never allow the base (or the generated range) to exceed the client max.
      const _cm=window.cntParseMoney((document.getElementById('job-client-max')||{}).value);
      const _base=window.cntParseMoney((document.getElementById('job-base-salary')||{}).value);
      if(isNaN(_base)||_base<=0||isNaN(_cm)||_cm<=0){ if(e&&e.preventDefault)e.preventDefault(); if(window.showToast) showToast('Set both Base Salary and Client Maximum Salary before saving.','error'); return; }
      if(_base>_cm){ if(e&&e.preventDefault)e.preventDefault(); if(window.showToast) showToast('⚠️ Base salary exceeds the client\'s approved maximum of '+window.cntFmtMoney(_cm)+'.','error'); return; }
      const _finalRange=window.cntFinalRangeText(_base,_cm);
      const job = {
        role: document.getElementById('job-role').value,
        client: document.getElementById('job-account').value,
        location: document.getElementById('job-location').value,
        salary_range: _finalRange || null,
        base_salary: _base,
        client_max_salary: _cm,
        openings: parseInt(document.getElementById('job-needed').value)||1,
        priority: (document.getElementById('job-priority').value||'normal').toLowerCase(),
        about: document.getElementById('job-about').value || null,
        responsibilities: document.getElementById('job-responsibilities').value || null,
        must_have: document.getElementById('job-must').value || null,
        nice_to_have: document.getElementById('job-nice').value || null,
        we_offer: document.getElementById('job-offer').value || null,
        employment_type: (document.getElementById('job-employment')||{}).value || 'Full-Time',
        recruiter: (document.getElementById('job-recruiter')||{}).value || null,
        deadline: (document.getElementById('job-deadline')||{}).value || null,
        department: (document.getElementById('job-department')||{}).value || null,
        industry: (document.getElementById('job-industry')||{}).value || null,
        working_schedule: (document.getElementById('job-schedule')||{}).value || null,
        contract_template: (document.getElementById('job-contract')||{}).value || null,
        expected_skills: (document.getElementById('job-skills')||{}).value || null,
        interviewers: (document.getElementById('job-interviewers')||{}).value || null,
        hide_salary: !!(document.getElementById('job-hide-salary')||{}).checked
      };
      // The Published toggle is the single source of truth for whether the
      // position is live on the website (open) or taken down (paused).
      job.status = (typeof cntJobIsPublished==='function' ? cntJobIsPublished() : true) ? 'open' : 'paused';
      _origJobSubmit(e);   // in-memory update + closeJobModal + renderAll
      if (sb && job.role && job.client){
        (async ()=>{
          try{
            const _mem={role:job.role,account:job.client,location:job.location,needed:job.openings,salary:job.salary_range||'',priority:job.priority,about:job.about||'',responsibilities:job.responsibilities||'',must_have:job.must_have||'',nice_to_have:job.nice_to_have||'',we_offer:job.we_offer||'',employment_type:job.employment_type,recruiter:job.recruiter||'',deadline:job.deadline||'',status:job.status,department:job.department||'',industry:job.industry||'',working_schedule:job.working_schedule||'',contract_template:job.contract_template||'',expected_skills:job.expected_skills||'',interviewers:job.interviewers||'',hide_salary:!!job.hide_salary,base_salary:job.base_salary,client_max_salary:job.client_max_salary};
            if(editingSid){
              await _jobsUpdate(job,editingSid);
              for(const k of Object.keys(jobDatabase)){ const j=jobDatabase[k].find(x=>x._sid===editingSid); if(j){ Object.assign(j,_mem); break; } }
              logAudit('job_edit','job', editingSid, job.role+' · '+job.client); if(window.showToast) showToast('Updated on website careers page','success');
            } else {
              const { data } = await sb.from('jobs').select('id').eq('role',job.role).eq('client',job.client).eq('location',job.location).limit(1);
              let sid;
              if (data && data.length){ await _jobsUpdate(job,data[0].id); sid=data[0].id; }
              else { const ins=await _jobsInsert(job); sid=ins&&ins.id; }
              const arr=jobDatabase[job.client]||[]; const entry=arr.find(x=>x.role===job.role&&x.location===job.location&&!x._sid)||arr[arr.length-1]; if(entry&&sid){ entry._sid=sid; Object.assign(entry,_mem); }
              logAudit('job_post','job', sid, job.role+' · '+job.client); if(window.showToast) showToast('Posted to website careers page','success');
            }
            renderAll(); if(typeof renderJobPositions==='function') renderJobPositions();
          }catch(err){ console.error('job sync',err); if(window.showToast) showToast('Saved, but website sync failed: '+(err.message||''),'error'); }
          finally{ _editingJobSid=null; }
        })();
      } else { _editingJobSid=null; }
    };
  }

  // Upload a résumé/CV from the ATS applicant form to the same 'resumes' bucket
  // the public careers form uses. PDF or Word only, ≤5 MB. Returns the storage
  // path (stored as applications.resume_url) or null when no file was chosen.
  async function _uploadResumeFile(file){
    if(!file) return null;
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(['pdf','doc','docx'].indexOf(ext)<0) throw new Error('Résumé must be a PDF or Word (.doc/.docx) file.');
    if(file.size>5*1048576) throw new Error('Résumé is larger than 5 MB.');
    const safe=file.name.replace(/[^\w.\-]/g,'_');
    const path=Date.now()+'_'+Math.random().toString(36).slice(2,8)+'_'+safe;
    const up=await sb.storage.from('resumes').upload(path,file,{cacheControl:'3600',upsert:false});
    if(up.error) throw up.error;
    return path;
  }

  // Persist ATS-added applicants → Supabase applications (with dedup vs the realtime fetch)
  if (typeof handleFormSubmit === 'function'){
    const _origFormSubmit = handleFormSubmit;
    handleFormSubmit = function(e){
      const editId = document.getElementById('applicant-id').value;
      const isEdit = !!editId;
      const _resumeInput = document.getElementById('app-resume-file');
      const _resumeFile = (_resumeInput && _resumeInput.files && _resumeInput.files[0]) || null;
      const snap = {
        name: document.getElementById('app-name').value,
        account: document.getElementById('app-account').value,
        location: document.getElementById('app-location').value,
        role: document.getElementById('app-role').value,
        phone: (function(v){ v=String(v||'').replace(/\D/g,'').replace(/^0+/,'').replace(/^63/,'').slice(0,10); return v?'+63'+v:''; })(document.getElementById('app-phone').value),
        email: document.getElementById('app-email').value,
        source: document.getElementById('app-source').value,
        salary: document.getElementById('app-salary').value,
        notes: document.getElementById('app-notes').value,
        stage: document.getElementById('app-stage').value,
        recruiter:(document.getElementById('app-recruiter')||{}).value||'',
        tags:_uniformSkills((document.getElementById('app-tags')||{}).value||'').join(', '),
        degree:(document.getElementById('app-degree')||{}).value||'',
        medium:(document.getElementById('app-medium')||{}).value||'',
        referred_by:(document.getElementById('app-referred')||{}).value||'',
        linkedin:(document.getElementById('app-linkedin')||{}).value||'',
        proposed_salary:(document.getElementById('app-proposed-salary')||{}).value||'',
        availability:(document.getElementById('app-availability')||{}).value||'',
        work_experience:(document.getElementById('app-experience')||{}).value||'',
        education:(document.getElementById('app-education')||{}).value||'',
        languages:(document.getElementById('app-languages')||{}).value||'',
        certifications:(document.getElementById('app-certifications')||{}).value||'',
        seminars:(document.getElementById('app-seminars')||{}).value||'',
        awards:(document.getElementById('app-awards')||{}).value||'',
        char_references:(document.getElementById('app-char-references')||{}).value||''
      };
      // Salary cap: a proposed offer may never exceed the client's approved maximum.
      if(snap.proposed_salary && window.cntJobClientMax){
        const _cap=window.cntJobClientMax({account:snap.account, role:snap.role});
        const _off=window.cntParseMoney(snap.proposed_salary);
        if(_cap!=null && !isNaN(_off) && _off>_cap){ if(e&&e.preventDefault)e.preventDefault(); if(window.showToast) showToast('❌ Cannot proceed. The proposed salary of '+window.cntFmtMoney(_off)+" exceeds the client's approved maximum of "+window.cntFmtMoney(_cap)+'.','error'); return; }
      }
      _origFormSubmit(e);   // existing in-memory add/update + renderAll
      if (sb && !isEdit && snap.name){
        (async ()=>{
          try{
            let resumePath=null;
            try{ resumePath=await _uploadResumeFile(_resumeFile); }
            catch(upErr){ if(window.showToast) showToast(upErr.message||'Résumé upload failed','error'); }
            const { data, error } = await sb.from('applications').insert({
              name:snap.name, email:snap.email||null, phone:snap.phone||null,
              role:snap.role, client:snap.account, location:snap.location,
              source:snap.source||'ATS', cover_note:snap.notes||null, stage:snap.stage||'new', resume_url:resumePath,
              recruiter:snap.recruiter||null, tags:snap.tags||null, degree:snap.degree||null, medium:snap.medium||null,
              referred_by:snap.referred_by||null, linkedin:snap.linkedin||null, proposed_salary:snap.proposed_salary||null, availability:snap.availability||null,
              work_experience:snap.work_experience||null, education:snap.education||null, languages:snap.languages||null,
              certifications:snap.certifications||null, seminars:snap.seminars||null, awards:snap.awards||null, char_references:snap.char_references||null
            }).select('id').single();
            if(error) throw error;
            // reconcile: drop the temporary in-memory record, re-add as web-<id> so refetch won't duplicate it
            const temp = getAllApplicants().filter(a=>String(a.id).startsWith('app_') && a.name===snap.name && a.account===snap.account).pop();
            if(temp) removeApplicant(temp.id);
            if(!findApplicant('web-'+data.id)){
              addApplicant(mapRow({ id:data.id, name:snap.name, email:snap.email, phone:snap.phone,
                role:snap.role, client:snap.account, location:snap.location,
                source:snap.source||'ATS', cover_note:snap.notes, stage:snap.stage||'new', resume_url:resumePath,
                recruiter:snap.recruiter, tags:snap.tags, degree:snap.degree, medium:snap.medium, referred_by:snap.referred_by, linkedin:snap.linkedin, proposed_salary:snap.proposed_salary, availability:snap.availability,
                applied_date:new Date().toISOString().slice(0,10) }));
            }
            renderAll();
            if(window.showToast) showToast('Applicant saved to backend','success');
          }catch(err){ console.error('applicant persist',err); if(window.showToast) showToast('Saved locally, backend sync failed: '+(err.message||''),'error'); }
        })();
      } else if (sb && isEdit){
        const app = findApplicant(editId);
        if (app && app._web && app._sid){
          (async ()=>{
            let resumePath=null;
            try{ resumePath=await _uploadResumeFile(_resumeFile); }
            catch(upErr){ if(window.showToast) showToast(upErr.message||'Résumé upload failed','error'); }
            const patch={
              name:snap.name, email:snap.email||null, phone:snap.phone||null,
              role:snap.role, client:snap.account, location:snap.location,
              cover_note:snap.notes||null, stage:snap.stage||app.stage,
              recruiter:snap.recruiter||null, tags:snap.tags||null, degree:snap.degree||null, medium:snap.medium||null,
              referred_by:snap.referred_by||null, linkedin:snap.linkedin||null, proposed_salary:snap.proposed_salary||null, availability:snap.availability||null,
              work_experience:snap.work_experience||null, education:snap.education||null, languages:snap.languages||null,
              certifications:snap.certifications||null, seminars:snap.seminars||null, awards:snap.awards||null, char_references:snap.char_references||null
            };
            if(resumePath) patch.resume_url=resumePath;   // only replace the CV when a new file was uploaded
            const { error } = await sb.from('applications').update(patch).eq('id', app._sid);
            if(error){ console.error('applicant edit sync',error); return; }
            if(resumePath && typeof updateApplicant==='function') updateApplicant(app.id,{resumePath:resumePath});
            if(window.showToast) showToast('Changes saved to backend','success');
          })();
        }
      }
    };
  }

  // Remove applicant → also delete from Supabase for website/ATS applications
  if (typeof deleteApplicant === 'function'){
    const _origDelApp = deleteApplicant;
    deleteApplicant = function(id){
      const app = findApplicant(id);
      const sid = (app && app._web) ? app._sid : null;
      _origDelApp(id);   // confirm + in-memory remove + renderAll
      const removed = !findApplicant(id);
      if(!removed) return;                 // user cancelled the confirm dialog
      if (sb && sid){
        // Verify the DB row is actually gone. RLS silently deletes 0 rows when
        // the caller lacks permission (no error thrown), which used to look like
        // "the applicant won't delete" — it vanished, then reappeared on reload.
        // If nothing was deleted, restore the row and tell the user.
        sb.from('applications').delete().eq('id', sid).select('id').then(({data,error})=>{
          if(error || !data || !data.length){
            if(app) addApplicant(app);
            if(typeof renderAll==='function') renderAll();
            console.error('applicant delete', error||'0 rows deleted');
            if(window.showToast) showToast(
              (error && error.message) ? ('Could not delete: '+error.message)
                                       : 'Could not delete this applicant — you may not have permission.', 'error');
          } else {
            logAudit('applicant_remove','applicant', sid, app?app.name:'');
          }
        });
      } else {
        logAudit('applicant_remove','applicant', id, app?app.name:'');   // local-only record
      }
    };
  }

  // Hiring Requests → Supabase backend (load on start; persist submit + approve/fill)
  let recruitersList=[];
  // Anyone who can be held accountable for a role: every staff account except
  // the super admin (an owner account, not a working recruiter) and 'pending'
  // sign-ups, who have no role assigned yet and cannot act on anything.
  const NON_ASSIGNABLE_ROLES=['super_admin','pending'];
  async function loadRecruiters(){
    if(!sb) return;
    const { data } = await sb.from('profiles').select('id,full_name,email,role')
      .not('role','in','('+NON_ASSIGNABLE_ROLES.join(',')+')')
      .order('full_name');
    recruitersList = data||[]; window.cntRecruiters = recruitersList;
    if(typeof cntFillJobRecruiters==='function') cntFillJobRecruiters();
  }
  async function assignRequest(reqId, uid, name){
    if(typeof _canManageMRF==='function' && !_canManageMRF()){ if(window.showToast) showToast('Only the Account Officer can assign recruiters.','error'); return; }
    const r=(typeof hiringRequests!=='undefined')?hiringRequests.find(x=>x.id===reqId):null; if(!r) return;
    r.assigned_to=uid||null; r.assigned_name=uid?name:null; if(uid && r.status==='Pending') r.status='Open';
    if(sb && r._sid){ const {error}=await sb.from('hiring_requests').update({ assigned_to:uid||null, assigned_name:uid?name:null, status:r.status }).eq('id',r._sid); if(error){ if(window.showToast) showToast('Assign failed: '+error.message,'error'); return; } }
    logAudit('mrf_assign','hiring_request', r.id, name||'unassigned');
    if(window.showToast) showToast('MRF '+r.id+(uid?' → '+name:' unassigned'),'success');
    if(typeof renderHiringRequests==='function') renderHiringRequests();
  }
  window.cntAssignRequest = assignRequest;

  async function loadHiringRequests(){
    if(!sb || typeof hiringRequests==='undefined') return;
    const { data, error } = await sb.from('hiring_requests').select('*').order('created_at',{ascending:false});
    if(error){ console.error('load hiring requests',error); return; }
    (data||[]).forEach(r=>{
      if(hiringRequests.some(x=>x.id===r.req_id)) return;
      hiringRequests.unshift({ id:r.req_id, _sid:r.id, account:r.account, role:r.role, location:r.location,
        type:r.type, count:r.count, priority:r.priority, status:r.status, date:r.date,
        deadline:r.deadline||'', requestor:r.requestor||'', notes:r.notes||'', assigned_to:r.assigned_to||null, assigned_name:r.assigned_name||'',
        client_submitted:!!r.client_submitted });
    });
  }
  if (typeof handleHiringRequestSubmit === 'function'){
    const _origHR = handleHiringRequestSubmit;
    handleHiringRequestSubmit = function(e){
      _origHR(e);   // creates the request in-memory (hiringRequests[0]) + renderAll
      const req = hiringRequests[0];
      if(req) logAudit('mrf_create','hiring_request', req.id, req.role+' · '+req.account);
      if(sb && req && !req._sid){
        sb.from('hiring_requests').insert({
          req_id:req.id, account:req.account, role:req.role, location:req.location, type:req.type,
          count:req.count, priority:req.priority, status:req.status, date:req.date,
          deadline:req.deadline||null, requestor:req.requestor||null, notes:req.notes||null,
          assigned_to:req.assigned_to||null, assigned_name:req.assigned_name||null
        }).select('id').single().then(({data,error})=>{
          if(error){ console.error('hiring request persist',error); if(window.showToast) showToast('Saved locally, backend sync failed','error'); return; }
          req._sid = data.id; if(window.showToast) showToast('Hiring request saved to backend','success');
        });
      }
    };
  }
  function syncRequestStatus(id,status){
    const r = (typeof hiringRequests!=='undefined') ? hiringRequests.find(x=>x.id===id) : null;
    if(sb && r && r._sid){ sb.from('hiring_requests').update({status}).eq('id',r._sid).then(({error})=>{ if(error) console.error('hr status sync',error); }); }
  }
  // Approving an MRF posts the position and publishes it to the website careers page
  async function jobFromRequest(r){
    if(!r || !r.account || !r.role) return;
    const client=r.account, role=r.role, location=r.location||'';
    if(!jobDatabase[client]) jobDatabase[client]=[];
    const existing=jobDatabase[client].find(j=>j.role===role && j.location===location);
    if(existing){
      if(existing.status==='closed'){
        existing.status='open';
        if(sb && existing._sid) await sb.from('jobs').update({status:'open'}).eq('id',existing._sid);
        if(window.showToast) showToast('Existing position re-published to the website','success');
      } else if(window.showToast) showToast('Position already live on the website','info');
      renderAll(); if(typeof renderJobPositions==='function') renderJobPositions();
      return;
    }
    const needed=r.count||1, prio=(r.priority||'normal').toLowerCase();
    const entry={ role, account:client, location, needed, salary:'', priority:prio,
      employment_type:'Full-Time', recruiter:r.assigned_name||'', status:'open', about:r.notes||'',
      deadline:r.deadline||'', created_at:new Date().toISOString() };
    jobDatabase[client].push(entry);
    if(sb){
      try{
        const { data, error } = await sb.from('jobs').insert({
          role, client, location, openings:needed, priority:prio, salary_range:null,
          about:r.notes||null, employment_type:'Full-Time', recruiter:r.assigned_name||null, status:'open',
          deadline:r.deadline||null            // client's expected fill date, carried from the MRF
        }).select('id').single();
        if(error) throw error;
        entry._sid=data.id;
        logAudit('job_from_request','job', data.id, role+' · '+client+' (from '+r.id+')');
        if(window.showToast) showToast('“'+role+'” posted to the website careers page','success');
      }catch(e){ console.error('job from request',e); if(window.showToast) showToast('Approved, but website post failed: '+(e.message||''),'error'); }
    }
    renderAll(); if(typeof renderJobPositions==='function') renderJobPositions();
  }
  if (typeof approveRequest === 'function'){
    const _a=approveRequest;
    approveRequest=function(id){
      if(typeof _canManageMRF==='function' && !_canManageMRF()){ if(window.showToast) showToast('Only the Account Officer can approve MRFs.','error'); return; }
      _a(id); syncRequestStatus(id,'Open');
      const r=(typeof hiringRequests!=='undefined')?hiringRequests.find(x=>x.id===id):null;
      if(r) jobFromRequest(r);
    };
  }
  if (typeof fillRequest === 'function'){ const _f=fillRequest; fillRequest=function(id){ _f(id); syncRequestStatus(id,'Filled'); }; }
  window.deleteHiringRequest = function(id){
    const r = (typeof hiringRequests!=='undefined') ? hiringRequests.find(x=>x.id===id) : null;
    if(!r) return;
    if(!confirm('Remove hiring request '+r.id+' ('+r.role+' · '+r.account+')?')) return;
    const idx = hiringRequests.findIndex(x=>x.id===id); if(idx!==-1) hiringRequests.splice(idx,1);
    if(sb && r._sid){ sb.from('hiring_requests').delete().eq('id',r._sid).then(({error})=>{ if(error) console.error('hr delete',error); }); }
    if(window.showToast) showToast('Hiring request removed','info');
    renderAll(); if(typeof renderHiringRequests==='function') renderHiringRequests();
  };

  // ── Notifications: new applications (apply) + live changes ──
  const notifStore = [];
  const notifIds = new Set();
  function _lastSeen(){ return parseInt(localStorage.getItem('cnt_last_seen')||'0',10); }
  function _setLastSeen(){ localStorage.setItem('cnt_last_seen', String(Date.now())); }
  function _escN(s){ return (s==null?'':String(s)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function _timeAgo(ts){ const d=Math.floor((Date.now()-ts)/1000); if(d<60)return 'just now'; if(d<3600)return Math.floor(d/60)+'m ago'; if(d<86400)return Math.floor(d/3600)+'h ago'; return Math.floor(d/86400)+'d ago'; }
  function _unread(){ return notifStore.filter(n=>!n.read).length; }
  function _notifIcon(kind){ return {endorsed:'how_to_reg',approved:'check_circle',rejected:'cancel',filled:'work',request:'assignment'}[kind]||'person_add'; }
  function _openNotif(n){
    const panel=document.getElementById('cnt-bell-panel'); if(panel) panel.style.display='none';
    if(!n.read){ n.read=true; renderBell(); if(n._srvId!=null && sb){ sb.rpc('cnt_notifications_read',{p_id:n._srvId}).catch(()=>{}); } }
    if(n._refType==='applicant' && n._refId && typeof cntOpenApplicantByDbId==='function') cntOpenApplicantByDbId(n._refId);
  }
  function renderBell(){
    const badge=document.getElementById('cnt-bell-badge');
    if(badge){ const c=_unread(); if(c>0){ badge.style.display='flex'; badge.textContent=c>99?'99+':String(c); } else badge.style.display='none'; }
    const list=document.getElementById('cnt-bell-list');
    if(list){
      list.innerHTML = notifStore.length ? notifStore.slice(0,30).map(n=>{
        const clickable = n._refType==='applicant' && n._refId;
        return '<div data-nkey="'+_escN(n.key||'')+'" style="padding:11px 16px;border-bottom:1px solid #f8fafc;display:flex;gap:10px;align-items:flex-start;'+(clickable?'cursor:pointer;':'')+(n.read?'':'background:#fef2f2;')+'">'
        +'<span class="material-icons-outlined" style="font-size:18px;color:#7f1d1d;margin-top:1px;">'+(n.icon||'person_add')+'</span>'
        +'<div style="flex:1;min-width:0;"><div style="font-size:12.5px;color:#0f172a;line-height:1.4;">'+n.html+'</div>'
        +'<div style="font-size:11px;color:#94a3b8;margin-top:2px;">'+(n.sub?(_escN(n.sub)+' · '):'')+_timeAgo(n.ts)+'</div></div></div>';
      }).join('') : '<div style="padding:24px 16px;text-align:center;color:#94a3b8;font-size:12px;">No notifications yet</div>';
      list.querySelectorAll('[data-nkey]').forEach(el=>{
        const n=notifStore.find(x=>x.key===el.getAttribute('data-nkey'));
        if(n && n._refType==='applicant' && n._refId) el.addEventListener('click',()=>_openNotif(n));
      });
    }
  }
  function addNotif(n, opts){
    opts=opts||{};
    if(!n || (n.key && notifIds.has(n.key))) return;
    if(n.key) notifIds.add(n.key);
    notifStore.unshift(n);
    renderBell();
    if(opts.toast && window.showToast) showToast(n.toastMsg||'New notification','success');
    if(opts.desktop && typeof Notification!=='undefined' && Notification.permission==='granted'){
      try{ new Notification(n.title||'CNT ATS', { body:n.body||'' }); }catch(e){}
    }
  }
  function notifFromApplication(r){
    return { key:'app-'+r.id, icon:'person_add',
      html:'<b>'+_escN(r.name)+'</b> applied for <b>'+_escN(r.role)+'</b>',
      sub:r.client, ts:(r.created_at?new Date(r.created_at).getTime():Date.now()), read:false,
      toastMsg:r.name+' applied for '+r.role, title:'New application — CNT ATS', body:r.name+' applied for '+r.role+' ('+r.client+')' };
  }
  // Persistent, server-backed notifications (roadmap #7). A recruiter now learns
  // when a client approves/rejects a candidate they endorsed; these rows live in
  // public.notifications and are pulled via cnt_notifications, feeding the same
  // bell store so read/unread state survives reloads.
  function notifFromServer(n){
    return { key:'srv-'+n.id, _srvId:n.id, _refType:n.ref_type, _refId:n.ref_id,
      icon:_notifIcon(n.kind),
      html:'<b>'+_escN(n.title||'Notification')+'</b>'+(n.body?('<br>'+_escN(n.body)):''),
      sub:'', ts:(n.created_at?new Date(n.created_at).getTime():Date.now()), read:!!n.read_at };
  }
  let _notifPoll=null;
  async function loadServerNotifications(){
    if(!sb) return;
    try{
      const { data, error } = await sb.rpc('cnt_notifications',{ p_limit:30 });
      if(error || !Array.isArray(data)) return;
      // Reverse so unshift leaves newest on top; sync read-state on ones we hold.
      data.slice().reverse().forEach(n=>{
        const existing=notifStore.find(x=>x.key==='srv-'+n.id);
        if(existing) existing.read=!!n.read_at;
        else addNotif(notifFromServer(n));
      });
      renderBell();
    }catch(e){ /* offline / RPC missing: bell stays quiet */ }
  }
  function markAllRead(){
    notifStore.forEach(n=>n.read=true); _setLastSeen(); renderBell();
    if(sb) sb.rpc('cnt_notifications_read',{p_id:null}).catch(()=>{});
  }
  function injectBell(){
    if(document.getElementById('cnt-bell-wrap')){ renderBell(); return; }
    const header=document.querySelector('header'); if(!header) return;
    const wrap=document.createElement('div'); wrap.id='cnt-bell-wrap'; wrap.style.cssText='position:relative;';
    wrap.innerHTML='<button id="cnt-bell" class="text-slate-400 hover:text-red-800 transition cursor-pointer p-1 rounded-lg hover:bg-slate-100" title="Notifications" style="position:relative;"><span class="material-icons-outlined">notifications</span><span id="cnt-bell-badge" style="display:none;position:absolute;top:-1px;right:-1px;background:#dc2626;color:#fff;font-size:9px;font-weight:700;min-width:15px;height:15px;border-radius:99px;align-items:center;justify-content:center;padding:0 3px;">0</span></button>'
      +'<div id="cnt-bell-panel" style="display:none;position:absolute;right:0;top:40px;width:320px;max-height:430px;overflow-y:auto;background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.15);z-index:400;">'
      +'<div style="padding:12px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;"><span style="font-weight:700;font-size:13px;color:#0f172a;">Notifications</span><button id="cnt-bell-clear" style="font-size:11px;color:#7f1d1d;font-weight:600;cursor:pointer;">Mark all read</button></div>'
      +'<div id="cnt-bell-list"></div></div>';
    (document.getElementById('hdr-actions')||header).appendChild(wrap);
    document.getElementById('cnt-bell').addEventListener('click',(e)=>{ e.stopPropagation(); const p=document.getElementById('cnt-bell-panel'); const open=p.style.display==='block'; p.style.display=open?'none':'block'; if(!open) renderBell(); });
    document.getElementById('cnt-bell-clear').addEventListener('click',(e)=>{ e.stopPropagation(); markAllRead(); });
    document.addEventListener('click',(e)=>{ const w=document.getElementById('cnt-bell-wrap'); const p=document.getElementById('cnt-bell-panel'); if(p && w && !w.contains(e.target)) p.style.display='none'; });
    if(typeof Notification!=='undefined' && Notification.permission==='default'){ try{ Notification.requestPermission(); }catch(e){} }
    renderBell();
  }

  // ── Client Endorsement (Step 7): endorse → client approve / reject ──
  function _endorseBadge(st){
    const m={ approved:['#166534','#dcfce7','Client Approved'], rejected:['#b91c1c','#fee2e2','Client Rejected'], endorsed:['#b45309','#fef3c7','Endorsed — awaiting client'], none:['#64748b','#f1f5f9','Not yet endorsed'] };
    const x=m[st]||m.none;
    return '<span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;color:'+x[0]+';background:'+x[1]+';white-space:nowrap;">'+x[2]+'</span>';
  }
  // Client endorsement + deployment milestones unlock on any stage flagged
  // "Hired stage" in Settings (falls back to the built-in offer stages).
  function _atOfferStage(app){
    if(!app) return false;
    const hiredKeys=PIPELINE_STAGES.filter(s=>s.is_hired).map(s=>s.key);
    return (hiredKeys.length?hiredKeys:['hired','onboarding']).includes(app.stage);
  }
  function _offerLockNote(){
    return '<div style="font-size:11.5px;color:#94a3b8;margin-top:10px;display:flex;align-items:center;gap:6px;background:#f8fafc;border:1px solid #f1f5f9;padding:8px 10px;border-radius:8px;">'
      +'<span class="material-icons-outlined" style="font-size:14px;color:#cbd5e1;">lock</span>'
      +'Unlocks once the candidate reaches the <b style="color:#64748b;font-weight:700;">Job Offer</b> stage.</div>';
  }
  function _lockNote(msg){
    return '<div style="font-size:11.5px;color:#94a3b8;margin-top:10px;display:flex;align-items:center;gap:6px;background:#f8fafc;border:1px solid #f1f5f9;padding:8px 10px;border-radius:8px;">'
      +'<span class="material-icons-outlined" style="font-size:14px;color:#cbd5e1;">lock</span>'+msg+'</div>';
  }
  // Endorsement opens once the candidate has reached the Interview stage (i.e.
  // after they've been interviewed the recruiter decides whether to endorse).
  function _stageIdx(key){ return PIPELINE_STAGES.findIndex(s=>s.key===key); }
  function _atInterviewOrLater(app){
    if(!app) return false;
    const i=_stageIdx(app.stage); if(i<0) return false;       // pool / rejected / unknown
    let iv=_stageIdx('interview'); if(iv<0) iv=1;             // fallback: anything past the first stage
    return i>=iv;
  }
  function _nextStageKey(cur){
    const i=_stageIdx(cur);
    if(i<0 || i>=PIPELINE_STAGES.length-1) return null;      // unknown or already last
    return PIPELINE_STAGES[i+1].key;
  }
  // Advance a client-bound candidate to the next pipeline stage ("Proceed to
  // next level"), persisting like the refuse/reopen actions do.
  function _proceedNextLevel(app){
    const next=_nextStageKey(app.stage);
    if(!next){ if(window.showToast) showToast('Already at the final stage.','info'); return; }
    updateApplicant(app.id,{stage:next}); Object.assign(app,{stage:next});
    _persistApp(app,{stage:next});
    logAudit('stage','applicant', app._sid||app.id, 'Proceeded to '+getStageName(next));
    cntLogActivity(app,'stage','Proceeded to '+getStageName(next));
    if(window.showToast) showToast(app.name+' → '+getStageName(next),'success');
    document.getElementById('cnt-panel-dialog')?.remove();
    renderAll(); if(currentViewedApplicantId===app.id) cntProfileExtras(app);
  }
  function renderEndorsement(app){
    // Monitoring-only now: clients no longer endorse/approve/reject — their
    // portal is a read-only, anonymised view of where each of their candidates
    // is in the pipeline. This panel shows the client's visibility and keeps the
    // recruiter's pipeline controls (advance / refuse). The action-row chip
    // reflects the current stage (see cntSyncPanelChips).
    cntSyncPanelChips(app);
    const panel=document.getElementById('cnt-endorse-panel');
    if(!panel) return;
    if(!app){ panel.innerHTML=''; return; }
    const acct=app.account||app.client||'the client';
    const canStage=_atInterviewOrLater(app);
    const canAct=['super_admin','recruiter','recruitment_supervisor','account_officer'].includes(currentRole);
    let actions='';
    if(canAct && app.stage!=='rejected'){
      const outBtn=(color,border,label,fn)=>'<button class="cnt-endo-btn" data-fn="'+fn+'" style="font-size:12px;font-weight:600;padding:6px 13px;border-radius:8px;cursor:pointer;color:'+color+';background:#fff;border:1px solid '+border+';">'+label+'</button>';
      if(_nextStageKey(app.stage)) actions+=outBtn('#1d4ed8','#bfdbfe','Proceed to next level','proceed');
      actions+=outBtn('#b91c1c','#fecaca','Refuse','refuse');
    }
    const stageName=(typeof getStageName==='function'?getStageName(app.stage):app.stage)||'Applied';
    panel.innerHTML='<div>'
      +'<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">'
      +'<span style="font-size:12px;color:#64748b;font-weight:600;">Current stage</span>'
      +'<span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;color:#1d4ed8;background:#dbeafe;white-space:nowrap;">'+_escN(stageName)+'</span></div>'
      +'<div style="font-size:11.5px;color:#64748b;margin-top:10px;display:flex;align-items:flex-start;gap:6px;background:#f8fafc;border:1px solid #f1f5f9;padding:9px 11px;border-radius:8px;">'
        +'<span class="material-icons-outlined" style="font-size:14px;color:#94a3b8;margin-top:1px;">visibility</span>'
        +'<span>Visible to <b style="color:#334155;">'+_escN(acct)+'</b> in their monitoring portal (anonymised — no name, contact, or CV). They can see this candidate’s pipeline stage only.</span></div>'
      +(actions?'<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">'+actions+'</div>':(!canStage?_lockNote('Pipeline controls unlock after the candidate has been interviewed.'):''))
      +'</div>';
    panel.querySelectorAll('.cnt-endo-btn').forEach(b=>b.addEventListener('click',()=>{
      if(b.dataset.fn==='proceed') _proceedNextLevel(app);
      else if(b.dataset.fn==='refuse'){ document.getElementById('cnt-panel-dialog')?.remove(); if(window.cntOpenRefuse) cntOpenRefuse(app.id); }
    }));
  }
  async function setClientStatus(app, status, reason){
    const now=new Date().toISOString();
    const patch={ client_status:status };
    if(status==='endorsed') patch.endorsed_at=now;
    if(status==='approved'||status==='rejected') patch.decided_at=now;
    if(reason!==undefined) patch.client_reason=reason||null;
    Object.assign(app, patch);
    if(sb && app._web && app._sid){
      const { error }=await sb.from('applications').update(patch).eq('id',app._sid);
      if(error){ if(window.showToast) showToast('Save failed: '+error.message,'error'); return; }
    }
    logAudit('client_'+status,'applicant', app._sid||app.id, app.name+(reason?' — '+reason:''));
    if(window.showToast) showToast(app.name+' — '+(status==='endorsed'?'endorsed to client':'client '+status),'success');
    renderEndorsement(app);
  }

  // ── Contract → Deployment → New Hire Report milestones (Steps 8–10) ──
  const _MILESTONES=[
    {f:'preemp_requirements_at', label:'Pre-Employment Requirements'},
    {f:'contract_signed_at',     label:'Contract Signed'},
    {f:'oriented_at',            label:'Orientation Attended'},
    {f:'deployed_at',            label:'Deployed to Client'},
    {f:'newhire_reported_at',    label:'New Hire Report Filed'},
  ];
  function _fmtDate(iso){ if(!iso) return ''; try{ return new Date(iso).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}); }catch(e){ return String(iso).slice(0,10); } }
  function renderWorkflow(app){
    cntSyncPanelChips(app);
    const panel=document.getElementById('cnt-workflow-panel');
    if(!panel) return;
    if(!app){ panel.innerHTML=''; return; }
    // Deployment steps open once the candidate reaches the Job Offer / Hired
    // stage. (Clients no longer approve candidates — the portal is monitoring-
    // only — so the gate is the pipeline stage, driven by staff.)
    const approved=_atOfferStage(app);
    const canDo=approved && ['super_admin','recruiter','recruitment_supervisor'].includes(currentRole);
    const rows=_MILESTONES.map(m=>{
      const done=!!app[m.f];
      return '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid #f8fafc;">'
        +'<div style="display:flex;align-items:center;gap:9px;"><span class="material-icons-outlined" style="font-size:17px;color:'+(done?'#16a34a':'#cbd5e1')+';">'+(done?'check_circle':'radio_button_unchecked')+'</span><span style="font-size:12.5px;font-weight:600;color:'+(done?'#0f172a':'#64748b')+';">'+m.label+'</span></div>'
        +'<div style="display:flex;align-items:center;gap:8px;">'+(done?'<span style="font-size:11px;color:#94a3b8;">'+_fmtDate(app[m.f])+'</span>':'')
        +(canDo?'<button class="cnt-ms-btn" data-f="'+m.f+'" style="font-size:11px;font-weight:600;padding:4px 11px;border-radius:7px;cursor:pointer;color:'+(done?'#64748b':'#fff')+';background:'+(done?'#f1f5f9':'#7f1d1d')+';border:none;">'+(done?'Undo':'Mark done')+'</button>':'')
        +'</div></div>';
    }).join('');
    panel.innerHTML='<div>'
      +rows
      +(!approved?_lockNote('Unlocks once the candidate reaches the Job Offer / Hired stage.'):'')
      +(canDo?'<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;"><button class="cnt-print-dep" style="font-size:11.5px;font-weight:600;padding:6px 12px;border-radius:8px;cursor:pointer;color:#7f1d1d;background:#fff;border:1px solid #e2e8f0;display:inline-flex;align-items:center;gap:5px;"><span class="material-icons-outlined" style="font-size:15px;">print</span>Deployment Notice</button><button class="cnt-print-nh" style="font-size:11.5px;font-weight:600;padding:6px 12px;border-radius:8px;cursor:pointer;color:#7f1d1d;background:#fff;border:1px solid #e2e8f0;display:inline-flex;align-items:center;gap:5px;"><span class="material-icons-outlined" style="font-size:15px;">print</span>New Hire Report</button></div>':'')
      +'</div>';
    panel.querySelectorAll('.cnt-ms-btn').forEach(b=>b.addEventListener('click',()=>setMilestone(app,b.dataset.f)));
    const pd=panel.querySelector('.cnt-print-dep'); if(pd) pd.addEventListener('click',()=>printDeploymentNotice(app));
    const pn=panel.querySelector('.cnt-print-nh'); if(pn) pn.addEventListener('click',()=>printNewHirePacket(app));
  }
  async function setMilestone(app, field){
    const val = app[field] ? null : new Date().toISOString();
    // Save to the DB first, so a failure (e.g. a not-yet-migrated column) doesn't
    // leave the UI showing a step as done when it wasn't recorded.
    if(sb && app._web && app._sid){
      const patch={}; patch[field]=val;
      const {error}=await sb.from('applications').update(patch).eq('id',app._sid);
      if(error){
        const missing=/does not exist|could not find|schema cache|column/i.test(error.message||'');
        if(window.showToast) showToast(missing
          ? 'This step needs the pre-employment migration — run supabase/2026-07-27-preemp-milestone.sql.'
          : 'Save failed: '+error.message, 'error');
        return;
      }
    }
    app[field]=val;
    logAudit('milestone','applicant', app._sid||app.id, field+(val?' set':' cleared'));
    if(window.showToast) showToast(app.name+' — '+field.replace(/_at$/,'').replace(/_/g,' ')+(val?' recorded':' cleared'),'success');
    renderWorkflow(app);
  }

  // ── Endorsement / Deployment as action-row buttons ──────────────
  // Both used to sit as large panels at the top of the profile. They now open
  // on demand so the profile stays a profile; the buttons carry a compact
  // status chip so nothing is hidden from a glance.
  function cntSyncPanelChips(app){
    const ec=document.getElementById('endorse-btn-chip');
    const dc=document.getElementById('deploy-btn-chip');
    if(ec){
      // Reflects whether the candidate is being monitored by the client (i.e.
      // is in the active pipeline) vs. closed/rejected.
      const closed=app&&app.stage==='rejected';
      const dot=closed?'#dc2626':(_atOfferStage(app)?'#16a34a':'#1d4ed8');
      ec.innerHTML='<span style="display:inline-block;width:7px;height:7px;border-radius:99px;background:'+dot+';margin-left:4px;"></span>';
    }
    if(dc){
      const done=app?_MILESTONES.filter(m=>app[m.f]).length:0;
      dc.innerHTML=done?'<span style="font-size:10px;font-weight:700;color:#16a34a;margin-left:4px;">'+done+'/'+_MILESTONES.length+'</span>':'';
    }
  }
  function _cntPanelDialog(title, icon, bodyId){
    document.getElementById('cnt-panel-dialog')?.remove();
    const wrap=document.createElement('div');
    wrap.id='cnt-panel-dialog';
    wrap.className='fixed inset-0 z-[300] flex items-center justify-center p-4 no-print';
    wrap.innerHTML='<div class="absolute inset-0 bg-slate-900/50"></div>'
      +'<div class="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">'
      +'<div class="flex items-center justify-between px-5 py-3 border-b border-slate-100">'
      +'<div class="flex items-center gap-2"><span class="material-icons-outlined" style="font-size:18px;color:#7f1d1d;">'+icon+'</span>'
      +'<span class="text-sm font-bold text-slate-900">'+title+'</span></div>'
      +'<button class="cnt-panel-x text-slate-400 hover:text-slate-700 cursor-pointer"><span class="material-icons-outlined" style="font-size:20px;">close</span></button></div>'
      +'<div class="p-5 max-h-[70vh] overflow-y-auto"><div id="'+bodyId+'"></div></div></div>';
    const close=()=>wrap.remove();
    wrap.querySelector('.cnt-panel-x').addEventListener('click',close);
    wrap.firstElementChild.addEventListener('click',close);
    document.addEventListener('keydown',function esc(e){ if(e.key==='Escape'){ close(); document.removeEventListener('keydown',esc); } });
    document.body.appendChild(wrap);
  }
  window.cntOpenEndorsement=function(){
    const app=findApplicant(currentViewedApplicantId); if(!app) return;
    _cntPanelDialog('Client Monitoring','visibility','cnt-endorse-panel');
    renderEndorsement(app);
  };
  window.cntOpenDeployment=function(){
    const app=findApplicant(currentViewedApplicantId); if(!app) return;
    _cntPanelDialog('Contract → Deployment → New Hire','timeline','cnt-workflow-panel');
    renderWorkflow(app);
  };

  // ── Phase 4: KPI dashboard · SLA/aging · recruiter scorecard ──
  function _kpiCard(label, value, sub, color){
    return '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:13px 15px;flex:1;min-width:132px;">'
      +'<div style="font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#94a3b8;">'+label+'</div>'
      +'<div style="font-size:22px;font-weight:800;color:'+(color||'#0f172a')+';margin-top:3px;line-height:1.1;">'+value+'</div>'
      +(sub?'<div style="font-size:11px;color:#94a3b8;margin-top:2px;">'+sub+'</div>':'')+'</div>';
  }
  // MRF operations KPIs — live on the Hiring Requests view (the dashboard has
  // its own recruitment counters), so the two don't compete.
  function renderKPIs(){
    const host=document.getElementById('view-request'); if(!host) return;
    let panel=document.getElementById('cnt-kpi-panel');
    if(!panel){ panel=document.createElement('div'); panel.id='cnt-kpi-panel'; panel.style.cssText='margin-bottom:16px;'; host.insertBefore(panel, host.children[1]||null); }
    const apps=(typeof getAllApplicants==='function')?getAllApplicants():[];
    const hr=(typeof hiringRequests!=='undefined')?hiringRequests:[];
    const today=new Date(); today.setHours(0,0,0,0);
    const totalMRF=hr.length, filled=hr.filter(r=>r.status==='Filled').length, openMRF=hr.filter(r=>r.status==='Open'||r.status==='Pending').length;
    const fillRate=totalMRF?Math.round(filled/totalMRF*100):0;
    const overdue=hr.filter(r=>r.deadline && new Date(r.deadline)<today && r.status!=='Filled');
    const active=apps.filter(a=>a.stage!=='pool'&&a.stage!=='rejected').length;
    const hiredKeys=PIPELINE_STAGES.filter(s=>s.is_hired).map(s=>s.key);
    const hired=apps.filter(a=>hiredKeys.includes(a.stage)).length;
    const deployed=apps.filter(a=>a.deployed_at).length;
    let ttfSum=0, ttfN=0;
    apps.forEach(a=>{ if(a.deployed_at && a.appliedDate){ const d=(new Date(a.deployed_at)-new Date(a.appliedDate))/86400000; if(d>=0){ ttfSum+=d; ttfN++; } } });
    const avgTTF=ttfN?Math.round(ttfSum/ttfN):0;
    let html='<div style="display:flex;gap:12px;flex-wrap:wrap;">'
      +_kpiCard('Open MRFs', openMRF, filled+' filled', '#7f1d1d')
      +_kpiCard('Fill rate', fillRate+'%', totalMRF+' total', '#16a34a')
      +_kpiCard('Active pipeline', active, 'in process', '#0f172a')
      +_kpiCard('Hired', hired, 'reached offer', '#4338ca')
      +_kpiCard('Deployed', deployed, 'this cycle', '#0f766e')
      +_kpiCard('Avg time-to-fill', avgTTF?avgTTF+'d':'—', 'applied → deployed', '#b45309')
      +'</div>';
    if(overdue.length){
      html+='<div style="margin-top:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:11px 14px;display:flex;align-items:center;gap:9px;flex-wrap:wrap;">'
        +'<span class="material-icons-outlined" style="color:#dc2626;font-size:18px;">warning</span>'
        +'<span style="font-size:12.5px;color:#991b1b;font-weight:700;">'+overdue.length+' MRF'+(overdue.length!==1?'s':'')+' past deadline:</span>'
        +'<span style="font-size:12px;color:#b91c1c;">'+overdue.slice(0,5).map(r=>_escN(r.id+' · '+r.role)).join('  ·  ')+(overdue.length>5?'  +'+(overdue.length-5)+' more':'')+'</span></div>';
    }
    if(['super_admin','recruitment_manager','recruitment_supervisor'].includes(currentRole)){
      const byRec={};
      hr.forEach(r=>{ const k=r.assigned_name||'Unassigned'; if(!byRec[k])byRec[k]={total:0,open:0,filled:0}; byRec[k].total++; if(r.status==='Filled')byRec[k].filled++; else byRec[k].open++; });
      const keys=Object.keys(byRec).sort((a,b)=>(a==='Unassigned')-(b==='Unassigned')||a.localeCompare(b));
      if(keys.length){
        html+='<div style="margin-top:14px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;">'
          +'<div style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:9px;display:flex;align-items:center;gap:7px;"><span class="material-icons-outlined" style="font-size:16px;color:#7f1d1d;">groups</span>Recruiter Workload (MRFs)</div>'
          +'<div style="display:flex;flex-direction:column;gap:7px;">'
          +keys.map(k=>'<div style="display:flex;align-items:center;justify-content:space-between;font-size:12.5px;"><span style="color:'+(k==='Unassigned'?'#94a3b8':'#334155')+';font-weight:'+(k==='Unassigned'?'400':'600')+';">'+_escN(k)+'</span><span style="color:#64748b;">'+byRec[k].open+' open · '+byRec[k].filled+' filled · <b style="color:#0f172a;">'+byRec[k].total+'</b> total</span></div>').join('')
          +'</div></div>';
      }
    }
    panel.innerHTML=html;
  }
  if (typeof renderAll === 'function'){
    const _origRenderAllKPI = renderAll;
    renderAll = function(){ _origRenderAllKPI(); try{ renderKPIs(); }catch(e){ console.warn('kpi',e); } };
  }
  function notifyOverdueMRFs(){
    if(typeof hiringRequests==='undefined') return;
    const today=new Date(); today.setHours(0,0,0,0);
    hiringRequests.filter(r=>r.deadline && new Date(r.deadline)<today && r.status!=='Filled').forEach(r=>{
      addNotif({ key:'overdue-'+r.id, icon:'warning', html:'<b>MRF '+_escN(r.id)+'</b> is past its deadline', sub:_escN(r.role+' · '+r.account), ts:Date.now(), read:false });
    });
  }

  // ── Printable documents: Deployment Notice · New Hire Report ──
  function _printWindow(title, bodyHtml){
    const w=window.open('','_blank','width=840,height=1000');
    if(!w){ if(window.showToast) showToast('Allow pop-ups to print this document','error'); return; }
    w.document.write('<!doctype html><html><head><title>'+title+'</title><style>'
      +'*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;padding:46px 54px;font-size:13px;line-height:1.6}'
      +'.hd{display:flex;align-items:center;gap:14px;border-bottom:3px solid #7f1d1d;padding-bottom:14px;margin-bottom:20px}'
      +'.hd img{height:46px}.hd .co{font-weight:800;font-size:16px;color:#7f1d1d}.hd .co small{display:block;font-weight:400;color:#666;font-size:11px}'
      +'h1{font-size:19px;letter-spacing:.05em;text-align:center;margin:6px 0 18px;text-transform:uppercase}'
      +'table.kv{width:100%;border-collapse:collapse;margin:12px 0}table.kv td{padding:7px 10px;border:1px solid #ddd;vertical-align:top}table.kv td.l{background:#f7f7f7;font-weight:700;width:34%;color:#444}'
      +'.sec{font-weight:700;text-transform:uppercase;font-size:11.5px;color:#7f1d1d;letter-spacing:.05em;margin:20px 0 6px;border-bottom:1px solid #eee;padding-bottom:4px}'
      +'.sign{display:flex;justify-content:space-between;gap:40px;margin-top:54px}.sign div{flex:1;text-align:center}.sign .line{border-top:1px solid #333;margin-top:42px;padding-top:5px;font-size:11px;color:#555}'
      +'.foot{margin-top:36px;font-size:10px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:10px}'
      +'@media print{body{padding:26px 32px}}</style></head><body>'
      +'<div class="hd"><img src="https://cnt-website-ats.vercel.app/assets/img/cnt-logo.png"><div class="co">CNT Promo &amp; Ads Specialists, Inc.<small>DOLE-Licensed Manpower &amp; Recruitment Agency</small></div></div>'
      +bodyHtml+'<div class="foot">Generated by CNT ATS · '+new Date().toLocaleString('en-PH')+' · Confidential</div></body></html>');
    w.document.close();
    setTimeout(()=>{ try{ w.focus(); w.print(); }catch(e){} }, 450);
  }
  function _kv(label,val){ return '<tr><td class="l">'+label+'</td><td>'+_escN(val==null||val===''?'—':val)+'</td></tr>'; }
  function printDeploymentNotice(app){
    if(!app) return;
    const body='<h1>Deployment Notification</h1>'
      +'<table class="kv">'+_kv('Employee Name', app.name)+_kv('Position', app.role)+_kv('Client Account', app.account)+_kv('Deployment Location', app.location)
      +_kv('Deployment Date', app.deployed_at?_fmtDate(app.deployed_at):'________________')+_kv('Contract Signed', app.contract_signed_at?_fmtDate(app.contract_signed_at):'—')+_kv('Orientation', app.oriented_at?_fmtDate(app.oriented_at):'—')+'</table>'
      +'<p>This confirms that the above-named employee has completed the required pre-employment documents and is hereby deployed to the client account indicated, effective on the deployment date stated above.</p>'
      +'<div class="sign"><div><div class="line">Recruiter / HR</div></div><div><div class="line">Account Officer</div></div><div><div class="line">Client Representative</div></div></div>';
    _printWindow('Deployment Notice — '+app.name, body);
    logAudit('print_deployment','applicant', app._sid||app.id, app.name);
  }
  function printNewHirePacket(app){
    if(!app) return;
    const body='<h1>New Hire Report</h1>'
      +'<div class="sec">Employee Details</div><table class="kv">'+_kv('Name', app.name)+_kv('Position', app.role)+_kv('Client Account', app.account)+_kv('Location', app.location)+_kv('Contact No.', app.phone)+_kv('Email', app.email)+_kv('Source', app.source)+'</table>'
      +'<div class="sec">Recruitment Timeline</div><table class="kv">'+_kv('Date Applied', app.appliedDate)+_kv('Job Offer / Hired', _atOfferStage(app)?(typeof getStageName==='function'?getStageName(app.stage):app.stage):'—')+_kv('Contract Signed', app.contract_signed_at?_fmtDate(app.contract_signed_at):'—')+_kv('Orientation', app.oriented_at?_fmtDate(app.oriented_at):'—')+_kv('Deployed', app.deployed_at?_fmtDate(app.deployed_at):'—')+'</table>'
      +'<p>Complete 201-file documents attached and submitted to the Account Officer.</p>'
      +'<div class="sign"><div><div class="line">Prepared by (Recruiter)</div></div><div><div class="line">Received by (Account Officer)</div></div></div>';
    _printWindow('New Hire Report — '+app.name, body);
    logAudit('print_newhire','applicant', app._sid||app.id, app.name);
  }

  // ── CSV export ──
  function _downloadCSV(rows, filename){
    if(!rows.length){ if(window.showToast) showToast('Nothing to export yet','info'); return; }
    const cols=Object.keys(rows[0]);
    const esc=v=>{ v=(v==null?'':String(v)); return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; };
    const csv=[cols.join(',')].concat(rows.map(r=>cols.map(c=>esc(r[c])).join(','))).join('\n');
    const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  }
  function exportApplicantsCSV(){
    const apps=(typeof getAllApplicants==='function')?getAllApplicants():[];
    const rows=apps.map(a=>({ Name:a.name, Position:a.role, Client:a.account, Location:a.location, Stage:(typeof getStageName==='function'?getStageName(a.stage):a.stage), Source:a.source, Applied:a.appliedDate, Contract:a.contract_signed_at?_fmtDate(a.contract_signed_at):'', Deployed:a.deployed_at?_fmtDate(a.deployed_at):'', Phone:a.phone, Email:a.email }));
    _downloadCSV(rows, 'cnt-applicants-'+new Date().toISOString().slice(0,10)+'.csv'); logAudit('export','applicants',null, rows.length+' rows');
  }
  function exportMRFsCSV(){
    const hr=(typeof hiringRequests!=='undefined')?hiringRequests:[];
    const rows=hr.map(r=>({ MRF:r.id, Client:r.account, Position:r.role, Location:r.location, Type:r.type, Headcount:r.count, Priority:r.priority, Status:r.status, AssignedTo:r.assigned_name||'', Date:r.date, Deadline:r.deadline }));
    _downloadCSV(rows, 'cnt-mrfs-'+new Date().toISOString().slice(0,10)+'.csv'); logAudit('export','mrfs',null, rows.length+' rows');
  }
  function injectReportsPanel(){
    const rv=document.getElementById('view-reports'); if(!rv || document.getElementById('cnt-reports-export')) return;
    const d=document.createElement('div'); d.id='cnt-reports-export'; d.style.cssText='margin-bottom:18px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;';
    d.innerHTML='<div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:3px;">Data Export</div><div style="font-size:12px;color:#64748b;margin-bottom:12px;">Download recruitment data as CSV — for management reporting, client billing, or DOLE compliance.</div>'
      +'<div style="display:flex;gap:10px;flex-wrap:wrap;">'
      +'<button onclick="cntExportApplicants()" style="display:inline-flex;align-items:center;gap:6px;background:#7f1d1d;color:#fff;font-size:12.5px;font-weight:600;padding:8px 14px;border-radius:8px;cursor:pointer;border:none;"><span class="material-icons-outlined" style="font-size:16px;">download</span>Applicants CSV</button>'
      +'<button onclick="cntExportMRFs()" style="display:inline-flex;align-items:center;gap:6px;background:#fff;color:#7f1d1d;font-size:12.5px;font-weight:600;padding:8px 14px;border-radius:8px;cursor:pointer;border:1px solid #e2e8f0;"><span class="material-icons-outlined" style="font-size:16px;">download</span>MRFs CSV</button>'
      +'</div>';
    rv.insertBefore(d, rv.firstChild);
  }
  window.cntExportApplicants=exportApplicantsCSV; window.cntExportMRFs=exportMRFsCSV;

  function showLogin(){ const o=document.getElementById('cnt-login'); if(o) o.style.display='flex'; }
  function hideLogin(){ const o=document.getElementById('cnt-login'); if(o) o.style.display='none'; }

  // ═══ Roles & Access (RBAC) ═══
  let currentRole = 'super_admin';
  let currentUserEmail = '';
  let currentUserName = '';
  let currentUserId = '';
  const ROLE_LABELS = { super_admin:'Super Admin', account_officer:'Account Officer', recruitment_manager:'Recruitment Manager', recruitment_supervisor:'Recruitment Supervisor', recruiter:'Recruiter', client:'Client (portal)' };
  const ROLE_MODULES = {
    super_admin:            ['dashboard','request','applications','job','talent-pool','interviews','onboarding','reports','settings'],
    account_officer:        ['dashboard','request','applications','reports'],
    recruitment_manager:    ['dashboard','request','applications','reports'],
    recruitment_supervisor: ['dashboard','request','applications','interviews'],
    recruiter:              ['dashboard','applications','job','talent-pool','interviews','onboarding'],
  };
  function roleLabel(r){ return ROLE_LABELS[r] || (r||'User'); }

  async function loadCurrentUser(){
    if(!sb){ currentRole='super_admin'; return; }
    try{
      const { data:{ user } } = await sb.auth.getUser();
      currentUserEmail = (user && user.email) || ''; currentUserId = (user && user.id) || '';
      const { data, error } = await sb.from('profiles').select('role,full_name,email').eq('id', user.id).maybeSingle();
      if(error){ console.error('profile fetch',error); currentRole='super_admin'; currentUserName=currentUserEmail; return; }  // fetch error → permissive (avoid lockout)
      if(!data){ currentRole='no_access'; currentUserName=currentUserEmail; return; }   // profile removed / not staff → access revoked
      currentRole = data.role || 'recruiter'; currentUserName = data.full_name || data.email || currentUserEmail;
      if(currentRole==='pending'){ currentRole='no_access'; }   // new sign-up not yet granted a staff role
      // A client account belongs in the client portal, never the staff ATS.
      if(currentRole==='client'){ currentRole='no_access'; window.cntWrongPortal='client'; }
    }catch(e){ console.error('loadCurrentUser',e); currentRole='super_admin'; }
  }

  function applyRoleScoping(){
    window.cntRole = currentRole;
    window.cntUserName = currentUserName || currentUserEmail || 'HR';
    const allowed = ROLE_MODULES[currentRole] || ROLE_MODULES['recruiter'];
    const map = { dashboard:'nav-dashboard', request:'nav-request', job:'nav-job', 'talent-pool':'nav-talent-pool', interviews:'nav-interviews', onboarding:'nav-onboarding', reports:'nav-reports', settings:'nav-settings' };
    Object.keys(map).forEach(mod=>{ const el=document.getElementById(map[mod]); if(el) el.style.display = allowed.includes(mod) ? '' : 'none'; });
    const canAdd = ['super_admin','recruiter','recruitment_supervisor'].includes(currentRole);
    const addBtn=document.getElementById('btn-add-applicant'); if(addBtn) addBtn.style.display = canAdd ? '' : 'none';
    if(typeof currentView!=='undefined' && !allowed.includes(currentView) && typeof switchView==='function'){ switchView(allowed[0]||'dashboard'); }
  }

  function injectRoleBadge(){
    if(document.getElementById('cnt-rolebadge')) return;
    const host=document.getElementById('hdr-actions'); if(!host) return;
    const b=document.createElement('div'); b.id='cnt-rolebadge';
    b.style.cssText='display:flex;flex-direction:column;align-items:flex-end;line-height:1.15;margin:0 4px;';
    b.innerHTML='<span style="font-weight:600;color:#334155;font-size:12px;">'+_escN(currentUserName||'—')+'</span><span style="color:#7f1d1d;font-weight:700;font-size:9.5px;letter-spacing:.03em;text-transform:uppercase;">'+_escN(roleLabel(currentRole))+'</span>';
    host.appendChild(b);
  }

  // Filters now live directly inside the pipeline view (see #pipeline-filters in
  // the markup). Nothing to move — just make sure the old header slot stays empty.
  function relocateFilters(){
    const hf=document.getElementById('hdr-filters'); if(hf) hf.style.display='none';
  }
  // Reset every pipeline filter
  window.cntClearFilters=function(){
    ['filter-location','filter-role','filter-stage','filter-source'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value='all'; });
    if(typeof selectClient==='function') selectClient('all'); else if(typeof currentAccount!=='undefined') currentAccount='all';
    if(window.cntClearJobFilters) cntClearJobFilters();   // reset the Job Positions bar too
    if(typeof searchQuery!=='undefined') searchQuery='';
    window.cntPipelineJob=null;
    const ctx=document.getElementById('pipeline-context'); if(ctx) ctx.textContent='Full-cycle PH recruitment workflow';
    if(window.cntShowPipelineFilters) cntShowPipelineFilters(true);
    renderAll();
  };

  function showRevoked(){
    let o=document.getElementById('cnt-revoked');
    if(!o){
      o=document.createElement('div'); o.id='cnt-revoked'; o.className='no-print';
      o.style.cssText='position:fixed;inset:0;z-index:600;background:#0f172a;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;';
      const isClient = window.cntWrongPortal==='client';
      o.innerHTML = isClient
        ? '<span class="material-icons-outlined" style="font-size:54px;color:#38bdf8;">business</span><h2 style="font-size:20px;font-weight:800;margin-top:14px;">This is a client account</h2><p style="color:#94a3b8;font-size:14px;margin-top:8px;max-width:360px;line-height:1.6;">Client logins use the CNT Client Portal, not the staff system. Head there to file vacancies and review the candidates endorsed to you.</p><a href="client.html" style="margin-top:22px;background:#0e7490;color:#fff;padding:10px 22px;border-radius:8px;font-weight:600;text-decoration:none;">Go to Client Portal</a><button id="cnt-revoked-out" style="margin-top:12px;background:transparent;color:#94a3b8;padding:6px 14px;border-radius:8px;font-weight:600;cursor:pointer;">Sign out</button>'
        : '<span class="material-icons-outlined" style="font-size:54px;color:#f87171;">lock</span><h2 style="font-size:20px;font-weight:800;margin-top:14px;">Access removed</h2><p style="color:#94a3b8;font-size:14px;margin-top:8px;max-width:340px;line-height:1.6;">Your access to the CNT ATS has been revoked. Please contact your administrator.</p><button id="cnt-revoked-out" style="margin-top:22px;background:#7f1d1d;color:#fff;padding:10px 22px;border-radius:8px;font-weight:600;cursor:pointer;">Sign out</button>';
      document.body.appendChild(o);
      o.querySelector('#cnt-revoked-out').onclick=async()=>{ try{ if(sb) await sb.auth.signOut(); }catch(e){} location.reload(); };
    }
    o.style.display='flex';
  }

  function logAudit(action, entity, ref, details){
    if(!sb) return;
    try{ sb.from('audit_log').insert({ actor_email: currentUserEmail||null, actor_role: currentRole||null, action, entity, entity_ref: ref?String(ref):null, details: details||null }).then(({error})=>{ if(error) console.warn('audit',error.message); }); }catch(e){}
  }

  // Settings → Audit Log viewer. Reads the staff-only audit_log table (RLS-gated).
  window.cntLoadAuditLog = async function(){
    const el=document.getElementById('audit-log-list'); if(!el) return;
    if(!sb){ el.innerHTML='<p class="text-[11px] text-slate-400 text-center py-6">Backend unavailable.</p>'; return; }
    el.innerHTML='<p class="text-[11px] text-slate-400 text-center py-6">Loading…</p>';
    const f=((document.getElementById('audit-filter')||{}).value||'').trim();
    let q=sb.from('audit_log').select('*').order('created_at',{ascending:false}).limit(200);
    if(f) q=q.ilike('action', f+'%');
    const { data, error } = await q;
    if(error){ el.innerHTML='<p class="text-[11px] text-red-500 text-center py-6">Could not load audit log: '+_e(error.message)+'</p>'; return; }
    if(!data || !data.length){ el.innerHTML='<p class="text-[11px] text-slate-400 text-center py-6">No matching activity.</p>'; return; }
    const icon=a=>({stage_change:'sync',refuse:'block',reopen:'restart_alt',job_edit:'work',job_post:'work',job_remove:'work_off',settings_add:'add',settings_remove:'remove',stage_add:'view_column',stage_edit:'view_column',applicant_remove:'person_remove'})[a]||'radio_button_unchecked';
    el.innerHTML='<div class="divide-y divide-slate-50">'+data.map(r=>{
      const when=r.created_at?new Date(r.created_at).toLocaleString('en-PH',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'';
      return '<div class="flex items-start gap-3 py-2">'
        +'<span class="material-icons-outlined text-slate-400 mt-0.5" style="font-size:15px;">'+icon(r.action)+'</span>'
        +'<div class="min-w-0 flex-1"><div class="text-slate-700"><span class="font-semibold">'+_e(r.action||'')+'</span> <span class="text-slate-300">·</span> '+_e(r.entity||'')+(r.details?' <span class="text-slate-500">— '+_e(r.details)+'</span>':'')+'</div>'
        +'<div class="text-[10px] text-slate-400">'+_e(r.actor_email||'system')+(r.actor_role?(' ('+_e(r.actor_role)+')'):'')+' · '+when+'</div></div></div>';
    }).join('')+'</div>';
  };

  // ── Events & Updates: super-admin-only posting to the public website ──
  let _eventsData=[];
  window.cntRenderEventsAdmin = function(){
    const card=document.getElementById('events-admin-card'); if(!card) return;
    const isSuper = (window.cntRole||currentRole)==='super_admin';
    card.classList.toggle('hidden', !isSuper);
    if(isSuper) cntLoadEventsAdmin();
  };
  window.cntLoadEventsAdmin = async function(){
    const el=document.getElementById('events-admin-list'); if(!el||!sb) return;
    el.innerHTML='<p class="text-[11px] text-slate-400 text-center py-4">Loading…</p>';
    const { data, error } = await sb.from('events').select('*').order('created_at',{ascending:false});
    if(error){ el.innerHTML='<p class="text-[11px] text-red-500 text-center py-4">'+_e(error.message)+'</p>'; return; }
    _eventsData=data||[];
    if(!_eventsData.length){ el.innerHTML='<p class="text-[11px] text-slate-400 text-center py-4">No posts yet. Click “New post”.</p>'; return; }
    el.innerHTML='<div class="divide-y divide-slate-50">'+_eventsData.map(ev=>
      '<div class="flex items-start gap-3 py-2">'
      +'<div class="min-w-0 flex-1"><div class="font-semibold text-slate-800">'+_e(ev.title||'')+(ev.published?'':' <span class="badge" style="background:#f1f5f9;color:#64748b;font-size:9px;">Draft</span>')+'</div>'
      +'<div class="text-[10px] text-slate-400">'+_e(ev.event_date||'')+(ev.category?(' · '+_e(ev.category)):'')+'</div></div>'
      +'<a href="event.html?id='+ev.id+'" target="_blank" class="text-indigo-600 hover:underline text-[11px] font-semibold cursor-pointer">View</a>'
      +'<button onclick="cntEventForm('+ev.id+')" class="text-slate-500 hover:text-slate-800 text-[11px] font-semibold cursor-pointer">Edit</button>'
      +'<button onclick="cntDeleteEvent('+ev.id+')" class="text-slate-400 hover:text-red-500 text-[11px] font-semibold cursor-pointer">Delete</button>'
      +'</div>').join('')+'</div>';
  };
  window.cntEventForm = function(id){
    const ev = id ? (_eventsData.find(x=>x.id===id)||{}) : {};
    let m=document.getElementById('cnt-event-modal');
    if(!m){ m=document.createElement('div'); m.id='cnt-event-modal'; m.className='hidden fixed inset-0 z-[400] flex items-center justify-center p-4'; document.body.appendChild(m); }
    const v=x=>_e(x||'');
    const cats=['Hiring Drive','Announcement','Milestone','Job Fair','Update'];
    m.innerHTML='<div class="absolute inset-0 bg-slate-900/50" onclick="document.getElementById(\'cnt-event-modal\').classList.add(\'hidden\')"></div>'
      +'<div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl z-10 border border-slate-200 overflow-hidden" style="max-height:92vh;display:flex;flex-direction:column;">'
      +'<div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between"><h3 class="font-bold text-sm text-slate-800">'+(id?'Edit post':'New post')+'</h3><button onclick="document.getElementById(\'cnt-event-modal\').classList.add(\'hidden\')" class="text-slate-400 hover:text-red-700 cursor-pointer"><span class="material-icons-outlined">close</span></button></div>'
      +'<div class="p-4 space-y-3 overflow-y-auto custom-scroll">'
        +'<input type="hidden" id="ev-id" value="'+(id||'')+'">'
        +'<div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Title <span class="text-red-500">*</span></label><input id="ev-title" value="'+v(ev.title)+'" class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"></div>'
        +'<div class="grid grid-cols-2 gap-3">'
          +'<div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Category</label><input id="ev-category" list="ev-cat-list" value="'+v(ev.category)+'" placeholder="Hiring Drive" class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"><datalist id="ev-cat-list">'+cats.map(c=>'<option value="'+c+'">').join('')+'</datalist></div>'
          +'<div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Date label</label><input id="ev-date" value="'+v(ev.event_date)+'" placeholder="Aug 2026" class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"></div>'
        +'</div>'
        +'<div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Image <span class="text-slate-400 font-normal normal-case">— upload a photo or paste a URL (optional)</span></label>'
          +'<div class="flex gap-2 items-center">'
            +'<label class="text-[11px] font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 flex items-center gap-1 whitespace-nowrap flex-none"><span class="material-icons-outlined" style="font-size:14px;">upload</span>Upload<input type="file" accept="image/*" class="hidden" onchange="cntEventImageUpload(this)"></label>'
            +'<input id="ev-image" value="'+v(ev.image_url)+'" placeholder="https://…" class="flex-1 min-w-0 text-xs border border-slate-200 rounded-lg px-3 py-2">'
          +'</div>'
          +'<div id="ev-image-preview">'+(ev.image_url?'<img src="'+v(ev.image_url)+'" alt="" style="max-height:120px;border-radius:8px;margin-top:8px;">':'')+'</div>'
        +'</div>'
        +'<div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Summary <span class="text-slate-400 font-normal normal-case">— short blurb on the card</span></label><textarea id="ev-summary" rows="2" class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 resize-none">'+v(ev.summary)+'</textarea></div>'
        +'<div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Full details <span class="text-slate-400 font-normal normal-case">— shown on the detail page</span></label><textarea id="ev-body" rows="6" class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 resize-none">'+v(ev.body)+'</textarea></div>'
        +'<label class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"><input type="checkbox" id="ev-published" '+((id?ev.published:true)?'checked':'')+' class="accent-red-800 w-4 h-4"> Published (visible on the website)</label>'
      +'</div>'
      +'<div class="px-4 py-3 border-t border-slate-100 flex justify-end gap-2"><button onclick="document.getElementById(\'cnt-event-modal\').classList.add(\'hidden\')" class="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-4 py-2 hover:bg-slate-50 cursor-pointer">Cancel</button>'
        +'<button onclick="cntSaveEvent()" class="text-xs font-semibold text-white bg-red-800 hover:bg-red-900 rounded-lg px-4 py-2 cursor-pointer">Save post</button></div>'
      +'</div>';
    m.classList.remove('hidden');
  };
  window.cntSaveEvent = async function(){
    if(!sb){ if(window.showToast) showToast('Backend unavailable','error'); return; }
    const id=(document.getElementById('ev-id')||{}).value||'';
    const row={
      title:((document.getElementById('ev-title')||{}).value||'').trim(),
      category:((document.getElementById('ev-category')||{}).value||'').trim()||null,
      event_date:((document.getElementById('ev-date')||{}).value||'').trim()||null,
      image_url:((document.getElementById('ev-image')||{}).value||'').trim()||null,
      summary:((document.getElementById('ev-summary')||{}).value||'').trim()||null,
      body:((document.getElementById('ev-body')||{}).value||'').trim()||null,
      published:!!(document.getElementById('ev-published')||{}).checked
    };
    if(!row.title){ if(window.showToast) showToast('Title is required','info'); return; }
    let error;
    if(id){ ({ error } = await sb.from('events').update(row).eq('id',id)); }
    else  { ({ error } = await sb.from('events').insert(row)); }
    if(error){ console.error('event save',error); if(window.showToast) showToast('Save failed: '+error.message,'error'); return; }
    logAudit(id?'event_edit':'event_post','event', id||'', row.title);
    const m=document.getElementById('cnt-event-modal'); if(m) m.classList.add('hidden');
    cntLoadEventsAdmin();
    if(window.showToast) showToast(id?'Post updated':'Post published','success');
  };
  window.cntDeleteEvent = async function(id){
    if(!sb) return;
    const ev=_eventsData.find(x=>x.id===id);
    if(!confirm('Delete “'+(ev?ev.title:'this post')+'” from the website?')) return;
    const { error } = await sb.from('events').delete().eq('id',id);
    if(error){ console.error('event delete',error); if(window.showToast) showToast('Delete failed: '+error.message,'error'); return; }
    logAudit('event_remove','event', id, ev?ev.title:'');
    cntLoadEventsAdmin();
    if(window.showToast) showToast('Post deleted','info');
  };
  window.cntEventImageUpload = async function(input){
    const f=input&&input.files&&input.files[0]; if(!f) return;
    if(!/^image\//.test(f.type)){ if(window.showToast) showToast('Please choose an image file.','error'); input.value=''; return; }
    if(f.size>5*1048576){ if(window.showToast) showToast('Image is larger than 5 MB.','error'); input.value=''; return; }
    if(!sb){ if(window.showToast) showToast('Backend unavailable','error'); return; }
    const ext=((f.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,''))||'jpg';
    const path='events/'+Date.now()+'_'+Math.random().toString(36).slice(2,8)+'.'+ext;
    if(window.showToast) showToast('Uploading image…','info');
    const up=await sb.storage.from('event-images').upload(path,f,{cacheControl:'3600',upsert:false});
    if(up.error){ console.error('event image',up.error); if(window.showToast) showToast('Upload failed: '+up.error.message,'error'); return; }
    const url=sb.storage.from('event-images').getPublicUrl(path).data.publicUrl;
    const inp=document.getElementById('ev-image'); if(inp) inp.value=url;
    const prev=document.getElementById('ev-image-preview'); if(prev) prev.innerHTML='<img src="'+_e(url)+'" alt="" style="max-height:120px;border-radius:8px;margin-top:8px;">';
    if(window.showToast) showToast('Image uploaded','success');
  };

  function injectAdminNav(){
    if(currentRole!=='super_admin' || document.getElementById('nav-admin')) return;
    const dash=document.getElementById('nav-dashboard'); if(!dash) return;
    const item=document.createElement('div');
    item.id='nav-admin'; item.className='sidenav-item'; item.title='Users & Roles';
    item.innerHTML='<span class="material-icons-outlined">admin_panel_settings</span><span>Users &amp; Roles</span>';
    item.onclick=openAdminUsers;
    dash.parentElement.appendChild(item);
  }
  // Users & Roles is an inline main-content view (no pop-up window). The markup
  // lives in ats.html (#view-admin, with #cnt-add-user-btn / #cnt-add-form /
  // #cnt-admin-body); here we just switch to it and populate.
  async function openAdminUsers(){
    if(currentRole!=='super_admin') return;
    if(typeof switchView==='function') switchView('admin');
    const addBtn=document.getElementById('cnt-add-user-btn'); if(addBtn) addBtn.onclick=toggleAddUserForm;
    const f=document.getElementById('cnt-add-form'); if(f){ f.style.display='none'; f.innerHTML=''; }
    renderAdminList();
  }
  window.openAdminUsers = openAdminUsers;

  function toggleAddUserForm(){
    const f=document.getElementById('cnt-add-form');
    if(f.style.display==='block'){ f.style.display='none'; return; }
    const roles=Object.keys(ROLE_LABELS);
    f.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
      +'<div><label style="font-size:10.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;">Email</label><input id="cnt-nu-email" type="email" autocomplete="off" placeholder="name@cntpromoads.com" style="width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:8px 11px;font-size:13px;margin-top:3px;"></div>'
      +'<div><label style="font-size:10.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;">Temporary password</label><input id="cnt-nu-pass" type="text" autocomplete="off" placeholder="min 6 characters" style="width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:8px 11px;font-size:13px;margin-top:3px;"></div>'
      +'<div><label style="font-size:10.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;">Role</label><select id="cnt-nu-role" style="width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:8px 11px;font-size:13px;margin-top:3px;background:#fff;">'+roles.map(r=>'<option value="'+r+'">'+ROLE_LABELS[r]+'</option>').join('')+'</select></div>'
      +'<div id="cnt-nu-acct-wrap" style="display:none;"><label style="font-size:10.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;">Client account</label><select id="cnt-nu-client-account" style="width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:8px 11px;font-size:13px;margin-top:3px;background:#fff;"><option value="">Select a client…</option>'+_taxNames('client').map(c=>'<option value="'+_escN(c)+'">'+_escN(c)+'</option>').join('')+'</select></div>'
      +'<div style="display:flex;align-items:flex-end;"><button id="cnt-nu-create" style="width:100%;background:#7f1d1d;color:#fff;font-size:13px;font-weight:600;padding:9px;border-radius:8px;cursor:pointer;">Create login</button></div>'
      +'</div><div id="cnt-nu-msg" style="font-size:12px;margin-top:8px;"></div>';
    f.style.display='block';
    // Client accounts get a portal login tied to one client; the account
    // selector only applies to that role.
    const roleSel=document.getElementById('cnt-nu-role');
    const toggleAcct=()=>{ document.getElementById('cnt-nu-acct-wrap').style.display = roleSel.value==='client' ? '' : 'none'; };
    roleSel.addEventListener('change', toggleAcct); toggleAcct();
    document.getElementById('cnt-nu-create').onclick=submitNewUser;
  }

  async function submitNewUser(){
    const email=(document.getElementById('cnt-nu-email').value||'').trim();
    const pass=(document.getElementById('cnt-nu-pass').value||'');
    const role=document.getElementById('cnt-nu-role').value;
    const clientAccount = role==='client' ? ((document.getElementById('cnt-nu-client-account')||{}).value||'') : '';
    const msg=document.getElementById('cnt-nu-msg'); const btn=document.getElementById('cnt-nu-create');
    if(!email||!pass){ msg.style.color='#dc2626'; msg.textContent='Email and password are required.'; return; }
    if(pass.length<6){ msg.style.color='#dc2626'; msg.textContent='Password must be at least 6 characters.'; return; }
    if(role==='client' && !clientAccount){ msg.style.color='#dc2626'; msg.textContent='Choose which client this portal login is for.'; return; }
    btn.disabled=true; btn.textContent='Creating…'; msg.style.color='#64748b'; msg.textContent='';
    try{
      const tmp=window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, { auth:{ persistSession:false, autoRefreshToken:false, storageKey:'cnt-signup-tmp' } });
      const { data, error }=await tmp.auth.signUp({ email, password:pass });
      if(error) throw error;
      const uid=data && data.user && data.user.id;
      if(uid){ const patch={ role }; if(role==='client') patch.client_account=clientAccount; else patch.client_account=null;
        const { error:pe }=await sb.from('profiles').update(patch).eq('id', uid); if(pe) console.warn('role set',pe); }
      logAudit('user_create','user', uid||email, email+' · '+role);
      msg.style.color='#16a34a'; msg.textContent='Created '+email+' as '+ROLE_LABELS[role]+'. They can sign in with the password you set.';
      document.getElementById('cnt-nu-email').value=''; document.getElementById('cnt-nu-pass').value='';
      renderAdminList();
    }catch(err){ console.error(err); msg.style.color='#dc2626'; msg.textContent=(err.message||'Could not create user')+(/confirm/i.test(err.message||'')?' — turn off email confirmation in Supabase → Authentication.':''); }
    btn.disabled=false; btn.textContent='Create login';
  }

  // Role → [text colour, chip background] for the badge + avatar tint
  const ROLE_BADGE={ super_admin:['#991b1b','#fde8e8'], account_officer:['#b45309','#fef3c7'], recruitment_manager:['#6d28d9','#f3e8ff'], recruitment_supervisor:['#0f766e','#ccfbf1'], recruiter:['#1d4ed8','#dbeafe'], client:['#0e7490','#cffafe'] };
  function _roleBadge(r){ const c=ROLE_BADGE[r]||['#475569','#f1f5f9']; return '<span style="display:inline-block;font-size:11px;font-weight:700;padding:3px 11px;border-radius:99px;color:'+c[0]+';background:'+c[1]+';white-space:nowrap;">'+_escN(ROLE_LABELS[r]||r)+'</span>'; }
  function _avatarChip(name,email,r){ const t=(name||email||'?').trim(); const init=(t.split(/\s+/).map(w=>w[0]||'').join('').slice(0,2).toUpperCase())||'?'; const c=(ROLE_BADGE[r]||['#7f1d1d'])[0]; return '<div style="width:34px;height:34px;border-radius:50%;background:'+c+';color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex:none;">'+_escN(init)+'</div>'; }
  function _fmtD(iso){ if(!iso) return '—'; try{ return new Date(iso).toLocaleDateString('en-CA'); }catch(e){ return String(iso).slice(0,10); } }
  let _adminEditUid=null;
  window.cntAdminEdit=function(uid){ _adminEditUid=uid; renderAdminList(); };
  window.cntAdminCancelEdit=function(){ _adminEditUid=null; renderAdminList(); };
  window.cntAdminSaveEdit=async function(uid){
    const ni=document.getElementById('cnt-edit-name'), rs=document.getElementById('cnt-edit-role');
    const name=(ni?ni.value:'').trim(), role=rs?rs.value:'recruiter';
    const { error }=await sb.from('profiles').update({ full_name:name||null, role }).eq('id',uid);
    if(error){ if(window.showToast) showToast('Save failed: '+error.message,'error'); return; }
    logAudit('user_edit','user',uid,(name||'(no name)')+' · '+role);
    if(window.showToast) showToast('User updated','success');
    _adminEditUid=null; renderAdminList();
  };
  window.cntAdminRemove=function(uid){ const u=(window._cntUsers||[]).find(x=>x.id===uid); adminRemoveUser(uid, u?(u.full_name||u.email||'user'):'user'); };
  async function renderAdminList(){
    const body=document.getElementById('cnt-admin-body'); if(!body) return;
    body.innerHTML='<div style="padding:24px;color:#64748b;font-size:13px;">Loading users…</div>';
    const { data, error }=await sb.from('profiles').select('*').order('created_at',{ascending:false});
    if(error){ body.innerHTML='<div style="padding:24px;color:#ef4444;font-size:13px;">Could not load users: '+_escN(error.message)+'</div>'; return; }
    const users=data||[]; window._cntUsers=users;
    const roles=Object.keys(ROLE_LABELS);
    const thBase='text-align:left;padding:11px 14px;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#cbd5e1;font-weight:700;';
    const td='padding:11px 14px;';
    const rows=users.map(u=>{
      const isSelf=u.id===currentUserId;
      if(u.id===_adminEditUid){
        return '<tr style="background:#fff7f7;border-top:1px solid #f1f5f9;">'
          +'<td style="'+td+'"><input id="cnt-edit-name" value="'+_escN(u.full_name||'')+'" placeholder="Full name" style="width:100%;box-sizing:border-box;border:1px solid #e2e8f0;border-radius:7px;padding:6px 9px;font-size:12.5px;"></td>'
          +'<td style="'+td+'font-family:monospace;font-size:11.5px;color:#94a3b8;">'+_escN(u.email||'')+'</td>'
          +'<td style="'+td+'"><select id="cnt-edit-role" style="border:1px solid #e2e8f0;border-radius:7px;padding:6px 9px;font-size:12.5px;background:#fff;">'+roles.map(r=>'<option value="'+r+'"'+(u.role===r?' selected':'')+'>'+ROLE_LABELS[r]+'</option>').join('')+'</select></td>'
          +'<td style="'+td+'font-size:12px;color:#94a3b8;">'+_fmtD(u.created_at)+'</td>'
          +'<td style="'+td+'text-align:right;white-space:nowrap;"><button onclick="cntAdminSaveEdit(\''+u.id+'\')" style="background:#16a34a;color:#fff;border:none;border-radius:7px;padding:6px 13px;font-size:11.5px;font-weight:600;cursor:pointer;margin-right:5px;">Save</button><button onclick="cntAdminCancelEdit()" style="background:#f1f5f9;color:#475569;border:none;border-radius:7px;padding:6px 13px;font-size:11.5px;font-weight:600;cursor:pointer;">Cancel</button></td></tr>';
      }
      return '<tr style="border-top:1px solid #f1f5f9;">'
        +'<td style="'+td+'"><div style="display:flex;align-items:center;gap:10px;">'+_avatarChip(u.full_name,u.email,u.role)+'<span style="font-weight:600;color:#0f172a;font-size:13px;">'+_escN(u.full_name||u.email||'—')+(isSelf?' <span style="font-size:10px;color:#94a3b8;font-weight:500;">(you)</span>':'')+'</span></div></td>'
        +'<td style="'+td+'font-family:monospace;font-size:11.5px;color:#94a3b8;">'+_escN(u.email||'')+'</td>'
        +'<td style="'+td+'">'+_roleBadge(u.role)+'</td>'
        +'<td style="'+td+'font-size:12px;color:#94a3b8;">'+_fmtD(u.created_at)+'</td>'
        +'<td style="'+td+'text-align:right;white-space:nowrap;">'
          +'<button onclick="cntAdminEdit(\''+u.id+'\')" title="Edit name & role" style="width:30px;height:30px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;color:#475569;cursor:pointer;margin-right:5px;vertical-align:middle;"><span class="material-icons-outlined" style="font-size:15px;vertical-align:middle;">edit</span></button>'
          +(isSelf?'':'<button onclick="cntAdminRemove(\''+u.id+'\')" title="Remove access" style="width:30px;height:30px;border-radius:8px;background:#fef2f2;border:1px solid #fecaca;color:#dc2626;cursor:pointer;vertical-align:middle;"><span class="material-icons-outlined" style="font-size:15px;vertical-align:middle;">delete</span></button>')
        +'</td></tr>';
    }).join('');
    body.innerHTML='<div style="overflow-x:auto;border:1px solid #e8ecf1;border-radius:12px;"><table style="width:100%;border-collapse:collapse;min-width:600px;">'
      +'<thead><tr style="background:#0f172a;">'
      +'<th style="'+thBase+'">Name</th><th style="'+thBase+'">Email</th><th style="'+thBase+'">Role</th><th style="'+thBase+'">Created</th>'
      +'<th style="'+thBase+'text-align:right;">Actions</th></tr></thead>'
      +'<tbody>'+(rows||'<tr><td colspan="5" style="padding:26px;text-align:center;color:#94a3b8;font-size:13px;">No staff logins yet — use “Add user”.</td></tr>')+'</tbody></table></div>';
  }

  async function adminRemoveUser(uid, label){
    if(uid===currentUserId){ if(window.showToast) showToast("You can't remove your own account.",'error'); return; }
    if(!confirm('Remove access for '+label+'? They will be locked out of the ATS on their next visit.')) return;
    const { error }=await sb.from('profiles').delete().eq('id', uid);
    if(error){ if(window.showToast) showToast('Remove failed: '+error.message,'error'); return; }
    logAudit('user_remove','user', uid, label);
    if(window.showToast) showToast('User removed','info');
    renderAdminList();
  }

  async function startApp(){
    hideLogin();
    await loadCurrentUser();
    if(currentRole==='no_access'){ showRevoked(); return; }
    applyRoleScoping();
    relocateFilters();
    await loadStages();            // pipeline definition first — everything renders off it
    await loadTaxonomy();          // master data next — feeds every dropdown
    buildClientDropdown();
    await loadApplications();
    await loadHiringRequests();
    await loadRecruiters();
    await loadJobsFromBackend();
    watchFilters();      // persist filter changes for this session
    restoreFilters();    // put back what was selected before the reload
    renderAll();
    restoreView();       // and the view + board/list mode from last time
    injectBell();
    injectRoleBadge();
    injectLogout();
    injectAdminNav();
    injectReportsPanel();
    injectEmailPanel();
    notifyOverdueMRFs();
    loadServerNotifications();
    if(!_notifPoll) _notifPoll=setInterval(loadServerNotifications, 60000);
    setupLiveUpdates();
    logAudit('login','session',null,null);
  }

  let _liveSetup=false, _refetching=false;
  function isLoginOpen(){ const o=document.getElementById('cnt-login'); return o && o.style.display!=='none'; }
  async function refreshApplications(){
    if(_refetching||!sb) return;
    _refetching=true;
    await loadApplications();
    await loadHiringRequests();
    await loadJobsFromBackend();
    renderAll();
    _refetching=false;
  }
  function setupLiveUpdates(){
    if(_liveSetup) return; _liveSetup=true;
    // re-fetch whenever HR returns to the ATS tab
    document.addEventListener('visibilitychange',()=>{ if(!document.hidden && !isLoginOpen()) refreshApplications(); });
    window.addEventListener('focus',()=>{ if(!isLoginOpen()) refreshApplications(); });
    // instant reflect via Supabase realtime (needs the applications table in the realtime publication)
    try{
      sb.channel('public:applications')
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'applications'},payload=>{
          const r=payload.new;
          if(r && !findApplicant('web-'+r.id)){ addApplicant(mapRow(r)); renderAll(); }
          if(r) addNotif(notifFromApplication(r),{toast:true, desktop:true});
        }).subscribe();
    }catch(e){ console.warn('realtime unavailable',e); }
  }

  function injectLogout(){
    if(document.getElementById('cnt-logout')) return;
    const header=document.querySelector('header'); if(!header) return;
    const btn=document.createElement('button');
    btn.id='cnt-logout';
    btn.className='text-slate-400 hover:text-red-800 transition cursor-pointer p-1 rounded-lg hover:bg-slate-100';
    btn.title='Sign out'; btn.innerHTML='<span class="material-icons-outlined">logout</span>';
    // Wipe every cached/remembered value on sign-out — nothing of this session
    // should survive for whoever uses the machine next.
    btn.onclick=async()=>{ cacheClearAll(); if(sb) await sb.auth.signOut(); location.reload(); };
    (document.getElementById('hdr-actions')||header).appendChild(btn);
  }

  function showDemoBanner(){
    if(document.getElementById('cnt-demo-banner')) return;
    const b=document.createElement('div'); b.id='cnt-demo-banner';
    b.className='no-print';
    b.style.cssText='position:fixed;bottom:16px;left:16px;z-index:200;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;font-size:12px;line-height:1.5;padding:9px 13px;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,.08);max-width:290px;';
    b.innerHTML='<b>Demo mode.</b> Add your keys to <code>assets/supabase-config.js</code> to receive live website applications and enable HR login.';
    document.body.appendChild(b);
  }

  // ══════════════════════════════════════════════════════════════
  //  ODOO-STYLE RECRUITMENT MECHANICS
  //  Kanban evaluation (stars) · status dots · refuse reasons ·
  //  activity timeline · stage-entry email drafts
  //  Overlays the existing 8-stage pipeline — no stage changes.
  // ══════════════════════════════════════════════════════════════
  // Odoo's default refuse reasons, each mapped to its email template
  const REFUSE_REASONS = [
    { r:"Doesn't fit the job requirements", t:'refuse' },
    { r:"Job already fulfilled",            t:'refuse' },
    { r:"Duplicate",                        t:'refuse' },
    { r:"Spam",                             t:'refuse' },
    { r:"Refused by applicant: job fit",    t:'not_interested' },
    { r:"Refused by applicant: salary",     t:'not_interested' }
  ];
  const REFUSE_EMAIL = {
    refuse:         { name:'Recruitment: Refuse',                 s:'Your application with CNT — {role}', b:'Dear {name},\n\nThank you for your interest in the {role} position ({account}) and for the time you invested in our recruitment process.\n\nAfter careful consideration, we regret to inform you that we will not be moving forward with your application at this time. This decision is not a reflection of your abilities, and we encourage you to apply for future openings that match your profile.\n\nWe wish you every success in your career.\n\nBest regards,\nCNT Recruitment Team' },
    not_interested: { name:'Recruitment: Not interested anymore', s:'Your application with CNT — {role}', b:'Dear {name},\n\nThank you for letting us know. We have noted that you are no longer pursuing the {role} position ({account}) at this time, and have closed your application accordingly.\n\nShould your circumstances change, we would be glad to hear from you again. We wish you all the best.\n\nBest regards,\nCNT Recruitment Team' }
  };
  const PRIORITY_LABELS = ['Not rated','Good','Very Good','Excellent'];
  function _e(v){ return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function _persistApp(app, patch){
    if(sb && app && app._web && app._sid){
      sb.from('applications').update(patch).eq('id',app._sid).then(({error})=>{ if(error) console.error('persist',patch,error); });
    }
  }

  // Append an event to a candidate's activity log (persists to jsonb column)
  function cntLogActivity(app, type, text){
    if(!app) return;
    if(!Array.isArray(app.activity)) app.activity=[];
    app.activity.unshift({ type, text, who:(window.cntUserName||'HR'), ts:new Date().toISOString() });
    if(app.activity.length>100) app.activity.length=100;
    _persistApp(app,{ activity:app.activity });
    if(currentViewedApplicantId===app.id) renderActivityList(app);
  }
  window.cntLogActivity = cntLogActivity;

  // ── Pre-employment document uploads (Background Check 201-file) ──
  // Persists the checklist ticks + a stored file path per requirement.
  window.cntPersistRequirements = function(id){
    const a=findApplicant(id); if(a) _persistApp(a,{ requirements:a.requirements||{}, requirement_docs:a.requirement_docs||{} });
  };
  window.cntPersistScorecard = function(id){
    const a=findApplicant(id); if(a) _persistApp(a,{ interview_scorecard:a.interview_scorecard||{} });
  };
  window.cntUploadReqDoc = async function(id, req, inputEl){
    const app=findApplicant(id); if(!app) return;
    const file=inputEl && inputEl.files && inputEl.files[0]; if(!file) return;
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(['pdf','jpg','jpeg','png','doc','docx'].indexOf(ext)<0){ if(window.showToast) showToast('Use a PDF, image (JPG/PNG) or Word file.','error'); inputEl.value=''; return; }
    if(file.size>5*1048576){ if(window.showToast) showToast(req+': file is larger than 5 MB.','error'); inputEl.value=''; return; }
    if(!sb){ if(window.showToast) showToast('Backend unavailable','error'); return; }
    const slug=String(req).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    const safe=file.name.replace(/[^\w.\-]/g,'_');
    const path='reqdocs/'+String(app._sid||app.id)+'/'+slug+'_'+Date.now()+'_'+safe;
    if(window.showToast) showToast('Uploading '+req+'…','info');
    const up=await sb.storage.from('documents').upload(path,file,{cacheControl:'3600',upsert:false});
    if(up.error){ console.error('reqdoc upload',up.error); if(window.showToast) showToast('Upload failed: '+up.error.message,'error'); return; }
    if(!app.requirement_docs || typeof app.requirement_docs!=='object') app.requirement_docs={};
    if(!app.requirements || typeof app.requirements!=='object') app.requirements={};
    app.requirement_docs[req]=path; app.requirements[req]=true;   // an uploaded doc counts as received
    cntPersistRequirements(id);
    cntLogActivity(app,'document','Uploaded '+req);
    if(typeof renderChecklistTab==='function') renderChecklistTab(app);
    if(window.showToast) showToast(req+' uploaded','success');
  };
  window.cntViewReqDoc = async function(id, req){
    const app=findApplicant(id); if(!app) return;
    const path=app.requirement_docs && app.requirement_docs[req]; if(!path){ if(window.showToast) showToast('No file on record.','info'); return; }
    if(!sb) return;
    const { data, error } = await sb.storage.from('documents').createSignedUrl(path, 300);
    if(error){ console.error('reqdoc view',error); if(window.showToast) showToast('Could not open: '+error.message,'error'); return; }
    window.open(data.signedUrl,'_blank','noopener');
  };
  window.cntRemoveReqDoc = async function(id, req){
    const app=findApplicant(id); if(!app) return;
    const path=app.requirement_docs && app.requirement_docs[req]; if(!path) return;
    if(!confirm('Remove the uploaded '+req+' file?')) return;
    if(sb){ try{ await sb.storage.from('documents').remove([path]); }catch(e){ console.warn('reqdoc remove',e); } }
    delete app.requirement_docs[req];
    cntPersistRequirements(id);
    cntLogActivity(app,'document','Removed '+req+' file');
    if(typeof renderChecklistTab==='function') renderChecklistTab(app);
    if(window.showToast) showToast(req+' file removed','info');
  };

  // ── Star evaluation (0–3 : None / Good / Very Good / Excellent) ──
  window.cntSetPriority = function(id, n){
    const app=findApplicant(id); if(!app) return;
    app.priority=n; updateApplicant(id,{priority:n}); _persistApp(app,{priority:n});
    logAudit('evaluation','applicant', app._sid||id, app.name+' → '+PRIORITY_LABELS[n]);
    cntLogActivity(app,'star','Evaluation set to '+PRIORITY_LABELS[n]);
    renderAll(); if(currentViewedApplicantId===id) cntProfileExtras(app);
  };

  // ── Kanban status (Odoo: In Progress / Ready for Next Stage / Blocked) ──
  const KANBAN_STATES=[
    { key:'normal',  label:'In Progress',          color:'#cbd5e1' },
    { key:'ready',   label:'Ready for Next Stage', color:'#16a34a' },
    { key:'blocked', label:'Blocked',              color:'#dc2626' }
  ];
  function _closeStatusMenu(){ const m=document.getElementById('cnt-status-menu'); if(m) m.remove(); }
  document.addEventListener('click',e=>{ if(!e.target.closest('#cnt-status-menu')) _closeStatusMenu(); });

  // Click the dot → a named menu, exactly like Odoo (not a blind cycle)
  window.cntStatusMenu=function(ev,id){
    ev.stopPropagation(); ev.preventDefault();
    _closeStatusMenu();
    const app=findApplicant(id); if(!app) return;
    const cur=app.kanban_state||'normal';
    const m=document.createElement('div'); m.id='cnt-status-menu';
    m.style.cssText='position:fixed;z-index:500;background:#fff;border:1px solid #e2e8f0;border-radius:9px;box-shadow:0 8px 26px rgba(0,0,0,.14);min-width:186px;overflow:hidden;padding:4px 0;';
    m.innerHTML=KANBAN_STATES.map(s=>
      '<button onclick="cntSetKanbanState(\''+id+'\',\''+s.key+'\')" style="width:100%;display:flex;align-items:center;gap:9px;padding:7px 12px;font-size:12.5px;cursor:pointer;background:'+(cur===s.key?'#f8fafc':'transparent')+';color:#334155;'+(cur===s.key?'font-weight:700;':'')+'" onmouseover="this.style.background=\'#f1f5f9\'" onmouseout="this.style.background=\''+(cur===s.key?'#f8fafc':'transparent')+'\'">'
        +'<span style="width:12px;flex:none;color:#16a34a;font-size:12px;">'+(cur===s.key?'✓':'')+'</span>'
        +'<span style="width:10px;height:10px;border-radius:50%;background:'+s.color+';flex:none;"></span>'
        +'<span>'+s.label+'</span></button>').join('');
    document.body.appendChild(m);
    const r=ev.currentTarget.getBoundingClientRect();
    let top=r.bottom+6, left=r.left;
    if(top+m.offsetHeight>window.innerHeight-8) top=r.top-m.offsetHeight-6;
    if(left+m.offsetWidth>window.innerWidth-8) left=window.innerWidth-m.offsetWidth-8;
    m.style.top=Math.max(8,top)+'px'; m.style.left=Math.max(8,left)+'px';
  };
  window.cntSetKanbanState=function(id,state){
    _closeStatusMenu();
    const app=findApplicant(id); if(!app || app.kanban_state===state) return;
    app.kanban_state=state; updateApplicant(id,{kanban_state:state}); _persistApp(app,{kanban_state:state});
    const label=(KANBAN_STATES.find(s=>s.key===state)||{}).label||state;
    cntLogActivity(app,'state','Marked “'+label+'”');
    renderAll();
  };
  // kept for older call sites
  window.cntCycleKanbanState=function(id){
    const app=findApplicant(id); if(!app) return;
    const order=KANBAN_STATES.map(s=>s.key);
    cntSetKanbanState(id, order[(order.indexOf(app.kanban_state||'normal')+1)%order.length]);
  };

  // ── Refuse with a structured reason (reuses the 'rejected' stage) ──
  function _refuse(id, reason){
    const app=findApplicant(id); if(!app) return;
    updateApplicant(id,{ stage:'rejected', status:'refused', refuse_reason:reason });
    Object.assign(app,{ stage:'rejected', status:'refused', refuse_reason:reason });
    _persistApp(app,{ stage:'rejected', status:'refused', refuse_reason:reason });
    logAudit('refuse','applicant', app._sid||id, app.name+' — '+reason);
    cntLogActivity(app,'refuse','Refused — '+reason);
    if(window.showToast) showToast(app.name+' refused','info');
    _closeRefuseModal(); renderAll(); if(currentViewedApplicantId===id) cntProfileExtras(app);
  }
  // ── Bulk helpers for the List view's multi-select action bar ──
  window.cntBulkRefuse = function(ids, reason){
    reason=(reason||'').trim()||'Bulk refuse';
    let n=0;
    (ids||[]).forEach(id=>{
      const app=findApplicant(id); if(!app) return;
      updateApplicant(id,{ stage:'rejected', status:'refused', refuse_reason:reason });
      Object.assign(app,{ stage:'rejected', status:'refused', refuse_reason:reason });
      _persistApp(app,{ stage:'rejected', status:'refused', refuse_reason:reason });
      logAudit('refuse','applicant', app._sid||id, app.name+' — '+reason);
      cntLogActivity(app,'refuse','Refused — '+reason); n++;
    });
    if(window.showToast) showToast(n+' candidate'+(n!==1?'s':'')+' refused','info');
    renderAll();
  };
  // Force-send a candidate's current-stage email (bulk "Email" — bypasses the opt-in flag).
  window.cntSendStageEmailNow = function(id){ const a=findApplicant(id); if(a) _maybeAutoStageEmail(a, a.stage, true); };

  window.cntReopen = function(id){
    const app=findApplicant(id); if(!app) return;
    updateApplicant(id,{ stage:'new', status:'active', refuse_reason:'' });
    Object.assign(app,{ stage:'new', status:'active', refuse_reason:'' });
    _persistApp(app,{ stage:'new', status:'active', refuse_reason:'' });
    logAudit('reopen','applicant', app._sid||id, app.name);
    cntLogActivity(app,'reopen','Re-opened — returned to Initial Screening');
    if(window.showToast) showToast(app.name+' re-opened','success');
    renderAll(); if(currentViewedApplicantId===id) cntProfileExtras(app);
  };
  window.cntDropRefuse = function(ev){
    ev.preventDefault();
    const id=ev.dataTransfer.getData('text/plain');
    const app=findApplicant(id); if(app && app.stage!=='rejected') cntOpenRefuse(id);
  };

  // Refuse dialog — Odoo style: pick a reason → its email template loads → send toggle
  function _closeRefuseModal(){ const m=document.getElementById('cnt-refuse-modal'); if(m) m.classList.add('hidden'); }
  // Built-in reasons + any configured in Settings (taxonomy kind='refuse_reason').
  // Custom reasons default to the generic 'refuse' email template.
  function _refuseReasons(){
    const extra=((window.cntTax&&window.cntTax.refuse_reason)||[]).map(x=>({r:x.name,t:'refuse'}));
    return REFUSE_REASONS.concat(extra);
  }
  function _refuseTemplateFor(idx){
    if(idx==='custom') return REFUSE_EMAIL.refuse;
    const list=_refuseReasons();
    const t=(list[idx]||list[0]).t;
    return REFUSE_EMAIL[t]||REFUSE_EMAIL.refuse;
  }
  window.cntRefuseReasonChange = function(id){
    const sel=document.getElementById('cnt-refuse-reason'); if(!sel) return;
    const app=findApplicant(id); if(!app) return;
    const custom=document.getElementById('cnt-refuse-custom-wrap');
    if(custom) custom.style.display = sel.value==='custom' ? 'block' : 'none';
    const tpl=_refuseTemplateFor(sel.value==='custom'?'custom':parseInt(sel.value,10));
    const nameEl=document.getElementById('cnt-refuse-tplname'); if(nameEl) nameEl.textContent=tpl.name;
    const subj=document.getElementById('cnt-refuse-subj'); if(subj) subj.value=_fillTpl(tpl.s,app);
    const body=document.getElementById('cnt-refuse-body'); if(body) body.value=_fillTpl(tpl.b,app);
  };
  window.cntToggleRefuseEmail = function(){
    const on=document.getElementById('cnt-refuse-send').checked;
    const panel=document.getElementById('cnt-refuse-email-panel');
    if(panel) panel.style.opacity=on?'1':'.45', panel.style.pointerEvents=on?'auto':'none';
  };
  window.cntOpenRefuse = function(id){
    const app=findApplicant(id); if(!app) return;
    let m=document.getElementById('cnt-refuse-modal');
    if(!m){
      m=document.createElement('div'); m.id='cnt-refuse-modal';
      m.className='hidden fixed inset-0 z-[400] flex items-center justify-center p-4';
      document.body.appendChild(m);
    }
    const tpl0=_refuseTemplateFor(0);
    m.innerHTML='<div class="absolute inset-0 bg-slate-900/50" onclick="document.getElementById(\'cnt-refuse-modal\').classList.add(\'hidden\')"></div>'
      +'<div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl z-10 border border-slate-200 overflow-hidden">'
      +'<div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between"><div class="flex items-center gap-2"><span class="material-icons-outlined text-red-700" style="font-size:18px;">block</span><h3 class="font-bold text-sm text-slate-800">Refuse '+_e(app.name)+'</h3></div><button onclick="document.getElementById(\'cnt-refuse-modal\').classList.add(\'hidden\')" class="text-slate-400 hover:text-red-700 cursor-pointer"><span class="material-icons-outlined">close</span></button></div>'
      +'<div class="p-4 space-y-3">'
      +'<div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Refuse Reason</label>'
        +'<select id="cnt-refuse-reason" onchange="cntRefuseReasonChange(\''+id+'\')" class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white">'
        +_refuseReasons().map((o,i)=>'<option value="'+i+'">'+_e(o.r)+'</option>').join('')
        +'<option value="custom">Other reason…</option></select></div>'
      +'<div id="cnt-refuse-custom-wrap" style="display:none;"><input id="cnt-refuse-custom" placeholder="Type a custom reason…" class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"></div>'
      +'<label class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1"><input type="checkbox" id="cnt-refuse-send" checked onchange="cntToggleRefuseEmail()" class="accent-red-800 w-4 h-4"> Send email to applicant</label>'
      +'<div id="cnt-refuse-email-panel" class="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">'
        +'<div class="flex items-center gap-2 text-[11px] text-slate-500"><span class="material-icons-outlined" style="font-size:13px;">description</span>Template: <span id="cnt-refuse-tplname" class="font-semibold text-slate-700">'+_e(tpl0.name)+'</span></div>'
        +'<div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">To</label><input value="'+_e(app.email||'')+'" readonly class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-500"></div>'
        +'<div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Subject</label><input id="cnt-refuse-subj" value="'+_e(_fillTpl(tpl0.s,app))+'" class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white"></div>'
        +'<div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Message</label><textarea id="cnt-refuse-body" rows="7" class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white resize-none leading-relaxed">'+_e(_fillTpl(tpl0.b,app))+'</textarea></div>'
        +'<p class="text-[10px] text-slate-400">Nothing is sent automatically — refusing opens this in your mail app so you can review and send.</p>'
      +'</div>'
      +'<div class="flex justify-end gap-2 pt-1"><button onclick="document.getElementById(\'cnt-refuse-modal\').classList.add(\'hidden\')" class="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-4 py-2 hover:bg-slate-50 cursor-pointer">Cancel</button>'
        +'<button onclick="cntDoRefuse(\''+id+'\')" class="text-xs font-semibold text-white bg-red-700 rounded-lg px-4 py-2 hover:bg-red-800 cursor-pointer flex items-center gap-1"><span class="material-icons-outlined" style="font-size:14px;">block</span>Refuse</button></div>'
      +'</div></div>';
    m.classList.remove('hidden');
  };
  window.cntDoRefuse = function(id){
    const sel=document.getElementById('cnt-refuse-reason');
    let reason;
    if(sel && sel.value==='custom'){ reason=(document.getElementById('cnt-refuse-custom').value||'').trim()||'Other'; }
    else { const list=_refuseReasons(); reason=(list[parseInt(sel?sel.value:'0',10)||0]||list[0]).r; }
    const send=document.getElementById('cnt-refuse-send');
    const wantEmail=send && send.checked;
    const subj=(document.getElementById('cnt-refuse-subj')||{}).value||'';
    const body=(document.getElementById('cnt-refuse-body')||{}).value||'';
    const app=findApplicant(id);
    _refuse(id, reason);
    if(wantEmail && app && app.email){
      // Try a real send; fall back to the mail app if email isn't configured yet
      (async()=>{
        try{
          const { data, error } = await sb.functions.invoke('send-email',{
            body:{ to:app.email, subject:subj, text:body, kind:'refusal', applicant_ref:String(app._sid||app.id) }
          });
          if(error || (data&&data.error)) throw new Error((data&&data.error)||error.message);
          cntLogActivity(app,'email','Refusal email sent to '+app.email);
          if(window.showToast) showToast('Refusal email sent to '+app.email,'success');
        }catch(e){
          console.warn('refusal email fell back to mail app:',e.message);
          cntLogActivity(app,'email','Refusal email drafted: '+subj);
          window.location.href='mailto:'+encodeURIComponent(app.email)+'?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(body);
        }
      })();
    }
  };
  // Back-compat (kanban drag → refuse): open the dialog
  window.cntConfirmRefuse = function(id, reason){ if(reason){ _refuse(id, reason); } else cntOpenRefuse(id); };

  // ── Activity timeline render (profile) ──
  function renderActivityList(app){
    const el=document.getElementById('resume-activity-list'); if(!el) return;
    const icons={stage:'trending_flat',star:'star',state:'flag',refuse:'block',reopen:'restart_alt',email:'mail',note:'edit'};
    const cols={stage:'#3b82f6',star:'#f59e0b',state:'#64748b',refuse:'#ef4444',reopen:'#10b981',email:'#6366f1',note:'#64748b'};
    const acts=Array.isArray(app.activity)?app.activity:[];
    if(!acts.length){ el.innerHTML='<p class="text-[11px] text-slate-400 py-2">No activity recorded yet. Stage moves, evaluations and refusals appear here automatically.</p>'; return; }
    el.innerHTML=acts.map(a=>{
      const c=cols[a.type]||'#64748b', ic=icons[a.type]||'circle';
      let when=''; try{ when=new Date(a.ts).toLocaleString('en-PH',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}); }catch(e){ when=''; }
      return '<div class="flex gap-2.5 items-start"><span class="material-icons-outlined flex-shrink-0" style="font-size:15px;color:'+c+';margin-top:1px;">'+ic+'</span>'
        +'<div class="flex-1 min-w-0"><p class="text-[11.5px] text-slate-700 leading-snug">'+_e(a.text)+'</p>'
        +'<p class="text-[10px] text-slate-400">'+_e(a.who||'HR')+' · '+_e(when)+'</p></div></div>';
    }).join('');
  }

  // ── Profile extras: stars, refuse/reopen button state, banner, timeline ──
  function cntProfileExtras(app){
    if(!app) return;
    const stars=document.getElementById('resume-stars');
    if(stars){ stars.innerHTML=[1,2,3].map(n=>'<span onclick="cntSetPriority(\''+app.id+'\','+((app.priority||0)===n?0:n)+')" title="'+PRIORITY_LABELS[n]+'" class="cursor-pointer material-icons-outlined" style="font-size:16px;color:'+((app.priority||0)>=n?'#f59e0b':'#e2e8f0')+';">star</span>').join(''); }
    const plabel=document.getElementById('resume-priority-label'); if(plabel) plabel.textContent=app.priority?PRIORITY_LABELS[app.priority]:'';
    const refB=document.getElementById('resume-refuse-btn'), reoB=document.getElementById('resume-reopen-btn');
    const isRef=(app.stage==='rejected');
    if(refB) refB.classList.toggle('hidden', isRef);
    if(reoB) reoB.classList.toggle('hidden', !isRef);
    const banner=document.getElementById('resume-refused-banner');
    if(banner){ if(isRef){ banner.classList.remove('hidden'); banner.innerHTML='<span class="font-bold">Refused</span>'+(app.refuse_reason?' — '+_e(app.refuse_reason):''); } else banner.classList.add('hidden'); }
    // Interview round/type is stage-specific extra context; the rest of these
    // fields now live in the Odoo-style form grid, so no duplicate chip row.
    const meta=document.getElementById('resume-odoo-meta');
    if(meta){
      if(app.stage==='interview'&&(app.interviewRound||app.interviewType)){
        meta.className='mt-3 flex flex-wrap items-center gap-1.5';
        meta.innerHTML='<span class="badge" onclick="openInterviewModal(\''+app.id+'\')" title="Open interview details" style="background:#f3e8ff;color:#6d28d9;cursor:pointer;"><span class="material-icons-outlined" style="font-size:11px;margin-right:2px;">forum</span>'+_e([app.interviewRound,app.interviewType].filter(Boolean).join(' · '))+(app.interviewDate?(' · '+_e(_fmtDate(app.interviewDate))):'')+'</span>';
      } else { meta.className='hidden'; meta.innerHTML=''; }
    }
    renderActivityList(app);
  }
  window.cntProfileExtras = cntProfileExtras;
  // Refresh the endorsement + deployment panels after an in-modal stage change
  window.cntRefreshProfilePanels = function(app){
    try{ if(typeof renderEndorsement==='function') renderEndorsement(app); }catch(e){ console.warn('endorsement',e); }
    try{ if(typeof renderWorkflow==='function') renderWorkflow(app); }catch(e){ console.warn('workflow',e); }
  };

  // ── Stage-entry email drafts (compose only — recruiter copies / opens mail app) ──
  // Keyed by the live pipeline stages (new, interview, exam, bgcheck, hired,
  // onboarding) plus the pool/rejected states. A stage's own template set in
  // Settings overrides these built-ins.
  const STAGE_EMAIL = {
    new:       { s:'Application received — {role}', b:'Dear {name},\n\nThank you for applying for the {role} position with CNT Recruitment ({account}). We have received your application and our team is reviewing your profile. We will contact you regarding the next steps.\n\nWarm regards,\nCNT Recruitment Team' },
    interview: { s:'Interview invitation — {role}', b:'Dear {name},\n\nCongratulations! We would like to invite you to an interview for the {role} position ({account}, {location}). Please reply with a few time slots that work for you, and we will confirm the schedule.\n\nWarm regards,\nCNT Recruitment Team' },
    exam:      { s:'Pre-employment exam — {role}', b:'Dear {name},\n\nAs part of your application for {role} ({account}), please complete our pre-employment examination. Details will follow in a separate message.\n\nWarm regards,\nCNT Recruitment Team' },
    bgcheck:   { s:'Requirements & background check — {role}', b:'Dear {name},\n\nCongratulations on progressing in your application for {role} ({account}). Please prepare your pre-employment requirements (NBI, Medical, SSS, PhilHealth, Pag-IBIG, TIN, PSA, Diploma/TOR, Barangay Clearance) for verification.\n\nWarm regards,\nCNT Recruitment Team' },
    hired:     { s:'Job offer — {role} at CNT ({account})', b:'Dear {name},\n\nWe are delighted to offer you the position of {role} under our client account {account}, assigned at {location}. A formal offer letter will follow. Congratulations!\n\nWarm regards,\nCNT Recruitment Team' },
    onboarding:{ s:'Welcome & onboarding — {role}', b:'Dear {name},\n\nWelcome to the team! This message begins your onboarding for the {role} position ({account}, {location}). Our HR team will guide you through your first-day requirements.\n\nWarm regards,\nCNT Recruitment Team' },
    pool:      { s:'You’re in our talent pool — {role}', b:'Dear {name},\n\nThank you for your interest in the {role} position ({account}). While we are not moving forward for this specific role right now, we were impressed with your profile and have added you to our talent pool. We will reach out when a suitable opening comes up.\n\nWarm regards,\nCNT Recruitment Team' },
    rejected:  { s:'Update on your application — {role}', b:'Dear {name},\n\nThank you for your interest in the {role} position ({account}) and for the time you invested in the process. After careful consideration we will not be moving forward at this time. We wish you all the best and encourage you to apply for future openings.\n\nWarm regards,\nCNT Recruitment Team' }
  };
  function _fillTpl(t, app){
    const d=app.interviewDate||'', tm=app.interviewTime||'';
    const niceD=(d && typeof fmtMonth==='function' && typeof fmtDay==='function')?(fmtMonth(d)+' '+fmtDay(d)):d;
    const niceT=(tm && typeof fmtTime==='function')?fmtTime(tm):tm;
    const venue=app.interviewVenue||'';
    return t.replace(/\{name\}/g,app.name||'').replace(/\{role\}/g,app.role||'the role').replace(/\{account\}/g,app.account||'CNT').replace(/\{location\}/g,app.location||'')
      .replace(/\{idate\}/g,niceD).replace(/\{itime\}/g,niceT).replace(/\{itype\}/g,app.interviewType||'Interview').replace(/\{iround\}/g,app.interviewRound||'').replace(/\{ivenue\}/g,venue).replace(/\{ilink\}/g,venue); }

  // Interview-scheduled email — sent automatically when a date + time are set.
  // {ivenue} carries the venue OR the video link the recruiter entered.
  const INTERVIEW_EMAIL = {
    s: 'Interview scheduled — {role}',
    b: 'Dear {name},\n\nGood news! Your interview for the {role} position ({account}) has been scheduled. Please see the details below:\n\nDate: {idate}\nTime: {itime}\nType: {itype}\n{ivenueLine}\n\nKindly be ready 5–10 minutes early. If the details above include a video link, simply click it at the scheduled time to join. Should you need to reschedule, please contact us at hrdadmin@cntpromoads.com.\n\nWe look forward to meeting you!\n\nWarm regards,\nCNT Recruitment Team'
  };
  const _interviewEmailSent = new Set();
  async function _maybeInterviewEmail(app, patch){
    if(!sb || !app || !app.email) return;
    const scheduled = (patch && patch.interview_date && patch.interview_time) || (app.interviewDate && app.interviewTime);
    if(!scheduled) return;
    const key = String(app._sid||app.id)+':'+(app.interviewDate||'')+':'+(app.interviewTime||'');
    if(_interviewEmailSent.has(key)) return;
    _interviewEmailSent.add(key);
    const venue=(app.interviewVenue||'').trim();
    const isLink=/^https?:\/\//i.test(venue);
    const venueLine = venue ? ((isLink?'Video link: ':'Venue: ')+venue) : 'Venue: to be confirmed';
    const subject = _fillTpl(INTERVIEW_EMAIL.s, app);
    const text = _fillTpl(INTERVIEW_EMAIL.b, app).replace(/\{ivenueLine\}/g, venueLine);
    try{
      const { data, error } = await sb.functions.invoke('send-email',{ body:{ to:app.email, subject, text, kind:'interview', applicant_ref:String(app._sid||app.id) } });
      if(error || (data&&data.error)) throw new Error((data&&data.error)||(error&&error.message)||'send failed');
      cntLogActivity(app,'email','Interview details sent to '+app.email+(isLink?' (with video link)':''));
      if(window.showToast) showToast('Interview details emailed to '+app.email,'success');
    }catch(e){
      _interviewEmailSent.delete(key);
      cntLogActivity(app,'email','Interview email not sent (email not configured?)');
    }
  }
  window._maybeInterviewEmail = _maybeInterviewEmail;

  // Job-offer email — its own dedicated format (like the interview one), sent
  // automatically when an offer is generated. Carries the proposed salary and
  // validity so it reads as a real offer, distinct from the generic stage note.
  const OFFER_EMAIL = {
    s: 'Job offer — {role} at CNT ({account})',
    b: 'Dear {name},\n\nCongratulations! On behalf of CNT Promo & Ads Specialists, Inc., we are pleased to formally offer you the position of {role} under our client {account}{locationClause}.\n\nOffer details\n• Position: {role}\n• Proposed salary: {salary}\n• Offer valid until: {validity}\n\nTo accept, simply reply to this email or contact us at hrdadmin@cntpromoads.com. A formal offer letter and your pre-employment requirements will follow after you confirm.\n\nWe are excited to welcome you to the team!\n\nWarm regards,\nCNT Recruitment Team'
  };
  const _offerEmailSent = new Set();
  async function _maybeOfferEmail(app){
    if(!sb || !app || !app.email) return;
    const proposed=String(app.proposed_salary||'').trim();
    if(!proposed) return;   // only email once a real salary has been proposed
    const validity=app.offer_validity||'';
    const key=String(app._sid||app.id)+':offer:'+proposed+':'+validity;
    if(_offerEmailSent.has(key)) return;                     // don't re-send an unchanged offer
    _offerEmailSent.add(key);
    let niceVal=validity;
    try{ if(validity) niceVal=new Date(validity+'T00:00').toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'}); }catch(e){}
    const salaryStr=/^[\d,.\s]+$/.test(proposed) ? ('₱'+proposed.trim()) : proposed;   // add ₱ for bare numbers
    const subject=_fillTpl(OFFER_EMAIL.s, app);
    const text=_fillTpl(OFFER_EMAIL.b, app)
      .replace(/\{salary\}/g, salaryStr)
      .replace(/\{validity\}/g, niceVal||'to be confirmed')
      .replace(/\{locationClause\}/g, app.location?(', assigned at '+app.location):'');
    try{
      const { data, error } = await sb.functions.invoke('send-email',{ body:{ to:app.email, subject, text, kind:'offer', applicant_ref:String(app._sid||app.id) } });
      if(error || (data&&data.error)) throw new Error((data&&data.error)||(error&&error.message)||'send failed');
      cntLogActivity(app,'email','Job offer emailed to '+app.email+' — '+salaryStr);
      if(window.showToast) showToast('Offer emailed to '+app.email,'success');
    }catch(e){
      _offerEmailSent.delete(key);
      cntLogActivity(app,'email','Offer email not sent (email not configured?)');
    }
  }
  window._maybeOfferEmail = _maybeOfferEmail;

  // Opt-in, default-off stage-entry email automation. Fires from executeStageChange
  // ONLY when the entered stage has auto_email enabled (Settings → Pipeline Stages).
  // Never sends without an email on file, and never falls back to the mail app —
  // silent automation. Deduped per candidate+stage for the session.
  const _autoSentStageEmail = new Set();
  async function _maybeAutoStageEmail(app, stageKey, force){
    if(!sb || !app) return;
    // Interviews and offers each send their own dedicated, richer email
    // (scheduled-interview details / job-offer details). Don't ALSO fire the
    // generic stage-entry email for those stages, or the candidate gets two.
    if(!force && (stageKey==='interview' || stageKey==='hired')) return;
    const st=PIPELINE_STAGES.find(s=>s.key===stageKey);
    if(!force && (!st || !st.auto_email)) return;           // stage not opted in (bulk "Email" forces it)
    if(!app.email){ if(!force) cntLogActivity(app,'email','Auto stage email skipped — no email on file'); return; }
    const dedupe=String(app._sid||app.id)+':'+stageKey;
    if(!force && _autoSentStageEmail.has(dedupe)) return;   // already sent this session
    if(!force) _autoSentStageEmail.add(dedupe);
    const fallback=STAGE_EMAIL[stageKey]||STAGE_EMAIL.new;
    const subject=_fillTpl((st.email_subject)||fallback.s, app);
    const text=_fillTpl((st.email_body)||fallback.b, app);
    try{
      const { data, error } = await sb.functions.invoke('send-email',{ body:{ to:app.email, subject, text, kind:'stage', applicant_ref:String(app._sid||app.id) } });
      if(error || (data&&data.error)) throw new Error((data&&data.error)||(error&&error.message)||'send failed');
      cntLogActivity(app,'email','Auto stage email sent to '+app.email+' — '+getStageName(stageKey));
      if(window.showToast) showToast('Stage email sent to '+app.email,'success');
    }catch(e){
      console.warn('auto stage email',e);
      _autoSentStageEmail.delete(dedupe);                   // let it retry on a later entry
      cntLogActivity(app,'email','Auto stage email not sent (email not configured?) — '+getStageName(stageKey));
    }
  }
  window._maybeAutoStageEmail = _maybeAutoStageEmail;

  // ── SMS to candidates (Semaphore, PH) — via the staff-gated send-sms function ──
  const SMS_TEMPLATES = {
    interview:'Hi {name}, CNT Recruitment here. You are invited to an interview for {role}. Please reply with your available date/time. Salamat!',
    reminder: 'Hi {name}, reminder: your {role} interview with CNT is on {idate} {itime}. Please be on time. Reply if you cannot make it.',
    general:  'Hi {name}, this is CNT Recruitment regarding your {role} application. Please reply if you have any questions. Salamat!'
  };
  function _fillSms(t, app){
    const d=app.interviewDate||'', tm=app.interviewTime||'';
    const niceD = (d && typeof fmtMonth==='function' && typeof fmtDay==='function') ? (fmtMonth(d)+' '+fmtDay(d)) : d;
    const niceT = (tm && typeof fmtTime==='function') ? fmtTime(tm) : tm;
    return _fillTpl(t,app).replace(/\{idate\}/g, niceD).replace(/\{itime\}/g, niceT);
  }
  window.cntSmsCount = function(){ const b=document.getElementById('cnt-sms-body'), c=document.getElementById('cnt-sms-count'); if(b&&c){ const n=b.value.length, seg=Math.max(1,Math.ceil(n/160)); c.textContent=n+' chars · '+seg+' SMS segment'+(seg!==1?'s':''); } };
  window.cntSmsTpl = function(id){ const app=findApplicant(id), sel=document.getElementById('cnt-sms-tpl'), body=document.getElementById('cnt-sms-body'); if(app&&sel&&body){ body.value=_fillSms(SMS_TEMPLATES[sel.value]||SMS_TEMPLATES.general, app); cntSmsCount(); } };
  window.cntDraftSMS = function(id){
    const app=findApplicant(id); if(!app) return;
    // If an interview is already scheduled, start on the reminder template (which
    // auto-fills the date/time); otherwise start on the invite.
    const startTpl = app.interviewDate ? 'reminder' : 'interview';
    const msg=_fillSms(SMS_TEMPLATES[startTpl], app);
    let m=document.getElementById('cnt-sms-modal');
    if(!m){ m=document.createElement('div'); m.id='cnt-sms-modal'; m.className='hidden fixed inset-0 z-[400] flex items-center justify-center p-4'; document.body.appendChild(m); }
    m.innerHTML='<div class="absolute inset-0 bg-slate-900/50" onclick="document.getElementById(\'cnt-sms-modal\').classList.add(\'hidden\')"></div>'
      +'<div class="bg-white w-full max-w-md rounded-2xl shadow-2xl z-10 border border-slate-200 overflow-hidden">'
      +'<div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between"><div class="flex items-center gap-2"><span class="material-icons-outlined text-emerald-600" style="font-size:18px;">sms</span><h3 class="font-bold text-sm text-slate-800">Send SMS — '+_e(app.name)+'</h3></div><button onclick="document.getElementById(\'cnt-sms-modal\').classList.add(\'hidden\')" class="text-slate-400 hover:text-red-700 cursor-pointer"><span class="material-icons-outlined">close</span></button></div>'
      +'<div class="p-4 space-y-3">'
      +'<div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">To (mobile)</label><input id="cnt-sms-to" value="'+_e(app.phone||'')+'" class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"></div>'
      +'<div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Template</label><select id="cnt-sms-tpl" onchange="cntSmsTpl(\''+id+'\')" class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white"><option value="interview"'+(startTpl==='interview'?' selected':'')+'>Interview invite</option><option value="reminder"'+(startTpl==='reminder'?' selected':'')+'>Interview reminder</option><option value="general">General</option></select></div>'
      +'<div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Message</label><textarea id="cnt-sms-body" rows="5" oninput="cntSmsCount()" class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 resize-none">'+_e(msg)+'</textarea><div class="text-[10px] text-slate-400 mt-1" id="cnt-sms-count"></div></div>'
      +'<p class="text-[10px] text-slate-400">Sends via Semaphore (PH SMS). Set <code>SEMAPHORE_API_KEY</code> on the send-sms function to enable delivery.</p>'
      +'<div class="flex justify-end gap-2 pt-1"><button onclick="document.getElementById(\'cnt-sms-modal\').classList.add(\'hidden\')" class="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-4 py-2 hover:bg-slate-50 cursor-pointer">Cancel</button>'
      +'<button id="cnt-sms-send" onclick="cntSendSMS(\''+id+'\')" class="text-xs font-semibold text-white bg-emerald-600 rounded-lg px-4 py-2 hover:bg-emerald-700 cursor-pointer flex items-center gap-1"><span class="material-icons-outlined" style="font-size:14px;">send</span>Send SMS</button></div>'
      +'</div></div>';
    m.classList.remove('hidden');
    cntSmsCount();
  };
  window.cntSendSMS = async function(id){
    const app=findApplicant(id); if(!app) return;
    const to=((document.getElementById('cnt-sms-to')||{}).value||'').trim();
    const message=((document.getElementById('cnt-sms-body')||{}).value||'').trim();
    if(!to){ if(window.showToast) showToast('Enter a mobile number','info'); return; }
    if(!message){ if(window.showToast) showToast('Message is empty','info'); return; }
    if(!sb){ if(window.showToast) showToast('Backend unavailable','error'); return; }
    const btn=document.getElementById('cnt-sms-send'); if(btn){ btn.disabled=true; btn.textContent='Sending…'; }
    try{
      const { data, error } = await sb.functions.invoke('send-sms',{ body:{ to, message, kind:'recruitment', applicant_ref:String(app._sid||app.id) } });
      if(error || (data&&data.error)) throw new Error((data&&data.error)||(error&&error.message)||'send failed');
      cntLogActivity(app,'sms','SMS sent to '+to);
      if(window.showToast) showToast('SMS sent to '+to,'success');
      const m=document.getElementById('cnt-sms-modal'); if(m) m.classList.add('hidden');
    }catch(e){
      console.error('send-sms',e);
      if(window.showToast) showToast('SMS not sent: '+(e.message||'is SEMAPHORE_API_KEY set?'),'error');
    }finally{ if(btn){ btn.disabled=false; btn.innerHTML='<span class="material-icons-outlined" style="font-size:14px;">send</span>Send SMS'; } }
  };

  window.cntDraftEmail = function(id){
    const app=findApplicant(id); if(!app) return;
    // A stage configured with its own template in Settings wins over the built-in one
    const st=PIPELINE_STAGES.find(s=>s.key===app.stage);
    const fallback=STAGE_EMAIL[app.stage]||STAGE_EMAIL.new;
    const tpl={ s:(st&&st.email_subject)||fallback.s, b:(st&&st.email_body)||fallback.b };
    const subject=_fillTpl(tpl.s,app), body=_fillTpl(tpl.b,app);
    let m=document.getElementById('cnt-email-modal');
    if(!m){ m=document.createElement('div'); m.id='cnt-email-modal'; m.className='hidden fixed inset-0 z-[400] flex items-center justify-center p-4'; document.body.appendChild(m); }
    m.innerHTML='<div class="absolute inset-0 bg-slate-900/50" onclick="document.getElementById(\'cnt-email-modal\').classList.add(\'hidden\')"></div>'
      +'<div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl z-10 border border-slate-200 overflow-hidden">'
      +'<div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between"><div class="flex items-center gap-2"><span class="material-icons-outlined text-indigo-600" style="font-size:18px;">mail</span><h3 class="font-bold text-sm text-slate-800">Draft email — '+_e(getStageName(app.stage))+'</h3></div><button onclick="document.getElementById(\'cnt-email-modal\').classList.add(\'hidden\')" class="text-slate-400 hover:text-red-700 cursor-pointer"><span class="material-icons-outlined">close</span></button></div>'
      +'<div class="p-4 space-y-3">'
      +'<div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">To</label><input id="cnt-mail-to" value="'+_e(app.email||'')+'" class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"></div>'
      +'<div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Subject</label><input id="cnt-mail-subj" value="'+_e(subject)+'" class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"></div>'
      +'<div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Message</label><textarea id="cnt-mail-body" rows="9" class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 resize-none leading-relaxed">'+_e(body)+'</textarea></div>'
      +'<div class="flex items-center justify-between pt-1 gap-2 flex-wrap"><span class="text-[10px] text-slate-400" id="cnt-mail-hint">Send goes out from CNT. Nothing is sent until you press Send.</span>'
      +'<div class="flex gap-2"><button onclick="cntCopyEmail()" class="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-1"><span class="material-icons-outlined" style="font-size:13px;">content_copy</span>Copy</button>'
      +'<button onclick="cntOpenMailApp(\''+id+'\')" class="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-1"><span class="material-icons-outlined" style="font-size:13px;">open_in_new</span>Mail app</button>'
      +'<button id="cnt-mail-send" onclick="cntSendEmail(\''+id+'\')" class="text-xs font-semibold text-white bg-indigo-600 rounded-lg px-3 py-2 hover:bg-indigo-700 cursor-pointer flex items-center gap-1"><span class="material-icons-outlined" style="font-size:13px;">send</span>Send</button></div></div>'
      +'</div></div>';
    m.classList.remove('hidden');
  };
  window.cntCopyEmail = function(){
    const subj=document.getElementById('cnt-mail-subj').value, body=document.getElementById('cnt-mail-body').value;
    const txt='Subject: '+subj+'\n\n'+body;
    navigator.clipboard?.writeText(txt).then(()=>{ if(window.showToast) showToast('Email copied to clipboard','success'); }, ()=>{ if(window.showToast) showToast('Copy failed','error'); });
  };
  window.cntOpenMailApp = function(id){
    const to=document.getElementById('cnt-mail-to').value, subj=document.getElementById('cnt-mail-subj').value, body=document.getElementById('cnt-mail-body').value;
    window.location.href='mailto:'+encodeURIComponent(to)+'?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(body);
    const app=findApplicant(id); if(app) cntLogActivity(app,'email','Email drafted: '+subj);
    const m=document.getElementById('cnt-email-modal'); if(m) m.classList.add('hidden');
  };

  // Real send, via the send-email Edge Function (staff-gated server-side)
  window.cntSendEmail = async function(id){
    const to=(document.getElementById('cnt-mail-to')||{}).value||'';
    const subject=(document.getElementById('cnt-mail-subj')||{}).value||'';
    const text=(document.getElementById('cnt-mail-body')||{}).value||'';
    const hint=document.getElementById('cnt-mail-hint');
    const btn=document.getElementById('cnt-mail-send');
    if(!to.trim()){ if(window.showToast) showToast('No recipient address','error'); return; }
    if(!sb){ if(window.showToast) showToast('Backend unavailable','error'); return; }
    const app=findApplicant(id);
    if(!confirm('Send this email to '+to+'?\n\nSubject: '+subject)) return;
    if(btn){ btn.disabled=true; btn.textContent='Sending…'; }
    try{
      const { data, error } = await sb.functions.invoke('send-email',{
        body:{ to, subject, text, kind:(app?getStageName(app.stage):'general'), applicant_ref:String((app&&(app._sid||app.id))||'') }
      });
      // supabase-js surfaces non-2xx as error; dig out the server's message
      if(error){
        let msg=error.message||'Send failed';
        try{ const ctx=error.context&&await error.context.json(); if(ctx&&ctx.error) msg=ctx.error+(ctx.hint?(' — '+ctx.hint):''); }catch(_){}
        throw new Error(msg);
      }
      if(data && data.error) throw new Error(data.error);
      if(app) cntLogActivity(app,'email','Email sent to '+to+': '+subject);
      if(window.showToast) showToast('Email sent to '+to,'success');
      const m=document.getElementById('cnt-email-modal'); if(m) m.classList.add('hidden');
    }catch(e){
      console.error('send-email',e);
      if(hint){ hint.textContent=e.message; hint.className='text-[10px] text-red-600 font-semibold'; }
      if(window.showToast) showToast('Could not send: '+e.message,'error');
    }finally{
      if(btn){ btn.disabled=false; btn.innerHTML='<span class="material-icons-outlined" style="font-size:13px;">send</span>Send'; }
    }
  };

  // ── Settings → Email delivery: status + self-test ──────────────
  // Lets an admin confirm the Resend Edge Function is configured, by sending a
  // real test email to their own address. A 503 means the secrets aren't set.
  function injectEmailPanel(){
    const sv=document.getElementById('view-settings'); if(!sv) return;
    if(!['super_admin','recruitment_manager'].includes(currentRole)) return;   // admins only
    let card=document.getElementById('cnt-email-panel');
    if(!card){ card=document.createElement('div'); card.id='cnt-email-panel'; card.style.cssText='margin-bottom:18px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;'; sv.insertBefore(card, sv.firstChild); }
    card.innerHTML='<div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:3px;display:flex;align-items:center;gap:6px;"><span class="material-icons-outlined" style="font-size:17px;color:#7f1d1d;">mail</span>Email Delivery</div>'
      +'<div style="font-size:12px;color:#64748b;margin-bottom:12px;">Recruitment emails (offers, interview invites, refusals) send from CNT via Resend. Set <code>RESEND_API_KEY</code> and <code>MAIL_FROM</code> in Supabase → Edge Functions → <b>send-email</b> → Secrets to enable real delivery; until then the app falls back to opening your mail app.</div>'
      +'<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
      +'<button id="cnt-email-test-btn" onclick="cntEmailSelfTest()" style="font-size:12px;color:#fff;font-weight:600;border:none;background:#7f1d1d;padding:7px 13px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><span class="material-icons-outlined" style="font-size:15px;">send</span>Send test email to me</button>'
      +'<span id="cnt-email-test-status" style="font-size:12px;color:#64748b;"></span></div>';
  }
  window.cntEmailSelfTest=async function(){
    const to=currentUserEmail;
    const st=document.getElementById('cnt-email-test-status'), btn=document.getElementById('cnt-email-test-btn');
    if(!to){ if(st){ st.textContent='Your account has no email address.'; st.style.color='#b91c1c'; } return; }
    if(!sb){ if(st){ st.textContent='Backend unavailable.'; st.style.color='#b91c1c'; } return; }
    if(!confirm('Send a test email to '+to+'?')) return;
    if(btn){ btn.disabled=true; }
    if(st){ st.textContent='Sending…'; st.style.color='#64748b'; }
    try{
      const { data, error }=await sb.functions.invoke('send-email',{ body:{
        to, subject:'CNT ATS — email test', kind:'test',
        text:'This is a test email from the CNT Applicant Tracking System.\n\nIf you received this, real email delivery is working.\n\n— CNT Recruitment' } });
      if(error){
        let msg=error.message||'Send failed';
        try{ const ctx=error.context&&await error.context.json(); if(ctx&&ctx.error) msg=ctx.error+(ctx.hint?(' — '+ctx.hint):''); }catch(_){}
        throw new Error(msg);
      }
      if(data && data.error) throw new Error(data.error);
      if(st){ st.textContent='✓ Sent — check '+to; st.style.color='#166534'; }
      if(window.showToast) showToast('Test email sent to '+to,'success');
    }catch(e){
      if(st){ st.textContent='Not configured: '+e.message; st.style.color='#b91c1c'; }
      if(window.showToast) showToast('Email not configured yet','error');
    }finally{ if(btn){ btn.disabled=false; } }
  };

  // ══════════════════════════════════════════════════════════════
  //  ODOO-STYLE RECRUITMENT REPORTING
  //  Applicant Analysis · Source Analysis · Velocity · Team Performance
  // ══════════════════════════════════════════════════════════════
  let _reportTab='applicants';
  function _outcome(a){
    if(a.stage==='rejected') return 'refused';
    if(stageIsHired(a.stage)||a.deployed_at) return 'hired';
    return 'in_progress';
  }
  function _reportData(){ return getAllApplicants().filter(a=>a.stage!=='pool'); }
  function _daysInStage(a){
    let last = a.appliedDate ? new Date(a.appliedDate+'T00:00').getTime() : null;
    if(Array.isArray(a.activity)){ const st=a.activity.find(x=>x.type==='stage'); if(st){ const t=new Date(st.ts).getTime(); if(!isNaN(t)) last=t; } }
    if(!last||isNaN(last)) return null;
    return Math.max(0,(Date.now()-last)/86400000);
  }
  function _bar(pct,color){ return '<div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div class="h-full rounded-full" style="width:'+Math.max(0,Math.min(100,pct))+'%;background:'+color+';"></div></div>'; }
  function _pill(n,color,bg){ return '<span style="display:inline-block;min-width:26px;text-align:center;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;color:'+color+';background:'+bg+';">'+n+'</span>'; }
  const _OUT_COLORS={ in_progress:['#1d4ed8','#dbeafe'], hired:['#166534','#dcfce7'], refused:['#b91c1c','#fee2e2'] };

  window.cntReportTab=function(t){ _reportTab=t; renderOdooReports(); };

  // Applicant form's Recruiter dropdown. Uses the shared filler so all three
  // forms offer the same people: every staff account except super_admin and
  // pending. It no longer prepends the signed-in user — a working recruiter is
  // already in that list, and the only account this used to add was an admin's.
  window.populateRecruiterSelect=function(selected){
    cntFillRecruiterSelect('app-recruiter', selected||'');
  };
  // Fill any recruiter picker from the assignable staff list.
  window.cntFillRecruiterSelect=function(id,keep){
    const sel=document.getElementById(id); if(!sel) return;
    const names=[]; (window.cntRecruiters||[]).forEach(u=>{ const n=u.full_name||u.email; if(n && names.indexOf(n)<0) names.push(n); });
    const cur=keep!==undefined ? keep : sel.value;
    // Someone who has since left (or been promoted to admin) is no longer in
    // the list; keep the name so reopening the record doesn't unassign them.
    let html='<option value="">Unassigned</option>'+names.map(n=>'<option value="'+_e(n)+'">'+_e(n)+'</option>').join('');
    if(cur && names.indexOf(cur)<0) html+='<option value="'+_e(cur)+'">'+_e(cur)+' (no longer listed)</option>';
    sel.innerHTML=html;
    sel.value=cur||'';
  };
  window.cntFillJobRecruiters=function(keep){ cntFillRecruiterSelect('job-recruiter',keep); };

  // ── Offer box: proposed salary + validity date (Odoo Generate Offer) ──
  function _defaultValidity(app){
    if(app.offer_validity) return app.offer_validity;
    const d=new Date(); d.setDate(d.getDate()+30); return d.toISOString().slice(0,10);
  }
  window.cntRenderOfferBox=function(app){
    if(!app) return;
    const pos=document.getElementById('offer-position-display'); if(pos) pos.textContent=app.role||'—';
    const sal=document.getElementById('offer-salary-display'); if(sal) sal.textContent=app.proposed_salary||app.salary||'To be confirmed';
    const val=_defaultValidity(app);
    const vd=document.getElementById('offer-validity-display'); if(vd){ try{ vd.textContent=new Date(val+'T00:00').toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}); }catch(e){ vd.textContent=val; } }
    const pin=document.getElementById('offer-proposed-input'); if(pin) pin.value=app.proposed_salary||'';
    const vin=document.getElementById('offer-validity-input'); if(vin) vin.value=val;
  };
  window.cntSaveOffer=function(){
    const app=findApplicant(currentViewedApplicantId); if(!app) return;
    const proposed=(document.getElementById('offer-proposed-input')||{}).value||'';
    const validity=(document.getElementById('offer-validity-input')||{}).value||'';
    app.proposed_salary=proposed; app.offer_validity=validity;
    updateApplicant(app.id,{proposed_salary:proposed,offer_validity:validity});
    _persistApp(app,{proposed_salary:proposed||null,offer_validity:validity||null});
    logAudit('offer','applicant',app._sid||app.id, app.name+' — '+proposed+(validity?' (valid to '+validity+')':''));
    cntLogActivity(app,'email','Offer set: '+(proposed||'—')+(validity?', valid until '+validity:''));
    cntRenderOfferBox(app);
    if(window.showToast) showToast('Offer details saved','success');
    // Email the candidate their offer (dedicated offer format; deduped so an
    // unchanged offer never re-sends). Only fires once a salary is proposed.
    if(typeof _maybeOfferEmail==='function') _maybeOfferEmail(app);
  };

  // Persist interview scheduling fields to Supabase
  // Persist an interview. If the interview_link column isn't in the DB yet, the
  // whole update would fail — so on that specific error, retry without the link
  // so date/time/type/round still save. The link persists once the column exists.
  window.cntPersistInterview=function(app,patch){
    if(!(sb && app && app._web && app._sid)) return;
    sb.from('applications').update(patch).eq('id',app._sid).then(({error})=>{
      if(error && /interview_link/i.test(error.message||'')){
        const p=Object.assign({},patch); delete p.interview_link;
        sb.from('applications').update(p).eq('id',app._sid).then(({error})=>{ if(error) console.error('persist interview',error); });
      } else if(error) console.error('persist interview',error);
    });
    // NOTE: confirming a slot no longer auto-emails the applicant. The recruiter
    // sends the interview details deliberately via the "Send interview details"
    // button (cntSendInterviewEmail), so nothing goes out before they're ready.
  };

  // Explicit, recruiter-triggered send of the interview details email.
  window.cntSendInterviewEmail=function(){
    const app=(typeof findApplicant==='function')?findApplicant(currentViewedApplicantId):null;
    if(!app){ if(window.showToast) showToast('Open an applicant first.','info'); return; }
    if(!(app.interviewDate && app.interviewTime)){ if(window.showToast) showToast('Set the interview date and time, then Confirm slot first.','info'); return; }
    if(!app.email){ if(window.showToast) showToast('This applicant has no email on file.','info'); return; }
    if(typeof _maybeInterviewEmail==='function') _maybeInterviewEmail(app, { interview_date:app.interviewDate, interview_time:app.interviewTime });
  };

  // Publish / unpublish a job to the website (status open<->closed)
  window.cntTogglePublish=function(accId,sid,role,location){
    const arr=jobDatabase[accId]||[];
    const job=arr.find(j=>(sid&&String(j._sid)===String(sid))||(j.role===role&&j.location===location));
    if(!job) return;
    job.status=(job.status==='closed')?'open':'closed';
    if(sb && job._sid){ sb.from('jobs').update({ status:job.status }).eq('id',job._sid).then(({error})=>{ if(error){ console.error('publish',error); if(window.showToast) showToast('Publish sync failed','error'); } }); }
    logAudit(job.status==='closed'?'job_unpublish':'job_publish','job',job._sid||accId,(job.role||'')+' · '+(job.account||accId));
    if(window.showToast) showToast(job.status==='closed'?'Unpublished from website':'Published to website careers page','success');
    if(typeof renderJobPositions==='function') renderJobPositions();
  };

  function injectOdooReports(){
    const rv=document.getElementById('view-reports'); if(!rv || document.getElementById('cnt-odoo-reports')) return;
    const node=document.createElement('div'); node.id='cnt-odoo-reports'; node.className='space-y-4';
    if(rv.children.length>1) rv.insertBefore(node, rv.children[1]); else rv.appendChild(node);
    // hide the legacy placeholder KPI cards / breakdown blocks (keep the header row)
    Array.from(rv.children).forEach((c,i)=>{ if(c!==node && i>0) c.style.display='none'; });
  }

  function renderOdooReports(){
    const node=document.getElementById('cnt-odoo-reports'); if(!node) return;
    const data=_reportData();
    const total=data.length;
    const hired=data.filter(a=>_outcome(a)==='hired').length;
    const refused=data.filter(a=>_outcome(a)==='refused').length;
    const inprog=total-hired-refused;
    const hireRate=(hired+refused)?Math.round(hired/(hired+refused)*100):0;
    const kpi=(label,val,sub,color)=>'<div class="bg-white border border-slate-200 rounded-xl p-4"><div class="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1">'+label+'</div><div class="text-2xl font-extrabold" style="color:'+color+'">'+val+'</div><div class="text-[10px] text-slate-400 mt-0.5">'+sub+'</div></div>';
    const tabs=[['applicants','Applicant Analysis','how_to_reg'],['sources','Source Analysis','share'],['velocity','Velocity','speed'],['team','Team Performance','groups'],['clients','Client Decisions','verified_user']];
    const tabBtn=(k,lbl,ic)=>'<button onclick="cntReportTab(\''+k+'\')" class="px-3 py-2 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition '+(_reportTab===k?'bg-red-800 text-white shadow-sm':'text-slate-500 hover:bg-slate-100')+'"><span class="material-icons-outlined" style="font-size:14px;">'+ic+'</span>'+lbl+'</button>';
    let body='';
    if(_reportTab==='applicants') body=_reportApplicants(data);
    else if(_reportTab==='sources') body=_reportSources(data);
    else if(_reportTab==='velocity') body=_reportVelocity(data);
    else if(_reportTab==='team') body=_reportTeam(data);
    else if(_reportTab==='clients') body=_reportClients(data);
    node.innerHTML=
      '<div class="grid grid-cols-2 md:grid-cols-5 gap-3">'
        +kpi('Total applicants',total,'excl. talent pool','#0f172a')
        +kpi('In progress',inprog,'active pipeline','#1d4ed8')
        +kpi('Hired',hired,'offer / onboarding','#166534')
        +kpi('Refused',refused,'not moving forward','#b91c1c')
        +kpi('Hire rate',hireRate+'%','of decided','#7f1d1d')
      +'</div>'
      +'<div class="bg-white border border-slate-200 rounded-2xl overflow-hidden">'
        +'<div class="flex items-center gap-1 px-4 pt-3 pb-2 border-b border-slate-100 flex-wrap">'+tabs.map(t=>tabBtn(t[0],t[1],t[2])).join('')+'</div>'
        +'<div class="p-5">'+body+'</div>'
      +'</div>';
  }

  function _reportTable(head, rows){
    const th='text-left padding font-bold';
    return '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;min-width:520px;">'
      +'<thead><tr>'+head.map((h,i)=>'<th style="text-align:'+(i===0?'left':'center')+';padding:8px 10px;font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:#94a3b8;font-weight:700;border-bottom:1px solid #e2e8f0;">'+h+'</th>').join('')+'</tr></thead>'
      +'<tbody>'+rows+'</tbody></table></div>';
  }

  // ── Applicant Analysis: position × outcome ──
  function _reportApplicants(data){
    const byRole={};
    data.forEach(a=>{ const r=a.role||'—'; (byRole[r]=byRole[r]||{t:0,ip:0,h:0,rf:0}); byRole[r].t++; const o=_outcome(a); byRole[r][o==='in_progress'?'ip':o==='hired'?'h':'rf']++; });
    const rows=Object.entries(byRole).sort((x,y)=>y[1].t-x[1].t).map(([role,c])=>{
      const rate=(c.h+c.rf)?Math.round(c.h/(c.h+c.rf)*100):0;
      return '<tr style="border-bottom:1px solid #f1f5f9;">'
        +'<td style="padding:9px 10px;font-size:12.5px;font-weight:600;color:#0f172a;">'+_e(role)+'</td>'
        +'<td style="text-align:center;padding:9px 10px;font-weight:700;font-size:12.5px;color:#0f172a;">'+c.t+'</td>'
        +'<td style="text-align:center;padding:9px 10px;">'+_pill(c.ip,_OUT_COLORS.in_progress[0],_OUT_COLORS.in_progress[1])+'</td>'
        +'<td style="text-align:center;padding:9px 10px;">'+_pill(c.h,_OUT_COLORS.hired[0],_OUT_COLORS.hired[1])+'</td>'
        +'<td style="text-align:center;padding:9px 10px;">'+_pill(c.rf,_OUT_COLORS.refused[0],_OUT_COLORS.refused[1])+'</td>'
        +'<td style="text-align:center;padding:9px 10px;font-size:12px;font-weight:700;color:#7f1d1d;">'+rate+'%</td></tr>';
    }).join('')||'<tr><td colspan="6" style="padding:24px;text-align:center;color:#94a3b8;font-size:12px;">No applicants yet.</td></tr>';
    // trend by applied month
    const byMonth={};
    data.forEach(a=>{ const m=(a.appliedDate||'').slice(0,7)||'—'; (byMonth[m]=byMonth[m]||{ip:0,h:0,rf:0}); const o=_outcome(a); byMonth[m][o==='in_progress'?'ip':o==='hired'?'h':'rf']++; });
    const months=Object.keys(byMonth).filter(m=>m!=='—').sort().slice(-6);
    const maxM=Math.max(1,...months.map(m=>byMonth[m].ip+byMonth[m].h+byMonth[m].rf));
    const trend=months.length?('<div class="mt-6"><h4 class="text-xs font-bold text-slate-700 mb-3">Applicants over time</h4><div class="flex items-end gap-3" style="height:130px;">'
      +months.map(m=>{ const d=byMonth[m]; const tot=d.ip+d.h+d.rf; const h=Math.round(tot/maxM*110);
        return '<div class="flex-1 flex flex-col items-center justify-end gap-1"><div class="w-full flex flex-col-reverse rounded-t overflow-hidden" style="height:'+h+'px;min-height:2px;">'
          +'<div style="background:'+_OUT_COLORS.in_progress[0]+';height:'+(tot?d.ip/tot*100:0)+'%;"></div>'
          +'<div style="background:'+_OUT_COLORS.hired[0]+';height:'+(tot?d.h/tot*100:0)+'%;"></div>'
          +'<div style="background:'+_OUT_COLORS.refused[0]+';height:'+(tot?d.rf/tot*100:0)+'%;"></div></div>'
          +'<span class="text-[9px] text-slate-400">'+m.slice(5)+'/'+m.slice(2,4)+'</span></div>'; }).join('')
      +'</div><div class="flex gap-4 mt-3 text-[10px] text-slate-500"><span class="flex items-center gap-1"><span style="width:9px;height:9px;border-radius:2px;background:'+_OUT_COLORS.in_progress[0]+';display:inline-block;"></span>In progress</span><span class="flex items-center gap-1"><span style="width:9px;height:9px;border-radius:2px;background:'+_OUT_COLORS.hired[0]+';display:inline-block;"></span>Hired</span><span class="flex items-center gap-1"><span style="width:9px;height:9px;border-radius:2px;background:'+_OUT_COLORS.refused[0]+';display:inline-block;"></span>Refused</span></div></div>'):'';
    return '<p class="text-[11px] text-slate-400 mb-3">Applicants by position, broken down by outcome. Hire rate = hired ÷ (hired + refused).</p>'
      +_reportTable(['Position','Applicants','In progress','Hired','Refused','Hire rate'],rows)+trend;
  }

  // ── Client Decisions: endorsement outcomes per client account ──
  function _reportClients(data){
    const by={};
    data.forEach(a=>{
      const c=a.account||'—'; if(c==='—') return;
      const b=(by[c]=by[c]||{end:0,app:0,rej:0,ddays:0,dn:0});
      const cs=a.client_status;
      if(cs==='endorsed') b.end++;
      else if(cs==='approved') b.app++;
      else if(cs==='rejected') b.rej++;
      if((cs==='approved'||cs==='rejected') && a.endorsed_at && a.decided_at){
        const d=(new Date(a.decided_at)-new Date(a.endorsed_at))/86400000; if(d>=0){ b.ddays+=d; b.dn++; }
      }
    });
    const entries=Object.entries(by).sort((x,y)=>(y[1].app+y[1].rej+y[1].end)-(x[1].app+x[1].rej+x[1].end));
    let totEnd=0,totApp=0,totRej=0;
    const rows=entries.map(([c,b])=>{
      totEnd+=b.end; totApp+=b.app; totRej+=b.rej;
      const decided=b.app+b.rej, rate=decided?Math.round(b.app/decided*100):0;
      const avgd=b.dn?Math.round(b.ddays/b.dn):null;
      const acc=ACCOUNTS.find(x=>x.id===c);
      return '<tr style="border-bottom:1px solid #f1f5f9;">'
        +'<td style="padding:9px 10px;font-size:12.5px;font-weight:600;color:#0f172a;"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:7px;background:'+((acc&&acc.color)||'#64748b')+';"></span>'+_e(c)+'</td>'
        +'<td style="text-align:center;padding:9px 10px;">'+_pill(b.end,'#b45309','#fef3c7')+'</td>'
        +'<td style="text-align:center;padding:9px 10px;">'+_pill(b.app,'#166534','#dcfce7')+'</td>'
        +'<td style="text-align:center;padding:9px 10px;">'+_pill(b.rej,'#b91c1c','#fee2e2')+'</td>'
        +'<td style="text-align:center;padding:9px 10px;font-size:12px;font-weight:700;color:'+(decided?(rate>=50?'#166534':'#b91c1c'):'#94a3b8')+';">'+(decided?rate+'%':'—')+'</td>'
        +'<td style="text-align:center;padding:9px 10px;font-size:12px;color:#64748b;">'+(avgd!==null?avgd+'d':'—')+'</td></tr>';
    }).join('')||'<tr><td colspan="6" style="padding:24px;text-align:center;color:#94a3b8;font-size:12px;">No candidates endorsed to clients yet.</td></tr>';
    const decidedAll=totApp+totRej, overall=decidedAll?Math.round(totApp/decidedAll*100):0;
    const summary='<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">'
      +'<div class="bg-amber-50 border border-amber-100 rounded-xl p-3"><div class="text-2xl font-extrabold text-amber-700">'+totEnd+'</div><div class="text-[10px] text-slate-500 mt-0.5 font-semibold uppercase tracking-wide">Awaiting client</div></div>'
      +'<div class="bg-emerald-50 border border-emerald-100 rounded-xl p-3"><div class="text-2xl font-extrabold text-emerald-700">'+totApp+'</div><div class="text-[10px] text-slate-500 mt-0.5 font-semibold uppercase tracking-wide">Approved</div></div>'
      +'<div class="bg-red-50 border border-red-100 rounded-xl p-3"><div class="text-2xl font-extrabold text-red-700">'+totRej+'</div><div class="text-[10px] text-slate-500 mt-0.5 font-semibold uppercase tracking-wide">Declined</div></div>'
      +'<div class="bg-slate-50 border border-slate-200 rounded-xl p-3"><div class="text-2xl font-extrabold" style="color:#7f1d1d">'+(decidedAll?overall+'%':'—')+'</div><div class="text-[10px] text-slate-500 mt-0.5 font-semibold uppercase tracking-wide">Overall approval</div></div>'
      +'</div>';
    return '<p class="text-[11px] text-slate-400 mb-3">How each client acts on the candidates you endorse. Approval rate = approved ÷ (approved + declined). Avg decision = endorsed → client decided.</p>'
      +summary+_reportTable(['Client account','Awaiting','Approved','Declined','Approval rate','Avg decision'],rows);
  }

  // ── Source Analysis: source × outcome, with medium drill ──
  function _reportSources(data){
    const bySrc={};
    data.forEach(a=>{ const s=a.source||'Unknown'; (bySrc[s]=bySrc[s]||{t:0,h:0,rf:0,med:{}}); bySrc[s].t++; const o=_outcome(a); if(o==='hired')bySrc[s].h++; else if(o==='refused')bySrc[s].rf++; const md=a.medium||'Direct'; bySrc[s].med[md]=(bySrc[s].med[md]||0)+1; });
    const max=Math.max(1,...Object.values(bySrc).map(v=>v.t));
    const rows=Object.entries(bySrc).sort((x,y)=>y[1].t-x[1].t).map(([src,c])=>{
      const mediums=Object.entries(c.med).sort((a,b)=>b[1]-a[1]).map(([m,n])=>'<span class="text-[10px] text-slate-400 mr-2">'+_e(m)+' ('+n+')</span>').join('');
      return '<tr style="border-bottom:1px solid #f1f5f9;">'
        +'<td style="padding:9px 10px;"><div class="font-semibold text-slate-800 text-[12.5px]">'+_e(src)+'</div><div class="mt-0.5">'+mediums+'</div></td>'
        +'<td style="padding:9px 10px;width:38%;"><div class="flex items-center gap-2">'+_bar(c.t/max*100,'#7f1d1d')+'<span class="text-[11px] font-bold text-slate-700 w-6">'+c.t+'</span></div></td>'
        +'<td style="text-align:center;padding:9px 10px;">'+_pill(c.h,_OUT_COLORS.hired[0],_OUT_COLORS.hired[1])+'</td>'
        +'<td style="text-align:center;padding:9px 10px;">'+_pill(c.rf,_OUT_COLORS.refused[0],_OUT_COLORS.refused[1])+'</td></tr>';
    }).join('')||'<tr><td colspan="4" style="padding:24px;text-align:center;color:#94a3b8;font-size:12px;">No source data yet.</td></tr>';
    return '<p class="text-[11px] text-slate-400 mb-3">Which channels bring in the most applicants and hires. Mediums are listed under each source.</p>'
      +_reportTable(['Source / medium','Applicants','Hired','Refused'],rows);
  }

  // ── Velocity: average days in current stage, per stage ──
  function _reportVelocity(data){
    const perStage={};
    PIPELINE_STAGES.forEach(s=>perStage[s.key]={sum:0,n:0});
    data.forEach(a=>{ if(perStage[a.stage]){ const d=_daysInStage(a); if(d!=null){ perStage[a.stage].sum+=d; perStage[a.stage].n++; } } });
    const avgs=PIPELINE_STAGES.map(s=>({s,avg:perStage[s.key].n?perStage[s.key].sum/perStage[s.key].n:0,n:perStage[s.key].n}));
    const max=Math.max(1,...avgs.map(x=>x.avg));
    const rows=avgs.map(x=>'<div class="flex items-center gap-3 mb-3"><div class="text-[11px] font-bold text-slate-600 w-28 shrink-0">'+x.s.short+'</div>'
      +'<div class="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden"><div class="h-full rounded-lg flex items-center justify-end pr-2" style="width:'+(x.n?Math.max(x.avg/max*100,6):0)+'%;background:'+x.s.color+';">'+(x.n?'<span class="text-white text-[10px] font-bold">'+x.avg.toFixed(1)+'d</span>':'')+'</div></div>'
      +'<div class="text-[10px] text-slate-400 w-16 text-right shrink-0">'+x.n+' appl.</div></div>').join('');
    const overall=(()=>{ let s=0,n=0; data.forEach(a=>{const d=_daysInStage(a); if(d!=null){s+=d;n++;}}); return n?(s/n).toFixed(1):'0'; })();
    return '<p class="text-[11px] text-slate-400 mb-4">Average days applicants have spent in their current stage — longer bars flag bottlenecks. Overall avg age in stage: <span class="font-bold text-slate-600">'+overall+' days</span>.</p>'+(rows||'<p class="text-center text-slate-400 text-xs py-6">No data.</p>');
  }

  // ── Team Performance: recruiter × outcome ──
  function _reportTeam(data){
    const byRec={};
    data.forEach(a=>{ const r=a.recruiter||'Unassigned'; (byRec[r]=byRec[r]||{t:0,ip:0,h:0,rf:0}); byRec[r].t++; const o=_outcome(a); byRec[r][o==='in_progress'?'ip':o==='hired'?'h':'rf']++; });
    const rows=Object.entries(byRec).sort((x,y)=>y[1].t-x[1].t).map(([rec,c])=>{
      const rate=(c.h+c.rf)?Math.round(c.h/(c.h+c.rf)*100):0;
      const init=(rec==='Unassigned'?'—':rec.split(/\s+/).map(w=>w[0]||'').join('').slice(0,2).toUpperCase());
      return '<tr style="border-bottom:1px solid #f1f5f9;">'
        +'<td style="padding:9px 10px;"><div class="flex items-center gap-2"><span style="width:26px;height:26px;border-radius:50%;background:#7f1d1d;color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;">'+_e(init)+'</span><span class="font-semibold text-slate-800 text-[12.5px]">'+_e(rec)+'</span></div></td>'
        +'<td style="text-align:center;padding:9px 10px;font-weight:700;font-size:12.5px;">'+c.t+'</td>'
        +'<td style="text-align:center;padding:9px 10px;">'+_pill(c.ip,_OUT_COLORS.in_progress[0],_OUT_COLORS.in_progress[1])+'</td>'
        +'<td style="text-align:center;padding:9px 10px;">'+_pill(c.h,_OUT_COLORS.hired[0],_OUT_COLORS.hired[1])+'</td>'
        +'<td style="text-align:center;padding:9px 10px;">'+_pill(c.rf,_OUT_COLORS.refused[0],_OUT_COLORS.refused[1])+'</td>'
        +'<td style="text-align:center;padding:9px 10px;font-size:12px;font-weight:700;color:#7f1d1d;">'+rate+'%</td></tr>';
    }).join('')||'<tr><td colspan="6" style="padding:24px;text-align:center;color:#94a3b8;font-size:12px;">No recruiter data yet.</td></tr>';
    return '<p class="text-[11px] text-slate-400 mb-3">Applicants managed per recruiter (from the Recruiter field on each applicant), by outcome.</p>'
      +_reportTable(['Recruiter','Applicants','In progress','Hired','Refused','Hire rate'],rows);
  }

  // Wrap the app's renderReports so the Odoo reports refresh with the view
  if (typeof renderReports === 'function'){
    const _origRR = renderReports;
    renderReports = function(){ _origRR(); try{ injectOdooReports(); renderOdooReports(); }catch(e){ console.warn('odoo reports',e); } };
  }

  // ══════════════════════════════════════════════════════════════
  //  SETTINGS — master data (clients · positions · locations)
  //  Super-admin manages these; they feed every dropdown/facet.
  // ══════════════════════════════════════════════════════════════
  const TAX_KINDS=['client','position','location','refuse_reason'];
  const TAX_COLORS=['#1d4ed8','#0f766e','#7c3aed','#b91c1c','#0369a1','#d97706','#be185d','#4338ca','#047857','#9d174d'];
  const ACCOUNT_META={}; ACCOUNTS.forEach(a=>{ ACCOUNT_META[a.id]={sub:a.sub,color:a.color,region:a.region}; });
  const TAX_FALLBACK={
    client:   ACCOUNTS.map(a=>a.id),
    position: ['Sales Promoter','Merchandiser','Area Supervisor','Brand Ambassador','Trade Marketing Specialist','Field Sales Representative','Product Demonstrator','Store Supervisor','In-Store Activator','Content Marketer','Logistics Coordinator'],
    location: ['Manila','Tarlac','Bulacan','Pampanga','Cavite','Pangasinan','Batangas']
  };
  window.cntTax={client:[],position:[],location:[],refuse_reason:[]};

  function _taxNames(kind){
    const t=(window.cntTax[kind]||[]).map(x=>x.name);
    return t.length ? [...new Set(t)].sort() : (TAX_FALLBACK[kind]||[]).slice();
  }
  function _taxInUse(kind,name){
    let n=0;
    Object.keys(jobDatabase||{}).forEach(k=>(jobDatabase[k]||[]).forEach(j=>{
      if(kind==='client'   && (j.account===name||k===name)) n++;
      if(kind==='position' && j.role===name) n++;
      if(kind==='location' && j.location===name) n++;
    }));
    return n;
  }

  function _applyTaxonomy(rows){
    if(!rows) return false;
    const t={client:[],position:[],location:[],refuse_reason:[]};
    rows.forEach(r=>{ if(t[r.kind]) t[r.kind].push({id:r.id,name:r.name,color:r.color}); });
    window.cntTax=t;
    if(t.client.length){   // taxonomy is the source of truth for client accounts
      const rebuilt=t.client.map((c,i)=>{
        const m=ACCOUNT_META[c.name]||{};
        return { id:c.name, label:c.name, sub:m.sub||'Client account', color:c.color||m.color||TAX_COLORS[i%TAX_COLORS.length], region:m.region||'' };
      });
      ACCOUNTS.length=0; rebuilt.forEach(x=>ACCOUNTS.push(x));
    }
    repopulateTaxonomyUI();
    return true;
  }
  async function loadTaxonomy(){
    _applyTaxonomy(cacheGet('taxonomy'));             // instant from cache
    if(!sb) return;
    const { data, error } = await sb.from('taxonomy').select('*').order('name');
    if(error){ console.warn('taxonomy load',error); return; }
    cacheSet('taxonomy',data||[]);
    _applyTaxonomy(data||[]);                         // then the live copy
  }

  function _fillSelect(id,values,allLabel){
    const sel=document.getElementById(id); if(!sel) return;
    const cur=sel.value;
    sel.innerHTML='<option value="all">'+allLabel+'</option>'+values.map(v=>'<option value="'+_escN(v)+'">'+_escN(v)+'</option>').join('');
    if([...sel.options].some(o=>o.value===cur)) sel.value=cur; else sel.value='all';
  }
  function _fillPlain(id,values){
    const sel=document.getElementById(id); if(!sel) return;
    const cur=sel.value;
    sel.innerHTML=values.map(v=>'<option value="'+_escN(v)+'">'+_escN(v)+'</option>').join('');
    if([...sel.options].some(o=>o.value===cur)) sel.value=cur;
  }
  function _fillList(id,values){
    const dl=document.getElementById(id); if(!dl) return;
    dl.innerHTML=values.map(v=>'<option>'+_escN(v)+'</option>').join('');
  }
  // Fill a required picker on the Job form. `keep` is the value already saved
  // on the job being edited: a select silently drops any value it has no
  // option for, so a job whose client was later renamed or removed in Settings
  // would blank that field the moment someone opened it. Keep it as an option,
  // flagged, rather than losing the record's own data.
  function _fillPicker(id,values,placeholder,keep){
    const sel=document.getElementById(id); if(!sel) return;
    const cur=keep!==undefined ? keep : sel.value;
    let html='<option value="">'+_escN(placeholder)+'</option>'
      +values.map(v=>'<option value="'+_escN(v)+'">'+_escN(v)+'</option>').join('');
    if(cur && !values.some(v=>v===cur)) html+='<option value="'+_escN(cur)+'">'+_escN(cur)+' (not in Settings)</option>';
    sel.innerHTML=html;
    sel.value=cur||'';
  }
  function repopulateTaxonomyUI(){
    const clients=_taxNames('client'), positions=_taxNames('position'), locations=_taxNames('location');
    _fillSelect('filter-location',locations,'All Locations');
    _fillSelect('filter-role',positions,'All Positions');
    _fillPicker('app-account',clients,'Select a client…');
    _fillPicker('app-location',locations,'Select a location…');
    _fillPicker('app-role',positions,'Select a position…');
    _fillPicker('job-account',clients,'Select a client…');
    _fillPicker('job-role',positions,'Select a position…');
    _fillPicker('job-location',locations,'Select a location…');
    if(typeof cntFillJobRecruiters==='function') cntFillJobRecruiters();
    _fillPicker('req-account',clients,'Select a client…');
    _fillPicker('req-role',positions,'Select a position…');
    _fillPicker('req-location',locations,'Select a location…');
    if(window.cntFillRecruiterSelect) cntFillRecruiterSelect('req-recruiter');
    if(typeof buildClientDropdown==='function') buildClientDropdown();
  }
  // openCreateJobModal / openEditModal live outside this IIFE and need to
  // rebuild the pickers, so hand them explicit handles.
  window.cntRepopulateTaxonomyUI=repopulateTaxonomyUI;
  window.cntFillApplicantPickers=function(app){
    _fillPicker('app-account',_taxNames('client'),'Select a client…',(app&&app.account)||'');
    _fillPicker('app-location',_taxNames('location'),'Select a location…',(app&&app.location)||'');
    _fillPicker('app-role',_taxNames('position'),'Select a position…',(app&&app.role)||'');
  };

  function renderSettings(){
    TAX_KINDS.forEach(kind=>{
      const el=document.getElementById('set-list-'+kind); if(!el) return;
      const items=_taxNames(kind);
      const cnt=document.getElementById('set-count-'+kind); if(cnt) cnt.textContent=items.length;
      el.innerHTML=items.length?items.map(name=>{
        const used=_taxInUse(kind,name);
        return '<div class="cnt-set-row" style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 8px;border-radius:8px;">'
          +'<span style="font-size:12.5px;color:#334155;font-weight:500;min-width:0;">'+_escN(name)
          +(used?' <span style="font-size:9px;color:#94a3b8;font-weight:600;">· '+used+' job'+(used>1?'s':'')+'</span>':'')+'</span>'
          +'<button onclick="cntTaxRemove(\''+kind+'\',\''+String(name).replace(/'/g,"\\'")+'\')" title="Remove" style="color:#cbd5e1;cursor:pointer;line-height:0;flex:none;"><span class="material-icons-outlined" style="font-size:15px;">delete</span></button>'
          +'</div>';
      }).join(''):'<p style="font-size:11.5px;color:#94a3b8;padding:14px;text-align:center;">Nothing yet — add one above.</p>';
    });
  }
  window.cntTaxAdd=async function(kind){
    const input=document.getElementById('set-new-'+kind); if(!input) return;
    const name=(input.value||'').trim();
    if(!name){ if(window.showToast) showToast('Enter a name first','info'); return; }
    if(_taxNames(kind).some(v=>v.toLowerCase()===name.toLowerCase())){ if(window.showToast) showToast('“'+name+'” already exists','info'); return; }
    if(!sb){ if(window.showToast) showToast('Backend unavailable','error'); return; }
    const color = kind==='client' ? TAX_COLORS[_taxNames('client').length%TAX_COLORS.length] : null;
    const { error } = await sb.from('taxonomy').insert({ kind, name, color });
    if(error){ console.error('tax add',error); if(window.showToast) showToast('Add failed: '+error.message,'error'); return; }
    logAudit('settings_add',kind,name,name);
    input.value='';
    await loadTaxonomy(); renderSettings(); renderAll();
    if(window.showToast) showToast('“'+name+'” added','success');
  };
  window.cntTaxRemove=async function(kind,name){
    const used=_taxInUse(kind,name);
    const msg = used
      ? '“'+name+'” is used by '+used+' job position'+(used>1?'s':'')+'. Remove it from the list anyway? Existing records keep their value.'
      : 'Remove “'+name+'” from '+kind+'s?';
    if(!confirm(msg)) return;
    if(!sb) return;
    const { error } = await sb.from('taxonomy').delete().eq('kind',kind).eq('name',name);
    if(error){ console.error('tax remove',error); if(window.showToast) showToast('Remove failed: '+error.message,'error'); return; }
    logAudit('settings_remove',kind,name,name);
    await loadTaxonomy(); renderSettings(); renderAll();
    if(window.showToast) showToast('“'+name+'” removed','info');
  };
  if (typeof renderAll === 'function'){
    const _origRA_set = renderAll;
    renderAll = function(){ _origRA_set();
      try{ renderSettings(); }catch(e){ console.warn('settings',e); }
      try{ renderStagesSettings(); }catch(e){ console.warn('stages settings',e); }
    };
  }

  // ══════════════════════════════════════════════════════════════
  //  RECRUITMENT DASHBOARD  (dev_hr_recruitment_dashboard layout)
  //  6 counters · 4 charts · dynamic filters · all-candidate list
  // ══════════════════════════════════════════════════════════════
  const _dv=id=>{ const el=document.getElementById(id); return el?el.value:'all'; };

  function _dashJobs(){
    const client=_dv('dash-f-client'), pos=_dv('dash-f-position');
    const out=[];
    Object.keys(jobDatabase||{}).forEach(k=>(jobDatabase[k]||[]).forEach(j=>{
      const acc=j.account||k;
      if(client!=='all' && acc!==client) return;
      if(pos!=='all' && j.role!==pos) return;
      out.push(Object.assign({_acc:acc},j));
    }));
    return out;
  }
  function _dashApps(){
    const client=_dv('dash-f-client'), rec=_dv('dash-f-recruiter'), pos=_dv('dash-f-position'), range=_dv('dash-f-range');
    const cutoff = (range==='all') ? null : (Date.now() - parseInt(range,10)*86400000);
    return getAllApplicants().filter(a=>{
      if(a.stage==='pool') return false;
      if(client!=='all' && a.account!==client) return false;
      if(pos!=='all' && a.role!==pos) return false;
      if(rec!=='all' && (a.recruiter||'Unassigned')!==rec) return false;
      if(cutoff){ const t=a.appliedDate?new Date(a.appliedDate+'T00:00').getTime():0; if(!t || t<cutoff) return false; }
      return true;
    });
  }
  // employment type comes from the matching job posting
  function _empType(a){
    const arr=jobDatabase[a.account]||[];
    const j=arr.find(x=>x.role===a.role && x.location===a.location) || arr.find(x=>x.role===a.role);
    return (j&&j.employment_type)||'Unspecified';
  }

  function _dashFillFilters(){
    const apps=getAllApplicants();
    const fill=(id,vals,allLabel)=>{
      const sel=document.getElementById(id); if(!sel) return;
      const cur=sel.value;
      sel.innerHTML='<option value="all">'+allLabel+'</option>'+vals.map(v=>'<option value="'+_e(v)+'">'+_e(v)+'</option>').join('');
      if([...sel.options].some(o=>o.value===cur)) sel.value=cur;
    };
    fill('dash-f-client', _taxNames('client'), 'All Clients');
    fill('dash-f-position', _taxNames('position'), 'All Positions');
    const recs=[...new Set(apps.map(a=>a.recruiter||'Unassigned'))].sort();
    fill('dash-f-recruiter', recs, 'All Recruiters');
  }

  function _kpiTile(label,val,sub,color,icon){
    return '<div class="bg-white border border-slate-200 rounded-xl p-3.5">'
      +'<div class="flex items-start justify-between gap-2">'
      +'<div style="min-width:0;"><p class="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider leading-tight">'+label+'</p>'
      +'<h3 class="text-2xl font-extrabold mt-1" style="color:'+color+'">'+val+'</h3>'
      +'<p class="text-[9.5px] text-slate-400 mt-0.5">'+sub+'</p></div>'
      +'<span class="material-icons-outlined" style="font-size:17px;color:'+color+';opacity:.35;flex:none;">'+icon+'</span>'
      +'</div></div>';
  }
  function _hbar(label,n,max,color,onclick,extra){
    const w=n>0?Math.max(Math.round(n/max*100),5):0;
    return '<div class="flex items-center gap-3 mb-2.5 '+(onclick?'cursor-pointer group':'')+'"'+(onclick?' onclick="'+onclick+'"':'')+'>'
      +'<div class="text-[10px] font-bold text-slate-500 '+(onclick?'group-hover:text-red-700':'')+' uppercase tracking-wider shrink-0 truncate" style="width:104px;" title="'+_e(label)+'">'+_e(label)+'</div>'
      +'<div class="flex-1 h-5 bg-slate-100 rounded-md overflow-hidden"><div style="width:'+w+'%;background:'+color+';height:100%;border-radius:6px;transition:width .6s ease;"></div></div>'
      +'<div class="text-[11px] font-bold text-slate-700 w-7 text-right shrink-0">'+n+'</div>'
      +(extra?'<div class="text-[10px] text-slate-400 w-9 text-right shrink-0">'+extra+'</div>':'')
      +'</div>';
  }
  function _emptyChart(msg){ return '<p class="text-[11px] text-slate-400 text-center py-8">'+msg+'</p>'; }

  window.cntDashClear=function(){
    ['dash-f-client','dash-f-recruiter','dash-f-position'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value='all'; });
    const r=document.getElementById('dash-f-range'); if(r) r.value='365';
    cntRenderDashboard();
  };

  window.cntRenderDashboard=function(){
    if(!document.getElementById('dash-kpis')) return;
    _dashFillFilters();
    const apps=_dashApps(), jobs=_dashJobs();
    const openJobs=jobs.filter(j=>j.status!=='closed');
    const vacancy=openJobs.reduce((s,j)=>s+(j.needed||1),0);
    const total=apps.length;
    const hired=apps.filter(a=>_outcome(a)==='hired').length;
    const refused=apps.filter(a=>_outcome(a)==='refused').length;
    const review=total-hired-refused;
    const conv=total?Math.round(hired/total*100):0;

    // ── Today's focus: the recruiter's action queue ──
    (function(){
      const host=document.getElementById('dash-myday'); if(!host) return;
      const today=(typeof _localDateStr==='function')?_localDateStr(new Date()):new Date().toISOString().slice(0,10);
      const age=a=>{ const d=a.appliedDate||a.applied_date; const t=d?new Date(d).getTime():NaN; return isNaN(t)?0:Math.floor((Date.now()-t)/86400000); };
      const isOpen=a=>{ const o=_outcome(a); return o!=='hired'&&o!=='refused'; };
      const news = apps.filter(a=>a.stage==='new');
      const ivToday = apps.filter(a=>a.interviewDate===today && isOpen(a));
      const stale = apps.filter(a=>isOpen(a) && age(a)>=7 && ['new','interview','phone','qualified','scheduled','exam'].indexOf(a.stage)>=0).sort((x,y)=>age(y)-age(x));
      const nm=a=>(typeof _niceName==='function')?_niceName(a.name):(a.name||'');
      const card=(icon,color,label,list,fmt,empty)=>{
        const rows=list.slice(0,4).map(a=>'<button onclick="triggerResumeModal(\''+a.id+'\')" class="w-full text-left flex items-center justify-between gap-2 px-2 py-1 rounded-lg hover:bg-slate-50 cursor-pointer"><span class="text-xs font-semibold text-slate-700 truncate">'+_e(nm(a))+'</span><span class="text-[10px] text-slate-400 shrink-0">'+fmt(a)+'</span></button>').join('');
        const more=list.length>4?'<div class="text-[10px] text-slate-400 px-2 pt-1">+'+(list.length-4)+' more</div>':'';
        return '<div class="bg-white border border-slate-200 rounded-2xl p-4">'
          +'<div class="flex items-center gap-2 mb-2"><span class="material-icons-outlined" style="font-size:18px;color:'+color+'">'+icon+'</span>'
          +'<span class="text-2xl font-extrabold text-slate-900">'+list.length+'</span>'
          +'<span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-auto text-right leading-tight">'+label+'</span></div>'
          +(list.length?rows+more:'<div class="text-[11px] text-slate-400 px-2 py-1">'+empty+'</div>')
          +'</div>';
      };
      host.innerHTML='<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">'
        +card('how_to_reg','#dc2626','New · to review',news,a=>'review','Nothing new to review.')
        +card('event','#7c3aed','Interviews today',ivToday,a=>a.interviewTime||'today','No interviews today.')
        +card('schedule','#b45309','Waiting 7+ days',stale,a=>age(a)+'d','Nothing overdue.')
        +'</div>';
    })();

    // ── 6 counters ──
    document.getElementById('dash-kpis').innerHTML=
       _kpiTile('Open Job Positions',openJobs.length,'published','#0f172a','work')
      +_kpiTile('Total Vacancy',vacancy,'headcount to fill','#b45309','group_add')
      +_kpiTile('Applications Received',total,'from candidates','#1d4ed8','description')
      +_kpiTile('Application in Review',review,'still ongoing','#7c3aed','pending_actions')
      +_kpiTile('Hired Candidates',hired,'offer / onboarding','#166534','verified')
      +_kpiTile('Conversion Ratio',conv+'%','hired ÷ applications','#7f1d1d','trending_up');

    // ── Chart 1: by job position × status (stacked) ──
    const byPos={};
    apps.forEach(a=>{ const r=a.role||'—'; (byPos[r]=byPos[r]||{t:0,h:0,rf:0,ip:0}); byPos[r].t++;
      const o=_outcome(a); byPos[r][o==='hired'?'h':o==='refused'?'rf':'ip']++; });
    const posRows=Object.entries(byPos).sort((x,y)=>y[1].t-x[1].t).slice(0,8);
    const posMax=Math.max(1,...posRows.map(r=>r[1].t));
    document.getElementById('chart-by-position').innerHTML = posRows.length?posRows.map(([role,c])=>{
      const w=Math.max(Math.round(c.t/posMax*100),5);
      const seg=(n,col)=>n?'<div style="width:'+(c.t?n/c.t*100:0)+'%;background:'+col+';height:100%;" title="'+n+'"></div>':'';
      return '<div class="flex items-center gap-3 mb-2.5">'
        +'<div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 truncate" style="width:104px;" title="'+_e(role)+'">'+_e(role)+'</div>'
        +'<div class="flex-1 h-5 bg-slate-100 rounded-md overflow-hidden"><div style="width:'+w+'%;height:100%;display:flex;border-radius:6px;overflow:hidden;">'
        +seg(c.ip,'#1d4ed8')+seg(c.h,'#16a34a')+seg(c.rf,'#dc2626')+'</div></div>'
        +'<div class="text-[11px] font-bold text-slate-700 w-7 text-right shrink-0">'+c.t+'</div></div>';
    }).join(''):_emptyChart('No applications for these filters.');

    // ── Chart 2: by client ──
    const byClient={};
    apps.forEach(a=>{ const c=a.account||'—'; byClient[c]=(byClient[c]||0)+1; });
    const clRows=Object.entries(byClient).sort((x,y)=>y[1]-x[1]);
    const clMax=Math.max(1,...clRows.map(r=>r[1]));
    document.getElementById('chart-by-client').innerHTML = clRows.length?clRows.map(([c,n])=>{
      const col=(ACCOUNTS.find(a=>a.id===c)||{}).color||'#64748b';
      return _hbar(c,n,clMax,col,null,Math.round(n/total*100)+'%');
    }).join(''):_emptyChart('No applications for these filters.');

    // ── Chart 3: state-wise (by stage) ──
    const byStage={}; PIPELINE_STAGES.forEach(s=>byStage[s.key]=0);
    apps.forEach(a=>{ if(byStage[a.stage]!==undefined) byStage[a.stage]++; });
    const stMax=Math.max(1,...Object.values(byStage));
    document.getElementById('chart-by-stage').innerHTML=PIPELINE_STAGES.map(s=>
      _hbar(s.short,byStage[s.key]||0,stMax,s.color,"cntOpenPipelineList('"+s.key+"')",total?Math.round((byStage[s.key]||0)/total*100)+'%':'0%')
    ).join('');

    // ── Chart 4: by employment (contract) type ──
    const byType={};
    apps.forEach(a=>{ const t=_empType(a); byType[t]=(byType[t]||0)+1; });
    const tyRows=Object.entries(byType).sort((x,y)=>y[1]-x[1]);
    const tyMax=Math.max(1,...tyRows.map(r=>r[1]));
    const TY_COLORS=['#4338ca','#0f766e','#b45309','#be185d','#0369a1','#64748b'];
    document.getElementById('chart-by-type').innerHTML = tyRows.length?tyRows.map(([t,n],i)=>
      _hbar(t,n,tyMax,TY_COLORS[i%TY_COLORS.length],null,Math.round(n/total*100)+'%')
    ).join(''):_emptyChart('No applications for these filters.');

    // ── All candidate list ──
    const cnt=document.getElementById('dash-cand-count'); if(cnt) cnt.textContent=apps.length;
    const tb=document.getElementById('dash-candidate-list');
    if(tb){
      const rows=apps.slice().sort((a,b)=>String(b.appliedDate||'').localeCompare(String(a.appliedDate||''))).slice(0,50);
      tb.innerHTML=rows.length?rows.map(a=>{
        const col=(ACCOUNTS.find(x=>x.id===a.account)||{}).color||'#64748b';
        return '<tr class="hover:bg-slate-50">'
          +'<td class="px-4 py-2.5 font-semibold text-slate-900 text-xs cursor-pointer hover:text-red-800" onclick="triggerResumeModal(\''+a.id+'\')">'+_e(a.name)+'</td>'
          +'<td class="px-4 py-2.5 text-xs text-slate-600">'+_e(a.role||'—')+'</td>'
          +'<td class="px-4 py-2.5"><span class="badge" style="background:'+col+'18;color:'+col+';">'+_e(a.account||'—')+'</span></td>'
          +'<td class="px-4 py-2.5 text-xs text-slate-400">'+_e(a.location||'—')+'</td>'
          +'<td class="px-4 py-2.5 text-xs text-slate-500">'+_e(a.recruiter||'—')+'</td>'
          +'<td class="px-4 py-2.5"><span class="badge border '+getStageBadge(a.stage)+'">'+_e(getStageName(a.stage))+'</span></td>'
          +'<td class="px-4 py-2.5 text-xs text-slate-400">'+_e(a.appliedDate||'—')+'</td>'
          +'<td class="px-4 py-2.5 text-right whitespace-nowrap">'
            +'<button onclick="triggerResumeModal(\''+a.id+'\')" class="text-red-700 hover:text-red-900 text-[11px] font-bold cursor-pointer mr-2">View</button>'
            +(a.resumePath?'<button onclick="cntDownloadCV(\''+a.id+'\')" class="text-slate-500 hover:text-slate-800 text-[11px] font-medium cursor-pointer">CV</button>':'<span class="text-[11px] text-slate-300">No CV</span>')
          +'</td></tr>';
      }).join(''):'<tr><td colspan="8" class="px-4 py-10 text-center text-slate-400 text-xs">No candidates match these filters.</td></tr>';
    }
  };

  // Download a candidate's CV from the private resumes bucket
  window.cntDownloadCV=async function(id){
    const app=findApplicant(id); if(!app||!app.resumePath) return;
    if(!sb){ if(window.showToast) showToast('Backend unavailable','error'); return; }
    const { data, error } = await sb.storage.from('resumes').createSignedUrl(app.resumePath, 120);
    if(error||!data){ if(window.showToast) showToast('Could not open CV: '+((error&&error.message)||''),'error'); return; }
    window.open(data.signedUrl,'_blank','noopener');
  };

  if (typeof renderAll === 'function'){
    const _origRA_dash = renderAll;
    renderAll = function(){ _origRA_dash(); try{ cntRenderDashboard(); }catch(e){ console.warn('dashboard',e); } };
  }

  // ══════════════════════════════════════════════════════════════
  //  DATA PRIVACY — RA 10173 retention purge + right to erasure
  //  Records are anonymised, never deleted: reporting history stays
  //  intact while the personal data is genuinely gone.
  // ══════════════════════════════════════════════════════════════
  function _cutoffISO(months){ const d=new Date(); d.setMonth(d.getMonth()-parseInt(months,10)); return d.toISOString().slice(0,10); }
  const _PURGE_PATCH=(id)=>({
    name:'[Redacted]', email:'redacted+'+id+'@removed.invalid', phone:null,
    cover_note:null, resume_url:null, linkedin:null, referred_by:null,
    tags:null, degree:null, purged_at:new Date().toISOString()
  });

  async function _purgeRows(rows){
    let ok=0;
    for(const r of rows){
      if(r.resume_url){ try{ await sb.storage.from('resumes').remove([r.resume_url]); }catch(e){ console.warn('cv remove',e); } }
      const { error }=await sb.from('applications').update(_PURGE_PATCH(r.id)).eq('id',r.id);
      if(error){ console.error('purge',error); } else ok++;
    }
    return ok;
  }

  window.cntPreviewPurge=async function(){
    const el=document.getElementById('retain-preview'); if(!el) return;
    if(!sb){ el.textContent='Backend unavailable.'; return; }
    const months=(document.getElementById('retain-months')||{}).value||'12';
    const { data, error }=await sb.from('applications').select('id')
      .lt('applied_date',_cutoffISO(months)).is('purged_at',null).not('stage','in','("hired","onboarding")');
    if(error){ el.className='text-[11px] mt-2.5 text-red-600'; el.textContent='Preview failed: '+error.message; return; }
    const n=(data||[]).length;
    el.className='text-[11px] mt-2.5 '+(n?'text-slate-600':'text-slate-400');
    el.textContent=n?(n+' candidate record'+(n!==1?'s':'')+' would be anonymised (hired candidates are never purged).'):'Nothing to purge — no records older than that window.';
  };

  window.cntRunPurge=async function(){
    const el=document.getElementById('retain-preview');
    if(!sb) return;
    const months=(document.getElementById('retain-months')||{}).value||'12';
    const { data, error }=await sb.from('applications').select('id,resume_url')
      .lt('applied_date',_cutoffISO(months)).is('purged_at',null).not('stage','in','("hired","onboarding")');
    if(error){ if(window.showToast) showToast('Purge failed: '+error.message,'error'); return; }
    const rows=data||[];
    if(!rows.length){ if(window.showToast) showToast('Nothing to purge','info'); return; }
    if(!confirm('Permanently anonymise '+rows.length+' candidate record'+(rows.length!==1?'s':'')+' older than '+months+' months?\n\nNames, emails, phone numbers and CVs will be removed. This cannot be undone.')) return;
    const ok=await _purgeRows(rows);
    logAudit('privacy_purge','applications',String(ok), ok+' records anonymised (>'+months+'mo)');
    if(el){ el.className='text-[11px] mt-2.5 text-emerald-700'; el.textContent=ok+' record'+(ok!==1?'s':'')+' anonymised.'; }
    if(window.showToast) showToast(ok+' record'+(ok!==1?'s':'')+' anonymised','success');
    await loadApplications(); renderAll();
  };

  window.cntEraseCandidate=async function(){
    const el=document.getElementById('erase-result');
    const input=document.getElementById('erase-email');
    const email=((input||{}).value||'').trim();
    if(!email){ if(el){ el.className='text-[11px] mt-2.5 text-slate-400'; el.textContent='Enter an email address first.'; } return; }
    if(!sb) return;
    const { data, error }=await sb.from('applications').select('id,resume_url').ilike('email',email);
    if(error){ if(el){ el.className='text-[11px] mt-2.5 text-red-600'; el.textContent='Lookup failed: '+error.message; } return; }
    const rows=data||[];
    if(!rows.length){ if(el){ el.className='text-[11px] mt-2.5 text-slate-400'; el.textContent='No applications found for that email.'; } return; }
    if(!confirm('Erase all personal data for '+email+'?\n\n'+rows.length+' application'+(rows.length!==1?'s':'')+' will be anonymised and their CV deleted. This cannot be undone.')) return;
    const ok=await _purgeRows(rows);
    logAudit('privacy_erasure','applicant',email, ok+' records anonymised on request');
    if(el){ el.className='text-[11px] mt-2.5 text-emerald-700'; el.textContent=ok+' application'+(ok!==1?'s':'')+' erased for '+email+'.'; }
    if(input) input.value='';
    if(window.showToast) showToast('Candidate data erased','success');
    await loadApplications(); renderAll();
  };

  // ── One-off: normalise Expected Skills on existing rows ─────────
  // Reuses the exact _uniformSkills the app runs on save, so backfilled rows
  // match what future edits produce. Walks every application (paginated past
  // the 1000-row default), not just the ones currently on screen. Idempotent:
  // rows already uniform are skipped, so it is safe to run more than once.
  async function _allSkillRows(){
    const rows=[]; const PAGE=1000;
    for(let from=0;;from+=PAGE){
      const { data, error }=await sb.from('applications').select('id,tags').range(from,from+PAGE-1);
      if(error) throw error;
      rows.push(...(data||[]));
      if(!data || data.length<PAGE) break;
    }
    return rows;
  }
  function _skillChanges(rows){
    const out=[];
    for(const r of rows){
      const cur=r.tags||'';
      if(!cur.trim()) continue;
      const next=_uniformSkills(cur).join(', ');
      if(next!==cur) out.push({ id:r.id, from:cur, to:next });
    }
    return out;
  }
  window.cntPreviewSkillBackfill=async function(){
    const el=document.getElementById('skill-backfill-result'); if(!el) return;
    if(!sb){ el.className='text-[11px] mt-2.5 text-slate-400'; el.textContent='Backend unavailable.'; return; }
    el.className='text-[11px] mt-2.5 text-slate-400'; el.textContent='Checking…';
    try{
      const changes=_skillChanges(await _allSkillRows());
      if(!changes.length){ el.className='text-[11px] mt-2.5 text-slate-400'; el.textContent='Everything is already uniform — nothing to change.'; return; }
      const sample=changes.slice(0,3).map(c=>'“'+c.from+'” → “'+c.to+'”').join('  ·  ');
      el.className='text-[11px] mt-2.5 text-slate-600';
      el.textContent=changes.length+' record'+(changes.length!==1?'s':'')+' would change.  e.g. '+sample;
    }catch(e){ el.className='text-[11px] mt-2.5 text-red-600'; el.textContent='Preview failed: '+(e.message||e); }
  };
  window.cntRunSkillBackfill=async function(){
    const el=document.getElementById('skill-backfill-result');
    if(!sb) return;
    let changes;
    try{ changes=_skillChanges(await _allSkillRows()); }
    catch(e){ if(window.showToast) showToast('Lookup failed: '+(e.message||e),'error'); return; }
    if(!changes.length){ if(window.showToast) showToast('Skills already uniform','info'); if(el){ el.className='text-[11px] mt-2.5 text-slate-400'; el.textContent='Everything is already uniform.'; } return; }
    if(!confirm('Normalise Skills on '+changes.length+' record'+(changes.length!==1?'s':'')+'?\n\nThis only changes casing and merges case-only duplicates — no skill is added or removed.')) return;
    let ok=0, failed=0;
    for(const c of changes){
      const { error }=await sb.from('applications').update({ tags:c.to }).eq('id',c.id);
      if(error){ console.error('skill backfill',c.id,error); failed++; } else ok++;
    }
    logAudit('skills_normalise','applications',String(ok), ok+' records normalised'+(failed?(', '+failed+' failed'):''));
    if(el){ el.className='text-[11px] mt-2.5 '+(failed?'text-amber-700':'text-emerald-700');
      el.textContent=ok+' record'+(ok!==1?'s':'')+' normalised'+(failed?(' · '+failed+' failed (see console)'):'')+'.'; }
    if(window.showToast) showToast(ok+' record'+(ok!==1?'s':'')+' normalised','success');
    await loadApplications(); renderAll();
  };

  // ── Resilience: surface failures instead of dying silently ──
  window.addEventListener('error', e=>{
    console.error('[cnt] uncaught', e.error||e.message);
    if(window.showToast) showToast('Something went wrong — the team has been notified.','error');
  });
  window.addEventListener('unhandledrejection', e=>{
    console.error('[cnt] unhandled promise rejection', e.reason);
  });

  // ══════════════════════════════════════════════════════════════
  //  PIPELINE STAGES — configurable (public.stages)
  //  The hard-coded PIPELINE_STAGES stays as a fallback so the app still
  //  works if the table is missing or unreachable.
  // ══════════════════════════════════════════════════════════════
  const STAGE_COLORS=['#ef4444','#f97316','#f59e0b','#8b5cf6','#3b82f6','#06b6d4','#6366f1','#10b981','#059669','#be185d'];
  function _slug(s){ return String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,40); }

  // ══════════════════════════════════════════════════════════════
  //  CACHE  —  instant first paint, then always refresh from the server.
  //  ONLY reference data is cached (stages, clients/positions/locations,
  //  job postings). Applicant records are NEVER cached: that is personal
  //  data and localStorage would outlive the session on a shared machine.
  //  Everything here is wiped on sign-out.
  // ══════════════════════════════════════════════════════════════
  const CACHE_PREFIX='cnt_cache_', PREF_PREFIX='cnt_pref_', SESS_PREFIX='cnt_sess_';
  const CACHE_VERSION='v1';          // bump to invalidate every cached entry
  const CACHE_TTL_MIN=720;           // 12h — the network copy always wins anyway
  function cacheSet(key,val){
    try{ localStorage.setItem(CACHE_PREFIX+key, JSON.stringify({v:CACHE_VERSION,t:Date.now(),d:val})); }
    catch(e){ /* quota/private mode — caching is optional, never fatal */ }
  }
  function cacheGet(key){
    try{
      const r=JSON.parse(localStorage.getItem(CACHE_PREFIX+key)||'null');
      if(!r || r.v!==CACHE_VERSION) return null;
      if(Date.now()-r.t > CACHE_TTL_MIN*60000) return null;
      return r.d;
    }catch(e){ return null; }
  }
  function prefSet(k,v){ try{ localStorage.setItem(PREF_PREFIX+k, JSON.stringify(v)); }catch(e){} }
  function prefGet(k,d){ try{ const s=localStorage.getItem(PREF_PREFIX+k); return s==null?d:JSON.parse(s); }catch(e){ return d; } }
  function sessSet(k,v){ try{ sessionStorage.setItem(SESS_PREFIX+k, JSON.stringify(v)); }catch(e){} }
  function sessGet(k,d){ try{ const s=sessionStorage.getItem(SESS_PREFIX+k); return s==null?d:JSON.parse(s); }catch(e){ return d; } }
  function cacheClearAll(){
    try{
      Object.keys(localStorage).forEach(k=>{ if(k.indexOf(CACHE_PREFIX)===0||k.indexOf(PREF_PREFIX)===0) localStorage.removeItem(k); });
      Object.keys(sessionStorage).forEach(k=>{ if(k.indexOf(SESS_PREFIX)===0) sessionStorage.removeItem(k); });
    }catch(e){}
  }
  window.cntClearCache=function(){ cacheClearAll(); if(window.showToast) showToast('Cached data cleared','info'); };

  // Remember where you were. View + board/list mode persist across sessions;
  // data filters only for the current session — a filter you set yesterday
  // silently hiding records this morning would be worse than useless.
  const FILTER_IDS=['filter-role','filter-location','filter-stage','filter-source',
                    'job-f-client','job-f-position','job-f-location','job-f-status'];
  function saveFilters(){
    const o={}; FILTER_IDS.forEach(id=>{ const el=document.getElementById(id); if(el) o[id]=el.value; });
    if(typeof currentAccount!=='undefined') o._client=currentAccount;
    sessSet('filters',o);
  }
  function restoreFilters(){
    const o=sessGet('filters',null); if(!o) return;
    FILTER_IDS.forEach(id=>{
      const el=document.getElementById(id);
      if(el && o[id]!=null && [...el.options].some(x=>x.value===o[id])) el.value=o[id];
    });
    if(o._client && o._client!=='all' && typeof selectClient==='function') selectClient(o._client);
  }
  function watchFilters(){
    FILTER_IDS.forEach(id=>{
      const el=document.getElementById(id);
      if(el && !el.dataset.cntWatch){ el.dataset.cntWatch='1'; el.addEventListener('change',saveFilters); }
    });
  }
  function restoreView(){
    const allowed=ROLE_MODULES[currentRole]||ROLE_MODULES['recruiter'];
    const m=prefGet('pipemode',null);
    if(m && typeof toggleApplicationView==='function') toggleApplicationView(m);
    const v=prefGet('view',null);
    if(v && allowed.indexOf(v)>=0 && typeof switchView==='function'){
      switchView(v);
      if(v==='applications' && window.cntShowPipelineFilters) cntShowPipelineFilters(true);
    }
  }
  if(typeof switchView==='function'){ const _sv=switchView; switchView=function(v){ _sv(v); prefSet('view',v); }; }
  if(typeof toggleApplicationView==='function'){ const _tv=toggleApplicationView; toggleApplicationView=function(m){ _tv(m); prefSet('pipemode',m); }; }

  function _applyStages(rows){
    if(!rows || !rows.length) return false;
    PIPELINE_STAGES.length=0;
    rows.forEach(r=>PIPELINE_STAGES.push({
      _id:r.id, key:r.key, label:r.name, short:r.short||r.name, color:r.color||'#64748b',
      sequence:r.sequence||0, folded:!!r.folded, is_hired:!!r.is_hired,
      email_subject:r.email_subject||'', email_body:r.email_body||'', auto_email:!!r.auto_email, requirements:r.requirements||''
    }));
    applyStageStyles();
    fillStageSelects();
    return true;
  }
  async function loadStages(){
    applyStageStyles();
    _applyStages(cacheGet('stages'));                 // paint immediately from cache
    if(!sb) return;
    const { data, error } = await sb.from('stages').select('*').order('sequence');
    if(error){ console.warn('stages load — using built-in pipeline',error); return; }
    if(!data || !data.length) return;
    cacheSet('stages',data);
    _applyStages(data);                               // server copy always wins
  }

  function fillStageSelects(){
    const opts=PIPELINE_STAGES.map(s=>'<option value="'+_e(s.key)+'">'+_e(s.label)+'</option>').join('')
      +'<option value="pool">Talent Pool</option><option value="rejected">Not Qualified</option>';
    const fs=document.getElementById('filter-stage');
    if(fs){ const cur=fs.value; fs.innerHTML='<option value="all">All Stages</option>'+opts;
            fs.value=[...fs.options].some(o=>o.value===cur)?cur:'all'; }
    ['app-stage','resume-stage-select'].forEach(id=>{
      const el=document.getElementById(id); if(!el) return;
      const cur=el.value; el.innerHTML=opts;
      if([...el.options].some(o=>o.value===cur)) el.value=cur;
    });
  }

  function renderStagesSettings(){
    const el=document.getElementById('set-list-stages'); if(!el) return;
    const counts={}; getAllApplicants().forEach(a=>{ counts[a.stage]=(counts[a.stage]||0)+1; });
    const chip=(t,c,b)=>'<span style="font-size:8.5px;font-weight:800;color:'+c+';background:'+b+';padding:1px 6px;border-radius:99px;margin-left:5px;letter-spacing:.04em;">'+t+'</span>';
    const btn=(fn,icon,title,dis)=>'<button '+(dis?'disabled':'')+' onclick="'+fn+'" title="'+title+'" style="width:26px;height:26px;border-radius:7px;border:1px solid #e2e8f0;color:'+(dis?'#e2e8f0':'#64748b')+';background:#fff;cursor:'+(dis?'default':'pointer')+';display:inline-flex;align-items:center;justify-content:center;flex:none;"><span class="material-icons-outlined" style="font-size:14px;">'+icon+'</span></button>';
    el.innerHTML=PIPELINE_STAGES.map((s,i)=>{
      const n=counts[s.key]||0;
      return '<div style="display:flex;align-items:center;gap:9px;padding:9px 8px;border-bottom:1px solid #f8fafc;">'
        +'<span style="width:11px;height:11px;border-radius:3px;background:'+s.color+';flex:none;"></span>'
        +'<div style="min-width:0;flex:1;">'
          +'<div style="font-size:12.5px;font-weight:600;color:#0f172a;">'+_e(s.label)
            +(s.is_hired?chip('HIRED','#166534','#dcfce7'):'')
            +(s.folded?chip('FOLDED','#64748b','#f1f5f9'):'')
            +(s.email_subject?chip('EMAIL','#4338ca','#eef2ff'):'')+'</div>'
          +'<div style="font-size:10px;color:#94a3b8;margin-top:1px;">'+_e(s.short||'')+' · '+n+' applicant'+(n!==1?'s':'')+'</div>'
        +'</div>'
        +btn('cntStageMove('+i+',-1)','arrow_upward','Move up',i===0)
        +btn('cntStageMove('+i+',1)','arrow_downward','Move down',i===PIPELINE_STAGES.length-1)
        +btn("cntStageEdit('"+s.key+"')",'edit','Edit stage',false)
        +btn("cntStageDelete('"+s.key+"')",'delete_outline','Delete stage',false)
        +'</div>';
    }).join('')||'<p style="font-size:11.5px;color:#94a3b8;padding:14px;text-align:center;">No stages — add one above.</p>';
  }

  // ── Add / edit a stage ──
  window.cntStageEdit=function(key){
    const s=key?PIPELINE_STAGES.find(x=>x.key===key):null;
    let m=document.getElementById('cnt-stage-modal');
    if(!m){ m=document.createElement('div'); m.id='cnt-stage-modal'; m.className='hidden fixed inset-0 z-[400] flex items-center justify-center p-4'; document.body.appendChild(m); }
    const v=(x)=>_e(x||'');
    const swatches=STAGE_COLORS.map(c=>'<button type="button" onclick="document.getElementById(\'st-color\').value=\''+c+'\'" style="width:20px;height:20px;border-radius:5px;background:'+c+';cursor:pointer;border:2px solid '+((s&&s.color===c)?'#0f172a':'transparent')+';"></button>').join('');
    m.innerHTML='<div class="absolute inset-0 bg-slate-900/50" onclick="document.getElementById(\'cnt-stage-modal\').classList.add(\'hidden\')"></div>'
      +'<div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl z-10 border border-slate-200 overflow-hidden" style="max-height:92vh;display:flex;flex-direction:column;">'
      +'<div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between"><h3 class="font-bold text-sm text-slate-800">'+(s?'Edit stage — '+v(s.label):'New stage')+'</h3>'
        +'<button onclick="document.getElementById(\'cnt-stage-modal\').classList.add(\'hidden\')" class="text-slate-400 hover:text-red-700 cursor-pointer"><span class="material-icons-outlined">close</span></button></div>'
      +'<div class="p-4 space-y-3 overflow-y-auto custom-scroll">'
        +'<input type="hidden" id="st-key" value="'+v(s&&s.key)+'">'
        +'<div class="grid grid-cols-2 gap-3">'
          +'<div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Stage name <span class="text-red-500">*</span></label><input id="st-name" value="'+v(s&&s.label)+'" placeholder="e.g. Client Interview" class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"></div>'
          +'<div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Short label</label><input id="st-short" value="'+v(s&&s.short)+'" placeholder="for the board column" class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"></div>'
        +'</div>'
        +'<div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Colour</label>'
          +'<div class="flex items-center gap-2 flex-wrap"><input id="st-color" value="'+v((s&&s.color)||'#8b5cf6')+'" class="text-xs border border-slate-200 rounded-lg px-3 py-2" style="width:110px;">'+swatches+'</div></div>'
        +'<div class="flex items-center gap-5 pt-1">'
          +'<label class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"><input type="checkbox" id="st-folded" '+((s&&s.folded)?'checked':'')+' class="accent-red-800 w-4 h-4"> Folded in board</label>'
          +'<label class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"><input type="checkbox" id="st-hired" '+((s&&s.is_hired)?'checked':'')+' class="accent-red-800 w-4 h-4"> Hired stage</label>'
        +'</div>'
        +'<p class="text-[10px] text-slate-400 -mt-1">“Hired stage” marks the candidate as hired and unlocks Client Endorsement and the deployment milestones.</p>'
        +'<div class="pt-2 border-t border-slate-100">'
          +'<label class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer mb-1"><input type="checkbox" id="st-auto-email" '+((s&&s.auto_email)?'checked':'')+' class="accent-red-800 w-4 h-4"> Auto-send this email when a candidate enters this stage</label>'
          +'<p class="text-[10px] text-slate-400 mb-2">Off by default. Sends only when the candidate has an email on file and <code>RESEND_API_KEY</code> is configured. Leave the fields blank to use the built-in template.</p>'
          +'<input id="st-subj" value="'+v(s&&s.email_subject)+'" placeholder="Subject — use {name} {role} {account} {location}" class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 mb-2">'
          +'<textarea id="st-body" rows="4" placeholder="Message body — leave blank to use the built-in template" class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 resize-none">'+v(s&&s.email_body)+'</textarea></div>'
        +'<div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Requirements <span class="text-slate-400 font-normal normal-case">— internal note</span></label><textarea id="st-req" rows="2" placeholder="What must happen in this stage?" class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 resize-none">'+v(s&&s.requirements)+'</textarea></div>'
      +'</div>'
      +'<div class="px-4 py-3 border-t border-slate-100 flex justify-end gap-2">'
        +'<button onclick="document.getElementById(\'cnt-stage-modal\').classList.add(\'hidden\')" class="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-4 py-2 hover:bg-slate-50 cursor-pointer">Cancel</button>'
        +'<button onclick="cntStageSave()" class="text-xs font-semibold text-white bg-red-800 hover:bg-red-900 rounded-lg px-4 py-2 cursor-pointer">Save stage</button>'
      +'</div></div>';
    m.classList.remove('hidden');
  };

  window.cntStageSave=async function(){
    if(!sb){ if(window.showToast) showToast('Backend unavailable','error'); return; }
    const key=(document.getElementById('st-key')||{}).value||'';
    const name=((document.getElementById('st-name')||{}).value||'').trim();
    if(!name){ if(window.showToast) showToast('Stage name is required','info'); return; }
    const row={
      name,
      short:((document.getElementById('st-short')||{}).value||'').trim()||name,
      color:((document.getElementById('st-color')||{}).value||'#8b5cf6').trim(),
      folded:!!(document.getElementById('st-folded')||{}).checked,
      is_hired:!!(document.getElementById('st-hired')||{}).checked,
      email_subject:((document.getElementById('st-subj')||{}).value||'').trim()||null,
      email_body:((document.getElementById('st-body')||{}).value||'').trim()||null,
      auto_email:!!(document.getElementById('st-auto-email')||{}).checked,
      requirements:((document.getElementById('st-req')||{}).value||'').trim()||null
    };
    let error;
    if(key){
      ({ error } = await sb.from('stages').update(row).eq('key',key));   // key never changes — records stay valid
      if(!error) logAudit('stage_edit','stage',key,name);
    } else {
      let k=_slug(name)||('stage_'+Date.now());
      if(PIPELINE_STAGES.some(s=>s.key===k)) k=k+'_'+Date.now().toString().slice(-4);
      row.key=k;
      row.sequence=(PIPELINE_STAGES.length?Math.max(...PIPELINE_STAGES.map(s=>s.sequence||0)):0)+10;
      ({ error } = await sb.from('stages').insert(row));
      if(!error) logAudit('stage_add','stage',k,name);
    }
    if(error){ console.error('stage save',error); if(window.showToast) showToast('Save failed: '+error.message,'error'); return; }
    document.getElementById('cnt-stage-modal').classList.add('hidden');
    await loadStages(); renderStagesSettings(); renderAll();
    if(window.showToast) showToast('Stage saved','success');
  };

  window.cntStageDelete=async function(key){
    const s=PIPELINE_STAGES.find(x=>x.key===key); if(!s) return;
    const n=getAllApplicants().filter(a=>a.stage===key).length;
    if(n){ alert('“'+s.label+'” still has '+n+' applicant'+(n!==1?'s':'')+'.\n\nMove or refuse them first — deleting the stage would strand their records.'); return; }
    if(PIPELINE_STAGES.length<=1){ alert('You need at least one stage.'); return; }
    if(!confirm('Delete the “'+s.label+'” stage?')) return;
    if(!sb) return;
    const { error }=await sb.from('stages').delete().eq('key',key);
    if(error){ console.error('stage delete',error); if(window.showToast) showToast('Delete failed: '+error.message,'error'); return; }
    logAudit('stage_delete','stage',key,s.label);
    await loadStages(); renderStagesSettings(); renderAll();
    if(window.showToast) showToast('Stage deleted','info');
  };

  window.cntStageMove=async function(i,dir){
    const j=i+dir;
    if(j<0 || j>=PIPELINE_STAGES.length) return;
    const a=PIPELINE_STAGES[i], b=PIPELINE_STAGES[j];
    if(!sb){ if(window.showToast) showToast('Backend unavailable','error'); return; }
    const sa=a.sequence||0, sb2=b.sequence||0;
    const r1=await sb.from('stages').update({sequence:sb2}).eq('key',a.key);
    const r2=await sb.from('stages').update({sequence:sa}).eq('key',b.key);
    if(r1.error||r2.error){ console.error('stage move',r1.error||r2.error); if(window.showToast) showToast('Reorder failed','error'); return; }
    await loadStages(); renderStagesSettings(); renderAll();
  };

  // ── Add to Talent Pool ──
  window.cntAddToPool=function(id){
    const app=findApplicant(id); if(!app) return;
    if(app.stage==='pool'){ if(window.showToast) showToast('Already in the Talent Pool','info'); return; }
    updateApplicant(id,{stage:'pool'}); app.stage='pool';
    _persistApp(app,{stage:'pool'});
    logAudit('add_to_pool','applicant',app._sid||id, app.name);
    cntLogActivity(app,'stage','Added to Talent Pool');
    if(window.showToast) showToast(app.name+' added to Talent Pool','success');
    const m=document.getElementById('resume-modal'); if(m) m.classList.add('hidden');
    renderAll();
  };

  // ══════════════════════════════════════════════════════════════
  //  DIGITIZE RÉSUMÉ — extract candidate info from the uploaded CV
  //  (PDF text layer via pdf.js, DOCX via mammoth) and fill EMPTY
  //  applicant fields. Never overwrites what a recruiter typed.
  // ══════════════════════════════════════════════════════════════
  function _loadScript(src){ return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=()=>rej(new Error('Could not load '+src)); document.head.appendChild(s); }); }
  // pdf.js hands back positioned text runs, not lines. Joining them with
  // spaces produced one enormous line per page, so the section splitter found
  // no headings and every section came back empty for PDF résumés (DOCX was
  // fine — mammoth keeps the newlines). Rebuild lines from the runs' baseline
  // y, and insert a space only where there is a real horizontal gap, because
  // runs frequently split mid-word.
  const _LINE_TOL=2.5;                 // baseline wobble within one line
  const _MIN_GUTTER=18;                // narrower than this is word spacing

  // Turn runs sharing a baseline into one line. A space goes in only where
  // there is a real horizontal gap — runs frequently split mid-word, and
  // "Cus"+"tomer" must not come back as "Cus tomer".
  function _buildLines(runs){
    const rs=runs.slice().sort((a,b)=> (b.y-a.y) || (a.x-b.x));
    const groups=[]; let cur=[], curY=rs[0].y;
    for(const r of rs){
      if(Math.abs(r.y-curY)>_LINE_TOL){ groups.push(cur); cur=[]; curY=r.y; }
      cur.push(r);
    }
    groups.push(cur);
    return groups.map(g=>{
      g.sort((a,b)=>a.x-b.x);
      let s='', end=null;
      for(const r of g){
        if(end!==null && (r.x-end)>1) s+=' ';
        s+=r.str; end=r.x+r.w;
      }
      return s.replace(/[ \t]+/g,' ').trim();
    }).filter(Boolean);
  }

  // Find the widest vertical band that no run crosses. In a two-column résumé
  // that band is the gutter between the columns.
  function _findGutter(runs){
    let minX=Infinity, maxX=-Infinity;
    for(const r of runs){ if(r.x<minX) minX=r.x; if(r.x+r.w>maxX) maxX=r.x+r.w; }
    const width=maxX-minX;
    if(!(width>0)) return null;
    const B=2, n=Math.ceil(width/B)+1, covered=new Uint8Array(n);
    for(const r of runs){
      const a=Math.max(0,Math.floor((r.x-minX)/B));
      const b=Math.min(n-1,Math.ceil((r.x+r.w-minX)/B));
      for(let i=a;i<=b;i++) covered[i]=1;
    }
    let best=null,i=0;
    while(i<n){
      if(covered[i]){ i++; continue; }
      let j=i; while(j<n && !covered[j]) j++;
      if(i>0 && j<n){                                  // interior bands only
        const w=(j-i)*B;
        if(!best || w>best.w) best={ w, mid:minX+((i+j)/2)*B };
      }
      i=j;
    }
    return (best && best.w>=_MIN_GUTTER) ? best : null;
  }

  // A real column carries its own headings; a strip of right-aligned dates
  // does not. That is the signal used below to tell them apart.
  function _hasHeading(runs){
    return _buildLines(runs).some(l => _secKey(l) || _isCapsLine(l));
  }

  // Split runs at a gutter, but only when both sides really look like columns.
  // The false positive to avoid is a single-column résumé with right-aligned
  // dates ("Acme BPO . . . 2020-2024"), which also leaves an uncovered band.
  // Baseline sharing cannot separate the two cases — sidebar columns usually
  // do align their baselines — but headings can: a date strip has none.
  function _splitColumns(runs, depth){
    if(depth<=0 || runs.length<8) return [runs];
    const g=_findGutter(runs);
    if(!g) return [runs];
    const left=runs.filter(r=>(r.x+r.w/2)<g.mid);
    const right=runs.filter(r=>(r.x+r.w/2)>=g.mid);
    const min=Math.max(3, runs.length*0.15);
    if(left.length<min || right.length<min) return [runs];
    if(!_hasHeading(left) || !_hasHeading(right)) return [runs];
    return [].concat(_splitColumns(left,depth-1), _splitColumns(right,depth-1));
  }

  // pdf.js hands back positioned text runs, not lines. Joining them with
  // spaces produced one enormous line per page, so the section splitter found
  // no headings and every section came back empty for PDF résumés (DOCX was
  // fine — mammoth keeps the newlines). Rebuild lines from the runs' baseline
  // y; where the page is laid out in columns, read each column top to bottom
  // in turn rather than interleaving them across shared baselines.
  function _linesFromItems(items){
    const runs=[];
    for(const it of items||[]){
      const str=(it&&it.str)||'';
      if(!str.trim()) continue;
      const tr=it.transform||[];
      runs.push({ y:+tr[5]||0, x:+tr[4]||0, w:+it.width||0, str });
    }
    if(!runs.length) return [];
    const cols=_splitColumns(runs,2);                  // up to ~4 columns
    if(cols.length<2) return _buildLines(runs);
    // Left to right, each column read in full — the order a person reads them.
    cols.sort((a,b)=>Math.min(...a.map(r=>r.x))-Math.min(...b.map(r=>r.x)));
    return [].concat(...cols.map(_buildLines));
  }
  async function _pdfText(url){
    if(!window.pdfjsLib){
      await _loadScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js');
      window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    }
    const pdf=await window.pdfjsLib.getDocument(url).promise;
    let text='', big={h:0,s:''};
    const pages=Math.min(pdf.numPages,6);
    for(let p=1;p<=pages;p++){
      const page=await pdf.getPage(p);
      const c=await page.getTextContent();
      // Largest text on page 1 is a decent guess at the candidate's name
      if(p===1) c.items.forEach(it=>{
        const clean=(it.str||'').trim();
        const h=Math.abs((it.transform&&it.transform[3])||it.height||0);
        if(clean.length>2 && /[A-Za-z]/.test(clean) && h>big.h) big={h,s:clean};
      });
      text+=_linesFromItems(c.items).join('\n')+'\n';
    }
    return { text, name:big.s };
  }
  async function _docxText(url){
    if(!window.mammoth){ await _loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js'); }
    const buf=await (await fetch(url)).arrayBuffer();
    const r=await window.mammoth.extractRawText({ arrayBuffer:buf });
    return { text:r.value||'', name:'' };
  }
  // Render an uploaded .docx in the résumé pane. Browsers can't display Word
  // files natively, so mammoth converts it to HTML — but that HTML comes from
  // a file an applicant uploaded, so it goes into a sandboxed iframe (scripts
  // and same-origin both disabled) rather than straight into the page.
  window.cntRenderDocxPreview = async function(mount, url){
    if(!window.mammoth){ await _loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js'); }
    const buf=await (await fetch(url)).arrayBuffer();
    const r=await window.mammoth.convertToHtml({ arrayBuffer:buf });
    const html=(r&&r.value||'').trim();
    if(!html) throw new Error('empty document');
    const ifr=document.createElement('iframe');
    ifr.setAttribute('sandbox','');
    ifr.title='Uploaded resume';
    ifr.style.cssText='width:100%;height:400px;border:0;display:block;background:#fff;';
    ifr.srcdoc='<!doctype html><meta charset="utf-8"><style>'
      +'body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:13px;line-height:1.65;color:#0f172a;margin:0;padding:26px 30px;}'
      +'h1,h2,h3,h4{font-weight:700;margin:14px 0 6px;line-height:1.3;}h1{font-size:19px}h2{font-size:16px}h3{font-size:14px}'
      +'p{margin:0 0 8px}ul,ol{margin:0 0 8px 18px;padding:0}li{margin:2px 0}'
      +'table{border-collapse:collapse;width:100%;margin:8px 0}td,th{border:1px solid #e2e8f0;padding:4px 8px;text-align:left}'
      +'img{max-width:100%;height:auto}a{color:#7f1d1d}</style>'+html;
    mount.appendChild(ifr);
    return ifr;
  };
  // ── Résumé section splitter ──────────────────────────────────────
  // Each section used to have its own regex that had to list every heading
  // which might follow it. A résumé using an unlisted heading ("EMPLOYMENT
  // RECORD", "SEMINARS ATTENDED") silently produced an empty field — that is
  // why Work Experience kept coming back blank. Instead find the heading lines
  // once; a section is then simply the text running up to the next heading.
  const _SEC_PATTERNS=[
    ['summary',        /^(career\s+|professional\s+)?(objective|summary|profile|about\s+me)\b/i],
    ['experience',     /^(work|professional|employment|job|career)?\s*[-–—]?\s*(experience|experiences|history|record|records|background)\b/i],
    ['education',      /^(educational\s+|academic\s+)?(education|background|attainment|qualifications?|studies)\b/i],
    ['skills',         /^(technical\s+|core\s+|key\s+|special\s+|other\s+|computer\s+)?(skills?|competenc(?:y|ies)|strengths?|proficienc(?:y|ies)|expertise)\b/i],
    ['certifications', /^(certificat\w*|licen[sc]\w*|eligibilit\w*|credential\w*)\b/i],
    ['seminars',       /^(seminars?|trainings?|workshops?|continuing\s+education)\b/i],
    ['awards',         /^(awards?|achievements?|hono(?:u)?rs?|recognitions?|accomplishments?)\b/i],
    ['char_references',/^(character\s+|personal\s+)?(references?|referees?)\b/i],
    ['languages',      /^(languages?|dialects?)\b/i],
  ];
  function _secKey(line){
    const s=String(line).trim().replace(/^[•\-*•\s]+/,'').replace(/[:\-–—\s]+$/,'');
    if(!s || s.length>60) return null;
    for(const [key,re] of _SEC_PATTERNS) if(re.test(s)) return key;
    return null;
  }
  function _isCapsLine(line){
    const s=String(line).trim();
    if(!s || s.length>60 || /[.,;]$/.test(s)) return false;
    const letters=s.replace(/[^A-Za-z]/g,'');
    return letters.length>=3 && letters===letters.toUpperCase() && s.split(/\s+/).length<=6;
  }
  function _splitSections(text){
    const lines=String(text||'').split(/\r?\n/);
    const nonEmpty=lines.filter(l=>l.trim());
    // Some résumés are typed entirely in capitals. Treating every line as a
    // heading there would empty every section, so fall back to named headings.
    const capsRatio=nonEmpty.length ? nonEmpty.filter(_isCapsLine).length/nonEmpty.length : 0;
    const useCaps=capsRatio<0.5;
    const out={}; let cur=null, buf=[];
    const flush=()=>{
      if(cur && buf.length){
        const v=buf.join('\n').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
        if(v) out[cur]=out[cur] ? out[cur]+'\n'+v : v;   // a section may repeat
      }
      buf=[];
    };
    for(const line of lines){
      const key=_secKey(line);
      if(key || (useCaps && _isCapsLine(line))){ flush(); cur=key; continue; }
      if(cur) buf.push(line);
    }
    flush();
    return out;
  }
  function _parseResume(t, guessName){
    const email=(t.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)||[])[0]||'';
    let linkedin=(t.match(/(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[A-Za-z0-9_%-]+/i)||[])[0]||'';
    if(linkedin && !/^https?:/i.test(linkedin)) linkedin='https://'+linkedin;
    const phoneRaw=(t.match(/(?:\+?63|0)\s?9\d{2}[\s.\-]?\d{3}[\s.\-]?\d{4}|\+?\d[\d\s().\-]{9,}\d/)||[])[0]||'';
    const phone=phoneRaw?phoneRaw.replace(/\s+/g,' ').trim():'';
    const sec=_splitSections(t);
    // Read the degree out of the education section when there is one. Scanning
    // the whole document matched "MS Office" in a skills list and promoted the
    // candidate to a master's degree — and MS Office is on most PH BPO CVs.
    // The bare "MS"/"MA" abbreviations are gone for the same reason: they now
    // need either periods ("M.S.") or a following "in" ("MS in Psychology").
    const degText=sec.education||t;
    let degree='';
    if(/\b(ph\.?\s?d|doctorate|doctoral)\b/i.test(degText)) degree='Doctoral';
    else if(/\bmaster'?s?\b|\bmba\b|\bm\.\s?[sa]\.|\bm\.?[sa]\.?\s+in\b/i.test(degText)) degree='Master';
    else if(/\bbachelor'?s?\b|\bb\.?\s?s\.?\b|\bb\.?\s?a\.?\b/i.test(degText)) degree='Bachelor';
    else if(/\bvocational\b|\btesda\b/i.test(degText)) degree='Vocational';
    else if(/\bhigh school\b|\bsenior high\b/i.test(degText)) degree='High School';
    const cap=(v,n)=>v?String(v).trim().slice(0,n):'';
    const oneLine=(v,n)=>v?String(v).replace(/\s+/g,' ').trim().slice(0,n):'';
    const summary        = oneLine(sec.summary,500);
    const skills         = oneLine(sec.skills,400);
    const languages      = oneLine(sec.languages,200);
    const experience     = cap(sec.experience,2000);
    const education      = cap(sec.education,900);
    const certifications = cap(sec.certifications,900);
    const seminars       = cap(sec.seminars,900);
    const awards         = cap(sec.awards,600);
    const char_references= cap(sec.char_references,600);
    let name=guessName||'';
    if(!name){ const lines=t.split(/\n/).map(l=>l.trim()).filter(Boolean); for(const l of lines.slice(0,5)){ if(/^[A-Z][A-Za-z.'-]+(\s+[A-Z][A-Za-z.'-]+){1,3}$/.test(l)){ name=l; break; } } }
    return { name, email, phone, linkedin, degree, summary, skills, experience, education, languages,
             certifications, seminars, awards, char_references };
  }
  // Fields Digitize can fill. Doubles as the "is anything still empty?" check
  // that stops the automatic run from re-downloading a CV we already read.
  const _DIGI_FIELDS=['email','phone','linkedin','degree','notes','work_experience','education','languages','tags',
                      'certifications','seminars','awards','char_references'];
  const _digiAutoDone=new Set();
  function _digiHasGaps(app){ return _DIGI_FIELDS.some(f=>!(''+(app[f]||'')).trim()); }
  window.cntDigitizeResume=async function(id, opts){
    const auto=!!(opts&&opts.auto);
    const app=findApplicant(id); if(!app) return;
    const banner=document.getElementById('cnt-digitize-banner');
    const show=(html,cls)=>{ if(!banner) return; banner.className='mb-3';
      banner.innerHTML='<div class="'+cls+'" style="border-radius:10px;padding:10px 14px;font-size:12.5px;display:flex;align-items:center;gap:8px;">'+html+'</div>'; };
    if(auto){
      // Opening a profile must stay cheap and silent: read the CV only when
      // there is a real gap to fill, and only once per applicant per session.
      if(_digiAutoDone.has(id)) return;
      if(!app._web || !app.resumePath || !sb) return;
      if(!_digiHasGaps(app)) return;
      _digiAutoDone.add(id);
    }
    if(!app._web || !app.resumePath || !sb){ show('<span class="material-icons-outlined" style="font-size:16px;">info</span>No uploaded résumé to digitize for this applicant.','bg-slate-100 text-slate-600 border border-slate-200'); return; }
    show('<span class="material-icons-outlined" style="font-size:16px;animation:spin 1s linear infinite;">progress_activity</span>Reading the résumé…','bg-slate-100 text-slate-600 border border-slate-200');
    try{
      const { data, error }=await sb.storage.from('resumes').createSignedUrl(app.resumePath,300);
      if(error||!data) throw new Error('Could not open the résumé file');
      const url=data.signedUrl;
      let res;
      if(/\.pdf(\?|$)/i.test(app.resumePath)) res=await _pdfText(url);
      else if(/\.docx?(\?|$)/i.test(app.resumePath)) res=await _docxText(url);
      else throw new Error('Only PDF or DOCX résumés can be digitized');
      const text=(res.text||'');
      if(text.replace(/\s/g,'').length<40) throw new Error('scanned');
      const f=_parseResume(text, res.name);
      const patch={}, db={}, filled=[];
      const put=(field,dbcol,val)=>{ if(val && !(''+(app[field]||'')).trim()){ patch[field]=val; db[dbcol]=val; filled.push(field==='notes'?'summary':field); } };
      put('email','email',f.email);
      put('phone','phone',f.phone);
      put('linkedin','linkedin',f.linkedin);
      put('degree','degree',f.degree);
      put('notes','cover_note',f.summary);
      put('work_experience','work_experience',f.experience);
      put('education','education',f.education);
      put('languages','languages',f.languages);
      put('certifications','certifications',f.certifications);
      put('seminars','seminars',f.seminars);
      put('awards','awards',f.awards);
      put('char_references','char_references',f.char_references);
      // Split skills on separators only — NOT "/", which lives inside real skill
      // names ("TCP/IP", "Windows Server 2019/2025", "AD/DS"). Allow longer names.
      if(f.skills && !(app.tags||'').trim()){ const tg=_uniformSkills(f.skills.split(/[;•|]/).join(',')).filter(s=>s.length>1&&s.length<40).slice(0,8).join(', '); if(tg){ patch.tags=tg; db.tags=tg; filled.push('tags'); } }
      Object.assign(app,patch);
      if(Object.keys(db).length){ updateApplicant(app.id,patch); _persistApp(app,db); }
      // An automatic pass that found nothing is not worth a log entry — it would
      // put a meaningless note on every profile that has a hard-to-read CV.
      if(filled.length || !auto){
        logAudit('digitize','applicant',app._sid||id, filled.join(', ')||'no new fields');
        cntLogActivity(app,'note','Résumé digitized'+(filled.length?(' — filled '+filled.join(', ')):' — nothing new to fill'));
      }
      if(window.cntRenderApplicantForm) cntRenderApplicantForm(app);
      const found=[];
      if(f.name) found.push('Name'); if(f.email) found.push('Email'); if(f.phone) found.push('Phone');
      if(f.linkedin) found.push('LinkedIn'); if(f.degree) found.push('Degree'); if(f.skills) found.push('Skills'); if(f.summary) found.push('Summary');
      if(f.experience) found.push('Experience'); if(f.education) found.push('Education'); if(f.languages) found.push('Languages');
      if(auto && !filled.length){ if(banner){ banner.className='hidden'; banner.innerHTML=''; } return; }
      const msg = filled.length ? ('Filled: <b>'+filled.join(', ')+'</b>.') : ('No empty fields to fill. Detected: '+(found.join(' · ')||'nothing readable')+'.');
      show('<span class="material-icons-outlined" style="font-size:16px;color:#166534;">task_alt</span><div><b>Résumé read automatically.</b> '+msg+'</div>','bg-emerald-50 text-emerald-800 border border-emerald-200');
    }catch(e){
      if(e.message==='scanned'){ show('<span class="material-icons-outlined" style="font-size:16px;">image</span>This résumé looks like a scanned image — there is no text layer to read. Please enter the details manually.','bg-amber-50 text-amber-800 border border-amber-200'); }
      else { console.error('digitize',e); show('<span class="material-icons-outlined" style="font-size:16px;">error</span>Could not digitize: '+_e(e.message||'unknown error'),'bg-red-50 text-red-700 border border-red-200'); }
    }
  };

  // Bootstrap — called by the app's DOMContentLoaded handler
  window.cntBoot = function(){
    applyStageStyles();   // stage badge colours must exist even before/without a backend
    fillStageSelects();   // hidden stage <select> needs its options for stage restores
    if(!sb){ buildClientDropdown(); renderAll(); showDemoBanner(); return; }
    sb.auth.getSession().then(({data})=>{
      if(data && data.session){ startApp(); } else { showLogin(); }
    }).catch(err=>{ console.error(err); showLogin(); });
  };

  // ── Accessibility: label icon-only controls ─────────────────────
  // Most buttons here are an icon with no text, which screen readers announce
  // as just "button". This gives each an aria-label from its title or the icon
  // name — covering the ~150 buttons without editing each by hand, and re-running
  // as views render. Debounced so it never thrashes on a busy DOM.
  (function(){
    function labelIcons(){
      document.querySelectorAll('button:not([aria-label]):not([data-a11y]), a:not([aria-label]):not([data-a11y])').forEach(el=>{
        if((el.textContent||'').replace(/\s+/g,' ').trim()) { el.setAttribute('data-a11y','1'); return; } // has visible text
        const ic=el.querySelector('.material-icons-outlined,.material-icons');
        const name=(el.getAttribute('title')||'').trim() || (ic?ic.textContent.trim().replace(/_/g,' '):'');
        if(name){ el.setAttribute('aria-label', name.charAt(0).toUpperCase()+name.slice(1)); }
        el.setAttribute('data-a11y','1');
      });
    }
    let t; const relabel=()=>{ clearTimeout(t); t=setTimeout(labelIcons, 250); };
    document.addEventListener('DOMContentLoaded',()=>{
      labelIcons();
      try{ new MutationObserver(relabel).observe(document.body,{childList:true,subtree:true}); }catch(e){}
    });
  })();

  // Wire the login form
  document.addEventListener('DOMContentLoaded',()=>{
    const form=document.getElementById('cnt-login-form'); if(!form||!sb) return;
    form.addEventListener('submit',async(e)=>{
      e.preventDefault();
      const email=document.getElementById('cnt-email').value.trim();
      const pass=document.getElementById('cnt-pass').value;
      const err=document.getElementById('cnt-login-err');
      const btn=document.getElementById('cnt-login-btn');
      err.style.display='none'; btn.disabled=true; btn.textContent='Signing in…';
      const { error }=await sb.auth.signInWithPassword({ email, password:pass });
      if(error){ err.textContent=error.message; err.style.display='block'; btn.disabled=false; btn.textContent='Sign in'; return; }
      startApp();
    });
  });
})();
