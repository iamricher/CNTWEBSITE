/* ============================================================
   CNT ATS — core UI, rendering, views (loads first)
   Extracted from ats.html (roadmap #8). Classic script (NOT a module):
   ats-ui.js and ats-data.js share the page global scope, in that load
   order. Inline on* handlers in ats.html call functions defined here.
   ============================================================ */
const ACCOUNTS = [
  { id:'SONY',       label:'SONY',       sub:'Electronics',    color:'#1d4ed8', region:'Cebu / Manila' },
  { id:'HAIER',      label:'HAIER',      sub:'Home Appliances',color:'#0f766e', region:'Davao / Cebu' },
  { id:'HISENSE',    label:'HISENSE',    sub:'Electronics',    color:'#7c3aed', region:'Luzon' },
  { id:'URC',        label:'URC',        sub:'Consumer Goods', color:'#b91c1c', region:'Nationwide' },
  { id:'SKYWORTH',   label:'SKYWORTH',   sub:'Electronics',    color:'#0369a1', region:'NCR / Visayas' },
  { id:'UNCLE JOHNS',label:'UNCLE JOHNS',sub:'Food & Bev',     color:'#d97706', region:'NCR / Luzon' },
  { id:'Cinderella', label:'Cinderella', sub:'Retail / Fashion',color:'#be185d',region:'Metro Manila' },
];

const LOCATIONS = ['Manila','Tarlac','Bulacan','Pampanga','Cavite','Pangasinan','Batangas'];
const SOURCES   = ['JobStreet','Indeed','Facebook','Referral','Walk-in','LinkedIn','Kalibrr','OLX'];
const PH_REQUIREMENTS = ['NBI Clearance','Medical Certificate','SSS','PhilHealth','Pag-IBIG','TIN','Birth Certificate (PSA)','Diploma / TOR','2x2 ID Photo','Barangay Clearance'];

const RECRUITER_STEPS = [
  'Resume reviewed & endorsed',
  'Initial phone contact made',
  'Job details explained to candidate',
  'Interview confirmed & reminded',
  'Assessment / exam result received',
  'Background check cleared',
  'Offer discussed with candidate',
  'Candidate accepted offer',
  'Pre-employment docs requested',
  'Start date confirmed',
];

const accountData = {
  'SONY': [
    {id:'s1',name:'Jane Smith',role:'Merchandiser',account:'SONY',location:'Manila',stage:'qualified',phone:'+63 920 987 6543',email:'jane@email.com',source:'JobStreet',salary:'₱18,000',notes:'Strong background in consumer electronics.',interviewDate:'2026-06-20',interviewTime:'10:30',interviewType:'Face-to-Face (On-site)',appliedDate:'2026-06-01'},
    {id:'s2',name:'Diego Luna',role:'Merchandiser',account:'SONY',location:'Tarlac',stage:'pool',phone:'+63 945 777 8888',email:'diego@email.com',source:'Indeed',salary:'₱16,000',notes:'Good candidate, placed in pool for future opening.',appliedDate:'2026-05-20'},
    {id:'s3',name:'Kim Reyes',role:'Brand Ambassador',account:'SONY',location:'Bulacan',stage:'new',phone:'+63 917 444 3333',email:'kim@email.com',source:'Facebook',salary:'₱17,500',notes:'',appliedDate:'2026-06-10'},
    {id:'s4',name:'Lia Santos',role:'Product Demonstrator',account:'SONY',location:'Pampanga',stage:'hired',phone:'+63 920 111 9999',email:'lia@email.com',source:'Referral',salary:'₱19,000',notes:'Excellent performance in interview. Offer extended.',appliedDate:'2026-05-15',interviewDate:'2026-05-25',interviewTime:'09:00',interviewType:'Panel Interview'},
    {id:'s5',name:'Marco Diaz',role:'Store Supervisor',account:'SONY',location:'Manila',stage:'exam',phone:'+63 917 222 1111',email:'marco@email.com',source:'LinkedIn',salary:'₱25,000',notes:'Scheduled for written exam on June 22.',appliedDate:'2026-06-05'},
  ],
  'HAIER': [
    {id:'h1',name:'Alice Santos',role:'Brand Ambassador',account:'HAIER',location:'Cavite',stage:'onboarding',phone:'+63 905 444 8888',email:'alice@email.com',source:'Walk-in',salary:'₱17,000',notes:'Requirements being collected. Start date July 1.',appliedDate:'2026-05-10'},
    {id:'h2',name:'Ben Torres',role:'Sales Promoter',account:'HAIER',location:'Manila',stage:'new',phone:'+63 918 222 1111',email:'ben@email.com',source:'JobStreet',salary:'₱15,500',notes:'',appliedDate:'2026-06-09'},
    {id:'h3',name:'Clara Reyes',role:'Merchandiser',account:'HAIER',location:'Batangas',stage:'qualified',phone:'+63 920 777 6666',email:'clara@email.com',source:'OLX',salary:'₱16,500',notes:'1st interview passed.',interviewDate:'2026-06-22',interviewTime:'11:00',interviewType:'Video Call (Zoom/Google Meet)',appliedDate:'2026-05-28'},
    {id:'h4',name:'Roy Mendez',role:'Area Supervisor',account:'HAIER',location:'Pangasinan',stage:'bgcheck',phone:'+63 916 555 2222',email:'roy@email.com',source:'Kalibrr',salary:'₱28,000',notes:'BGC in progress. Clearances submitted.',appliedDate:'2026-05-05'},
  ],
  'HISENSE': [
    {id:'hi1',name:'Paolo Cruz',role:'Product Demonstrator',account:'HISENSE',location:'Manila',stage:'new',phone:'+63 917 100 2200',email:'paolo@email.com',source:'Facebook',salary:'₱16,000',notes:'',appliedDate:'2026-06-08'},
    {id:'hi2',name:'Tricia Lim',role:'Sales Promoter',account:'HISENSE',location:'Bulacan',stage:'phone',phone:'+63 918 300 4400',email:'tricia@email.com',source:'JobStreet',salary:'₱15,000',notes:'Phone screen scheduled June 15.',interviewDate:'2026-06-15',interviewTime:'14:00',interviewType:'Phone Screen',appliedDate:'2026-06-05'},
    {id:'hi3',name:'Andy Villar',role:'Trade Marketing Specialist',account:'HISENSE',location:'Pampanga',stage:'scheduled',phone:'+63 909 500 6600',email:'andy@email.com',source:'LinkedIn',salary:'₱30,000',notes:'2nd interview with client rep.',interviewDate:'2026-06-18',interviewTime:'15:00',interviewType:'Client Interview',appliedDate:'2026-05-25'},
    {id:'hi4',name:'Nadia Soriano',role:'In-Store Activator',account:'HISENSE',location:'Cavite',stage:'pool',phone:'+63 921 700 8800',email:'nadia@email.com',source:'Referral',salary:'₱14,500',notes:'Good fit but no current opening in Cavite.',appliedDate:'2026-05-18'},
  ],
  'URC': [
    {id:'u1',name:'John Doe',role:'Sales Promoter',account:'URC',location:'Manila',stage:'new',phone:'+63 917 123 4567',email:'john@email.com',source:'JobStreet',salary:'₱15,000',notes:'',appliedDate:'2026-06-10'},
    {id:'u2',name:'Mark Ramos',role:'Area Supervisor',account:'URC',location:'Tarlac',stage:'scheduled',phone:'+63 918 555 1234',email:'mark@email.com',source:'Indeed',salary:'₱27,000',notes:'2nd interview confirmed.',interviewDate:'2026-06-19',interviewTime:'14:00',interviewType:'Panel Interview',appliedDate:'2026-05-20'},
    {id:'u3',name:'Robert Lee',role:'Sales Promoter',account:'URC',location:'Pangasinan',stage:'qualified',phone:'+63 915 222 3333',email:'robert@email.com',source:'Facebook',salary:'₱15,500',notes:'Passed initial screen.',interviewDate:'2026-06-21',interviewTime:'09:00',interviewType:'Face-to-Face (On-site)',appliedDate:'2026-05-30'},
    {id:'u4',name:'Elena Cruz',role:'Field Sales Representative',account:'URC',location:'Bulacan',stage:'scheduled',phone:'+63 917 888 7777',email:'elena@email.com',source:'Kalibrr',salary:'₱22,000',notes:'Client-side interview.',interviewDate:'2026-06-23',interviewTime:'15:30',interviewType:'Client Interview',appliedDate:'2026-05-22'},
    {id:'u5',name:'Patricia Gomez',role:'Content Marketer',account:'URC',location:'Manila',stage:'pool',phone:'+63 999 111 2222',email:'patricia@email.com',source:'LinkedIn',salary:'₱25,000',notes:'Highly qualified, waiting for Manila opening.',appliedDate:'2026-05-15'},
    {id:'u6',name:'Mia Torres',role:'Trade Marketing Specialist',account:'URC',location:'Batangas',stage:'exam',phone:'+63 917 333 5555',email:'mia@email.com',source:'Referral',salary:'₱29,000',notes:'Written exam June 17.',appliedDate:'2026-05-28'},
  ],
  'SKYWORTH': [
    {id:'sk1',name:'Leo Castro',role:'Product Demonstrator',account:'SKYWORTH',location:'Manila',stage:'new',phone:'+63 917 990 1100',email:'leo@email.com',source:'Facebook',salary:'₱15,500',notes:'',appliedDate:'2026-06-09'},
    {id:'sk2',name:'Grace Tan',role:'Sales Promoter',account:'SKYWORTH',location:'Pampanga',stage:'qualified',phone:'+63 918 880 2200',email:'grace@email.com',source:'JobStreet',salary:'₱15,000',notes:'1st interview passed with flying colors.',interviewDate:'2026-06-16',interviewTime:'10:00',interviewType:'Face-to-Face (On-site)',appliedDate:'2026-05-25'},
    {id:'sk3',name:'Nathan Bautista',role:'Merchandiser',account:'SKYWORTH',location:'Tarlac',stage:'hired',phone:'+63 919 770 3300',email:'nathan@email.com',source:'Referral',salary:'₱17,000',notes:'Offer letter to be sent June 13.',appliedDate:'2026-05-10'},
  ],
  'UNCLE JOHNS': [
    {id:'uj1',name:'Rosa Malabanan',role:'Sales Promoter',account:'UNCLE JOHNS',location:'Batangas',stage:'new',phone:'+63 917 440 5500',email:'rosa@email.com',source:'Walk-in',salary:'₱14,500',notes:'',appliedDate:'2026-06-10'},
    {id:'uj2',name:'Carlo Manalo',role:'In-Store Activator',account:'UNCLE JOHNS',location:'Manila',stage:'qualified',phone:'+63 918 330 6600',email:'carlo@email.com',source:'Facebook',salary:'₱15,000',notes:'Good personality, suited for activations.',interviewDate:'2026-06-17',interviewTime:'13:00',interviewType:'Face-to-Face (On-site)',appliedDate:'2026-05-28'},
    {id:'uj3',name:'Beth Pascual',role:'Logistics Coordinator',account:'UNCLE JOHNS',location:'Bulacan',stage:'pool',phone:'+63 921 220 7700',email:'beth@email.com',source:'Indeed',salary:'₱20,000',notes:'Placed in pool, no current opening.',appliedDate:'2026-05-20'},
  ],
  'Cinderella': [
    {id:'ci1',name:'Shine Villanueva',role:'Sales Promoter',account:'Cinderella',location:'Manila',stage:'new',phone:'+63 917 660 8800',email:'shine@email.com',source:'Facebook',salary:'₱15,000',notes:'',appliedDate:'2026-06-10'},
    {id:'ci2',name:'Dana Ong',role:'Store Supervisor',account:'Cinderella',location:'Manila',stage:'qualified',phone:'+63 918 550 9900',email:'dana@email.com',source:'JobStreet',salary:'₱24,000',notes:'Strong retail background.',interviewDate:'2026-06-20',interviewTime:'11:00',interviewType:'Face-to-Face (On-site)',appliedDate:'2026-05-25'},
    {id:'ci3',name:'Marc Herrera',role:'Brand Ambassador',account:'Cinderella',location:'Cavite',stage:'scheduled',phone:'+63 916 440 1010',email:'marc@email.com',source:'Referral',salary:'₱17,500',notes:'Panel interview with client.',interviewDate:'2026-06-24',interviewTime:'14:00',interviewType:'Panel Interview',appliedDate:'2026-05-15'},
  ],
};

const jobDatabase = {
  'SONY':        [{role:'Merchandiser',account:'SONY',location:'Manila',needed:5,salary:'₱17,000-₱19,000',priority:'high'},{role:'Brand Ambassador',account:'SONY',location:'Tarlac',needed:3,salary:'₱16,000-₱18,000',priority:'normal'},{role:'Store Supervisor',account:'SONY',location:'Bulacan',needed:2,salary:'₱23,000-₱26,000',priority:'urgent'},{role:'Product Demonstrator',account:'SONY',location:'Pampanga',needed:4,salary:'₱15,500-₱17,000',priority:'normal'}],
  'HAIER':       [{role:'Sales Promoter',account:'HAIER',location:'Manila',needed:6,salary:'₱14,500-₱16,500',priority:'high'},{role:'Brand Ambassador',account:'HAIER',location:'Cavite',needed:3,salary:'₱16,000-₱18,000',priority:'normal'},{role:'Area Supervisor',account:'HAIER',location:'Pangasinan',needed:1,salary:'₱26,000-₱30,000',priority:'urgent'},{role:'Merchandiser',account:'HAIER',location:'Batangas',needed:4,salary:'₱15,500-₱17,500',priority:'normal'}],
  'HISENSE':     [{role:'Product Demonstrator',account:'HISENSE',location:'Manila',needed:5,salary:'₱15,000-₱17,000',priority:'high'},{role:'Trade Marketing Specialist',account:'HISENSE',location:'Pampanga',needed:2,salary:'₱28,000-₱35,000',priority:'normal'},{role:'In-Store Activator',account:'HISENSE',location:'Cavite',needed:3,salary:'₱14,000-₱16,000',priority:'normal'}],
  'URC':         [{role:'Sales Promoter',account:'URC',location:'Manila',needed:8,salary:'₱14,500-₱16,000',priority:'urgent'},{role:'Area Supervisor',account:'URC',location:'Tarlac',needed:2,salary:'₱25,000-₱28,000',priority:'high'},{role:'Field Sales Representative',account:'URC',location:'Bulacan',needed:4,salary:'₱20,000-₱24,000',priority:'high'},{role:'Trade Marketing Specialist',account:'URC',location:'Batangas',needed:2,salary:'₱28,000-₱32,000',priority:'normal'}],
  'SKYWORTH':    [{role:'Product Demonstrator',account:'SKYWORTH',location:'Manila',needed:5,salary:'₱14,500-₱16,500',priority:'normal'},{role:'Sales Promoter',account:'SKYWORTH',location:'Pampanga',needed:4,salary:'₱14,000-₱16,000',priority:'high'},{role:'Merchandiser',account:'SKYWORTH',location:'Tarlac',needed:3,salary:'₱15,500-₱17,000',priority:'normal'}],
  'UNCLE JOHNS': [{role:'Sales Promoter',account:'UNCLE JOHNS',location:'Batangas',needed:4,salary:'₱13,500-₱15,500',priority:'normal'},{role:'In-Store Activator',account:'UNCLE JOHNS',location:'Manila',needed:3,salary:'₱14,000-₱16,000',priority:'high'},{role:'Logistics Coordinator',account:'UNCLE JOHNS',location:'Bulacan',needed:2,salary:'₱18,000-₱22,000',priority:'normal'}],
  'Cinderella':  [{role:'Sales Promoter',account:'Cinderella',location:'Manila',needed:6,salary:'₱14,500-₱16,000',priority:'high'},{role:'Store Supervisor',account:'Cinderella',location:'Manila',needed:2,salary:'₱22,000-₱26,000',priority:'urgent'},{role:'Brand Ambassador',account:'Cinderella',location:'Cavite',needed:3,salary:'₱15,500-₱18,000',priority:'normal'}],
};

let hiringRequests = [
  {id:'REQ-001',account:'SONY',role:'Store Supervisor',location:'Bulacan',type:'Replacement',count:1,priority:'Urgent',status:'Open',date:'2026-06-01',deadline:'2026-06-30',requestor:'Account Manager A',notes:'Replacement for resigned supervisor.'},
  {id:'REQ-002',account:'URC',role:'Sales Promoter',location:'Manila',type:'New Headcount',count:5,priority:'Urgent',status:'Open',date:'2026-06-03',deadline:'2026-06-25',requestor:'Client Rep B',notes:'New branch opening in Makati.'},
  {id:'REQ-003',account:'HAIER',role:'Area Supervisor',location:'Pangasinan',type:'New Headcount',count:1,priority:'High',status:'Open',date:'2026-06-04',deadline:'2026-07-05',requestor:'Account Manager C',notes:'Expanding Pangasinan operations.'},
  {id:'REQ-004',account:'HISENSE',role:'Product Demonstrator',location:'Manila',type:'Augmentation',count:3,priority:'High',status:'Pending',date:'2026-06-05',deadline:'2026-07-15',requestor:'HR Head',notes:'Q3 promo season.'},
  {id:'REQ-005',account:'Cinderella',role:'Store Supervisor',location:'Manila',type:'Replacement',count:1,priority:'Urgent',status:'Open',date:'2026-06-06',deadline:'2026-06-20',requestor:'Client Rep D',notes:''},
  {id:'REQ-006',account:'UNCLE JOHNS',role:'In-Store Activator',location:'Manila',type:'New Headcount',count:2,priority:'Normal',status:'Pending',date:'2026-06-07',deadline:'2026-07-31',requestor:'Account Manager E',notes:''},
];

let currentAccount      = 'all';
let currentView         = 'dashboard';
let currentPipelineMode = 'list';
let searchQuery         = '';
let pendingStageChange  = null;
let currentViewedApplicantId = null;
let sidebarOpen         = true;
let activeJobClientTab  = 'all';
let activeProfileTab    = 'profile';

