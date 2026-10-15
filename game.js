'use strict';
/* =========================================================================
   DEGREE OR DIE — The HUJI Survival Exam
   Vanilla JS + Canvas. No dependencies, no backend.
   ========================================================================= */

// ---------------------------------------------------------------------------
// LECTURER DATA — edit names / courses / lines here.
// pattern: radial | spread | gravity | wave | split | burst
// ---------------------------------------------------------------------------
const LECTURERS = [
  {
    name: 'Prof. Limit', course: 'Calculus I', dept: 'Mathematics',
    color: '#c45bff', color2: '#ff7ae0',
    hp: 300, speed: 55, cooldown: 2.3, pattern: 'radial', count: 12,
    bulletSpeed: 115, damage: 9, glyphs: ['∫', 'Σ', '∂', '∞', 'lim'],
    line: 'Your limit does not exist!',
    toast: 'CALCULUS I PASSED — Somehow.', credits: 5,
  },
  {
    name: 'Prof. Newton', course: 'Mechanics', dept: 'Physics',
    color: '#ffab2e', color2: '#ffe07a',
    hp: 320, speed: 65, cooldown: 1.5, pattern: 'gravity',
    bulletSpeed: 260, damage: 10, glyphs: ['apple'],
    line: 'Gravity is not optional!',
    toast: 'You have defeated gravity. Temporarily.', credits: 5,
  },
  {
    name: 'Prof. Recursion', course: 'Intro to CS', dept: 'Computer Science',
    color: '#2bff86', color2: '#b8ffd6',
    hp: 320, speed: 60, cooldown: 2.0, pattern: 'split',
    bulletSpeed: 140, damage: 8, glyphs: ['{ }', '( )', '0', '1', 'f(f)'],
    line: 'To defeat me, first defeat me.',
    toast: 'INTRO TO CS PASSED — Base case reached.', credits: 5,
  },
  {
    name: 'Dr. Eigenvector', course: 'Linear Algebra', dept: 'Mathematics',
    color: '#9a6bff', color2: '#ff8ee6',
    hp: 340, speed: 75, cooldown: 1.3, pattern: 'spread',
    bulletSpeed: 195, damage: 9, glyphs: ['→', '[A]', 'λ', 'v⃗'],
    line: 'You are linearly dependent!',
    toast: 'LINEAR ALGEBRA PASSED — Basis established.', credits: 5,
  },
  {
    name: 'Dr. Schrödinger', course: 'Quantum Physics', dept: 'Physics',
    color: '#ffc83a', color2: '#fff2a8',
    hp: 340, speed: 70, cooldown: 1.6, pattern: 'wave',
    bulletSpeed: 150, damage: 9, glyphs: ['ψ', 'ħ', '|0⟩', '|1⟩', '?'],
    line: 'You both passed and failed.',
    toast: 'QUANTUM PHYSICS PASSED — Probably.', credits: 5,
  },
  {
    name: 'Dr. Segfault', course: 'Data Structures', dept: 'Computer Science',
    color: '#ff3350', color2: '#ffa0ac',
    hp: 380, speed: 70, cooldown: 2.4, pattern: 'burst',
    bulletSpeed: 230, damage: 8, glyphs: ['ERR', 'NULL', '0x0', 'SIGSEGV'],
    line: 'Segmentation fault: student terminated.',
    toast: 'Stack overflow successfully avoided.', credits: 5,
  },
  {
    name: 'Dr. Probability', course: 'Statistics', dept: 'Mathematics',
    color: '#e04bff', color2: '#ffb0f4',
    hp: 380, speed: 80, cooldown: 1.5, pattern: 'random',
    bulletSpeed: 170, damage: 8, glyphs: ['⚄', 'σ', 'μ', 'P(A)', '%'],
    line: 'Your chances are statistically insignificant.',
    toast: 'STATISTICS PASSED — Against all odds.', credits: 5,
  },
  {
    name: 'Prof. Maxwell', course: 'Electromagnetism', dept: 'Physics',
    color: '#ffd23a', color2: '#fffbd0',
    hp: 400, speed: 60, cooldown: 3.0, pattern: 'spiral',
    bulletSpeed: 150, damage: 8, glyphs: ['⚡', 'E', 'B', '∇×'],
    line: 'Resistance is futile. And measured in ohms.',
    toast: 'ELECTROMAGNETISM PASSED — Shockingly.', credits: 5,
  },
  {
    name: 'Dr. Complexity', course: 'Algorithms', dept: 'Computer Science',
    color: '#00ffa8', color2: '#c0ffe8',
    hp: 400, speed: 70, cooldown: 2.0, pattern: 'homing',
    bulletSpeed: 135, damage: 9, glyphs: ['O(n²)', 'O(2ⁿ)', 'NP', 'O(n!)'],
    line: 'Your solution is O(n!).',
    toast: 'ALGORITHMS PASSED — In polynomial time.', credits: 5,
  },
];
const TOTAL_CREDITS = LECTURERS.reduce((s, l) => s + l.credits, 0);

// Stages: indices into LECTURERS. One lecturer per department per year.
const STAGES = [
  { title: 'YEAR 1', sub: 'Freshman Orientation', lecturers: [0, 1, 2], maxActive: 2 },
  { title: 'YEAR 2', sub: 'The Sophomore Slump', lecturers: [3, 4, 5], maxActive: 3 },
  { title: 'YEAR 3', sub: 'FINALS WEEK', lecturers: [6, 7, 8], maxActive: 3 },
];

// Sandwich shop (upper-right corner). Opens briefly — get there fast to heal.
const SHOP = { x: 1505, y: 185, doorX: 1505, doorY: 243, radius: 60, heal: 50, openFor: 7 };

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
const W = 1600, H = 900;           // logical arena size
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const $ = (id) => document.getElementById(id);

let dpr = 1, scale = 1, offX = 0, offY = 0;
let bgCanvas = null;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  scale = Math.min(innerWidth / W, innerHeight / H);
  offX = (innerWidth - W * scale) / 2;
  offY = (innerHeight - H * scale) / 2;
  bgCanvas = buildBackground(Math.min(2, scale * dpr));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const glowCache = new Map();
