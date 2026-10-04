(() => {
let W = 320, H = 180, GROUND = 150, insetX = 0, insetY = 0, hudLow = 0;
const $ = id => document.getElementById(id);
const cv = $('game'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
if (matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0) document.documentElement.classList.add('touch');
const isTouch = document.documentElement.classList.contains('touch');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = Math.random;

/* ---------- palette & sprites ---------- */
const PAL = {k:'#1d1f16', g:'#556b2f', G:'#7f9446', s:'#e2b07f', S:'#a8744c', b:'#3d2b1c', m:'#5a5d5f', M:'#9aa0a3',
  r:'#7e3a2c', R:'#ad5a3f', w:'#f1ead8', x:'#c9302c', y:'#f2c14e', o:'#e8772e', d:'#4a4f3a', D:'#6d735a',
  t:'#9c8a55', T:'#c4ae70', c:'#2b2f2a', C:'#454b43', n:'#2f3d5c', N:'#4a5d86', a:'#8a7a2c', A:'#c2a83c',
  v:'#5d6168', V:'#868b93', q:'#4a2230', Q:'#71334a', z:'#6fb0e0', Z:'#3d7fb3', e:'#8a2c8a', E:'#b54cb5',
  W:'#cfd3d6', j:'#1a1a22', J:'#4a4a5c', l:'#6fa04a', L:'#94c46a', p:'#4b3d5c', P:'#665480'};

function mk(rows, swap = {}) {
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  rows.forEach((r, j) => [...r].forEach((ch, i) => {
    if (ch === '.') return;
    ch = swap[ch] || ch;
    x.fillStyle = PAL[ch]; x.fillRect(i, j, 1, 1);
  }));
  const flip = src => { const f = document.createElement('canvas'); f.width = w; f.height = h; const fx = f.getContext('2d'); fx.translate(w, 0); fx.scale(-1, 1); fx.drawImage(src, 0, 0); return f; };
  const wc = document.createElement('canvas'); wc.width = w; wc.height = h;
  const wx = wc.getContext('2d'); wx.drawImage(c, 0, 0); wx.globalCompositeOperation = 'source-in'; wx.fillStyle = '#fff'; wx.fillRect(0, 0, w, h);
  return {r: c, l: flip(c), wr: wc, wl: flip(wc), w, h};
}

const TOP = [
  "....kkkk....",
  "...kGGGGk...",
  "..kgggggGk..",
  "....kssk....",
  "....ksk.....",
  "..kkggggk...",
  ".kgggGgmmmmm",
  ".kgGggkkk...",
  "..kggggk....",
  "..kgggk.....",
];
const TOP_UP = [
  "....kkkkm...",
  "...kGGGGm...",
  "..kgggggm...",
  "....ksskm...",
  "....ksk.m...",
  "..kkggggm...",
  ".kgggGggk...",
  ".kgGggkkk...",
  "..kggggk....",
  "..kgggk.....",
];
const LEGS = {
  idle: ["..kg.gk.....", "..kg.gk.....", ".kbb.bbk...."],
  w1:   ["..kgg.gk....", ".kg....gk...", "kbb....bbk.."],
  w2:   ["...kggk.....", "...kgk......", "..kbbk......"],
  jump: ["..kgggk.....", "..kg.kgk....", "..kb..kbk..."],
};
function soldierSet(swap, withUp = true) {
  const o = {p: {}, pu: {}};
  for (const k in LEGS) { o.p[k] = mk(TOP.concat(LEGS[k]), swap); if (withUp) o.pu[k] = mk(TOP_UP.concat(LEGS[k]), swap); }
  return o;
}

const ZTOP = [
  "....kkkk....",
  "...kLLLLk...",
  "..kLxlLxlk..",
  "..klllllLk..",
  "...kllllk...",
  "..kppppkkkkk",
  ".kpPppkLLLLk",
  ".kppppkkkkk.",
  "..kppppk....",
  "..kpppk.....",
];
const ZLEGS = {idle: ["..kp.pk.....", "..kl.lk.....", ".kll.llk...."], w1: ["..kpp.pk....", ".kl....lk...", "kll....llk.."], w2: ["...kppk.....", "...klk......", "..kllk......"]};
const ZOMB = {}, ZOMBF = {}; for (const k in ZLEGS) { ZOMB[k] = mk(ZTOP.concat(ZLEGS[k])); ZOMBF[k] = mk(ZTOP.concat(ZLEGS[k]), {p:'r', P:'R', l:'D', L:'l'}); }
const SPIDER_ROWS = [
  ["....kkkkkk....", "..kkeeeeeekk..", ".keEEeeeeEEek.", "kkexkxeeeeeekk", "k.kkkkkkkkkk.k", "k.k.k....k.k.k", "..k.k....k.k.."],
  ["....kkkkkk....", "..kkeeeeeekk..", ".keEEeeeeEEek.", "kkexkxeeeeeekk", ".kkkkkkkkkkkk.", "k..k.k..k.k..k", ".k..k....k..k."],
];
const SPIDER = SPIDER_ROWS.map(r => mk(r));
const CRAWLER = SPIDER_ROWS.map(r => mk(r, {e:'l', E:'L', x:'z'}));
const GSPIDER = SPIDER_ROWS.map(r => mk(r, {e:'t', E:'T'}));
const QUEEN = SPIDER_ROWS.map(r => mk(r, {e:'q', E:'x'}));
const UFO = mk([
  ".......kkkkkk.......",
  "......kzzzzzzk......",
  ".....kzwwzzzzzk.....",
  "..kkkkkkkkkkkkkkkk..",
  ".kMMMMMMMMMMMMMMMMk.",
  "kmmymmmmymmmmymmmmmk",
  ".kkmmmmmmmmmmmmmmkk.",
  "...kkkkkkkkkkkkkk...",
]);
const BAT = [
  mk(["k............k", "kk....kk....kk", "kqk..kqqk..kqk", "kqqkkqxqxkkqqk", ".kqqqqqqqqqqk.", "..kk..kk..kk.."]),
  mk(["......kk......", ".....kqqk.....", "..kkkqxqxkkk..", ".kqqqqqqqqqqk.", "kqqkk.kk.kkqqk", "kk..........kk"]),
];
const SLIME = mk(["...kkkk...", "..kLLLLk..", ".kLlllllk.", "kLlkllklLk", "kllllllllk", "kllllllllk", ".kkkkkkkk."]);
const TANK = mk([
  "............kkkkk.......",
  "kkkkkkkkkkkkRRRRRk......",
  "MMMMMMMMMMMkRrRRRRk.....",
  "kkkkkkkkkkkkRRRRRRk.....",
  "........kkkkkkkkkkkkk...",
  ".......kRRRRRRRRRRRRRk..",
  "......kRRrRRRRRRRRrRRRk.",
  ".....kkkkkkkkkkkkkkkkkkk",
  ".....kmMmkmMmkmMmkmMmkk.",
  ".....kMmMkMmMkMmMkMmMk..",
  "......kkkkkkkkkkkkkkkk..",
]);
const BOSS = mk([
  "............kkkkk.......",
  "kkkkkkkkkkkkQQQQQk......",
  "MMMMMMMMMMMkQqQQQQk.....",
  "kkkkkkkkkkkkQQQQQQk.....",
  "........kkkkkkkkkkkkk...",
  ".......kQQQQQQQQQQQQQk..",
  "......kQQqQQyQQQQQqQQQk.",
  ".....kkkkkkkkkkkkkkkkkkk",
  ".....kmMmkmMmkmMmkmMmkk.",
  ".....kMmMkMmMkMmMkMmMk..",
  "......kkkkkkkkkkkkkkkk..",
]);
const PLANE_ROWS = [
  "...............kk...",
  "..............kRk...",
  "..kkkkkkkkkkkkRRk...",
  ".kwRRRRRRRRRRRRRkk.k",
  "kRRRRRRRRRRRRRRRRRkk",
  ".kkkkkRRRRkkkkkkkkk.",
  "......kRRk..........",
  ".......kk...........",
];
const PLANE = mk(PLANE_ROWS), ALLY = mk(PLANE_ROWS, {R:'G', w:'z'});
const POW_ROWS = ["..kkk..", ".kiiik.", "kiiwiik", "kiwwwik", "kiiwiik", ".kiiik.", "..kkk.."];
const POW = {rapid: mk(POW_ROWS, {i:'o'}), double: mk(POW_ROWS, {i:'x'}), shield: mk(POW_ROWS, {i:'z'})};
const POW_NAME = {rapid:'Hızlı atış!', double:'Çift hasar!', shield:'+1 zırh'};
const HEART = mk([".kk.kk.", "kxxkxxk", "kxxxxxk", ".kxxxk.", "..kxk..", "...k..."]);
const HEART0 = mk([".kk.kk.", "kddkddk", "kdddddk", ".kdddk.", "..kdk..", "...k..."]);
const ARMOR = mk([".kkkk.", "kzzzZk", "kzzzZk", "kzzZZk", ".kZZk.", "..kk.."]);
const GREN = mk(["..k..", ".kmk.", "kgggk", "kgGgk", "kgggk", ".kkk."]);
const MED = mk(["kkkkkkkk", "kwwxxwwk", "kwwxxwwk", "kxxxxxxk", "kwwxxwwk", "kwwxxwwk", "kkkkkkkk"]);
const CRATE = mk(["kkkkkkkk", "kDddddDk", "kdkDDkdk", "kdDggDdk", "kdkDDkdk", "kDddddDk", "kkkkkkkk"]);

/* ---------- weapons, soldiers, enemies ---------- */
const WEAPONS = [
  {id:'rifle', name:'Tüfek', price:0, cd:10, dmg:1, spd:4.8, n:1, spread:0.12, life:90, desc:'Dengeli ve güvenilir. Her askerin ilk silahı.',
   icon:["kkk...........", "kbbkkkkkkkkkkk", "kbbbmmmmmmmmMk", ".kkkkmkkkkkkk.", ".....kk......."]},
  {id:'smg', name:'Makineli', price:150, cd:5, dmg:1, spd:5, n:1, spread:0.55, life:70, desc:'İki kat hızlı atış, biraz dağınık.',
   icon:["....kkkkkkk.", "kkkkmmmmmmMk", "kbbbmmmkkkk.", ".kkkkmk.....", "....kmk.....", "....kk......"]},
  {id:'shotgun', name:'Pompalı', price:300, cd:30, dmg:1, spd:4.2, n:6, spread:1.1, life:24, desc:'Altı saçma birden. Yakın mesafede yıkıcı.',
   icon:["kkk.............", "kbbkkkkkkkkkkkkk", "kbbbbmmmmmmmmmMk", ".kkkkbbbkkkkkkk.", ".......kk......."]},
  {id:'sniper', name:'Keskin Nişancı', price:450, cd:40, dmg:7, spd:9, n:1, spread:0, life:60, pierce:true, desc:'Sıradaki herkesi delip geçen ağır mermi.',
   icon:[".......kkkk.......", "kkk...kMmmMk......", "kbbkkkkkkkkkkkkkkk", "kbbbmmmmmmmmmmmmMk", ".kkkkmkkkkkkkkkkk."]},
  {id:'rocket', name:'Roketatar', price:700, cd:55, dmg:6, spd:3.2, n:1, spread:0, life:130, rocket:true, desc:'Çarptığı yerde patlar, kalabalığı dağıtır.',
   icon:["................kk", "kkkkkkkkkkkkkkkkok", "kGGGGGGGGGGGGGGGyk", "kgggggggggggggggok", "kkkkkkmkkkkkkkkkkk", "......kk.........."]},
  {id:'flame', name:'Alev Silahı', price:550, cd:3, dmg:0.2, spd:3, n:2, spread:0.8, life:22, pierce:true, flame:true, desc:'Kısa menzilli alev seli. Önündeki herkesi yakar.',
   icon:["kkk.............", "kxxk............", "kxxkkkkkkkkkkkk.", "kxxkmmmmmmmmmmMk", "kxxkkkkmkkkkkkk.", "kkk....kk......."]},
  {id:'glauncher', name:'Bomba Atar', price:800, cd:34, dmg:5, spd:3.4, n:1, spread:0, life:200, rocket:true, lob:true, desc:'Kavisli giden bombalar, siperin arkasına bile düşer.',
   icon:["....kkkkkkkkk...", "kkkkbbbbbbbbbkk.", "kbbbbkkkkkbbbbMk", "kbbbbkmmmkbbbbMk", ".kkkkkkkkkkkkkk.", "......kk........"]},
  {id:'plasma', name:'Plazma Tüfeği', price:900, cd:14, dmg:3, spd:7, n:1, spread:0, life:70, pierce:true, plasma:true, desc:'Parlayan enerji mermisi, delip geçer ve ağır vurur.',
   icon:["......kkkkkk......", "kkkkkkzzzzzzkkkk..", "kbbbkZzzzzzZkmmmzk", "kbbbkkkkkkkkkkkkk.", ".kkk...kk........."]},
  {id:'minigun', name:'Minigun', price:1100, cd:4, dmg:0.7, spd:5.5, n:1, spread:0.7, life:80, desc:'Durmadan kurşun yağdırır. Ateş ederken yavaş yürürsün.',
   icon:["..kkkkkkkkkkkkkkk.", ".kmMmMmMmMmMmMmMMk", "kkmmmmmmmmmmmmmmmk", "kbkmMmMmMmMmMmMMk.", "kbbkkkkkkkkkkkkk..", ".kk..kk..........."]},
];
WEAPONS.forEach(w => w.spr = mk(w.icon));
const MZ = {rifle: 12, smg: 12, shotgun: 13, sniper: 16, rocket: 16, flame: 14, glauncher: 14, plasma: 14, minigun: 15};

const CHARS = [
  {id:'ali', name:'Er Ali', price:0, hp:5, spd:1.25, jump:4.3, gren:3, gold:1, swap:{}, desc:'Dengeli asker. 5 can.'},
  {id:'zeynep', name:'Çavuş Zeynep', price:300, hp:4, spd:1.6, jump:4.9, gren:3, gold:1, swap:{g:'t', G:'T'}, desc:'Çok hızlı koşar, yüksek zıplar. 4 can.'},
  {id:'kara', name:'Komando Kara', price:500, hp:7, spd:1.1, jump:4.1, gren:5, gold:1, swap:{g:'c', G:'C', s:'S'}, desc:'7 can ve 5 el bombası. Biraz yavaş.'},
  {id:'demir', name:'Yüzbaşı Demir', price:650, hp:5, spd:1.3, jump:4.3, gren:3, gold:1.5, swap:{g:'n', G:'N'}, desc:'Her düşmandan %50 fazla altın kazanır.'},
  {id:'selin', name:'Nişancı Selin', price:800, hp:4, spd:1.3, jump:4.4, gren:3, gold:1, dmg:1.3, swap:{g:'e', G:'E'}, desc:'Bütün silahlarla %30 fazla hasar verir. 4 can.'},
  {id:'emre', name:'Sıhhiyeci Emre', price:900, hp:5, spd:1.25, jump:4.3, gren:3, gold:1, regen:true, swap:{g:'W', G:'w'}, desc:'Her 20 saniyede bir canı kendiliğinden yenilenir.'},
  {id:'kaan', name:'Ninja Kaan', price:1000, hp:3, spd:1.8, jump:5, gren:4, gold:1, doubleJump:true, swap:{g:'J', G:'x'}, desc:'Havada ikinci kez zıplar ve en hızlı asker. 3 can.'},
  {id:'t9', name:'Robot T-9', price:1500, hp:9, spd:1.05, jump:4, gren:3, gold:1, dmg:1.1, swap:{g:'m', G:'M', s:'z'}, desc:'9 can ve çelik gövde. Yavaş ama çok dayanıklı.'},
];
const SPRC = {}; CHARS.forEach(c => SPRC[c.id] = soldierSet(c.swap));
const ESPR = {
  inf: soldierSet({g:'r', G:'R'}, false).p,
  runner: soldierSet({g:'a', G:'A'}, false).p,
  sniper: soldierSet({g:'v', G:'V'}, false).p,
  heavy: soldierSet({g:'q', G:'Q', s:'S'}, false).p,
};
const ESPR_SPACE = {
  inf: soldierSet({g:'e', G:'E', s:'l', b:'p'}, false).p,
  runner: soldierSet({g:'e', G:'E', s:'l', b:'p'}, false).p,
  sniper: soldierSet({g:'Z', G:'z', s:'l', b:'p'}, false).p,
  heavy: soldierSet({g:'q', G:'Q', s:'l', b:'j'}, false).p,
};
const SOLDIER_TYPES = new Set(['inf', 'runner', 'sniper', 'heavy']);
const MONSTERS = new Set(['zombie', 'zfast', 'spider', 'gspider', 'bat', 'slime', 'kaiju', 'queen']);
const BOSSES = new Set(['boss', 'kaiju', 'queen', 'mother']);
const BOSS_NAME = {boss: 'Dev Tank', kaiju: 'Dev Canavar', queen: 'Örümcek Kraliçe', mother: 'Ana Gemi'};
const MODES = [
  {id:'normal', name:'Normal', desc:'Askerler, tanklar, uçaklar. 6. dalgadan sonra canavarlar.'},
  {id:'zombie', name:'Zombi Modu', desc:'Mezarlıkta bitmeyen zombi sürüleri ve koşan zombiler.'},
  {id:'space', name:'Uzay Modu', desc:'Ay yüzeyi, düşük yerçekimi, uzaylılar, UFOlar ve Ana Gemi.'},
  {id:'spider', name:'Dev Örümcekler', desc:'Örümcek mağarası, dev örümcekler ve ağ atan Kraliçe.'},
];
const curMode = () => MODES.find(m => m.id === save.mode) || MODES[0];
const net = {role: null, peer: null, conn: null, events: [], mode: null, code: null, sent: 0};
const curModeId = () => (net.role === 'guest' && net.mode) ? net.mode : save.mode;
const inSpace = () => curModeId() === 'space';
const modeMapFor = n => ({zombie: 4, space: 5, spider: 6})[curModeId()] ?? Math.floor((n - 1) / 3) % 4;
const REWARD = {inf:[100, 6], runner:[80, 5], sniper:[150, 9], heavy:[250, 14], tank:[500, 25], plane:[300, 15], boss:[3000, 150],
  zombie:[150, 8], spider:[150, 8], bat:[120, 7], slime:[180, 10], kaiju:[5000, 250],
  zfast:[120, 7], gspider:[300, 16], queen:[5000, 250], mother:[5000, 250]};

/* ---------- maps ---------- */
const MAPS = [
  {name:'Gün Batımı Şehri', sky:['#2b2342','#43294a','#66324a','#8f3f45','#b9543f','#d9743f','#eb9a4c'], sun:'#f6c56a', sunBand:'#eb9a4c',
   hills:['#6a2f40','#4c2536'], sil:'city', silC:'#2e1f2c', notch:'#4c2536', win:'#e8772e', winDark:'#1f1520', winP:.14,
   ground:['#4b3a2a','#7a6440','#5d4830','#3a2d20','#65503a'], lip:'#6e5638', post:'#2a1f18', wire:'#9a948a', stars:26, amb:'smoke', smoke:['#3a2a33','#4a3640']},
  {name:'Çöl Üssü', sky:['#2f6aa3','#3f7fb8','#5a93c4','#77a8cf','#97bdd8','#bfd3dc','#e3dcc4'], sun:'#fff6d8', sunBand:null,
   hills:['#d1ad74','#bf9860'], sil:'mesa', silC:'#a8703f', silTop:'#c98d55', silStripe:'#955f33',
   ground:['#d2a86c','#ecd09c','#dfbb82','#b38a55','#e8cf9f'], lip:'#c49a60', post:'#5a3d22', wire:'#6d6559', stars:0, amb:'sand'},
  {name:'Karlı Orman', sky:['#4d6384','#5d7496','#6f86a6','#8398b5','#98acc4','#b3c3d6','#d3dde9'], sun:'#f4f7fb', sunBand:'#e4ebf3',
   hills:['#9fb0c6','#8497b0'], sil:'pines', silC:'#2e453c', snow:'#f2f6fa',
   ground:['#dfe7ef','#ffffff','#eef3f8','#b9c6d3','#c9d5e1'], lip:'#ffffff', post:'#3a2d22', wire:'#6d7580', stars:0, amb:'snow'},
  {name:'Gece Şehri', sky:['#05060f','#090b1c','#0e112a','#141836','#1a1f42','#20274d','#262f58'], sun:'#ece8cf', moon:true,
   hills:['#1c2040','#151833'], sil:'city', silC:'#0c0d1a', notch:'#151833', win:'#f2c14e', winDark:'#07070f', winP:.3,
   ground:['#2b2a2e','#4a474d','#38363b','#1f1e22','#454248'], lip:'#4a474d', post:'#111114', wire:'#6c6a70', stars:90, amb:'smoke', smoke:['#1b1c2c','#26273a']},
  {name:'Mezarlık', sky:['#0d0a14','#140f1f','#1c142a','#231a33','#2b213b','#342a44','#3e344d'], sun:'#d8e3b0', moon:true,
   hills:['#241c2e','#1b1524'], sil:'graves', silC:'#120e18', stone:'#3a3446',
   ground:['#2a2a22','#3f4a30','#343c29','#1f1f19','#4a5438'], lip:'#3f4a30', post:'#111114', wire:'#4f4a55', stars:40, amb:'fog'},
  {name:'Ay Yüzeyi', sky:['#020206','#04040c','#060612','#080818','#0a0a1e','#0c0c24','#0e0e2a'], sun:'#ffffff', planet:true,
   hills:['#3a3a44','#2c2c34'], sil:'moonrock', silC:'#1e1e26',
   ground:['#8a8a92','#b4b4bc','#9c9ca4','#6a6a72','#a6a6ae'], lip:'#c4c4cc', noWire:true, stars:160, amb:'none'},
  {name:'Örümcek Mağarası', sky:['#0a0806','#110d0a','#18130e','#1f1812','#261d16','#2d231a','#35291e'], sun:'#000', noSun:true,
   hills:['#2a2018','#221a13'], sil:'cave', silC:'#140f0a', web:'#b8b0a4',
   ground:['#3a2e22','#55442f','#473928','#2a2118','#5e4b35'], lip:'#55442f', noWire:true, stars:0, amb:'dust'},
];
let mapIdx = 0;

/* ---------- background ---------- */
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const bg = document.createElement('canvas');
function buildBg() {
  bg.width = W; bg.height = H;
  const b = bg.getContext('2d'), R = rng(7 + mapIdx * 131), O = GROUND - 150, m = MAPS[mapIdx], sunX = Math.round(W * 0.74);
  const cols = m.sky, edges = [0, 18 + O, 36 + O, 54 + O, 70 + O, 84 + O, 96 + O, GROUND];
  cols.forEach((c, i) => { b.fillStyle = c; b.fillRect(0, edges[i], W, edges[i + 1] - edges[i]); });
  for (let i = 1; i < cols.length; i++) for (let x = 0; x < W; x++) {
    if (x % 2 === 0) { b.fillStyle = cols[i]; b.fillRect(x, edges[i] - 1, 1, 1); }
    else { b.fillStyle = cols[i - 1]; b.fillRect(x, edges[i], 1, 1); }
  }
  for (let i = 0; i < m.stars + (m.stars ? O / 3 : 0); i++) { b.fillStyle = rand() < 0.2 ? '#f6d38a' : '#f1ead8'; b.fillRect(Math.floor(R() * W), Math.floor(R() * (40 + O)), 1, 1); }
  if (m.planet) {
    const px = Math.round(W * 0.78), py = 34 + Math.round(O * 0.5);
    for (let y = -14; y <= 14; y++) { const hw = Math.floor(Math.sqrt(196 - y * y)); b.fillStyle = '#3d7fb3'; b.fillRect(px - hw, py + y, hw * 2, 1); }
    b.fillStyle = '#6fa04a'; b.fillRect(px - 8, py - 6, 7, 5); b.fillRect(px + 2, py + 2, 8, 6); b.fillRect(px - 4, py + 6, 4, 3);
    b.fillStyle = '#f1ead8'; b.fillRect(px - 10, py - 11, 10, 2); b.fillRect(px + 4, py - 4, 6, 1);
  } else if (m.noSun) {
  } else if (m.moon) {
    const mx = Math.round(W * 0.22), my = 34 + Math.round(O * 0.6);
    b.fillStyle = m.sun;
    for (let y = -9; y <= 9; y++) { const hw = Math.floor(Math.sqrt(81 - y * y)); b.fillRect(mx - hw, my + y, hw * 2, 1); }
    b.fillStyle = '#c9c4ab'; b.fillRect(mx - 3, my - 3, 3, 2); b.fillRect(mx + 2, my + 2, 2, 2); b.fillRect(mx - 5, my + 3, 2, 1);
  } else {
    b.fillStyle = m.sun;
    for (let y = -15; y <= 15; y++) { const hw = Math.floor(Math.sqrt(225 - y * y)); b.fillRect(sunX - hw, 96 + O + y - (m.sunBand ? 0 : 40), hw * 2, 1); }
    if (m.sunBand) { b.fillStyle = m.sunBand; for (let y = 88 + O; y < 112 + O; y += 4) b.fillRect(sunX - 16, y, 32, 1); }
  }
  b.fillStyle = m.hills[0];
  for (let x = 0; x < W; x++) { const y = Math.floor(98 + O + Math.sin(x * 0.028) * 6 + Math.sin(x * 0.011 + 1) * 7); b.fillRect(x, y, 1, GROUND - y); }
  b.fillStyle = m.hills[1];
  for (let x = 0; x < W; x++) { const y = Math.floor(112 + O + Math.sin(x * 0.05 + 2) * 4 + Math.sin(x * 0.017) * 5); b.fillRect(x, y, 1, GROUND - y); }

  if (m.sil === 'city') {
    let x = -4;
    while (x < W) {
      const bw = 12 + Math.floor(R() * 22), bh = 14 + Math.floor(R() * 28), top = GROUND - 12 - bh;
      b.fillStyle = m.silC; b.fillRect(x, top, bw, GROUND - top);
      b.fillStyle = m.notch;
      for (let n = 0; n < 3; n++) b.fillRect(x + Math.floor(R() * bw), top, 2 + Math.floor(R() * 5), 2 + Math.floor(R() * 7));
      for (let wy = top + 5; wy < GROUND - 14; wy += 6) for (let wx = x + 3; wx < x + bw - 3; wx += 5) {
        const r = R(); if (r < m.winP) { b.fillStyle = m.win; b.fillRect(wx, wy, 2, 2); } else if (r < 0.5) { b.fillStyle = m.winDark; b.fillRect(wx, wy, 2, 3); }
      }
      x += bw + Math.floor(R() * 10);
    }
  } else if (m.sil === 'mesa') {
    let x = -10 - Math.floor(R() * 20);
    while (x < W + 10) {
      const w = 26 + Math.floor(R() * 40), h = 14 + Math.floor(R() * 26), top = GROUND - 8 - h;
      for (let r = 0; r < h + 8; r++) {
        const inset = r < 2 ? 2 - r : 0, flare = Math.max(0, r - h);
        b.fillStyle = r < 2 ? m.silTop : m.silC; b.fillRect(x + inset - flare, top + r, w - inset * 2 + flare * 2, 1);
      }
      b.fillStyle = m.silStripe; for (let s = top + 5; s < GROUND - 8; s += 5) b.fillRect(x + 2, s, w - 4, 1);
      x += w + 12 + Math.floor(R() * 34);
    }
    for (let i = 0; i < 4; i++) {
      const px = Math.floor(R() * W), ph = 10 + Math.floor(R() * 9);
      b.fillStyle = '#5a3d22'; for (let j = 0; j < ph; j++) b.fillRect(px + Math.floor(j / 6), GROUND - j, 1, 1);
      const tx = px + Math.floor(ph / 6), ty = GROUND - ph;
      b.fillStyle = '#4f6b2a';
      [[-4,1],[-3,0],[-2,-1],[-1,-1],[0,-1],[1,-1],[2,-1],[3,0],[4,1],[-5,2],[5,2],[-1,0],[1,0],[0,0]].forEach(([dx, dy]) => b.fillRect(tx + dx, ty + dy, 1, 1));
    }
  } else if (m.sil === 'pines') {
    let x = -6;
    while (x < W + 6) {
      const h = 16 + Math.floor(R() * 26), top = GROUND - 6 - h, cx = x;
      for (let r = 0; r < h; r++) {
        const hw = 1 + Math.floor(r * 0.42);
        b.fillStyle = r < 2 ? m.snow : (r % 7 === 0 ? m.snow : m.silC);
        b.fillRect(cx - hw, top + r, hw * 2 + 1, 1);
      }
      b.fillStyle = '#2a1f18'; b.fillRect(cx - 1, GROUND - 6, 3, 6);
      x += 6 + Math.floor(R() * 12);
    }
  } else if (m.sil === 'graves') {
    for (let i = 0; i < 5; i++) {
      const tx = Math.floor(R() * W), th = 18 + Math.floor(R() * 16);
      b.fillStyle = m.silC; b.fillRect(tx, GROUND - th, 2, th);
      for (let j = 0; j < 4; j++) { const by = GROUND - th + 2 + Math.floor(R() * (th - 6)), dir = R() < 0.5 ? -1 : 1, len = 4 + Math.floor(R() * 7); for (let k = 0; k < len; k++) b.fillRect(tx + dir * k, by - Math.floor(k / 2), 1, 1); }
    }
    let x = 0;
    while (x < W) {
      const w = 5 + Math.floor(R() * 4), h = 6 + Math.floor(R() * 7), top = GROUND - h;
      b.fillStyle = m.stone; b.fillRect(x, top + 1, w, h - 1); b.fillRect(x + 1, top, w - 2, 1);
      b.fillStyle = m.silC; b.fillRect(x + Math.floor(w / 2), top + 2, 1, 3); b.fillRect(x + Math.floor(w / 2) - 1, top + 3, 3, 1);
      x += w + 6 + Math.floor(R() * 18);
    }
  } else if (m.sil === 'moonrock') {
    let x = -10;
    while (x < W + 10) {
      const w = 10 + Math.floor(R() * 24), h = 4 + Math.floor(R() * 14);
      b.fillStyle = m.silC;
      for (let r = 0; r < h; r++) { const hw = Math.floor(w / 2 * (r + 1) / h); b.fillRect(x + Math.floor(w / 2) - hw, GROUND - h + r, hw * 2, 1); }
      x += w + 8 + Math.floor(R() * 30);
    }
    b.fillStyle = '#9aa0a3'; const fx = Math.round(W * 0.3); b.fillRect(fx, GROUND - 16, 1, 16);
    b.fillStyle = '#c9302c'; b.fillRect(fx + 1, GROUND - 16, 7, 2); b.fillStyle = '#f1ead8'; b.fillRect(fx + 1, GROUND - 14, 7, 1); b.fillStyle = '#3d7fb3'; b.fillRect(fx + 1, GROUND - 13, 7, 2);
  } else if (m.sil === 'cave') {
    let x = -4;
    while (x < W + 4) {
      const len = 8 + Math.floor(R() * (26 + O * 0.3)), w = 3 + Math.floor(R() * 6);
      b.fillStyle = m.silC;
      for (let r = 0; r < len; r++) { const hw = Math.max(0, Math.round(w * (1 - r / len))); b.fillRect(x - hw, r, hw * 2 + 1, 1); }
      x += w + 2 + Math.floor(R() * 14);
    }
    x = 0;
    while (x < W) { const h = 4 + Math.floor(R() * 14), w = 3 + Math.floor(R() * 4); for (let r = 0; r < h; r++) { const hw = Math.round(w * r / h); b.fillStyle = m.silC; b.fillRect(x - hw, GROUND - h + r, hw * 2 + 1, 1); } x += 10 + Math.floor(R() * 30); }
    b.fillStyle = m.web; b.globalAlpha = 0.5;
    for (const [cx, dir] of [[0, 1], [W - 1, -1]]) {
      for (let a = 0; a < 5; a++) { const ang = a / 4 * Math.PI / 2; for (let r = 0; r < 34; r++) b.fillRect(cx + dir * Math.round(Math.cos(ang) * r), Math.round(Math.sin(ang) * r), 1, 1); }
      for (let ring = 8; ring < 34; ring += 7) for (let t = 0; t <= 20; t++) { const ang = t / 20 * Math.PI / 2; b.fillRect(cx + dir * Math.round(Math.cos(ang) * ring), Math.round(Math.sin(ang) * ring), 1, 1); }
    }
    b.globalAlpha = 1;
  }
  const [g0, g1, g2, p1, p2] = m.ground;
  b.fillStyle = g0; b.fillRect(0, GROUND, W, H - GROUND);
  b.fillStyle = g1; b.fillRect(0, GROUND, W, 1);
  b.fillStyle = g2; b.fillRect(0, GROUND + 1, W, 2);
  const depth = H - GROUND - 3;
  for (let i = 0; i < W * depth / 16; i++) { b.fillStyle = R() < 0.5 ? p1 : p2; b.fillRect(Math.floor(R() * W), GROUND + 3 + Math.floor(R() * depth), 1 + Math.floor(R() * 2), 1); }
  b.fillStyle = m.lip;
  for (let i = 0; i < 12; i++) b.fillRect(Math.floor(R() * W), GROUND - 1, 4 + Math.floor(R() * 6), 1);
  if (m.sil === 'moonrock') for (let i = 0; i < 6; i++) { const cx = Math.floor(R() * W), cw = 6 + Math.floor(R() * 10), cy = GROUND + 4 + Math.floor(R() * Math.max(1, depth - 6)); b.fillStyle = p1; b.fillRect(cx, cy, cw, 2); b.fillStyle = g1; b.fillRect(cx + 1, cy + 2, cw - 2, 1); }
  if (!m.noWire) for (const px of [Math.round(W * 0.1), Math.round(W * 0.47), Math.round(W * 0.84)]) {
    b.fillStyle = m.post; b.fillRect(px, GROUND - 9, 1, 9); b.fillRect(px + 22, GROUND - 9, 1, 9);
    b.fillStyle = m.wire; for (let i = 0; i < 22; i++) b.fillRect(px + i, GROUND - 7 + ((i >> 1) % 2) * 2, 1, 1);
  }
}

/* ---------- save data (per device) ---------- */
const SAVE_KEY = 'siper-save-v2';
let save = {gold: 0, best: 0, weapons: ['rifle'], chars: ['ali'], weapon: 'rifle', char: 'ali', lv: {}, tips: false};
try { const r = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (r) save = Object.assign(save, r); } catch (e) {}
try { const ob = parseInt(localStorage.getItem('siper-best') || '0', 10); if (ob > save.best) save.best = ob; } catch (e) {}
if (!save.mode) save.mode = 'normal';
if (!save.bests) save.bests = {normal: save.best || 0};
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }
const curWeapon = () => WEAPONS.find(w => w.id === ((P && P.wpn) || save.weapon)) || WEAPONS[0];
const myWeapon = () => WEAPONS.find(w => w.id === save.weapon) || WEAPONS[0];
if (!save.lv) save.lv = {};
const wLv = id => save.lv[id] || 1;
const upCost = (w, lv) => Math.round(((w.price || 150) * 0.5 + 50) * lv);
function effWeapon() {
  const w = curWeapon(), lv = P && P.lvs ? (P.lvs[w.id] || 1) : wLv(w.id);
  const rapid = P && P.rapid > 0 ? 0.5 : 1, dbl = P && P.dbl > 0 ? 2 : 1;
  return Object.assign({}, w, {lv, dmg: w.dmg * (1 + 0.4 * (lv - 1)) * dbl * (curChar().dmg || 1), cd: Math.max(3, Math.round(w.cd * (1 - 0.15 * (lv - 1)) * rapid))});
}
const wLabel = w => w.name + (wLv(w.id) > 1 ? ' +' + (wLv(w.id) - 1) : '');
const curChar = () => CHARS.find(c => c.id === ((P && P.ch) || save.char)) || CHARS[0];
const myChar = () => CHARS.find(c => c.id === save.char) || CHARS[0];
const charOf = pl => CHARS.find(c => c.id === ((pl && pl.ch) || save.char)) || CHARS[0];

/* ---------- audio ---------- */
let AC = null, muted = false, noiseBuf = null;
function sfx(type, vol = 1) {
  if (muted) return;
  try {
    ensureAC();
    const t = AC.currentTime;
    if (type === 'boom') {
      const s = AC.createBufferSource(); s.buffer = noiseBuf;
      const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
      const g = AC.createGain(); g.gain.value = 0.45 * vol;
      s.connect(f).connect(g).connect(AC.destination); s.start(t);
      return;
    }
    const cfg = {shoot:[900, 250, .05, .05], smg:[1100, 400, .035, .035], shotgun:[320, 60, .14, .1], snipe:[1500, 180, .14, .07], rocket:[180, 70, .3, .07],
      eshoot:[380, 150, .07, .035], hit:[220, 55, .18, .12], pick:[520, 1100, .14, .07], jump:[280, 560, .08, .04], throw:[600, 300, .1, .05],
      buy:[660, 1320, .18, .07], plasma:[1800, 500, .12, .05], flame:[160, 90, .08, .03], no:[200, 150, .15, .06], armor:[900, 700, .1, .06]}[type];
    if (!cfg) return;
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(cfg[0], t); o.frequency.exponentialRampToValueAtTime(cfg[1], t + cfg[2]);
    g.gain.setValueAtTime(cfg[3] * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + cfg[2]);
    o.connect(g).connect(AC.destination); o.start(t); o.stop(t + cfg[2] + 0.02);
  } catch (e) {}
}
function ensureAC() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === 'suspended') AC.resume();
  if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.5, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (rand() * 2 - 1) * Math.pow(1 - i / d.length, 2); }
}
// little chiptune march; key shifts with the map
let mTimer = null, mStep = 0, mNext = 0;
const mf = m => 440 * Math.pow(2, (m - 69) / 12);
const CHORDS = [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]];
function mNote(f, t, dur, type, vol) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur + 0.02);
}
function mStepPlay(step, t) {
  const bar = Math.floor(step / 16) % 4, st = step % 16, ch = CHORDS[bar], base = 45 + [0, -2, 3, -5, -7, 5, -3][mapIdx];
  const boss = enemies.some(e => BOSSES.has(e.type));
  if ([0, 3, 6, 8, 10, 12, 14].includes(st)) mNote(mf(base + ch[0] + (st === 6 || st === 14 ? 12 : 0)), t, 0.13, 'triangle', 0.1);
  if (st % 2 === 0) mNote(mf(base + 24 + ch[[0, 1, 2, 1, 0, 1, 2, 2][st / 2]] + (step >= 32 && st >= 8 ? 12 : 0)), t, 0.09, 'square', boss ? 0.024 : 0.016);
  if (st % 4 === 2) { const s = AC.createBufferSource(); s.buffer = noiseBuf; const f = AC.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000; const g = AC.createGain(); g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04); s.connect(f).connect(g).connect(AC.destination); s.start(t); s.stop(t + 0.05); }
  if (st === 0 || st === 8 || (boss && st % 4 === 0)) { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12); g.gain.setValueAtTime(0.16, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + 0.16); }
}
function musicStart() {
  if (muted || mTimer) return;
  try { ensureAC(); } catch (e) { return; }
  mNext = AC.currentTime + 0.06;
  mTimer = setInterval(() => {
    const boss = enemies.some(e => BOSSES.has(e.type)), spb = 60 / (boss ? 150 : 128) / 4;
    while (mNext < AC.currentTime + 0.15) { try { mStepPlay(mStep, mNext); } catch (e) {} mNext += spb; mStep = (mStep + 1) % 64; }
  }, 30);
}
function musicStop() { clearInterval(mTimer); mTimer = null; }
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