const aiScoreCache = {};

function generateAIScore(app) {
  if (aiScoreCache[app.id]) return aiScoreCache[app.id];
  const overall = Math.floor(Math.random() * 21) + 78;
  const keyword = Math.floor(Math.random() * 16) + 80;
  const exp      = Math.floor(Math.random() * 21) + 75;
  const culture  = Math.floor(Math.random() * 16) + 82;
  const result   = { overall, keyword, exp, culture };
  aiScoreCache[app.id] = result;
  return result;
}

function renderAIScore(app) {
  const score = generateAIScore(app);
  const numEl    = document.getElementById('ai-score-number');
  const barEl    = document.getElementById('ai-score-bar');
  const labelEl  = document.getElementById('ai-score-label');
  const kwEl     = document.getElementById('ai-tag-keyword');
  const expEl    = document.getElementById('ai-tag-exp');
  const cultEl   = document.getElementById('ai-tag-culture');
  if (!numEl) return;
  barEl.style.transition = 'none';
  barEl.style.width = '0%';
  const label = score.overall >= 90 ? 'Strong Match' : score.overall >= 85 ? 'Good Match' : 'Potential Match';
  labelEl.textContent = label;
  numEl.textContent = score.overall;
  kwEl.textContent  = score.keyword + '%';
  expEl.textContent  = score.exp + '%';
  cultEl.textContent = score.culture + '%';
  requestAnimationFrame(() => {
    setTimeout(() => {
      barEl.style.transition = 'width 1.1s cubic-bezier(.34,1.56,.64,1)';
      barEl.style.width = score.overall + '%';
    }, 80);
  });
}

