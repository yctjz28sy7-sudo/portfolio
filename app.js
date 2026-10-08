/* =========================================================
   Alix Drummond — Portfolio
   ---------------------------------------------------------
   EDIT YOUR PROJECTS HERE. Each one becomes a cartridge in
   the carousel and its own case-study page (#/work/<slug>).
   - bg / ink / frame : cover background, text colour, case colour
   - cover            : optional image path, e.g. "images/bloom-cover.jpg"
   - hero             : optional big image on the case-study page
   - images           : optional { research: "images/x.jpg", ... } per section id
   ========================================================= */
const PROJECTS = [
  {
    slug: 'bloom',
    title: 'Bloom',
    tagline: 'Plant care made simple',
    type: 'Mobile app',
    year: '2025',
    bg: '#EEF1E7', ink: '#1F3B2D', frame: '#2F5D46',
    cover: '', hero: '', heroAlt: '',
    role: '[Your role]', timeline: '[e.g. 10 weeks]', team: '[e.g. Solo]', tools: '[e.g. Figma, Maze]',
    summary: '[One sentence: the problem, what you designed, and the result — e.g. “Redesigned plant care reminders, cutting missed waterings by 40%.”]',
  },
  {
    slug: 'project-two',
    title: '[Project Two]',
    tagline: '[Short tagline]',
    type: '[Web app]',
    year: '[Year]',
    bg: '#F7E8EE', ink: '#5E1A36', frame: '#B83E6C',
    cover: '', hero: '', heroAlt: '',
    role: '[Your role]', timeline: '[Timeline]', team: '[Team]', tools: '[Tools]',
    summary: '[One sentence summary of the project and its outcome.]',
  },
  {
    slug: 'project-three',
    title: '[Project Three]',
    tagline: '[Short tagline]',
    type: '[Design system]',
    year: '[Year]',
    bg: '#E7ECF6', ink: '#1C2E52', frame: '#2F4C8C',
    cover: '', hero: '', heroAlt: '',
    role: '[Your role]', timeline: '[Timeline]', team: '[Team]', tools: '[Tools]',
    summary: '[One sentence summary of the project and its outcome.]',
  },
  {
    slug: 'project-four',
    title: '[Project Four]',
    tagline: '[Short tagline]',
    type: '[Responsive site]',
    year: '[Year]',
    bg: '#F6ECE0', ink: '#552B10', frame: '#A85A22',
    cover: '', hero: '', heroAlt: '',
    role: '[Your role]', timeline: '[Timeline]', team: '[Team]', tools: '[Tools]',
    summary: '[One sentence summary of the project and its outcome.]',
  },
];

/* Default case-study structure. Override per project with `sections: [...]`. */
const DEFAULT_SECTIONS = [
  { id: 'overview',  h: 'Overview',        body: '[Context in 2–3 sentences: what the product is, who it’s for, and the business goal.]' },
  { id: 'problem',   h: 'The problem',     body: '[What was broken or missing? Back it up with one data point or a user quote.]' },
  { id: 'research',  h: 'Research',        body: '[Methods you used (interviews, surveys, competitive audit), who you talked to, and the 2–3 insights that shaped the design.]', fig: 'Research synthesis — affinity map, persona or journey map' },
  { id: 'process',   h: 'Design process',  body: '[Sketches → wireframes → prototype. Show one decision you changed after testing, and why.]', fig: 'Wireframes or an early prototype' },
  { id: 'solution',  h: 'The solution',    body: '[Final screens with short captions: how each one answers a user need.]', fig: 'Final UI screens' },
  { id: 'outcome',   h: 'Outcome',         body: '[Measurable results — task success, time on task, ratings, adoption. Not shipped? Share usability-test results.]' },
  { id: 'learnings', h: 'What I learned',  body: '[One or two honest reflections, and what you’d do next.]' },
];

/* ========================================================= */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const findProject = (slug) => PROJECTS.find((p) => p.slug === slug);
const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => reduceMQ.matches;
const SITE_TITLE = 'Alix Drummond — UI/UX Designer';

/* ---------- tiny animation helpers ---------- */
let skipFlag = false;
const ease = {
  inOut: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  out: (k) => 1 - Math.pow(1 - k, 3),
  outBack: (k) => { const c1 = 1.3, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },
  linear: (k) => k,
};
function tween(ms, fn, e = ease.inOut, { skippable = true } = {}) {
  return new Promise((resolve) => {
    const start = performance.now();
    const step = (now) => {
      const k = skippable && skipFlag ? 1 : Math.min(1, (now - start) / ms);
      fn(e(k));
      if (k < 1) requestAnimationFrame(step); else resolve();
    };
    requestAnimationFrame(step);
  });
}
const wait = (ms) => tween(ms, () => {});
let liveAnims = [];

/* =========================================================
   3D STAGE — an original dual-screen handheld built in three.js
   ========================================================= */