/* ---------- state ---------- */
let state = 'menu', P, P1 = null, P2 = null, enemies = [], bullets = [], grenades = [], bombs = [], parts = [], pickups = [], floaters = [], smoke = [];
let score = 0, wave = 1, queue = [], spawnT = 0, clearT = 0, shake = 0, tick = 0, runGold = 0;
let jumpPressed = false;
let combo = 0, comboT = 0, allies = [], hurtFlash = 0, tipT = 0, tipIdx = 0, specialPressed = false;

function newPlayer(x, ch) {
  const c = CHARS.find(k => k.id === ch) || CHARS[0];
  return {x, y: GROUND - 13, vx: 0, vy: 0, face: 1, onGround: true, hp: c.hp, maxHp: c.hp, armor: 0, inv: 0, cd: 0, gren: c.gren, anim: 0, up: false, rapid: 0, dbl: 0, meter: 0, jumps: 0, regenT: 0, slow: 0};
}
const me = () => net.role === 'guest' ? (P2 || P) : (P1 || P);
const livePlayers = () => [P, P2].filter(p => p && !p.down);
function asP(pl, fn) { const s = P; P = pl; try { fn(); } finally { P = s; } }
function nearestPlayer(e) {
  const ps = livePlayers(); if (ps.length < 2) return ps[0] || P;
  return Math.abs(ps[0].x - e.x) <= Math.abs(ps[1].x - e.x) ? ps[0] : ps[1];
}
function reset() {
  P = newPlayer(60, save.char); P1 = P; P2 = null;
  enemies = []; bullets = []; grenades = []; bombs = []; parts = []; pickups = []; floaters = [];
  $('btnShopHud').classList.add('hidden');
  score = 0; shake = 0; clearT = 0; runGold = 0; combo = 0; comboT = 0; allies = []; hurtFlash = 0; tipT = 90; tipIdx = 0;
  if (mapIdx !== modeMapFor(1)) { mapIdx = modeMapFor(1); buildBg(); smoke = []; }
  startWave(1);
}