function buildClientDropdown(){
  const list = document.getElementById('client-option-list');
  const opts = [{id:'all', label:'All Clients', color:'#64748b'}, ...ACCOUNTS];
  list.innerHTML = opts.map(a => `
    <div class="client-option ${currentAccount===a.id?'selected':''}" data-id="${a.id}" onclick="selectClient('${a.id}')">
      <span class="client-dot" style="background:${a.color||'#64748b'}"></span>
      <span>${a.label}</span>
      ${a.sub?`<span style="color:inherit;opacity:.6;font-size:10px;margin-left:auto">${a.sub}</span>`:''}
    </div>`).join('');
}
function filterClientOptions(q){
  document.querySelectorAll('.client-option').forEach(el=>{
    el.style.display = el.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}
function toggleClientDropdown(e){
  e.stopPropagation();
  const panel = document.getElementById('client-dropdown-panel');
  const isOpen = panel.classList.contains('open');
  panel.classList.toggle('open');
  if(!isOpen){
    document.getElementById('client-search-input').value = '';
    filterClientOptions('');
    setTimeout(()=>document.getElementById('client-search-input').focus(), 50);
  }
}
function selectClient(id){
  currentAccount = id;
  const acc = ACCOUNTS.find(a=>a.id===id);
  document.getElementById('client-trigger-label').textContent = id==='all'?'All Clients':(acc?.label||id);
  document.getElementById('client-dropdown-panel').classList.remove('open');
  buildClientDropdown();
  renderAll();
}
document.addEventListener('click', e=>{
  const wrap = document.getElementById('client-dropdown-wrap');
  if(wrap && !wrap.contains(e.target)) document.getElementById('client-dropdown-panel').classList.remove('open');
});

function getAllApplicants(){ return Object.values(accountData).flat(); }
function getApplicantsForAccount(acc){ return acc==='all'?getAllApplicants():accountData[acc]||[]; }
function getFilteredDataset(){
  const base = getApplicantsForAccount(currentAccount);
  base.forEach(a=>{ const n=normStage(a.stage); if(n!==a.stage) a.stage=n; });   // fold legacy interview stages
  const loc  = document.getElementById('filter-location').value;
  const role = document.getElementById('filter-role').value;
  const stg  = document.getElementById('filter-stage').value;
  const src  = (document.getElementById('filter-source')||{}).value||'all';
  // When we drilled in from a job card, scope to that exact posting so the
  // pipeline shows the same candidates the card counted. Without this the card
  // would say "12 Applications" and open a list holding a different number.
  const pj = window.cntPipelineJob;
  return base.filter(a=>{
    if(pj && pj.sid!=null){
      const belongs = a.job_id!=null ? String(a.job_id)===String(pj.sid)
                                     : (a.role===pj.role && a.location===pj.location);
      if(!belongs) return false;
    }
    const ml = loc==='all'||a.location===loc;
    const mr = role==='all'||a.role===role;
    const ms = stg==='all'||a.stage===stg;
    const mrc= src==='all'||(a.source||'')===src;
    if(!mrc) return false;
    const mq = searchQuery===''||a.name.toLowerCase().includes(searchQuery)||a.role.toLowerCase().includes(searchQuery)||(a.account||'').toLowerCase().includes(searchQuery);
    return ml&&mr&&ms&&mq;
  });
}
function findApplicant(id){ return getAllApplicants().find(a=>a.id===id); }
function updateApplicant(id,updates){ for(const acc of Object.keys(accountData)){const idx=accountData[acc].findIndex(a=>a.id===id);if(idx!==-1){Object.assign(accountData[acc][idx],updates);return;}} }
function removeApplicant(id){ for(const acc of Object.keys(accountData)){const idx=accountData[acc].findIndex(a=>a.id===id);if(idx!==-1){accountData[acc].splice(idx,1);return;}} }
function addApplicant(obj){ if(!accountData[obj.account])accountData[obj.account]=[];accountData[obj.account].push(obj); }

const PIPELINE_STAGES = [
  {key:'new',       label:'Initial Screening',short:'Screening',color:'#ef4444'},
  {key:'interview', label:'Interview',        short:'Interview',color:'#8b5cf6'},
  {key:'exam',      label:'Pre-Emp Exam',     short:'Exam',     color:'#06b6d4'},
  {key:'bgcheck',   label:'Background Check', short:'BGC',      color:'#6366f1'},
  {key:'hired',     label:'Job Offer',        short:'Offer',    color:'#10b981', is_hired:true},
  {key:'onboarding',label:'Onboarding',       short:'Onboard',  color:'#059669', is_hired:true},
];

// Kinds of interview captured inside the single Interview stage
const INTERVIEW_TYPES  = ['Phone Call','Video','Onsite / Face-to-Face Interview'];   // medium
const INTERVIEW_ROUNDS = ['Initial Interview','Second Interview','Client Interview','Final Interview'];   // stage

// Stages are configurable data (public.stages). These derive from PIPELINE_STAGES,
// which is rebuilt from the database at boot — so renaming/recolouring a stage in
// Settings flows everywhere without touching code.
const STAGE_SPECIALS = { pool:'Talent Pool', rejected:'Not Qualified' };
const STAGE_LEGACY   = { phone:'Interview', qualified:'Interview', scheduled:'Interview' };

function getStageName(s){
  const st=PIPELINE_STAGES.find(x=>x.key===s);
  if(st) return st.label;
  return STAGE_SPECIALS[s] || STAGE_LEGACY[s] || s;
}
// Badge colours are emitted as real CSS classes (see applyStageStyles) so every
// existing `class="badge border ${getStageBadge(...)}"` call site keeps working.
function stageKeyClass(s){ return 'stage-badge-'+String(s||'').replace(/[^a-z0-9_-]/gi,'-'); }
function getStageBadge(s){ return stageKeyClass(normStage(s)); }

function applyStageStyles(){
  let el=document.getElementById('cnt-stage-styles');
  if(!el){ el=document.createElement('style'); el.id='cnt-stage-styles'; document.head.appendChild(el); }
  const rule=(key,color)=>'.'+stageKeyClass(key)+'{background:'+color+'18;color:'+color+';border-color:'+color+'40;}';
  el.textContent = PIPELINE_STAGES.map(s=>rule(s.key,s.color)).join('\n')
    + '\n' + rule('pool','#b45309')
    + '\n' + rule('rejected','#64748b')
    + '\n.stage-badge-{background:#f8fafc;color:#64748b;border-color:#e2e8f0;}';
}

// Normalise any legacy stage value to a live one
function normStage(s){
  if(PIPELINE_STAGES.some(x=>x.key===s)) return s;
  if(STAGE_LEGACY[s]) return 'interview';
  return s;
}
// A stage counts as "hired" if flagged is_hired in Settings — works for renamed
// or custom offer stages. Falls back to the built-in keys before stages load.
function stageIsHired(key){
  const s=PIPELINE_STAGES.find(x=>x.key===key);
  if(s) return !!s.is_hired;
  return key==='hired'||key==='onboarding';
}

// ── Odoo-style applicant form: fill the label/value fields + stage stepper ──
function _escForm(v){ return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
// Known acronyms that keep their exact casing instead of being Title Cased,
// so "tesda"/"TESDA" → "TESDA" and "ms office" → "MS Office". Add to this list
// as new ones come up. Matched case-insensitively; the value is the canonical
// form that gets shown. (A shape rule can't do this safely — a word typed in
// caps like "SHIFT" is indistinguishable from an acronym — so it's a list.)
const _SKILL_ACRONYMS = (function(){
  const list = ['TESDA','PRC','CSR','BPO','FMCG','POS','SKU','KPI','OJT','HR','IT',
    'MS','NBI','SSS','TIN','DTI','LTO','PWD','NC','ID','CV','OSHA','QA','MC','II','III','IV'];
  const m = {};
  list.forEach(a => m[a.toLowerCase()] = a);
  return m;
})();
// Present expected skills uniformly so "bilingual", "BILINGUAL" and "Bilingual"
// all read the same. Everything is Title Cased except known acronyms (above);
// caps-lock input is otherwise normalised, not preserved. Hyphen/slash parts
// are cased too ("on-site" → "On-Site").
function _uniformSkill(s){
  return String(s||'').trim().split(/\s+/).map(word=>
    word.split(/([\-\/])/).map(part=>{
      if(!part || part==='-' || part==='/') return part;
      const ac=_SKILL_ACRONYMS[part.toLowerCase()];
      if(ac) return ac;
      return part.charAt(0).toUpperCase()+part.slice(1).toLowerCase();
    }).join('')
  ).join(' ');
}
// Normalise a comma-separated skills string: trim, uniform-case, drop blanks,
// and collapse case-insensitive duplicates ("Driver" + "driver" → one).
function _uniformSkills(str){
  const seen=new Set(), out=[];
  String(str||'').split(',').map(x=>_uniformSkill(x)).forEach(v=>{
    if(!v) return; const k=v.toLowerCase();
    if(!seen.has(k)){ seen.add(k); out.push(v); }
  });
  return out;
}
function cntRenderApplicantForm(app){
  if(!app) return;
  const set=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=(v==null||v==='')?'—':v; };
  const title=document.getElementById('resume-title');
  if(title) title.textContent=(app.name||'—')+(app.role?(' – '+app.role):'');
  set('resume-interviewer-val', app.interviewInterviewer);
  set('resume-recruiter-val',   app.recruiter);
  set('resume-degree-val',      app.degree);
  set('resume-source-val',      app.source);
  // Referral details only mean something when there is a referrer; the row
  // stays out of the way otherwise.
  { const row=document.getElementById('resume-referral-row'), val=document.getElementById('resume-referral-val');
    if(row&&val){
      const who=(app.referred_by||'').trim(), rel=(app.referral_relation||'').trim();
      row.style.display=who?'':'none';
      val.textContent=who?(who+(rel?' · '+rel:'')):'—';
    } }
  set('resume-medium-val',      app.medium);
  set('resume-availability-val',app.availability);
  set('resume-referred-val',    app.referred_by);
  set('resume-appliedjob-val',  app.role);
  set('resume-department-val',  app.account);
  set('resume-expected-val',    app.salary);
  set('resume-proposed-val',    app.proposed_salary);
  const li=document.getElementById('resume-linkedin-val');
  if(li) li.innerHTML = app.linkedin ? '<a href="'+_escForm(app.linkedin)+'" target="_blank" rel="noopener" class="text-sky-700 hover:underline">'+_escForm(app.linkedin)+'</a>' : '—';
  const tg=document.getElementById('resume-tags-val');
  if(tg){ const t=_uniformSkills(app.tags);
    tg.innerHTML = t.length ? t.map(x=>'<span class="badge" style="background:#fce7f3;color:#9d174d;margin-right:3px;">'+_escForm(x)+'</span>').join('') : '—'; }
  // Résumé detail blocks — only shown when there's something to show
  const block=(wrapId,valId,val)=>{
    const w=document.getElementById(wrapId), v=document.getElementById(valId);
    if(!w||!v) return false;
    const has=!!(val&&String(val).trim());
    if(has){ v.textContent=val; w.classList.remove('hidden'); } else { v.textContent=''; w.classList.add('hidden'); }
    return has;
  };
  const anyDetail=[
    block('cnt-rd-experience','cnt-rd-experience-val',app.work_experience),
    block('cnt-rd-education','cnt-rd-education-val',app.education),
    block('cnt-rd-certifications','cnt-rd-certifications-val',app.certifications),
    block('cnt-rd-seminars','cnt-rd-seminars-val',app.seminars),
    block('cnt-rd-awards','cnt-rd-awards-val',app.awards),
    block('cnt-rd-languages','cnt-rd-languages-val',app.languages),
    block('cnt-rd-char-references','cnt-rd-char-references-val',app.char_references)
  ].some(Boolean);
  const rd=document.getElementById('cnt-resume-details');
  if(rd) rd.classList.toggle('hidden', !anyDetail);
  cntRenderStageStepper(app);
}
function cntRenderStageStepper(app){
  const el=document.getElementById('resume-stage-stepper'); if(!el) return;
  const idx=PIPELINE_STAGES.findIndex(s=>s.key===app.stage);
  if(idx<0 && (app.stage==='rejected'||app.stage==='pool')){
    el.innerHTML='<span class="s active">'+_escForm(getStageName(app.stage))+'</span>';
    return;
  }
  el.innerHTML=PIPELINE_STAGES.map((s,i)=>{
    const cls = i===idx ? 's active' : (idx>=0 && i<idx ? 's done' : 's');
    return (i>0?'<span class="sep">›</span>':'')
      +'<span class="'+cls+'" onclick="updateApplicantStageFromModal(\''+_escForm(s.key)+'\')">'+_escForm(s.short||s.label)+'</span>';
  }).join('');
}

function getCountdownChip(deadlineStr){
  if(!deadlineStr) return '<span class="text-slate-400 text-[10px]">No deadline</span>';
  const today = new Date(); today.setHours(0,0,0,0);
  const dl = new Date(deadlineStr); dl.setHours(0,0,0,0);
  const diff = Math.round((dl - today) / (1000*60*60*24));
  let cls, icon, txt;
  if(diff < 0){ cls='overdue'; icon='warning'; txt=`Overdue ${Math.abs(diff)}d`; }
  else if(diff <= 3){ cls='urgent'; icon='alarm'; txt=`${diff}d left`; }
  else if(diff <= 7){ cls='warning'; icon='schedule'; txt=`${diff}d left`; }
  else { cls='ok'; icon='event'; txt=`${diff}d left`; }
  return `<span class="countdown-chip ${cls}"><span class="material-icons-outlined" style="font-size:12px;">${icon}</span>${txt}</span>`;
}

const VIEWS=['dashboard','request','applications','job','talent-pool','interviews','onboarding','reports','settings'];
function switchView(v){
  currentView=v;
  VIEWS.forEach(name=>{
    const el=document.getElementById('view-'+name);
    const nav=document.getElementById('nav-'+name);
    if(el)el.classList.add('hidden');
    if(nav)nav.className='sidenav-item';
  });
  const cur=document.getElementById('view-'+v);
  const curNav=document.getElementById('nav-'+v);
  if(cur)cur.classList.remove('hidden');
  if(curNav)curNav.className='sidenav-item active';
  // On phones the sidebar overlays content — close it after picking a view.
  if(window.innerWidth<=768 && sidebarOpen) toggleSidebar();
  renderAll();
}

function toggleApplicationView(mode){
  currentPipelineMode = mode;
  const list     = document.getElementById('applications-list-container');
  const kanban   = document.getElementById('applications-kanban-container');
  const analytics= document.getElementById('applications-analytics-container');
  const btnL     = document.getElementById('btn-view-list');
  const btnK     = document.getElementById('btn-view-kanban');
  const btnA     = document.getElementById('btn-view-analytics');
  const activeClass   = 'px-3 py-1.5 bg-white shadow-sm text-red-800 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer';
  const inactiveClass = 'px-3 py-1.5 text-slate-500 hover:text-slate-800 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer';
  list.classList.add('hidden');
  kanban.classList.add('hidden');
  analytics.classList.add('hidden');
  btnL.className = inactiveClass;
  btnK.className = inactiveClass;
  btnA.className = inactiveClass;
  if(mode === 'list'){ list.classList.remove('hidden'); btnL.className = activeClass; }
  else if(mode === 'kanban'){ kanban.classList.remove('hidden'); btnK.className = activeClass; }
  else if(mode === 'analytics'){ analytics.classList.remove('hidden'); btnA.className = activeClass; }
  renderAll();
}

function handleGlobalSearch(val){ searchQuery=val.trim().toLowerCase(); renderAll(); }

function requestStageChange(id,targetStage,onSuccess,onCancel){
  targetStage=normStage(targetStage);
  if(targetStage==='interview'){
    pendingStageChange={id,targetStage,onSuccess,onCancel};
    openInterviewModal(id,'Interview');
  }else{
    executeStageChange(id,targetStage);
    if(onSuccess)onSuccess();
  }
}
function executeStageChange(id,targetStage){
  const app=findApplicant(id);
  if(app){updateApplicant(id,{stage:targetStage});showToast(`${app.name} → ${getStageName(targetStage)}`,'success');renderAll();}
}

function renderAll(){
  buildClientDropdown();
  const filtered=getFilteredDataset();
  const pipeline=filtered.filter(a=>a.stage!=='pool'&&a.stage!=='rejected');
  const pool=filtered.filter(a=>a.stage==='pool');
  const onboarding=filtered.filter(a=>a.stage==='onboarding');
  const counts={};
  PIPELINE_STAGES.forEach(s=>{counts[s.key]=0;});
  pipeline.forEach(a=>{if(counts[a.stage]!==undefined)counts[a.stage]++;});
  const setNavBadge=(id,n)=>{const el=document.getElementById(id);if(!el)return;if(n>0){el.textContent=n;el.style.display='';}else{el.style.display='none';}};
  setNavBadge('nav-badge-apps', pipeline.length);
  setNavBadge('nav-badge-pool', pool.length);
  setNavBadge('nav-badge-onboard', onboarding.length);
  setNavBadge('nav-badge-req', (typeof hiringRequests!=='undefined')?hiringRequests.filter(r=>r.status==='Open'||r.status==='Pending').length:0);
  const intCount=(counts.interview||0)+(counts.phone||0)+(counts.qualified||0)+(counts.scheduled||0);
  const examCount=(counts.exam||0)+(counts.bgcheck||0);
  const setStat=(id,v)=>{const el=document.getElementById(id); if(el) el.textContent=v;};
  setStat('stat-new',counts.new||0);
  setStat('stat-interview',intCount);
  setStat('stat-exam',examCount);
  setStat('stat-hired',(counts.hired||0)+(counts.onboarding||0));
  const dashTitle=document.getElementById('dash-title');
  const dashSub=document.getElementById('dash-subtitle');
  if(dashTitle){
    const acc=ACCOUNTS.find(a=>a.id===currentAccount);
    dashTitle.textContent=acc?`${acc.label} — ${acc.sub}`:'All Client Accounts';
    dashSub.textContent=acc?`Pipeline for ${acc.label} · ${acc.region}`:'CNT Recruitment Pipeline · Real-time';
  }
  const dateEl=document.getElementById('dash-date');
  if(dateEl)dateEl.textContent=new Date().toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'});
  renderFunnel(counts);
  renderDashboardJobsTable(pipeline);
  renderDashboardInterviews(filtered);
  renderPendingRequestsMini();
  renderAccountHealthGrid();
  renderStageProgressBar(counts);
  renderApplicationsTable(pipeline);
  renderKanban(pipeline);
  renderAnalyticsDashboard(pipeline, filtered);
  renderJobPositions();
  renderTalentPool(pool);
  renderInterviewsGrid(filtered);
  renderInterviewsCalendar(filtered);
  window._intvFiltered=filtered;   // so month nav / view toggle can re-render
  renderOnboarding(onboarding);
  renderReports();
  renderHiringRequests();
}

function renderFunnel(counts){
  const el=document.getElementById('funnel-container');
  if(!el)return;
  const total=Math.max(1,Object.values(counts).reduce((a,b)=>a+b,0));
  el.innerHTML=PIPELINE_STAGES.map(s=>{
    const n=counts[s.key]||0;
    const pct=Math.round((n/total)*100);
    const w=n>0?Math.max(pct,6):0;
    return `<div class="flex items-center gap-3 mb-2.5 cursor-pointer group" onclick="cntOpenPipelineList('${s.key}')" title="View ${s.label} in list">
      <div class="text-[10px] font-bold text-slate-500 group-hover:text-red-700 uppercase tracking-wider w-24 shrink-0 transition">${s.short}</div>
      <div class="flex-1 h-6 bg-slate-100 rounded-md overflow-hidden">
        <div class="funnel-bar animate-bar flex items-center justify-start" style="width:${w}%;background:${s.color};min-width:${n?'28px':'0'}">
          ${n>0?`<span class="text-white text-[10px] font-bold pl-2">${n}</span>`:''}
        </div>
      </div>
      <div class="text-[11px] font-bold text-slate-700 w-8 text-right shrink-0">${pct}%</div>
    </div>`;
  }).join('');
}

function renderDashboardJobsTable(pipeline){
  const jt=document.getElementById('dashboard-jobs-table');
  if(!jt)return;
  const jobsMap={};
  pipeline.forEach(a=>{const k=`${a.role}|${a.account}|${a.location}`;if(!jobsMap[k])jobsMap[k]={role:a.role,account:a.account,location:a.location,count:0};jobsMap[k].count++;});
  const rows=Object.values(jobsMap).sort((a,b)=>b.count-a.count);
  if(!rows.length){jt.innerHTML=`<tr><td colspan="4" class="py-4 text-center text-slate-400 text-xs">No active jobs match filters</td></tr>`;return;}
  jt.innerHTML=rows.slice(0,8).map(j=>{
    const acc=ACCOUNTS.find(a=>a.id===j.account);
    return `<tr class="hover:bg-slate-50 cursor-pointer" onclick="quickJump('${j.role}','${j.location}','${j.account}')">
      <td class="py-2 px-1 font-semibold text-slate-800 text-xs">${j.role}</td>
      <td class="py-2 px-1"><span class="badge" style="background:${acc?.color||'#64748b'}20;color:${acc?.color||'#64748b'};border-color:${acc?.color||'#64748b'}40;">${j.account}</span></td>
      <td class="py-2 px-1 text-slate-400 text-xs">${j.location}</td>
      <td class="py-2 px-1 text-center font-bold text-red-700 text-xs">${j.count}</td>
    </tr>`;
  }).join('');
}

function renderDashboardInterviews(filtered){
  const interviews=filtered.filter(a=>a.stage==='interview'&&a.interviewDate).sort((a,b)=>(a.interviewDate+a.interviewTime)>(b.interviewDate+b.interviewTime)?1:-1);
  const dic=document.getElementById('dashboard-interview-count');if(dic)dic.textContent=interviews.length;
  const dil=document.getElementById('dashboard-interview-list');
  if(!dil)return;
  if(!interviews.length){dil.innerHTML=`<p class="text-xs text-slate-400 text-center py-3">No upcoming interviews</p>`;return;}
  dil.innerHTML=interviews.slice(0,4).map(app=>`
    <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-red-200 transition group" onclick="triggerResumeModal('${app.id}')">
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-xs font-bold text-slate-900 group-hover:text-red-800 transition truncate">${app.name}</span>
        <span class="badge ${getStageBadge(app.stage)}">${getStageName(app.stage)}</span>
      </div>
      <div class="flex items-center gap-2">
        <div onclick="event.stopPropagation();openInterviewModal('${app.id}')" title="Open interview details" class="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-col items-center min-w-[38px] cursor-pointer hover:border-red-300">
          <span class="text-[8px] uppercase font-bold text-slate-400">${fmtMonth(app.interviewDate)}</span>
          <span class="text-sm font-black text-slate-700">${fmtDay(app.interviewDate)}</span>
        </div>
        <div onclick="event.stopPropagation();openInterviewModal('${app.id}')" title="Open interview details" class="cursor-pointer"><p class="text-[11px] font-semibold text-red-700">${fmtTime(app.interviewTime)}</p><p class="text-[10px] text-slate-400">${app.role} · ${app.account}</p></div>
      </div>
    </div>`).join('');
}

function renderPendingRequestsMini(){
  const el=document.getElementById('pending-requests-mini');
  if(!el)return;
  const pending=hiringRequests.filter(r=>r.status==='Open'||r.status==='Pending').slice(0,4);
  if(!pending.length){el.innerHTML=`<p class="text-xs text-slate-400 text-center py-2">No pending requests</p>`;return;}
  el.innerHTML=pending.map(r=>{
    const pColor=r.priority==='Urgent'?'bg-red-50 text-red-700':r.priority==='High'?'bg-amber-50 text-amber-700':'bg-slate-100 text-slate-500';
    return `<div class="flex items-center justify-between gap-2 py-1.5">
      <div class="flex-1 min-w-0"><p class="text-xs font-bold text-slate-800 truncate">${r.role}</p><p class="text-[10px] text-slate-400">${r.account} · ${r.location}</p></div>
      <div class="flex items-center gap-1.5 flex-shrink-0">${getCountdownChip(r.deadline)}<span class="badge ${pColor}">${r.priority}</span></div>
    </div>`;
  }).join('');
}

function renderAccountHealthGrid(){
  const ahg=document.getElementById('account-health-grid');
  if(!ahg)return;
  ahg.innerHTML=ACCOUNTS.map(acc=>{
    const all=accountData[acc.id]||[];
    const act=all.filter(a=>a.stage!=='pool'&&a.stage!=='rejected');
    const hired=all.filter(a=>stageIsHired(a.stage)).length;
    const total=act.length;
    const pct=total?Math.round((hired/total)*100):0;
    const totalJobs=(jobDatabase[acc.id]||[]).reduce((s,j)=>s+j.needed,0);
    const health=pct>50?'emerald':total>0&&pct<20?'red':'amber';
    return `<div class="border border-slate-200 rounded-xl p-3 cursor-pointer hover:border-slate-300 transition hover:shadow-sm group" onclick="selectClient('${acc.id}')">
      <div class="flex items-center gap-1.5 mb-2"><span class="w-2 h-2 rounded-full flex-shrink-0" style="background:${acc.color}"></span><span class="text-xs font-bold text-slate-800 group-hover:text-red-800 transition">${acc.label}</span><span class="ml-auto w-2 h-2 rounded-full bg-${health}-400 flex-shrink-0"></span></div>
      <div class="text-2xl font-extrabold text-slate-900 mb-0.5">${total}</div>
      <div class="text-[10px] text-slate-400 mb-2">in pipeline · target ${totalJobs}</div>
      <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="h-full rounded-full animate-bar" style="width:${pct}%;background:${acc.color}"></div></div>
      <div class="text-[10px] text-slate-400 mt-1">${hired} offer / onboarding</div>
    </div>`;
  }).join('');
}

function renderStageProgressBar(counts){
  const el=document.getElementById('stage-progress-bar');
  if(!el)return;
  el.innerHTML=PIPELINE_STAGES.map((s,i)=>`
    <div class="step-bar-item cursor-pointer group" onclick="quickJumpStage('${s.key}')">
      <div class="flex items-center w-full">
        ${i>0?`<div class="step-line flex-1" style="background:${counts[s.key]>0?s.color:'#e2e8f0'}"></div>`:''}
        <div class="step-circle group-hover:scale-110 transition" style="border-color:${s.color};background:${counts[s.key]>0?s.color:'white'}">
          <span style="color:${counts[s.key]>0?'white':s.color};" class="text-[11px] font-bold">${counts[s.key]||0}</span>
        </div>
        ${i<PIPELINE_STAGES.length-1?`<div class="step-line flex-1" style="background:${counts[s.key]>0?s.color:'#e2e8f0'}"></div>`:''}
      </div>
      <div class="text-[9px] text-slate-500 font-semibold text-center mt-1 whitespace-nowrap">${s.short}</div>
    </div>`).join('');
}

function renderApplicationsTable(pipeline){
  const tb=document.getElementById('applications-table-body');
  if(!tb)return;
  if(!pipeline.length){tb.innerHTML=`<tr><td colspan="9" class="px-4 py-8 text-center text-slate-400 text-sm">No applicants match current filters</td></tr>`;return;}
  tb.innerHTML=pipeline.map(a=>{
    const acc=ACCOUNTS.find(ac=>ac.id===a.account);
    return `<tr>
      <td class="px-4 py-2.5 font-semibold text-slate-900 text-xs cursor-pointer hover:text-red-800" onclick="triggerResumeModal('${a.id}')">${a.name}</td>
      <td class="px-4 py-2.5 text-slate-600 text-xs">${a.role}</td>
      <td class="px-4 py-2.5"><span class="badge" style="background:${acc?.color||'#64748b'}18;color:${acc?.color||'#64748b'};border-color:${acc?.color||'#64748b'}30;">${a.account}</span></td>
      <td class="px-4 py-2.5 text-xs text-slate-400">${a.location}</td>
      <td class="px-4 py-2.5"><span class="badge border ${getStageBadge(a.stage)}">${getStageName(a.stage)}</span>${a.client_status==='approved'?'<span class="badge ml-1" style="background:#dcfce7;color:#166534;border:1px solid #bbf7d0;">Client ✓</span>':a.client_status==='rejected'?'<span class="badge ml-1" style="background:#fee2e2;color:#b91c1c;border:1px solid #fecaca;">Client ✗</span>':a.client_status==='endorsed'?'<span class="badge ml-1" style="background:#fef3c7;color:#b45309;border:1px solid #fde68a;">Endorsed</span>':''}${a.deployed_at?'<span class="badge ml-1" style="background:#e0e7ff;color:#4338ca;border:1px solid #c7d2fe;">Deployed</span>':''}</td>
      <td class="px-4 py-2.5 text-xs text-slate-400">${a.source||'—'}</td>
      <td class="px-4 py-2.5 text-xs text-slate-400">${a.appliedDate||'—'}</td>
      <td class="px-4 py-2.5 text-xs text-slate-400 font-mono">${a.phone}</td>
      <td class="px-4 py-2.5 text-right">
        <button onclick="triggerResumeModal('${a.id}')" class="text-red-700 hover:text-red-900 text-[11px] font-bold cursor-pointer mr-2">View</button>
        <button onclick="openEditModal('${a.id}')" class="text-slate-500 hover:text-slate-800 text-[11px] font-medium cursor-pointer mr-2">Edit</button>
        <button onclick="openInterviewModal('${a.id}')" class="text-indigo-600 hover:text-indigo-800 text-[11px] font-medium cursor-pointer mr-2">Schedule</button>
        <button onclick="deleteApplicant('${a.id}')" class="text-slate-400 hover:text-red-500 text-[11px] font-medium cursor-pointer">Remove</button>
      </td>
    </tr>`;
  }).join('');
}

function kanbanCardHtml(a, refused){
  const accColor=(ACCOUNTS.find(ac=>ac.id===a.account)?.color||'#64748b');
  const dotMap={normal:['#cbd5e1','In progress'],ready:['#10b981','Ready for next stage'],blocked:['#ef4444','Blocked']};
  const dot=dotMap[a.kanban_state||'normal']||dotMap.normal;
  const initials=(a.account||'?').slice(0,2).toUpperCase();
  const stars=[1,2,3].map(n=>`<span onclick="event.stopPropagation();cntSetPriority('${a.id}',${(a.priority||0)===n?0:n})" title="${['','Good','Very Good','Excellent'][n]}" class="cursor-pointer material-icons-outlined" style="font-size:15px;color:${(a.priority||0)>=n?'#f59e0b':'#e2e8f0'};">star</span>`).join('');
  if(refused){
    return `<div class="kanban-card" style="opacity:.72;cursor:pointer;border-left:3px solid #cbd5e1;" onclick="triggerResumeModal('${a.id}')">
      <p class="font-bold text-slate-600 text-[13px] leading-tight line-through truncate mb-0.5">${a.name}</p>
      <p class="text-[11px] text-slate-400 mb-1.5 truncate">${a.role} · ${a.account}</p>
      ${a.refuse_reason?`<div class="text-[10px] bg-slate-100 text-slate-500 rounded-md px-2 py-1 mb-2"><span class="font-semibold">Refused:</span> ${a.refuse_reason}</div>`:''}
      <div class="flex justify-end pt-1.5 border-t border-slate-100"><button onclick="event.stopPropagation();cntReopen('${a.id}')" class="text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1"><span class="material-icons-outlined" style="font-size:13px;">restart_alt</span>Reopen</button></div>
    </div>`;
  }
  return `<div class="kanban-card" draggable="true" ondragstart="drag(event,'${a.id}')" onclick="triggerResumeModal('${a.id}')" style="border-left:3px solid ${accColor};">
    <div class="flex items-start justify-between gap-1 mb-0.5">
      <p class="font-bold text-slate-900 text-[13px] leading-tight truncate">${a.name}</p>
      <span class="kmenu flex gap-1 flex-shrink-0">
        <button onclick="event.stopPropagation();openEditModal('${a.id}')" title="Edit" class="text-slate-300 hover:text-slate-600 cursor-pointer leading-none"><span class="material-icons-outlined" style="font-size:14px;">edit</span></button>
        <button onclick="event.stopPropagation();cntOpenRefuse('${a.id}')" title="Refuse" class="text-slate-300 hover:text-red-600 cursor-pointer leading-none"><span class="material-icons-outlined" style="font-size:14px;">block</span></button>
      </span>
    </div>
    <p class="text-[11px] text-slate-500 mb-1.5 truncate">${a.role}</p>
    <div class="flex items-center gap-1 flex-wrap mb-2">
      <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style="background:${accColor}18;color:${accColor}">${a.account}</span>
      <span class="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">${a.location}</span>
    </div>
    ${(a.stage==='interview'&&(a.interviewType||a.interviewRound))?`<div onclick="event.stopPropagation();openInterviewModal('${a.id}')" title="Open interview details" class="text-[9px] bg-violet-50 text-violet-700 rounded px-1.5 py-0.5 mb-1.5 font-bold inline-flex items-center gap-1 cursor-pointer hover:bg-violet-100"><span class="material-icons-outlined" style="font-size:10px;">forum</span>${a.interviewRound?a.interviewRound.replace(' Interview',''):''}${(a.interviewRound&&a.interviewType)?' · ':''}${a.interviewType||''}</div>`:''}
    ${a.interviewDate?`<div onclick="event.stopPropagation();openInterviewModal('${a.id}')" title="Open interview details" class="text-[10px] bg-indigo-50 text-indigo-700 rounded-md px-1.5 py-0.5 mb-2 font-semibold inline-flex items-center gap-1 cursor-pointer hover:bg-indigo-100"><span class="material-icons-outlined" style="font-size:11px;">event</span>${fmtMonth(a.interviewDate)} ${fmtDay(a.interviewDate)} ${fmtTime(a.interviewTime)}</div>`:''}
    <div class="flex items-center justify-between pt-2 border-t border-slate-100">
      <span onclick="cntStatusMenu(event,'${a.id}')" title="${dot[1]} — click to change" class="cursor-pointer flex items-center flex-shrink-0" style="position:relative;"><span style="width:10px;height:10px;border-radius:50%;background:${dot[0]};display:inline-block;box-shadow:0 0 0 3px ${dot[0]}22;"></span></span>
      <div class="flex items-center gap-1.5">
        <span class="flex items-center">${stars}</span>
        <span class="flex items-center justify-center flex-shrink-0" title="${a.account}" style="width:20px;height:20px;border-radius:50%;background:${accColor};color:#fff;font-size:8px;font-weight:700;">${initials}</span>
      </div>
    </div>
  </div>`;
}
// Stages the user has clicked open this session (folded stages expand on click)
const _unfolded=new Set();
function cntUnfoldStage(key){ _unfolded.add(key); renderKanban(getFilteredDataset().filter(a=>a.stage!=='pool'&&a.stage!=='rejected')); }

function renderKanban(pipeline){
  const kc=document.getElementById('applications-kanban-container');
  if(!kc||kc.classList.contains('hidden'))return;
  const refused=getFilteredDataset().filter(a=>a.stage==='rejected');
  kc.innerHTML=PIPELINE_STAGES.map(s=>{
    // Odoo's status bar: green = ready, red = blocked, grey = in progress
    const items=pipeline.filter(a=>a.stage===s.key);
    const ready  =items.filter(a=>a.kanban_state==='ready').length;
    const blocked=items.filter(a=>a.kanban_state==='blocked').length;
    const normal =items.length-ready-blocked;
    const bar = items.length
      ? `<div style="display:flex;height:4px;border-radius:99px;overflow:hidden;margin:0 4px 10px;">
           ${ready  ?`<div style="flex:${ready};background:#16a34a;"   title="${ready} ready for next stage"></div>`:''}
           ${normal ?`<div style="flex:${normal};background:#cbd5e1;"  title="${normal} in progress"></div>`:''}
           ${blocked?`<div style="flex:${blocked};background:#dc2626;" title="${blocked} blocked"></div>`:''}
         </div>`
      : `<div style="height:4px;border-radius:99px;background:#f1f5f9;margin:0 4px 10px;"></div>`;
    // Folded stages collapse to a thin bar (Odoo folds e.g. Contract Signed).
    // Click to expand; still a valid drop target while folded.
    if(s.folded && !_unfolded.has(s.key)){
      return `
      <div class="kanban-col" id="kcol-${s.key}" style="min-width:44px;max-width:44px;background:#eef2f6;cursor:pointer;padding:12px 6px;"
           onclick="cntUnfoldStage('${s.key}')" title="${s.label} — click to expand"
           ondragover="allowDrop(event)" ondrop="drop(event,'${s.key}')">
        <div class="flex flex-col items-center gap-2">
          <span class="bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold" id="kcount-${s.key}">0</span>
          <span class="w-2 h-2 rounded-full" style="background:${s.color}"></span>
          <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider" style="writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap;">${s.short}</span>
        </div>
        <div id="col-${s.key}" style="display:none;"></div>
      </div>`;
    }
    return `
    <div class="kanban-col" id="kcol-${s.key}">
      <div class="flex items-center justify-between mb-2 px-1">
        <div><div class="w-2 h-2 rounded-full inline-block mr-1.5" style="background:${s.color}"></div><span class="text-[11px] font-bold text-slate-700 uppercase tracking-wider">${s.short}</span></div>
        <span class="bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold" id="kcount-${s.key}">0</span>
      </div>
      ${bar}
      <div id="col-${s.key}" class="space-y-2 min-h-[360px]" ondragover="allowDrop(event)" ondrop="drop(event,'${s.key}')"></div>
    </div>`;}).join('')
    +`<div class="kanban-col" id="kcol-rejected" style="background:#f1f5f9;">
        <div class="flex items-center justify-between mb-3 px-1">
          <div><div class="w-2 h-2 rounded-full inline-block mr-1.5" style="background:#94a3b8"></div><span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Refused</span></div>
          <span class="bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full text-[10px] font-bold" id="kcount-rejected">0</span>
        </div>
        <div id="col-rejected" class="space-y-2 min-h-[360px]" ondragover="allowDrop(event)" ondrop="cntDropRefuse(event)"></div>
      </div>`;
  PIPELINE_STAGES.forEach(s=>{
    const cont=document.getElementById('col-'+s.key);
    const countEl=document.getElementById('kcount-'+s.key);
    const items=pipeline.filter(a=>a.stage===s.key);
    if(countEl)countEl.textContent=items.length;
    if(cont)cont.innerHTML=items.map(a=>kanbanCardHtml(a,false)).join('');
  });
  const rc=document.getElementById('col-rejected'), rcount=document.getElementById('kcount-rejected');
  if(rcount)rcount.textContent=refused.length;
  if(rc)rc.innerHTML=refused.map(a=>kanbanCardHtml(a,true)).join('')||'<p class="text-[10px] text-slate-400 text-center py-6">No refused candidates</p>';
}

function renderAnalyticsDashboard(pipeline, filtered) {
  const anlContainer = document.getElementById('applications-analytics-container');
  if (!anlContainer || anlContainer.classList.contains('hidden')) return;
  const postingsCount = Object.values(
    currentAccount === 'all' ? jobDatabase : { [currentAccount]: jobDatabase[currentAccount] || [] }
  ).reduce((sum, arr) => sum + arr.length, 0);
  const anlPostings = document.getElementById('anl-postings');
  if(anlPostings) anlPostings.textContent = postingsCount;
  const anlTotal = document.getElementById('anl-total');
  if(anlTotal) anlTotal.textContent = pipeline.length;
  const counts = {};
  PIPELINE_STAGES.forEach(s => { counts[s.key] = 0; });
  pipeline.forEach(a => { if (counts[a.stage] !== undefined) counts[a.stage]++; });
  const total = Math.max(1, pipeline.length);
  const anlFunnel = document.getElementById('anl-funnel-container');
  if (anlFunnel) {
    anlFunnel.innerHTML = PIPELINE_STAGES.map(s => {
      const n = counts[s.key] || 0;
      const pct = Math.round((n / total) * 100);
      const w = n > 0 ? Math.max(pct, 5) : 0;
      return `<div class="flex items-center gap-3 mb-3">
        <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24 shrink-0">${s.short}</div>
        <div class="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden relative">
          <div class="funnel-bar animate-bar h-full" style="width:${w}%;background:${s.color};">
            ${n > 0 ? `<span class="text-white text-[10px] font-bold pl-2 leading-7">${n}</span>` : ''}
          </div>
        </div>
        <div class="text-[11px] font-bold text-slate-700 w-10 text-right shrink-0">${pct}%</div>
      </div>`;
    }).join('');
  }
  const screenCount = counts['new'] || 0;
  const intCount    = (counts['interview'] || 0) + (counts['qualified'] || 0) + (counts['scheduled'] || 0) + (counts['phone'] || 0);
  const offerCount  = counts['hired'] || 0;
  const onboardCount= counts['onboarding'] || 0;
  const s2i = screenCount > 0 ? Math.round((intCount / (screenCount + intCount)) * 100) + '%' : '—';
  const i2o = intCount   > 0 ? Math.round((offerCount / Math.max(1, intCount + offerCount)) * 100) + '%' : '—';
  const o2h = offerCount > 0 ? Math.round((onboardCount / Math.max(1, offerCount + onboardCount)) * 100) + '%' : '—';
  const s2iEl = document.getElementById('anl-screen-to-int'); if(s2iEl) s2iEl.textContent = s2i;
  const i2oEl = document.getElementById('anl-int-to-offer');  if(i2oEl) i2oEl.textContent = i2o;
  const o2hEl = document.getElementById('anl-offer-to-hire');  if(o2hEl) o2hEl.textContent = o2h;
  const srcMap = {};
  pipeline.forEach(a => { const s = a.source || 'Unknown'; srcMap[s] = (srcMap[s] || 0) + 1; });
  const srcTotal = Math.max(1, pipeline.length);
  const anlSrc = document.getElementById('anl-source-breakdown');
  if (anlSrc) {
    const sorted = Object.entries(srcMap).sort((a, b) => b[1] - a[1]);
    anlSrc.innerHTML = sorted.length ? sorted.map(([src, cnt]) => {
      const pct = Math.round((cnt / srcTotal) * 100);
      return `<div class="analytics-bar-row">
        <span class="text-[11px] text-slate-600 w-20 font-semibold truncate">${src}</span>
        <div class="analytics-bar-track flex-1"><div class="analytics-bar-fill" style="width:${pct}%;background:#7f1d1d;"></div></div>
        <span class="text-[11px] font-bold text-slate-700 w-6 text-right">${cnt}</span>
      </div>`;
    }).join('') : '<p class="text-xs text-slate-400 text-center py-2">No data</p>';
  }
  const locMap = {};
  pipeline.forEach(a => { const l = a.location || 'Unknown'; locMap[l] = (locMap[l] || 0) + 1; });
  const locTotal = Math.max(1, pipeline.length);
  const anlLoc = document.getElementById('anl-location-breakdown');
  if (anlLoc) {
    const sorted = Object.entries(locMap).sort((a, b) => b[1] - a[1]);
    anlLoc.innerHTML = sorted.length ? sorted.map(([loc, cnt]) => {
      const pct = Math.round((cnt / locTotal) * 100);
      return `<div class="analytics-bar-row">
        <span class="text-[11px] text-slate-600 w-20 font-semibold truncate">${loc}</span>
        <div class="analytics-bar-track flex-1"><div class="analytics-bar-fill" style="width:${pct}%;background:#4f46e5;"></div></div>
        <span class="text-[11px] font-bold text-slate-700 w-6 text-right">${cnt}</span>
      </div>`;
    }).join('') : '<p class="text-xs text-slate-400 text-center py-2">No data</p>';
  }
  const anlClientTable = document.getElementById('anl-client-table');
  if (anlClientTable) {
    const clientsToShow = currentAccount === 'all' ? ACCOUNTS : ACCOUNTS.filter(a => a.id === currentAccount);
    anlClientTable.innerHTML = clientsToShow.map(acc => {
      const all       = accountData[acc.id] || [];
      const act       = all.filter(a => a.stage !== 'pool' && a.stage !== 'rejected');
      const intv      = act.filter(a => a.stage==='interview').length;
      const offr      = act.filter(a => a.stage === 'hired').length;
      const pooled    = all.filter(a => a.stage === 'pool').length;
      const target    = (jobDatabase[acc.id] || []).reduce((s, j) => s + j.needed, 0);
      const fillPct   = target > 0 ? Math.min(100, Math.round((act.length / target) * 100)) : 0;
      const fillColor = fillPct >= 80 ? '#10b981' : fillPct >= 50 ? '#f59e0b' : '#ef4444';
      return `<tr class="hover:bg-slate-50 cursor-pointer" onclick="selectClient('${acc.id}')">
        <td class="px-4 py-2.5 font-bold text-slate-800">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full flex-shrink-0" style="background:${acc.color}"></span>${acc.label}
          </div>
        </td>
        <td class="px-4 py-2.5 text-center font-bold text-slate-700">${act.length}</td>
        <td class="px-4 py-2.5 text-center font-bold text-indigo-700">${intv}</td>
        <td class="px-4 py-2.5 text-center font-bold text-emerald-700">${offr}</td>
        <td class="px-4 py-2.5 text-center font-bold text-amber-600">${pooled}</td>
        <td class="px-4 py-2.5">
          <div class="flex items-center gap-2">
            <div class="analytics-bar-track flex-1"><div class="analytics-bar-fill" style="width:${fillPct}%;background:${fillColor};"></div></div>
            <span class="text-[10px] font-bold text-slate-700 w-8">${fillPct}%</span>
          </div>
        </td>
      </tr>`;
    }).join('');
  }
  const anlFeed = document.getElementById('anl-activity-feed');
  if (anlFeed) {
    const feedItems = [...getAllApplicants()]
      .filter(a => a.appliedDate)
      .sort((a, b) => b.appliedDate.localeCompare(a.appliedDate))
      .slice(0, 12);
    const activityColors = {new:'#ef4444',interview:'#8b5cf6',phone:'#8b5cf6',qualified:'#8b5cf6',scheduled:'#8b5cf6',exam:'#06b6d4',bgcheck:'#6366f1',hired:'#10b981',onboarding:'#059669',pool:'#f59e0b',rejected:'#94a3b8'};
    const activityIcons  = {new:'how_to_reg',interview:'forum',phone:'forum',qualified:'forum',scheduled:'forum',exam:'assignment',bgcheck:'fact_check',hired:'verified',onboarding:'badge',pool:'auto_awesome',rejected:'cancel'};
    anlFeed.innerHTML = feedItems.length ? feedItems.map(a => {
      const acc = ACCOUNTS.find(ac => ac.id === a.account);
      const col = activityColors[a.stage] || '#94a3b8';
      const icon = activityIcons[a.stage] || 'person';
      return `<div class="flex items-start gap-3 cursor-pointer group" onclick="triggerResumeModal('${a.id}')">
        <div class="activity-dot mt-1" style="background:${col};"></div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-bold text-slate-800 group-hover:text-red-800 transition truncate">${a.name}</p>
          <p class="text-[10px] text-slate-500">${a.role} · <span style="color:${acc?.color||'#64748b'};font-weight:700">${a.account}</span></p>
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="material-icons-outlined" style="font-size:11px;color:${col};">${icon}</span>
            <span class="text-[10px] font-semibold" style="color:${col};">${getStageName(a.stage)}</span>
            <span class="text-[10px] text-slate-400 ml-auto">${a.appliedDate}</span>
          </div>
        </div>
      </div>`;
    }).join('') : '<p class="text-xs text-slate-400 text-center py-4">No recent activity</p>';
  }
}

// ── Job ageing / deadline ───────────────────────────────────────
// A staffing agency is judged on how fast a seat gets filled, so the card
// leads with how long the role has been open and how close the client's
// deadline is. Both are derived — nothing extra to maintain by hand.
function jobDaysOpen(job){
  if(!job||!job.created_at) return null;
  const t=new Date(job.created_at).getTime();
  if(isNaN(t)) return null;
  return Math.max(0,Math.floor((Date.now()-t)/86400000));
}
function jobDaysLeft(job){
  if(!job||!job.deadline) return null;
  const d=new Date(String(job.deadline).slice(0,10)+'T00:00:00');
  if(isNaN(d.getTime())) return null;
  // Calendar days apart, not elapsed hours: a deadline of today must read 0
  // ("due today"), not 1 because there are still a few hours left in it.
  const n=new Date();
  const today=new Date(n.getFullYear(),n.getMonth(),n.getDate());
  return Math.round((d.getTime()-today.getTime())/86400000);
}
// Colour follows urgency, not decoration: overdue red, closing amber, calm grey.
function jobDeadlineChip(job){
  const left=jobDaysLeft(job);
  if(left===null) return '';
  let bg,fg,txt;
  if(left<0){        bg='#fee2e2'; fg='#b91c1c'; txt=Math.abs(left)+'d overdue'; }
  else if(left<=7){  bg='#fef3c7'; fg='#b45309'; txt=left===0?'due today':left+'d left'; }
  else {             bg='#f1f5f9'; fg='#64748b'; txt=left+'d left'; }
  return '<span style="font-size:9.5px;font-weight:700;padding:2px 7px;border-radius:99px;color:'+fg+';background:'+bg+';white-space:nowrap;">'+txt+'</span>';
}
function jobAgeChip(job){
  const d=jobDaysOpen(job);
  if(d===null) return '';
  const stale=d>=45;
  return '<span title="Days since this position was posted" style="font-size:9.5px;font-weight:600;padding:2px 7px;border-radius:99px;color:'
    +(stale?'#b45309':'#94a3b8')+';background:'+(stale?'#fffbeb':'#f8fafc')+';white-space:nowrap;">'+(d===0?'new today':d+'d open')+'</span>';
}
// Copy the public posting URL for pasting into a Facebook or JobStreet post.
// Derived from where the ATS itself is served, so it works on localhost and on
// the deployed site without a hard-coded domain.
function cntCopyJobLink(sid){
  const url=new URL('careers.html?job='+encodeURIComponent(sid), location.href).href;
  const done=()=>showToast('Public link copied','success');
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(done).catch(()=>prompt('Copy this link:',url));
  } else prompt('Copy this link:',url);
}
// Applications belonging to one posting.
//
// Matching on role+location alone made two similar postings for the same
// client cross-count each other's applicants. Applications carry job_id, so
// prefer that. Applications with no job_id — added by hand in the ATS, or
// created before the link existed — still fall back to role+location, which
// keeps their counts working; that fallback is the one case where two
// identical sibling postings can still share a candidate.
function appsForJob(accId, job){
  const list=(typeof accountData!=='undefined' && accountData[accId])||[];
  if(job && job._sid!=null){
    return list.filter(a=> a.job_id!=null
      ? String(a.job_id)===String(job._sid)
      : (a.role===job.role && a.location===job.location));
  }
  return list.filter(a=>a.role===job.role && a.location===job.location);
}
function renderJobPositions(){
  const jc=document.getElementById('job-cards-container');
  if(!jc)return;
  if(typeof fillJobFilters==='function') fillJobFilters();
  const gv=id=>{ const el=document.getElementById(id); return el?el.value:'all'; };
  const cliF=gv('job-f-client'), roleF=gv('job-f-position'), locF=gv('job-f-location'), stF=gv('job-f-status');
  const allClientIds=[...new Set([...ACCOUNTS.map(a=>a.id), ...Object.keys(jobDatabase)])];
  const accs = cliF!=='all' ? [cliF] : allClientIds;
  let rendered=0;
  jc.innerHTML='';
  // Gather every matching job first so sorting can order across clients —
  // rendering client-by-client would only ever sort within each group.
  const matches=[];
  accs.forEach(accId=>{
    (jobDatabase[accId]||[]).forEach(j=>{
      if(locF!=='all'&&j.location!==locF)return;
      if(roleF!=='all'&&j.role!==roleF)return;
      if(stF==='open'   && j.status==='closed') return;
      if(stF==='closed' && j.status!=='closed') return;
      matches.push({accId,job:j});
    });
  });
  const apps=m=>appsForJob(m.accId,m.job);
  const sortBy=gv('job-f-sort');
  const BIG=1e9;   // no deadline sorts last rather than first
  matches.sort((a,b)=>{
    if(sortBy==='newest'||sortBy==='oldest'){
      const ta=a.job.created_at?new Date(a.job.created_at).getTime():0;
      const tb=b.job.created_at?new Date(b.job.created_at).getTime():0;
      return sortBy==='newest' ? tb-ta : ta-tb;
    }
    if(sortBy==='applicants') return apps(b).filter(x=>x.stage!=='pool').length - apps(a).filter(x=>x.stage!=='pool').length;
    if(sortBy==='gap'){
      const gap=m=>Math.max(0,(m.job.needed||1)-apps(m).filter(x=>stageIsHired(x.stage)||x.deployed_at).length);
      return gap(b)-gap(a);
    }
    const la=jobDaysLeft(a.job), lb=jobDaysLeft(b.job);   // deadline: soonest first
    return (la===null?BIG:la)-(lb===null?BIG:lb);
  });
  matches.forEach(({accId,job})=>{
    const accInfo=ACCOUNTS.find(a=>a.id===accId);
    {
      const appsForThisJob=appsForJob(accId,job);
      const newCount=appsForThisJob.filter(a=>a.stage==='new').length;
      const totalApps=appsForThisJob.filter(a=>a.stage!=='pool').length;
      const hiredCount=appsForThisJob.filter(a=>stageIsHired(a.stage)||a.deployed_at).length;
      const interviewCount=appsForThisJob.filter(a=>a.stage==='interview').length;
      const toRecruit=Math.max(0,(job.needed||1)-hiredCount);
      const published=job.status!=='closed';
      const isFav=job.favorite||job.priority==='urgent';
      const rc=s=>String(s==null?'':s).replace(/'/g,"\\'");
      jc.innerHTML+=`<div class="bg-white border border-slate-200 rounded-xl hover:shadow-md transition cursor-pointer hover:border-slate-300 group" style="position:relative;" onclick="quickJump('${rc(job.role)}','${rc(job.location)}','${rc(job.account)}',null,'${job._sid||''}')">
        ${published?`<div style="position:absolute;top:0;right:0;width:104px;height:104px;overflow:hidden;pointer-events:none;border-top-right-radius:12px;"><div style="position:absolute;transform:rotate(45deg);background:#16a34a;color:#fff;font-size:9px;font-weight:800;letter-spacing:.06em;text-align:center;width:150px;top:20px;right:-42px;padding:3px 0;box-shadow:0 1px 3px rgba(0,0,0,.25);">PUBLISHED</div></div>`:''}
        <div class="p-4">
          <div class="flex items-start gap-2 mb-1">
            <button onclick="event.stopPropagation();cntToggleFav('${accId}','${rc(job.role)}','${rc(job.location)}')" title="Mark as favorite" class="flex-shrink-0 mt-0.5 cursor-pointer leading-none"><span class="material-icons-outlined" style="font-size:17px;color:${isFav?'#f59e0b':'#cbd5e1'};">${isFav?'star':'star_border'}</span></button>
            <div class="min-w-0 flex-1">
              <h3 class="font-bold text-slate-900 text-[13px] leading-tight group-hover:text-red-800 transition">${job.role}</h3>
              <p class="text-[11px] text-slate-500 mt-0.5">${job.recruiter?job.recruiter:'<span class="text-slate-300">Unassigned recruiter</span>'}</p>
              <p class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1"><span class="material-icons-outlined" style="font-size:12px;">business</span>${job.account} <span class="text-slate-300">(${job.location})</span></p>
              <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">${jobAgeChip(job)}${jobDeadlineChip(job)}</div>
            </div>
            ${job._sid?`<div style="position:relative;" class="flex-shrink-0 mr-6">
              <button onclick="event.stopPropagation();var m=this.nextElementSibling;m.style.display=m.style.display==='block'?'none':'block';" class="text-slate-300 hover:text-slate-600 cursor-pointer p-0.5 leading-none"><span class="material-icons-outlined" style="font-size:17px;">more_vert</span></button>
              <div style="display:none;position:absolute;right:0;top:24px;z-index:30;background:#fff;border:1px solid #e2e8f0;border-radius:9px;box-shadow:0 6px 20px rgba(0,0,0,.12);min-width:130px;overflow:hidden;">
                <button onclick="event.stopPropagation();this.parentElement.style.display='none';editJobPosition(${job._sid})" class="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-2"><span class="material-icons-outlined" style="font-size:14px;">edit</span>Edit</button>
                <button onclick="event.stopPropagation();this.parentElement.style.display='none';deleteJobPosition(${job._sid})" class="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-2"><span class="material-icons-outlined" style="font-size:14px;">delete_outline</span>Remove</button>
              </div>
            </div>`:''}
          </div>
          <div class="flex items-end justify-between gap-3 mt-3">
            <button onclick="event.stopPropagation();quickJump('${rc(job.role)}','${rc(job.location)}','${rc(job.account)}',${newCount>0?"'new'":'null'},'${job._sid||''}')" class="bg-red-800 hover:bg-red-900 text-white text-xs font-bold px-3 py-2 rounded-lg transition cursor-pointer whitespace-nowrap shadow-sm">${totalApps} Application${totalApps===1?'':'s'}${newCount>0?` · ${newCount} new`:''}</button>
            <div class="text-right leading-tight">
              <div class="text-[12px] font-bold text-slate-700">${toRecruit} To Recruit</div>
              <div class="text-[11px] mt-0.5 ${interviewCount>0?'text-amber-600 font-semibold':'text-slate-400'}">${interviewCount} In Interview</div>
              <div class="text-[11px] text-emerald-600 mt-0.5">${hiredCount} Hired</div>
            </div>
          </div>
        </div>
        <div class="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between gap-2" onclick="event.stopPropagation()">
          <button onclick="cntTogglePublish('${accId}','${job._sid||''}','${rc(job.role)}','${rc(job.location)}')" title="${published?'Published — click to unpublish':'Not published — click to publish'}" class="flex items-center gap-1.5 cursor-pointer">
            <span style="width:30px;height:16px;border-radius:99px;background:${published?'#16a34a':'#cbd5e1'};position:relative;display:inline-block;transition:.15s;"><span style="position:absolute;top:2px;left:${published?'16px':'2px'};width:12px;height:12px;border-radius:50%;background:#fff;transition:.15s;"></span></span>
            <span class="text-[11px] font-semibold ${published?'text-emerald-700':'text-slate-400'}">${published?'Published':'Not Published'}</span>
          </button>
          ${job._sid?`<span class="flex items-center gap-3">
            <button onclick="cntCopyJobLink('${job._sid}')" class="text-[11px] text-slate-500 hover:text-red-700 flex items-center gap-1 cursor-pointer" title="Copy the public link to share on Facebook or JobStreet"><span class="material-icons-outlined" style="font-size:13px;">link</span>Copy link</button>
            <a href="careers.html?job=${job._sid}" target="_blank" rel="noopener" class="text-[11px] text-slate-500 hover:text-red-700 flex items-center gap-1" title="Open public job page"><span class="material-icons-outlined" style="font-size:13px;">open_in_new</span>Job Page</a>
          </span>`:'<span></span>'}
        </div>
      </div>`;
      rendered++;
    }
  });
  if(!rendered)jc.innerHTML=`<div class="col-span-full bg-white rounded-xl border p-10 text-center text-slate-400 text-sm">No positions match these filters. <button onclick="cntClearJobFilters()" class="text-red-700 font-semibold hover:underline cursor-pointer">Clear filters</button> or <button onclick="openCreateJobModal()" class="text-red-700 font-semibold hover:underline cursor-pointer">post one now.</button></div>`;
  const cnt=document.getElementById('job-filter-count');
  if(cnt) cnt.textContent = rendered ? (rendered+' position'+(rendered!==1?'s':'')) : '';
}
function cntClearJobFilters(){
  ['job-f-client','job-f-position','job-f-location','job-f-status'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value='all'; });
  renderJobPositions();
}

// Job Positions filter bar — options come from the jobs actually posted, with
// a count so you can see how many postings sit behind each value.
function fillJobFilters(){
  const bar=document.getElementById('job-f-client'); if(!bar) return;
  const all=[];
  Object.keys(jobDatabase).forEach(k=>(jobDatabase[k]||[]).forEach(j=>all.push({account:j.account||k, role:j.role, location:j.location})));
  const tally=fn=>{ const m={}; all.forEach(j=>{ const v=fn(j); if(v==null||v==='') return; m[v]=(m[v]||0)+1; }); return m; };
  const fill=(id,counts,allLabel)=>{
    const sel=document.getElementById(id); if(!sel) return;
    const cur=sel.value;
    sel.innerHTML='<option value="all">'+allLabel+' ('+all.length+')</option>'
      +Object.keys(counts).sort().map(k=>'<option value="'+_escForm(k)+'">'+_escForm(k)+' ('+counts[k]+')</option>').join('');
    sel.value=[...sel.options].some(o=>o.value===cur)?cur:'all';
  };
  fill('job-f-client',   tally(j=>j.account),  'All Clients');
  fill('job-f-position', tally(j=>j.role),     'All Positions');
  fill('job-f-location', tally(j=>j.location), 'All Locations');
}
function _setSelect(id,value){
  const sel=document.getElementById(id); if(!sel) return;
  if(![...sel.options].some(o=>o.value===value)){ const o=document.createElement('option'); o.value=value; o.textContent=value; sel.appendChild(o); }
  sel.value=value;
};

function renderTalentPool(pool){
  const tpt=document.getElementById('talent-pool-table');
  if(!tpt)return;
  const poolTotal=document.getElementById('pool-total');if(poolTotal)poolTotal.textContent=pool.length;
  const poolReady=document.getElementById('pool-ready');if(poolReady)poolReady.textContent=Math.round(pool.length*0.6);
  const poolFollowup=document.getElementById('pool-followup');if(poolFollowup)poolFollowup.textContent=Math.round(pool.length*0.3);
  const poolDeployed=document.getElementById('pool-deployed');if(poolDeployed)poolDeployed.textContent=Math.round(pool.length*0.1);
  if(!pool.length){tpt.innerHTML=`<tr><td colspan="7"><div class="empty-state"><span class="material-icons-outlined text-4xl mb-2">person_search</span><p class="text-sm font-semibold">Talent pool is empty</p><p class="text-xs mt-1">Candidates tagged as Talent Pool will appear here.</p></div></td></tr>`;return;}
  tpt.innerHTML=pool.map(c=>{
    const acc=ACCOUNTS.find(a=>a.id===c.account);
    return `<tr>
      <td class="px-4 py-3 font-bold text-slate-800 text-sm cursor-pointer hover:text-red-700" onclick="triggerResumeModal('${c.id}')">${c.name}</td>
      <td class="px-4 py-3 text-xs text-slate-600">${c.role}</td>
      <td class="px-4 py-3"><span class="badge" style="background:${acc?.color||'#64748b'}18;color:${acc?.color||'#64748b'};border-color:${acc?.color||'#64748b'}30;">${c.account}</span></td>
      <td class="px-4 py-3 text-xs text-slate-400">${c.location}</td>
      <td class="px-4 py-3"><span class="badge bg-amber-50 text-amber-700 border-amber-200">Available</span></td>
      <td class="px-4 py-3 text-xs text-slate-400 font-mono">${c.phone}</td>
      <td class="px-4 py-3"><button onclick="activateFromPool('${c.id}')" class="bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 font-bold text-[11px] px-2.5 py-1 rounded-lg transition cursor-pointer">→ Move to Pipeline</button></td>
    </tr>`;
  }).join('');
}

function renderInterviewsGrid(filtered){
  const ig=document.getElementById('interviews-grid-container');
  if(!ig)return;
  _intvSyncScopeUI();
  filtered=_intvScopeApplied(filtered);
  const interviews=filtered.filter(a=>a.stage==='interview'&&a.interviewDate).sort((a,b)=>(a.interviewDate+a.interviewTime)>(b.interviewDate+b.interviewTime)?1:-1);
  const today=new Date().toISOString().split('T')[0];
  const thisWeekEnd=new Date(Date.now()+7*24*3600*1000).toISOString().split('T')[0];
  const todayCount=interviews.filter(a=>a.interviewDate===today).length;
  const weekCount=interviews.filter(a=>a.interviewDate>=today&&a.interviewDate<=thisWeekEnd).length;
  const pending=filtered.filter(a=>a.stage==='interview'&&!a.interviewDate).length;
  const passed=filtered.filter(a=>['exam','bgcheck','hired','onboarding'].includes(a.stage)).length;
  const itEl=document.getElementById('int-today');if(itEl)itEl.textContent=todayCount;
  const iwEl=document.getElementById('int-week');if(iwEl)iwEl.textContent=weekCount;
  const ipEl=document.getElementById('int-pending');if(ipEl)ipEl.textContent=pending;
  const ippEl=document.getElementById('int-passed');if(ippEl)ippEl.textContent=passed;
  if(!interviews.length){ig.innerHTML=`<div class="col-span-full empty-state"><span class="material-icons-outlined text-4xl mb-2">event_busy</span><p class="text-sm font-semibold">No scheduled interviews</p></div>`;return;}
  ig.innerHTML=interviews.map(item=>{
    const acc=ACCOUNTS.find(a=>a.id===item.account);
    return `<div class="border border-slate-200 rounded-xl p-3.5 bg-slate-50 hover:border-red-200 transition cursor-pointer" onclick="openInterviewModal('${item.id}')">
      <div class="flex items-start gap-3 mb-3">
        <div class="bg-white border border-slate-200 rounded-lg p-2 flex flex-col items-center min-w-[44px]">
          <span class="text-[9px] uppercase font-bold text-slate-400">${fmtMonth(item.interviewDate)}</span>
          <span class="text-xl font-black text-slate-800">${fmtDay(item.interviewDate)}</span>
        </div>
        <div class="flex-1">
          <div class="flex items-start justify-between gap-1">
            <h4 class="font-bold text-slate-900 text-sm">${item.name}</h4>
            <span class="badge border ${getStageBadge(item.stage)} text-[9px] flex-shrink-0">${getStageName(item.stage)}</span>
          </div>
          <p class="text-[11px] font-bold text-red-700 mt-0.5">${fmtTime(item.interviewTime)}</p>
          <p class="text-[11px] text-slate-500 mt-0.5">${item.interviewType||'Interview'}</p>
          <p class="text-xs text-slate-600 mt-0.5">${item.role}</p>
          <p class="text-[10px] text-slate-400">${item.account} · ${item.location}</p>
        </div>
      </div>
      <div class="pt-2.5 border-t border-slate-200 flex justify-between items-center gap-2">
        <span class="text-[10px] text-slate-400 truncate min-w-0">${_isMeetUrl(item.interviewVenue)?'Online meeting':(item.interviewVenue||item.interviewType||'—')}</span>
        <div class="flex items-center gap-2 flex-none">
          ${_isMeetUrl(item.interviewVenue)?`<a href="${item.interviewVenue}" target="_blank" rel="noopener" onclick="event.stopPropagation()" class="text-xs text-white bg-emerald-600 hover:bg-emerald-700 font-semibold px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1"><span class="material-icons-outlined" style="font-size:12px;">videocam</span>Join</a>`:''}
          <button onclick="event.stopPropagation();openInterviewModal('${item.id}')" class="text-xs text-red-700 font-semibold hover:underline cursor-pointer flex items-center gap-1">
            <span class="material-icons-outlined" style="font-size:12px;">edit_calendar</span>Reschedule
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── Interviews calendar (monthly) ───────────────────────────────
let _intvView = 'calendar';
let _intvCalRef = new Date();   // any date within the shown month

// Each recruiter sees their own scheduled interviews; managers/admins can see
// everyone's. "Their" = they are the assigned recruiter or the interviewer.
let _intvScope = 'mine';
function _intvSeesAll(){ return ['super_admin','recruitment_manager','recruitment_supervisor'].includes(window.cntRole); }
function _intvScopeApplied(list){
  const scope = _intvSeesAll() ? _intvScope : 'mine';   // non-managers always scoped to self
  if(scope==='all') return list;
  const me=(window.cntUserName||'').trim().toLowerCase();
  if(!me) return list;   // no identity (e.g. offline/demo) → don't hide anything
  return list.filter(a=>(a.recruiter||'').trim().toLowerCase()===me || (a.interviewInterviewer||'').trim().toLowerCase()===me);
}
function setIntvScope(s){ _intvScope=s;
  const mi=document.getElementById('intv-scope-mine'), al=document.getElementById('intv-scope-all');
  if(mi&&al){ const on='text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer bg-white text-red-800 shadow-sm', off='text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer text-slate-500';
    mi.className=s==='mine'?on:off; al.className=s==='all'?on:off; }
  const f=window._intvFiltered||[]; renderInterviewsGrid(f); renderInterviewsCalendar(f);
}
function _intvSyncScopeUI(){
  const tog=document.getElementById('intv-scope-toggle'), note=document.getElementById('intv-scope-note');
  const mgr=_intvSeesAll();
  if(tog) tog.classList.toggle('hidden', !mgr);   // toggle only for managers
  if(tog) tog.classList.toggle('flex', mgr);
  if(note) note.textContent = mgr ? '' : 'Showing your interviews';
}
function setIntvView(v){
  _intvView = v;
  document.getElementById('interviews-calendar-container').classList.toggle('hidden', v!=='calendar');
  document.getElementById('interviews-grid-container').classList.toggle('hidden', v!=='list');
  const cal=document.getElementById('intv-view-calendar'), lst=document.getElementById('intv-view-list');
  if(cal&&lst){
    cal.className='text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer '+(v==='calendar'?'bg-white text-red-800 shadow-sm':'text-slate-500');
    lst.className='text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer '+(v==='list'?'bg-white text-red-800 shadow-sm':'text-slate-500');
  }
}
function intvCalMove(delta){ _intvCalRef=new Date(_intvCalRef.getFullYear(), _intvCalRef.getMonth()+delta, 1); renderInterviewsCalendar(window._intvFiltered||[]); }
function intvCalToday(){ _intvCalRef=new Date(); renderInterviewsCalendar(window._intvFiltered||[]); }
function renderInterviewsCalendar(filtered){
  const host=document.getElementById('interviews-calendar-container'); if(!host) return;
  filtered=_intvScopeApplied(filtered);
  const title=document.getElementById('intv-cal-title');
  const ref=_intvCalRef, y=ref.getFullYear(), m=ref.getMonth();
  if(title) title.textContent=new Date(y,m,1).toLocaleString('default',{month:'long',year:'numeric'});
  // interviews indexed by date string
  const byDate={};
  (filtered||[]).filter(a=>a.stage==='interview'&&a.interviewDate).forEach(a=>{ (byDate[a.interviewDate]=byDate[a.interviewDate]||[]).push(a); });
  const todayStr=new Date().toISOString().split('T')[0];
  const first=new Date(y,m,1), startDow=first.getDay(), daysInMonth=new Date(y,m+1,0).getDate();
  const dow=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let cells='';
  dow.forEach(d=>cells+=`<div class="text-[10px] font-bold uppercase tracking-wide text-slate-400 text-center py-1">${d}</div>`);
  for(let i=0;i<startDow;i++) cells+=`<div class="min-h-[92px] rounded-lg bg-slate-50/50"></div>`;
  for(let day=1;day<=daysInMonth;day++){
    const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const items=(byDate[ds]||[]).sort((a,b)=>(a.interviewTime||'')>(b.interviewTime||'')?1:-1);
    const isToday=ds===todayStr;
    const chips=items.slice(0,3).map(a=>{
      const acc=ACCOUNTS.find(x=>x.id===a.account); const c=acc?.color||'#7f1d1d';
      return `<button onclick="event.stopPropagation();openInterviewModal('${a.id}')" title="${_escForm(a.name)} · ${_escForm(a.interviewType||'Interview')}" class="w-full text-left truncate text-[10px] font-semibold rounded px-1.5 py-0.5 cursor-pointer" style="background:${c}1a;color:${c};">${a.interviewTime?fmtTime(a.interviewTime).replace(' ',''):''} ${_escForm(a.name)}</button>`;
    }).join('');
    const more=items.length>3?`<div class="text-[9px] text-slate-400 font-semibold px-1">+${items.length-3} more</div>`:'';
    cells+=`<div class="min-h-[92px] rounded-lg border ${isToday?'border-red-300 bg-red-50/40':'border-slate-100'} p-1 flex flex-col gap-0.5">
      <div class="text-[11px] font-bold ${isToday?'text-red-700':'text-slate-500'} px-0.5">${day}</div>${chips}${more}</div>`;
  }
  host.innerHTML=`<div class="grid grid-cols-7 gap-1.5">${cells}</div>`;
}

function renderOnboarding(onboarding){
  const ot=document.getElementById('onboarding-table');
  if(!ot)return;
  if(!onboarding.length){ot.innerHTML=`<tr><td colspan="8"><div class="empty-state py-8"><span class="material-icons-outlined text-3xl mb-2">how_to_reg</span><p class="text-sm font-semibold">No candidates in onboarding</p></div></td></tr>`;return;}
  ot.innerHTML=onboarding.map(a=>{
    const reqs=a.requirements||{};
    const filled=PH_REQUIREMENTS.filter(r=>reqs[r]).length;
    const pct=Math.round((filled/PH_REQUIREMENTS.length)*100);
    const acc=ACCOUNTS.find(ac=>ac.id===a.account);
    return `<tr>
      <td class="px-4 py-3 font-bold text-slate-800 text-xs cursor-pointer hover:text-red-700" onclick="triggerResumeModal('${a.id}')">${a.name}</td>
      <td class="px-4 py-3"><span class="badge" style="background:${acc?.color||'#64748b'}18;color:${acc?.color||'#64748b'};border-color:${acc?.color||'#64748b'}30;font-size:10px;">${a.account}</span></td>
      <td class="px-4 py-3 text-xs text-slate-600">${a.role}</td>
      <td class="px-4 py-3 text-xs text-slate-400">${a.location}</td>
      <td class="px-4 py-3"><div class="flex items-center gap-2"><div class="h-1.5 bg-slate-200 rounded-full w-16 overflow-hidden"><div class="h-full bg-emerald-500 rounded-full" style="width:${pct}%"></div></div><span class="text-[10px] font-bold text-slate-600">${filled}/${PH_REQUIREMENTS.length}</span></div></td>
      <td class="px-4 py-3 text-xs text-slate-400">${a.startDate||'TBD'}</td>
      <td class="px-4 py-3"><span class="badge ${pct===100?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-amber-50 text-amber-700 border-amber-200'} border">${pct===100?'Ready to Deploy':'Incomplete'}</span></td>
      <td class="px-4 py-3 text-right"><button onclick="openRequirementsModal('${a.id}')" class="text-red-700 hover:underline text-[11px] font-bold cursor-pointer">Update Docs</button></td>
    </tr>`;
  }).join('');
}

function renderReports(){
  const rag=document.getElementById('reports-account-grid');
  if(!rag)return;
  rag.innerHTML=ACCOUNTS.map(acc=>{
    const all=accountData[acc.id]||[];
    const act=all.filter(a=>a.stage!=='pool'&&a.stage!=='rejected');
    return `<div class="border border-slate-200 rounded-xl p-4">
      <div class="flex items-center gap-2 mb-3"><span class="w-2 h-2 rounded-full" style="background:${acc.color}"></span><span class="text-xs font-bold text-slate-800">${acc.label}</span><span class="ml-auto text-[10px] text-slate-400">${acc.sub}</span></div>
      <div class="text-2xl font-extrabold text-slate-900">${act.length}</div>
      <div class="text-[10px] text-slate-400 mt-0.5 mb-3">in pipeline</div>
      <div class="space-y-1">
        ${PIPELINE_STAGES.map(s=>`<div class="flex justify-between text-[11px]"><span class="text-slate-500">${s.short}</span><span class="font-bold text-slate-700">${act.filter(a=>a.stage===s.key).length}</span></div>`).join('')}
        <div class="flex justify-between text-[11px] border-t border-slate-100 pt-1 mt-1"><span class="text-amber-600 font-semibold">Talent Pool</span><span class="font-bold text-amber-600">${all.filter(a=>a.stage==='pool').length}</span></div>
      </div>
    </div>`;
  }).join('');
  const sb=document.getElementById('source-breakdown');
  if(sb){const srcMap={};getAllApplicants().forEach(a=>{const s=a.source||'Unknown';srcMap[s]=(srcMap[s]||0)+1;});const total=getAllApplicants().length||1;sb.innerHTML=Object.entries(srcMap).sort((a,b)=>b[1]-a[1]).map(([src,cnt])=>`<div class="flex items-center gap-2"><span class="text-xs text-slate-600 w-24 font-medium">${src}</span><div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-red-700 rounded-full" style="width:${Math.round(cnt/total*100)}%"></div></div><span class="text-[11px] font-bold text-slate-700">${cnt}</span></div>`).join('');}
  const lb=document.getElementById('location-breakdown');
  if(lb){const locMap={};getAllApplicants().forEach(a=>{const l=a.location||'Unknown';locMap[l]=(locMap[l]||0)+1;});const total=getAllApplicants().length||1;lb.innerHTML=Object.entries(locMap).sort((a,b)=>b[1]-a[1]).map(([loc,cnt])=>`<div class="flex items-center gap-2"><span class="text-xs text-slate-600 w-24 font-medium">${loc}</span><div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-indigo-600 rounded-full" style="width:${Math.round(cnt/total*100)}%"></div></div><span class="text-[11px] font-bold text-slate-700">${cnt}</span></div>`).join('');}
}

function renderHiringRequests(){
  const tb=document.getElementById('requests-table-body');
  if(!tb)return;
  const filtered=currentAccount==='all'?hiringRequests:hiringRequests.filter(r=>r.account===currentAccount);
  const pending=filtered.filter(r=>r.status==='Pending').length;
  const open=filtered.filter(r=>r.status==='Open').length;
  const filled=filtered.filter(r=>r.status==='Filled').length;
  const pc=document.getElementById('req-pending-count');if(pc)pc.textContent=pending;
  const oc=document.getElementById('req-open-count');if(oc)oc.textContent=open;
  const fc=document.getElementById('req-filled-count');if(fc)fc.textContent=filled;
  tb.innerHTML=filtered.map(r=>{
    const sColor=r.status==='Open'?'bg-red-50 text-red-700 border-red-200':r.status==='Filled'?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-amber-50 text-amber-700 border-amber-200';
    const pColor=r.priority==='Urgent'?'bg-red-50 text-red-700':r.priority==='High'?'bg-amber-50 text-amber-700':'bg-slate-100 text-slate-500';
    const acc=ACCOUNTS.find(a=>a.id===r.account);
    return `<tr>
      <td class="px-4 py-2.5 font-bold text-slate-700 text-xs">${r.id}</td>
      <td class="px-4 py-2.5"><span class="badge" style="background:${acc?.color||'#64748b'}18;color:${acc?.color||'#64748b'};border-color:${acc?.color||'#64748b'}30;">${r.account}</span></td>
      <td class="px-4 py-2.5 text-xs font-semibold text-slate-800">${r.role}${r.client_submitted?` <span class="badge" style="background:#cffafe;color:#0e7490;font-size:9px;vertical-align:middle;">Client-submitted</span>`:''}${r.assigned_name?`<div class="text-[10px] text-slate-400 font-normal mt-0.5">→ ${r.assigned_name}</div>`:''}</td>
      <td class="px-4 py-2.5 text-xs text-slate-500">${r.location}</td>
      <td class="px-4 py-2.5 text-xs text-slate-500">${r.type}</td>
      <td class="px-4 py-2.5 text-center font-bold text-slate-700">${r.count}</td>
      <td class="px-4 py-2.5"><span class="priority-badge ${pColor}">${r.priority}</span></td>
      <td class="px-4 py-2.5"><span class="badge border ${sColor}">${r.status}</span></td>
      <td class="px-4 py-2.5 text-xs text-slate-400">${r.date}</td>
      <td class="px-4 py-2.5">${getCountdownChip(r.deadline)}</td>
      <td class="px-4 py-2.5 text-right">
        ${(window.cntRole==='super_admin'||window.cntRole==='recruitment_supervisor')?`<select onchange="cntAssignRequest('${r.id}', this.value, this.value?this.options[this.selectedIndex].text:'')" class="text-[11px] border border-slate-200 rounded px-1 py-0.5 mr-2 align-middle bg-white"><option value="">Assign…</option>${(window.cntRecruiters||[]).map(u=>`<option value="${u.id}"${r.assigned_to===u.id?' selected':''}>${u.full_name||u.email}</option>`).join('')}</select>`:''}
        <button onclick="approveRequest('${r.id}')" class="text-emerald-700 hover:underline text-[11px] font-bold cursor-pointer mr-2">Approve</button>
        <button onclick="fillRequest('${r.id}')" class="text-red-700 hover:underline text-[11px] font-bold cursor-pointer mr-2">Fill</button>
        <button onclick="deleteHiringRequest('${r.id}')" class="text-slate-400 hover:text-red-500 text-[11px] font-medium cursor-pointer">Remove</button>
      </td>
    </tr>`;
  }).join('');
}

function fmtMonth(d){if(!d)return 'TBD';return new Date(d+'T00:00').toLocaleString('default',{month:'short'});}
function fmtDay(d){if(!d)return '--';return new Date(d+'T00:00').getDate().toString().padStart(2,'0');}
function fmtTime(t){if(!t)return'TBD';const[h,m]=t.split(':');const hr=parseInt(h);const ap=hr>=12?'PM':'AM';return`${hr%12||12}:${m} ${ap}`;}

// ── Global candidate search (header) ────────────────────────────
// Searches every candidate across all client accounts, regardless of the
// current view/filter, and jumps straight to their profile.
function cntGlobalSearch(q){
  q=(q||'').trim().toLowerCase();
  const box=document.getElementById('global-search-results'); if(!box) return;
  if(q.length<2){ box.classList.add('hidden'); box.innerHTML=''; return; }
  const all=(typeof getAllApplicants==='function')?getAllApplicants():[];
  const results=all.map(a=>{
    const name=(a.name||'').toLowerCase();
    const other=[a.role,a.account,a.location,a.email,a.tags,a.degree].map(x=>(x||'').toLowerCase());
    let score=0;
    if(name.startsWith(q)) score=100; else if(name.includes(q)) score=60;
    else if(other.some(h=>h.includes(q))) score=30;
    return {a,score};
  }).filter(x=>x.score>0).sort((x,y)=>y.score-x.score).slice(0,12);
  if(!results.length){
    box.innerHTML='<div class="px-3 py-4 text-xs text-slate-400 text-center">No candidates match &ldquo;'+_escForm(q)+'&rdquo;</div>';
    box.classList.remove('hidden'); return;
  }
  box.innerHTML=results.map(({a})=>{
    const st=(typeof getStageName==='function')?getStageName(a.stage):a.stage;
    const badge=(typeof getStageBadge==='function')?getStageBadge(a.stage):'bg-slate-100 text-slate-600';
    return '<button type="button" class="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 cursor-pointer flex items-center justify-between gap-2" onmousedown="cntOpenSearchResult(\''+a.id+'\')">'
      +'<div class="min-w-0"><div class="text-xs font-semibold text-slate-800 truncate">'+_escForm(a.name)+'</div>'
      +'<div class="text-[10px] text-slate-400 truncate">'+_escForm(a.role||'—')+' · '+_escForm(a.account||'—')+(a.location?(' · '+_escForm(a.location)):'')+'</div></div>'
      +'<span class="badge border '+badge+' text-[9px] flex-none whitespace-nowrap">'+_escForm(st)+'</span></button>';
  }).join('');
  box.classList.remove('hidden');
}
function cntOpenSearchResult(id){
  cntCloseSearch();
  const inp=document.getElementById('global-search'); if(inp) inp.value='';
  if(typeof triggerResumeModal==='function') triggerResumeModal(id);
  else if(typeof openEditModal==='function') openEditModal(id);
}
function cntCloseSearch(){ const box=document.getElementById('global-search-results'); if(box) box.classList.add('hidden'); }
function cntGlobalSearchKey(e){
  if(e.key==='Escape'){ cntCloseSearch(); e.target.value=''; e.target.blur(); }
  else if(e.key==='Enter'){ const first=document.querySelector('#global-search-results button'); if(first) first.dispatchEvent(new MouseEvent('mousedown')); }
}
// Press "/" anywhere (outside a field) to jump to search.
document.addEventListener('keydown',function(e){
  if(e.key==='/' && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName||'')) && !e.target.isContentEditable){
    const inp=document.getElementById('global-search'); if(inp){ e.preventDefault(); inp.focus(); }
  }
});

function quickJump(role,location,account,stage,jobSid){
  selectClient(account);
  _setSelect('filter-location',location);
  _setSelect('filter-role',role);
  document.getElementById('filter-stage').value=stage||'all';
  // sid scopes the pipeline to this exact posting (see getFilteredDataset).
  window.cntPipelineJob={role,location,account,sid:(jobSid===''||jobSid===undefined)?null:jobSid};
  const ctx=document.getElementById('pipeline-context');
  if(ctx) ctx.textContent=role+' · '+account+' · '+location;
  cntShowPipelineFilters(false);   // already scoped to one job — filters would only confuse
  switchView('applications');
  toggleApplicationView('kanban');
}
// The filter bar only makes sense when browsing the whole pipeline
function cntShowPipelineFilters(show){
  const bar=document.getElementById('pipeline-filter-bar');
  if(bar) bar.style.display = show ? '' : 'none';
}
// Back from a job's pipeline → Job Positions, with every filter reset to All
function cntBackToJobs(){
  if(window.cntClearFilters) cntClearFilters();
  switchView('job');
}
// Favorite (star) toggle on a job card — client-side highlight
function cntToggleFav(accId,role,location){
  const job=(jobDatabase[accId]||[]).find(j=>j.role===role&&j.location===location);
  if(job){ job.favorite=!job.favorite; renderJobPositions(); }
}
function quickJumpStage(stage){ cntOpenPipelineList(stage); }

// Dashboard funnel / stat cards → full pipeline in LIST view (no board)
function cntOpenPipelineList(stage){
  ['filter-role','filter-location','filter-source'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value='all'; });
  const st=document.getElementById('filter-stage'); if(st) st.value=stage||'all';
  if(typeof selectClient==='function') selectClient('all');
  window.cntPipelineJob=null;
  const ctx=document.getElementById('pipeline-context');
  if(ctx) ctx.textContent=(stage&&stage!=='all')?('All clients · '+getStageName(stage)):'All applicants · all clients';
  cntShowPipelineFilters(true);   // browsing everything — filters are useful here
  switchView('applications');
  toggleApplicationView('list');
}
function activateFromPool(id){
  const app=findApplicant(id);
  if(app){updateApplicant(id,{stage:'new'});showToast(`${app.name} moved to Initial Screening`,'success');switchView('applications');renderAll();}
}
function allowDrop(ev){ev.preventDefault();}
function drag(ev,id){ev.dataTransfer.setData('text/plain',id);}
function drop(ev,targetStage){ev.preventDefault();const id=ev.dataTransfer.getData('text/plain');const app=findApplicant(id);if(app&&app.stage!==targetStage)requestStageChange(id,targetStage);}