function glowSprite(color) {
  if (glowCache.has(color)) return glowCache.get(color);
  const key = color;
  if (/^#[0-9a-f]{3}$/i.test(color)) color = '#' + [...color.slice(1)].map((ch) => ch + ch).join('');
  const s = 64, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, color);
  grad.addColorStop(0.25, color + 'aa');
  grad.addColorStop(1, color + '00');
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  glowCache.set(key, c);
  return c;
}
function drawGlow(x, y, r, color, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// ---------------------------------------------------------------------------
// Campus background (Givat Ram, reimagined at night) — rendered once
// ---------------------------------------------------------------------------
const LAMPS = [];
const MAP = {
  // building footprints [x, y, w, h, roofStyle]
  buildings: [
    // top-right red-roof cluster
    [930, 120, 110, 60, 'red'], [1060, 110, 70, 40, 'tan'], [1150, 135, 60, 55, 'red'],
    [1230, 120, 150, 85, 'red'], [1395, 150, 70, 45, 'red'], [1110, 205, 90, 40, 'red'],
    [1250, 220, 60, 35, 'red'], [820, 135, 80, 50, 'tan'],
    // left side
    [20, 300, 70, 70, 'tan'], [40, 470, 80, 50, 'tan'], [25, 560, 60, 50, 'tan'],
    // bottom-left grid
    [40, 650, 120, 70, 'tan'], [180, 640, 110, 90, 'tan'], [300, 650, 90, 80, 'tan'],
    [410, 640, 100, 70, 'tan'], [540, 630, 90, 60, 'tan'], [80, 760, 100, 60, 'tan'],
    [200, 760, 150, 60, 'tan'], [380, 760, 100, 80, 'tan'], [520, 720, 80, 70, 'tan'],
    [620, 700, 90, 60, 'tan'], [40, 830, 90, 60, 'red'], [300, 860, 180, 30, 'red'],
    // right side
    [1210, 620, 110, 70, 'tan'], [1340, 600, 130, 60, 'tan'], [1400, 690, 90, 60, 'tan'],
    [1480, 520, 100, 70, 'tan'],
  ],
  labels: [
    [1050, 100, 'BRONFMAN'], [1300, 110, 'SAFRA'], [140, 640, 'LEVIN · ROSS'],
    [450, 625, 'KAPLAN'], [960, 548, 'SILVERMAN'], [230, 325, 'AUDITORIUM'],
    [900, 300, 'EINSTEIN INSTITUTE'], [1400, 590, 'FELDMAN'],
  ],
};

function buildBackground(res) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(W * res); c.height = Math.ceil(H * res);
  const g = c.getContext('2d');
  g.scale(res, res);
  const R = mulberry32(1918); // HUJI founded 1918
  LAMPS.length = 0;

  // base: deep night gradient
  let grad = g.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0a0b2e');
  grad.addColorStop(0.5, '#120a3a');
  grad.addColorStop(1, '#070a26');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);

  // lawns — big central lawn + green band like the map
  const lawn = (pts, col) => {
    g.beginPath();
    g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 4) g.quadraticCurveTo(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]);
    g.closePath();
    g.fillStyle = col; g.fill();
  };
  const lawnGrad = g.createRadialGradient(800, 420, 50, 800, 420, 800);
  lawnGrad.addColorStop(0, '#123c48');
  lawnGrad.addColorStop(1, '#0b2335');
  lawn([60, 250, 400, 180, 760, 240, 1100, 290, 1500, 260, 1600, 400, 1580, 500, 1300, 560, 1100, 540, 900, 620, 600, 600, 300, 620, 120, 600, 0, 450, 60, 250], lawnGrad);
  lawn([0, 120, 200, 60, 420, 150, 600, 210, 420, 230, 200, 260, 0, 260, -10, 200, 0, 120], '#0e2c3e');

  // grass texture
  for (let i = 0; i < 2600; i++) {
    const x = R() * W, y = R() * H;
    g.strokeStyle = `rgba(80, 220, 200, ${0.03 + R() * 0.06})`;
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + R() * 3 - 1.5, y - 3 - R() * 4); g.stroke();
  }

  // roads & paths (beige on the map → moonlit stone)
  const path = (pts, w) => {
    for (const [lw, col] of [[w + 6, '#1b1a3e'], [w, '#2e2b55'], [w - 6, '#383466']]) {
      g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 4) g.quadraticCurveTo(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]);
      g.stroke();
    }
    // lamps along the path
    for (let i = 2; i < pts.length; i += 4) LAMPS.push({ x: pts[i + 2], y: pts[i + 3] - w / 2 - 8, p: R() * 6 });
  };
  path([0, 95, 400, 40, 800, 70, 1200, 100, 1600, 60], 34);              // top ring road
  path([60, 60, 20, 140, 120, 150, 210, 110, 130, 60], 20);               // top-left loop
  path([120, 600, 400, 560, 700, 590, 1000, 600, 1300, 560, 1600, 580], 26); // lower walkway
  path([260, 240, 600, 230, 880, 250, 1150, 260, 1450, 240], 22);           // upper walkway
  path([780, 250, 760, 420, 800, 600], 18);                                // north-south spine
  path([60, 250, 40, 420, 120, 600], 18);                                  // west path
  path([1460, 250, 1500, 420, 1480, 580], 18);                             // east path

  // stone tile speckle on paths
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = `rgba(160,150,255,${R() * 0.05})`;
    g.fillRect(R() * W, R() * H, 2, 2);
  }

  // central plaza with fountain
  g.fillStyle = '#2a2752';
  g.beginPath(); g.arc(780, 420, 90, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#3d3a72'; g.lineWidth = 3;
  for (let r = 30; r <= 90; r += 20) { g.beginPath(); g.arc(780, 420, r, 0, Math.PI * 2); g.stroke(); }
  g.fillStyle = '#0a3550';
  g.beginPath(); g.arc(780, 420, 26, 0, Math.PI * 2); g.fill();

  // Einstein Institute — pale irregular building on the lawn (center of map)
  g.save();
  g.translate(900, 360); g.rotate(-0.25);
  g.fillStyle = '#2d2a58';
  roundRect(g, -110, -30, 220, 60, 22); g.fill();
  g.strokeStyle = 'rgba(180, 160, 255, 0.35)'; g.lineWidth = 2; g.stroke();
  g.restore();

  // round auditorium (left)
  g.fillStyle = '#2b2550';
  g.beginPath(); g.arc(230, 380, 62, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(200,170,255,0.4)'; g.lineWidth = 3; g.stroke();
  g.beginPath(); g.arc(230, 380, 40, 0, Math.PI * 2); g.stroke();

  // Silverman — comb building, bottom center
  g.fillStyle = '#3a2f55';
  g.fillRect(860, 560, 260, 40);
  for (let i = 0; i < 5; i++) g.fillRect(865 + i * 52, 600, 34, 290);
  g.fillRect(1130, 640, 70, 120);

  // generic buildings
  for (const [x, y, w, h, s] of MAP.buildings) {
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(x + 6, y + 8, w, h);
    g.fillStyle = s === 'red' ? '#5a2240' : '#3a2f55';
    g.fillRect(x, y, w, h);
    g.strokeStyle = s === 'red' ? 'rgba(255,120,150,0.35)' : 'rgba(190,160,255,0.3)';
    g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }
  // glowing windows on all buildings
  const winRects = MAP.buildings.concat([[860, 560, 260, 40], [1130, 640, 70, 120]]);
  for (let k = 0; k < 5; k++) winRects.push([865 + k * 52, 600, 34, 290]);
  for (const [x, y, w, h] of winRects) {
    for (let wx = x + 6; wx < x + w - 6; wx += 10) {
      for (let wy = y + 6; wy < y + h - 6; wy += 12) {
        if (R() < 0.35) {
          g.fillStyle = R() < 0.7 ? 'rgba(255, 210, 120, 0.75)' : 'rgba(120, 240, 255, 0.75)';
          g.fillRect(wx, wy, 4, 5);
        }
      }
    }
  }

  // bioluminescent trees
  const tree = (x, y, r) => {
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.beginPath(); g.ellipse(x + r * 0.3, y + r * 0.4, r, r * 0.8, 0, 0, Math.PI * 2); g.fill();
    const tg = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r);
    tg.addColorStop(0, '#1d6a6e'); tg.addColorStop(0.7, '#0f3b4a'); tg.addColorStop(1, '#0a2638');
    g.fillStyle = tg;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < r / 2; i++) {
      const a = R() * Math.PI * 2, d = R() * r * 0.9;
      g.fillStyle = R() < 0.5 ? 'rgba(90, 255, 230, 0.8)' : 'rgba(190, 140, 255, 0.8)';
      g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 1 + R() * 1.6, 0, Math.PI * 2); g.fill();
    }
  };
  const treeSpots = [
    [330, 200], [470, 190], [610, 280], [400, 460], [520, 520], [330, 540], [150, 520], [140, 300],
    [1050, 470], [1200, 400], [1330, 470], [1420, 330], [1250, 300], [700, 520], [620, 410],
    [1000, 280], [560, 120], [700, 150], [1550, 300], [1560, 760], [1500, 840], [760, 800],
    [740, 680], [1250, 820], [1350, 800], [1050, 840], [30, 200], [880, 470],
  ];
  for (const [x, y] of treeSpots) tree(x + R() * 10, y + R() * 10, 18 + R() * 16);

  // building labels
  g.font = '700 11px Quicksand, sans-serif';
  g.textAlign = 'center';
  g.fillStyle = 'rgba(200, 220, 255, 0.35)';
  for (const [x, y, t] of MAP.labels) g.fillText(t, x, y);

  // vignette
  grad = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(3,0,20,0.7)');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  return c;
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
const keys = {};
const mouse = { x: W / 2, y: H / 2, down: false };
addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  keys[e.code] = true;
  if (e.code === 'Enter' && state !== 'play') startGame();
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
canvas.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX - offX) / scale;
  mouse.y = (e.clientY - offY) / scale;
});
canvas.addEventListener('mousedown', (e) => { if (e.button === 0) mouse.down = true; });
addEventListener('mouseup', () => { mouse.down = false; });
addEventListener('blur', () => { mouse.down = false; for (const k in keys) keys[k] = false; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------
let state = 'menu';
let player, enemies, pBullets, eBullets, particles, pickups, rings;
let queue, spawnTimer, credits, collected, elapsed, shake, defeated, fireTimer, winTimer;
let stage, stageDone, stageDelay, banner, shop;
const fireflies = Array.from({ length: 70 }, () => ({
  x: rand(0, W), y: rand(0, H), vx: rand(-12, 12), vy: rand(-12, 12),
  p: rand(0, 6), c: Math.random() < 0.6 ? '#7ffff0' : '#c9a0ff',
}));

function resetGame() {
  player = { x: 780, y: 470, vx: 0, vy: 0, r: 13, hp: 100, inv: 0, aim: 0, trail: [], flash: 0 };
  enemies = []; pBullets = []; eBullets = []; particles = []; pickups = []; rings = [];
  queue = [];
  spawnTimer = 0.8; credits = 0; collected = []; elapsed = 0; shake = 0; defeated = 0;
  fireTimer = 0; winTimer = 0;
  stage = -1; stageDone = 0; stageDelay = 0.6; banner = null;
  shop = { open: false, timer: 12, t: 0 };
  $('toasts').innerHTML = '';
  updateHUD();
}

function startGame() {
  resetGame();
  state = 'play';
  for (const id of ['startScreen', 'deathScreen', 'winScreen']) $(id).classList.add('hidden');
  $('hud').classList.remove('hidden');
  $('legend').classList.remove('hidden');
  toast('THE DEGREE BEGINS', `Survive ${STAGES.length} years. Collect ${TOTAL_CREDITS} credits. Graduate.`, '#6ff');
}

function startStage(i) {
  stage = i; stageDone = 0;
  queue = STAGES[i].lecturers.slice();
  spawnTimer = 1.6;
  banner = { title: STAGES[i].title, sub: STAGES[i].sub, t: 0, life: 2.6 };
}

// ---------------------------------------------------------------------------
// Spawning
// ---------------------------------------------------------------------------
const SPAWN_POINTS = [[200, 160], [1400, 180], [1450, 760], [200, 760], [800, 120], [1100, 780]];
function maxActive() { return STAGES[stage].maxActive; }

function spawnLecturer() {
  const idx = queue.shift();
  const d = LECTURERS[idx];
  // spawn at the point furthest from the player
  let best = SPAWN_POINTS[0], bd = -1;
  for (const p of SPAWN_POINTS) {
    const dd = (p[0] - player.x) ** 2 + (p[1] - player.y) ** 2 + Math.random() * 40000;
    if (dd > bd) { bd = dd; best = p; }
  }
  enemies.push({
    d, idx, x: best[0], y: best[1], vx: 0, vy: 0, r: 24,
    hp: d.hp, cd: 1.6 + Math.random(), flash: 0, spawn: 1.0, talk: 3,
    wander: rand(0, Math.PI * 2), bob: rand(0, 6), burstLeft: 0, burstT: 0,
  });
  rings.push({ x: best[0], y: best[1], r: 10, max: 90, life: 0.8, t: 0, color: d.color });
}

// ---------------------------------------------------------------------------
// Enemy attacks
// ---------------------------------------------------------------------------
function fireEnemy(e, ang, spd, extra = {}) {
  const d = e.d;
  if (eBullets.length > 450) eBullets.shift();
  eBullets.push({
    x: e.x + Math.cos(ang) * 26, y: e.y + Math.sin(ang) * 26,
    vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
    r: 9, dmg: d.damage, life: 6, t: 0,
    glyph: d.glyphs[(Math.random() * d.glyphs.length) | 0],
    color: d.color, color2: d.color2, kind: d.pattern, spin: rand(-3, 3), rot: 0,
    ...extra,
  });
}

function enemyAttack(e) {
  const d = e.d;
  const toP = Math.atan2(player.y - e.y, player.x - e.x);
  switch (d.pattern) {
    case 'radial': {
      const off = Math.random() * Math.PI;
      for (let i = 0; i < d.count; i++) fireEnemy(e, off + (i / d.count) * Math.PI * 2, d.bulletSpeed);
      break;
    }
    case 'spread': {
      if (Math.random() < 0.45) for (const o of [-0.28, 0, 0.28]) fireEnemy(e, toP + o, d.bulletSpeed);
      else { fireEnemy(e, toP, d.bulletSpeed * 1.15); }
      break;
    }
    case 'gravity': {
      // lob apples: launched upward-ish towards player, gravity pulls them down, they bounce
      for (let i = 0; i < 2; i++) {
        const a = toP + rand(-0.25, 0.25);
        fireEnemy(e, a, d.bulletSpeed * rand(0.8, 1.05), { vy: Math.sin(a) * d.bulletSpeed - rand(120, 200), g: 260, bounces: 2, r: 10 });
      }
      break;
    }
    case 'wave': {
      for (const o of [-0.2, 0.2]) fireEnemy(e, toP + o, d.bulletSpeed, { base: toP + o, amp: rand(70, 110), freq: rand(3, 5), ox: 0, oy: 0 });
      break;
    }
    case 'split': {
      fireEnemy(e, toP, d.bulletSpeed, { splitAt: 0.9, depth: 2 });
      break;
    }
    case 'burst': {
      e.burstLeft = 6; e.burstT = 0;
      break;
    }
    case 'random': {
      for (let i = 0; i < 8; i++) fireEnemy(e, toP + rand(-0.9, 0.9), d.bulletSpeed * rand(0.55, 1.2));
      break;
    }
    case 'spiral': {
      e.spiralLeft = 22; e.spiralT = 0; e.spiralA = toP;
      break;
    }
    case 'homing': {
      for (const o of [-0.6, 0.6]) fireEnemy(e, toP + o, d.bulletSpeed, { home: 1.5, life: 4.2 });
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Particles & FX
// ---------------------------------------------------------------------------
function burst(x, y, color, n, spd = 220, size = 3, life = 0.7) {
  for (let i = 0; i < n; i++) {
    if (particles.length > 1600) particles.shift();
    const a = Math.random() * Math.PI * 2, s = Math.random() * spd;
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * rand(0.5, 1.2), t: 0, size: size * rand(0.5, 1.4), color, drag: 2.5 });
  }
}
function glyphBurst(x, y, d, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = rand(80, 300);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.8, 1.6), t: 0, size: rand(14, 26), color: Math.random() < 0.5 ? d.color : d.color2, drag: 1.8, text: d.glyphs[(Math.random() * d.glyphs.length) | 0], spin: rand(-6, 6), rot: 0 });
  }
}
function popText(x, y, text, color, size = 18) {
  particles.push({ x, y, vx: 0, vy: -40, life: 1.2, t: 0, size, color, drag: 0, text, float: true, rot: 0, spin: 0 });
}