function banner(txt, frames = 120) {
  if (net.role === 'host') net.events.push({e: 'b', t: txt, f: frames});
  const el = $('banner'); el.textContent = txt; el.classList.remove('hidden');
  clearTimeout(banner.t); banner.t = setTimeout(() => el.classList.add('hidden'), frames * 16.7);
}

function waveSetup(n) {
  const md = save.mode;
  if (md === 'zombie') { const w = {zombie: 1}; if (n >= 2) { w.zfast = 0.35; w.bat = 0.1; } if (n >= 3) w.slime = 0.1; if (n >= 4) w.spider = 0.08; return {w, main: 'zombie', boss: 'kaiju'}; }
  if (md === 'space') { const w = {inf: 1, plane: 0.08}; if (n >= 2) w.spider = 0.15; if (n >= 3) w.sniper = 0.08; if (n >= 4) w.heavy = 0.08; if (n >= 6) w.slime = 0.08; return {w, main: 'inf', boss: 'mother'}; }
  if (md === 'spider') { const w = {spider: 1}; if (n >= 2) w.gspider = 0.22; if (n >= 4) w.bat = 0.08; return {w, main: 'spider', boss: 'queen'}; }
  const w = {inf: 1};
  if (n >= 2) w.plane = 0.05;
  if (n >= 3) { w.runner = 0.12; w.tank = 0.05; }
  if (n >= 4) w.sniper = 0.08;
  if (n >= 5) w.heavy = 0.08;
  if (n >= 6) { w.inf = 0.5; w.zombie = 0.22; w.spider = 0.14; w.bat = 0.12; w.slime = 0.1; }
  return {w, main: 'inf', boss: n % 10 === 0 ? 'kaiju' : 'boss'};
}
function startWave(n) {
  wave = n; queue = [];
  const N = Math.min(256, 4 * Math.pow(2, n - 1));
  const {w: wts, main, boss} = waveSetup(n);
  const total = Object.values(wts).reduce((a, b) => a + b, 0);
  const add = (t, c) => { for (let i = 0; i < c; i++) queue.push(t); };
  for (const t in wts) if (t !== main) add(t, Math.max((t === 'plane' || t === 'tank') ? 1 : 0, Math.round(N * wts[t] / total)));
  add(main, Math.max(2, N - queue.length));
  for (let i = queue.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [queue[i], queue[j]] = [queue[j], queue[i]]; }
  for (let k = 0; k < 2; k++) { const i = queue.indexOf(main, k); if (i > k) { queue.splice(i, 1); queue.splice(k, 0, main); } }
  if (n % 5 === 0) queue.push(boss);
  spawnT = 110;
  const newMap = modeMapFor(n);
  const mapChanged = newMap !== mapIdx;
  if (mapChanged) { mapIdx = newMap; buildBg(); smoke = []; }
  let msg = `Dalga ${n}: ${queue.length} düşman`;
  if (n % 5 === 0) msg = `Dalga ${n}: ${BOSS_NAME[boss]} dalgası`;
  else if (n === 6 && save.mode === 'normal') msg = 'Dalga 6: Canavarlar uyandı!';
  else if (mapChanged && n > 1) msg = `Dalga ${n}: ${MAPS[mapIdx].name}`;
  else if (n === 1) msg = `${curMode().name}: Dalga 1`;
  banner(msg, 150);
}

function spawn(type) {
  const m = 1 + (wave - 1) * 0.15;
  const right = rand() < (type === 'tank' ? 0.8 : BOSSES.has(type) ? 1 : 0.7);
  const e = {type, x: right ? W + 2 : -14, y: GROUND - 13, face: right ? -1 : 1, anim: 0, flash: 0, cd: 60 + rand() * 60};
  if (type === 'inf') Object.assign(e, {hp: Math.ceil(2 * m), range: 60 + rand() * 80, spd: 0.35 + rand() * 0.25 + Math.min(0.3, wave * 0.025)});
  else if (type === 'runner') Object.assign(e, {hp: Math.ceil(m), spd: 1.05 + rand() * 0.3 + Math.min(0.5, wave * 0.03)});
  else if (type === 'sniper') Object.assign(e, {hp: Math.ceil(2 * m), cd: 130 + rand() * 60, target: right ? W - 18 - rand() * 24 : 6 + rand() * 24, aim: null});
  else if (type === 'heavy') Object.assign(e, {hp: Math.ceil(8 * m), cd: 90, range: 90 + rand() * 50, spd: 0.25, burst: 0, bt: 0});
  else if (type === 'tank') Object.assign(e, {x: right ? W + 4 : -28, y: GROUND - 11, hp: Math.ceil(14 * m), cd: 140, target: right ? W - 100 + rand() * 70 : 10 + rand() * 60});
  else if (type === 'plane') {
    const dir = rand() < 0.5 ? -1 : 1;
    Object.assign(e, {x: dir < 0 ? W + 10 : -30, y: GROUND - 132 + rand() * 20, hp: Math.ceil(4 * m), face: dir, vx: dir * (0.9 + rand() * 0.3 + Math.min(0.5, wave * 0.03)), cd: 30, passes: 0});
  } else if (type === 'boss') {
    Object.assign(e, {x: W + 6, y: GROUND - 22, face: -1, hp: Math.round(70 * m), cd: 110, mg: 160, burst: 0, bt: 0, target: W - 64});
    banner('Dev Tank geliyor!', 130); shake = 6; sfx('boom');
  } else if (type === 'zombie') Object.assign(e, {hp: Math.ceil(5 * m), spd: 0.3 + rand() * 0.2 + Math.min(0.3, wave * 0.02)});
  else if (type === 'zfast') Object.assign(e, {hp: Math.ceil(3 * m), spd: 0.9 + rand() * 0.3 + Math.min(0.4, wave * 0.03)});
  else if (type === 'gspider') Object.assign(e, {x: right ? W + 2 : -30, y: GROUND - 14, hp: Math.ceil(12 * m), spd: 0.7 + rand() * 0.25, vy: 0, onG: true, cd: 100 + rand() * 60, big: true});
  else if (type === 'queen') {
    Object.assign(e, {x: W + 4, y: GROUND - 28, face: -1, hp: Math.round(150 * m), cd: 90, brood: 240, target: W - 76});
    banner('Örümcek Kraliçe geliyor!', 130); shake = 8; sfx('boom');
  } else if (type === 'mother') {
    Object.assign(e, {x: W + 10, y: GROUND - 125, face: -1, hp: Math.round(120 * m), cd: 60, mg: 150, burst: 0, bt: 0});
    banner('Ana Gemi geliyor!', 130); shake = 6; sfx('boom');
  }
  else if (type === 'spider') Object.assign(e, {y: GROUND - 7, hp: Math.ceil(3 * m), spd: 1 + rand() * 0.4, vy: 0, onG: true, cd: 60 + rand() * 60});
  else if (type === 'bat') { const by = GROUND - 55 - rand() * 45; Object.assign(e, {x: right ? W + 2 : -16, y: by, by, hp: Math.ceil(2 * m), spd: 0.8 + rand() * 0.4, dive: 0, cd: 90 + rand() * 90}); }
  else if (type === 'slime') Object.assign(e, {y: GROUND - 7, hp: Math.ceil(6 * m), spd: 0.9, vy: 0, onG: true, hopT: 20});
  else if (type === 'kaiju') {
    Object.assign(e, {x: W + 4, y: GROUND - 39, face: -1, hp: Math.round(130 * m), spd: 0.35, vy: 0, onG: true, cd: 150, rock: 100});
    banner('Dev Canavar geliyor!', 130); shake = 8; sfx('boom');
  }
  e.max = e.hp;
  enemies.push(e);
}

/* ---------- helpers ---------- */
function box(e) {
  if (SOLDIER_TYPES.has(e.type) || e.type === 'zombie' || e.type === 'zfast') return {x: e.x + 3, y: e.y + 1, w: 6, h: 12};
  if (e.type === 'spider') return {x: e.x + 1, y: e.y + 1, w: 12, h: 6};
  if (e.type === 'gspider') return {x: e.x + 2, y: e.y + 2, w: 24, h: 12};
  if (e.type === 'queen') return {x: e.x + 4, y: e.y + 6, w: 48, h: 22};
  if (e.type === 'mother') return {x: e.x + 3, y: e.y + 9, w: 54, h: 14};
  if (e.type === 'bat') return {x: e.x + 1, y: e.y + 1, w: 12, h: 5};
  if (e.type === 'slime') return e.small ? {x: e.x, y: e.y, w: 6, h: 4} : {x: e.x + 1, y: e.y + 1, w: 8, h: 6};
  if (e.type === 'kaiju') return {x: e.x + 6, y: e.y + 4, w: 24, h: 35};
  if (e.type === 'tank') return {x: e.x + 1, y: e.y + 1, w: 22, h: 10};
  if (e.type === 'boss') return {x: e.x + 2, y: e.y + 2, w: 44, h: 20};
  return {x: e.x, y: e.y + 1, w: 20, h: 6};
}
const pbox = () => ({x: P.x + 3, y: P.y + 1, w: 6, h: 12});
const inBox = (px, py, b, pad = 1) => px >= b.x - pad && px <= b.x + b.w + pad && py >= b.y - pad && py <= b.y + b.h + pad;

function puff(x, y, n, cols, sp, life, g = 0.05, size = 1) {
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2, s = rand() * sp;
    parts.push({x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.5 + rand() * 0.5), c: cols[i % cols.length], g, size});
  }
}
function floater(x, y, txt, col = '#f6d38a') { floaters.push({x, y, txt, t: 50, col}); if (net.role === 'host') net.events.push({e: 'f', x: Math.round(x), y: Math.round(y), t: txt, c: col}); }

function fxExplode(x, y, r) {
  puff(x, y, 22, ['#fff2b0', '#f6c56a', '#e8772e', '#c4351f'], 2.6, 26, 0.04, 2);
  puff(x, y, 12, ['#4a3f3a', '#6b5d55', '#3a302c'], 1.1, 60, -0.02, 3);
  puff(x, GROUND, 8, [MAPS[mapIdx].ground[1], MAPS[mapIdx].ground[2]], 1.8, 30, 0.12, 1);
  shake = Math.max(shake, r / 3); sfx('boom');
}
function explode(x, y, r, dmg, hurtP) {
  fxExplode(x, y, r);
  if (net.role === 'host') net.events.push({e: 'x', x: Math.round(x), y: Math.round(y), r});
  for (const e of enemies) {
    if (e.dead) continue;
    const b = box(e);
    const dx = clamp(x, b.x, b.x + b.w) - x, dy = clamp(y, b.y, b.y + b.h) - y;
    if (Math.hypot(dx, dy) < r) damage(e, dmg);
  }
  if (hurtP) for (const pl of livePlayers()) asP(pl, () => {
    const b = pbox();
    const dx = clamp(x, b.x, b.x + b.w) - x, dy = clamp(y, b.y, b.y + b.h) - y;
    if (Math.hypot(dx, dy) < r * 0.8) hurt(1);
  });
}

function gainGold(n) {
  if (net.role === 'host') net.events.push({e: 'g', n: Math.round(n)});
  n = Math.round(n * myChar().gold);
  runGold += n; save.gold += n;
  return n;
}