function openCreateApplicationModal(){
  document.getElementById('crud-form').reset();
  document.getElementById('applicant-id').value='';
  document.getElementById('modal-title').textContent='Add Applicant';
  // reset() only restores the markup defaults; rebuild from the live taxonomy.
  if(window.cntRepopulateTaxonomyUI) cntRepopulateTaxonomyUI();
  if(currentAccount!=='all'){ const a=document.getElementById('app-account'); if(a && [...a.options].some(o=>o.value===currentAccount)) a.value=currentAccount; }
  if(typeof populateRecruiterSelect==='function') populateRecruiterSelect('');
  document.getElementById('crud-modal').classList.remove('hidden');
}
function openEditModal(id){
  const app=findApplicant(id);if(!app)return;
  document.getElementById('applicant-id').value=app.id;
  document.getElementById('app-name').value=app.name;
  // Build the options around this applicant's own values first — a <select>
  // discards any value it has no option for, so assigning .value directly
  // would blank the field whenever the taxonomy has moved on since.
  if(window.cntFillApplicantPickers) cntFillApplicantPickers(app);
  else { document.getElementById('app-account').value=app.account;
         document.getElementById('app-location').value=app.location;
         document.getElementById('app-role').value=app.role; }
  document.getElementById('app-phone').value=app.phone;
  document.getElementById('app-email').value=app.email||'';
  document.getElementById('app-source').value=app.source||'JobStreet';
  document.getElementById('app-salary').value=app.salary||'';
  document.getElementById('app-notes').value=app.notes||'';
  document.getElementById('app-stage').value=app.stage;
  const _s=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v||'';};
  if(typeof populateRecruiterSelect==='function') populateRecruiterSelect(app.recruiter);
  _s('app-proposed-salary',app.proposed_salary); _s('app-degree',app.degree); _s('app-medium',app.medium);
  _s('app-referred',app.referred_by); _s('app-linkedin',app.linkedin); _s('app-availability',app.availability); _s('app-tags',app.tags);
  _s('app-experience',app.work_experience); _s('app-education',app.education); _s('app-languages',app.languages);
  _s('app-certifications',app.certifications); _s('app-seminars',app.seminars);
  _s('app-awards',app.awards); _s('app-char-references',app.char_references);
  document.getElementById('modal-title').textContent='Edit Applicant — '+app.name;
  document.getElementById('crud-modal').classList.remove('hidden');
}
function closeCrudModal(){document.getElementById('crud-modal').classList.add('hidden');}
function handleFormSubmit(e){
  e.preventDefault();
  const id=document.getElementById('applicant-id').value;
  const _v=id=>{const el=document.getElementById(id);return el?el.value:'';};
  const obj={name:document.getElementById('app-name').value,account:document.getElementById('app-account').value,location:document.getElementById('app-location').value,role:document.getElementById('app-role').value,phone:document.getElementById('app-phone').value,email:document.getElementById('app-email').value,source:document.getElementById('app-source').value,salary:document.getElementById('app-salary').value,notes:document.getElementById('app-notes').value,stage:document.getElementById('app-stage').value,
    recruiter:_v('app-recruiter'),proposed_salary:_v('app-proposed-salary'),degree:_v('app-degree'),medium:_v('app-medium'),referred_by:_v('app-referred'),linkedin:_v('app-linkedin'),availability:_v('app-availability'),tags:_uniformSkills(_v('app-tags')).join(', '),
    work_experience:_v('app-experience'),education:_v('app-education'),languages:_v('app-languages'),
    certifications:_v('app-certifications'),seminars:_v('app-seminars'),awards:_v('app-awards'),char_references:_v('app-char-references')};
  if(!id) obj.appliedDate=new Date().toISOString().split('T')[0];
  if(id){updateApplicant(id,obj);showToast(`Updated ${obj.name}`,'success');}
  else{const newId='app_'+Date.now();addApplicant({id:newId,...obj});showToast(`Added ${obj.name} to pipeline`,'success');}
  closeCrudModal();renderAll();
}
function deleteApplicant(id){
  const app=findApplicant(id);if(!app)return;
  if(confirm(`Remove "${app.name}" from the system?`)){removeApplicant(id);showToast(`Removed ${app.name}`,'info');renderAll();}
}