function toast(title, sub, color, dur = 2.6) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.style.setProperty('--c', color);
  el.style.setProperty('--d', dur + 's');
  el.innerHTML = `${title}${sub ? `<small>${sub}</small>` : ''}`;
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), (dur + 0.6) * 1000);
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
function update(dt) {
  // ambient fireflies always drift
  for (const f of fireflies) {
    f.x += f.vx * dt; f.y += f.vy * dt; f.p += dt;
    if (f.x < 0) f.x += W; if (f.x > W) f.x -= W;
    if (f.y < 0) f.y += H; if (f.y > H) f.y -= H;
  }
  updateParticles(dt);
  if (state === 'won') {
    winTimer += dt;
    if (Math.random() < dt * 6) {
      const x = rand(150, W - 150), y = rand(120, H - 200);
      const c = ['#ffd25a', '#6ff', '#ff7ae0', '#2bff86', '#ffab2e'][(Math.random() * 5) | 0];
      burst(x, y, c, 60, 320, 3.5, 1.4);
      rings.push({ x, y, r: 5, max: 120, life: 0.7, t: 0, color: c });
    }
    if (Math.random() < dt * 10) particles.push({ x: rand(0, W), y: H + 20, vx: rand(-40, 40), vy: rand(-420, -260), life: 3, t: 0, size: 14, color: '#222', drag: 0.2, cap: true, rot: 0, spin: rand(-4, 4), g: 120 });
    updateRings(dt);
    return;
  }
  if (state !== 'play') { updateRings(dt); return; }

  elapsed += dt;
  shake = Math.max(0, shake - dt * 30);

  // --- player movement
  const p = player;
  let ix = 0, iy = 0;
  if (keys.KeyA || keys.ArrowLeft) ix -= 1;
  if (keys.KeyD || keys.ArrowRight) ix += 1;
  if (keys.KeyW || keys.ArrowUp) iy -= 1;
  if (keys.KeyS || keys.ArrowDown) iy += 1;
  const il = Math.hypot(ix, iy) || 1;
  const ACC = 3000, MAX = 340;
  p.vx += (ix / il) * ACC * dt; p.vy += (iy / il) * ACC * dt;
  const fr = Math.pow(0.0008, dt);
  if (!ix) p.vx *= fr; if (!iy) p.vy *= fr;
  const sp = Math.hypot(p.vx, p.vy);
  if (sp > MAX) { p.vx *= MAX / sp; p.vy *= MAX / sp; }
  p.x = clamp(p.x + p.vx * dt, 20, W - 20);
  p.y = clamp(p.y + p.vy * dt, 20, H - 20);
  p.aim = Math.atan2(mouse.y - p.y, mouse.x - p.x);
  p.inv = Math.max(0, p.inv - dt);
  p.flash = Math.max(0, p.flash - dt);
  p.trail.unshift({ x: p.x, y: p.y });
  if (p.trail.length > 14) p.trail.pop();

  // --- shooting
  fireTimer -= dt;
  if ((mouse.down || keys.Space) && fireTimer <= 0) {
    fireTimer = 0.085;
    const a = p.aim + rand(-0.04, 0.04);
    pBullets.push({ x: p.x + Math.cos(a) * 16, y: p.y + Math.sin(a) * 16, vx: Math.cos(a) * 780, vy: Math.sin(a) * 780, life: 1.1, r: 5 });
    p.vx -= Math.cos(a) * 12; p.vy -= Math.sin(a) * 12;
  }

  // --- stages & spawning
  if (banner) { banner.t += dt; if (banner.t > banner.life) banner = null; }
  if (stage < 0 || (stage < STAGES.length - 1 && !queue.length && !enemies.length)) {
    stageDelay -= dt;
    if (stageDelay <= 0) {
      if (stage >= 0) toast(`${STAGES[stage].title} COMPLETE`, 'Summer break: 2.5 seconds.', '#9be9ff');
      startStage(stage + 1);
      stageDelay = 2.5;
    }
  }
  if (queue.length && enemies.length < maxActive()) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) { spawnLecturer(); spawnTimer = 1.4; }
  }

  // --- sandwich shop
  shop.t += dt;
  shop.timer -= dt;
  if (!shop.open && shop.timer <= 0) {
    shop.open = true; shop.timer = SHOP.openFor;
    toast('🥪 SANDWICH SHOP IS OPEN!', `Top-right corner — closes in ${SHOP.openFor}s. RUN!`, '#ffd25a');
    rings.push({ x: SHOP.doorX, y: SHOP.doorY, r: 10, max: 160, life: 0.8, t: 0, color: '#ffd25a' });
  } else if (shop.open && shop.timer <= 0) {
    shop.open = false; shop.timer = rand(16, 22);
    toast('SANDWICH SHOP CLOSED', 'Lunch break is over.', '#888');
  }
  if (shop.open && (p.x - SHOP.doorX) ** 2 + (p.y - SHOP.doorY) ** 2 < SHOP.radius ** 2) {
    shop.open = false; shop.timer = rand(16, 22);
    const healed = Math.min(SHOP.heal, 100 - p.hp);
    p.hp = Math.min(100, p.hp + SHOP.heal);
    burst(p.x, p.y, '#ffd25a', 50, 260, 3, 0.9);
    burst(p.x, p.y, '#3cff6a', 25, 200, 3, 0.7);
    rings.push({ x: p.x, y: p.y, r: 10, max: 120, life: 0.6, t: 0, color: '#3cff6a' });
    popText(p.x, p.y - 30, `+${Math.round(healed)} MENTAL STABILITY`, '#3cff6a', 18);
    toast('SANDWICH ACQUIRED 🥪', 'Hummus restores the soul.', '#3cff6a');
  }

  // --- enemies
  for (const e of enemies) {
    e.flash = Math.max(0, e.flash - dt);
    e.bob += dt * 3;
    e.talk -= dt;
    if (e.spawn > 0) { e.spawn -= dt; continue; }
    const d = e.d;
    const dx = p.x - e.x, dy = p.y - e.y, dd = Math.hypot(dx, dy) || 1;
    e.wander += rand(-1.5, 1.5) * dt;
    // steer: keep ~280px from player, orbit a bit, wander
    let tx = Math.cos(e.wander) * 0.6, ty = Math.sin(e.wander) * 0.6;
    const want = dd > 320 ? 1 : dd < 220 ? -1 : 0;
    tx += (dx / dd) * want + (-dy / dd) * 0.5;
    ty += (dy / dd) * want + (dx / dd) * 0.5;
    for (const o of enemies) {
      if (o === e) continue;
      const ox = e.x - o.x, oy = e.y - o.y, od = Math.hypot(ox, oy);
      if (od < 140 && od > 0) { tx += (ox / od) * 1.5; ty += (oy / od) * 1.5; }
    }
    const tl = Math.hypot(tx, ty) || 1;
    e.vx += ((tx / tl) * d.speed - e.vx) * dt * 2;
    e.vy += ((ty / tl) * d.speed - e.vy) * dt * 2;
    e.x = clamp(e.x + e.vx * dt, 40, W - 40);
    e.y = clamp(e.y + e.vy * dt, 60, H - 40);

    e.cd -= dt;
    if (e.cd <= 0) {
      e.cd = d.cooldown * rand(0.85, 1.15);
      enemyAttack(e);
      if (Math.random() < 0.25) e.talk = 2.2;
    }
    if (e.spiralLeft > 0) {
      e.spiralT -= dt;
      if (e.spiralT <= 0) {
        e.spiralT = 0.07; e.spiralLeft--; e.spiralA += 0.38;
        fireEnemy(e, e.spiralA, d.bulletSpeed);
        fireEnemy(e, e.spiralA + Math.PI, d.bulletSpeed);
      }
    }
    if (e.burstLeft > 0) {
      e.burstT -= dt;
      if (e.burstT <= 0) {
        e.burstT = 0.11; e.burstLeft--;
        fireEnemy(e, Math.atan2(p.y - e.y, p.x - e.x) + rand(-0.12, 0.12), d.bulletSpeed, { r: 8 });
      }
    }
  }

  // --- player bullets
  for (const b of pBullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) b.life = 0;
    for (const e of enemies) {
      if (e.spawn > 0 || b.life <= 0) continue;
      if (dist2(b, e) < (e.r + b.r) ** 2) {
        b.life = 0;
        e.hp -= 12; e.flash = 0.08;
        e.vx += b.vx * 0.03; e.vy += b.vy * 0.03;
        burst(b.x, b.y, '#9ffcff', 5, 160, 2, 0.35);
        if (e.hp <= 0 && !e.dead) killEnemy(e);
      }
    }
  }
  pBullets = pBullets.filter((b) => b.life > 0);
  enemies = enemies.filter((e) => !e.dead);

  // --- enemy bullets
  const newB = [];
  for (const b of eBullets) {
    b.t += dt; b.life -= dt; b.rot += b.spin * dt;
    if (b.g) b.vy += b.g * dt;
    if (b.home) {
      // slowly turn towards the player
      const cur = Math.atan2(b.vy, b.vx), s = Math.hypot(b.vx, b.vy);
      let diff = Math.atan2(p.y - b.y, p.x - b.x) - cur;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      const na = cur + clamp(diff, -b.home * dt, b.home * dt);
      b.vx = Math.cos(na) * s; b.vy = Math.sin(na) * s;
    }
    if (b.amp) {
      // quantum wave: travel along base direction, oscillate perpendicular
      const perp = b.base + Math.PI / 2;
      const off = Math.sin(b.t * b.freq) * b.amp - Math.sin((b.t - dt) * b.freq) * b.amp;
      b.x += Math.cos(perp) * off; b.y += Math.sin(perp) * off;
    }
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.bounces !== undefined) {
      if (b.y > H - 15 && b.vy > 0) { if (b.bounces-- > 0) { b.vy *= -0.65; burst(b.x, b.y, '#ff5a3a', 4, 80, 2, 0.3); } }
      if (b.x < 10 || b.x > W - 10) b.vx *= -1;
    }
    if (b.splitAt !== undefined && b.t > b.splitAt && b.depth > 0) {
      b.life = 0;
      const a = Math.atan2(b.vy, b.vx), s = Math.hypot(b.vx, b.vy) * 1.1;
      for (const o of [-0.45, 0.45]) {
        newB.push({ ...b, life: 5, t: 0, vx: Math.cos(a + o) * s, vy: Math.sin(a + o) * s, depth: b.depth - 1, splitAt: 0.8, r: b.r * 0.85, glyph: b.depth === 2 ? '{ }' : '( )' });
      }
      burst(b.x, b.y, b.color, 6, 90, 2, 0.3);
    }
    if (b.x < -60 || b.x > W + 60 || b.y < -60 || b.y > H + 60) b.life = 0;
    if (b.life > 0 && p.inv <= 0 && dist2(b, p) < (b.r + p.r - 5) ** 2) {
      b.life = 0;
      hurtPlayer(b.dmg, b);
    }
  }
  eBullets = eBullets.filter((b) => b.life > 0).concat(newB);

  // --- pickups
  for (const k of pickups) {
    k.t += dt;
    const dd = Math.sqrt(dist2(k, p));
    if (dd < 200) {
      const pull = (1 - dd / 200) * 900 * dt;
      k.x += ((p.x - k.x) / dd) * pull; k.y += ((p.y - k.y) / dd) * pull;
    }
    if (dd < 30 && !k.got) collectCredit(k);
  }
  pickups = pickups.filter((k) => !k.got);

  updateRings(dt);
  updateHUD();

  if (defeated === LECTURERS.length && pickups.length === 0 && state === 'play') win();
}