function damage(e, n) {
  if (e.dead || n <= 0) return;
  e.hp -= n; e.flash = 4;
  if (e.hp > 0) return;
  e.dead = true;
  const b = box(e), cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  const [sc, gd] = e.small ? [60, 3] : REWARD[e.type];
  combo++; comboT = 150;
  if ([5, 10, 20, 30, 50].includes(combo)) { floater(P.x + 6, P.y - 16, combo + ' seri!', '#ff9a4a'); sfx('buy', 0.5); }
  const mInc = BOSSES.has(e.type) ? 0 : e.small ? 3 : e.type === 'tank' || e.type === 'heavy' ? 18 : 7;
  for (const pl of [P, P2]) if (pl && !pl.down) pl.meter = Math.min(100, pl.meter + mInc);
  score += Math.round(sc * (1 + Math.min(combo - 1, 10) * 0.1));
  const got = gainGold(gd * (1 + Math.min(combo - 1, 10) * 0.1));
  floater(cx, b.y - 6, '+' + got);
  if (SOLDIER_TYPES.has(e.type) || (MONSTERS.has(e.type) && !BOSSES.has(e.type))) {
    const col = inSpace() && SOLDIER_TYPES.has(e.type) ? PAL.E : PAL[{inf:'R', runner:'A', sniper:'V', heavy:'Q', zombie:'l', zfast:'r', spider:inSpace() ? 'L' : 'E', gspider:'T', bat:'Q', slime:'L'}[e.type]];
    if (net.role === 'host') net.events.push({e: 'k', x: Math.round(cx), y: Math.round(cy), c: col, m: MONSTERS.has(e.type) ? 1 : 0});
    puff(cx, cy, MONSTERS.has(e.type) ? 16 : 10, [col, PAL.k, MONSTERS.has(e.type) ? '#2e4a1c' : MAPS[mapIdx].ground[1]], 1.6, 30, 0.1, 1);
    if (SOLDIER_TYPES.has(e.type) && !inSpace()) parts.push({x: cx, y: b.y, vx: -e.face * 0.8, vy: -2, life: 50, c: col, g: 0.12, size: 3});
    if (e.type === 'slime' && !e.small) {
      const m = 1 + (wave - 1) * 0.15;
      for (const d of [-1, 1]) enemies.push({type: 'slime', small: true, x: e.x + 2 + d * 3, y: e.y + 2, face: d, anim: 0, flash: 0, hp: Math.ceil(2 * m), max: Math.ceil(2 * m), spd: 1.2, vy: -2.4, onG: false, hopT: 30});
    }
    const r = rand(), medP = e.type === 'heavy' ? 0.4 : 0.08;
    if (r < medP) pickups.push({x: cx - 4, y: cy, vy: -1.5, kind: 'med', t: 600});
    else if (r < medP + 0.1) pickups.push({x: cx - 4, y: cy, vy: -1.5, kind: 'gren', t: 600});
    else if (r < medP + 0.15 + (e.type === 'heavy' ? 0.25 : 0)) pickups.push({x: cx - 4, y: cy, vy: -1.8, kind: ['rapid', 'double', 'shield'][Math.floor(rand() * 3)], t: 600});
  } else if (e.type === 'tank') {
    explode(cx, cy, 20, 3, false);
    setTimeout(() => state === 'play' && explode(cx - 6, cy - 2, 12, 2, false), 150);
    pickups.push({x: cx - 4, y: cy - 4, vy: -2, kind: 'med', t: 600});
    if (rand() < 0.5) pickups.push({x: cx + 6, y: cy - 4, vy: -2.4, kind: ['rapid', 'double', 'shield'][Math.floor(rand() * 3)], t: 600});
  } else if (BOSSES.has(e.type)) {
    for (let i = 0; i < 5; i++) setTimeout(() => (state === 'play' || state === 'shop') && explode(cx - 18 + rand() * 36, cy - 8 + rand() * 16, 16, 0, false), i * 140);
    shake = 10; buzz(120);
    pickups.push({x: cx - 12, y: cy - 4, vy: -2.5, kind: 'med', t: 900}, {x: cx + 4, y: cy - 4, vy: -2.5, kind: 'gren', t: 900});
    banner(BOSS_NAME[e.type] + ' yok edildi!', 110);
    if (e.type === 'kaiju' || e.type === 'queen') puff(cx, cy, 40, ['#6fa04a', '#94c46a', '#2e4a1c', '#4b3d5c'], 3, 50, 0.1, 2);
  } else {
    explode(cx, cy, 14, 0, false);
    parts.push({x: cx, y: cy, vx: e.vx * 0.8, vy: 0.5, life: 400, c: '#ad5a3f', g: 0.08, size: 4, wreck: true});
  }
}

function hurt(n) {
  if (!P || P.inv > 0 || state !== 'play') return;
  if (P.down) return;
  const local = P === me();
  if (P.armor > 0) {
    P.armor--; P.inv = 50; sfx('armor'); if (local) buzz(30);
    puff(P.x + 6, P.y + 6, 8, ['#6fb0e0', '#f1ead8'], 1.5, 18, 0.05, 1);
    return;
  }
  P.hp -= n; P.inv = 75; combo = 0; comboT = 0; sfx('hit');
  if (local) { buzz(60); hurtFlash = 14; shake = Math.max(shake, 5); }
  puff(P.x + 6, P.y + 6, 8, ['#c9302c', '#f1ead8'], 1.5, 20, 0.1, 1);
  if (P.hp <= 0) {
    if (P2) {
      P.hp = 0; P.down = true; P.vx = 0; explode(P.x + 6, P.y + 6, 10, 0, false);
      floater(P.x + 6, P.y - 10, 'Yaralandı! Dalga bitince kalkar', '#ff9a4a');
      if (livePlayers().length === 0) gameOver();
    } else gameOver();
  }
}

function gameOver() {
  state = 'over'; musicStop(); $('btnShopHud').classList.add('hidden'); $('tip').classList.add('hidden');
  if (!P2) explode(P.x + 6, P.y + 6, 10, 0, false);
  const prevBest = save.bests[save.mode] || 0, record = score > prevBest;
  if (record) save.bests[save.mode] = score;
  if (score > save.best) save.best = score;
  persist();
  $('overText').textContent = `${wave}. dalgaya kadar dayandın. ${score} puan topladın ve ${runGold} altın kazandın.` + (record && score > 0 ? ` ${curMode().name} için yeni rekor!` : ` ${curMode().name} rekoru: ${prevBest}.`);
  if (net.role === 'host') { netFlush(); netSend({t: 'over', w: wave, sc: score}); }
  setTimeout(() => { if (state === 'over') { $('over').classList.remove('hidden'); $('btnAgain').focus(); } }, 700);
}

function cycleWeapon(dir = 1) {
  const owned = WEAPONS.filter(w => save.weapons.includes(w.id));
  if (owned.length < 2) { const mp = me(); if (state === 'play' && mp) floaters.push({x: mp.x + 6, y: mp.y - 6, txt: 'Mağazadan silah al', t: 50, col: '#ead9ad'}); return; }
  const i = owned.findIndex(w => w.id === save.weapon);
  save.weapon = owned[(i + dir + owned.length) % owned.length].id;
  const mp = me(); if (mp) { mp.cd = Math.max(mp.cd, 12); if (state === 'play') floaters.push({x: mp.x + 6, y: mp.y - 6, txt: wLabel(myWeapon()), t: 50, col: '#ead9ad'}); }
  sfx('pick', 0.6); persist(); syncHud(true);
}

/* ---------- input ---------- */
let K = {left: false, right: false, up: false, jump: false, fire: false, gren: false};
let grenPressed = false;
const KMAP = {ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right', ArrowUp:'up', KeyW:'up',
  Space:'jump', KeyZ:'jump', KeyJ:'fire', KeyX:'fire', KeyK:'gren', KeyC:'gren'};
addEventListener('keydown', e => {
  if (document.activeElement && document.activeElement.tagName === 'INPUT') { if (e.code === 'Enter') netJoin(); return; }
  const k = KMAP[e.code];
  if (k) { if (state === 'play') e.preventDefault(); if (k === 'gren' && !K.gren) grenPressed = true; if (k === 'jump' && !K.jump) jumpPressed = true; K[k] = true; }
  if (e.code === 'Enter' && (state === 'menu' || state === 'over') && document.activeElement.tagName !== 'BUTTON') begin();
  if (e.code === 'KeyP' || (e.code === 'Escape' && state !== 'shop')) togglePause();
  if (e.code === 'Escape' && state === 'shop') closeShop();
  if (e.code === 'KeyM') toggleMute();
  if ((e.code === 'KeyL' || e.code === 'KeyV') && state === 'play') specialPressed = true;
  if (e.code === 'KeyQ' || e.code === 'KeyE') cycleWeapon(e.code === 'KeyQ' ? 1 : -1);
  if (/^Digit[1-9]$/.test(e.code)) {
    const w = WEAPONS[parseInt(e.code.slice(5), 10) - 1];
    if (w && save.weapons.includes(w.id) && save.weapon !== w.id) { save.weapon = w.id; if (me()) me().cd = Math.max(me().cd, 12); sfx('pick', 0.6); persist(); syncHud(true); }
  }
});
addEventListener('keyup', e => { const k = KMAP[e.code]; if (k) K[k] = false; });

document.querySelectorAll('.act[data-k]').forEach(btn => {
  const k = btn.dataset.k;
  let id = null;
  btn.addEventListener('pointerdown', e => {
    e.preventDefault(); id = e.pointerId;
    try { btn.setPointerCapture(e.pointerId); } catch (_) {}
    if (k === 'gren' && !K.gren) grenPressed = true;
    if (k === 'jump' && !K.jump) jumpPressed = true;
    K[k] = true; btn.classList.add('on'); buzz(8);
  });
  const off = e => { if (e.pointerId !== id) return; id = null; K[k] = false; btn.classList.remove('on'); };
  btn.addEventListener('pointerup', off);
  btn.addEventListener('pointercancel', off);
  btn.addEventListener('lostpointercapture', off);
  btn.addEventListener('contextmenu', e => e.preventDefault());
});
$('actSwap').addEventListener('pointerdown', e => { e.preventDefault(); cycleWeapon(1); buzz(8); $('actSwap').classList.add('on'); setTimeout(() => $('actSwap').classList.remove('on'), 120); });
$('actSwap').addEventListener('contextmenu', e => e.preventDefault());
$('actSpecial').addEventListener('pointerdown', e => { e.preventDefault(); specialPressed = true; buzz(8); });
$('actSpecial').addEventListener('contextmenu', e => e.preventDefault());

const dpad = $('dpad'), knob = $('knob');
let padId = null;
function padSet(e) {
  const r = dpad.getBoundingClientRect();
  const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  const dz = r.width * 0.12;
  K.left = dx < -dz; K.right = dx > dz; K.up = dy < -r.height * 0.2;
  $('dL').classList.toggle('on', K.left); $('dR').classList.toggle('on', K.right); $('dU').classList.toggle('on', K.up);
  const max = r.width * 0.3, d = Math.hypot(dx, dy) || 1, f = Math.min(1, max / d);
  knob.style.transform = `translate(${dx * f}px, ${dy * f}px)`;
}
function padOff(e) {
  if (e.pointerId !== padId) return;
  padId = null; K.left = K.right = K.up = false;
  ['dL', 'dR', 'dU'].forEach(i => $(i).classList.remove('on'));
  knob.style.transform = '';
}
dpad.addEventListener('pointerdown', e => { e.preventDefault(); padId = e.pointerId; try { dpad.setPointerCapture(e.pointerId); } catch (_) {} padSet(e); });
dpad.addEventListener('pointermove', e => { if (e.pointerId === padId) padSet(e); });
dpad.addEventListener('pointerup', padOff);
dpad.addEventListener('pointercancel', padOff);
dpad.addEventListener('lostpointercapture', padOff);
dpad.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('gesturestart', e => e.preventDefault());

function hideOverlays() { ['menu', 'over', 'paused', 'shop', 'net'].forEach(i => $(i).classList.add('hidden')); }
function begin() {
  if (net.role === 'guest') { $('overText').textContent = 'Oda sahibinin oyunu yeniden başlatmasını bekle.'; return; }
  if (net.role === 'host' && net.conn) { startCoopHost(); return; }
  if (isTouch && !document.fullscreenElement) { try { const r = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen({navigationUI: 'hide'}); r && r.catch(() => {}); } catch (e) {} }
  hideOverlays(); reset(); state = 'play'; $('btnPause').textContent = 'II'; sfx('pick'); musicStart();
}
function toMenu() { if (net.role) netLeave(); hideOverlays(); musicStop(); $('btnShopHud').classList.add('hidden'); $('tip').classList.add('hidden'); state = 'menu'; refreshMenu(); $('menu').classList.remove('hidden'); }
function togglePause() {
  if (net.role === 'guest') { if (state === 'play') banner('Sadece oda sahibi duraklatabilir', 70); return; }
  if (net.role === 'host' && (state === 'play' || state === 'pause')) netSend({t: 'pause', on: state === 'play'});
  if (state === 'play') { state = 'pause'; musicStop(); $('paused').classList.remove('hidden'); $('btnResume').focus(); }
  else if (state === 'pause') { state = 'play'; musicStart(); $('paused').classList.add('hidden'); }
  $('btnPause').textContent = state === 'pause' ? '▶' : 'II';
}
function toggleMute() { muted = !muted; $('btnMute').textContent = muted ? 'Sessiz' : 'Ses'; if (muted) musicStop(); else if (state === 'play' || state === 'shop') musicStart(); }
function renderModes() {
  const box = $('modes'); box.innerHTML = '';
  for (const md of MODES) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'mode' + (md.id === save.mode ? ' on' : '');
    b.setAttribute('aria-pressed', md.id === save.mode);
    b.innerHTML = '<b></b><span></span>'; b.querySelector('b').textContent = md.name; b.querySelector('span').textContent = md.desc;
    b.onclick = () => {
      if (save.mode === md.id) return;
      save.mode = md.id; persist(); sfx('pick', 0.6);
      mapIdx = modeMapFor(1); buildBg(); smoke = []; refreshMenu();
    };
    box.appendChild(b);
  }
}
function refreshMenu() {
  $('mGold').textContent = save.gold; $('mChar').textContent = myChar().name;
  $('mWeapon').textContent = wLabel(myWeapon()); $('mBest').textContent = save.bests[save.mode] || 0;
  renderModes();
}
$('btnStart').onclick = begin; $('btnAgain').onclick = begin;
$('btnResume').onclick = togglePause; $('btnPause').onclick = togglePause; $('btnMute').onclick = toggleMute;
$('btnQuit').onclick = () => { persist(); toMenu(); };
$('btnWeapon').onclick = () => cycleWeapon(1);
$('btnShopMenu').onclick = () => openShop('menu');
$('btnCoop').onclick = () => { hideOverlays(); $('net').classList.remove('hidden'); $('netStatus').textContent = ''; };
$('btnNetBack').onclick = () => { netLeave(); toMenu(); };
$('btnHost').onclick = () => netHost();
$('btnJoin').onclick = () => netJoin();
$('btnShopOver').onclick = () => openShop('over');
$('btnShopPause').onclick = () => openShop('pause');
$('btnShopHud').onclick = () => { if (state === 'play') openShop('run'); };
$('btnQuit').onclick = () => { persist(); toMenu(); };
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') togglePause(); });

/* ---------- shop ---------- */
let shopFrom = 'menu', shopTab = 'weapons';
function openShop(from) {
  shopFrom = from; hideOverlays();
  if (from === 'run') state = 'shop';
  for (const k in K) K[k] = false;
  const inRun = from === 'run' || from === 'pause';
  $('tabSupply').classList.toggle('hidden', !inRun);
  if (!inRun && shopTab === 'supply') shopTab = 'weapons';
  $('shopNote').textContent = inRun
    ? 'Oyun duraklatıldı. Alışverişini yap, sonra oyuna dön.'
    : 'Satın aldığın silahlar, askerler ve geliştirmeler kalıcıdır. Oyunda silahları ' + (isTouch ? 'Silah tuşuyla' : 'Q tuşuyla') + ' değiştirebilirsin.';
  $('shopClose').textContent = inRun ? 'Oyuna dön' : 'Geri';
  renderShop();
  $('shop').classList.remove('hidden');
}
function closeShop() {
  persist();
  $('shop').classList.add('hidden');
  if (shopFrom === 'run') state = 'play';
  else if (shopFrom === 'pause') $('paused').classList.remove('hidden');
  else if (shopFrom === 'over') $('over').classList.remove('hidden');
  else toMenu();
}
$('shopClose').onclick = closeShop;
$('tabs').addEventListener('click', e => { const t = e.target.closest('button'); if (!t) return; shopTab = t.dataset.tab; renderShop(); });