async function initStage() {
  const host = $('#stage');
  const canvas = $('#gl');
  let THREE, RoundedBoxGeometry, RoomEnvironment;
  try {
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('WebGL unavailable');
    const mods = await Promise.all([
      import('three'),
      import('three/addons/geometries/RoundedBoxGeometry.js'),
      import('three/addons/environments/RoomEnvironment.js'),
    ]);
    THREE = mods[0];
    RoundedBoxGeometry = mods[1].RoundedBoxGeometry;
    RoomEnvironment = mods[2].RoomEnvironment;
  } catch (err) {
    console.warn('3D stage disabled, using fallback:', err);
    return fallbackStage(host);
  }
  try {
    await Promise.all([
      document.fonts.load('600 80px Newsreader'),
      document.fonts.load('italic 400 40px Newsreader'),
      document.fonts.load('500 24px "DM Mono"'),
    ]);
  } catch { /* fonts are a nice-to-have on the screen textures */ }

  // ---- renderer / scene ----
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xf2d4de, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 6, 5);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 100);
  const CAM_TARGET = new THREE.Vector3(0, 1.1, -0.25);
  const CAM_DIR = new THREE.Vector3(0, 0.33, 1).normalize();
  const CAM_DIST = 8.4;

  // ---- canvas textures for the screens and the cartridge label ----
  function canvasTex(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return { c, ctx: c.getContext('2d'), tex };
  }
  const TOP = canvasTex(1150, 690);
  const BOT = canvasTex(800, 600);
  const LAB = canvasTex(512, 384);

  // ---- materials ----
  const shell = new THREE.MeshPhysicalMaterial({ color: 0xB02A5B, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.25, envMapIntensity: 0.6 });
  const shellDeep = new THREE.MeshPhysicalMaterial({ color: 0x92234B, roughness: 0.42, clearcoat: 0.5, envMapIntensity: 0.6 });
  const charcoal = new THREE.MeshStandardMaterial({ color: 0x2A2326, roughness: 0.5, envMapIntensity: 0.7 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x141113, roughness: 0.25, metalness: 0.1, envMapIntensity: 1.1 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xD9D4D6, roughness: 0.3, metalness: 0.6 });
  const topScreenMat = new THREE.MeshBasicMaterial({ map: TOP.tex, toneMapped: false });
  const botScreenMat = new THREE.MeshBasicMaterial({ map: BOT.tex, toneMapped: false });

  // ---- model (original design, built from primitives) ----
  const W = 3.2, BASE_T = 0.22, BASE_D = 2.6, LID_T = 0.16, LID_D = 2.5;
  const TOP_W = 2.3, TOP_H = 1.38, BOT_W = 1.72, BOT_H = 1.29;
  const OPEN = 1.9; // lid angle in radians (~108°)
  const REST_YAW = -0.42;
  const SLOT = { x: W / 2, y: 0, z: 0.25 };
  const CARD_L = 0.8;

  const rig = new THREE.Group();
  const consoleG = new THREE.Group();
  rig.add(consoleG);
  scene.add(rig);

  const base = new THREE.Mesh(new RoundedBoxGeometry(W, BASE_T, BASE_D, 5, 0.09), shell);
  consoleG.add(base);

  const plane = (w, h, mat) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  const yTop = BASE_T / 2;

  const botBezel = plane(BOT_W + 0.24, BOT_H + 0.22, glass);
  botBezel.rotation.x = -Math.PI / 2; botBezel.position.set(0, yTop + 0.002, 0.12);
  const botScreen = plane(BOT_W, BOT_H, botScreenMat);
  botScreen.rotation.x = -Math.PI / 2; botScreen.position.set(0, yTop + 0.004, 0.12);
  consoleG.add(botBezel, botScreen);

  // d-pad
  const dpadA = new THREE.Mesh(new RoundedBoxGeometry(0.44, 0.05, 0.14, 3, 0.02), charcoal);
  const dpadB = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.05, 0.44, 3, 0.02), charcoal);
  dpadA.position.set(-1.18, yTop + 0.02, 0.05); dpadB.position.copy(dpadA.position);
  consoleG.add(dpadA, dpadB);
  // face buttons
  const btnGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.05, 28);
  [[0.15, 0], [-0.15, 0], [0, 0.15], [0, -0.15]].forEach(([dx, dz]) => {
    const b = new THREE.Mesh(btnGeo, charcoal);
    b.position.set(1.18 + dx, yTop + 0.02, 0.05 + dz);
    consoleG.add(b);
  });
  // start / select / power
  const pill = new RoundedBoxGeometry(0.17, 0.03, 0.07, 3, 0.03);
  [0.62, 0.8].forEach((z) => { const m = new THREE.Mesh(pill, charcoal); m.position.set(1.18, yTop + 0.01, z); consoleG.add(m); });
  const power = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 24), silver);
  power.position.set(-1.18, yTop + 0.01, 0.78);
  consoleG.add(power);
  // cartridge slot on the right side
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.055, 0.76), glass);
  slot.position.set(SLOT.x + 0.001, SLOT.y, SLOT.z);
  consoleG.add(slot);

  // hinge + lid
  const pivot = new THREE.Group();
  pivot.position.set(0, yTop + LID_T / 2, -1.18);
  consoleG.add(pivot);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, W - 0.3, 32), shellDeep);
  hinge.rotation.z = Math.PI / 2;
  hinge.position.copy(pivot.position);
  consoleG.add(hinge);

  const lid = new THREE.Mesh(new RoundedBoxGeometry(W, LID_T, LID_D, 5, 0.075), shell);
  lid.position.set(0, 0, LID_D / 2);
  pivot.add(lid);
  const topBezel = plane(TOP_W + 0.28, TOP_H + 0.26, glass);
  topBezel.rotation.x = Math.PI / 2; topBezel.position.set(0, -LID_T / 2 - 0.002, 1.32);
  const topScreen = plane(TOP_W, TOP_H, topScreenMat);
  topScreen.rotation.x = Math.PI / 2; topScreen.position.set(0, -LID_T / 2 - 0.004, 1.32);
  pivot.add(topBezel, topScreen);
  const dot = new THREE.CircleGeometry(0.028, 20);
  [-1, 1].forEach((side) => [-0.12, 0, 0.12].forEach((dz) => {
    const d = new THREE.Mesh(dot, charcoal);
    d.rotation.x = Math.PI / 2; d.position.set(side * 1.45, -LID_T / 2 - 0.003, 1.32 + dz);
    pivot.add(d);
  }));

  // the game card that gets inserted
  const cardSide = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.45, transparent: true });
  const cardLabel = new THREE.MeshStandardMaterial({ map: LAB.tex, roughness: 0.55, transparent: true });
  const card = new THREE.Mesh(new THREE.BoxGeometry(CARD_L, 0.035, 0.6), [cardSide, cardSide, cardLabel, cardSide, cardSide, cardSide]);
  card.visible = false;
  consoleG.add(card);

  // soft contact shadow
  const sh = document.createElement('canvas'); sh.width = sh.height = 256;
  const shc = sh.getContext('2d');
  const g = shc.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(80,25,45,0.34)'); g.addColorStop(0.5, 'rgba(80,25,45,0.1)'); g.addColorStop(0.8, 'rgba(80,25,45,0)');
  shc.fillStyle = g; shc.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false, premultipliedAlpha: true, toneMapped: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(0, -0.14, -0.2);
  scene.add(shadow);

  // ---- screen drawing ----
  const SERIF = 'Newsreader, Georgia, serif';
  const MONO = '"DM Mono", ui-monospace, monospace';
  function fitFont(c, text, maxW, size, weight = '600', style = 'normal') {
    let s = size;
    do { c.font = `${style} ${weight} ${s}px ${SERIF}`; if (c.measureText(text).width <= maxW) break; s -= 4; } while (s > 20);
  }
  function rr(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function drawTop(mode, p) {
    const { ctx: c, c: cv, tex } = TOP; const w = cv.width, h = cv.height;
    c.save(); c.clearRect(0, 0, w, h);
    if (mode === 'flash') {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
    } else if (mode === 'idle' || !p) {
      c.fillStyle = '#FBF6F1'; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(20,20,20,0.07)';
      for (let x = 23; x < w; x += 46) for (let y = 23; y < h; y += 46) { c.beginPath(); c.arc(x, y, 2.2, 0, Math.PI * 2); c.fill(); }
      c.textAlign = 'center';
      c.fillStyle = '#141414'; fitFont(c, 'Pick a project', w * 0.8, 120); c.fillText('Pick a project', w / 2, h / 2 + 14);
      c.fillStyle = '#B83E6C'; c.font = `500 28px ${MONO}`; c.fillText('INSERT A CARTRIDGE TO BEGIN', w / 2, h / 2 + 92);
    } else {
      const n = pad(PROJECTS.indexOf(p) + 1);
      c.fillStyle = p.bg; c.fillRect(0, 0, w, h);
      c.globalAlpha = 0.92; c.fillStyle = p.frame;
      c.beginPath(); c.arc(w * 0.88, h * 1.04, h * 0.58, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1; c.textAlign = 'left';
      c.fillStyle = p.ink; c.font = `500 26px ${MONO}`;
      c.fillText(`CASE STUDY ${n} · ${String(p.type).toUpperCase()}`, 72, 118);
      fitFont(c, p.title, w * 0.8, 176); c.fillText(p.title, 64, h / 2 + 52);
      fitFont(c, p.tagline, w * 0.62, 50, '400', 'italic'); c.fillText(p.tagline, 72, h / 2 + 128);
      if (mode === 'preview') { c.globalAlpha = 0.75; c.font = `500 24px ${MONO}`; c.fillText('PRESS TO START  ▸', 72, h - 64); }
    }
    c.restore(); tex.needsUpdate = true;
  }
  function drawBottom(mode, p) {
    const { ctx: c, c: cv, tex } = BOT; const w = cv.width, h = cv.height;
    c.save(); c.fillStyle = '#1B1719'; c.fillRect(0, 0, w, h);
    if (mode === 'boot' && p) {
      c.fillStyle = '#F4EEE9'; c.textAlign = 'center';
      c.font = `500 30px ${MONO}`; c.fillText('NOW LOADING', w / 2, h / 2 - 20);
      c.fillStyle = p.frame; rr(c, w * 0.2, h / 2 + 20, w * 0.6, 22, 11); c.fill();
    } else {
      const gap = 28, tw = (w - gap * 3) / 2, th = (h - gap * 3) / 2;
      PROJECTS.slice(0, 4).forEach((q, i) => {
        const x = gap + (i % 2) * (tw + gap), y = gap + Math.floor(i / 2) * (th + gap);
        c.globalAlpha = p && p !== q ? 0.35 : 1;
        c.fillStyle = q.frame; rr(c, x, y, tw, th, 22); c.fill();
        if (p === q) { c.lineWidth = 8; c.strokeStyle = '#F4EEE9'; rr(c, x - 6, y - 6, tw + 12, th + 12, 26); c.stroke(); }
        c.fillStyle = '#ffffff'; c.textAlign = 'left'; c.font = `500 30px ${MONO}`; c.fillText(pad(i + 1), x + 26, y + 52);
      });
    }
    c.restore(); tex.needsUpdate = true;
  }
  function drawLabel(p) {
    const { ctx: c, c: cv, tex } = LAB; const w = cv.width, h = cv.height;
    c.fillStyle = p.frame; c.fillRect(0, 0, w, h);
    c.fillStyle = p.bg; rr(c, 26, 26, w - 52, h - 52, 18); c.fill();
    c.fillStyle = p.ink; c.textAlign = 'left'; fitFont(c, p.title, w - 110, 84); c.fillText(p.title, 54, h / 2 + 24);
    c.font = `500 22px ${MONO}`; c.fillText(pad(PROJECTS.indexOf(p) + 1), 54, h - 56);
    tex.needsUpdate = true;
    cardSide.color.set(p.frame);
  }
  const setCardOpacity = (o) => { cardSide.opacity = o; cardLabel.opacity = o; };
  drawTop('idle'); drawBottom('idle');

  // ---- state ----
  let lidAngle = reduced() ? OPEN : 0.04;
  let poseYaw = REST_YAW, idleAmt = 1, bump = 0, expand = 0;
  let playing = false, zoomCam = false, hiddenCase = null, inView = true;
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', (e) => { pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
  new IntersectionObserver(([en]) => { inView = en.isIntersecting; }).observe(host);
  addEventListener('resize', () => { renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight, false); });

  if (!reduced()) setTimeout(() => tween(1500, (k) => { lidAngle = 0.04 + (OPEN - 0.04) * k; }, ease.outBack, { skippable: false }), 250);

  function placeHomeCamera(aspect) {
    const k = aspect < 1.15 ? 1.15 / aspect : 1;
    camera.position.copy(CAM_TARGET).addScaledVector(CAM_DIR, CAM_DIST * k);
    camera.up.set(0, 1, 0);
    camera.lookAt(CAM_TARGET);
  }
  function stageRect() {
    const r = host.getBoundingClientRect();
    let x = r.left, y = r.top, w = r.width, h = r.height;
    if (expand > 0) {
      x += (0 - x) * expand; y += (0 - y) * expand;
      w += (innerWidth - w) * expand; h += (innerHeight - h) * expand;
    }
    return { x, y, w, h };
  }
  let cleared = true;
  function clearAll() {
    if (cleared) return;
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, innerWidth, innerHeight);
    renderer.clear();
    cleared = true;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const homeVisible = !$('#view-home').hidden;
    if (!(playing || (homeVisible && inView))) { clearAll(); return; }
    const t = now / 1000;
    const m = reduced() ? 0 : idleAmt;
    pointer.sx += (pointer.x - pointer.sx) * 0.05;
    pointer.sy += (pointer.y - pointer.sy) * 0.05;
    rig.position.y = Math.sin(t * 1.3) * 0.045 * m + bump;
    rig.rotation.y = poseYaw + m * (Math.sin(t * 0.45) * 0.07 + pointer.sx * 0.28);
    rig.rotation.x = m * pointer.sy * 0.08;
    pivot.rotation.x = -lidAngle;
    shadow.scale.setScalar(1 - (rig.position.y - bump) * 0.6);

    const r = stageRect();
    if (r.w < 2 || r.h < 2 || r.y > innerHeight || r.y + r.h < 0) { clearAll(); return; }
    camera.aspect = r.w / r.h;
    camera.updateProjectionMatrix();
    if (!zoomCam) placeHomeCamera(camera.aspect);

    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, innerWidth, innerHeight);
    renderer.clear();
    const y = innerHeight - r.y - r.h;
    renderer.setScissorTest(true);
    renderer.setViewport(r.x, y, r.w, r.h);
    renderer.setScissor(r.x, y, r.w, r.h);
    renderer.render(scene, camera);
    cleared = false;
  }
  requestAnimationFrame(frame);

  function toScreen(v) {
    const r = host.getBoundingClientRect();
    const p = v.clone().project(camera);
    return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((1 - p.y) / 2) * r.height };
  }

  async function zoomIntoScreen() {
    scene.updateMatrixWorld(true);
    zoomCam = true;
    const startPos = camera.position.clone();
    const startQ = camera.quaternion.clone();
    const center = new THREE.Vector3(); topScreen.getWorldPosition(center);
    const q = new THREE.Quaternion(); topScreen.getWorldQuaternion(q);
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    const A = innerWidth / innerHeight;
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const d = Math.min((TOP_H / 2) / tanH, (TOP_W / 2) / (tanH * A)) * 0.9;
    const endPos = center.clone().addScaledVector(normal, d);
    const endQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(endPos, center, up));
    canvas.classList.add('on-top');
    await tween(1250, (k) => {
      expand = ease.inOut(Math.min(1, k * 1.7));
      camera.position.lerpVectors(startPos, endPos, k);
      camera.quaternion.slerpQuaternions(startQ, endQ, k);
    }, ease.inOut);
  }

  return {
    ok: true,
    preview(p) {
      if (playing) return;
      drawTop(p ? 'preview' : 'idle', p);
      drawBottom('idle', p);
    },
    async play(p, linkEl) {
      playing = true;
      drawTop('preview', p); drawBottom('idle', p);

      // make sure the console is on screen
      const r0 = host.getBoundingClientRect();
      if (r0.top < 0 || r0.bottom > innerHeight) {
        scrollTo({ top: Math.max(0, scrollY + r0.top - 110), behavior: 'smooth' });
        await wait(600);
      }
      const yaw0 = poseYaw, idle0 = idleAmt;
      await tween(260, (k) => { idleAmt = idle0 * (1 - k); }, ease.out);
      lidAngle = OPEN;

      // 1) the cartridge flies from the carousel to the slot
      drawLabel(p);
      card.position.set(SLOT.x + CARD_L / 2 + 0.55, SLOT.y, SLOT.z);
      setCardOpacity(0); card.visible = true;
      scene.updateMatrixWorld(true);
      const target = toScreen(card.getWorldPosition(new THREE.Vector3()));
      const e1 = toScreen(consoleG.localToWorld(new THREE.Vector3(card.position.x - CARD_L / 2, SLOT.y, SLOT.z)));
      const e2 = toScreen(consoleG.localToWorld(new THREE.Vector3(card.position.x + CARD_L / 2, SLOT.y, SLOT.z)));
      const lenPx = Math.hypot(e2.x - e1.x, e2.y - e1.y);

      const caseEl = linkEl.querySelector('.case');
      const cr = caseEl.getBoundingClientRect();
      const ghost = caseEl.cloneNode(true);
      ghost.classList.add('ghost');
      Object.assign(ghost.style, { left: `${cr.left}px`, top: `${cr.top}px`, width: `${cr.width}px`, height: `${cr.height}px` });
      document.body.appendChild(ghost);
      caseEl.style.visibility = 'hidden';
      hiddenCase = caseEl;
      const dx = target.x - (cr.left + cr.width / 2);
      const dy = target.y - (cr.top + cr.height / 2);
      const s = Math.max(0.06, Math.min(0.5, (lenPx * 1.1) / cr.width));
      const a1 = ghost.animate(
        [{ transform: 'translate(0,0) rotate(0deg) scale(1)' }, { transform: `translate(${dx}px, ${dy}px) rotate(-12deg) scale(${s})` }],
        { duration: 760, easing: 'cubic-bezier(.55,0,.25,1)', fill: 'forwards' });
      const a2 = ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, delay: 560, fill: 'forwards' });
      liveAnims = [a1, a2];
      if (skipFlag) liveAnims.forEach((a) => a.finish());
      await wait(540);
      await Promise.all([a1.finished.catch(() => {}), tween(240, setCardOpacity, ease.out)]);
      ghost.remove(); liveAnims = [];

      // 2) slide it in, with a little "click"
      const x0 = card.position.x, x1 = SLOT.x - CARD_L / 2 + 0.05;
      await tween(520, (k) => { card.position.x = x0 + (x1 - x0) * k; }, ease.inOut);
      await tween(200, (k) => { bump = -Math.sin(Math.PI * k) * 0.035; }, ease.linear);
      bump = 0;

      // 3) boot the screens and turn the console to face you
      drawTop('flash'); drawBottom('boot', p);
      await wait(90);
      drawTop('boot', p);
      await tween(650, (k) => { poseYaw = yaw0 + (0 - yaw0) * k; }, ease.inOut);
      await wait(220);

      // 4) zoom into the top screen
      await zoomIntoScreen();
    },
    reset() {
      playing = false; zoomCam = false; expand = 0; bump = 0;
      canvas.classList.remove('on-top');
      card.visible = false;
      poseYaw = REST_YAW; idleAmt = 1; lidAngle = OPEN;
      if (hiddenCase) { hiddenCase.style.visibility = ''; hiddenCase = null; }
      drawTop('idle'); drawBottom('idle');
    },
  };
}