function updateParticles(dt) {
  for (const q of particles) {
    q.t += dt;
    q.x += q.vx * dt; q.y += q.vy * dt;
    if (q.g) q.vy += q.g * dt;
    const f = Math.exp(-q.drag * dt);
    q.vx *= f; q.vy *= f;
    if (q.spin) q.rot += q.spin * dt;
  }
  particles = particles.filter((q) => q.t < q.life);
}
function updateRings(dt) {
  for (const r of rings) r.t += dt;
  rings = rings.filter((r) => r.t < r.life);
}

function hurtPlayer(dmg, src) {
  const p = player;
  p.hp = Math.max(0, p.hp - dmg);
  p.inv = 0.7; p.flash = 0.25;
  shake = 10;
  const a = Math.atan2(p.y - src.y, p.x - src.x);
  p.vx += Math.cos(a) * 260; p.vy += Math.sin(a) * 260;
  burst(p.x, p.y, '#ff6a8a', 14, 200, 3, 0.5);
  popText(p.x, p.y - 26, `-${dmg}`, '#ff7a90', 18);
  if (p.hp <= 0) die();
}

function killEnemy(e) {
  e.dead = true;
  defeated++;
  shake = 18;
  burst(e.x, e.y, e.d.color, 90, 420, 4, 1.1);
  burst(e.x, e.y, '#ffffff', 40, 300, 2.5, 0.8);
  glyphBurst(e.x, e.y, e.d, 14);
  rings.push({ x: e.x, y: e.y, r: 10, max: 220, life: 0.7, t: 0, color: e.d.color });
  rings.push({ x: e.x, y: e.y, r: 5, max: 140, life: 0.5, t: 0, color: '#ffffff' });
  popText(e.x, e.y - 50, `"${e.d.line}"`, e.d.color2, 16);
  pickups.push({ x: e.x, y: e.y, d: e.d, t: 0 });
  // clear some of that lecturer's bullets as a reward
  eBullets = eBullets.filter((b) => b.color !== e.d.color || Math.random() < 0.3);
  if (defeated === 1) setTimeout(() => state === 'play' && toast('NEW ACHIEVEMENT', 'Survived Office Hours.', '#ffd25a'), 900);
}