function iconCanvas(s, scale) {
  const c = document.createElement('canvas'); c.width = s.w * scale; c.height = s.h * scale;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(s.r, 0, 0, c.width, c.height);
  c.style.width = Math.min(64, c.width) + 'px';
  return c;
}
function shopItems() {
  if (shopTab === 'weapons') return WEAPONS.map(w => {
    const lv = wLv(w.id);
    return {icon: w.spr, scale: 3, name: w.name, desc: w.desc, id: w.id, lv, upgrade: true,
      owned: save.weapons.includes(w.id), active: save.weapon === w.id, price: w.price,
      buy: () => { save.weapons.push(w.id); save.weapon = w.id; }, equip: () => { save.weapon = w.id; }};
  });
  if (shopTab === 'chars') return CHARS.map(c => ({
    icon: SPRC[c.id].p.idle, scale: 4, name: c.name, desc: c.desc,
    owned: save.chars.includes(c.id), active: save.char === c.id, price: c.price,
    buy: () => { save.chars.push(c.id); pickChar(c); }, equip: () => pickChar(c),
  }));
  const Q = me();
  if (!Q) return [];
  const sup = k => () => { applySupply(Q, k); if (net.role === 'guest') netSend({t: 'buy', k}); };
  return [
    {icon: MED, scale: 5, name: '+1 can', desc: `Canını bir artırır. Şu an ${Q.hp}/${Q.maxHp}.`, price: 40, consumable: true, off: Q.hp >= Q.maxHp || Q.down, buy: sup('med')},
    {icon: GREN, scale: 7, name: '+2 el bombası', desc: `En fazla 8 taşıyabilirsin. Şu an ${Q.gren}.`, price: 30, consumable: true, off: Q.gren >= 8, buy: sup('gren')},
    {icon: ARMOR, scale: 6, name: 'Zırh plakası', desc: `Bir vuruşu tamamen emer. En fazla 3. Şu an ${Q.armor}.`, price: 60, consumable: true, off: Q.armor >= 3, buy: sup('armor')},
    {icon: POW.rapid, scale: 6, name: 'Hava desteği', desc: `Destek çubuğunu hemen doldurur. Şu an %${Math.round(Q.meter)}.`, price: 90, consumable: true, off: Q.meter >= 100, buy: sup('air')},
  ];
}
function applySupply(pl, k) {
  if (!pl) return;
  if (k === 'med') pl.hp = Math.min(pl.maxHp, pl.hp + 1);
  else if (k === 'gren') pl.gren = Math.min(8, pl.gren + 2);
  else if (k === 'armor') pl.armor = Math.min(3, pl.armor + 1);
  else if (k === 'air') pl.meter = 100;
}
function pickChar(c) {
  save.char = c.id;
  const Q = me();
  if (Q && net.role !== 'guest' && (shopFrom === 'run' || shopFrom === 'pause')) { Q.maxHp = c.hp; Q.hp = Math.min(Q.hp, c.hp); Q.gren = Math.max(Q.gren, c.gren); }
}
function denied(card) { card.classList.remove('no'); void card.offsetWidth; card.classList.add('no'); sfx('no'); }
function renderShop() {
  $('sGold').textContent = save.gold;
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === shopTab));
  const list = $('cards'); list.innerHTML = '';
  for (const it of shopItems()) {
    const card = document.createElement('div'); card.className = 'card';
    const ic = document.createElement('div'); ic.className = 'ic'; ic.appendChild(iconCanvas(it.icon, it.scale));
    const tx = document.createElement('div');
    tx.innerHTML = '<div class="nm"></div><div class="ds"></div><div class="row"></div>';
    tx.querySelector('.nm').textContent = it.name;
    if (it.upgrade && it.owned) {
      const pips = document.createElement('span'); pips.className = 'pips'; pips.setAttribute('aria-label', `Seviye ${it.lv}/3`);
      for (let i = 1; i <= 3; i++) { const d = document.createElement('i'); if (i <= it.lv) d.className = 'f'; pips.appendChild(d); }
      tx.querySelector('.nm').appendChild(pips);
    }
    tx.querySelector('.ds').textContent = it.desc + (it.upgrade && it.owned && it.lv < 3 ? ' Geliştirme hasarı ve atış hızını artırır.' : '');
    const row = tx.querySelector('.row');
    const main = document.createElement('button'); main.type = 'button'; main.className = 'cb';
    const afford = save.gold >= it.price;
    if (it.consumable) {
      main.textContent = it.off ? 'Dolu' : `${it.price} altına al`; main.disabled = it.off;
      main.classList.add(afford ? 'buy' : 'locked');
    } else if (it.owned) {
      main.textContent = it.active ? 'Kuşanıldı' : 'Kuşan'; main.disabled = it.active;
      if (it.active) card.classList.add('active');
    } else { main.textContent = `${it.price} altına al`; main.classList.add(afford ? 'buy' : 'locked'); }
    main.onclick = () => {
      if (!it.consumable && it.owned) { it.equip(); sfx('pick', 0.6); }
      else if (save.gold >= it.price) { save.gold -= it.price; it.buy(); sfx('buy'); buzz(20); }
      else return denied(card);
      persist(); renderShop(); syncHud(true);
    };
    row.appendChild(main);
    if (it.upgrade && it.owned) {
      const up = document.createElement('button'); up.type = 'button'; up.className = 'cb';
      if (it.lv >= 3) { up.textContent = 'En yüksek seviye'; up.disabled = true; }
      else {
        const cost = upCost(WEAPONS.find(w => w.id === it.id), it.lv);
        up.textContent = `Geliştir (${cost})`; up.classList.add(save.gold >= cost ? 'up' : 'locked');
        up.onclick = () => {
          if (save.gold < cost) return denied(card);
          save.gold -= cost; save.lv[it.id] = it.lv + 1; sfx('buy'); buzz(20);
          persist(); renderShop(); syncHud(true);
        };
      }
      row.appendChild(up);
    }
    card.append(ic, tx);
    list.appendChild(card);
  }
}

/* ---------- update ---------- */
function shootAt(e, bx, by, sp, jitter = 0.3) {
  const tx = P.x + 6 - bx, ty = P.y + 7 - by, d = Math.hypot(tx, ty) || 1;
  bullets.push({x: bx, y: by, vx: tx / d * sp, vy: clamp(ty / d * sp, -1.4, 1.4) + (rand() - 0.5) * jitter, owner: 'e', life: 220});
  parts.push({x: bx, y: by, vx: 0, vy: 0, life: 3, c: '#f6c56a', g: 0, size: 2});
}

function playerFire() {
  const w = effWeapon();
  P.cd = w.cd;
  let bx, by;
  if (P.up) { bx = P.face > 0 ? P.x + 8 : P.x + 3; by = P.y - 1; }
  else { const m = MZ[w.id]; bx = P.face > 0 ? P.x + m : P.x + 11 - m; by = P.y + (w.rocket ? 5 : 6); }
  for (let i = 0; i < w.n; i++) {
    const sp = (rand() - 0.5) * w.spread, v = w.spd * (w.n > 1 ? 0.85 + rand() * 0.3 : 1);
    const vx = P.up ? sp : v * P.face, vy = P.up ? -v : sp;
    const life = w.life * (w.n > 1 ? 0.8 + rand() * 0.4 : 1);
    bullets.push({x: bx, y: by, vx, vy: w.lob && !P.up ? -1.4 + sp * 0.3 : vy, owner: 'p', life, max: life, dmg: w.dmg, pierce: w.pierce, rocket: w.rocket, grav: w.lob ? 0.12 : 0, flame: w.flame, plasma: w.plasma, hit: w.pierce ? new Set() : null});
  }
  parts.push({x: bx, y: by, vx: 0, vy: 0, life: 3, c: '#fff2b0', g: 0, size: w.n > 1 || w.rocket ? 4 : 2});
  if (!w.flame || tick % 6 === 0) sfx({smg:'smg', minigun:'smg', shotgun:'shotgun', sniper:'snipe', rocket:'rocket', glauncher:'throw', plasma:'plasma', flame:'flame'}[w.id] || 'shoot');
  if (w.id === 'shotgun' || w.id === 'sniper' || w.id === 'rocket') { shake = Math.max(shake, 1.8); if (!P.up) P.x = clamp(P.x - P.face * 1.5, 0, W - 12); }
}

