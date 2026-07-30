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
  cntRenderProfileTabs(app);
  cntRenderStageOverride(app);
  cntRenderProfileSidebar(app);
  cntProfIntPopulate(app);
}

// Candidate summary sidebar — avatar, stage, contact, and a persistent interview
// card so the interview shows on every tab. Always visible beside the main panes.
function cntRenderProfileSidebar(app){
  const el=document.getElementById('profile-sidebar'); if(!el||!app) return;
  const acc=ACCOUNTS.find(a=>a.id===app.account), ac=acc?.color||'#64748b';
  const initials=(app.name||'').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'?';
  const row=(icon,val)=> val ? '<div class="flex items-start gap-2 text-xs text-slate-600 mb-2"><span class="material-icons-outlined text-slate-400" style="font-size:15px;">'+icon+'</span><span class="min-w-0 break-words">'+_escForm(val)+'</span></div>' : '';
  let intCard;
  if(app.interviewDate){
    const when=_escForm(app.interviewDate)+(app.interviewTime?(' · '+_escForm(fmtTime(app.interviewTime))):'');
    const sub=[app.interviewRound,app.interviewType].filter(Boolean).map(_escForm).join(' · ');
    intCard='<div class="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-3">'
      +'<div class="flex items-center gap-1.5 mb-1"><span class="material-icons-outlined text-violet-700" style="font-size:15px;">event</span><span class="text-[10px] font-bold text-violet-800 uppercase tracking-wide">Interview</span></div>'
      +'<div class="text-xs font-bold text-slate-800">'+when+'</div>'
      +(sub?'<div class="text-[11px] text-slate-500 mt-0.5">'+sub+'</div>':'')
      +'<button onclick="cntProfIntFocus()" class="mt-2 text-[11px] font-semibold text-violet-700 hover:underline cursor-pointer">Open scheduler →</button></div>';
  } else {
    intCard='<div class="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">'
      +'<div class="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Interview</div>'
      +'<div class="text-xs text-slate-500">Not scheduled yet.</div>'
      +'<button onclick="cntProfIntFocus()" class="mt-2 text-[11px] font-semibold text-red-700 hover:underline cursor-pointer">Schedule now →</button></div>';
  }
  el.innerHTML=
    '<div class="flex flex-col items-center text-center">'
      +'<div style="width:64px;height:64px;border-radius:50%;background:'+ac+';color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;">'+_escForm(initials)+'</div>'
      +'<div class="mt-2 font-bold text-slate-900 text-sm leading-tight">'+_escForm(app.name||'')+'</div>'
      +'<div class="text-xs text-slate-500">'+_escForm(app.role||'')+'</div>'
      +'<div class="flex flex-wrap gap-1 justify-center mt-2">'
        +'<span class="badge border" style="background:'+ac+'18;color:'+ac+';border-color:'+ac+'30;font-size:10px;">'+_escForm(app.account||'')+'</span>'
        +'<span class="badge border '+getStageBadge(app.stage)+'" style="font-size:10px;">'+_escForm(getStageName(app.stage))+'</span>'
      +'</div></div>'
    +'<div class="mt-4 pt-4 border-t border-slate-100">'
      +row('mail',app.email)+row('call',app.phone)+row('place',app.location)+row('badge',app.recruiter?('Recruiter · '+app.recruiter):'')
    +'</div>'+intCard;
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
      +'<span class="'+cls+'" onclick="gotoStageTab(\''+_escForm(s.key)+'\')">'+_escForm(s.short||s.label)+'</span>';
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
  // Moving to the Interview stage pops the scheduler so the recruiter sets it
  // there and then. Match the built-in 'interview' key OR any stage whose name
  // is an interview (covers renamed / custom stages in Settings).
  const nm=(typeof getStageName==='function'?getStageName(targetStage):'')||'';
  if(targetStage==='interview' || /interview/i.test(nm)){
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
        <span class="text-xs font-bold text-slate-900 group-hover:text-red-800 transition truncate">${_escForm(app.name)}</span>
        <span class="badge ${getStageBadge(app.stage)}">${getStageName(app.stage)}</span>
      </div>
      <div class="flex items-center gap-2">
        <div onclick="event.stopPropagation();openInterviewModal('${app.id}')" title="Open interview details" class="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-col items-center min-w-[38px] cursor-pointer hover:border-red-300">
          <span class="text-[8px] uppercase font-bold text-slate-400">${fmtMonth(app.interviewDate)}</span>
          <span class="text-sm font-black text-slate-700">${fmtDay(app.interviewDate)}</span>
        </div>
        <div onclick="event.stopPropagation();openInterviewModal('${app.id}')" title="Open interview details" class="cursor-pointer"><p class="text-[11px] font-semibold text-red-700">${fmtTime(app.interviewTime)}</p><p class="text-[10px] text-slate-400">${_escForm(app.role)} · ${_escForm(app.account)}</p></div>
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
      <div class="flex-1 min-w-0"><p class="text-xs font-bold text-slate-800 truncate">${_escForm(r.role)}</p><p class="text-[10px] text-slate-400">${_escForm(r.account)} · ${_escForm(r.location)}</p></div>
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
  window._lastAppRows=pipeline.map(a=>a.id);
  // Drop selections that fell out of the current filter, then refresh the bar.
  _bulkSel.forEach(id=>{ if(!window._lastAppRows.includes(id)) _bulkSel.delete(id); });
  if(!pipeline.length){tb.innerHTML=`<tr><td colspan="10" class="px-4 py-8 text-center text-slate-400 text-sm">No applicants match current filters</td></tr>`;cntBulkSyncBar();return;}
  tb.innerHTML=pipeline.map(a=>{
    const acc=ACCOUNTS.find(ac=>ac.id===a.account);
    return `<tr>
      <td class="px-3 py-2.5"><input type="checkbox" class="bulk-cb accent-red-800 w-4 h-4 cursor-pointer" data-id="${a.id}" ${_bulkSel.has(a.id)?'checked':''} onclick="event.stopPropagation();cntBulkToggle('${a.id}',this.checked)"></td>
      <td class="px-4 py-2.5 font-semibold text-slate-900 text-xs cursor-pointer hover:text-red-800" onclick="triggerResumeModal('${a.id}')">${_escForm(a.name)}</td>
      <td class="px-4 py-2.5 text-slate-600 text-xs">${_escForm(a.role)}</td>
      <td class="px-4 py-2.5"><span class="badge" style="background:${acc?.color||'#64748b'}18;color:${acc?.color||'#64748b'};border-color:${acc?.color||'#64748b'}30;">${_escForm(a.account)}</span></td>
      <td class="px-4 py-2.5 text-xs text-slate-400">${_escForm(a.location)}</td>
      <td class="px-4 py-2.5"><span class="badge border ${getStageBadge(a.stage)}">${getStageName(a.stage)}</span>${a.client_status==='approved'?'<span class="badge ml-1" style="background:#dcfce7;color:#166534;border:1px solid #bbf7d0;">Client ✓</span>':a.client_status==='rejected'?'<span class="badge ml-1" style="background:#fee2e2;color:#b91c1c;border:1px solid #fecaca;">Client ✗</span>':a.client_status==='endorsed'?'<span class="badge ml-1" style="background:#fef3c7;color:#b45309;border:1px solid #fde68a;">Endorsed</span>':''}${a.deployed_at?'<span class="badge ml-1" style="background:#e0e7ff;color:#4338ca;border:1px solid #c7d2fe;">Deployed</span>':''}</td>
      <td class="px-4 py-2.5 text-xs text-slate-400">${_escForm(a.source||'—')}</td>
      <td class="px-4 py-2.5 text-xs text-slate-400">${a.appliedDate||'—'}</td>
      <td class="px-4 py-2.5 text-xs text-slate-400 font-mono">${_escForm(a.phone)}</td>
      <td class="px-4 py-2.5 text-right">
        <button onclick="triggerResumeModal('${a.id}')" class="text-red-700 hover:text-red-900 text-[11px] font-bold cursor-pointer mr-2">View</button>
        <button onclick="openEditModal('${a.id}')" class="text-slate-500 hover:text-slate-800 text-[11px] font-medium cursor-pointer mr-2">Edit</button>
        <button onclick="openInterviewModal('${a.id}')" class="text-indigo-600 hover:text-indigo-800 text-[11px] font-medium cursor-pointer mr-2">Schedule</button>
        <button onclick="deleteApplicant('${a.id}')" class="text-slate-400 hover:text-red-500 text-[11px] font-medium cursor-pointer">Remove</button>
      </td>
    </tr>`;
  }).join('');
  cntBulkSyncBar();
}

// ── Bulk actions on the List view (multi-select) ──
let _bulkSel = new Set();
function _bulkIds(){ return [..._bulkSel]; }
function cntBulkToggle(id, checked){
  if(checked) _bulkSel.add(id); else _bulkSel.delete(id);
  const sa=document.getElementById('bulk-select-all');
  if(sa){ const all=window._lastAppRows||[]; sa.checked = all.length>0 && all.every(x=>_bulkSel.has(x)); }
  cntBulkSyncBar();
}
function cntBulkToggleAll(checked){
  document.querySelectorAll('#applications-table-body input.bulk-cb').forEach(cb=>{ cb.checked=checked; const id=cb.dataset.id; if(checked) _bulkSel.add(id); else _bulkSel.delete(id); });
  cntBulkSyncBar();
}
function cntBulkClear(){
  _bulkSel.clear();
  const sa=document.getElementById('bulk-select-all'); if(sa) sa.checked=false;
  document.querySelectorAll('#applications-table-body input.bulk-cb').forEach(cb=>cb.checked=false);
  cntBulkSyncBar();
}
function cntBulkSyncBar(){
  const bar=document.getElementById('bulk-action-bar'); if(!bar) return;
  const n=_bulkSel.size;
  if(!n){ bar.classList.add('hidden'); bar.innerHTML=''; return; }
  bar.classList.remove('hidden');
  const opts=PIPELINE_STAGES.map(s=>'<option value="'+_escForm(s.key)+'">'+_escForm(getStageName(s.key))+'</option>').join('');
  bar.innerHTML='<div class="flex items-center gap-3 flex-wrap">'
    +'<span class="text-xs font-bold text-red-800 flex items-center gap-1"><span class="material-icons-outlined" style="font-size:15px;">check_box</span>'+n+' selected</span>'
    +'<div class="h-4 w-px bg-slate-200"></div>'
    +'<div class="flex items-center gap-1.5"><span class="text-[11px] text-slate-500">Move to</span><select id="bulk-stage" class="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white">'+opts+'</select><button onclick="cntBulkMove()" class="text-xs font-semibold text-white bg-red-800 hover:bg-red-900 rounded-lg px-3 py-1.5 cursor-pointer">Apply</button></div>'
    +'<button onclick="cntBulkEmail()" class="text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 cursor-pointer flex items-center gap-1"><span class="material-icons-outlined" style="font-size:13px;">mail</span>Email</button>'
    +'<button onclick="cntBulkPool()" class="text-xs font-semibold text-amber-700 border border-amber-200 rounded-lg px-3 py-1.5 hover:bg-amber-50 cursor-pointer">Add to Pool</button>'
    +'<button onclick="cntBulkRefuseUI()" class="text-xs font-semibold text-red-700 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 cursor-pointer">Refuse</button>'
    +'<button onclick="cntBulkClear()" class="ml-auto text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">Clear</button>'
    +'</div>';
}
function cntBulkMove(){
  const stage=(document.getElementById('bulk-stage')||{}).value; const ids=_bulkIds();
  if(!stage||!ids.length) return;
  if(!confirm('Move '+ids.length+' candidate'+(ids.length!==1?'s':'')+' to '+getStageName(stage)+'?')) return;
  ids.forEach(id=>{ if(typeof executeStageChange==='function') executeStageChange(id,stage); });
  cntBulkClear(); renderAll();
}
function cntBulkPool(){
  const ids=_bulkIds(); if(!ids.length) return;
  if(!confirm('Add '+ids.length+' candidate'+(ids.length!==1?'s':'')+' to the Talent Pool?')) return;
  ids.forEach(id=>{ if(typeof executeStageChange==='function') executeStageChange(id,'pool'); });
  cntBulkClear(); renderAll();
}
function cntBulkRefuseUI(){
  const ids=_bulkIds(); if(!ids.length) return;
  const reason=prompt('Refuse '+ids.length+' candidate'+(ids.length!==1?'s':'')+'. Reason:','Position filled');
  if(reason===null) return;
  if(window.cntBulkRefuse) cntBulkRefuse(ids, reason);
  cntBulkClear();
}
function cntBulkEmail(){
  const ids=_bulkIds(); if(!ids.length) return;
  if(!confirm('Send each of the '+ids.length+' selected candidate'+(ids.length!==1?'s':'')+' their current-stage email?')) return;
  ids.forEach(id=>{ if(window.cntSendStageEmailNow) cntSendStageEmailNow(id); });
  if(window.showToast) showToast('Sending stage email to '+ids.length+' candidate'+(ids.length!==1?'s':'')+'…','info');
  cntBulkClear();
}

function kanbanCardHtml(a, refused){
  const accColor=(ACCOUNTS.find(ac=>ac.id===a.account)?.color||'#64748b');
  const dotMap={normal:['#cbd5e1','In progress'],ready:['#10b981','Ready for next stage'],blocked:['#ef4444','Blocked']};
  const dot=dotMap[a.kanban_state||'normal']||dotMap.normal;
  const initials=(a.account||'?').slice(0,2).toUpperCase();
  const stars=[1,2,3].map(n=>`<span onclick="event.stopPropagation();cntSetPriority('${a.id}',${(a.priority||0)===n?0:n})" title="${['','Good','Very Good','Excellent'][n]}" class="cursor-pointer material-icons-outlined" style="font-size:15px;color:${(a.priority||0)>=n?'#f59e0b':'#e2e8f0'};">star</span>`).join('');
  if(refused){
    return `<div class="kanban-card" style="opacity:.72;cursor:pointer;border-left:3px solid #cbd5e1;" onclick="triggerResumeModal('${a.id}')">
      <p class="font-bold text-slate-600 text-[13px] leading-tight line-through truncate mb-0.5">${_escForm(a.name)}</p>
      <p class="text-[11px] text-slate-400 mb-1.5 truncate">${_escForm(a.role)} · ${_escForm(a.account)}</p>
      ${a.refuse_reason?`<div class="text-[10px] bg-slate-100 text-slate-500 rounded-md px-2 py-1 mb-2"><span class="font-semibold">Refused:</span> ${_escForm(a.refuse_reason)}</div>`:''}
      <div class="flex justify-end pt-1.5 border-t border-slate-100"><button onclick="event.stopPropagation();cntReopen('${a.id}')" class="text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1"><span class="material-icons-outlined" style="font-size:13px;">restart_alt</span>Reopen</button></div>
    </div>`;
  }
  return `<div class="kanban-card" draggable="true" ondragstart="drag(event,'${a.id}')" onclick="triggerResumeModal('${a.id}')" style="border-left:3px solid ${accColor};">
    <div class="flex items-start justify-between gap-1 mb-0.5">
      <p class="font-bold text-slate-900 text-[13px] leading-tight truncate">${_escForm(a.name)}</p>
      <span class="kmenu flex gap-1 flex-shrink-0">
        <button onclick="event.stopPropagation();openEditModal('${a.id}')" title="Edit" class="text-slate-300 hover:text-slate-600 cursor-pointer leading-none"><span class="material-icons-outlined" style="font-size:14px;">edit</span></button>
        <button onclick="event.stopPropagation();cntOpenRefuse('${a.id}')" title="Refuse" class="text-slate-300 hover:text-red-600 cursor-pointer leading-none"><span class="material-icons-outlined" style="font-size:14px;">block</span></button>
      </span>
    </div>
    <p class="text-[11px] text-slate-500 mb-1.5 truncate">${_escForm(a.role)}</p>
    <div class="flex items-center gap-1 flex-wrap mb-2">
      <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style="background:${accColor}18;color:${accColor}">${_escForm(a.account)}</span>
      <span class="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">${_escForm(a.location)}</span>
    </div>
    ${(a.stage==='interview'&&(a.interviewType||a.interviewRound))?`<div onclick="event.stopPropagation();openInterviewModal('${a.id}')" title="Open interview details" class="text-[9px] bg-violet-50 text-violet-700 rounded px-1.5 py-0.5 mb-1.5 font-bold inline-flex items-center gap-1 cursor-pointer hover:bg-violet-100"><span class="material-icons-outlined" style="font-size:10px;">forum</span>${_escForm(a.interviewRound?a.interviewRound.replace(' Interview',''):'')}${(a.interviewRound&&a.interviewType)?' · ':''}${_escForm(a.interviewType||'')}</div>`:''}
    ${a.interviewDate?`<div onclick="event.stopPropagation();openInterviewModal('${a.id}')" title="Open interview details" class="text-[10px] bg-indigo-50 text-indigo-700 rounded-md px-1.5 py-0.5 mb-2 font-semibold inline-flex items-center gap-1 cursor-pointer hover:bg-indigo-100"><span class="material-icons-outlined" style="font-size:11px;">event</span>${fmtMonth(a.interviewDate)} ${fmtDay(a.interviewDate)} ${fmtTime(a.interviewTime)}</div>`:''}
    <div class="flex items-center justify-between pt-2 border-t border-slate-100">
      <span onclick="cntStatusMenu(event,'${a.id}')" title="${dot[1]} — click to change" class="cursor-pointer flex items-center flex-shrink-0" style="position:relative;"><span style="width:10px;height:10px;border-radius:50%;background:${dot[0]};display:inline-block;box-shadow:0 0 0 3px ${dot[0]}22;"></span></span>
      <div class="flex items-center gap-1.5">
        <span class="flex items-center">${stars}</span>
        <span class="flex items-center justify-center flex-shrink-0" title="${_escForm(a.account)}" style="width:20px;height:20px;border-radius:50%;background:${accColor};color:#fff;font-size:8px;font-weight:700;">${_escForm(initials)}</span>
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
          <p class="text-xs font-bold text-slate-800 group-hover:text-red-800 transition truncate">${_escForm(a.name)}</p>
          <p class="text-[10px] text-slate-500">${_escForm(a.role)} · <span style="color:${acc?.color||'#64748b'};font-weight:700">${_escForm(a.account)}</span></p>
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
      <td class="px-4 py-3 font-bold text-slate-800 text-sm cursor-pointer hover:text-red-700" onclick="triggerResumeModal('${c.id}')">${_escForm(c.name)}</td>
      <td class="px-4 py-3 text-xs text-slate-600">${_escForm(c.role)}</td>
      <td class="px-4 py-3"><span class="badge" style="background:${acc?.color||'#64748b'}18;color:${acc?.color||'#64748b'};border-color:${acc?.color||'#64748b'}30;">${_escForm(c.account)}</span></td>
      <td class="px-4 py-3 text-xs text-slate-400">${_escForm(c.location)}</td>
      <td class="px-4 py-3"><span class="badge bg-amber-50 text-amber-700 border-amber-200">Available</span></td>
      <td class="px-4 py-3 text-xs text-slate-400 font-mono">${_escForm(c.phone)}</td>
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
            <h4 class="font-bold text-slate-900 text-sm">${_escForm(item.name)}</h4>
            <span class="badge border ${getStageBadge(item.stage)} text-[9px] flex-shrink-0">${getStageName(item.stage)}</span>
          </div>
          <p class="text-[11px] font-bold text-red-700 mt-0.5">${fmtTime(item.interviewTime)}</p>
          <p class="text-[11px] text-slate-500 mt-0.5">${_escForm(item.interviewType||'Interview')}</p>
          <p class="text-xs text-slate-600 mt-0.5">${_escForm(item.role)}</p>
          <p class="text-[10px] text-slate-400">${_escForm(item.account)} · ${_escForm(item.location)}</p>
        </div>
      </div>
      <div class="pt-2.5 border-t border-slate-200 flex justify-between items-center gap-2">
        <span class="text-[10px] text-slate-400 truncate min-w-0">${_isMeetUrl(item.interviewVenue)?'Online meeting':_escForm(item.interviewVenue||item.interviewType||'—')}</span>
        <div class="flex items-center gap-2 flex-none">
          ${_isMeetUrl(item.interviewVenue)?`<a href="${_escForm(item.interviewVenue)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" class="text-xs text-white bg-emerald-600 hover:bg-emerald-700 font-semibold px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1"><span class="material-icons-outlined" style="font-size:12px;">videocam</span>Join</a>`:''}
          <button onclick="event.stopPropagation();openInterviewModal('${item.id}')" class="text-xs text-red-700 font-semibold hover:underline cursor-pointer flex items-center gap-1">
            <span class="material-icons-outlined" style="font-size:12px;">edit_calendar</span>Reschedule
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── Interviews calendar (day / week / month time-grid) ───────────────────
let _intvView = 'week';         // 'day' | 'week' | 'month' | 'list'
let _intvCalRef = new Date();   // any date within the shown period
const _DAY_START = 6, _DAY_END = 20, _HOUR_PX = 44;   // time grid spans 06:00–20:00

// Each recruiter sees their own scheduled interviews; managers/admins can see
// everyone's. "Their" = they are the assigned recruiter or the interviewer.
let _intvScope = 'mine';
function _intvSeesAll(){ return ['super_admin','recruitment_manager','recruitment_supervisor'].includes(window.cntRole); }
// Only the Account Officer approves MRFs and assigns recruiters (super_admin, as
// the system owner, also can). Everyone else just views the requests.
function _canManageMRF(){ return ['account_officer','super_admin'].includes(window.cntRole); }
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
// Back-compat: the old toggle called setIntvView('calendar'|'list').
function setIntvView(v){ setIntvCalMode(v==='calendar'?'week':v); }
function setIntvCalMode(mode){
  _intvView = mode;
  const isList = mode==='list';
  document.getElementById('interviews-calendar-container')?.classList.toggle('hidden', isList);
  document.getElementById('interviews-grid-container')?.classList.toggle('hidden', !isList);
  ['day','week','month','list'].forEach(m=>{
    const b=document.getElementById('intv-mode-'+m); if(!b) return;
    b.className='intv-mode-btn text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer '+(m===mode?'bg-white text-red-800 shadow-sm':'text-slate-500');
  });
  if(isList) renderInterviewsGrid(window._intvFiltered||[]);
  else renderInterviewsCalendar(window._intvFiltered||[]);
}
function intvCalMove(delta){
  const r=_intvCalRef;
  if(_intvView==='month') _intvCalRef=new Date(r.getFullYear(), r.getMonth()+delta, 1);
  else if(_intvView==='day') _intvCalRef=new Date(r.getFullYear(), r.getMonth(), r.getDate()+delta);
  else _intvCalRef=new Date(r.getFullYear(), r.getMonth(), r.getDate()+delta*7);
  renderInterviewsCalendar(window._intvFiltered||[]);
}
function intvCalToday(){ _intvCalRef=new Date(); renderInterviewsCalendar(window._intvFiltered||[]); }
function intvJumpTo(ds){ const p=ds.split('-'); _intvCalRef=new Date(+p[0],+p[1]-1,+p[2]); renderInterviewsCalendar(window._intvFiltered||[]); }

// Export scheduled interviews as a real .ics calendar file (Google/Outlook/Apple
// all import it). Replaces the old fake "Sync Calendar" toast.
function cntExportInterviewsICS(){
  const items=(getAllApplicants()||[]).filter(a=>a.stage==='interview'&&a.interviewDate);
  if(!items.length){ showToast('No scheduled interviews to export yet.','info'); return; }
  const pad=n=>String(n).padStart(2,'0');
  const at=(d,t,addHrs)=>{ const m=(t||'09:00').match(/^(\d{1,2}):(\d{2})/); let hh=m?+m[1]:9; const mm=m?+m[2]:0; if(addHrs) hh=(hh+addHrs)%24; return d.replace(/-/g,'')+'T'+pad(hh)+pad(mm)+'00'; };
  const esc=s=>String(s||'').replace(/([,;\\])/g,'\\$1').replace(/\r?\n/g,'\\n');
  const now=new Date(), stamp=now.getFullYear()+pad(now.getMonth()+1)+pad(now.getDate())+'T'+pad(now.getHours())+pad(now.getMinutes())+pad(now.getSeconds());
  let ics='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//CNT ATS//Interviews//EN\r\nCALSCALE:GREGORIAN\r\n';
  items.forEach(a=>{
    const desc=[a.interviewType?('Type: '+a.interviewType):'', a.interviewInterviewer?('Interviewer: '+a.interviewInterviewer):'', a.account?('Client: '+a.account):''].filter(Boolean).join('\n');
    ics+='BEGIN:VEVENT\r\n'
      +'UID:cnt-intv-'+esc(a.id)+'@cnt-ats\r\n'
      +'DTSTAMP:'+stamp+'\r\n'
      +'DTSTART:'+at(a.interviewDate,a.interviewTime,0)+'\r\n'
      +'DTEND:'+at(a.interviewDate,a.interviewTime,1)+'\r\n'
      +'SUMMARY:'+esc((a.interviewRound||'Interview')+' — '+a.name+(a.role?(' ('+a.role+')'):''))+'\r\n'
      +(desc?('DESCRIPTION:'+esc(desc)+'\r\n'):'')
      +(a.interviewVenue?('LOCATION:'+esc(a.interviewVenue)+'\r\n'):'')
      +'END:VEVENT\r\n';
  });
  ics+='END:VCALENDAR\r\n';
  const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'});
  const url=URL.createObjectURL(blob), link=document.createElement('a');
  link.href=url; link.download='cnt-interviews.ics'; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  showToast('Exported '+items.length+' interview'+(items.length!==1?'s':'')+' to calendar (.ics)','success');
}

function _localDateStr(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function _intvByDate(filtered){
  const by={};
  (filtered||[]).filter(a=>a.stage==='interview'&&a.interviewDate).forEach(a=>{ (by[a.interviewDate]=by[a.interviewDate]||[]).push(a); });
  return by;
}
// Assign overlapping same-day interviews to side-by-side lanes.
function _layoutDayEvents(evs){
  evs.sort((a,b)=>a.startMin-b.startMin||a.endMin-b.endMin);
  let cluster=[], curEnd=-1;
  const flush=()=>{ if(!cluster.length) return; const laneEnds=[];
    cluster.forEach(e=>{ let placed=false; for(let i=0;i<laneEnds.length;i++){ if(e.startMin>=laneEnds[i]){ e.lane=i; laneEnds[i]=e.endMin; placed=true; break; } } if(!placed){ e.lane=laneEnds.length; laneEnds.push(e.endMin); } });
    const n=laneEnds.length; cluster.forEach(e=>e.lanes=n); cluster=[]; curEnd=-1; };
  evs.forEach(e=>{ if(cluster.length && e.startMin>=curEnd) flush(); cluster.push(e); curEnd=Math.max(curEnd,e.endMin); });
  flush();
  return evs;
}

function renderInterviewsCalendar(filtered){
  const host=document.getElementById('interviews-calendar-container'); if(!host) return;
  filtered=_intvScopeApplied(filtered);
  if(_intvView==='month') return _renderIntvMonth(host, filtered);
  return _renderIntvTimeGrid(host, filtered, _intvView==='day'?1:7);
}

function _renderIntvMonth(host, filtered){
  const title=document.getElementById('intv-cal-title');
  const ref=_intvCalRef, y=ref.getFullYear(), m=ref.getMonth();
  if(title) title.textContent=new Date(y,m,1).toLocaleString('default',{month:'long',year:'numeric'});
  const byDate=_intvByDate(filtered);
  const todayStr=_localDateStr(new Date());
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

function _weekStart(d){ const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()); x.setDate(x.getDate()-x.getDay()); return x; }
function _miniMonthHtml(ref){
  const y=ref.getFullYear(), m=ref.getMonth();
  const first=new Date(y,m,1), startDow=first.getDay(), dim=new Date(y,m+1,0).getDate();
  const todayStr=_localDateStr(new Date()), selStr=_localDateStr(ref);
  let html='<div class="flex items-center justify-between mb-2"><button onclick="intvCalMove(-1)" class="text-slate-400 hover:text-slate-700 cursor-pointer"><span class="material-icons-outlined" style="font-size:16px;">chevron_left</span></button>'
    +'<span class="text-xs font-bold text-slate-700">'+new Date(y,m,1).toLocaleString('default',{month:'long',year:'numeric'})+'</span>'
    +'<button onclick="intvCalMove(1)" class="text-slate-400 hover:text-slate-700 cursor-pointer"><span class="material-icons-outlined" style="font-size:16px;">chevron_right</span></button></div>';
  html+='<div class="grid grid-cols-7 gap-0.5 text-center">';
  ['S','M','T','W','T','F','S'].forEach(d=>html+='<div class="text-[9px] font-bold text-slate-400 pb-1">'+d+'</div>');
  for(let i=0;i<startDow;i++) html+='<div></div>';
  for(let day=1;day<=dim;day++){ const ds=y+'-'+String(m+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
    const isToday=ds===todayStr, isSel=ds===selStr;
    html+='<button onclick="intvJumpTo(\''+ds+'\')" class="text-[10px] rounded-full w-6 h-6 mx-auto flex items-center justify-center cursor-pointer '+(isSel?'bg-red-800 text-white font-bold':isToday?'text-red-700 font-bold ring-1 ring-red-300':'text-slate-600 hover:bg-slate-100')+'">'+day+'</button>';
  }
  html+='</div>';
  return html;
}

function _renderIntvTimeGrid(host, filtered, nDays){
  const title=document.getElementById('intv-cal-title');
  const start = nDays===1 ? new Date(_intvCalRef.getFullYear(),_intvCalRef.getMonth(),_intvCalRef.getDate()) : _weekStart(_intvCalRef);
  const days=[]; for(let i=0;i<nDays;i++){ const d=new Date(start); d.setDate(start.getDate()+i); days.push(d); }
  if(title){
    if(nDays===1) title.textContent=days[0].toLocaleDateString('default',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
    else { const a=days[0], b=days[6], sameM=a.getMonth()===b.getMonth();
      title.textContent=a.toLocaleDateString('default',{month:'short',day:'numeric'})+' – '+b.toLocaleDateString('default',sameM?{day:'numeric',year:'numeric'}:{month:'short',day:'numeric',year:'numeric'}); }
  }
  const byDate=_intvByDate(filtered), todayStr=_localDateStr(new Date());
  const dow=['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const gridCols='48px repeat('+nDays+', minmax(0,1fr))';
  let header='<div class="grid" style="grid-template-columns:'+gridCols+';"><div></div>';
  days.forEach(d=>{ const today=_localDateStr(d)===todayStr;
    header+='<div class="text-center py-1.5 border-l border-slate-100"><div class="text-[10px] font-bold uppercase tracking-wide text-slate-400">'+dow[d.getDay()]+'</div>'
      +'<div class="text-sm font-bold mt-0.5">'+(today?'<span style="display:inline-flex;width:24px;height:24px;align-items:center;justify-content:center;border-radius:50%;background:#b91c1c;color:#fff;">'+d.getDate()+'</span>':'<span class="text-slate-700">'+d.getDate()+'</span>')+'</div></div>'; });
  header+='</div>';
  const hours=[]; for(let h=_DAY_START;h<=_DAY_END;h++) hours.push(h);
  const bodyH=(_DAY_END-_DAY_START)*_HOUR_PX;
  let gutter='<div style="position:relative;height:'+bodyH+'px;">';
  hours.forEach((h,i)=>{ gutter+='<div style="position:absolute;top:'+(i*_HOUR_PX-6)+'px;right:6px;font-size:10px;color:#94a3b8;white-space:nowrap;">'+fmtTime(String(h).padStart(2,'0')+':00').replace(':00','')+'</div>'; });
  gutter+='</div>';
  let cols='';
  days.forEach(d=>{
    const ds=_localDateStr(d);
    let inner='<div style="position:relative;height:'+bodyH+'px;" class="border-l border-slate-100">';
    hours.forEach((h,i)=>{ inner+='<div style="position:absolute;left:0;right:0;top:'+(i*_HOUR_PX)+'px;border-top:1px solid #f1f5f9;"></div>'; });
    const evs=(byDate[ds]||[]).map(a=>{ const t=(a.interviewTime||'').match(/^(\d{1,2}):(\d{2})/); const sh=t?+t[1]:9, sm=t?+t[2]:0; const startMin=Math.max(0,(sh-_DAY_START)*60+sm); return {a,startMin,endMin:startMin+60}; });
    _layoutDayEvents(evs);
    evs.forEach(e=>{ const acc=ACCOUNTS.find(x=>x.id===e.a.account), c=acc?.color||'#7f1d1d';
      const top=e.startMin/60*_HOUR_PX, hgt=Math.max(24,(e.endMin-e.startMin)/60*_HOUR_PX-2), w=100/(e.lanes||1), left=(e.lane||0)*w;
      inner+='<button onclick="openInterviewModal(\''+e.a.id+'\')" title="'+_escForm(e.a.name)+' · '+_escForm(e.a.interviewType||'Interview')+'" '
        +'style="position:absolute;top:'+top+'px;height:'+hgt+'px;left:calc('+left+'% + 2px);width:calc('+w+'% - 4px);background:'+c+'1a;border-left:3px solid '+c+';color:'+c+';border-radius:5px;padding:2px 5px;overflow:hidden;text-align:left;cursor:pointer;" class="hover:brightness-95">'
        +'<div style="font-size:10px;font-weight:700;line-height:1.15;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_escForm(e.a.name)+'</div>'
        +'<div style="font-size:9px;opacity:.85;overflow:hidden;white-space:nowrap;">'+(e.a.interviewTime?fmtTime(e.a.interviewTime):'')+(e.a.interviewType?' · '+_escForm(e.a.interviewType):'')+'</div></button>';
    });
    inner+='</div>'; cols+=inner;
  });
  const grid='<div class="grid" style="grid-template-columns:'+gridCols+';">'+gutter+cols+'</div>';
  const calHtml='<div class="overflow-x-auto"><div style="min-width:'+(nDays===1?300:660)+'px;">'+header+'<div class="overflow-y-auto custom-scroll" style="max-height:520px;">'+grid+'</div></div></div>';
  host.innerHTML='<div class="flex gap-4 items-start"><div class="flex-1 min-w-0">'+calHtml+'</div>'
    +'<div class="w-56 flex-none hidden lg:block bg-slate-50 rounded-xl p-3 border border-slate-100">'+_miniMonthHtml(_intvCalRef)+'</div></div>';
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
      <td class="px-4 py-3 font-bold text-slate-800 text-xs cursor-pointer hover:text-red-700" onclick="triggerResumeModal('${a.id}')">${_escForm(a.name)}</td>
      <td class="px-4 py-3"><span class="badge" style="background:${acc?.color||'#64748b'}18;color:${acc?.color||'#64748b'};border-color:${acc?.color||'#64748b'}30;font-size:10px;">${_escForm(a.account)}</span></td>
      <td class="px-4 py-3 text-xs text-slate-600">${_escForm(a.role)}</td>
      <td class="px-4 py-3 text-xs text-slate-400">${_escForm(a.location)}</td>
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
  const _hired=a=>typeof stageIsHired==='function'?stageIsHired(a.stage):['hired','onboarding'].includes(a.stage);
  rag.innerHTML=ACCOUNTS.map(acc=>{
    const all=accountData[acc.id]||[];
    const act=all.filter(a=>a.stage!=='pool'&&a.stage!=='rejected');
    const hiredN=all.filter(_hired).length; const conv=all.length?Math.round(hiredN/all.length*100):0;
    return `<div class="border border-slate-200 rounded-xl p-4">
      <div class="flex items-center gap-2 mb-3"><span class="w-2 h-2 rounded-full" style="background:${acc.color}"></span><span class="text-xs font-bold text-slate-800">${acc.label}</span><span class="ml-auto text-[10px] text-slate-400">${acc.sub}</span></div>
      <div class="text-2xl font-extrabold text-slate-900">${act.length}</div>
      <div class="text-[10px] text-slate-400 mt-0.5 mb-1">in pipeline</div>
      <div class="text-[10px] font-semibold text-emerald-600 mb-3">${hiredN} hired · ${conv}% conversion</div>
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
  cntRenderInsights();
}

// Deeper analytics: real time-to-hire, hire rate, interview pass rate, source-of-hire
// ROI and per-recruiter productivity — all computed from live data (no fake numbers).
function cntRenderInsights(){
  const all=getAllApplicants();
  const isHired=a=>typeof stageIsHired==='function'?stageIsHired(a.stage):['hired','onboarding'].includes(a.stage);
  const active=all.filter(a=>a.stage!=='pool'&&a.stage!=='rejected');
  const hires=all.filter(isHired);
  const _set=(id,v)=>{const el=document.getElementById(id); if(el) el.innerHTML=v;};
  // Time to hire: applied → earliest hire milestone, averaged over hires that have both dates
  const _hd=a=>a.deployed_at||a.newhire_reported_at||a.contract_signed_at||a.oriented_at||null;
  const spans=hires.map(a=>{ const hd=_hd(a); if(!a.appliedDate||!hd) return null; const d=(new Date(hd)-new Date(a.appliedDate))/86400000; return (isFinite(d)&&d>=0)?d:null; }).filter(x=>x!=null);
  const tth=spans.length?Math.round(spans.reduce((s,x)=>s+x,0)/spans.length):null;
  _set('kpi-tth', tth!=null?(tth+' <span class="text-sm font-semibold text-slate-400">days</span>'):'—');
  _set('kpi-tth-note', tth!=null?('from '+spans.length+' hire'+(spans.length!==1?'s':'')):'needs deployment dates');
  // Hire rate = hired ÷ active pipeline (active already includes hired-stage candidates)
  const hr=active.length?Math.round(hires.length/active.length*100):0;
  _set('kpi-hire-rate', hr+'<span class="text-sm font-semibold text-slate-400">%</span>');
  _set('kpi-hire-note', hires.length+' hired of '+active.length+' active');
  // Interview pass rate: advanced past interview ÷ reached interview
  const ivIdx=PIPELINE_STAGES.findIndex(s=>s.key==='interview');
  const idxOf=a=>PIPELINE_STAGES.findIndex(s=>s.key===normStage(a.stage));
  const reached=ivIdx<0?[]:all.filter(a=>a.stage!=='rejected'&&a.stage!=='pool'&&idxOf(a)>=ivIdx);
  const passed=ivIdx<0?[]:all.filter(a=>idxOf(a)>ivIdx);
  const pr=reached.length?Math.round(passed.length/reached.length*100):0;
  _set('kpi-interview-pass', pr+'<span class="text-sm font-semibold text-slate-400">%</span>');
  _set('kpi-interview-note', passed.length+' advanced of '+reached.length);
  _set('kpi-active', String(active.length));
  // Source performance (source-of-hire ROI)
  const srcEl=document.getElementById('insights-source-perf');
  if(srcEl){
    const m={}; all.forEach(a=>{ const s=a.source||'Unknown'; (m[s]=m[s]||{t:0,h:0}); m[s].t++; if(isHired(a)) m[s].h++; });
    const rows=Object.entries(m).sort((a,b)=>b[1].t-a[1].t);
    srcEl.innerHTML=rows.length?rows.map(([s,v])=>{ const c=v.t?Math.round(v.h/v.t*100):0;
      return '<div class="flex items-center gap-2"><span class="text-xs text-slate-600 w-24 font-medium truncate">'+_escForm(s)+'</span>'
        +'<div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-emerald-600 rounded-full" style="width:'+c+'%"></div></div>'
        +'<span class="text-[11px] font-bold text-slate-700 w-20 text-right">'+v.h+'/'+v.t+' · '+c+'%</span></div>'; }).join(''):'<p class="text-[11px] text-slate-400">No data yet.</p>';
  }
  // Recruiter productivity
  const recEl=document.getElementById('insights-recruiter');
  if(recEl){
    const m={}; all.forEach(a=>{ const r=(a.recruiter||'').trim()||'Unassigned'; (m[r]=m[r]||{a:0,h:0}); if(a.stage!=='pool'&&a.stage!=='rejected') m[r].a++; if(isHired(a)) m[r].h++; });
    const rows=Object.entries(m).sort((a,b)=>b[1].a-a[1].a);
    const max=Math.max(1,...rows.map(r=>r[1].a));
    recEl.innerHTML=rows.length?rows.map(([r,v])=>
      '<div class="flex items-center gap-2"><span class="text-xs text-slate-600 w-28 font-medium truncate">'+_escForm(r)+'</span>'
      +'<div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-indigo-600 rounded-full" style="width:'+Math.round(v.a/max*100)+'%"></div></div>'
      +'<span class="text-[11px] font-bold text-slate-700 w-24 text-right">'+v.a+' active · '+v.h+' hired</span></div>').join(''):'<p class="text-[11px] text-slate-400">No data yet.</p>';
  }
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
      <td class="px-4 py-2.5 font-bold text-slate-700 text-xs">${_escForm(r.id)}</td>
      <td class="px-4 py-2.5"><span class="badge" style="background:${acc?.color||'#64748b'}18;color:${acc?.color||'#64748b'};border-color:${acc?.color||'#64748b'}30;">${_escForm(r.account)}</span></td>
      <td class="px-4 py-2.5 text-xs font-semibold text-slate-800">${_escForm(r.role)}${r.client_submitted?` <span class="badge" style="background:#cffafe;color:#0e7490;font-size:9px;vertical-align:middle;">Client-submitted</span>`:''}${r.assigned_name?`<div class="text-[10px] text-slate-400 font-normal mt-0.5">→ ${_escForm(r.assigned_name)}</div>`:''}</td>
      <td class="px-4 py-2.5 text-xs text-slate-500">${_escForm(r.location)}</td>
      <td class="px-4 py-2.5 text-xs text-slate-500">${_escForm(r.type)}</td>
      <td class="px-4 py-2.5 text-center font-bold text-slate-700">${r.count}</td>
      <td class="px-4 py-2.5"><span class="priority-badge ${pColor}">${r.priority}</span></td>
      <td class="px-4 py-2.5"><span class="badge border ${sColor}">${r.status}</span></td>
      <td class="px-4 py-2.5 text-xs text-slate-400">${r.date}</td>
      <td class="px-4 py-2.5">${getCountdownChip(r.deadline)}</td>
      <td class="px-4 py-2.5 text-right">
        ${_canManageMRF()?`<select onchange="cntAssignRequest('${r.id}', this.value, this.value?this.options[this.selectedIndex].text:'')" class="text-[11px] border border-slate-200 rounded px-1 py-0.5 mr-2 align-middle bg-white"><option value="">Assign…</option>${(window.cntRecruiters||[]).map(u=>`<option value="${u.id}"${r.assigned_to===u.id?' selected':''}>${u.full_name||u.email}</option>`).join('')}</select>`:''}
        ${(_canManageMRF()&&r.status==='Pending')?`<button onclick="approveRequest('${r.id}')" class="text-emerald-700 hover:underline text-[11px] font-bold cursor-pointer mr-2">Approve</button>`:''}
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

// Résumé upload box on the add/edit applicant form: reflect the chosen file and
// enforce PDF / Word only, ≤5 MB (same limits as the public careers form).
function cntAppResumeReset(label){
  const t=document.getElementById('app-resume-text'), f=document.getElementById('app-resume-file');
  if(f) f.value='';
  if(t){ t.textContent=label||'Click to upload a PDF or Word document'; t.className='truncate '+(label&&label!=='Click to upload a PDF or Word document'?'text-slate-700 font-medium':'text-slate-500'); }
}
function cntAppResumePick(input){
  const t=document.getElementById('app-resume-text');
  const file=input&&input.files&&input.files[0];
  if(!file){ cntAppResumeReset(); return; }
  const ext=(file.name.split('.').pop()||'').toLowerCase();
  if(['pdf','doc','docx'].indexOf(ext)<0){ if(window.showToast) showToast('Résumé must be a PDF or Word (.doc/.docx) file.','error'); cntAppResumeReset(); return; }
  if(file.size>5*1048576){ if(window.showToast) showToast('Résumé is larger than 5 MB.','error'); cntAppResumeReset(); return; }
  if(t){ t.textContent=file.name+' ('+(file.size/1048576).toFixed(1)+' MB)'; t.className='truncate text-slate-700 font-medium'; }
}

function openCreateApplicationModal(){
  document.getElementById('crud-form').reset();
  document.getElementById('applicant-id').value='';
  document.getElementById('modal-title').textContent='Add Applicant';
  cntAppResumeReset();
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
  cntAppResumeReset(app.resumePath ? 'Résumé on file — choose a file to replace it' : '');
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
  // Fresh Odoo-style editor state: no skills/interviewers, published on, back to
  // the Recruitment tab, generic title.
  _jobSkills=[]; _jobInterviewers=[];
  cntJobSkillsRender(); cntJobInterviewersRender();
  cntJobSetPublished(true);
  cntJobSyncTitle();
  switchJobTab('recruitment');
  document.getElementById('job-modal').classList.remove('hidden');
}
function closeJobModal(){document.getElementById('job-modal').classList.add('hidden');}

// ── Odoo-style Job Position editor: tabs, title, published, skills, interviewers ──
function switchJobTab(tab){
  ['recruitment','description'].forEach(t=>{
    document.getElementById('job-tab-'+t)?.classList.toggle('hidden', t!==tab);
    document.getElementById('job-tab-btn-'+t)?.classList.toggle('active', t===tab);
  });
}
function cntJobSyncTitle(){
  const role=(document.getElementById('job-role')||{}).value||'';
  const el=document.getElementById('job-title-display'); if(el) el.textContent = role || 'New Job Position';
}
function cntJobSetPublished(on){
  const sw=document.getElementById('job-published'), lbl=document.getElementById('job-published-label');
  if(sw){ sw.dataset.on=on?'1':'0'; sw.setAttribute('aria-checked', on?'true':'false'); }
  if(lbl){ lbl.textContent=on?'Published':'Unpublished'; lbl.className='text-xs font-semibold w-20 '+(on?'text-emerald-700':'text-slate-400'); }
}
function cntJobTogglePublished(){ const sw=document.getElementById('job-published'); cntJobSetPublished(!(sw&&sw.dataset.on==='1')); }
function cntJobIsPublished(){ const sw=document.getElementById('job-published'); return !sw || sw.dataset.on==='1'; }

// Expected Skills — coloured, removable tags like Odoo.
let _jobSkills=[];
const _JOB_SKILL_COLORS=[['#6d28d9','#ede9fe'],['#047857','#d1fae5'],['#b45309','#fef3c7'],['#1d4ed8','#dbeafe'],['#be185d','#fce7f3'],['#0f766e','#ccfbf1']];
function cntJobSkillsRender(){
  const box=document.getElementById('job-skills-chips'), hid=document.getElementById('job-skills');
  if(hid) hid.value=_jobSkills.join(', ');
  if(box) box.innerHTML=_jobSkills.map((s,i)=>{ const c=_JOB_SKILL_COLORS[i%_JOB_SKILL_COLORS.length];
    return '<span class="cnt-chip" style="color:'+c[0]+';background:'+c[1]+';">'+_escForm(s)+'<span class="x" onclick="cntJobSkillRemove('+i+')">×</span></span>'; }).join('');
}
function cntJobSetSkills(str){ _jobSkills=String(str||'').split(',').map(s=>s.trim()).filter(Boolean); cntJobSkillsRender(); }
function cntJobSkillAdd(name){ name=String(name||'').trim(); if(name && !_jobSkills.some(s=>s.toLowerCase()===name.toLowerCase())){ _jobSkills.push(name); cntJobSkillsRender(); } }
function cntJobSkillRemove(i){ _jobSkills.splice(i,1); cntJobSkillsRender(); }
function cntJobSkillAddFromInput(){ const inp=document.getElementById('job-skills-input'); if(!inp) return; cntJobSkillAdd(inp.value); inp.value=''; inp.focus(); }
function cntJobSkillKey(e){ if(e.key==='Enter'||e.key===','){ e.preventDefault(); cntJobSkillAddFromInput(); } }

// Interviewers — staff avatar chips, sourced from the assignable team list.
let _jobInterviewers=[];
function _cntAvaColor(name){ const p=['#7f1d1d','#9a3412','#065f46','#1e40af','#5b21b6','#9d174d','#0f766e','#b45309']; let h=0; const s=String(name||''); for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return p[h%p.length]; }
function _cntInitials(name){ return String(name||'').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'?'; }
function cntJobInterviewersRender(){
  const box=document.getElementById('job-interviewers-chips'), hid=document.getElementById('job-interviewers');
  if(hid) hid.value=_jobInterviewers.join(', ');
  if(box) box.innerHTML=_jobInterviewers.map((n,i)=>'<span class="cnt-chip" style="color:#334155;background:#f1f5f9;"><span class="cnt-ava" style="background:'+_cntAvaColor(n)+';">'+_escForm(_cntInitials(n))+'</span>'+_escForm(n)+'<span class="x" onclick="cntJobInterviewerRemove('+i+')">×</span></span>').join('');
  cntJobFillInterviewerOptions();
}
function cntJobFillInterviewerOptions(){
  const sel=document.getElementById('job-interviewers-add'); if(!sel) return;
  const names=[]; (window.cntRecruiters||[]).forEach(u=>{ const n=u.full_name||u.email; if(n && names.indexOf(n)<0 && _jobInterviewers.indexOf(n)<0) names.push(n); });
  sel.innerHTML='<option value="">+ Add interviewer…</option>'+names.map(n=>'<option value="'+_escForm(n)+'">'+_escForm(n)+'</option>').join('');
  sel.value='';
}
function cntJobSetInterviewers(str){ _jobInterviewers=String(str||'').split(',').map(s=>s.trim()).filter(Boolean); cntJobInterviewersRender(); }
function cntJobInterviewerAdd(name){ name=String(name||'').trim(); if(name && _jobInterviewers.indexOf(name)<0){ _jobInterviewers.push(name); cntJobInterviewersRender(); } }
function cntJobInterviewerRemove(i){ _jobInterviewers.splice(i,1); cntJobInterviewersRender(); }
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
  if(wrap) wrap.classList.toggle('hidden', !_canManageMRF());
  document.getElementById('hiring-request-modal').classList.remove('hidden');
}
function closeHiringRequestModal(){document.getElementById('hiring-request-modal').classList.add('hidden');}
function handleHiringRequestSubmit(e){
  e.preventDefault();
  const req={id:'REQ-'+String(hiringRequests.length+1).padStart(3,'0'),account:document.getElementById('req-account').value,role:document.getElementById('req-role').value,location:document.getElementById('req-location').value,type:document.getElementById('req-type').value,count:parseInt(document.getElementById('req-count').value)||1,priority:document.getElementById('req-priority').value,status:'Pending',date:new Date().toISOString().split('T')[0],deadline:document.getElementById('req-deadline').value||'',requestor:document.getElementById('req-requestor').value,notes:document.getElementById('req-notes').value};
  // Only honour an assignment the role is actually allowed to make.
  const rec=_canManageMRF() ? ((document.getElementById('req-recruiter')||{}).value||'') : '';
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

// ── Profile tab bar = the pipeline stages (mirrors the stepper) ──────────
// Clicking a stage tab shows that stage's pane and, when it's FORWARD of the
// candidate's current stage, advances ("syncs") them to it. Clicking the current
// stage or an earlier one just VIEWS its pane — tabs never demote. To move a
// candidate backward (correct a mis-set stage) use the stage-badge override.
// Interview opens the scheduler and only advances on Confirm slot. The
// Pre-Employment checklist lives inside the Background Check stage.
const STAGE_TAB_ICONS  = { new:'person', interview:'event', exam:'quiz', bgcheck:'fact_check', hired:'workspace_premium', onboarding:'badge' };
const PROFILE_CONTENTS = ['profile','interview','checklist'];

// Which content pane a stage/tab key shows. Background Check surfaces the
// Pre-Employment checklist; Interview surfaces the scheduler; everything else
// shows the main profile pane.
function _profTabContentFor(key){
  if(key==='interview') return 'interview';
  if(key==='bgcheck' || key==='checklist') return 'checklist';
  return 'profile';
}

function _showProfileContent(name){
  activeProfileTab = name;
  // The profile (form + résumé + recruiter notes) is visible on EVERY tab. The
  // stage panes (interview scheduler / pre-employment checklist) stack above it
  // via flex order, so a tab just adds its stage-specific section on top.
  document.getElementById('tab-profile')?.classList.remove('hidden');
  document.getElementById('tab-interview')?.classList.toggle('hidden', name!=='interview');
  document.getElementById('tab-checklist')?.classList.toggle('hidden', name!=='checklist');
}
// Mark the tabs: the candidate's real current stage is always solid (.active);
// if the pane being VIEWED belongs to a different (earlier) stage, that tab gets
// an outline (.viewing) so it's clear you're looking back, not standing there.
function _setActiveProfileTabBtn(viewedKey){
  const bar=document.getElementById('profile-tabs'); if(!bar) return;
  bar.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active','viewing'));
  const toStage = k => k==='checklist' ? 'bgcheck' : k;   // Pre-Employment is the Background Check tab
  const app=findApplicant(currentViewedApplicantId);
  const curStage  = toStage(app ? normStage(app.stage) : 'new');
  const viewStage = toStage(viewedKey);
  document.getElementById('tab-btn-stage-'+curStage)?.classList.add('active');
  if(viewStage!==curStage) document.getElementById('tab-btn-stage-'+viewStage)?.classList.add('viewing');
}

// Build the tab bar from the live pipeline stages, highlight the applicant's
// current stage, and show the matching content pane.
function cntRenderProfileTabs(app){
  const bar=document.getElementById('profile-tabs'); if(!bar) return;
  const activeKey = app ? normStage(app.stage) : 'new';
  bar.innerHTML = PIPELINE_STAGES.map(s=>{
    const ic = STAGE_TAB_ICONS[s.key] || 'radio_button_unchecked';
    const label = _escForm(getStageName(s.key));
    return '<button class="tab-btn'+(s.key===activeKey?' active':'')+'" id="tab-btn-stage-'+_escForm(s.key)+'" onclick="gotoStageTab(\''+_escForm(s.key)+'\')">'
      +'<span class="material-icons-outlined align-middle mr-1" style="font-size:13px;">'+ic+'</span>'+label+'</button>';
  }).join('');
  _showProfileContent(_profTabContentFor(activeKey));
}

// Advancing a candidate is a real, forward-only decision, so confirm it first.
function _confirmStageMove(app,key){
  const name=app.name||'this candidate';
  if(key==='interview') return window.confirm('Schedule an interview for '+name+'?\n\nThey will move into the Interview stage once you confirm a slot.');
  return window.confirm('Move '+name+' to '+getStageName(key)+'?');
}

// Click handler for a stage tab.
function gotoStageTab(key){
  const app=findApplicant(currentViewedApplicantId); if(!app) return;
  const keys=PIPELINE_STAGES.map(s=>s.key);
  const cur=keys.indexOf(normStage(app.stage)), tgt=keys.indexOf(key);
  const forward = cur>=0 && tgt>cur;
  if(key==='interview'){
    // Interview tab opens the scheduler. It never demotes: the stage only advances
    // (via Confirm slot) when the candidate hasn't reached Interview yet. Confirm
    // first only when this is a forward move into the Interview stage.
    if(forward && !_confirmStageMove(app,'interview')) return;
    _showProfileContent('interview');
    _setActiveProfileTabBtn('interview');
    cntProfIntPopulate(app);
    const d=document.getElementById('prof-int-date'); if(d) setTimeout(()=>{ try{ d.focus(); }catch(e){} },200);
    return;
  }
  if(forward){
    // Forward — confirm, then advance ("sync"); the re-render lands on the pane.
    if(!_confirmStageMove(app,key)) return;
    updateApplicantStageFromModal(key);
    return;
  }
  // Current or earlier stage — just VIEW its pane (no demotion). Use the stage
  // badge's "Change stage" override to actually move a candidate backward.
  _showProfileContent(_profTabContentFor(key));
  _setActiveProfileTabBtn(key);
}

// Back-compat wrapper: callers pass a CONTENT name ('profile' | 'interview' | 'checklist').
function switchProfileTab(tab){
  if(tab==='checklist'){ _showProfileContent('checklist'); _setActiveProfileTabBtn('bgcheck'); return; }
  if(tab==='interview'){ _showProfileContent('interview'); _setActiveProfileTabBtn('interview'); return; }
  _showProfileContent('profile');
  const app=findApplicant(currentViewedApplicantId);
  _setActiveProfileTabBtn(app?normStage(app.stage):'new');
}

// ── Stage-badge override (escape hatch) ─────────────────────────────────
// The pipeline is forward-only, so the tabs/stepper won't demote a candidate.
// This dropdown by the stage badge sets the stage directly in EITHER direction
// so a recruiter can correct a mistake (e.g. someone advanced too far).
function cntRenderStageOverride(app){
  const sel=document.getElementById('resume-stage-override'); if(!sel||!app) return;
  const cur=normStage(app.stage);
  let html=PIPELINE_STAGES.map(s=>'<option value="'+_escForm(s.key)+'"'+(s.key===cur?' selected':'')+'>'+_escForm(getStageName(s.key))+'</option>').join('');
  ['pool','rejected'].forEach(k=>{ html+='<option value="'+k+'"'+(cur===k?' selected':'')+'>'+_escForm(getStageName(k))+'</option>'; });
  sel.innerHTML=html;
  sel.value=cur;
}
function cntStageOverride(newStage){
  if(!newStage) return;
  const id=currentViewedApplicantId; const app=findApplicant(id); if(!app) return;
  const norm=normStage(newStage);
  if(normStage(app.stage)===norm) return;
  // Direct set — bypasses the forward-only guard on purpose.
  if(typeof executeStageChange==='function') executeStageChange(id,norm);
  const fr=findApplicant(id);
  if(fr){
    const sb=document.getElementById('resume-stage-badge'); if(sb){ sb.textContent=getStageName(fr.stage); sb.className='badge border '+getStageBadge(fr.stage); }
    if(typeof cntRenderApplicantForm==='function') cntRenderApplicantForm(fr);
    if(typeof cntProfileExtras==='function') cntProfileExtras(fr);
  }
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
      <tr><td style="padding:3px 0;color:#64748b;width:160px;">Date:</td><td style="font-weight:700;color:#1e293b;">${_escForm(app.interviewDate)}</td></tr>
      <tr><td style="padding:3px 0;color:#64748b;">Time:</td><td style="font-weight:700;color:#1e293b;">${fmtTime(app.interviewTime)}</td></tr>
      <tr><td style="padding:3px 0;color:#64748b;">Type:</td><td style="font-weight:700;color:#1e293b;">${_escForm(app.interviewType||'—')}</td></tr>
      <tr><td style="padding:3px 0;color:#64748b;">Interviewer:</td><td style="font-weight:700;color:#1e293b;">${_escForm(app.interviewInterviewer||'—')}</td></tr>
      <tr><td style="padding:3px 0;color:#64748b;">Venue / Link:</td><td style="font-weight:700;color:#1e293b;">${_escForm(app.interviewVenue||'—')}</td></tr>
    </table>` : '<p style="font-size:12px;color:#94a3b8;margin:0 0 14px;">No interview scheduled yet.</p>'}
    <h2 style="font-family:Inter,sans-serif;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#7f1d1d;border-bottom:2px solid #7f1d1d;padding-bottom:3px;margin:0 0 8px;">Character Reference</h2>
    <p style="font-size:12px;color:#64748b;margin:0 0 14px;font-style:italic;">Available upon request.</p>
    <div style="border-top:1px solid #e2e8f0;margin-top:16px;padding-top:12px;font-size:11px;color:#94a3b8;text-align:center;font-style:italic;">
      I hereby certify that the above information is true and correct to the best of my knowledge and beliefs.<br>
      <strong style="color:#1e293b;font-style:normal;">${_escForm(app.name)}</strong>
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
      <div class="recruiter-note-avatar flex-shrink-0">${_escForm(String(c.author||'').split(' ').map(w=>w[0]).join('').slice(0,2))}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-[11px] font-bold text-slate-700">${_escForm(c.author)}</span>
          ${c.flagged?'<span class="badge bg-red-100 text-red-700 border-red-200"><span class="material-icons-outlined" style="font-size:10px;">flag</span> Flagged</span>':''}
          <span class="ml-auto text-[10px] text-slate-400">${_escForm(c.ts)}</span>
        </div>
        <p class="text-xs text-slate-600 leading-relaxed">${_escForm(c.text)}</p>
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
  const afterChange=()=>{
    const sb=document.getElementById('resume-stage-badge');
    if(sb){ sb.textContent=getStageName(newStage); sb.className='badge border '+getStageBadge(newStage); }
    const freshApp=findApplicant(currentViewedApplicantId);
    const st=PIPELINE_STAGES.find(s=>s.key===newStage);
    const isHired = st?st.is_hired:(newStage==='hired'||newStage==='onboarding');
    const offerBtn=document.getElementById('offer-letter-btn');
    const offerBox=document.getElementById('offer-summary-box');
    if(offerBtn&&offerBox){ if(isHired){ offerBtn.classList.remove('hidden');offerBox.classList.remove('hidden'); if(window.cntRenderOfferBox) cntRenderOfferBox(freshApp); } else { offerBtn.classList.add('hidden');offerBox.classList.add('hidden'); } }
    if(freshApp){ if(window.cntRenderApplicantForm) cntRenderApplicantForm(freshApp); if(window.cntProfileExtras) cntProfileExtras(freshApp); if(window.cntRefreshProfilePanels) cntRefreshProfilePanels(freshApp); }
  };
  // Interview scheduling is inline in the profile — move the stage and focus the
  // Interview Schedule panel instead of opening a separate popup.
  const norm=normStage(newStage);
  const nm=(typeof getStageName==='function'?getStageName(norm):'')||'';
  if(norm==='interview' || /interview/i.test(nm)){
    // Do NOT advance to Interview here — just open the scheduler. Confirming the
    // slot (cntProfInterviewSave) is what moves the candidate into the Interview
    // stage, so an unscheduled candidate stays in their current stage.
    if(typeof cntProfIntFocus==='function') cntProfIntFocus();
    return;
  }
  // Forward-only: candidates progress up the pipeline. Clicking an earlier stage
  // (tab or stepper) must not demote them — once a step is set they move forward.
  const _keys=PIPELINE_STAGES.map(s=>s.key);
  const _cur=_keys.indexOf(normStage(oldStage));
  const _tgt=_keys.indexOf(norm);
  if(_cur>=0 && _tgt>=0 && _tgt<_cur){
    if(window.showToast) showToast('Candidates move forward only — already at '+getStageName(oldStage)+'.','info');
    if(typeof cntRenderProfileTabs==='function') cntRenderProfileTabs(app); // resync tabs/content to the real stage
    return;
  }
  requestStageChange(currentViewedApplicantId,newStage, afterChange,
    ()=>{ const sel=document.getElementById('resume-stage-select'); if(sel) sel.value=oldStage; });
}

// ── Inline "Interview Schedule" panel in the applicant profile ──────────
// The schedule lives with the applicant (one dashboard) instead of a popup.
function _profIntPast(){
  const d=(document.getElementById('prof-int-date')||{}).value||'';
  let t=(document.getElementById('prof-int-time')||{}).value||'';
  if(!d) return false;
  if(!/^\d{2}:\d{2}/.test(t)) t='23:59';
  const when=new Date(d+'T'+t.slice(0,5));
  return !isNaN(when.getTime()) && when.getTime()<Date.now();
}
function cntProfIntPopulate(app){
  if(!app) return;
  const g=id=>document.getElementById(id);
  if(g('prof-int-date'))        g('prof-int-date').value=app.interviewDate||'';
  if(g('prof-int-time'))        g('prof-int-time').value=app.interviewTime||'';
  if(g('prof-int-round'))       g('prof-int-round').value=app.interviewRound||'Initial Interview';
  if(g('prof-int-kind'))        g('prof-int-kind').value=app.interviewType||'Phone Call';
  if(g('prof-int-interviewer')) g('prof-int-interviewer').value=app.interviewInterviewer||'';
  if(g('prof-int-venue'))       g('prof-int-venue').value=app.interviewVenue||'';
  const st=g('prof-int-status'); if(st){ st.textContent=''; }
  cntProfIntToggle();
}
function cntProfIntToggle(){
  const kind=(document.getElementById('prof-int-kind')||{}).value||'';
  const online=kind==='Video';
  const box=document.getElementById('prof-int-online'); if(box) box.style.display=online?'':'none';
  const label=document.getElementById('prof-int-venue-label');
  const input=document.getElementById('prof-int-venue');
  if(label) label.textContent = online?'Online meeting link' : (kind==='Phone Call'?'Contact number / notes':'Venue / office address');
  if(input) input.placeholder = online?'Paste or generate a video link' : (kind==='Phone Call'?'Number to call (optional)':'Office address');
  cntProfIntSync();
}
function cntProfIntSync(){
  const gen=document.getElementById('prof-int-gen');
  const venue=(document.getElementById('prof-int-venue')||{}).value||'';
  const past=_profIntPast(), hasLink=_isMeetUrl(venue);
  if(gen){ const lock=hasLink&&!past; gen.disabled=lock; gen.style.opacity=lock?'0.5':''; gen.style.cursor=lock?'not-allowed':'pointer';
    gen.title=lock?'A meeting link is set — regenerate after the scheduled time passes':'Create an instant online meeting room'; }
  const warn=document.getElementById('prof-int-warning');
  if(warn){ if(past){ warn.classList.remove('hidden'); warn.innerHTML='<span class="material-icons-outlined" style="font-size:13px;vertical-align:middle;margin-right:3px;">warning</span>The scheduled time has passed and this interview is still open. If the candidate didn’t attend, regenerate the link or reschedule, then move them forward or refuse.'; } else warn.classList.add('hidden'); }
}
function cntProfIntGen(){
  const venue=(document.getElementById('prof-int-venue')||{}).value||'';
  if(_isMeetUrl(venue) && !_profIntPast()){ if(window.showToast) showToast('A meeting link is already set. You can regenerate it after the scheduled time passes.','info'); return; }
  const id=String(currentViewedApplicantId||'').replace(/[^\w]/g,'');
  const rand=Math.random().toString(36).slice(2,8);
  document.getElementById('prof-int-venue').value='https://meet.jit.si/CNT-Interview-'+(id||'x')+'-'+rand;
  const k=document.getElementById('prof-int-kind'); if(k && k.value!=='Video'){ k.value='Video'; cntProfIntToggle(); }
  cntProfIntSync();
  if(window.showToast) showToast('Online meeting link generated','success');
}
function cntProfIntJoin(){
  const v=((document.getElementById('prof-int-venue')||{}).value||'').trim();
  if(/^https?:\/\//i.test(v)) window.open(v,'_blank','noopener');
  else if(window.showToast) showToast('No online meeting link set — press Generate or paste one','info');
}
function cntProfIntFocus(){
  // The interview scheduler lives in its own stage tab — surface it, then focus the date.
  if(typeof switchProfileTab==='function') switchProfileTab('interview');
  const app=findApplicant(currentViewedApplicantId); if(app) cntProfIntPopulate(app);
  const p=document.getElementById('prof-interview');
  if(p) p.scrollIntoView({behavior:'smooth',block:'center'});
  const d=document.getElementById('prof-int-date'); if(d) setTimeout(()=>{ try{ d.focus(); }catch(e){} },320);
}
function cntProfInterviewSave(){
  const id=currentViewedApplicantId; const app=findApplicant(id); if(!app) return;
  const date=(document.getElementById('prof-int-date')||{}).value||'';
  const time=(document.getElementById('prof-int-time')||{}).value||'';
  const round=(document.getElementById('prof-int-round')||{}).value||'Initial Interview';
  const type=(document.getElementById('prof-int-kind')||{}).value||'Phone Call';
  const interviewer=(document.getElementById('prof-int-interviewer')||{}).value||'';
  const venue=(document.getElementById('prof-int-venue')||{}).value||'';
  if(!date || !time){ if(window.showToast) showToast('Set an interview date and time first.','info'); return; }
  updateApplicant(id,{interviewDate:date,interviewTime:time,interviewType:type,interviewRound:round,interviewInterviewer:interviewer,interviewVenue:venue});
  const fresh=findApplicant(id);
  if(window.cntPersistInterview && fresh) cntPersistInterview(fresh,{interview_date:date,interview_time:time,interview_type:type,interview_round:round,interview_link:venue||null});
  if(window.cntLogActivity && fresh) cntLogActivity(fresh,'stage',round+' scheduled — '+type+(date?(' on '+date):''));
  // Move to the Interview stage if the candidate hasn't reached it yet.
  const cur=PIPELINE_STAGES.findIndex(s=>s.key===app.stage);
  const iv=PIPELINE_STAGES.findIndex(s=>s.key==='interview');
  if(iv>=0 && cur>=0 && cur<iv && typeof executeStageChange==='function') executeStageChange(id,'interview');
  const st=document.getElementById('prof-int-status'); if(st){ st.textContent='✓ Saved'; st.style.color='#166534'; }
  if(window.showToast) showToast('Interview scheduled for '+app.name,'success');
  renderAll();
  // Sync the stepper, the stage badge and the tab bar now the candidate is in Interview.
  const fr=findApplicant(id);
  if(fr){
    if(typeof cntRenderStageStepper==='function') cntRenderStageStepper(fr);
    const sb=document.getElementById('resume-stage-badge');
    if(sb){ sb.textContent=getStageName(fr.stage); sb.className='badge border '+getStageBadge(fr.stage); }
    if(typeof cntRenderProfileTabs==='function') cntRenderProfileTabs(fr);
    if(typeof cntProfileExtras==='function') cntProfileExtras(fr);
  }
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
    <p class="mb-2">Dear <strong>${_escForm(app.name)}</strong>,</p>
    <p class="mb-4">We are pleased to inform you that you have been selected for the position of <strong>${_escForm(app.role)}</strong> under our client account <strong>${_escForm(app.account)}</strong> assigned at <strong>${_escForm(app.location)}</strong>.</p>
    <div class="my-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl grid grid-cols-2 gap-4 text-center">
      <div><p class="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Position Offered</p><p class="text-base font-extrabold text-slate-900">${_escForm(app.role)}</p><p class="text-[11px] text-slate-500">${_escForm(app.account)} · ${_escForm(app.location)}</p></div>
      <div><p class="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Offer Amount</p><p class="text-base font-extrabold text-emerald-700">${_escForm(offerAmt)}</p><p class="text-[11px] text-slate-500">Monthly Basic Salary</p></div>
    </div>
    <p class="mb-2 font-semibold text-slate-800 border-b pb-1 border-slate-200">Terms of Employment</p>
    <table class="w-full text-sm mb-4" style="border-collapse:collapse;">
      <tr><td class="py-1 text-slate-500 w-40">Position:</td><td class="font-semibold">${_escForm(app.role)}</td></tr>
      <tr><td class="py-1 text-slate-500">Client Account:</td><td class="font-semibold">${_escForm(app.account)}</td></tr>
      <tr><td class="py-1 text-slate-500">Location:</td><td class="font-semibold">${_escForm(app.location)}</td></tr>
      <tr><td class="py-1 text-slate-500">Basic Salary:</td><td class="font-semibold">${_escForm(offerAmt)}</td></tr>
      <tr><td class="py-1 text-slate-500">Start Date:</td><td class="font-semibold">${_escForm(app.availability||app.startDate||'To be confirmed')}</td></tr>
      <tr><td class="py-1 text-slate-500">Offer Valid Until:</td><td class="font-semibold">${validUntil}</td></tr>
    </table>
    <p class="mb-4">This offer is subject to the submission of complete pre-employment requirements including NBI Clearance, Medical Certificate, SSS, PhilHealth, Pag-IBIG, TIN, PSA Birth Certificate, Diploma/TOR, and Barangay Clearance.</p>
    <p class="mb-6">Please confirm your acceptance of this offer by signing below and returning a copy to our office on or before <strong>${validUntil}</strong>.</p>
    <div class="grid grid-cols-2 gap-8 mt-8">
      <div><div class="border-b border-slate-400 mb-1 h-8"></div><p class="text-xs text-slate-500">HR Manager / Authorized Representative</p><p class="text-xs font-semibold">CNT Recruitment Services</p></div>
      <div><div class="border-b border-slate-400 mb-1 h-8"></div><p class="text-xs text-slate-500">Candidate's Signature</p><p class="text-xs font-semibold">${_escForm(app.name)} · Date:</p></div>
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
  toast.innerHTML=`<span class="material-icons-outlined" style="font-size:15px;">${icon}</span><span>${_escForm(msg)}</span>`;
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