function collectCredit(k) {
  k.got = true;
  credits += k.d.credits;
  collected.push(k.d);
  player.hp = Math.min(100, player.hp + 10);
  burst(k.x, k.y, '#ffe27a', 50, 260, 3, 0.9);
  rings.push({ x: k.x, y: k.y, r: 10, max: 110, life: 0.5, t: 0, color: '#ffd25a' });
  popText(k.x, k.y - 20, `+${k.d.credits} CREDITS`, '#ffe27a', 20);
  toast(`${k.d.course.toUpperCase()} ACQUIRED  +${k.d.credits}`, k.d.toast, k.d.color);
}

function die() {
  state = 'dead';
  burst(player.x, player.y, '#6ff', 120, 400, 4, 1.4);
  $('hud').classList.add('hidden');
  $('legend').classList.add('hidden');
  const lines = [
    'Your mental stability has collapsed.',
    'The registrar has been notified.',
    'You have been transferred to a gap year.',
    'Please see your advisor. They are also crying.',
  ];
  $('deathText').textContent = lines[(Math.random() * lines.length) | 0];
  $('deathStats').textContent = `Credits earned: ${credits} / ${TOTAL_CREDITS}  ·  Survived ${fmtTime(elapsed)}`;
  setTimeout(() => $('deathScreen').classList.remove('hidden'), 900);
}