function stepPlayer() {
  if (P.down) { jumpPressed = grenPressed = specialPressed = false; P.inv = 0; return; }
  const c = curChar();
  const mv = (K.right ? 1 : 0) - (K.left ? 1 : 0);
  if (P.slow > 0) P.slow--;
  P.vx = mv * c.spd * (K.fire && curWeapon().id === 'minigun' ? 0.55 : 1) * (P.slow > 0 ? 0.5 : 1); if (mv) P.face = mv;
  if (K.jump && P.onGround) { P.vy = -c.jump; P.onGround = false; P.jumps = 0; sfx('jump'); }
  else if (jumpPressed && !P.onGround && c.doubleJump && P.jumps < 1) { P.vy = -c.jump * 0.9; P.jumps++; sfx('jump'); puff(P.x + 6, P.y + 12, 6, ['#f1ead8', '#9aa0a3'], 1, 12, 0); }
  jumpPressed = false;
  if (c.regen && P.hp < P.maxHp && ++P.regenT >= 1200) { P.hp++; P.regenT = 0; floater(P.x + 6, P.y - 8, '+1 can', '#9fd08a'); sfx('pick', 0.5); }
  P.vy += inSpace() ? 0.12 : 0.22; P.x += P.vx; P.y += P.vy;
  if (P.y + 13 >= GROUND) { if (!P.onGround) puff(P.x + 6, GROUND, 3, [MAPS[mapIdx].ground[1]], 0.8, 12, 0.05); P.y = GROUND - 13; P.vy = 0; P.onGround = true; }
  P.x = clamp(P.x, 0, W - 12);
  P.up = K.up; P.anim++;
  if (P.inv > 0) P.inv--;
  if (P.cd > 0) P.cd--;
  if (P.rapid > 0) P.rapid--;
  if (P.dbl > 0) P.dbl--;
  if (K.fire && P.cd <= 0) playerFire();
  if (specialPressed) {
    specialPressed = false;
    if (P.meter >= 100) {
      P.meter = 0; allies.push({x: -26, y: GROUND - 126, vx: 3.2, drop: 0});
      banner('Hava desteği geliyor!', 80); sfx('buy'); buzz(30);
    } else floater(P.x + 6, P.y - 8, 'Destek dolmadı', '#ead9ad');
  }
  if (grenPressed) {
    grenPressed = false;
    if (P.gren > 0) { P.gren--; sfx('throw'); if (P === me()) buzz(10); grenades.push({x: P.x + 6, y: P.y + 3, vx: 2.3 * P.face + P.vx * 0.5, vy: -3.1, t: 55}); }
  }
}
function stepRemote(pl) {
  const sK = K, sg = grenPressed, sj = jumpPressed, ss = specialPressed;
  pl.fl = pl.fl || {};
  K = pl.in || {}; grenPressed = !!pl.fl.g; jumpPressed = !!pl.fl.j; specialPressed = !!pl.fl.s;
  try { asP(pl, stepPlayer); } finally { pl.fl = {g: grenPressed, j: jumpPressed, s: specialPressed}; K = sK; grenPressed = sg; jumpPressed = sj; specialPressed = ss; }
}
function update() {
  tick++;
  stepPlayer();
  if (P2 && net.role === 'host') stepRemote(P2);
  if (comboT > 0 && --comboT === 0) combo = 0;
  for (const a of allies) {
    a.x += a.vx;
    if (--a.drop <= 0 && a.x > 0 && a.x < W - 12) { bombs.push({x: a.x + 10, y: a.y + 8, vx: 1.2, vy: 0, ally: true}); a.drop = 9; }
    if (tick % 3 === 0) smoke.push({x: a.x, y: a.y + 4, vx: 0, vy: -0.05, life: 30, max: 30, s: 2, c: '#9aa0a3'});
  }
  allies = allies.filter(a => a.x < W + 30);
  if (!save.tips && wave <= 2 && --tipT <= 0) {
    const tips = isTouch ? TIPS_TOUCH : TIPS_KEYS;
    if (tipIdx < tips.length) { showTip(tips[tipIdx++]); tipT = 330; }
    else { save.tips = true; persist(); }
  }

  // spawning & waves
  if (queue.length) {
    if (--spawnT <= 0) {
      const next = queue[0];
      const hasBoss = enemies.some(e => BOSSES.has(e.type));
      const groundN = enemies.filter(e => !BOSSES.has(e.type) && e.type !== 'plane').length;
      const cap = {tank: 3, plane: 3, sniper: 3, heavy: 4, bat: 5}[next];
      const limit = Math.min(14, 4 + Math.floor(wave * 1.2)) - (hasBoss ? 2 : 0);
      if (BOSSES.has(next)) { if (enemies.length > 2) spawnT = 30; else { spawn(queue.shift()); spawnT = 120; } }
      else if (cap && enemies.filter(e => e.type === next).length >= cap) { queue.push(queue.shift()); spawnT = 5; }
      else if (next !== 'plane' && groundN >= limit) spawnT = 15;
      else { spawn(queue.shift()); spawnT = Math.max(10, 70 - wave * 6) + rand() * 30; }
    }
  } else if (enemies.length === 0 && clearT === 0) {
    clearT = 420;
    for (const pl of [P, P2]) if (pl) {
      if (pl.down) { pl.down = false; pl.hp = 2; pl.inv = 90; } else pl.hp = Math.min(pl.maxHp, pl.hp + 1);
      pl.gren = Math.max(pl.gren, charOf(pl).gren);
    }
    const bonus = gainGold(20 + 10 * wave);
    score += 250 * wave; banner(`Dalga ${wave} temizlendi: +${bonus} altın`, 150); sfx('pick');
    $('btnShopHud').classList.remove('hidden');
    persist();
  }
  if (clearT > 0) {
    clearT--;
    if (clearT > 0 && clearT <= 180 && clearT % 60 === 0) banner('Sonraki dalga ' + clearT / 60, 55);
    if (clearT === 0) { $('btnShopHud').classList.add('hidden'); startWave(wave + 1); }
  }

  // enemies
  for (const e of enemies) {
    if (e.dead) continue;
    const sP = P; P = nearestPlayer(e);
    try {
    if (e.flash > 0) e.flash--;
    e.anim++;
    const dx = P.x - e.x;
    const onScreen = e.x > -2 && e.x < W - 10;
    if (e.type === 'inf') {
      e.face = dx > 0 ? 1 : -1;
      e.moving = Math.abs(dx) > e.range || e.x < 0 || e.x > W - 12;
      if (e.moving) e.x += e.face * e.spd * (e.x < 0 || e.x > W - 12 ? 1.6 : 1);
      if (--e.cd <= 0 && onScreen) {
        shootAt(e, e.face > 0 ? e.x + 12 : e.x - 1, e.y + 6, 2 + Math.min(1, wave * 0.08)); sfx('eshoot');
        e.cd = Math.max(50, 140 - wave * 7) + rand() * 60;
      }
    } else if (e.type === 'runner') {
      e.face = dx > 0 ? 1 : -1; e.moving = true;
      e.x += e.face * e.spd;
      const pb = pbox();
      if (Math.abs(e.x + 6 - (P.x + 6)) < 8 && Math.abs(e.y - P.y) < 12) {
        e.dead = true; explode(e.x + 6, e.y + 8, 17, 2, true);
      }
    } else if (e.type === 'sniper') {
      e.face = dx > 0 ? 1 : -1;
      e.moving = Math.abs(e.x - e.target) > 1;
      if (e.moving) e.x += Math.sign(e.target - e.x) * 0.6;
      else {
        e.cd--;
        if (e.cd === 55) e.aim = {x: P.x + 6, y: P.y + 7};
        if (e.aim && e.cd > 20) e.aim = {x: e.aim.x + (P.x + 6 - e.aim.x) * 0.06, y: e.aim.y + (P.y + 7 - e.aim.y) * 0.06};
        if (e.cd <= 0 && e.aim) {
          const bx = e.face > 0 ? e.x + 12 : e.x - 1, by = e.y + 6;
          const tx = e.aim.x - bx, ty = e.aim.y - by, d = Math.hypot(tx, ty) || 1;
          bullets.push({x: bx, y: by, vx: tx / d * 5.5, vy: ty / d * 5.5, owner: 'e', life: 120, sniper: true});
          parts.push({x: bx, y: by, vx: 0, vy: 0, life: 4, c: '#fff2b0', g: 0, size: 3});
          sfx('snipe', 0.6); e.aim = null;
          e.cd = Math.max(90, 170 - wave * 5) + rand() * 40;
        }
      }
    } else if (e.type === 'heavy') {
      e.face = dx > 0 ? 1 : -1;
      e.moving = Math.abs(dx) > e.range || e.x < 0 || e.x > W - 12;
      if (e.moving) e.x += e.face * e.spd * (e.x < 0 || e.x > W - 12 ? 2 : 1);
      if (e.burst > 0) { if (--e.bt <= 0) { shootAt(e, e.face > 0 ? e.x + 12 : e.x - 1, e.y + 6, 2.3, 0.5); sfx('eshoot'); e.burst--; e.bt = 7; } }
      else if (--e.cd <= 0 && onScreen) { e.burst = 3 + Math.floor(wave / 6); e.bt = 0; e.cd = Math.max(90, 170 - wave * 5); }
    } else if (e.type === 'tank') {
      if (Math.abs(e.x - e.target) > 1) e.x += Math.sign(e.target - e.x) * 0.3;
      if (e.anim % 90 === 0) e.face = P.x + 6 > e.x + 12 ? 1 : -1;
      if (--e.cd <= 0 && e.x > -6 && e.x < W - 18) {
        const bx = e.face < 0 ? e.x - 2 : e.x + 25;
        bullets.push({x: bx, y: e.y + 2, vx: 2.1 * e.face, vy: 0, owner: 'e', shell: true, life: 300});
        puff(bx, e.y + 2, 6, ['#fff2b0', '#6b5d55'], 1, 16, -0.01, 2);
        e.x -= e.face * 2; shake = Math.max(shake, 2); sfx('boom', 0.7);
        e.cd = Math.max(100, 190 - wave * 6);
      }
    } else if (e.type === 'boss') {
      if (Math.abs(e.x - e.target) > 1) e.x += Math.sign(e.target - e.x) * 0.25;
      if (e.anim % 90 === 0) e.face = P.x + 6 > e.x + 24 ? 1 : -1;
      const inPlace = e.x < W - 40;
      if (--e.cd <= 0 && inPlace) {
        const high = rand() < 0.4, bx = e.face < 0 ? e.x - 2 : e.x + 50;
        bullets.push({x: bx, y: high ? GROUND - 19 : GROUND - 7, vx: 2.5 * e.face, vy: 0, owner: 'e', shell: true, big: true, life: 300});
        puff(bx, e.y + 4, 10, ['#fff2b0', '#6b5d55'], 1.4, 20, -0.01, 3);
        e.x -= e.face * 3; shake = Math.max(shake, 4); sfx('boom');
        e.cd = Math.max(65, 115 - wave * 2);
      }
      if (e.burst > 0) { if (--e.bt <= 0) { shootAt(e, e.x + 24, e.y + 2, 2.6, 0.6); sfx('eshoot'); e.burst--; e.bt = 6; } }
      else if (--e.mg <= 0 && inPlace) { e.burst = 5; e.mg = 200; }
    } else if (e.type === 'zombie' || e.type === 'zfast') {
      e.face = dx > 0 ? 1 : -1; e.moving = true;
      e.x += e.face * e.spd;
    } else if (e.type === 'queen') {
      if (Math.abs(e.x - e.target) > 1) e.x += Math.sign(e.target - e.x) * 0.25;
      e.face = P.x + 6 > e.x + 28 ? 1 : -1; e.moving = Math.abs(e.x - e.target) > 1;
      if (--e.cd <= 0 && e.x < W - 40) {
        const bx = e.face < 0 ? e.x + 4 : e.x + 52, by = e.y + 12, tx = P.x + 6 - bx, ty = P.y + 6 - by, d = Math.hypot(tx, ty) || 1;
        bullets.push({x: bx, y: by, vx: tx / d * 2.3, vy: ty / d * 2.3, owner: 'e', web: true, life: 220});
        sfx('throw', 0.6); e.cd = Math.max(55, 110 - wave * 2);
      }
      if (--e.brood <= 0 && e.x < W - 40 && enemies.length < 14) {
        const m = 1 + (wave - 1) * 0.15;
        for (const d of [-1, 1]) enemies.push({type: 'spider', x: e.x + 22 + d * 10, y: GROUND - 7, face: d, anim: 0, flash: 0, hp: Math.ceil(3 * m), max: Math.ceil(3 * m), spd: 1.1, vy: -2, onG: false, cd: 60});
        e.brood = 260; sfx('eshoot');
      }
    } else if (e.type === 'mother') {
      const tx = P.x + 6 - 30;
      e.x += clamp((tx - e.x) * 0.02, -0.8, 0.8) + (e.x > W - 20 ? -1 : 0);
      e.y = GROUND - 125 + Math.sin(e.anim * 0.03) * 4;
      if (--e.cd <= 0 && e.x < W - 40) { bombs.push({x: e.x + 30, y: e.y + 22, vx: 0, vy: 0.6}); e.cd = Math.max(28, 60 - wave); }
      if (e.burst > 0) { if (--e.bt <= 0) { shootAt(e, e.x + 30, e.y + 20, 2.6, 0.5); sfx('plasma', 0.5); e.burst--; e.bt = 6; } }
      else if (--e.mg <= 0 && e.x < W - 40) { e.burst = 5; e.mg = 170; }
    } else if (e.type === 'gspider') {
      e.face = dx > 0 ? 1 : -1;
      if (e.onG) {
        e.x += e.face * e.spd;
        if (--e.cd <= 0 && Math.abs(dx) < 110 && onScreen) { e.vy = -3.4; e.onG = false; e.cd = 110 + rand() * 60; }
      } else {
        e.x += e.face * e.spd * 1.8; e.vy += 0.2; e.y += e.vy;
        if (e.y >= GROUND - 14) { e.y = GROUND - 14; e.vy = 0; e.onG = true; shake = Math.max(shake, 2); puff(e.x + 14, GROUND, 6, [MAPS[mapIdx].ground[1]], 1.2, 16, 0.1); }
      }
    } else if (e.type === 'spider') {
      e.face = dx > 0 ? 1 : -1;
      if (e.onG) {
        e.x += e.face * e.spd;
        if (--e.cd <= 0 && Math.abs(dx) < 80 && onScreen) { e.vy = -2.8; e.onG = false; e.cd = 90 + rand() * 60; }
      } else {
        e.x += e.face * e.spd * 1.6; e.vy += 0.2; e.y += e.vy;
        if (e.y >= GROUND - 7) { e.y = GROUND - 7; e.vy = 0; e.onG = true; }
      }
    } else if (e.type === 'bat') {
      if (e.dive > 0) {
        e.dive--;
        const tx = P.x + 6 - (e.x + 7), ty = P.y + 5 - (e.y + 3), d = Math.hypot(tx, ty) || 1;
        e.x += tx / d * 2.2; e.y += ty / d * 2.2; e.face = tx > 0 ? 1 : -1;
      } else {
        e.x += e.face * e.spd;
        const ty = e.by + Math.sin(e.anim * 0.08) * 8; e.y += (ty - e.y) * 0.08;
        if (e.x > 2 && e.x < W - 16) e.inside = true;
        if (e.inside && ((e.x < 2 && e.face < 0) || (e.x > W - 16 && e.face > 0))) e.face = -e.face;
        if (--e.cd <= 0 && e.inside) { e.dive = 70; e.cd = 150 + rand() * 90; }
      }
    } else if (e.type === 'slime') {
      const h = e.small ? 4 : 7;
      if (e.onG) {
        if (--e.hopT <= 0) { e.face = dx > 0 ? 1 : -1; e.vy = -2.4 - rand() * 0.8; e.onG = false; e.hopT = 35 + rand() * 30; }
      } else {
        e.x += e.face * e.spd; e.vy += 0.18; e.y += e.vy;
        if (e.y >= GROUND - h) { e.y = GROUND - h; e.vy = 0; e.onG = true; }
      }
    } else if (e.type === 'kaiju') {
      e.face = dx + 6 > 18 ? 1 : -1;
      if (e.onG && Math.abs(P.x + 6 - (e.x + 18)) > 26) { e.x += e.face * e.spd; e.moving = true; } else e.moving = false;
      if (e.onG && --e.cd <= 0 && e.x < W - 30) { e.vy = -3.2; e.onG = false; e.stomp = true; e.cd = Math.max(110, 170 - wave * 2); }
      if (!e.onG) {
        e.vy += 0.2; e.y += e.vy;
        if (e.y >= GROUND - 39) {
          e.y = GROUND - 39; e.vy = 0; e.onG = true;
          if (e.stomp) {
            e.stomp = false; shake = 9; sfx('boom'); buzz(50);
            for (const d of [-1, 1]) bullets.push({x: e.x + 18 + d * 14, y: GROUND - 3, vx: 2.3 * d, vy: 0, owner: 'e', shock: true, life: 170});
            puff(e.x + 18, GROUND, 20, [MAPS[mapIdx].ground[1], MAPS[mapIdx].ground[2]], 2.5, 30, 0.12, 2);
          }
        }
      }
      if (--e.rock <= 0 && e.x < W - 30) {
        const bx = e.x + 18, by = e.y + 6, t = 55;
        bullets.push({x: bx, y: by, vx: (P.x + 6 - bx) / t, vy: -3, grav: 0.11, owner: 'e', rockb: true, life: 240});
        e.rock = Math.max(70, 130 - wave * 2);
      }
    } else {
      e.x += e.vx;
      if (--e.cd <= 0 && Math.abs(e.x + 10 - (P.x + 6)) < 26 && e.x > 0 && e.x < W - 20) {
        bombs.push({x: e.x + 10, y: e.y + 8, vx: e.vx * 0.5, vy: 0}); e.cd = Math.max(35, 70 - wave * 3);
      }
      if ((e.vx < 0 && e.x < -40) || (e.vx > 0 && e.x > W + 20)) {
        if (e.passes < 2) { e.passes++; e.vx = -e.vx; e.face = -e.face; e.y = GROUND - 134 + rand() * 22; e.cd = 20; }
        else e.gone = true;
      }
      if (tick % 4 === 0 && !inSpace()) smoke.push({x: e.x + (e.vx < 0 ? 19 : 1), y: e.y + 4, vx: 0, vy: -0.05, life: 40, max: 40, s: 2, c: '#8a7a70'});
    }
    } finally { P = sP; }
  }

  // monsters hurt on contact
  for (const pl of livePlayers()) asP(pl, () => {
    if (P.inv > 0 || state !== 'play') return;
    const pb = pbox();
    for (const e of enemies) {
      if (e.dead || !MONSTERS.has(e.type)) continue;
      const b = box(e);
      if (pb.x < b.x + b.w && pb.x + pb.w > b.x && pb.y < b.y + b.h && pb.y + pb.h > b.y) {
        hurt(e.type === 'kaiju' ? 2 : 1);
        P.x = clamp(P.x + (P.x + 6 < b.x + b.w / 2 ? -12 : 12), 0, W - 12); P.vy = -2; P.onGround = false;
        break;
      }
    }
  });

  // bullets
  for (const b of bullets) {
    if (b.grav) b.vy += b.grav;
    if (b.flame) { b.vx *= 0.95; b.vy *= 0.95; }
    b.x += b.vx; b.y += b.vy; b.life--;
    if (b.rocket && tick % 2 === 0) parts.push({x: b.x - Math.sign(b.vx || 0) * 3, y: b.y - Math.sign(b.vy || 0) * 3, vx: 0, vy: -0.1, life: 14, c: rand() < 0.5 ? '#e8772e' : '#6b5d55', g: 0, size: 2});
    if (b.x < -12 || b.x > W + 12 || b.y < -12 || b.y > GROUND - 1 || b.life <= 0) {
      b.dead = true;
      if (b.rocket && b.y > -12 && b.x > -12 && b.x < W + 12) explode(b.x, Math.min(b.y, GROUND - 2), 20, b.dmg, false);
      else if (b.rockb) puff(b.x, GROUND - 2, 8, ['#6b5d55', '#4a3f3a'], 1.5, 20, 0.12, 2);
      else if (b.y > GROUND - 1) puff(b.x, GROUND, 3, [MAPS[mapIdx].ground[1]], 0.8, 10, 0.1);
      continue;
    }
    if (b.owner === 'p') {
      for (const e of enemies) {
        if (e.dead || (b.hit && b.hit.has(e))) continue;
        if (inBox(b.x, b.y, box(e))) {
          if (b.rocket) { b.dead = true; explode(b.x, b.y, 20, b.dmg, false); break; }
          damage(e, b.dmg); if (!b.flame) puff(b.x, b.y, 3, b.plasma ? ['#6fb0e0', '#f1ead8'] : ['#fff2b0', '#f6c56a'], 1, 8, 0);
          if (b.pierce) b.hit.add(e); else { b.dead = true; break; }
        }
      }
    } else for (const pl of livePlayers()) {
      if (b.dead) break;
      asP(pl, () => {
        if (b.web && state === 'play' && inBox(b.x, b.y, pbox(), 2)) {
          b.dead = true; P.slow = 150; floater(P.x + 6, P.y - 8, 'Ağa takıldı!', '#f1ead8'); sfx('no');
        } else if (!b.web && P.inv <= 0 && state === 'play' && inBox(b.x, b.y, pbox(), b.shell || b.rockb ? 2 : b.shock ? 1 : 0)) {
          b.dead = true;
          if (b.shell) explode(b.x, b.y, b.big ? 16 : 12, 0, false);
          hurt(1);
        }
      });
    }
  }
  for (const g of grenades) {
    g.vy += inSpace() ? 0.11 : 0.2; g.x += g.vx; g.y += g.vy;
    if (g.y >= GROUND - 3) { g.y = GROUND - 3; g.vy *= -0.35; g.vx *= 0.6; }
    if (g.x < 1 || g.x > W - 3) g.vx = -g.vx;
    if (--g.t <= 0) { g.dead = true; explode(g.x, g.y, 24, 6, false); }
  }
  for (const b of bombs) {
    b.vy += 0.12; b.x += b.vx; b.y += b.vy;
    if (b.y >= GROUND - 2) { b.dead = true; if (b.ally) explode(b.x, GROUND - 2, 22, 8, false); else explode(b.x, GROUND - 2, 18, 3, true); }
  }
  for (const p of pickups) {
    p.vy += 0.15; p.y += p.vy; if (p.y > GROUND - 7) { p.y = GROUND - 7; p.vy = 0; }
    if (--p.t <= 0) p.dead = true;
    for (const pl of livePlayers()) asP(pl, () => {
    const pb = pbox();
    if (!p.dead && pb.x < p.x + 8 && pb.x + pb.w > p.x && pb.y < p.y + 7 && pb.y + pb.h > p.y) {
      p.dead = true; sfx('pick');
      if (p.kind === 'med') { P.hp = Math.min(P.maxHp, P.hp + 1); floater(p.x + 4, p.y - 4, '+1 can', '#f1ead8'); }
      else if (p.kind === 'gren') { P.gren = Math.min(8, P.gren + 2); floater(p.x + 4, p.y - 4, '+2 bomba', '#f1ead8'); }
      else {
        if (p.kind === 'rapid') P.rapid = 480; else if (p.kind === 'double') P.dbl = 480; else P.armor = Math.min(3, P.armor + 1);
        floater(p.x + 4, p.y - 4, POW_NAME[p.kind], '#f6d38a'); sfx('buy', 0.7); if (P === me()) buzz(15);
      }
    }
    });
  }
  for (const p of parts) {
    p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.life--;
    if (p.wreck) { if (tick % 3 === 0) smoke.push({x: p.x, y: p.y, vx: 0, vy: -0.1, life: 50, max: 50, s: 3, c: '#3a302c'}); if (p.y >= GROUND - 2) { p.life = 0; explode(p.x, GROUND - 2, 16, 3, true); } }
    else if (p.y > GROUND && p.g > 0) { p.y = GROUND; p.vy *= -0.3; p.vx *= 0.5; }
  }
  for (const f of floaters) { f.y -= 0.35; f.t--; }

  enemies = enemies.filter(e => !e.dead && !e.gone);
  bullets = bullets.filter(b => !b.dead);
  grenades = grenades.filter(g => !g.dead);
  bombs = bombs.filter(b => !b.dead);
  pickups = pickups.filter(p => !p.dead);
  parts = parts.filter(p => p.life > 0);
  floaters = floaters.filter(f => f.t > 0);
}

const TIPS_TOUCH = ['Soldaki pedi kaydırarak yürü. Yukarı kaydırınca yukarı nişan alırsın.', 'Ateş tuşunu basılı tutarsan sürekli ateş edersin.', 'Tank mermileri alçaktan gelir. Zıpla ile üstünden atla.', 'Bomba tuşu el bombası atar, kalabalıklara çok iyi gelir.', 'Düşman öldürdükçe Destek çubuğu dolar. Dolunca Destek tuşu hava saldırısı çağırır.', 'Arka arkaya öldürmek seri yapar ve daha çok altın kazandırır.', 'Parlayan kutular geçici güç verir: hızlı atış, çift hasar ya da zırh.', 'Dalga aralarında sağ üstte Mağaza düğmesi çıkar. Duraklat menüsünden de mağazaya girebilirsin.'];
const TIPS_KEYS = ['A ve D ile yürü, W ile yukarı nişan al.', 'J tuşunu basılı tutarsan sürekli ateş edersin.', 'Tank mermileri alçaktan gelir. Boşluk ile üstünden atla.', 'K tuşu el bombası atar, kalabalıklara çok iyi gelir.', 'Düşman öldürdükçe Destek çubuğu dolar. Dolunca L tuşu hava saldırısı çağırır.', 'Arka arkaya öldürmek seri yapar ve daha çok altın kazandırır.', 'Parlayan kutular geçici güç verir: hızlı atış, çift hasar ya da zırh.', 'Dalga aralarında sağ üstte Mağaza düğmesi çıkar. P ile duraklatıp da mağazaya girebilirsin.'];
function showTip(t) {
  const el = $('tip'); el.textContent = t; el.classList.remove('hidden');
  clearTimeout(showTip.t); showTip.t = setTimeout(() => el.classList.add('hidden'), 5000);
}
const EMITTERS = [[0.18, 34], [0.55, 40], [0.91, 32]];
function ambient() {
  const m = MAPS[mapIdx];
  if (m.amb === 'smoke' && rand() < 0.25) {
    const [fx, fy] = EMITTERS[Math.floor(rand() * EMITTERS.length)], ex = W * fx, ey = GROUND - fy;
    smoke.push({x: ex + rand() * 4, y: ey, vx: 0.12 + rand() * 0.08, vy: -0.18 - rand() * 0.1, life: 220, max: 220, s: 3 + Math.floor(rand() * 3), c: rand() < 0.5 ? m.smoke[0] : m.smoke[1]});
  } else if (m.amb === 'snow' && rand() < 0.7) {
    smoke.push({x: rand() * (W + 40) - 20, y: -2, vx: -0.15 + rand() * 0.1, vy: 0.3 + rand() * 0.3, life: H * 4, max: H * 4, s: rand() < 0.2 ? 2 : 1, c: rand() < 0.7 ? '#ffffff' : '#dfe8f2', flat: true});
  } else if (m.amb === 'fog' && rand() < 0.05) {
    smoke.push({x: -20, y: GROUND - 3 - rand() * 18, vx: 0.15 + rand() * 0.2, vy: 0, life: W * 6, max: W * 6, s: 10 + Math.floor(rand() * 10), c: '#7d8a78', fog: true});
  } else if (m.amb === 'dust' && rand() < 0.2) {
    smoke.push({x: rand() * W, y: -2, vx: (rand() - 0.5) * 0.1, vy: 0.15 + rand() * 0.2, life: H * 8, max: H * 8, s: 1, c: rand() < 0.5 ? '#8a7560' : '#6b5a48', flat: true});
  } else if (m.amb === 'sand' && rand() < 0.35) {
    smoke.push({x: -4, y: GROUND - 2 - rand() * 70, vx: 1 + rand() * 1.4, vy: (rand() - 0.5) * 0.1, life: W, max: W, s: 1, c: rand() < 0.5 ? '#f1e2bc' : '#e3c992', flat: true, streak: true});
  }
  for (const s of smoke) {
    s.x += s.vx; s.y += s.vy; s.life--;
    if ((s.flat && (s.y > GROUND || s.x > W + 6)) || (s.fog && s.x > W + 20)) s.life = 0;
  }
  smoke = smoke.filter(s => s.life > 0);
  if (shake > 0.2) shake *= 0.86; else shake = 0;
}