function openInterviewModal(id,stageLabel){
  const app=findApplicant(id);if(!app)return;
  document.getElementById('interview-modal-title').textContent=stageLabel?`Schedule — ${stageLabel}`:`Interview: ${app.name}`;
  document.getElementById('interview-applicant-id').value=app.id;
  document.getElementById('interview-applicant-name').textContent=app.name+' · '+app.role+' ('+app.account+')';
  document.getElementById('interview-date').value=app.interviewDate||'';
  document.getElementById('interview-time').value=app.interviewTime||'';
  document.getElementById('interview-type').value=app.interviewType||'Phone Call';
  { const rd=document.getElementById('interview-round'); if(rd) rd.value=app.interviewRound||'Initial Interview'; }
  cntToggleOnline();
  document.getElementById('interview-interviewer').value=app.interviewInterviewer||'';
  document.getElementById('interview-venue').value=app.interviewVenue||'';
  cntSyncMeetControls();
  document.getElementById('interview-modal').classList.remove('hidden');
}
function closeInterviewModal(){
  document.getElementById('interview-modal').classList.add('hidden');
  if(pendingStageChange){if(pendingStageChange.onCancel)pendingStageChange.onCancel();pendingStageChange=null;}
}
// Online interview: generate an instant, account-free video room (Jitsi Meet)
// so recruiters can conduct the interview in the browser. Or paste any link.
// Is the scheduled interview time in the past? (no date → treat as upcoming)
function _interviewIsPast(){
  const d=(document.getElementById('interview-date')||{}).value||'';
  let t=(document.getElementById('interview-time')||{}).value||'';
  if(!d) return false;
  if(!/^\d{2}:\d{2}/.test(t)) t='23:59';          // no time given → end of that day
  const when=new Date(d+'T'+t.slice(0,5));
  if(isNaN(when.getTime())) return false;
  return when.getTime() < Date.now();
}
function cntGenMeetLink(){
  const venue=(document.getElementById('interview-venue')||{}).value||'';
  // One link per interview: while it's still upcoming you can't replace a link
  // that's already been generated/shared. It reopens after the scheduled time.
  if(_isMeetUrl(venue) && !_interviewIsPast()){
    if(window.showToast) showToast('A meeting link is already set. You can regenerate it after the scheduled time passes.','info');
    return;
  }
  const id=(document.getElementById('interview-applicant-id').value||'').replace(/[^\w]/g,'');
  const rand=Math.random().toString(36).slice(2,8);
  document.getElementById('interview-venue').value='https://meet.jit.si/CNT-Interview-'+(id||'x')+'-'+rand;
  const t=document.getElementById('interview-type'); if(t && t.value!=='Video'){ t.value='Video'; cntToggleOnline(); }
  cntSyncMeetControls();
  if(window.showToast) showToast('Online meeting link generated','success');
}
// Lock/unlock the Generate button and show the "time has passed" warning.
function cntSyncMeetControls(){
  const gen=document.getElementById('interview-gen-btn');
  const venue=(document.getElementById('interview-venue')||{}).value||'';
  const past=_interviewIsPast();
  const hasLink=_isMeetUrl(venue);
  if(gen){
    const lock = hasLink && !past;   // link set + still upcoming → no regenerate
    gen.disabled=lock;
    gen.style.opacity=lock?'0.5':'';
    gen.style.cursor=lock?'not-allowed':'pointer';
    gen.title=lock?'A meeting link is set — regenerate after the scheduled time passes':'Create an instant online meeting room';
  }
  const warn=document.getElementById('interview-past-warning');
  if(warn){
    if(past){
      warn.classList.remove('hidden');
      warn.innerHTML='<span class="material-icons-outlined" style="font-size:13px;vertical-align:middle;margin-right:3px;">warning</span>'
        +'The scheduled time has passed and this interview is still open. If the candidate didn’t attend, regenerate the link or reschedule the date/time — then move them forward or refuse.';
    } else warn.classList.add('hidden');
  }
}
function cntJoinMeet(){
  const v=(document.getElementById('interview-venue').value||'').trim();
  if(/^https?:\/\//i.test(v)) window.open(v,'_blank','noopener');
  else if(window.showToast) showToast('No online meeting link set — press Generate or paste one','info');
}
function _isMeetUrl(s){ return /^https?:\/\//i.test((s||'').trim()); }
// The online meeting tools (generate/join) only make sense for a Video interview.
// For Phone/Onsite the field is just a venue/address (or left blank).
function cntToggleOnline(){
  const kind=(document.getElementById('interview-type')||{}).value||'';
  const online=kind==='Video';
  const box=document.getElementById('interview-online'); if(box) box.style.display=online?'':'none';
  const help=document.getElementById('interview-online-help'); if(help) help.style.display=online?'':'none';
  const label=document.getElementById('interview-venue-label');
  const input=document.getElementById('interview-venue');
  if(label) label.textContent = online?'Online meeting link' : (kind==='Phone Call'?'Contact number / notes':'Venue / office address');
  if(input) input.placeholder = online?'Paste or generate a video link' : (kind==='Phone Call'?'Number to call (optional)':'Office address');
  cntSyncMeetControls();
}
function handleInterviewSubmit(e){
  e.preventDefault();
  const id=document.getElementById('interview-applicant-id').value;
  const date=document.getElementById('interview-date').value;
  const time=document.getElementById('interview-time').value;
  const type=document.getElementById('interview-type').value;
  const round=(document.getElementById('interview-round')||{}).value||'Initial Interview';
  const interviewer=document.getElementById('interview-interviewer').value;
  const venue=document.getElementById('interview-venue').value;
  const app=findApplicant(id);
  if(app){
    updateApplicant(id,{interviewDate:date,interviewTime:time,interviewType:type,interviewRound:round,interviewInterviewer:interviewer,interviewVenue:venue});
    if(window.cntPersistInterview) cntPersistInterview(app,{interview_date:date,interview_time:time,interview_type:type,interview_round:round,interview_link:venue||null});
    if(window.cntLogActivity) cntLogActivity(app,'stage',round+' scheduled — '+type+(date?(' on '+date):''));
    if(pendingStageChange&&pendingStageChange.id===id){
      executeStageChange(id,pendingStageChange.targetStage);
      if(pendingStageChange.onSuccess)pendingStageChange.onSuccess();
      pendingStageChange=null;
    }else{showToast(`Interview scheduled for ${app.name}`,'success');renderAll();}
    document.getElementById('interview-modal').classList.add('hidden');
  }
}

function openCreateJobModal(){
  document.getElementById('job-form').reset();
  // reset() only restores the markup defaults, so rebuild the pickers from the
  // current taxonomy before preselecting the account being viewed.
  if(window.cntRepopulateTaxonomyUI) cntRepopulateTaxonomyUI();
  if(currentAccount!=='all'){ const a=document.getElementById('job-account'); if(a && [...a.options].some(o=>o.value===currentAccount)) a.value=currentAccount; }
  document.getElementById('job-modal').classList.remove('hidden');
}
function closeJobModal(){document.getElementById('job-modal').classList.add('hidden');}
function handleJobSubmit(e){
  e.preventDefault();
  const account=document.getElementById('job-account').value;
  const role=document.getElementById('job-role').value;
  const location=document.getElementById('job-location').value;
  const needed=parseInt(document.getElementById('job-needed').value)||1;
  const salary=document.getElementById('job-salary').value;
  const priority=document.getElementById('job-priority').value;
  const employment=(document.getElementById('job-employment')||{}).value||'Full-Time';
  const recruiter=(document.getElementById('job-recruiter')||{}).value||'';
  const deadline=(document.getElementById('job-deadline')||{}).value||'';
  if(!jobDatabase[account])jobDatabase[account]=[];
  const existing=jobDatabase[account].find(j=>j.role===role&&j.location===location);
  if(existing){existing.needed=needed;existing.salary=salary;existing.priority=priority;existing.employment_type=employment;existing.recruiter=recruiter;existing.deadline=deadline;showToast(`Updated ${role} for ${account}`,'success');}
  else{jobDatabase[account].push({role,account,location,needed,salary,priority,employment_type:employment,recruiter,deadline,status:'open',created_at:new Date().toISOString()});showToast(`Posted: ${role} · ${account} · ${location}`,'success');}
  closeJobModal();renderAll();
}

function openHiringRequestModal(){
  // Rebuild the pickers from the current taxonomy each time, so a client added
  // in Settings is selectable without a reload.
  if(window.cntRepopulateTaxonomyUI) cntRepopulateTaxonomyUI();
  // Same gate as the Assign control on the requests list — opening this form
  // must not become a way around it.
  const wrap=document.getElementById('req-recruiter-wrap');
  if(wrap) wrap.classList.toggle('hidden', !(window.cntRole==='super_admin'||window.cntRole==='recruitment_supervisor'));
  document.getElementById('hiring-request-modal').classList.remove('hidden');
}
function closeHiringRequestModal(){document.getElementById('hiring-request-modal').classList.add('hidden');}
function handleHiringRequestSubmit(e){
  e.preventDefault();
  const req={id:'REQ-'+String(hiringRequests.length+1).padStart(3,'0'),account:document.getElementById('req-account').value,role:document.getElementById('req-role').value,location:document.getElementById('req-location').value,type:document.getElementById('req-type').value,count:parseInt(document.getElementById('req-count').value)||1,priority:document.getElementById('req-priority').value,status:'Pending',date:new Date().toISOString().split('T')[0],deadline:document.getElementById('req-deadline').value||'',requestor:document.getElementById('req-requestor').value,notes:document.getElementById('req-notes').value};
  // Only honour an assignment the role is actually allowed to make.
  const canAssign=(window.cntRole==='super_admin'||window.cntRole==='recruitment_supervisor');
  const rec=canAssign ? ((document.getElementById('req-recruiter')||{}).value||'') : '';
  if(rec){
    const u=(window.cntRecruiters||[]).find(x=>(x.full_name||x.email)===rec);
    req.assigned_to=u?u.id:null; req.assigned_name=rec; req.status='Open';
  }
  hiringRequests.unshift(req);
  showToast(`Request ${req.id} submitted`,'success');
  closeHiringRequestModal();renderAll();
}
function approveRequest(id){const r=hiringRequests.find(x=>x.id===id);if(r){r.status='Open';showToast(`${r.id} approved`,'success');renderAll();}}
function fillRequest(id){const r=hiringRequests.find(x=>x.id===id);if(r){r.status='Filled';showToast(`${r.id} marked as filled`,'success');renderAll();}}

function switchProfileTab(tab){
  activeProfileTab = tab;
  // Recruiter notes used to be a third tab; it now lives inside the profile
  // under the résumé, so only these two remain.
  ['profile','checklist'].forEach(t=>{
    document.getElementById('tab-'+t)?.classList.add('hidden');
    document.getElementById('tab-btn-'+t)?.classList.remove('active');
  });
  document.getElementById('tab-'+tab)?.classList.remove('hidden');
  document.getElementById('tab-btn-'+tab)?.classList.add('active');
}

function renderStrictResume(app){
  const el = document.getElementById('profile-resume-content');
  if(!el) return;
  const fullName  = app.name.toUpperCase();
  const location  = app.location;
  const phone     = app.phone;
  const email     = app.email || 'N/A';
  const role      = app.role;
  const account   = app.account;
  const salary    = app.salary || 'N/A';
  const source    = app.source || 'N/A';
  const appliedDate = app.appliedDate || '—';
  const notes     = app.notes || '';
  el.innerHTML = `
    <div style="border-bottom:3px solid #1e293b;padding-bottom:16px;margin-bottom:16px;">
      <h1 style="font-family:Inter,sans-serif;font-size:22px;font-weight:900;letter-spacing:.01em;margin:0 0 4px;color:#0f172a;">${fullName}</h1>
      <div class="resume-sub">${role} · ${account}</div>
      <div class="resume-contact" style="margin-top:6px;">${location} &nbsp;|&nbsp; Phone: ${phone} &nbsp;|&nbsp; Email: ${email}</div>
    </div>
    <h2 style="font-family:Inter,sans-serif;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#7f1d1d;border-bottom:2px solid #7f1d1d;padding-bottom:3px;margin:0 0 8px;">Professional Summary</h2>
    <p style="font-size:12px;margin:0 0 14px;color:#334155;line-height:1.7;">${notes || `Experienced ${role} with a strong background in field sales and client-facing operations. Demonstrated ability to meet targets, build customer relationships, and drive brand presence. Applied for ${account} through ${source}.`}</p>
    <h2 style="font-family:Inter,sans-serif;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#7f1d1d;border-bottom:2px solid #7f1d1d;padding-bottom:3px;margin:0 0 8px;">Application Details</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:12px;">
      <tr><td style="padding:3px 0;color:#64748b;width:160px;">Position Applied:</td><td style="font-weight:700;color:#1e293b;">${role}</td></tr>
      <tr><td style="padding:3px 0;color:#64748b;">Client Account:</td><td style="font-weight:700;color:#1e293b;">${account}</td></tr>
      <tr><td style="padding:3px 0;color:#64748b;">Deployment Location:</td><td style="font-weight:700;color:#1e293b;">${location}</td></tr>
      <tr><td style="padding:3px 0;color:#64748b;">Application Source:</td><td style="font-weight:700;color:#1e293b;">${source}</td></tr>
      <tr><td style="padding:3px 0;color:#64748b;">Expected Salary:</td><td style="font-weight:700;color:#1e293b;">${salary}</td></tr>
      <tr><td style="padding:3px 0;color:#64748b;">Date Applied:</td><td style="font-weight:700;color:#1e293b;">${appliedDate}</td></tr>
    </table>
    <h2 style="font-family:Inter,sans-serif;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#7f1d1d;border-bottom:2px solid #7f1d1d;padding-bottom:3px;margin:0 0 8px;">Interview Schedule</h2>
    ${app.interviewDate ? `
    <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:12px;">
      <tr><td style="padding:3px 0;color:#64748b;width:160px;">Date:</td><td style="font-weight:700;color:#1e293b;">${app.interviewDate}</td></tr>
      <tr><td style="padding:3px 0;color:#64748b;">Time:</td><td style="font-weight:700;color:#1e293b;">${fmtTime(app.interviewTime)}</td></tr>
      <tr><td style="padding:3px 0;color:#64748b;">Type:</td><td style="font-weight:700;color:#1e293b;">${app.interviewType||'—'}</td></tr>
      <tr><td style="padding:3px 0;color:#64748b;">Interviewer:</td><td style="font-weight:700;color:#1e293b;">${app.interviewInterviewer||'—'}</td></tr>
      <tr><td style="padding:3px 0;color:#64748b;">Venue / Link:</td><td style="font-weight:700;color:#1e293b;">${app.interviewVenue||'—'}</td></tr>
    </table>` : '<p style="font-size:12px;color:#94a3b8;margin:0 0 14px;">No interview scheduled yet.</p>'}
    <h2 style="font-family:Inter,sans-serif;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#7f1d1d;border-bottom:2px solid #7f1d1d;padding-bottom:3px;margin:0 0 8px;">Character Reference</h2>
    <p style="font-size:12px;color:#64748b;margin:0 0 14px;font-style:italic;">Available upon request.</p>
    <div style="border-top:1px solid #e2e8f0;margin-top:16px;padding-top:12px;font-size:11px;color:#94a3b8;text-align:center;font-style:italic;">
      I hereby certify that the above information is true and correct to the best of my knowledge and beliefs.<br>
      <strong style="color:#1e293b;font-style:normal;">${app.name}</strong>
    </div>`;
}

function triggerResumeModal(id){
  const app=findApplicant(id);if(!app)return;
  currentViewedApplicantId=app.id;
  switchProfileTab('profile');
  const initials=app.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
  document.getElementById('resume-avatar').textContent=initials;
  document.getElementById('resume-name-display').textContent=app.name;
  document.getElementById('resume-role-display').textContent=app.role;
  document.getElementById('resume-location-display').textContent=app.location;
  document.getElementById('resume-phone-display').textContent=app.phone;
  document.getElementById('resume-email-display').textContent=app.email||'N/A';
  document.getElementById('resume-stage-select').value=app.stage;
  const acc=ACCOUNTS.find(a=>a.id===app.account);
  const ab=document.getElementById('resume-account-badge');
  ab.textContent=app.account;
  ab.style.cssText=`background:${acc?.color||'#64748b'}18;color:${acc?.color||'#64748b'};border-color:${acc?.color||'#64748b'}30;`;
  const sb=document.getElementById('resume-stage-badge');
  sb.textContent=getStageName(app.stage);
  sb.className='badge border '+getStageBadge(app.stage);
  const offerBtn=document.getElementById('offer-letter-btn');
  const offerBox=document.getElementById('offer-summary-box');
  if(stageIsHired(app.stage)){
    offerBtn.classList.remove('hidden');offerBox.classList.remove('hidden');
    if(window.cntRenderOfferBox) cntRenderOfferBox(app);
  }else{offerBtn.classList.add('hidden');offerBox.classList.add('hidden');}
  renderAIScore(app);
  renderStrictResume(app);
  document.getElementById('checklist-name').textContent=app.name;
  renderChecklistTab(app);
  renderRecruiterTab(app);
  if(window.cntRenderApplicantForm)cntRenderApplicantForm(app);
  if(window.cntProfileExtras)window.cntProfileExtras(app);
  document.getElementById('resume-modal').classList.remove('hidden');
}

function renderChecklistTab(app){
  const reqs=app.requirements||{};
  const filled=PH_REQUIREMENTS.filter(r=>reqs[r]).length;
  const pct=Math.round((filled/PH_REQUIREMENTS.length)*100);
  document.getElementById('checklist-filled-count').textContent=filled;
  document.getElementById('checklist-total-count').textContent=PH_REQUIREMENTS.length;
  const ring=document.getElementById('checklist-ring');
  if(ring){const circ=Math.PI*2*15.9;ring.style.strokeDasharray=`${(pct/100)*circ} ${circ}`;ring.style.stroke=pct===100?'#10b981':pct>60?'#f59e0b':'#ef4444';}
  const cl=document.getElementById('resume-checklist');
  cl.innerHTML=PH_REQUIREMENTS.map(req=>`
    <div class="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
      <input type="checkbox" ${reqs[req]?'checked':''} onchange="toggleRequirement('${app.id}','${req}',this.checked)" class="cursor-pointer accent-red-800 w-4 h-4 flex-shrink-0">
      <span class="text-xs text-slate-700 flex-1">${req}</span>
      ${reqs[req]?'<span class="material-icons-outlined text-emerald-500" style="font-size:15px;">check_circle</span>':'<span class="material-icons-outlined text-slate-300" style="font-size:15px;">radio_button_unchecked</span>'}
    </div>`).join('');
}

function renderRecruiterTab(app){
  const steps=app.recruiterSteps||{};
  const rcl=document.getElementById('recruiter-checklist');
  if(rcl){rcl.innerHTML=RECRUITER_STEPS.map((step,i)=>`
    <div class="recruiter-check-item">
      <input type="checkbox" id="rstep-${i}" ${steps[i]?'checked':''} onchange="toggleRecruiterStep('${app.id}',${i},this.checked)" class="cursor-pointer accent-red-800 w-4 h-4 flex-shrink-0 mt-0.5">
      <label for="rstep-${i}" class="text-xs text-slate-700 cursor-pointer flex-1 leading-snug ${steps[i]?'line-through text-slate-400':''}">${step}</label>
      ${steps[i]?'<span class="material-icons-outlined text-emerald-500 flex-shrink-0" style="font-size:14px;">check_circle</span>':''}
    </div>`).join('');}
  renderRecruiterComments(app);
}

function toggleRecruiterStep(id,stepIdx,checked){
  const app=findApplicant(id);if(!app)return;
  if(!app.recruiterSteps)app.recruiterSteps={};
  app.recruiterSteps[stepIdx]=checked;
  updateApplicant(id,{recruiterSteps:app.recruiterSteps});
  renderRecruiterTab(app);
  showToast(checked?'Step marked complete':'Step unchecked','success');
}

function addRecruiterComment(){
  const app=findApplicant(currentViewedApplicantId);if(!app)return;
  const textarea=document.getElementById('new-recruiter-comment');
  const text=textarea.value.trim();
  if(!text){showToast('Please enter a comment first.','info');return;}
  const flagged=document.getElementById('comment-flag').checked;
  if(!app.recruiterComments)app.recruiterComments=[];
  app.recruiterComments.unshift({text,flagged,author:'HR Recruiter',ts:new Date().toLocaleString('en-PH',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})});
  updateApplicant(app.id,{recruiterComments:app.recruiterComments});
  textarea.value='';
  document.getElementById('comment-flag').checked=false;
  renderRecruiterComments(app);
  updateRecruiterBadge(app);
  showToast('Recruiter note added','success');
}

function renderRecruiterComments(app){
  const list=document.getElementById('recruiter-comments-list');if(!list)return;
  const comments=app.recruiterComments||[];
  updateRecruiterBadge(app);
  if(!comments.length){list.innerHTML=`<div class="text-center py-6 text-slate-400 text-xs"><span class="material-icons-outlined text-2xl mb-1 block">chat_bubble_outline</span>No recruiter notes yet.</div>`;return;}
  list.innerHTML=comments.map((c,idx)=>`
    <div class="flex gap-3 p-3 rounded-xl ${c.flagged?'bg-red-50 border border-red-100':'bg-slate-50 border border-slate-100'}">
      <div class="recruiter-note-avatar flex-shrink-0">${c.author.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-[11px] font-bold text-slate-700">${c.author}</span>
          ${c.flagged?'<span class="badge bg-red-100 text-red-700 border-red-200"><span class="material-icons-outlined" style="font-size:10px;">flag</span> Flagged</span>':''}
          <span class="ml-auto text-[10px] text-slate-400">${c.ts}</span>
        </div>
        <p class="text-xs text-slate-600 leading-relaxed">${c.text}</p>
        <button onclick="deleteRecruiterComment('${app.id}',${idx})" class="text-[10px] text-slate-400 hover:text-red-500 mt-1 cursor-pointer">Delete</button>
      </div>
    </div>`).join('');
}

// Bottom fade on the notes list: shown while there is more to scroll to,
// hidden once you reach the end. Wired once to the scroll event, and to any
// content change (new/deleted note, activity refresh) via a MutationObserver
// so it re-evaluates without every render call having to know about it.
function cntSyncNotesFade(){
  const sc=document.getElementById('recruiter-notes-scroll');
  const fade=document.getElementById('recruiter-notes-fade');
  if(!sc||!fade) return;
  const more = sc.scrollTop + sc.clientHeight < sc.scrollHeight - 4;
  fade.classList.toggle('show', more);
}
(function _initNotesFade(){
  const start=()=>{
    const sc=document.getElementById('recruiter-notes-scroll');
    if(!sc){ setTimeout(start,300); return; }          // modal markup may load after this
    if(sc.dataset.fadeWired) return;
    sc.dataset.fadeWired='1';
    sc.addEventListener('scroll', cntSyncNotesFade, {passive:true});
    const list=document.getElementById('recruiter-comments-list');
    if(window.MutationObserver && list){
      new MutationObserver(()=>cntSyncNotesFade()).observe(sc, {childList:true, subtree:true});
    }
    window.addEventListener('resize', cntSyncNotesFade);
    cntSyncNotesFade();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start);
  else start();
})();

function deleteRecruiterComment(id,idx){
  const app=findApplicant(id);if(!app||!app.recruiterComments)return;
  app.recruiterComments.splice(idx,1);
  updateApplicant(id,{recruiterComments:app.recruiterComments});
  renderRecruiterComments(app);
  showToast('Note deleted','info');
}

function updateRecruiterBadge(app){
  const badge=document.getElementById('recruiter-note-badge');if(!badge)return;
  const count=(app.recruiterComments||[]).length;
  if(count>0){badge.textContent=count;badge.classList.remove('hidden');}
  else{badge.classList.add('hidden');}
}

function closeResumeModal(){
  document.getElementById('resume-modal').classList.add('hidden');
  currentViewedApplicantId=null;
}

function updateApplicantStageFromModal(newStage){
  if(!currentViewedApplicantId)return;
  const app=findApplicant(currentViewedApplicantId);if(!app||app.stage===newStage)return;
  const oldStage=app.stage;
  requestStageChange(currentViewedApplicantId,newStage,
    ()=>{
      const sb=document.getElementById('resume-stage-badge');
      sb.textContent=getStageName(newStage);
      sb.className='badge border '+getStageBadge(newStage);
      const freshApp=findApplicant(currentViewedApplicantId);
      const st=PIPELINE_STAGES.find(s=>s.key===newStage);
      const isHired = st?st.is_hired:(newStage==='hired'||newStage==='onboarding');
      const offerBtn=document.getElementById('offer-letter-btn');
      const offerBox=document.getElementById('offer-summary-box');
      if(isHired){
        offerBtn.classList.remove('hidden');offerBox.classList.remove('hidden');
        if(window.cntRenderOfferBox) cntRenderOfferBox(freshApp);
      }else{offerBtn.classList.add('hidden');offerBox.classList.add('hidden');}
      if(freshApp){ if(window.cntRenderApplicantForm) cntRenderApplicantForm(freshApp); if(window.cntProfileExtras) cntProfileExtras(freshApp); if(window.cntRefreshProfilePanels) cntRefreshProfilePanels(freshApp); }
    },
    ()=>{ const sel=document.getElementById('resume-stage-select'); if(sel) sel.value=oldStage; }
  );
}

function toggleRequirement(id,req,checked){
  const app=findApplicant(id);if(!app)return;
  if(!app.requirements)app.requirements={};
  app.requirements[req]=checked;
  updateApplicant(id,{requirements:app.requirements});
  renderChecklistTab(app);
  const filled=PH_REQUIREMENTS.filter(r=>app.requirements[r]).length;
  if(filled===PH_REQUIREMENTS.length)showToast('All requirements complete! Ready to deploy.','success');
}
function openRequirementsModal(id){triggerResumeModal(id);}

function generateOfferLetter(){
  const app=findApplicant(currentViewedApplicantId);if(!app)return;
  if(!stageIsHired(app.stage)){showToast('Offer letter is only available once the candidate reaches a Job Offer stage.','info');return;}
  const today=new Date().toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'});
  const offerAmt=app.proposed_salary||app.salary||'As discussed';
  let validUntil='';
  { let v=app.offer_validity; if(!v){ const d=new Date(); d.setDate(d.getDate()+30); v=d.toISOString().slice(0,10); } try{ validUntil=new Date(v+'T00:00').toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'}); }catch(e){ validUntil=v; } }
  const content=document.getElementById('offer-letter-content');
  content.innerHTML=`
    <div class="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-start">
      <div><img src="https://uploads.onecompiler.io/43d4zm644/44q9vbk23/cnt_front.png" alt="CNT Recruitment & Manpower Services" class="h-12 w-auto" /></div>
      <div class="text-right text-xs text-slate-500"><p>${today}</p><p>Ref: OFFER-${Date.now().toString().slice(-6)}</p></div>
    </div>
    <p class="mb-2">Dear <strong>${app.name}</strong>,</p>
    <p class="mb-4">We are pleased to inform you that you have been selected for the position of <strong>${app.role}</strong> under our client account <strong>${app.account}</strong> assigned at <strong>${app.location}</strong>.</p>
    <div class="my-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl grid grid-cols-2 gap-4 text-center">
      <div><p class="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Position Offered</p><p class="text-base font-extrabold text-slate-900">${app.role}</p><p class="text-[11px] text-slate-500">${app.account} · ${app.location}</p></div>
      <div><p class="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Offer Amount</p><p class="text-base font-extrabold text-emerald-700">${offerAmt}</p><p class="text-[11px] text-slate-500">Monthly Basic Salary</p></div>
    </div>
    <p class="mb-2 font-semibold text-slate-800 border-b pb-1 border-slate-200">Terms of Employment</p>
    <table class="w-full text-sm mb-4" style="border-collapse:collapse;">
      <tr><td class="py-1 text-slate-500 w-40">Position:</td><td class="font-semibold">${app.role}</td></tr>
      <tr><td class="py-1 text-slate-500">Client Account:</td><td class="font-semibold">${app.account}</td></tr>
      <tr><td class="py-1 text-slate-500">Location:</td><td class="font-semibold">${app.location}</td></tr>
      <tr><td class="py-1 text-slate-500">Basic Salary:</td><td class="font-semibold">${offerAmt}</td></tr>
      <tr><td class="py-1 text-slate-500">Start Date:</td><td class="font-semibold">${app.availability||app.startDate||'To be confirmed'}</td></tr>
      <tr><td class="py-1 text-slate-500">Offer Valid Until:</td><td class="font-semibold">${validUntil}</td></tr>
    </table>
    <p class="mb-4">This offer is subject to the submission of complete pre-employment requirements including NBI Clearance, Medical Certificate, SSS, PhilHealth, Pag-IBIG, TIN, PSA Birth Certificate, Diploma/TOR, and Barangay Clearance.</p>
    <p class="mb-6">Please confirm your acceptance of this offer by signing below and returning a copy to our office on or before <strong>${validUntil}</strong>.</p>
    <div class="grid grid-cols-2 gap-8 mt-8">
      <div><div class="border-b border-slate-400 mb-1 h-8"></div><p class="text-xs text-slate-500">HR Manager / Authorized Representative</p><p class="text-xs font-semibold">CNT Recruitment Services</p></div>
      <div><div class="border-b border-slate-400 mb-1 h-8"></div><p class="text-xs text-slate-500">Candidate's Signature</p><p class="text-xs font-semibold">${app.name} · Date:</p></div>
    </div>`;
  document.getElementById('offer-modal').classList.remove('hidden');
  showToast('Offer letter generated','success');
}
function closeOfferModal(){document.getElementById('offer-modal').classList.add('hidden');}

function updateJobOptions(){}

function exportCSV(){
  showToast('Generating CSV…','info');
  let csv='data:text/csv;charset=utf-8,ID,Name,Role,Account,Location,Stage,Source,Phone,Email,Salary,Applied Date\n';
  getAllApplicants().forEach(a=>{csv+=`${a.id},"${a.name}","${a.role}","${a.account}","${a.location}","${getStageName(a.stage)}","${a.source||''}","${a.phone}","${a.email||''}","${a.salary||''}","${a.appliedDate||''}"\n`;});
  const link=document.createElement('a');
  link.setAttribute('href',encodeURI(csv));
  link.setAttribute('download','cnt_ats_'+new Date().toISOString().split('T')[0]+'.csv');
  document.body.appendChild(link);
  setTimeout(()=>{link.click();link.remove();showToast('CSV exported!','success');},600);
}

function showToast(msg,type='info'){
  const cont=document.getElementById('toast-container');
  const toast=document.createElement('div');
  const bg=type==='success'?'bg-emerald-700':type==='info'?'bg-red-800':'bg-slate-900';
  const icon=type==='success'?'check_circle':'info';
  toast.className=`${bg} text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl flex items-center gap-2 toast-in`;
  toast.innerHTML=`<span class="material-icons-outlined" style="font-size:15px;">${icon}</span><span>${msg}</span>`;
  cont.appendChild(toast);
  setTimeout(()=>{toast.style.transition='all .25s ease';toast.style.opacity='0';toast.style.transform='translateX(20px)';setTimeout(()=>toast.remove(),280);},3200);
}

// Open the applicant profile from a DB id (notifications store the DB id, but
// triggerResumeModal takes the local id). Used by the notification bell.
function cntOpenApplicantByDbId(refId){
  const rid=String(refId);
  const app=(typeof getAllApplicants==='function'?getAllApplicants():[]).find(a=>String(a._sid)===rid||String(a.id)===rid);
  if(app && typeof triggerResumeModal==='function'){ triggerResumeModal(app.id); return true; }
  return false;
}

function toggleSidebar(){
  sidebarOpen=!sidebarOpen;
  const sb=document.getElementById('sidebar');
  sb.style.width=sidebarOpen?'230px':'0px';
  sb.style.minWidth=sidebarOpen?'230px':'0px';
  // On phones the sidebar overlays the content; sync the tap-away backdrop.
  const bd=document.getElementById('sidebar-backdrop');
  if(bd) bd.classList.toggle('show', sidebarOpen && window.innerWidth<=768);
}
// Start collapsed on small screens so the content isn't buried on first load.
document.addEventListener('DOMContentLoaded',()=>{
  if(window.innerWidth<=768 && sidebarOpen) toggleSidebar();
});

document.addEventListener('DOMContentLoaded',()=>{
  if (window.cntBoot) { window.cntBoot(); }
  else { buildClientDropdown(); renderAll(); }
});