function win() {
  state = 'won';
  winTimer = 0;
  $('hud').classList.add('hidden');
  $('legend').classList.add('hidden');
  for (let i = 0; i < 8; i++) burst(player.x, player.y, ['#ffd25a', '#6ff', '#ff7ae0', '#2bff86'][i % 4], 50, 500, 4, 1.6);
  $('courseList').innerHTML = collected.map((d) => `<li>✦ ${d.course} <b>${d.credits} cr</b> <small style="opacity:.6">— ${d.name}</small></li>`).join('');
  $('winStats').textContent = `${credits} / ${TOTAL_CREDITS} credits  ·  Completion time ${fmtTime(elapsed)}  ·  Mental stability ${Math.round(player.hp)}%`;
  setTimeout(() => $('winScreen').classList.remove('hidden'), 1200);
}

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

let lastHud = '';
function updateHUD() {
  const hp = Math.round(player.hp);
  const key = `${hp}|${credits}|${defeated}|${Math.floor(elapsed)}`;
  if (key === lastHud) return;
  lastHud = key;
  $('hpFill').style.width = hp + '%';
  $('hpFill').style.background = hp > 50 ? 'linear-gradient(90deg,#2af5ff,#9bfff0)' : hp > 25 ? 'linear-gradient(90deg,#ffb02a,#ffe07a)' : 'linear-gradient(90deg,#ff2a4a,#ff8a9a)';
  $('hpText').textContent = hp;
  $('credits').textContent = credits;
  $('totalCredits').textContent = TOTAL_CREDITS;
  $('year').textContent = stage >= 0 ? STAGES[stage].title : '';
  $('remaining').textContent = LECTURERS.length - defeated;
  $('timer').textContent = fmtTime(elapsed);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
let time = 0;
function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#04031a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const sx = shake ? rand(-shake, shake) : 0, sy = shake ? rand(-shake, shake) : 0;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (offX + sx), dpr * (offY + sy));

  ctx.drawImage(bgCanvas, 0, 0, W, H);

  // animated ambience (additive)
  ctx.globalCompositeOperation = 'lighter';
  for (const l of LAMPS) {
    const a = 0.5 + 0.2 * Math.sin(time * 2 + l.p);
    drawGlow(l.x, l.y, 34, '#ffcf7a', a * 0.6);
    drawGlow(l.x, l.y, 6, '#ffffff', a);
  }
  // fountain shimmer
  drawGlow(780, 420, 40 + Math.sin(time * 2) * 4, '#3ff0ff', 0.5);
  for (const f of fireflies) drawGlow(f.x, f.y, 7, f.c, 0.4 + 0.4 * Math.sin(f.p * 3));
  ctx.globalCompositeOperation = 'source-over';

  if (state === 'menu') { drawRings(); drawParticles(); return; }

  drawShop();

  // pickups
  for (const k of pickups) drawPickup(k);

  // enemies
  for (const e of enemies) drawLecturer(e);

  // player bullets
  ctx.globalCompositeOperation = 'lighter';
  for (const b of pBullets) {
    drawGlow(b.x, b.y, 16, '#3fe8ff', 0.9);
    ctx.strokeStyle = '#dfffff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';

  if (state !== 'dead') drawPlayer();

  // enemy bullets on top for readability
  for (const b of eBullets) drawEnemyBullet(b);

  drawRings();
  drawParticles();

  // arrow pointing to the open sandwich shop
  if (state === 'play' && shop.open) {
    const a = Math.atan2(SHOP.doorY - player.y, SHOP.doorX - player.x);
    const dd = Math.hypot(SHOP.doorY - player.y, SHOP.doorX - player.x);
    if (dd > 120) {
      ctx.save();
      ctx.translate(player.x + Math.cos(a) * 46, player.y + Math.sin(a) * 46);
      ctx.rotate(a);
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 10);
      ctx.fillStyle = '#ffd25a';
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-6, -9); ctx.lineTo(-2, 0); ctx.lineTo(-6, 9); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  // stage banner
  if (banner) {
    const f = banner.t / banner.life;
    const a = f < 0.15 ? f / 0.15 : f > 0.75 ? (1 - f) / 0.25 : 1;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.font = '900 84px "Cinzel Decorative", serif';
    ctx.shadowColor = '#6ff'; ctx.shadowBlur = 30;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(banner.title, W / 2, H / 2 - 10 - (1 - a) * 20);
    ctx.font = '700 26px Quicksand, sans-serif';
    ctx.shadowColor = '#b98bff';
    ctx.fillStyle = '#c9b6ff';
    ctx.fillText(banner.sub, W / 2, H / 2 + 34);
    ctx.restore();
  }

  // damage vignette
  if (player.flash > 0 || (state === 'play' && player.hp < 30)) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const a = player.flash > 0 ? player.flash * 2 : 0.18 + 0.1 * Math.sin(time * 6);
    const g = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.3, canvas.width / 2, canvas.height / 2, canvas.width * 0.7);
    g.addColorStop(0, 'rgba(255,0,40,0)');
    g.addColorStop(1, `rgba(255,0,60,${Math.min(0.6, a)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawPlayer() {
  const p = player;
  if (p.inv > 0 && Math.floor(time * 20) % 2 === 0) return;
  // scarf trail
  ctx.lineCap = 'round';
  for (let i = 1; i < p.trail.length; i++) {
    const a = p.trail[i - 1], b = p.trail[i];
    ctx.strokeStyle = `rgba(80, 240, 255, ${0.5 * (1 - i / p.trail.length)})`;
    ctx.lineWidth = 9 * (1 - i / p.trail.length);
    ctx.beginPath(); ctx.moveTo(a.x, a.y + 4); ctx.lineTo(b.x, b.y + 4); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'lighter';
  drawGlow(p.x, p.y, 48, '#2ee8ff', 0.7);
  ctx.globalCompositeOperation = 'source-over';

  ctx.save();
  ctx.translate(p.x, p.y);
  // backpack (behind, opposite the aim)
  ctx.save();
  ctx.rotate(p.aim);
  ctx.fillStyle = '#1a6f9a';
  roundRect(ctx, -20, -8, 10, 16, 3); ctx.fill();
  ctx.strokeStyle = '#7ff'; ctx.lineWidth = 1; ctx.stroke();
  // wand / pen pointing at aim
  ctx.strokeStyle = '#dfffff'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(8, 6); ctx.lineTo(22, 6); ctx.stroke();
  ctx.restore();
  // body
  const g = ctx.createRadialGradient(-4, -4, 1, 0, 0, p.r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#b8fbff'); g.addColorStop(1, '#3fd8ff');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
  // eyes looking at the cursor
  const ex = Math.cos(p.aim) * 4, ey = Math.sin(p.aim) * 4;
  ctx.fillStyle = '#062a3a';
  ctx.beginPath(); ctx.arc(ex - 4, ey - 2, 2.2, 0, Math.PI * 2); ctx.arc(ex + 4, ey - 2, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawLecturer(e) {
  const d = e.d;
  const bob = Math.sin(e.bob) * 4;
  const sp = e.spawn > 0 ? 1 - e.spawn : 1;
  if (e.spawn > 0) {
    // summoning circle
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(time * 3);
    ctx.strokeStyle = d.color; ctx.lineWidth = 2; ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 40, Math.sin(a) * 40); ctx.lineTo(Math.cos(a + 2.5) * 40, Math.sin(a + 2.5) * 40); ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(e.x, e.y + 26, 22 * sp, 7 * sp, 0, 0, Math.PI * 2); ctx.fill();

  ctx.globalCompositeOperation = 'lighter';
  drawGlow(e.x, e.y + bob, 70 * sp, d.color, 0.55);
  ctx.globalCompositeOperation = 'source-over';

  ctx.save();
  ctx.translate(e.x, e.y + bob);
  ctx.scale(sp, sp);
  // robe
  const rg = ctx.createLinearGradient(0, -20, 0, 28);
  rg.addColorStop(0, d.color); rg.addColorStop(1, '#1a0f3a');
  ctx.fillStyle = e.flash > 0 ? '#ffffff' : rg;
  ctx.beginPath();
  ctx.moveTo(-8, -10);
  ctx.quadraticCurveTo(-26, 10, -22, 26);
  ctx.quadraticCurveTo(0, 32, 22, 26);
  ctx.quadraticCurveTo(26, 10, 8, -10);
  ctx.closePath(); ctx.fill();
  // head
  ctx.fillStyle = e.flash > 0 ? '#ffffff' : '#ffe6d0';
  ctx.beginPath(); ctx.arc(0, -16, 11, 0, Math.PI * 2); ctx.fill();
  // glasses looking at player
  const la = Math.atan2(player.y - e.y, player.x - e.x);
  const gx = Math.cos(la) * 3, gy = Math.sin(la) * 2;
  ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(gx - 4, -16 + gy, 3.2, 0, Math.PI * 2); ctx.moveTo(gx + 7.2, -16 + gy); ctx.arc(gx + 4, -16 + gy, 3.2, 0, Math.PI * 2); ctx.stroke();
  // mortarboard
  ctx.fillStyle = '#15102a';
  ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(18, -29); ctx.lineTo(0, -22); ctx.lineTo(-18, -29); ctx.closePath(); ctx.fill();
  ctx.fillRect(-7, -27, 14, 5);
  ctx.strokeStyle = d.color2; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -29); ctx.lineTo(13, -27); ctx.lineTo(14, -18 + Math.sin(time * 4) * 2); ctx.stroke();
  ctx.restore();

  if (e.spawn > 0) return;
  // label + health bar
  const ly = e.y - 62;
  ctx.textAlign = 'center';
  ctx.font = '700 14px Quicksand, sans-serif';
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillText(d.name, e.x + 1, ly + 1);
  ctx.fillStyle = '#fff';
  ctx.fillText(d.name, e.x, ly);
  ctx.font = '600 11px Quicksand, sans-serif';
  ctx.fillStyle = d.color2;
  ctx.fillText(`${d.course} · ${d.dept}`, e.x, ly + 13);
  const bw = 70, f = Math.max(0, e.hp / d.hp);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, e.x - bw / 2, ly + 18, bw, 7, 3); ctx.fill();
  ctx.fillStyle = d.color;
  roundRect(ctx, e.x - bw / 2, ly + 18, bw * f, 7, 3); ctx.fill();

  // speech bubble
  if (e.talk > 0) {
    ctx.font = '700 13px Quicksand, sans-serif';
    const tw = ctx.measureText(d.line).width + 20;
    const bx = e.x - tw / 2, by = ly - 42;
    ctx.globalAlpha = Math.min(1, e.talk * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    roundRect(ctx, bx, by, tw, 26, 12); ctx.fill();
    ctx.beginPath(); ctx.moveTo(e.x - 6, by + 26); ctx.lineTo(e.x, by + 34); ctx.lineTo(e.x + 6, by + 26); ctx.fill();
    ctx.fillStyle = '#1a0f3a';
    ctx.fillText(d.line, e.x, by + 17);
    ctx.globalAlpha = 1;
  }
}

function drawEnemyBullet(b) {
  ctx.globalCompositeOperation = 'lighter';
  drawGlow(b.x, b.y, b.r * 3, b.color, 0.75);
  ctx.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.translate(b.x, b.y);
  if (b.glyph === 'apple') {
    ctx.rotate(b.rot);
    ctx.fillStyle = '#ff3b2f';
    ctx.beginPath(); ctx.arc(-3, 1, 7, 0, Math.PI * 2); ctx.arc(3, 1, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(-4, -2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5a3210'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(1, -10); ctx.stroke();
    ctx.fillStyle = '#3cff6a';
    ctx.beginPath(); ctx.ellipse(5, -9, 4, 2, -0.5, 0, Math.PI * 2); ctx.fill();
  } else if (b.kind === 'burst') {
    ctx.font = '800 12px monospace';
    const tw = ctx.measureText(b.glyph).width + 8;
    ctx.fillStyle = '#3a0010';
    roundRect(ctx, -tw / 2, -9, tw, 18, 4); ctx.fill();
    ctx.strokeStyle = '#ff3350'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ffd0d6'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(b.glyph, 0, 1);
  } else {
    if (b.kind === 'spread' || b.kind === 'radial') ctx.rotate(b.rot * 0.5);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, 0, b.r * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.font = `800 ${b.glyph.length > 2 ? 12 : 18}px Quicksand, serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = b.color;
    ctx.fillText(b.glyph, 0, 1);
  }
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
}