/* ---------- draw ---------- */
function spr(s, x, y, face, flash, nativeLeft = false, dw, dh) {
  const right = nativeLeft ? face < 0 : face > 0;
  const img = flash ? (right ? s.wr : s.wl) : (right ? s.r : s.l);
  if (dw) ctx.drawImage(img, Math.round(x), Math.round(y), dw, dh);
  else ctx.drawImage(img, Math.round(x), Math.round(y));
}
function soldierFrame(o, moving, fast) {
  if (o === P && !o.onGround) return 'jump';
  if (!moving) return 'idle';
  return (Math.floor(o.anim / (fast ? 4 : 8)) % 2) ? 'w1' : 'w2';
}
function gunOverlay() {
  if (P.up) return;
  const x = Math.round(P.x), y = Math.round(P.y), f = P.face;
  const R = (dx, dy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(f > 0 ? x + dx : x + 12 - dx - w, y + dy, w, h); };
  switch (curWeapon().id) {
    case 'smg': R(8, 7, 2, 2, '#1d1f16'); R(11, 5, 1, 1, '#1d1f16'); break;
    case 'shotgun': R(7, 7, 5, 1, '#3d2b1c'); R(12, 6, 1, 1, '#5a5d5f'); break;
    case 'sniper': R(12, 6, 4, 1, '#5a5d5f'); R(8, 5, 4, 1, '#1d1f16'); break;
    case 'flame': R(0, 5, 2, 4, '#c9302c'); R(11, 6, 3, 1, '#5a5d5f'); if (K.fire && state === 'play') R(14, 5, 2, 3, (tick >> 1) % 2 ? '#f6a45a' : '#fff2b0'); break;
    case 'glauncher': R(6, 5, 7, 3, '#3d2b1c'); R(12, 5, 2, 3, '#1d1f16'); break;
    case 'plasma': R(7, 5, 6, 1, '#6fb0e0'); R(12, 6, 2, 1, '#6fb0e0'); break;
    case 'minigun': R(4, 5, 11, 3, '#5a5d5f'); R(4, 5, 11, 1, (tick >> 1) % 2 && K.fire ? '#f1ead8' : '#9aa0a3'); break;
    case 'rocket': R(3, 4, 13, 3, '#3f4a2a'); R(3, 4, 13, 1, '#5d6b3a'); R(15, 4, 1, 3, '#1d1f16'); R(2, 4, 1, 3, '#1d1f16'); break;
  }
}
function text(t, x, y, col = '#f6d38a', align = 'center') {
  ctx.font = '8px Silkscreen, ui-monospace, monospace'; ctx.textAlign = align; ctx.textBaseline = 'top';
  ctx.fillStyle = '#1c1522'; ctx.fillText(t, Math.round(x) + 1, Math.round(y) + 1);
  ctx.fillStyle = col; ctx.fillText(t, Math.round(x), Math.round(y));
}
function bar(x, y, w, frac, col = '#e8772e') {
  ctx.fillStyle = '#1c1522'; ctx.fillRect(Math.round(x), Math.round(y), w, 2);
  ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), Math.max(0, Math.round(w * frac)), 2);
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const sx = shake ? Math.round((rand() - 0.5) * shake) : 0, sy = shake ? Math.round((rand() - 0.5) * shake) : 0;
  ctx.translate(sx, sy);
  ctx.drawImage(bg, 0, 0);

  for (const s of smoke) {
    if (s.fog) { ctx.globalAlpha = 0.07; ctx.fillStyle = s.c; ctx.fillRect(Math.round(s.x - s.s), Math.round(s.y - s.s / 3), s.s * 2, Math.round(s.s / 1.5)); continue; }
    if (s.flat) {
      ctx.globalAlpha = 0.85; ctx.fillStyle = s.c;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), s.streak ? 3 : s.s, s.s);
      continue;
    }
    ctx.globalAlpha = Math.min(1, s.life / s.max * 1.4) * 0.8; ctx.fillStyle = s.c;
    const z = s.s + Math.floor((1 - s.life / s.max) * 4); ctx.fillRect(Math.round(s.x - z / 2), Math.round(s.y - z / 2), z, z);
  }
  ctx.globalAlpha = 1;
  if (!P) return;

  for (const p of pickups) {
    if (p.t < 120 && (p.t >> 3) % 2) continue;
    if (POW[p.kind]) {
      const by = Math.round(p.y - 1 + Math.sin(tick * 0.15 + p.x) * 1.5);
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(tick * 0.2); ctx.fillStyle = '#fff2b0'; ctx.fillRect(Math.round(p.x) - 1, by - 1, 9, 9); ctx.globalAlpha = 1;
      ctx.drawImage(POW[p.kind].r, Math.round(p.x), by);
    } else ctx.drawImage(p.kind === 'med' ? MED.r : CRATE.r, Math.round(p.x), Math.round(p.y));
  }

  for (const e of enemies) {
    if (SOLDIER_TYPES.has(e.type)) {
      let fl = e.flash > 0;
      if (e.type === 'runner' && Math.abs(e.x - P.x) < 50 && (e.anim >> 2) % 2) fl = true;
      spr((inSpace() ? ESPR_SPACE : ESPR)[e.type][soldierFrame(e, e.moving, e.type === 'runner')], e.x, e.y, e.face, fl);
      if (e.type === 'runner') { ctx.fillStyle = (e.anim >> 3) % 2 ? '#c9302c' : '#f2c14e'; ctx.fillRect(Math.round(e.x) + 5, Math.round(e.y) - 2, 2, 2); }
      if (e.type === 'heavy') { ctx.fillStyle = '#5a5d5f'; ctx.fillRect(Math.round(e.x) + (e.face > 0 ? 3 : 1), Math.round(e.y) + 5, 8, 4); bar(e.x + 1, e.y - 4, 10, e.hp / e.max); }
      if (e.type === 'sniper' && e.aim) {
        const bx = e.face > 0 ? e.x + 12 : e.x - 1, by = e.y + 6, dx = e.aim.x - bx, dy = e.aim.y - by, d = Math.hypot(dx, dy);
        ctx.fillStyle = e.cd < 20 ? '#ff4040' : 'rgba(255,64,64,.55)';
        for (let i = 0; i < d; i += 4) ctx.fillRect(Math.round(bx + dx / d * i), Math.round(by + dy / d * i), 1, 1);
      }
    } else if (e.type === 'tank') {
      spr(TANK, e.x, e.y, e.face, e.flash > 0, true);
      bar(e.x + 6, e.y - 4, 14, e.hp / e.max);
    } else if (e.type === 'boss') {
      spr(BOSS, e.x, e.y, e.face, e.flash > 0, true, 48, 22);
    } else if (e.type === 'zombie') {
      spr(ZOMB[soldierFrame(e, true)], e.x, e.y, e.face, e.flash > 0);
    } else if (e.type === 'zfast') {
      spr(ZOMBF[soldierFrame(e, true, true)], e.x, e.y, e.face, e.flash > 0);
    } else if (e.type === 'gspider') {
      spr(GSPIDER[e.onG ? (e.anim >> 3) % 2 : 1], e.x, e.y, e.face, e.flash > 0, false, 28, 14);
      bar(e.x + 6, e.y - 3, 16, e.hp / e.max);
    } else if (e.type === 'queen') {
      spr(QUEEN[(e.anim >> 4) % 2], e.x, e.y, e.face, e.flash > 0, false, 56, 28);
    } else if (e.type === 'mother') {
      if ((e.cd < 10) && (tick >> 1) % 2) { ctx.fillStyle = 'rgba(148,196,106,.35)'; ctx.fillRect(Math.round(e.x) + 24, Math.round(e.y) + 22, 12, GROUND - e.y - 22); }
      spr(UFO, e.x, e.y, e.face, e.flash > 0, false, 60, 24);
    } else if (e.type === 'kaiju') {
      spr(ZOMB[e.onG ? soldierFrame(e, e.moving) : 'idle'], e.x, e.y, e.face, e.flash > 0, false, 36, 39);
      if (e.onG && e.cd < 30 && (e.anim >> 2) % 2) { ctx.fillStyle = '#c9302c'; ctx.fillRect(Math.round(e.x) + 16, Math.round(e.y) - 5, 4, 3); }
    } else if (e.type === 'spider') {
      spr((inSpace() ? CRAWLER : SPIDER)[e.onG ? (e.anim >> 3) % 2 : 1], e.x, e.y, e.face, e.flash > 0);
    } else if (e.type === 'bat') {
      spr(BAT[(e.anim >> (e.dive > 0 ? 1 : 3)) % 2], e.x, e.y, e.face, e.flash > 0);
    } else if (e.type === 'slime') {
      const sc = e.small ? 0.6 : 1, air = !e.onG, sq = e.onG && e.hopT < 8;
      const dw = Math.round((air ? 8 : sq ? 12 : 10) * sc), dh = Math.round((air ? 9 : sq ? 5 : 7) * sc);
      spr(SLIME, e.x + (10 * sc - dw) / 2, e.y + 7 * sc - dh, e.face, e.flash > 0, false, dw, dh);
    } else if (inSpace()) spr(UFO, e.x, e.y, e.face, e.flash > 0);
    else spr(PLANE, e.x, e.y, e.face, e.flash > 0, true);
  }

  for (const a of allies) spr(ALLY, a.x, a.y, 1, false, true);
  for (const pl of [P, P2]) if (pl) asP(pl, () => {
  if (P.down) {
    ctx.globalAlpha = 0.35; spr(SPRC[curChar().id].p.idle, P.x, P.y, P.face, false); ctx.globalAlpha = 1;
    text('Yaralı', P.x + 6, P.y - 10, '#ff9a4a');
    return;
  }
  if (state !== 'over' || P.hp > 0) {
    if ((P.rapid > 0 || P.dbl > 0) && tick % 4 === 0) parts.push({x: P.x + 2 + rand() * 8, y: P.y + 12, vx: 0, vy: -0.4, life: 16, c: P.dbl > 0 ? '#ff6b6b' : '#f6a45a', g: 0, size: 1});
    if (!(P.inv > 0 && (P.inv >> 2) % 2)) {
      const set = P.up ? SPRC[curChar().id].pu : SPRC[curChar().id].p;
      spr(set[soldierFrame(P, P.vx !== 0)], P.x, P.y, P.face, false);
      gunOverlay();
      if (inSpace()) { ctx.fillStyle = 'rgba(191,228,255,.75)'; const hx0 = Math.round(P.x) + 2, hy0 = Math.round(P.y) - 1; ctx.fillRect(hx0 + 1, hy0, 6, 1); ctx.fillRect(hx0, hy0 + 1, 1, 5); ctx.fillRect(hx0 + 7, hy0 + 1, 1, 5); ctx.fillRect(hx0 + 1, hy0 + 6, 6, 1); }
      if (P.slow > 0) { ctx.fillStyle = 'rgba(241,234,216,.8)'; for (let i = 0; i < 6; i++) ctx.fillRect(Math.round(P.x) + 1 + ((i * 5) % 10), Math.round(P.y) + 2 + ((i * 7) % 11), 2, 1); }
      if (P.armor > 0) { ctx.fillStyle = '#6fb0e0'; ctx.fillRect(Math.round(P.x) + 4, Math.round(P.y) + 7, 4, 1); }
    }
  }
  if (P2) text(P === me() ? 'Sen' : 'Arkadaş', P.x + 6, P.y - 10, P === me() ? '#f6d38a' : '#6fb0e0');
  });

  for (const b of bullets) {
    const bx = Math.round(b.x), by = Math.round(b.y);
    if (b.shell) { const s = b.big ? 2 : 1; ctx.fillStyle = '#1d1f16'; ctx.fillRect(bx - 2 * s, by - s, 5 * s, 3 * s - (s - 1)); ctx.fillStyle = '#e8772e'; ctx.fillRect(bx - (b.vx > 0 ? 4 * s : -3 * s), by, 2, 1); }
    else if (b.flame) { const age = 1 - b.life / b.max, z = Math.round(2 + age * 3); ctx.fillStyle = age < 0.3 ? '#fff2b0' : age < 0.65 ? '#f6a45a' : '#c9302c'; ctx.fillRect(bx - (z >> 1), by - (z >> 1), z, z); }
    else if (b.plasma) { ctx.fillStyle = '#3d7fb3'; ctx.fillRect(bx - 3, by - 1, 7, 3); ctx.fillStyle = '#bfe4ff'; ctx.fillRect(bx - 2, by, 5, 1); }
    else if (b.shock) { ctx.fillStyle = MAPS[mapIdx].ground[1]; ctx.fillRect(bx - 3, by - 2, 7, 3); ctx.fillStyle = '#6b5d55'; ctx.fillRect(bx - 2, by - 4, 5, 2); if (tick % 3 === 0) parts.push({x: b.x, y: GROUND - 2, vx: (rand() - 0.5), vy: -1.2, life: 14, c: MAPS[mapIdx].ground[2], g: 0.12, size: 1}); }
    else if (b.rockb) { ctx.fillStyle = '#1d1f16'; ctx.fillRect(bx - 3, by - 3, 6, 6); ctx.fillStyle = '#6b5d55'; ctx.fillRect(bx - 2, by - 2, 4, 4); }
    else if (b.rocket && b.grav) { ctx.fillStyle = '#1d1f16'; ctx.fillRect(bx - 2, by - 2, 4, 4); ctx.fillStyle = '#7f9446'; ctx.fillRect(bx - 1, by - 1, 2, 2); }
    else if (b.rocket) { ctx.fillStyle = '#3f4a2a'; if (Math.abs(b.vy) > Math.abs(b.vx)) ctx.fillRect(bx - 1, by - 2, 2, 5); else ctx.fillRect(bx - 2, by - 1, 5, 2); ctx.fillStyle = '#c9302c'; ctx.fillRect(bx + (b.vx > 0 ? 2 : b.vx < 0 ? -2 : 0), by + (b.vy < 0 ? -2 : 0), 1, 1); }
    else if (b.owner === 'p') { ctx.fillStyle = b.pierce ? '#ffffff' : '#fff2b0'; const l = b.pierce ? 5 : 3; if (Math.abs(b.vy) > Math.abs(b.vx)) ctx.fillRect(bx, by, 1, l); else ctx.fillRect(bx - 1, by, l, 1); }
    else if (b.sniper) { ctx.fillStyle = '#ff4040'; ctx.fillRect(bx - 1, by, 3, 1); }
    else if (b.web) { ctx.fillStyle = '#f1ead8'; ctx.fillRect(bx - 2, by, 5, 1); ctx.fillRect(bx, by - 2, 1, 5); ctx.fillRect(bx - 1, by - 1, 1, 1); ctx.fillRect(bx + 1, by + 1, 1, 1); ctx.fillRect(bx + 1, by - 1, 1, 1); ctx.fillRect(bx - 1, by + 1, 1, 1); }
    else { ctx.fillStyle = inSpace() ? '#94c46a' : '#e8772e'; ctx.fillRect(bx, by, 2, 2); }
  }
  for (const g of grenades) { ctx.fillStyle = '#1d1f16'; ctx.fillRect(Math.round(g.x) - 2, Math.round(g.y) - 2, 4, 4); ctx.fillStyle = '#7f9446'; ctx.fillRect(Math.round(g.x) - 1, Math.round(g.y) - 1, 2, 2); if ((g.t >> 2) % 2) { ctx.fillStyle = '#c9302c'; ctx.fillRect(Math.round(g.x), Math.round(g.y) - 3, 1, 1); } }
  for (const b of bombs) if (inSpace() && !b.ally) { ctx.fillStyle = '#94c46a'; ctx.fillRect(Math.round(b.x) - 2, Math.round(b.y) - 2, 4, 4); ctx.fillStyle = '#f1ead8'; ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 2, 2); } else { ctx.fillStyle = '#1d1f16'; ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 3, 3, 6); ctx.fillStyle = '#5a5d5f'; ctx.fillRect(Math.round(b.x) - 2, Math.round(b.y) - 4, 5, 1); }
  for (const p of parts) { ctx.fillStyle = p.c; const z = p.size; ctx.fillRect(Math.round(p.x - z / 2), Math.round(p.y - z / 2), z, z); }
  for (const f of floaters) text(f.txt, f.x, f.y, f.col);

  // HUD
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const realP = P; P = me();
  try {
  const hx = 4 + insetX, hy = 4 + insetY;
  for (let i = 0; i < P.maxHp; i++) ctx.drawImage((i < P.hp ? HEART : HEART0).r, hx + i * 9, hy);
  for (let i = 0; i < P.armor; i++) ctx.drawImage(ARMOR.r, hx + P.maxHp * 9 + 2 + i * 8, hy);
  for (let i = 0; i < P.gren; i++) ctx.drawImage(GREN.r, hx + 1 + i * 7, hy + 9);
  const mb = 40, full = P.meter >= 100;
  ctx.fillStyle = '#1c1522'; ctx.fillRect(hx, hy + 17, mb + 2, 4);
  ctx.fillStyle = full ? ((tick >> 3) % 2 ? '#f6d38a' : '#e8772e') : '#6fb0e0';
  ctx.fillRect(hx + 1, hy + 18, Math.round(mb * P.meter / 100), 2);
  if (full && !isTouch) text('L: destek', hx + mb + 5, hy + 15, '#f6d38a', 'left');
  let ly = hy + 25;
  if (combo >= 2) { text('Seri x' + combo, hx, ly, '#ff9a4a', 'left'); bar(hx, ly + 9, 30, comboT / 150, '#ff9a4a'); ly += 14; }
  if (P.rapid > 0) { text('Hızlı atış ' + Math.ceil(P.rapid / 60), hx, ly, '#f6a45a', 'left'); ly += 10; }
  if (P.dbl > 0) { text('Çift hasar ' + Math.ceil(P.dbl / 60), hx, ly, '#ff6b6b', 'left'); ly += 10; }
  const boss = enemies.find(e => BOSSES.has(e.type));
  const ty = Math.max(hy + 18, hudLow + 4);
  if (boss) {
    const bw = Math.round(W * 0.34);
    text(BOSS_NAME[boss.type], W / 2, ty, '#f6d38a');
    ctx.fillStyle = '#1c1522'; ctx.fillRect(Math.round(W / 2 - bw / 2) - 1, ty + 9, bw + 2, 5);
    ctx.fillStyle = '#c9302c'; ctx.fillRect(Math.round(W / 2 - bw / 2), ty + 10, Math.round(bw * boss.hp / boss.max), 3);
  } else if (state === 'play' && queue.length === 0 && enemies.length && enemies.length <= 2) text('Son ' + enemies.length, W / 2, ty, '#f6d38a');
  if (hurtFlash > 0) { ctx.fillStyle = `rgba(201,48,44,${hurtFlash / 14 * 0.28})`; ctx.fillRect(0, 0, W, H); hurtFlash--; }
  } finally { P = realP; }
}

