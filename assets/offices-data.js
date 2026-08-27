/* ── CNT offices — single source of truth for the directory + per-office pages ──
   To publish a satellite branch: fill its fields and set hasData:true. */
window.CNT_REGIONS = [
  { key:'main',     label:'Main Branch' },
  { key:'luzon',    label:'Luzon' },
  { key:'visayas',  label:'Visayas' },
  { key:'mindanao', label:'Mindanao' }
];

window.CNT_OFFICES = [
  {
    id:'mandaluyong', name:'Mandaluyong', role:'Head Office', region:'main', main:true, hasData:true,
    coords:[14.5774,121.0359],
    photos:[
      '/assets/img/lyfe-tower-5.jpg',
      '/assets/img/lyfe-tower-1.jpg',
      '/assets/img/OFFFICE-LOBBY.jpg',
      '/assets/img/POLARI-SUN.jpg',
      '/assets/img/HALL-SUN.jpg',
      '/assets/img/LOBBY-ESCALATOR.jpg'
    ],
    address:'219 LYFE Tower, Shaw Blvd. cor. E. Jacinto St., Brgy. Bagong Silang, 1550 Mandaluyong, Philippines',
    person:'',
    phone:'(02) 8293-5269', tel:'+63282935269',
    hours:'Monday – Friday: 8:30 AM – 6:30 PM\nSaturday: 8:30 AM – 3:00 PM',
    email:'hrdadmin@cntpromoads.com',
    emailNote:'Temporary — a dedicated branch email is coming soon.',
    maps:'https://maps.app.goo.gl/Ud5JvjJwZJmpBLyM7',
    mapq:'219 LYFE Tower, Shaw Blvd, Mandaluyong'
  },
  { id:'pangasinan', name:'Pangasinan',     role:'Satellite Branch', region:'luzon',    hasData:false, coords:[15.8949,120.2863] },
  { id:'isabela',    name:'Isabela',        role:'Satellite Branch', region:'luzon',    hasData:false, coords:[16.9754,121.8107] },
  { id:'bicol',      name:'Bicol',          role:'Satellite Branch', region:'luzon',    hasData:false, coords:[13.1391,123.7438] },
  { id:'iloilo',     name:'Iloilo',         role:'Satellite Branch', region:'visayas',  hasData:false, coords:[10.7202,122.5621] },
  { id:'cebu',       name:'Cebu',           role:'Satellite Branch', region:'visayas',  hasData:false, coords:[10.3157,123.8854] },
  { id:'tacloban',   name:'Tacloban',       role:'Satellite Branch', region:'visayas',  hasData:false, coords:[11.2543,125.0038] },
  { id:'davao',      name:'Davao',          role:'Satellite Branch', region:'mindanao', hasData:false, coords:[7.1907,125.4553] },
  { id:'cdo',        name:'Cagayan de Oro', role:'Satellite Branch', region:'mindanao', hasData:false, coords:[8.4542,124.6319] }
];