function drawSandwich(x, y, s) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#e8b06a'; // bottom bun
  roundRect(ctx, -14, 4, 28, 7, 4); ctx.fill();
  ctx.fillStyle = '#ff4a3a'; // tomato
  ctx.fillRect(-13, 1, 26, 4);
  ctx.fillStyle = '#ffd23a'; // cheese
  ctx.beginPath(); ctx.moveTo(-14, -1); ctx.lineTo(14, -1); ctx.lineTo(4, 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3cff6a'; // lettuce
  ctx.beginPath();
  for (let i = -14; i <= 14; i += 4) ctx.arc(i, -2, 2.5, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#f2c27e'; // top bun
  ctx.beginPath(); ctx.ellipse(0, -5, 15, 8, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#fff6dc';
  for (const [sx, sy] of [[-6, -9], [0, -11], [6, -8]]) ctx.fillRect(sx, sy, 2, 1.2);
  ctx.restore();
}

function drawShop() {
  const { x, y } = SHOP;
  const open = state === 'play' && shop.open;
  // building
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(x - 62, y - 32, 130, 80);
  ctx.fillStyle = '#3b2348';
  ctx.fillRect(x - 66, y - 38, 130, 78);
  // striped awning
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#fff3d6' : (open ? '#ff5a4a' : '#6a3a44');
    ctx.fillRect(x - 66 + i * 16.25, y + 26, 16.25, 14);
  }
  // sign
  ctx.textAlign = 'center';
  ctx.font = '800 15px Quicksand, sans-serif';
  if (open) {
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(x, y - 8, 80, '#ffd25a', 0.55 + 0.25 * Math.sin(time * 8));
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#ffe27a';
    ctx.shadowColor = '#ffd25a'; ctx.shadowBlur = 14;
    ctx.fillText('SANDWICH BAR', x, y - 16);
    ctx.shadowBlur = 0;
    drawSandwich(x, y + 6 + Math.sin(time * 5) * 3, 1.1);
    // door zone + countdown ring
    ctx.strokeStyle = '#ffd25a'; ctx.lineWidth = 3;
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(time * 8);
    ctx.beginPath(); ctx.arc(SHOP.doorX, SHOP.doorY, SHOP.radius - 10, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#3cff6a'; ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(SHOP.doorX, SHOP.doorY, SHOP.radius - 2, -Math.PI / 2, -Math.PI / 2 + (shop.timer / SHOP.openFor) * Math.PI * 2);
    ctx.stroke();
    ctx.font = '800 13px Quicksand, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(`OPEN · ${Math.ceil(shop.timer)}s`, SHOP.doorX, SHOP.doorY + 24);
  } else {
    ctx.fillStyle = 'rgba(200,180,220,0.45)';
    ctx.fillText('SANDWICH BAR', x, y - 16);
    ctx.font = '800 12px Quicksand, sans-serif';
    ctx.fillStyle = '#ff6a7a';
    ctx.fillText('CLOSED', x, y + 8);
  }
}

function drawPickup(k) {
  const bob = Math.sin(k.t * 4) * 5;
  ctx.globalCompositeOperation = 'lighter';
  drawGlow(k.x, k.y + bob, 60 + Math.sin(k.t * 6) * 8, '#ffd25a', 0.8);
  drawGlow(k.x, k.y + bob, 30, k.d.color, 0.8);
  ctx.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.translate(k.x, k.y + bob);
  ctx.rotate(k.t * 1.5);
  ctx.fillStyle = '#fff4c2';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 7 : 17, a = (i / 10) * Math.PI * 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.textAlign = 'center';
  ctx.font = '800 13px Quicksand, sans-serif';
  ctx.fillStyle = '#ffe27a';
  ctx.fillText(`+${k.d.credits} CR · ${k.d.course}`, k.x, k.y + bob - 28);
}

function drawRings() {
  ctx.globalCompositeOperation = 'lighter';
  for (const r of rings) {
    const f = r.t / r.life;
    ctx.strokeStyle = r.color;
    ctx.globalAlpha = 1 - f;
    ctx.lineWidth = 6 * (1 - f) + 1;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r + (r.max - r.r) * f, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function drawParticles() {
  for (const q of particles) {
    const f = 1 - q.t / q.life;
    if (q.cap) {
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot);
      ctx.fillStyle = '#111'; ctx.fillRect(-12, -3, 24, 6);
      ctx.fillStyle = '#ffd25a'; ctx.fillRect(4, 2, 2, 10);
      ctx.restore();
    } else if (q.text) {
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot);
      ctx.globalAlpha = Math.min(1, f * 1.5);
      ctx.font = `800 ${q.size}px Quicksand, sans-serif`;
      ctx.textAlign = 'center';
      if (q.float) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(q.text, 1, 1); }
      ctx.fillStyle = q.color;
      ctx.fillText(q.text, 0, 0);
      ctx.restore();
    } else {
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(q.x, q.y, q.size * 3 * f + 1, q.color, f);
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
let last = performance.now();
function frame(t) {
  const dt = Math.min(0.05, (t - last) / 1000);
  last = t;
  time += dt;
  try {
    update(dt);
    render();
  } catch (err) {
    console.error(err);
  }
  requestAnimationFrame(frame);
}

$('startBtn').addEventListener('click', startGame);
$('restartBtn').addEventListener('click', startGame);
$('againBtn').addEventListener('click', startGame);
addEventListener('resize', resize);

resize();
resetGame();
requestAnimationFrame(frame);

// tiny debug hook for automated testing
window.DOD = {
  get state() { return state; },
  get credits() { return credits; },
  get enemies() { return enemies.length; },
  get player() { return player; },
  get pickups() { return pickups; },
  get stage() { return stage; },
  get shop() { return shop; },
  killAll() { for (const e of enemies) if (e.spawn <= 0) { e.hp = 0; killEnemy(e); } enemies = enemies.filter((e) => !e.dead); },
};