/* Shown if WebGL or the CDN is unavailable — the site still works. */
function fallbackStage(host) {
  host.innerHTML = `
    <svg class="fallback-svg" viewBox="0 0 400 320" aria-hidden="true">
      <ellipse cx="200" cy="300" rx="170" ry="14" fill="rgba(80,25,45,.15)"/>
      <rect x="62" y="18" width="276" height="150" rx="18" fill="#C93D6E"/>
      <rect x="98" y="36" width="204" height="116" rx="6" fill="#141113"/>
      <rect id="fb-screen" x="106" y="44" width="188" height="100" rx="3" fill="#FBF6F1"/>
      <rect x="52" y="170" width="296" height="122" rx="20" fill="#B7335F"/>
      <rect x="140" y="186" width="120" height="90" rx="5" fill="#141113"/>
      <rect x="146" y="192" width="108" height="78" rx="3" fill="#1B1719"/>
      <path d="M86 222h36M104 204v36" stroke="#2A2326" stroke-width="12" stroke-linecap="round"/>
      <circle cx="300" cy="210" r="7" fill="#2A2326"/><circle cx="300" cy="238" r="7" fill="#2A2326"/>
      <circle cx="286" cy="224" r="7" fill="#2A2326"/><circle cx="314" cy="224" r="7" fill="#2A2326"/>
    </svg>`;
  const screen = host.querySelector('#fb-screen');
  let hiddenCase = null;
  return {
    ok: false,
    preview(p) { screen.setAttribute('fill', p ? p.bg : '#FBF6F1'); },
    async play(p, linkEl) {
      const caseEl = linkEl.querySelector('.case');
      const cr = caseEl.getBoundingClientRect(), hr = host.getBoundingClientRect();
      const ghost = caseEl.cloneNode(true);
      ghost.classList.add('ghost');
      Object.assign(ghost.style, { left: `${cr.left}px`, top: `${cr.top}px`, width: `${cr.width}px`, height: `${cr.height}px` });
      document.body.appendChild(ghost);
      caseEl.style.visibility = 'hidden'; hiddenCase = caseEl;
      const dx = hr.left + hr.width / 2 - (cr.left + cr.width / 2), dy = hr.top + hr.height * 0.35 - (cr.top + cr.height / 2);
      const a = ghost.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(.15)`, opacity: 0 }],
        { duration: 650, easing: 'cubic-bezier(.55,0,.25,1)', fill: 'forwards' });
      liveAnims = [a];
      await a.finished.catch(() => {});
      ghost.remove(); liveAnims = [];
      screen.setAttribute('fill', p.bg);
    },
    reset() { if (hiddenCase) { hiddenCase.style.visibility = ''; hiddenCase = null; } screen.setAttribute('fill', '#FBF6F1'); },
  };
}

/* =========================================================
   CAROUSEL — infinite, keyboard friendly, pausable
   ========================================================= */
function caseMarkup(p, i, clone) {
  const n = pad(i + 1);
  const cover = p.cover
    ? `<img src="${esc(p.cover)}" alt="" loading="lazy">`
    : `<span class="cover-title">${esc(p.title)}</span><span class="cover-tag">${esc(p.tagline)}</span><span class="cover-art"></span>`;
  return `
  <li class="slide" data-index="${i}"${clone ? ' aria-hidden="true"' : ''}>
    <a class="case-link" href="#/work/${esc(p.slug)}" data-slug="${esc(p.slug)}"${clone ? ' tabindex="-1"' : ''}>
      <span class="case" aria-hidden="true" style="--bg:${p.bg};--ink:${p.ink};--frame:${p.frame}">
        <span class="case-cover">${cover}<span class="cover-badge">UX<small>${n}</small></span></span>
        <span class="case-spine"><span>ALIX DRUMMOND</span><b>${n}</b></span>
      </span>
      <span class="case-caption">
        <span class="case-name">${esc(p.title)}<span class="sr-only">: ${esc(p.tagline)}. View case study</span></span>
        <span class="case-meta">${esc(p.type)} · ${esc(p.year)}</span>
      </span>
    </a>
  </li>`;
}

function initCarousel(onPlay, getStage, isBusy) {
  const track = $('#track');
  const N = PROJECTS.length;
  track.innerHTML = [true, false, true].map((clone) => PROJECTS.map((p, i) => caseMarkup(p, i, clone)).join('')).join('');
  const slides = () => track.children;
  let setW = 0, step = 0, idx = 0;
  const behavior = () => (reduced() ? 'auto' : 'smooth');

  function measure() {
    const s = slides();
    setW = s[N].offsetLeft - s[0].offsetLeft;
    step = s[1].offsetLeft - s[0].offsetLeft;
  }
  function jump(dx) {
    track.style.scrollSnapType = 'none';
    track.scrollLeft += dx;
    void track.offsetWidth;
    track.style.scrollSnapType = '';
  }
  function normalize() {
    if (!setW) return;
    if (track.scrollLeft < setW * 0.5) jump(setW);
    else if (track.scrollLeft > setW * 1.5) jump(-setW);
    idx = ((Math.round((track.scrollLeft - setW) / step) % N) + N) % N;
  }
  function refresh() {
    measure();
    if (!setW) return;
    track.style.scrollSnapType = 'none';
    track.scrollLeft = setW + idx * step;
    void track.offsetWidth;
    track.style.scrollSnapType = '';
  }
  function next(dir) {
    normalize();
    track.scrollBy({ left: dir * step, behavior: behavior() });
  }
  function scrollToSlide(el) {
    track.scrollTo({ left: el.offsetLeft - slides()[0].offsetLeft, behavior: behavior() });
  }

  let timer;
  track.addEventListener('scroll', () => { clearTimeout(timer); timer = setTimeout(normalize, 140); }, { passive: true });
  addEventListener('resize', () => { if (!$('#view-home').hidden) refresh(); });
  $$('.ctrl[data-dir]').forEach((b) => b.addEventListener('click', () => { lastTouch = Date.now(); next(+b.dataset.dir); }));

  // keyboard: arrows move between projects, wrapping seamlessly
  track.addEventListener('keydown', (e) => {
    const a = e.target.closest('.case-link');
    if (!a) return;
    const i = +a.closest('.slide').dataset.index;
    let j;
    if (e.key === 'ArrowRight') { j = (i + 1) % N; if (j === 0) jump(-setW); }
    else if (e.key === 'ArrowLeft') { j = (i - 1 + N) % N; if (j === N - 1) jump(setW); }
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = N - 1;
    else return;
    e.preventDefault();
    const target = slides()[N + j];
    target.querySelector('a').focus({ preventScroll: true });
    scrollToSlide(target);
  });

  // hover / focus preview on the console screen
  const preview = (p) => getStage()?.preview(p);
  track.addEventListener('pointerover', (e) => { const a = e.target.closest('.case-link'); if (a) preview(findProject(a.dataset.slug)); });
  track.addEventListener('pointerleave', () => { if (!track.contains(document.activeElement)) preview(null); });
  track.addEventListener('focusin', (e) => { const a = e.target.closest('.case-link'); if (a) preview(findProject(a.dataset.slug)); });
  track.addEventListener('focusout', (e) => { if (!track.contains(e.relatedTarget)) preview(null); });

  // click → play the insert animation
  track.addEventListener('click', (e) => {
    const a = e.target.closest('.case-link');
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onPlay(a.dataset.slug, a);
  });

  // autoplay (pauses on hover, focus, touch, hidden tab, and is off for reduced motion)
  const toggle = $('#autoplay-toggle');
  let paused = reduced(), hovering = false, focused = false, lastTouch = 0;
  const syncToggle = () => {
    toggle.classList.toggle('is-paused', paused);
    toggle.setAttribute('aria-label', paused ? 'Play carousel' : 'Pause carousel');
  };
  syncToggle();
  toggle.addEventListener('click', () => { paused = !paused; syncToggle(); });
  const region = $('.work');
  region.addEventListener('pointerenter', () => { hovering = true; });
  region.addEventListener('pointerleave', () => { hovering = false; });
  region.addEventListener('focusin', () => { focused = true; });
  region.addEventListener('focusout', (e) => { if (!region.contains(e.relatedTarget)) focused = false; });
  track.addEventListener('pointerdown', () => { lastTouch = Date.now(); });
  setInterval(() => {
    if (paused || hovering || focused || document.hidden || isBusy() || $('#view-home').hidden) return;
    if (Date.now() - lastTouch < 8000) return;
    next(1);
  }, 4200);

  return { refresh };
}

/* =========================================================
   PAGES
   ========================================================= */
function projectMarkup(p, i) {
  const N = PROJECTS.length;
  const n = pad(i + 1);
  const prev = PROJECTS[(i - 1 + N) % N], next = PROJECTS[(i + 1) % N];
  const sections = p.sections || DEFAULT_SECTIONS;
  const imgs = p.images || {};
  const fig = (label, src, alt) => src
    ? `<figure class="p-fig"><img src="${esc(src)}" alt="${esc(alt || label)}" loading="lazy"></figure>`
    : `<figure class="p-fig"><div class="ph" role="img" aria-label="Image placeholder: ${esc(label)}"><span>[Image: ${esc(label)}]</span></div></figure>`;
  return `
  <header class="p-hero" style="--bg:${p.bg};--ink:${p.ink};--frame:${p.frame}">
    <div class="wrap">
      <a class="back-link" href="#/"><span aria-hidden="true">←</span> All projects</a>
      <p class="eyebrow">Case study ${n} · ${esc(p.type)} · ${esc(p.year)}</p>
      <h1 tabindex="-1">${esc(p.title)}</h1>
      <p class="p-tagline">${esc(p.tagline)}</p>
      <dl class="p-meta">
        <div><dt>Role</dt><dd>${esc(p.role)}</dd></div>
        <div><dt>Timeline</dt><dd>${esc(p.timeline)}</dd></div>
        <div><dt>Team</dt><dd>${esc(p.team)}</dd></div>
        <div><dt>Tools</dt><dd>${esc(p.tools)}</dd></div>
      </dl>
    </div>
  </header>

  <div class="wrap p-body">
    <section class="tldr" aria-labelledby="tldr-h">
      <h2 id="tldr-h">At a glance</h2>
      <p>${esc(p.summary)}</p>
    </section>

    <div class="p-cover">${fig('Hero image — the final design in context', p.hero, p.heroAlt)}</div>

    <div class="p-layout">
      <nav class="toc" aria-label="On this page">
        <ol>${sections.map((s, k) => `<li><a href="#${s.id}"><span>${pad(k + 1)}</span>${esc(s.h)}</a></li>`).join('')}</ol>
      </nav>
      <div>
        ${sections.map((s) => `
        <section class="p-section" id="${s.id}" aria-labelledby="${s.id}-h">
          <h2 id="${s.id}-h">${esc(s.h)}</h2>
          <p>${esc(s.body)}</p>
          ${s.fig || imgs[s.id] ? fig(s.fig || s.h, imgs[s.id]) : ''}
        </section>`).join('')}
      </div>
    </div>
  </div>

  <nav class="p-pager" aria-label="More projects">
    <ul>
      <li><a href="#/work/${esc(prev.slug)}" style="--frame:${prev.frame}"><small>← Previous</small><strong><span class="swatch" aria-hidden="true"></span>${esc(prev.title)}</strong></a></li>
      <li><a href="#/work/${esc(next.slug)}" style="--frame:${next.frame}"><small>Next →</small><strong>${esc(next.title)}<span class="swatch" aria-hidden="true"></span></strong></a></li>
    </ul>
  </nav>`;
}

const notFoundMarkup = () => `
  <div class="wrap about">
    <p class="eyebrow">404</p>
    <h1 tabindex="-1" class="about-head">That cartridge doesn’t exist.</h1>
    <a class="button" href="#/">Back to all projects</a>
  </div>`;

/* =========================================================
   APP: nav, router, transitions
   ========================================================= */
let stage = null;
let animating = false;
let firstRender = true;
const views = { home: $('#view-home'), project: $('#view-project'), about: $('#view-about') };
const wipe = $('.wipe');
const skipBtn = $('.skip-anim');
const announce = (msg) => { const el = $('#announcer'); el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 30); };

function wipeIn(color, ms) {
  wipe.style.background = color;
  wipe.classList.add('on');
  return wipe.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms, fill: 'forwards', easing: 'ease-out' }).finished;
}
function wipeOut() {
  if (!wipe.classList.contains('on')) return;
  const a = wipe.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced() ? 150 : 520, fill: 'forwards', easing: 'ease-in-out' });
  a.finished.then(() => { wipe.getAnimations().forEach((x) => x.cancel()); wipe.classList.remove('on'); });
}

function initNav() {
  const menu = $('#projects-menu');
  menu.innerHTML = PROJECTS.map((p, i) =>
    `<li><a href="#/work/${esc(p.slug)}" style="--frame:${p.frame}"><span class="swatch" aria-hidden="true"></span>${esc(p.title)}<small>${pad(i + 1)}</small></a></li>`).join('');

  const subToggle = $('.sub-toggle');
  const setSub = (open) => { subToggle.setAttribute('aria-expanded', open); menu.hidden = !open; };
  subToggle.addEventListener('click', () => setSub(menu.hidden));
  $('.has-sub').addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setSub(false); subToggle.focus(); } });
  $('.has-sub').addEventListener('focusout', (e) => { if (!$('.has-sub').contains(e.relatedTarget)) setSub(false); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.has-sub')) setSub(false); });

  const navToggle = $('.menu-toggle');
  const nav = $('#site-nav');
  const setNav = (open) => { navToggle.setAttribute('aria-expanded', open); nav.classList.toggle('open', open); };
  navToggle.addEventListener('click', () => setNav(!nav.classList.contains('open')));
  nav.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { setNav(false); navToggle.focus(); } });
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) { setNav(false); setSub(false); } });

  // in-page anchors (#main, #contact, section links) without breaking the router
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const h = a.getAttribute('href');
    if (h === '#' || h.startsWith('#/')) return;
    const t = document.getElementById(h.slice(1));
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
    t.focus({ preventScroll: true });
  });

  const header = $('#site-header');
  addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 8), { passive: true });
  $('#year').textContent = new Date().getFullYear();
}

function parseRoute() {
  const h = location.hash || '#/';
  if (!h.startsWith('#/')) return null;
  const parts = h.slice(2).split('/').filter(Boolean);
  if (parts[0] === 'work' && parts[1]) return { view: 'project', slug: decodeURIComponent(parts[1]) };
  if (parts[0] === 'about') return { view: 'about' };
  return { view: 'home' };
}

function showRoute(route, carousel) {
  if (!route) return;
  if (route.view === 'project') {
    const i = PROJECTS.findIndex((p) => p.slug === route.slug);
    views.project.innerHTML = i < 0 ? notFoundMarkup() : projectMarkup(PROJECTS[i], i);
    document.title = i < 0 ? `Not found · ${SITE_TITLE}` : `${PROJECTS[i].title} — Case study · Alix Drummond`;
  } else {
    document.title = route.view === 'about' ? 'About · Alix Drummond' : SITE_TITLE;
  }
  for (const [k, v] of Object.entries(views)) v.hidden = k !== route.view;
  $$('[data-nav]').forEach((a) => (a.dataset.nav === route.view ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));

  if (route.view === 'home') { carousel.refresh(); stage?.reset(); }
  scrollTo({ top: 0, behavior: 'instant' });

  const view = views[route.view];
  if (!firstRender) {
    view.querySelector('h1')?.focus({ preventScroll: true });
    if (!reduced() && !wipe.classList.contains('on')) {
      view.classList.remove('entering'); void view.offsetWidth; view.classList.add('entering');
    }
  }
  firstRender = false;
  wipeOut();
}

async function playProject(slug, linkEl) {
  if (animating) return;
  const p = findProject(slug);
  if (!p) return;
  if (reduced() || !stage) {
    await wipeIn(p.bg, reduced() ? 120 : 300);
    location.hash = `#/work/${slug}`;
    return;
  }
  animating = true;
  skipFlag = false;
  const header = $('#site-header'), main = $('#main');
  header.inert = true; main.inert = true;
  skipBtn.hidden = false;
  skipBtn.focus({ preventScroll: true });
  announce(`Loading ${p.title} case study. Press Escape to skip the animation.`);
  try { await stage.play(p, linkEl); } catch (err) { console.error(err); }
  await wipeIn(p.bg, skipFlag ? 80 : 220);
  skipBtn.hidden = true;
  header.inert = false; main.inert = false;
  animating = false;
  skipFlag = false;
  location.hash = `#/work/${slug}`;
  stage.reset();
}

function skipAnimation() {
  if (!animating) return;
  skipFlag = true;
  liveAnims.forEach((a) => a.finish());
}

/* ---------- boot ---------- */
initNav();
const carousel = initCarousel(playProject, () => stage, () => animating);
skipBtn.addEventListener('click', skipAnimation);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') skipAnimation(); });
addEventListener('hashchange', () => {
  if (animating) { skipAnimation(); return; }
  showRoute(parseRoute(), carousel);
});
showRoute(parseRoute() || { view: 'home' }, carousel);
initStage().then((s) => { stage = s; });
reduceMQ.addEventListener?.('change', () => carousel.refresh());