/* ---------- HUD sync & loop ---------- */
let lastHud = '';
function syncHud(force) {
  const left = queue.length + enemies.length;
  const Q = me();
  const s = `${left}|${wave}|${score}|${save.gold}|${save.weapon}|${wLv(save.weapon)}|${Q ? Q.gren : 0}|${Q && Q.meter >= 100}`;
  if (s === lastHud && !force) return; lastHud = s;
  $('hLeft').textContent = left; $('hWave').textContent = wave; $('hScore').textContent = score; $('hGold').textContent = save.gold;
  $('btnWeapon').textContent = wLabel(myWeapon());
  measureHud();
  if (Q) { $('actSpecial').classList.toggle('ready', Q.meter >= 100); $('gCnt').textContent = Q.gren; document.querySelector('.act.gren').classList.toggle('empty', Q.gren === 0); }
}

const stageEl = $('stage');
function measureHud() {
  const r = document.querySelector('.hud').getBoundingClientRect(), vw = stageEl.clientWidth || innerWidth, vh = stageEl.clientHeight || innerHeight;
  // only push the boss bar down when the HUD reaches the middle of the screen
  hudLow = r.left < vw * 0.67 ? Math.ceil(r.bottom * H / vh) : 0;
}
function fit() {
  const vw = stageEl.clientWidth || innerWidth, vh = stageEl.clientHeight || innerHeight, a = vw / vh;
  const oldG = GROUND;
  cv.classList.toggle('fixed', !!net.role);
  if (net.role) { W = 320; H = 180; GROUND = 140; }
  else if (a >= 1) { H = 180; W = Math.round(clamp(180 * a, 200, 480)); GROUND = H - (isTouch ? 44 : 28); }
  else { W = 240; H = Math.round(240 / a); GROUND = Math.round(H * 0.64); }
  cv.width = W; cv.height = H; ctx.imageSmoothingEnabled = false;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;padding-left:env(safe-area-inset-left,0px);padding-top:env(safe-area-inset-top,0px);visibility:hidden';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  insetX = Math.round(parseFloat(cs.paddingLeft) * W / vw); insetY = Math.round(parseFloat(cs.paddingTop) * H / vh);
  probe.remove();
  buildBg(); measureHud();
  const dy = GROUND - oldG;
  if (P) {
    P.x = clamp(P.x, 0, W - 12); P.y += dy; if (P2) { P2.x = clamp(P2.x, 0, W - 12); P2.y += dy; }
    for (const e of enemies) { e.y += dy; if (e.by) e.by += dy; if (e.type === 'tank' || e.type === 'boss') e.target = Math.min(e.target, W - (e.type === 'boss' ? 56 : 30)); }
    for (const p of pickups) p.y += dy;
    for (const g of grenades) g.y += dy;
    for (const b of bombs) b.y += dy;
    for (const b of bullets) b.y += dy;
    parts = []; smoke = [];
  }
}
/* ---------- online co-op (PeerJS, host-authoritative) ---------- */
const ETYPES = ['inf', 'runner', 'sniper', 'heavy', 'tank', 'plane', 'boss', 'zombie', 'zfast', 'spider', 'gspider', 'bat', 'slime', 'kaiju', 'queen', 'mother'];
const BFLAGS = ['p', 'shell', 'big', 'rocket', 'grav', 'flame', 'plasma', 'pierce', 'sniper', 'web', 'shock', 'rockb'];
const r1 = v => Math.round(v * 10) / 10;
function netSend(msg) { try { if (net.conn && net.conn.open) net.conn.send(msg); } catch (e) {} }
function netFlush() { if (net.role === 'host' && net.conn) netSend(netSnapshot()); }
function setNetStatus(html) { $('netStatus').innerHTML = html; }
function packPlayer(p, host) {
  if (!p) return null;
  return {x: r1(p.x), y: r1(p.y), vx: r1(p.vx), f: p.face, u: p.up ? 1 : 0, og: p.onGround ? 1 : 0, hp: p.hp, mh: p.maxHp, ar: p.armor, gr: p.gren,
    inv: p.inv, an: p.anim, ch: host ? save.char : p.ch, wp: host ? save.weapon : p.wpn, me: Math.round(p.meter), ra: p.rapid, db: p.dbl, sl: p.slow, dn: p.down ? 1 : 0};
}
function unpackPlayer(o, prev) {
  if (!o) return null;
  const p = prev || newPlayer(o.x, o.ch);
  Object.assign(p, {x: o.x, y: o.y, vx: o.vx, face: o.f, up: !!o.u, onGround: !!o.og, hp: o.hp, maxHp: o.mh, armor: o.ar, gren: o.gr, inv: o.inv, anim: o.an,
    ch: o.ch, wpn: o.wp, meter: o.me, rapid: o.ra, dbl: o.db, slow: o.sl, down: !!o.dn});
  return p;
}
function netSnapshot() {
  return {t: 's', w: wave, sc: score, q: queue.length, ct: clearT, mi: mapIdx, md: save.mode, cb: combo, cbt: comboT,
    pl: [packPlayer(P, true), packPlayer(P2, false)],
    en: enemies.map(e => [ETYPES.indexOf(e.type), r1(e.x), r1(e.y), e.face, e.flash, r1(e.hp), e.max, (e.moving ? 1 : 0) | (e.onG ? 2 : 0) | (e.small ? 4 : 0), e.anim, Math.round(e.cd || 0), e.dive | 0, Math.round(e.hopT || 0), e.aim ? r1(e.aim.x) : null, e.aim ? r1(e.aim.y) : null]),
    bu: bullets.map(b => { let f = b.owner === 'p' ? 1 : 0; for (let i = 1; i < BFLAGS.length; i++) if (b[BFLAGS[i]]) f |= 1 << i; return [r1(b.x), r1(b.y), r1(b.vx), r1(b.vy), f, Math.round(b.life), Math.round(b.max || 0), b.grav || 0]; }),
    gr: grenades.map(g => [r1(g.x), r1(g.y), g.t]),
    bo: bombs.map(b => [r1(b.x), r1(b.y), b.ally ? 1 : 0]),
    pk: pickups.map(p => [r1(p.x), r1(p.y), p.kind, p.t]),
    al: allies.map(a => [r1(a.x), r1(a.y)]),
    ev: net.events.splice(0)};
}
function applySnap(s) {
  wave = s.w; score = s.sc; queue.length = s.q; clearT = s.ct; combo = s.cb; comboT = s.cbt;
  net.mode = s.md;
  if (s.mi !== mapIdx) { mapIdx = s.mi; buildBg(); smoke = []; }
  P = unpackPlayer(s.pl[0], P);
  const prevHp = P2 ? P2.hp : null;
  P2 = unpackPlayer(s.pl[1], P2);
  if (P2 && prevHp != null && P2.hp < prevHp) { hurtFlash = 14; buzz(60); shake = Math.max(shake, 5); }
  enemies = s.en.map(a => ({type: ETYPES[a[0]], x: a[1], y: a[2], face: a[3], flash: a[4], hp: a[5], max: a[6], moving: !!(a[7] & 1), onG: !!(a[7] & 2), small: !!(a[7] & 4), anim: a[8], cd: a[9], dive: a[10], hopT: a[11], aim: a[12] != null ? {x: a[12], y: a[13]} : null}));
  bullets = s.bu.map(a => { const b = {x: a[0], y: a[1], vx: a[2], vy: a[3], owner: a[4] & 1 ? 'p' : 'e', life: a[5], max: a[6], grav: a[7]}; for (let i = 1; i < BFLAGS.length; i++) if (a[4] & (1 << i)) b[BFLAGS[i]] = true; if (b.grav) b.grav = a[7]; return b; });
  grenades = s.gr.map(a => ({x: a[0], y: a[1], t: a[2]}));
  bombs = s.bo.map(a => ({x: a[0], y: a[1], ally: !!a[2], vy: 0}));
  pickups = s.pk.map(a => ({x: a[0], y: a[1], kind: a[2], t: a[3]}));
  allies = s.al.map(a => ({x: a[0], y: a[1]}));
  for (const ev of s.ev) {
    if (ev.e === 'x') fxExplode(ev.x, ev.y, ev.r);
    else if (ev.e === 'f') floaters.push({x: ev.x, y: ev.y, txt: ev.t, t: 50, col: ev.c});
    else if (ev.e === 'b') banner(ev.t, ev.f);
    else if (ev.e === 'k') puff(ev.x, ev.y, ev.m ? 16 : 10, [ev.c, PAL.k, MAPS[mapIdx].ground[1]], 1.6, 30, 0.1, 1);
    else if (ev.e === 'g') { const n = Math.round(ev.n * myChar().gold); save.gold += n; runGold += n; }
  }
  $('btnShopHud').classList.toggle('hidden', !(clearT > 0));
}
let gFireT = 0;
function guestTick() {
  tick++;
  for (const b of bullets) { if (b.grav) b.vy += b.grav; if (b.flame) { b.vx *= 0.95; b.vy *= 0.95; } b.x += b.vx; b.y += b.vy; }
  for (const p of parts) { p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.life--; if (p.y > GROUND && p.g > 0) { p.y = GROUND; p.vy *= -0.3; } }
  parts = parts.filter(p => p.life > 0);
  for (const f of floaters) { f.y -= 0.35; f.t--; }
  floaters = floaters.filter(f => f.t > 0);
  for (const e of enemies) e.anim++;
  if (P2) P2.anim++;
  const w = myWeapon();
  if (K.fire && state === 'play' && P2 && !P2.down && --gFireT <= 0) { gFireT = Math.max(3, Math.round(w.cd * (1 - 0.15 * (wLv(w.id) - 1)))); if (!w.flame || tick % 6 === 0) sfx({smg:'smg', minigun:'smg', shotgun:'shotgun', sniper:'snipe', rocket:'rocket', glauncher:'throw', plasma:'plasma', flame:'flame'}[w.id] || 'shoot', 0.7); }
  const inp = state === 'shop' ? 0 : (K.left ? 1 : 0) | (K.right ? 2 : 0) | (K.up ? 4 : 0) | (K.jump ? 8 : 0) | (K.fire ? 16 : 0);
  const sig = inp + '|' + save.weapon + '|' + save.char;
  if (grenPressed || jumpPressed || specialPressed || sig !== net.lastSig || tick - net.sent > 10) {
    netSend({t: 'i', k: inp, g: grenPressed ? 1 : 0, j: jumpPressed ? 1 : 0, s: specialPressed ? 1 : 0, wp: save.weapon, lv: wLv(save.weapon), ch: save.char});
    grenPressed = jumpPressed = specialPressed = false; net.lastSig = sig; net.sent = tick;
  }
}
function hostOnData(d) {
  if (!d || !P2) return;
  if (d.t === 'i') {
    P2.in = {left: !!(d.k & 1), right: !!(d.k & 2), up: !!(d.k & 4), jump: !!(d.k & 8), fire: !!(d.k & 16)};
    P2.fl = {g: P2.fl.g || !!d.g, j: P2.fl.j || !!d.j, s: P2.fl.s || !!d.s};
    if (WEAPONS.some(w => w.id === d.wp)) { P2.wpn = d.wp; P2.lvs = {[d.wp]: clamp(d.lv | 0, 1, 3)}; }
    if (d.ch !== P2.ch && CHARS.some(c => c.id === d.ch)) { const c = CHARS.find(k => k.id === d.ch); P2.ch = d.ch; P2.maxHp = c.hp; P2.hp = Math.min(P2.hp, c.hp); }
  } else if (d.t === 'buy') applySupply(P2, d.k);
}
function guestOnData(d) {
  if (!d) return;
  if (d.t === 'start') {
    net.mode = d.md; fit(); hideOverlays();
    enemies = []; bullets = []; grenades = []; bombs = []; parts = []; pickups = []; floaters = []; allies = []; runGold = 0;
    P = newPlayer(60, 'ali'); P2 = newPlayer(90, save.char);
    mapIdx = modeMapFor(1); buildBg(); smoke = []; state = 'play'; $('btnPause').textContent = 'II'; musicStart();
    banner('Odaya katıldın!', 90);
  } else if (d.t === 's') { if (state === 'play' || state === 'shop') applySnap(d); }
  else if (d.t === 'pause') banner(d.on ? 'Oda sahibi oyunu duraklattı' : 'Oyun devam ediyor', d.on ? 600 : 60);
  else if (d.t === 'over') {
    state = 'over'; musicStop(); persist(); $('btnShopHud').classList.add('hidden');
    $('overText').textContent = `Takım ${d.w}. dalgaya kadar dayandı. ${d.sc} puan toplandı, sen ${runGold} altın kazandın. Oda sahibi yeni oyun başlatınca devam edersiniz.`;
    hideOverlays(); $('over').classList.remove('hidden');
  }
}
function startCoopHost() {
  fit(); hideOverlays(); reset();
  P2 = newPlayer(90, 'ali'); P2.in = {}; P2.fl = {};
  state = 'play'; $('btnPause').textContent = 'II'; musicStart();
  netSend({t: 'start', md: save.mode});
  banner('Arkadaşın katıldı! Birlikte savaşın.', 120);
}
function onNetLost(msg) {
  const wasGuest = net.role === 'guest';
  netLeave(true);
  if (wasGuest) { toMenu(); hideOverlays(); $('net').classList.remove('hidden'); setNetStatus(msg || 'Bağlantı koptu.'); }
  else if (state === 'play' || state === 'shop' || state === 'pause') { P2 = null; fit(); banner('Arkadaşın ayrıldı, tek başına devam ediyorsun', 150); }
}
function netLeave(silent) {
  const c = net.conn, p = net.peer;
  net.role = null; net.conn = null; net.peer = null; net.mode = null; net.events = [];
  try { c && c.close(); } catch (e) {}
  try { p && p.destroy(); } catch (e) {}
  P2 = null; fit();
}
function peerCtor() { return window.Peer || (window.peerjs && window.peerjs.Peer); }
const NOPEER = 'Bağlantı kurulamadı. Çok oyunculu mod internet ister ve Claude içinde çalışmaz; oyunu kendi sitende (ör. Netlify) aç.';
function netHost() {
  const Peer = peerCtor(); if (!Peer) { setNetStatus(NOPEER); return; }
  netLeave(true);
  const code = Array.from({length: 5}, () => 'ABCDEFGHJKLMNPRSTUVYZ23456789'[Math.floor(rand() * 29)]).join('');
  setNetStatus('Oda kuruluyor...');
  const peer = new Peer('siper-oda-' + code, {debug: 0});
  net.peer = peer; net.code = code;
  const to = setTimeout(() => { if (net.peer === peer && !peer.open) { setNetStatus(NOPEER); netLeave(true); } }, 9000);
  peer.on('open', () => { clearTimeout(to); setNetStatus(`Oda kodun: <b>${code}</b>Arkadaşın bu kodu girince oyun başlar.`); });
  peer.on('connection', conn => {
    if (net.conn) { conn.on('open', () => conn.close()); return; }
    conn.on('open', () => { net.conn = conn; net.role = 'host'; startCoopHost(); });
    conn.on('data', hostOnData);
    conn.on('close', () => { if (net.conn === conn) onNetLost(); });
    conn.on('error', () => { if (net.conn === conn) onNetLost(); });
  });
  peer.on('error', err => {
    if (net.peer !== peer) return;
    if (err && err.type === 'unavailable-id') { netHost(); return; }
    if (!net.conn) { clearTimeout(to); setNetStatus(NOPEER); netLeave(true); }
  });
  peer.on('disconnected', () => { try { if (net.peer === peer && net.conn) peer.reconnect(); } catch (e) {} });
}
function netJoin() {
  const code = $('joinCode').value.trim().toUpperCase();
  if (code.length < 5) { setNetStatus('5 harfli oda kodunu yaz.'); return; }
  const Peer = peerCtor(); if (!Peer) { setNetStatus(NOPEER); return; }
  netLeave(true);
  setNetStatus('Odaya bağlanılıyor...');
  const peer = new Peer({debug: 0});
  net.peer = peer;
  const to = setTimeout(() => { if (net.peer === peer && !net.conn) { setNetStatus('Odaya bağlanılamadı. Kodu kontrol et ve oda sahibinin ekranının açık olduğundan emin ol.'); netLeave(true); } }, 12000);
  peer.on('open', () => {
    const conn = peer.connect('siper-oda-' + code, {reliable: true, serialization: 'json'});
    conn.on('open', () => { clearTimeout(to); net.conn = conn; net.role = 'guest'; setNetStatus('Bağlandı, oyun başlıyor...'); netSend({t: 'i', k: 0, wp: save.weapon, lv: wLv(save.weapon), ch: save.char}); });
    conn.on('data', guestOnData);
    conn.on('close', () => { if (net.conn === conn) onNetLost('Oda sahibiyle bağlantı koptu.'); });
    conn.on('error', () => { if (net.conn === conn) onNetLost('Oda sahibiyle bağlantı koptu.'); });
  });
  peer.on('error', err => {
    if (net.peer !== peer || net.conn) return;
    clearTimeout(to);
    setNetStatus(err && err.type === 'peer-unavailable' ? 'Bu kodla bir oda bulunamadı. Kodu kontrol et.' : NOPEER);
    netLeave(true);
  });
}
addEventListener('beforeunload', () => { try { net.peer && net.peer.destroy(); } catch (e) {} });

let fitT; addEventListener('resize', () => { clearTimeout(fitT); fitT = setTimeout(fit, 80); });
addEventListener('orientationchange', () => setTimeout(fit, 250));
fit();
reset(); state = 'menu'; refreshMenu();
$('banner').classList.add('hidden');

let last = performance.now(), acc = 0;
function frame(t) {
  acc += Math.min(100, t - last); last = t;
  while (acc >= 1000 / 60) {
    if (net.role === 'guest') { if (state === 'play' || state === 'shop') guestTick(); }
    else if (state === 'play' || (state === 'shop' && net.role === 'host')) { update(); if (net.role === 'host' && net.conn && tick % 2 === 0) netSend(netSnapshot()); }
    else if (state === 'over') { for (const p of parts) { p.vy += p.g; p.x += p.vx; p.y += p.vy; p.life--; } parts = parts.filter(p => p.life > 0); }
    if (state !== 'pause') ambient();
    acc -= 1000 / 60;
  }
  draw(); syncHud();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
