import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
await Promise.all(['400','600','700','800'].map(w => document.fonts.load(w + ' 40px M')));

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const R = (t, a, b) => ease(clamp((t - a) / (b - a)));
const L = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const inR = (t, a, b) => t >= a && t < b;
// keyframed vector path: keys = [[t,[x,y,z]],...]
function path(t, keys) {
  if (t <= keys[0][0]) return V(...keys[0][1]);
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1];
    if (t < t1) { const k = t1 - t0 < 1e-3 ? 1 : ease((t - t0) / (t1 - t0)); return V(lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)); }
  }
  return V(...keys[keys.length - 1][1]);
}

// ---------- timeline (s) ----------
export const P = {
  intro: [0, 8], mat: [8, 18], p0: [18, 29], p1: [29, 53], p2: [53, 73], p3: [73, 87],
  p4: [87, 99], p5: [99, 126], p6: [126, 143], p7: [143, 166], outro: [166, 173],
};
export const DURATION = 173;

// ---------- renderer / scene ----------
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(1920, 1080, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
const camera = new THREE.PerspectiveCamera(32, 1920 / 1080, 0.02, 60);

scene.add(new THREE.HemisphereLight(0xffffff, 0xb8bcc4, 0.55));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(2.2, 4.5, 3.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 12 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xdfe8ff, 0.7); fill.position.set(-3, 2, -2.5); scene.add(fill);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.22 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

// ---------- textures ----------
const texLoader = new THREE.TextureLoader();
const fondoImg = new Image(); fondoImg.src = 'fondo_pled.jpg';
const logoImg = new Image(); logoImg.src = 'logo.png';

function canvasTex(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return { c, g: c.getContext('2d'), t };
}
function noiseTex(w, h, base, spread, fibers) {
  const { c, g, t } = canvasTex(w, h);
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const id = g.getImageData(0, 0, w, h);
  for (let i = 0; i < id.data.length; i += 4) { const n = (Math.random() - .5) * spread; id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n; }
  g.putImageData(id, 0, 0);
  if (fibers) for (let i = 0; i < fibers.n; i++) {
    g.strokeStyle = fibers.color; g.globalAlpha = fibers.a * Math.random(); g.lineWidth = fibers.w;
    const y = Math.random() * h; g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= w; x += 40) g.lineTo(x, y + Math.sin(x * .01 + i) * fibers.wave);
    g.stroke();
  }
  g.globalAlpha = 1; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true;
  return t;
}

// ---------- materials ----------
const M = {
  white: new THREE.MeshStandardMaterial({ color: 0xf1f1ee, roughness: 0.42, metalness: 0.0 }),
  whiteIn: new THREE.MeshStandardMaterial({ color: 0xe6e6e2, roughness: 0.6 }),
  groove: new THREE.MeshStandardMaterial({ color: 0xcfcfcb, roughness: 0.6 }),
  vent: new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.8 }),
  steel: new THREE.MeshStandardMaterial({ color: 0xa9adb3, roughness: 0.32, metalness: 0.85 }),
  zinc: new THREE.MeshStandardMaterial({ color: 0xbfc4ca, roughness: 0.4, metalness: 0.75 }),
  screw: new THREE.MeshStandardMaterial({ color: 0xd0d3d8, roughness: 0.25, metalness: 1 }),
  blackPlastic: new THREE.MeshStandardMaterial({ color: 0x141516, roughness: 0.55 }),
  blackGloss: new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.12, metalness: 0.2 }),
  alu: new THREE.MeshStandardMaterial({ color: 0x1d1f22, roughness: 0.38, metalness: 0.7 }),
  pcBody: new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: 0.42, metalness: 0.65 }),
  usbBlue: new THREE.MeshStandardMaterial({ color: 0x1f6fe0, roughness: 0.5 }),
  usbBlack: new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.5 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xc9b98a, roughness: 0.3, metalness: 1 }),
  pla: new THREE.MeshStandardMaterial({ color: 0x2b2d31, roughness: 0.75 }),
  cable: new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.5 }),
  cableGrey: new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.5 }),
  extWhite: new THREE.MeshStandardMaterial({ color: 0xf6f6f4, roughness: 0.5 }),
  tape: new THREE.MeshStandardMaterial({ color: 0xd8322a, roughness: 0.45 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xbfe0da, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.32, envMapIntensity: 1.6, depthWrite: false }),
  red: new THREE.MeshStandardMaterial({ color: 0xd92b2b, roughness: 0.4 }),
  btn: new THREE.MeshStandardMaterial({ color: 0x3a3c40, roughness: 0.6 }),
  wood: new THREE.MeshStandardMaterial({ map: noiseTex(256, 1024, '#c79a63', 22, { n: 90, color: '#8a5a2b', a: .55, w: 2, wave: 6 }), roughness: 0.8 }),
  pallet: new THREE.MeshStandardMaterial({ map: noiseTex(256, 1024, '#b98f5c', 28, { n: 70, color: '#7a5028', a: .5, w: 2, wave: 4 }), roughness: 0.85 }),
  table: new THREE.MeshStandardMaterial({ map: noiseTex(1024, 256, '#b07c47', 18, { n: 60, color: '#7d5128', a: .45, w: 3, wave: 3 }), roughness: 0.55 }),
  film: new THREE.MeshPhysicalMaterial({ color: 0xf2f6fa, roughness: 0.12, transparent: true, opacity: 0.26, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 2 }),
};
M.wood.map.rotation = 0; M.table.map.repeat.set(1, 1);
const ghost = new THREE.MeshStandardMaterial({ color: 0xf1f1ee, roughness: 0.42, transparent: true, opacity: 0.18, depthWrite: false });

function mesh(geo, mat, parent, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  if (parent) parent.add(m); return m;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const rbox = (w, h, d, r = 0.004) => new RoundedBoxGeometry(w, h, d, 3, r);

// ---------- totem dimensions (m) ----------
const W = 0.70, H = 1.70, D = 0.14, CR = 0.075, TH = 0.012, BASE = 0.02;
const SW = 0.545, SH = 0.955, SC = 1.135;           // screen opening
const UO = { x: 0.31, y0: 0.63, y1: 1.625 };        // upper rear opening
const LO = { x: 0.25, y0: 0.05, y1: 0.55 };         // lower rear opening
const SHELF = 0.60;

function topRounded(p, x0, x1, y0, y1, r) {
  p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1 - r);
  p.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false); p.lineTo(x0 + r, y1);
  p.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false); p.lineTo(x0, y0); return p;
}
function rectPath(x0, y0, x1, y1) { const p = new THREE.Path(); p.moveTo(x0, y0); p.lineTo(x0, y1); p.lineTo(x1, y1); p.lineTo(x1, y0); p.lineTo(x0, y0); return p; }

// ---------- TOTEM ----------
const totem = new THREE.Group(); scene.add(totem);
const body = new THREE.Group(); body.position.y = BASE; totem.add(body);
// base plate
mesh(rbox(0.74, BASE, 0.44, 0.006), M.white, totem, 0, BASE / 2, 0);
// shell (sides + top)
{
  const s = new THREE.Shape(), a = W / 2, b = W / 2 - TH, r2 = CR - TH;
  s.moveTo(-a, 0); s.lineTo(-b, 0); s.lineTo(-b, H - TH - r2);
  s.absarc(-b + r2, H - TH - r2, r2, Math.PI, Math.PI / 2, true); s.lineTo(b - r2, H - TH);
  s.absarc(b - r2, H - TH - r2, r2, Math.PI / 2, 0, true); s.lineTo(b, 0); s.lineTo(a, 0); s.lineTo(a, H - CR);
  s.absarc(a - CR, H - CR, CR, 0, Math.PI / 2, false); s.lineTo(-a + CR, H);
  s.absarc(-a + CR, H - CR, CR, Math.PI / 2, Math.PI, false); s.lineTo(-a, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: D - 0.012, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 3, curveSegments: 24 });
  g.translate(0, 0, -(D - 0.012) / 2);
  mesh(g, M.white, body);
}
// front plate with screen opening
{
  const s = topRounded(new THREE.Shape(), -W / 2 + 0.004, W / 2 - 0.004, 0.004, H - 0.004, CR - 0.004);
  s.holes.push(rectPath(-SW / 2, SC - SH / 2, SW / 2, SC + SH / 2));
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: false, curveSegments: 24 });
  mesh(g, M.white, body, 0, 0, D / 2 - 0.006);
  // bezel profile around screen
  const bz = 0.012, z = D / 2 + 0.002;
  mesh(box(SW + 2 * bz, bz, 0.004), M.white, body, 0, SC + SH / 2 + bz / 2, z);
  mesh(box(SW + 2 * bz, bz, 0.004), M.white, body, 0, SC - SH / 2 - bz / 2, z);
  mesh(box(bz, SH, 0.004), M.white, body, -SW / 2 - bz / 2, SC, z);
  mesh(box(bz, SH, 0.004), M.white, body, SW / 2 + bz / 2, SC, z);
  // lower front panel groove
  const gx0 = -0.29, gx1 = 0.29, gy0 = 0.03, gy1 = 0.585, gz = D / 2 + 0.0002, gw = 0.0025;
  mesh(box(gx1 - gx0, gw, 0.001), M.groove, body, 0, gy0, gz); mesh(box(gx1 - gx0, gw, 0.001), M.groove, body, 0, gy1, gz);
  mesh(box(gw, gy1 - gy0, 0.001), M.groove, body, gx0, (gy0 + gy1) / 2, gz); mesh(box(gw, gy1 - gy0, 0.001), M.groove, body, gx1, (gy0 + gy1) / 2, gz);
  mesh(box(gx1 - gx0, gw, 0.001), M.groove, body, 0, 0.555, gz);
}
// rear plate with two openings
{
  const s = topRounded(new THREE.Shape(), -W / 2 + 0.004, W / 2 - 0.004, 0.004, H - 0.004, CR - 0.004);
  s.holes.push(rectPath(-UO.x, UO.y0, UO.x, UO.y1));
  s.holes.push(rectPath(-LO.x, LO.y0, LO.x, LO.y1));
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: false, curveSegments: 24 });
  mesh(g, M.white, body, 0, 0, -D / 2);
}
// interior: dark back of front plate, shelf with cable channels, internal plate, floor
mesh(box(W - 2 * TH, 0.006, D - 0.02), M.whiteIn, body, 0, 0.003, 0);
{
  const y = SHELF + 0.003, d = D - 0.02;
  mesh(box(0.39, 0.006, d), M.whiteIn, body, 0, y, 0);
  const sideW = (W - 2 * TH) / 2 - 0.245;
  mesh(box(sideW, 0.006, d), M.whiteIn, body, -(0.245 + sideW / 2), y, 0);
  mesh(box(sideW, 0.006, d), M.whiteIn, body, 0.245 + sideW / 2, y, 0);
}
const plate = mesh(box(0.56, 0.44, 0.003), M.zinc, body, 0, 0.34, 0.0015);
const anchors = [[-0.075, 0.31], [0.075, 0.31], [-0.075, 0.43], [0.075, 0.43]].map(([x, y]) => {
  const a = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.006, 16), M.screw, body, x, y, -0.002); a.rotation.x = Math.PI / 2; return a;
});
// extension strip (Chilean sockets)
const ext = new THREE.Group(); ext.position.set(0.11, 0.006, 0.012); body.add(ext);
mesh(rbox(0.30, 0.036, 0.055, 0.008), M.extWhite, ext, 0, 0.018, 0);
for (let i = 0; i < 4; i++) {
  const sx = -0.105 + i * 0.07;
  mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.003, 24), M.groove, ext, sx, 0.0365, 0);
  for (const dx of [-0.006, 0, 0.006]) mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.004, 8), M.vent, ext, sx + dx, 0.037, dx === 0 ? 0.004 : -0.002);
}
mesh(rbox(0.018, 0.012, 0.02, 0.003), M.red, ext, 0.165, 0.03, 0);
// ext cord to rear exit and out
function tube(points, r, mat, parent, seg = 120) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => V(...p)), false, 'catmullrom', 0.4);
  const g = new THREE.TubeGeometry(curve, seg, r, 10, false);
  const m = mesh(g, mat, parent); m.userData.seg = seg; m.userData.curve = curve; return m;
}
const extCord = tube([[0.26, 0.024, 0.012], [0.3, 0.02, -0.03], [0.31, 0.03, -0.072], [0.31, 0.015, -0.12], [0.36, 0.006, -0.3], [0.7, 0.004, -0.55], [1.2, 0.004, -0.6]], 0.0045, M.cable, totem);
extCord.position.y = 0;

// rear panels
function makeUpperPanel() {
  const g = new THREE.Group();
  const w = UO.x * 2 + 0.03, h = UO.y1 - UO.y0 + 0.03;
  mesh(rbox(w, h, 0.004, 0.0018), M.white, g, 0, 0, 0);
  for (const vy of [h / 2 - 0.11, -h / 2 + 0.13]) for (const gx of [-0.14, 0, 0.14]) for (let i = 0; i < 6; i++)
    mesh(box(0.11, 0.0045, 0.002), M.vent, g, gx, vy + 0.028 - i * 0.0115, -0.0016);
  const screws = [[-w / 2 + 0.02, h / 2 - 0.02], [0, h / 2 - 0.02], [w / 2 - 0.02, h / 2 - 0.02], [-w / 2 + 0.02, -0.05], [w / 2 - 0.02, -0.05]].map(([x, y]) => makeScrew(g, x, y, -0.0025));
  return { g, screws, w, h };
}
function makeScrew(parent, x, y, z) {
  const s = new THREE.Group(); s.position.set(x, y, z); parent.add(s);
  const head = mesh(new THREE.CylinderGeometry(0.0055, 0.006, 0.0025, 20), M.screw, s, 0, 0, 0); head.rotation.x = Math.PI / 2;
  const sl1 = mesh(box(0.008, 0.0012, 0.001), M.vent, s, 0, 0, -0.0013); const sl2 = mesh(box(0.0012, 0.008, 0.001), M.vent, s, 0, 0, -0.0013);
  const shaft = mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.014, 10), M.screw, s, 0, 0, 0.007); shaft.rotation.x = Math.PI / 2;
  s.userData.base = s.position.clone(); return s;
}
const UP = makeUpperPanel(); UP.g.position.set(0, (UO.y0 + UO.y1) / 2, -D / 2 - 0.003); body.add(UP.g);
UP.g.userData.base = UP.g.position.clone();
const LP = (() => {
  const g = new THREE.Group(); const w = LO.x * 2 + 0.03, h = LO.y1 - LO.y0 + 0.03;
  mesh(rbox(w, h, 0.004, 0.0018), M.white, g);
  const lock = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.006, 24), M.screw, g, 0, 0.02, -0.003); lock.rotation.x = Math.PI / 2;
  mesh(box(0.0025, 0.012, 0.002), M.vent, g, 0, 0.02, -0.0062);
  const screws = [[-w / 2 + 0.02, h / 2 - 0.02], [w / 2 - 0.02, h / 2 - 0.02], [-w / 2 + 0.02, -h / 2 + 0.02], [w / 2 - 0.02, -h / 2 + 0.02]].map(([x, y]) => makeScrew(g, x, y, -0.0025));
  g.position.set(0, (LO.y0 + LO.y1) / 2, -D / 2 - 0.003); body.add(g); g.userData.base = g.position.clone();
  return { g, screws, w, h };
})();

// ---------- touch frame ----------
const FW = 0.585, FH = 0.985, FB = 0.026;
const frame = new THREE.Group(); body.add(frame);
mesh(rbox(FW, FB, 0.012, 0.003), M.alu, frame, 0, FH / 2 - FB / 2, 0);
mesh(rbox(FW, FB, 0.012, 0.003), M.alu, frame, 0, -FH / 2 + FB / 2, 0);
mesh(rbox(FB, FH - 2 * FB, 0.012, 0.003), M.alu, frame, -FW / 2 + FB / 2, 0, 0);
mesh(rbox(FB, FH - 2 * FB, 0.012, 0.003), M.alu, frame, FW / 2 - FB / 2, 0, 0);
mesh(box(FW - 0.03, 0.004, 0.003), M.vent, frame, 0, FH / 2 - FB, 0.004); // IR strips
mesh(box(FW - 0.03, 0.004, 0.003), M.vent, frame, 0, -FH / 2 + FB, 0.004);
mesh(rbox(0.04, 0.016, 0.012, 0.003), M.blackPlastic, frame, FW / 2 - 0.05, -FH / 2 - 0.004, -0.006); // usb box
const FRAME_REST = V(0, SC, D / 2 - 0.006 - 0.006);
// ---------- glass ----------
const glass = mesh(rbox(0.578, 0.975, 0.005, 0.002), M.glass, body); glass.castShadow = false;
const GLASS_REST = V(0, SC, FRAME_REST.z - 0.0085);
// ---------- spacers ----------
const flatSp = [-0.2, 0, 0.2].map(x => { const s = mesh(rbox(0.05, SC - FH / 2 - SHELF - 0.006, 0.02, 0.002), M.pla, body); s.userData.rest = V(x, (SHELF + 0.006 + SC - FH / 2) / 2, GLASS_REST.z + 0.006); return s; });
const stopSp = [];
for (const sx of [-1, 1]) for (const dy of [-0.22, 0.22]) {
  const g = new THREE.Group(); body.add(g);
  mesh(rbox(0.058, 0.07, 0.026, 0.002), M.pla, g, 0, 0, 0);
  mesh(rbox(0.014, 0.07, 0.008, 0.002), M.pla, g, -sx * 0.036, 0, 0.009); // tope
  g.userData.rest = V(sx * (W / 2 - TH - 0.029), SC + dy, 0.027); stopSp.push(g);
}
// ---------- monitor ----------
const MW = 0.555, MH = 0.975;
const monitor = new THREE.Group(); body.add(monitor);
mesh(rbox(MW, MH, 0.012, 0.003), M.blackPlastic, monitor, 0, 0, 0.006);
const screenMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const screenOff = M.blackGloss;
const screen = mesh(new THREE.PlaneGeometry(0.54, 0.95), screenOff, monitor, 0, 0, 0.0122); screen.castShadow = false;
mesh(rbox(0.50, 0.90, 0.034, 0.012), M.blackPlastic, monitor, 0, 0, -0.016);
// VESA holes
for (const vx of [-0.1, 0.1]) for (const vy of [-0.1, 0.1]) { const h = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.002, 12), M.vent, monitor, vx, vy, -0.0332); h.rotation.x = Math.PI / 2; }
// port panel
mesh(box(0.16, 0.035, 0.003), M.vent, monitor, 0.12, -0.40, -0.0335);
const hdmiPorts = [0.075, 0.115].map((x, i) => { mesh(box(0.016, 0.006, 0.004), M.gold, monitor, x, -0.40, -0.035); return V(x, -0.40, -0.035); });
mesh(box(0.016, 0.012, 0.004), M.blackGloss, monitor, 0.17, -0.40, -0.035);
const MON_REST = V(0, SC, GLASS_REST.z - 0.0025 - 0.012);
// T bracket
const tbr = new THREE.Group(); monitor.add(tbr);
mesh(box(0.05, 0.36, 0.003), M.steel, tbr, 0, -0.03, 0);
mesh(box(0.655, 0.05, 0.003), M.steel, tbr, 0, 0.17, 0);
mesh(box(0.003, 0.05, 0.03), M.steel, tbr, -0.326, 0.17, 0.0135);
mesh(box(0.003, 0.05, 0.03), M.steel, tbr, 0.326, 0.17, 0.0135);
const TBR_REST = V(0, 0, -0.0348);
const tBolts = [-0.1, 0.1].map(y => {
  const b = new THREE.Group(); monitor.add(b);
  const h = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.005, 6), M.screw, b); h.rotation.x = Math.PI / 2;
  const s = mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.016, 10), M.screw, b, 0, 0, 0.008); s.rotation.x = Math.PI / 2;
  b.userData.rest = V(0, y, -0.039); return b;
});
// L plates (sides)
const lPlates = [];
for (const sx of [-1, 1]) for (const dy of [-0.36, 0.36]) {
  const g = new THREE.Group(); body.add(g);
  mesh(box(0.003, 0.06, 0.045), M.steel, g, 0, 0, 0);                  // on wall
  mesh(box(0.065, 0.06, 0.003), M.steel, g, -sx * 0.0325, 0, -0.021);  // on monitor
  const sc = new THREE.Group(); g.add(sc);
  const hd = mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.003, 16), M.screw, sc); hd.rotation.z = Math.PI / 2;
  sc.position.set(-sx * 0.003, 0, 0.005); sc.userData.base = sc.position.clone();
  g.userData = { rest: V(sx * (W / 2 - TH - 0.0015), SC + dy, 0.0), sx, sc };
  lPlates.push(g);
}

// ---------- mini PC ----------
function makePC() {
  const g = new THREE.Group(); // local: front panel +z, fins +y
  const w = 0.19, h = 0.058, d = 0.15;
  mesh(rbox(w, h * 0.55, d, 0.006), M.pcBody, g, 0, -h * 0.225, 0);
  for (let i = 0; i < 22; i++) mesh(box(0.0035, h * 0.5, d - 0.004), M.pcBody, g, -w / 2 + 0.012 + i * (w - 0.024) / 21, h * 0.22, 0);
  mesh(rbox(w, h, 0.006, 0.004), M.pcBody, g, 0, 0, d / 2 - 0.003);
  mesh(rbox(w, h, 0.006, 0.004), M.pcBody, g, 0, 0, -d / 2 + 0.003);
  // front ports
  const fz = d / 2 + 0.0005;
  const pb = mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.002, 20), M.screw, g, -0.07, 0.002, fz); pb.rotation.x = Math.PI / 2;
  for (const [x, mat] of [[-0.035, M.usbBlue], [-0.005, M.usbBlue], [0.027, M.usbBlack]]) for (const dy of [-0.008, 0.008]) {
    mesh(box(0.016, 0.0065, 0.002), M.screw, g, x, dy, fz); mesh(box(0.012, 0.003, 0.0025), mat, g, x, dy, fz);
  }
  // rear ports
  const rz = -d / 2 - 0.0005;
  mesh(box(0.016, 0.006, 0.002), M.screw, g, 0.03, 0, rz); mesh(box(0.016, 0.013, 0.002), M.screw, g, -0.01, 0, rz);
  const dc = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.002, 16), M.screw, g, 0.065, 0, rz); dc.rotation.x = Math.PI / 2;
  return g;
}
const pc = makePC(); body.add(pc);
const PC_REST = V(0, 0.37, -0.03); const PC_ROT = -Math.PI / 2;
// L stop plate for PC
const pcL = new THREE.Group(); body.add(pcL);
mesh(box(0.08, 0.003, 0.06), M.steel, pcL, 0, 0, -0.03);
mesh(box(0.08, 0.04, 0.003), M.steel, pcL, 0, -0.02, 0.0);
const pcLScrews = [-0.025, 0.025].map(x => { const s = new THREE.Group(); pcL.add(s); const hd = mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.003, 16), M.screw, s); hd.rotation.x = Math.PI / 2; s.position.set(x, -0.025, -0.003); return s; });
const PCL_REST = V(-0.045, 0.293, -0.0015);
// PSU + tape
const psu = new THREE.Group(); body.add(psu);
mesh(rbox(0.11, 0.032, 0.055, 0.006), M.blackPlastic, psu, 0, 0.018, 0);
const tape = mesh(box(0.09, 0.002, 0.04), M.tape, body, -0.17, 0.007, -0.01);
const PSU_REST = V(-0.17, 0.006, -0.01);

// ---------- cables (grow with drawRange) ----------
function grow(m, k) { const seg = m.userData.seg; m.geometry.setDrawRange(0, Math.floor(seg * clamp(k)) * 10 * 6); m.visible = k > 0.001; }
const mp = (x, y, z) => [MON_REST.x + x, MON_REST.y + y, MON_REST.z + z];
const hdmiCable = tube([mp(0.075, -0.40, -0.04), mp(0.07, -0.43, -0.055), [0.2, SHELF + 0.03, -0.045], [0.22, SHELF, -0.045], [0.21, 0.52, -0.045], [0.12, 0.44, -0.06],
  [0.09, 0.30, -0.065], [0.06, 0.26, -0.06], [0.04, 0.262, -0.045], [0.03, 0.288, -0.04]], 0.0038, M.cable, body, 160);
const HDMI_SPLIT = 0.52;
const monPower = tube([mp(0.17, -0.40, -0.04), mp(0.17, -0.44, -0.05), [0.23, SHELF + 0.02, -0.035], [0.225, SHELF - 0.02, -0.035], [0.24, 0.35, -0.04], [0.22, 0.12, -0.035], [0.15, 0.07, 0.0], [0.145, 0.052, 0.012]], 0.0035, M.cable, body, 140);
const monPlug = mesh(rbox(0.022, 0.028, 0.03, 0.004), M.blackPlastic, body, 0.145, 0.058, 0.012);
const usbTouch = tube([[FW / 2 - 0.05, SC - FH / 2 - 0.004, FRAME_REST.z - 0.012], [0.25, SHELF + 0.03, 0.0], [0.235, SHELF, -0.035], [0.18, 0.52, -0.05], [0.06, 0.48, -0.06], [-0.035, 0.46, -0.055], [-0.035, 0.448, -0.04]], 0.0028, M.cableGrey, body, 140);
const psuDC = tube([[-0.12, 0.025, -0.01], [-0.05, 0.06, -0.04], [0.04, 0.2, -0.06], [0.07, 0.262, -0.055], [0.065, 0.288, -0.04]], 0.0028, M.cable, body, 100);
const psuAC = tube([[-0.225, 0.025, -0.01], [-0.25, 0.03, 0.03], [-0.1, 0.03, 0.045], [0.0, 0.04, 0.03], [0.075, 0.052, 0.012]], 0.0035, M.cable, body, 100);
const psuPlug = mesh(rbox(0.022, 0.028, 0.03, 0.004), M.blackPlastic, body, 0.075, 0.058, 0.012);

// ---------- pendrive ----------
const pen = new THREE.Group(); body.add(pen);
mesh(rbox(0.018, 0.05, 0.009, 0.003), M.usbBlue, pen, 0, 0.03, 0); mesh(box(0.012, 0.012, 0.0045), M.screw, pen, 0, 0.0, 0);
const PEN_REST = V(-0.005, 0.455, -0.03);

// ---------- remote ----------
const remote = new THREE.Group(); scene.add(remote);
mesh(rbox(0.048, 0.17, 0.018, 0.008), M.blackPlastic, remote);
mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.004, 16), M.red, remote, -0.012, 0.065, 0.01).rotation.x = Math.PI / 2;
for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) mesh(rbox(0.009, 0.006, 0.004, 0.0015), M.btn, remote, -0.013 + j * 0.013, 0.03 - i * 0.015, 0.0095);
mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.004, 24), M.btn, remote, 0, -0.045, 0.01).rotation.x = Math.PI / 2;
const irBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.03, 1, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0, depthWrite: false }));
scene.add(irBeam);

// ---------- packing: monitor box, film, label, pallet crate ----------
const pack = new THREE.Group(); totem.add(pack);
const cardTex = (() => {
  const { c, g, t } = canvasTex(1024, 1340);
  g.fillStyle = '#b98a55'; g.fillRect(0, 0, 1024, 1340);
  const id = g.getImageData(0, 0, 1024, 1340);
  for (let i = 0; i < id.data.length; i += 4) { const n = (Math.random() - .5) * 18; id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n * .8; }
  g.putImageData(id, 0, 0);
  g.strokeStyle = 'rgba(40,25,10,.85)'; g.fillStyle = 'rgba(40,25,10,.85)'; g.lineWidth = 6;
  g.font = '800 64px M'; g.fillText('MONITOR 43"', 70, 150); g.font = '600 34px M'; g.fillText('LED DISPLAY · FRAGILE', 70, 205);
  // handling icons
  const icons = [[120, 1150, 'glass'], [260, 1150, 'umbrella'], [400, 1150, 'arrows'], [540, 1150, 'stack']];
  for (const [x, y, k] of icons) {
    g.strokeRect(x - 55, y - 55, 110, 110);
    g.beginPath();
    if (k === 'glass') { g.moveTo(x - 20, y - 35); g.lineTo(x + 20, y - 35); g.lineTo(x + 12, y); g.lineTo(x - 12, y); g.closePath(); g.moveTo(x, y); g.lineTo(x, y + 30); g.moveTo(x - 15, y + 32); g.lineTo(x + 15, y + 32); }
    if (k === 'umbrella') { g.arc(x, y - 5, 32, Math.PI, 0); g.lineTo(x - 32, y - 5); g.moveTo(x, y - 5); g.lineTo(x, y + 30); g.arc(x - 7, y + 30, 7, 0, Math.PI); }
    if (k === 'arrows') { for (const dx of [-14, 14]) { g.moveTo(x + dx, y + 35); g.lineTo(x + dx, y - 30); g.moveTo(x + dx - 12, y - 18); g.lineTo(x + dx, y - 34); g.lineTo(x + dx + 12, y - 18); } g.moveTo(x - 35, y + 38); g.lineTo(x + 35, y + 38); }
    if (k === 'stack') { g.font = '800 54px M'; g.fillText('4', x - 16, y + 20); }
    g.stroke();
  }
  t.needsUpdate = true; return t;
})();
const cardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: cardTex, roughness: 0.92 });
const cardPlain = new THREE.MeshStandardMaterial({ color: 0xb98a55, roughness: 0.92 });
const BOX = { w: 0.78, h: 1.1, d: 0.2, t: 0.005 };
const mbox = new THREE.Group(); pack.add(mbox);
mesh(box(BOX.w, BOX.h, BOX.t), [cardPlain, cardPlain, cardPlain, cardPlain, cardMat, cardPlain], mbox, 0, 0, BOX.d / 2);
mesh(box(BOX.w, BOX.h, BOX.t), cardPlain, mbox, 0, 0, -BOX.d / 2);
mesh(box(BOX.t, BOX.h, BOX.d), cardPlain, mbox, -BOX.w / 2, 0, 0);
mesh(box(BOX.t, BOX.h, BOX.d), cardPlain, mbox, BOX.w / 2, 0, 0);
mesh(box(BOX.w, BOX.t, BOX.d), cardPlain, mbox, 0, BOX.h / 2, 0);
const BOX_REST_Y = BASE + H + 0.025 - BOX.h / 2;
const labelTex = (() => {
  const { g, t } = canvasTex(640, 420);
  g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, 640, 420); g.fillStyle = '#111'; g.font = '800 40px M'; g.fillText('ENVÍO', 30, 60);
  g.fillRect(30, 76, 580, 4); g.font = '700 26px M';
  const rows = ['Destinatario: ____________', 'Dirección: _______________', 'Ciudad: ________________', 'Contacto: _______________', 'Teléfono: _______________'];
  rows.forEach((r, i) => g.fillText(r, 30, 125 + i * 54));
  g.font = '800 30px M'; g.fillStyle = '#c62828'; g.fillText('FRÁGIL', 470, 60);
  t.needsUpdate = true; return t;
})();
const shipLabel = mesh(new THREE.PlaneGeometry(0.24, 0.158), new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.8 }), pack);
shipLabel.castShadow = false;
const films = [];
for (let i = 0; i < 16; i++) {
  const g = new THREE.CylinderGeometry(0.5, 0.5, 0.16, 4, 1, true); g.rotateY(Math.PI / 4);
  const f = new THREE.Mesh(g, M.film); f.scale.set((BOX.w + 0.02 + i * 0.0006) / 0.7071, 1, (BOX.d + 0.03 + i * 0.0006) / 0.7071);
  f.position.y = BASE + 0.08 + i * 0.105; f.rotation.z = (i % 2 ? 1 : -1) * 0.04; f.renderOrder = 5; pack.add(f); films.push(f);
}
// pallet + crate
const crate = new THREE.Group(); scene.add(crate);
const pallet = new THREE.Group(); crate.add(pallet);
for (let i = 0; i < 7; i++) mesh(box(0.1, 0.02, 0.62), M.pallet, pallet, -0.42 + i * 0.14, 0.13, 0);
for (const z of [-0.26, 0, 0.26]) for (const x of [-0.4, 0, 0.4]) mesh(box(0.1, 0.08, 0.1), M.pallet, pallet, x, 0.08, z);
for (const z of [-0.26, 0, 0.26]) mesh(box(0.96, 0.02, 0.1), M.pallet, pallet, 0, 0.03, z);
for (const z of [-0.26, 0, 0.26]) mesh(box(0.96, 0.02, 0.1), M.pallet, pallet, 0, 0.11, z);
const crateParts = [];
{
  const cw = 0.92, cd = 0.42, ch = 1.86, y0 = 0.14;
  const slat = (w, h, d, x, y, z) => { const m = mesh(box(w, h, d), M.wood, crate, x, y, z); crateParts.push(m); return m; };
  for (const x of [-cw / 2, cw / 2]) for (const z of [-cd / 2, cd / 2]) slat(0.04, ch, 0.04, x, y0 + ch / 2, z);
  for (const y of [0.05, 0.6, 1.2, 1.8]) { slat(cw + 0.04, 0.09, 0.018, 0, y0 + y, cd / 2 + 0.03); slat(cw + 0.04, 0.09, 0.018, 0, y0 + y, -cd / 2 - 0.03); slat(0.018, 0.09, cd + 0.04, -cw / 2 - 0.03, y0 + y, 0); slat(0.018, 0.09, cd + 0.04, cw / 2 + 0.03, y0 + y, 0); }
  for (const s of [-1, 1]) { const d = slat(0.05, 1.9, 0.018, 0, y0 + ch / 2, s * (cd / 2 + 0.042)); d.rotation.z = 0.43; }
  slat(cw + 0.06, 0.018, cd + 0.06, 0, y0 + ch + 0.01, 0);
}
const PALLET_Y = 0.14;

// ---------- bench (step 0) ----------
const BENCH_X = -6;
const bench = new THREE.Group(); bench.position.set(BENCH_X, 0, 0); scene.add(bench);
mesh(rbox(1.4, 0.04, 0.7, 0.006), M.table, bench, 0, 0.74, 0);
for (const x of [-0.65, 0.65]) for (const z of [-0.3, 0.3]) mesh(box(0.045, 0.72, 0.045), M.alu, bench, x, 0.36, z);
const benchMon = new THREE.Group(); benchMon.position.set(-0.12, 0.76, -0.12); bench.add(benchMon);
mesh(rbox(0.56, 0.33, 0.02, 0.004), M.blackPlastic, benchMon, 0, 0.33, 0);
mesh(box(0.05, 0.2, 0.02), M.blackPlastic, benchMon, 0, 0.1, -0.03);
mesh(rbox(0.22, 0.012, 0.16, 0.004), M.blackPlastic, benchMon, 0, 0.006, -0.02);
const benchScr = mesh(new THREE.PlaneGeometry(0.545, 0.307), new THREE.MeshBasicMaterial({ color: 0xffffff }), benchMon, 0, 0.33, 0.0105);
const kb = mesh(rbox(0.38, 0.015, 0.12, 0.004), M.blackPlastic, bench, -0.12, 0.768, 0.18);
for (let i = 0; i < 5; i++) for (let j = 0; j < 14; j++) mesh(box(0.019, 0.004, 0.017), M.btn, kb, -0.165 + j * 0.0254, 0.009, -0.045 + i * 0.022);
const benchPC = makePC(); benchPC.position.set(0.42, 0.76 + 0.029, -0.02); benchPC.rotation.y = -0.5; bench.add(benchPC);
tube([[0.33, 0.79, -0.08], [0.2, 0.765, -0.15], [0.0, 0.765, -0.16], [-0.12, 0.78, -0.155]], 0.003, M.cable, bench);

// ---------- screen canvases ----------
const TS = canvasTex(640, 1126); screenMat.map = TS.t;
const BS = canvasTex(1280, 720); benchScr.material.map = BS.t;
let lastTS = '', lastBS = '';
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function drawWin(g, w, h) { // generic desktop wallpaper
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#0a2a6b'); gr.addColorStop(0.55, '#1660c9'); gr.addColorStop(1, '#5fb2ff');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.globalAlpha = .18; g.fillStyle = '#fff';
  for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(w * .62, h * .48, w * (.18 + i * .07), h * (.05 + i * .02), -0.6 + i * .25, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1;
}
function taskbar(g, w, h, hl) {
  const th = Math.round(h * 0.045);
  g.fillStyle = 'rgba(232,236,242,.94)'; g.fillRect(0, h - th, w, th);
  const cy = h - th / 2, s = th * 0.5;
  for (let i = 0; i < 4; i++) { g.fillStyle = ['#1a73e8', '#f2b705', '#0aa36b', '#5f6b7a'][i]; roundRect(g, w * .3 + i * th * 1.1, cy - s / 2, s, s, 4); g.fill(); }
  g.fillStyle = '#222'; g.font = `600 ${th * .32}px M`; g.textAlign = 'right';
  g.fillText('ESP', w - th * 3.2, cy + th * .1); g.fillText('10:24', w - th * .5, cy + th * .1); g.textAlign = 'left';
  // keyboard icon
  const kx = w - th * 2.6, ky = cy - th * .2;
  if (hl) { g.fillStyle = 'rgba(255,138,0,.35)'; roundRect(g, kx - th * .2, cy - th * .42, th * 1.1, th * .84, 6); g.fill(); }
  g.strokeStyle = '#222'; g.lineWidth = Math.max(2, th * .06); roundRect(g, kx, ky, th * .7, th * .4, 3); g.stroke();
  for (let i = 0; i < 4; i++) g.fillRect(kx + th * (.1 + i * .14), ky + th * .1, th * .06, th * .06);
  g.fillRect(kx + th * .15, ky + th * .26, th * .4, th * .05);
}
function drawTotemScreen(t) {
  const { g, c, t: tex } = TS; const w = c.width, h = c.height;
  let key = 'off';
  const p4 = P.p4[0], p6 = P.p6[0];
  if (t < P.mat[0] || t >= P.p6[0] + 12.3) key = t >= P.p6[0] + 12.3 && t < P.p7[0] ? 'fondoTask' : 'fondo';
  else if (t >= p4 + 3.2 && t < P.p5[0]) key = t < p4 + 4.6 ? 'boot' : t < p4 + 10.5 ? 'setup' + (t < p4 + 6 ? 0 : t < p4 + 7.5 ? 1 : t < p4 + 9 ? 2 : 3) : 'nosignal';
  else if (t >= p6 + 1.6) key = t < p6 + 3 ? 'boot2' : t < p6 + 4.2 ? 'desk' : t < p6 + 7.2 ? 'touch' : t < p6 + 10.4 ? 'explorer' : 'menu';
  screen.material = key === 'off' ? screenOff : screenMat;
  let dyn = key;
  if (key === 'touch' || key === 'explorer' || key === 'menu') dyn += Math.round(t * 30);
  if (dyn === lastTS) return; lastTS = dyn;
  g.textAlign = 'left';
  if (key === 'fondo' || key === 'fondoTask') {
    g.drawImage(fondoImg, 0, 0, w, h); if (key === 'fondoTask') taskbar(g, w, h, false);
  } else if (key === 'boot' || key === 'boot2') {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '700 44px M'; g.textAlign = 'center';
    g.fillText(key === 'boot' ? 'Bienvenido' : '', w / 2, h / 2);
    if (key === 'boot2') { for (let i = 0; i < 8; i++) { const a = t * 6 + i * .785; g.globalAlpha = (i + 1) / 8; g.beginPath(); g.arc(w / 2 + Math.cos(a) * 34, h * .62 + Math.sin(a) * 34, 6, 0, 7); g.fill(); } g.globalAlpha = 1; }
  } else if (key.startsWith('setup')) {
    const st = +key.slice(5);
    g.fillStyle = '#10161f'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.font = '800 42px M'; g.fillText('Configuración', 50, 150); g.font = '600 26px M'; g.fillStyle = '#9fb0c4'; g.fillText('inicial', 50, 190);
    const rows = [['Orientación', 'Vertical'], ['Red Wi-Fi', 'Omitir'], ['Inicio', 'Rápido']];
    rows.forEach(([a, b], i) => {
      const y = 290 + i * 150, sel = i === st, done = i < st || st === 3;
      g.fillStyle = sel ? '#1f6fe0' : '#1b2430'; roundRect(g, 40, y, w - 80, 118, 16); g.fill();
      g.fillStyle = '#fff'; g.font = '700 32px M'; g.fillText(a, 72, y + 52);
      g.font = '600 28px M'; g.fillStyle = sel ? '#dfeaff' : '#9fb0c4'; g.fillText(b, 72, y + 92);
      if (done) { g.fillStyle = '#2ec27e'; g.beginPath(); g.arc(w - 96, y + 59, 24, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.moveTo(w - 108, y + 59); g.lineTo(w - 99, y + 69); g.lineTo(w - 83, y + 49); g.stroke(); }
    });
  } else if (key === 'nosignal') {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#5b6b80'; g.font = '600 30px M'; g.textAlign = 'center'; g.fillText('HDMI 1 · Sin señal', w / 2, h / 2);
  } else {
    drawWin(g, w, h); taskbar(g, w, h, false);
    const lt = t - p6;
    if (key === 'touch') {
      const taps = [[0.3, 0.25, 4.3], [0.7, 0.4, 5.0], [0.4, 0.62, 5.7], [0.65, 0.8, 6.4]];
      for (const [x, y, t0] of taps) { const k = (lt - t0) / 0.7; if (k > 0 && k < 1) { g.strokeStyle = `rgba(255,255,255,${1 - k})`; g.lineWidth = 6; g.beginPath(); g.arc(x * w, y * h, 20 + k * 60, 0, 7); g.stroke(); g.fillStyle = `rgba(255,255,255,${.6 * (1 - k)})`; g.beginPath(); g.arc(x * w, y * h, 18, 0, 7); g.fill(); } }
    }
    if (key === 'explorer' || key === 'menu') {
      const x = 40, y = 230, ww = w - 80, hh = 520;
      g.fillStyle = '#fff'; roundRect(g, x, y, ww, hh, 12); g.fill();
      g.fillStyle = '#eef1f5'; roundRect(g, x, y, ww, 70, 12); g.fill(); g.fillRect(x, y + 50, ww, 20);
      g.fillStyle = '#111'; g.font = '700 26px M'; g.fillText('Pendrive (E:)', x + 24, y + 45);
      // thumbnail
      const tx = x + 40, ty = y + 110, tw = 150, tht = 267;
      g.drawImage(fondoImg, tx, ty, tw, tht);
      if (lt > 8.2) { g.strokeStyle = '#1f6fe0'; g.lineWidth = 5; g.strokeRect(tx - 4, ty - 4, tw + 8, tht + 8); }
      g.fillStyle = '#111'; g.font = '600 20px M'; g.fillText('background', tx, ty + tht + 34); g.fillText('tótem.jpg', tx, ty + tht + 58);
      g.fillStyle = '#9aa5b3'; g.fillRect(tx + 200, ty, 130, 90); g.fillRect(tx + 200, ty + 160, 130, 90);
      const tap = (t0, px, py) => { const k = (lt - t0) / 0.6; if (k > 0 && k < 1) { g.strokeStyle = `rgba(31,111,224,${1 - k})`; g.lineWidth = 6; g.beginPath(); g.arc(px, py, 16 + k * 46, 0, 7); g.stroke(); } };
      tap(8.0, tx + tw / 2, ty + tht / 2);
      if (key === 'menu') {
        const mx = tx + 70, my = ty + 160;
        g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 24; roundRect(g, mx, my, 390, 190, 10); g.fill(); g.shadowBlur = 0;
        ['Abrir', 'Establecer como fondo', 'Copiar'].forEach((s, i) => {
          if (i === 1) { g.fillStyle = lt > 11.3 ? '#cfe0ff' : '#eef3fb'; g.fillRect(mx + 8, my + 70, 374, 54); }
          g.fillStyle = '#111'; g.font = '600 25px M'; g.fillText(s, mx + 26, my + 50 + i * 58);
        });
        tap(11.3, mx + 190, my + 97);
      }
    }
  }
  tex.needsUpdate = true;
}
function drawBenchScreen(t) {
  const { g, c, t: tex } = BS; const w = c.width, h = c.height;
  const lt = t - P.p0[0];
  const n = clamp(Math.floor((lt - 2.2) / 1.6) + 1, 0, 5);
  const key = 'b' + n + (n >= 5 ? 'k' : '');
  if (key === lastBS) return; lastBS = key;
  drawWin(g, w, h); taskbar(g, w, h, n >= 5);
  g.fillStyle = 'rgba(255,255,255,.97)'; roundRect(g, 260, 90, 760, 520, 18); g.fill();
  g.fillStyle = '#111'; g.font = '800 40px M'; g.fillText('Revisión del sistema', 310, 165);
  const items = ['Sistema operativo correcto', 'Windows actualizado', 'Windows activado', 'Idioma: Español', 'Teclado táctil en la barra'];
  items.forEach((s, i) => {
    const y = 235 + i * 72, ok = i < n;
    g.fillStyle = ok ? '#2ec27e' : '#d5dbe3'; g.beginPath(); g.arc(330, y, 20, 0, 7); g.fill();
    if (ok) { g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); g.moveTo(320, y); g.lineTo(328, y + 8); g.lineTo(342, y - 8); g.stroke(); }
    g.fillStyle = ok ? '#111' : '#8a94a3'; g.font = '600 30px M'; g.fillText(s, 372, y + 11);
  });
  tex.needsUpdate = true;
}

// ---------- overlay ----------
const $ = id => document.getElementById(id);
const svg = $('svg'), labelsDiv = $('labels');
const STEPS = {
  mat: { badge: 'MATERIALES', title: 'Elementos necesarios', bul: [['Cuerpo tótem', 9.5], ['Monitor 43"', 10.5], ['Marco táctil 43"', 11.5], ['Vidrio templado', 12.5], ['Mini PC i5 o i7 (según orden de compra)', 13.5]] },
  p0: { badge: 'PASO 0', title: 'Revisar el mini PC', bul: [['Sistema operativo funcionando', 20.2], ['Windows actualizado y activado', 21.8], ['Idioma en español', 24.6], ['Ícono de teclado táctil en la barra de tareas', 26.2]] },
  p1: { badge: 'PASO 1', title: 'Marco táctil y vidrio', bul: [['Retirar los 5 tornillos de la tapa trasera superior', 30.5], ['Colocar el marco táctil dentro del cuerpo', 39], ['Instalar el vidrio templado presionando el marco', 42.5], ['Separadores planos abajo: sujetan marco y vidrio', 46], ['Separadores con tope a los lados: sujetan el monitor', 49.5]] },
  p2: { badge: 'PASO 2', title: 'Instalar el monitor', bul: [['Fijar la T de metal al monitor con 2 pernos', 55], ['Ubicar el monitor centrado dentro del tótem', 60], ['Sujetar con 4 placas en L atornilladas a los costados', 65.5]] },
  p3: { badge: 'PASO 3', title: 'Cables del monitor', bul: [['Conectar el HDMI en el puerto 1 del monitor', 74.5], ['Pasar HDMI y energía hacia abajo por los canales', 77.5], ['Conectar la energía a la extensión inferior', 82.5]] },
  p4: { badge: 'PASO 4', title: 'Configurar el monitor', bul: [['Conectar el tótem a la energía', 88.2], ['Encender el monitor con el control remoto', 90], ['Modo vertical', 92.5], ['Omitir conexión Wi-Fi', 94], ['Inicio rápido', 95.5]] },
  p5: { badge: 'PASO 5', title: 'Instalar el mini PC', bul: [['Retirar los 4 tornillos de la tapa trasera inferior', 100.5], ['Centrar el PC en los puntos de anclaje', 106], ['Botón y puertos USB mirando hacia arriba', 109.5], ['Fijar con la placa en L', 112], ['Fuente pegada a la base con cinta doble contacto y conectada a la extensión', 115], ['Conectar HDMI y USB del marco táctil', 120.5]] },
  p6: { badge: 'PASO 6', title: 'Prueba y fondo de pantalla', bul: [['Encender monitor y mini PC', 127.5], ['Comprobar el funcionamiento del táctil', 130], ['Insertar el pendrive y buscar «background tótem»', 133.5], ['Establecerla como fondo desde el tótem, usando el táctil', 137.5]] },
  p7: { badge: 'PASO 7', title: 'Embalaje', bul: [['Cortar un costado de la caja del monitor', 145], ['Superponerla desde arriba, cubriendo el vidrio', 147], ['Envolver bien con film', 152], ['Rotular con datos de envío y contacto del cliente', 155.5], ['Despacho por Starken: cajón de madera paletizado', 159.5]] },
};
const ORDER = ['mat', 'p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];
$('dots').innerHTML = ORDER.map(() => '<div></div>').join('');
let curStep = '';
function overlay(t) {
  // fade
  const cuts = [P.mat[0], P.p0[0], P.p1[0], P.p7[0], P.outro[0]];
  let f = 0; for (const c of cuts) f = Math.max(f, 1 - Math.abs(t - c) / 0.6);
  f = Math.max(f, 1 - R(t, 2.2, 3.4)); if (t >= P.outro[0]) f = Math.max(f, 0.92);
  $('fade').style.opacity = clamp(f);
  // title card
  const card = $('card');
  if (t < 3.4) { card.style.opacity = 1 - R(t, 2.4, 3.2); card.querySelector('h1').textContent = 'Armado Tótem Interactivo 43"'; card.querySelector('h2').textContent = 'GUÍA PASO A PASO'; }
  else if (t >= P.outro[0] + 0.4) { card.style.opacity = R(t, P.outro[0] + 0.5, P.outro[0] + 1.5); card.querySelector('h1').textContent = 'Tótem listo para despacho'; card.querySelector('h2').textContent = 'PLED · SOLUCIONES TECNOLÓGICAS'; }
  else card.style.opacity = 0;
  // caption (intro)
  const cap = $('cap'); cap.style.opacity = R(t, 4, 4.8) * (1 - R(t, 7.2, 7.8)); cap.firstChild.textContent = 'Tótem interactivo 43" — resultado final';
  // panel
  const step = ORDER.find(s => inR(t, P[s][0], P[s][1])) || '';
  const pnl = $('panel'); pnl.style.display = step ? 'block' : 'none';
  if (step) {
    const S = STEPS[step];
    if (step !== curStep) {
      curStep = step; $('badge').textContent = S.badge; $('title').textContent = S.title;
      $('bul').innerHTML = S.bul.map(b => `<li><span class="ck"></span>${b[0]}</li>`).join('');
    }
    const lis = $('bul').children;
    S.bul.forEach((b, i) => {
      const next = S.bul[i + 1] ? S.bul[i + 1][1] : P[step][1];
      const appear = R(t, b[1] - 1.4, b[1] - 0.8);
      lis[i].style.opacity = appear; lis[i].style.transform = `translateX(${(1 - appear) * 30}px)`;
      lis[i].className = t >= next - 0.6 || (i === S.bul.length - 1 && t > P[step][1] - 0.8) ? 'done' : t >= b[1] - 1.4 ? 'act' : '';
    });
    [...$('dots').children].forEach((d, i) => d.className = ORDER[i] === step ? 'on' : ORDER.indexOf(step) > i ? 'past' : '');
  }
}
// labels & markers in 3D -> screen
const W2 = new THREE.Vector3();
function toScreen(v) { W2.copy(v).project(camera); return [(W2.x + 1) / 2 * 1920, (1 - W2.y) / 2 * 1080, W2.z]; }
function wp(obj, x = 0, y = 0, z = 0) { return obj.localToWorld(V(x, y, z)); }
let LABELS = [], MARKS = [], ARROWS = [];
function drawAnnotations(t) {
  let s = '', html = '';
  for (const m of MARKS) {
    if (!inR(t, m.t0, m.t1)) continue;
    const a = R(t, m.t0, m.t0 + 0.3) * (1 - R(t, m.t1 - 0.3, m.t1));
    for (const p of m.pts()) {
      const [x, y] = toScreen(p); const pulse = 1 + 0.15 * Math.sin((t - m.t0) * 9);
      s += `<circle cx="${x}" cy="${y}" r="${(m.r || 22) * pulse}" fill="none" stroke="#ff8a00" stroke-width="5" opacity="${a}"/>`;
    }
  }
  for (const ar of ARROWS) {
    if (!inR(t, ar.t0, ar.t1)) continue;
    const a = R(t, ar.t0, ar.t0 + 0.3) * (1 - R(t, ar.t1 - 0.3, ar.t1));
    const [x0, y0] = toScreen(ar.from()), [x1, y1] = toScreen(ar.to());
    const ang = Math.atan2(y1 - y0, x1 - x0), hl = 22;
    s += `<g opacity="${a}" stroke="#ff8a00" stroke-width="7" stroke-linecap="round" fill="none"><line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/>` +
      `<polyline points="${x1 - hl * Math.cos(ang - .5)},${y1 - hl * Math.sin(ang - .5)} ${x1},${y1} ${x1 - hl * Math.cos(ang + .5)},${y1 - hl * Math.sin(ang + .5)}"/></g>`;
  }
  for (const l of LABELS) {
    if (!inR(t, l.t0, l.t1)) continue;
    const a = R(t, l.t0, l.t0 + 0.4) * (1 - R(t, l.t1 - 0.4, l.t1));
    const [x, y] = toScreen(l.at()); const lx = x + l.dx, ly = y + l.dy;
    s += `<g opacity="${a}"><line x1="${x}" y1="${y}" x2="${lx}" y2="${ly}" stroke="#ff8a00" stroke-width="3"/><circle cx="${x}" cy="${y}" r="7" fill="#ff8a00" stroke="#fff" stroke-width="3"/></g>`;
    const tx = l.dx < 0 ? 'translate(-100%,-50%)' : 'translate(0,-50%)';
    html += `<div class="lbl" style="left:${lx}px;top:${ly}px;opacity:${a};transform:${tx}">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</div>`;
  }
  svg.innerHTML = s; labelsDiv.innerHTML = html;
}

// ---------- states over time ----------
const p = P;
// camera keys: [t, pos, target, panelOffset(0/1)]
const CAM = [
  [0, [2.6, 1.55, 3.6], [0, 0.95, 0]], [8, [-1.9, 1.35, 3.7], [0, 0.95, 0]],
  [8.001, [0.9, 3.3, 4.9], [-0.55, 0.4, 0.45]], [18, [0.6, 3.1, 4.7], [-0.55, 0.4, 0.45]],
  [18.001, [BENCH_X + 0.9, 1.45, 1.7], [BENCH_X - 0.05, 0.95, -0.1]], [29, [BENCH_X + 0.7, 1.4, 1.45], [BENCH_X - 0.05, 0.95, -0.1]],
  [29.001, [1.5, 1.6, -3.5], [0, 1.0, 0]], [30.4, [1.0, 1.5, -2.7], [0, 1.12, 0]], [35, [1.0, 1.5, -2.7], [0, 1.12, 0]],
  [37.2, [0.9, 1.9, -2.0], [0, 1.05, 0]], [44.5, [0.8, 1.6, -1.9], [0, 1.0, 0]], [46.5, [0.7, 1.25, -1.5], [0, 0.78, 0]], [49, [0.9, 1.5, -1.7], [0, 1.05, 0]], [53, [0.9, 1.5, -1.7], [0, 1.05, 0]],
  [54.5, [-0.25, 1.15, -2.3], [-0.8, 0.6, -0.45]], [58.2, [-0.25, 1.15, -2.3], [-0.8, 0.6, -0.45]], [60.6, [1.0, 1.6, -2.9], [0, 1.05, 0]],
  [63.5, [0.95, 1.5, -2.0], [0, 1.12, 0]], [72.5, [0.85, 1.45, -1.9], [0, 1.12, 0]],
  [74.5, [0.65, 1.05, -1.25], [0.08, 0.75, 0]], [80, [0.75, 0.85, -1.55], [0.08, 0.48, 0]], [86.5, [0.7, 0.8, -1.5], [0.08, 0.45, 0]],
  [88.5, [1.3, 1.4, 3.7], [0, 1.0, 0.2]], [92, [0.6, 1.3, 2.7], [0, 1.12, 0]], [98.5, [0.6, 1.3, 2.7], [0, 1.12, 0]],
  [100.5, [1.0, 0.9, -2.3], [0, 0.4, 0]], [104, [0.65, 0.75, -1.4], [0, 0.36, 0]], [113, [0.55, 0.65, -1.1], [0, 0.3, 0]], [117, [0.65, 0.55, -1.1], [0, 0.22, 0]],
  [121, [0.55, 0.8, -1.1], [0.03, 0.4, 0]], [125.5, [0.55, 0.8, -1.1], [0.03, 0.4, 0]],
  [127.2, [0.7, 1.35, 3.0], [0, 1.1, 0]], [131, [0.35, 1.25, 2.25], [0, 1.12, 0]], [132.4, [0.35, 1.25, 2.25], [0, 1.12, 0]],
  [133.3, [0.5, 0.8, -1.0], [0, 0.42, 0]], [134.8, [0.5, 0.8, -1.0], [0, 0.42, 0]],
  [135.6, [0.35, 1.25, 2.25], [0, 1.12, 0]], [140, [0.8, 1.35, 3.0], [0, 1.05, 0]], [143, [1.1, 1.35, 3.2], [0, 1.0, 0]],
  [143.001, [2.0, 1.8, 3.9], [0, 1.0, 0]], [156, [1.7, 1.7, 3.9], [0, 1.0, 0]], [158.5, [2.8, 2.2, 4.8], [0, 1.1, 0]], [166, [2.4, 2.0, 5.0], [0, 1.1, 0]],
  [166.001, [2.4, 1.4, 3.6], [0, 0.95, 0]], [173, [-1.4, 1.3, 3.8], [0, 0.95, 0]],
];
function camAt(t) {
  const pos = path(t, CAM.map(k => [k[0], k[1]])), tg = path(t, CAM.map(k => [k[0], k[2]]));
  camera.position.copy(pos); camera.lookAt(tg);
  // shift subject left of panel
  const panel = inR(t, p.mat[0], p.outro[0]) ? 1 : 0;
  camera.filmOffset = panel * 5.6; camera.updateProjectionMatrix();
}

function setT(obj, v) { obj.position.copy(v); }
function state(t) {
  const installedAll = t < p.mat[0] || t >= p.p7[0];   // intro & packing: everything closed & installed
  // --- rear panels
  // upper: screws out 30.4-33.6 (staggered), panel off 33.6-35.4 ; back on at p7 cut
  UP.screws.forEach((s, i) => {
    const t0 = 30.6 + i * 0.6, k = installedAll || t < p.p1[0] ? 0 : R(t, t0, t0 + 0.55);
    s.position.copy(s.userData.base).add(V(0, 0, -0.025 * k)); s.rotation.z = k * 12; s.visible = k < 0.999;
  });
  {
    const k = installedAll || t < p.p1[0] ? 0 : R(t, 33.8, 35.6);
    const b = UP.g.userData.base;
    UP.g.position.set(b.x + 0.95 * R(t, 34.6, 35.6) * (k > 0 ? 1 : 0), b.y - 0.55 * R(t, 34.6, 35.6) * (k > 0 ? 1 : 0), b.z - 0.18 * R(t, 33.8, 34.6) * (k > 0 ? 1 : 0));
    UP.g.rotation.y = 0.5 * R(t, 34.6, 35.6) * (k > 0 ? 1 : 0); UP.g.visible = installedAll || t < 36.5;
  }
  // lower panel: ghost during p3, screws out p5 100.2-102.6, off 102.6-104.2
  LP.screws.forEach((s, i) => {
    const t0 = 100.2 + i * 0.6, k = installedAll || t < p.p5[0] ? 0 : R(t, t0, t0 + 0.55);
    s.position.copy(s.userData.base).add(V(0, 0, -0.025 * k)); s.rotation.z = k * 12; s.visible = k < 0.999;
  });
  {
    const off = !installedAll && t >= p.p5[0];
    const b = LP.g.userData.base;
    if (off) { const a = R(t, 102.7, 103.4), c = R(t, 103.4, 104.4); LP.g.position.set(b.x + 0.9 * c, b.y - 0.1 * c, b.z - 0.15 * a); LP.g.rotation.y = 0.5 * c; }
    else { LP.g.position.copy(b); LP.g.rotation.y = 0; }
    LP.g.visible = installedAll || t < 105.5;
    const gh = !installedAll && t >= p.p3[0] - 0.5 && t < p.p5[0];
    LP.g.children[0].material = gh ? ghost : M.white;
    ghost.opacity = 0.16;
  }
  // --- frame
  {
    const keys = [[37.4, [1.3, SC + 0.1, -0.75]], [38.6, [0, SC, -0.5]], [40.2, [0, SC, FRAME_REST.z]]];
    setT(frame, installedAll || t >= 40.2 ? FRAME_REST : path(t, keys)); frame.visible = installedAll || t >= 37.4;
  }
  // --- glass
  {
    const keys = [[41, [1.3, SC + 0.1, -0.75]], [42.2, [0, SC, -0.5]], [43.8, [0, SC, GLASS_REST.z]]];
    setT(glass, installedAll || t >= 43.8 ? GLASS_REST : path(t, keys)); glass.visible = installedAll || t >= 41;
  }
  flatSp.forEach((s, i) => { const t0 = 44.8 + i * 0.35; const r = s.userData.rest; setT(s, installedAll ? r : path(t, [[t0, [r.x, r.y + 0.12, r.z - 0.25]], [t0 + 0.9, [r.x, r.y, r.z]]])); s.visible = installedAll || t >= t0; });
  stopSp.forEach((s, i) => { const t0 = 47.8 + i * 0.35; const r = s.userData.rest; setT(s, installedAll ? r : path(t, [[t0, [r.x, r.y, r.z - 0.3]], [t0 + 0.9, [r.x, r.y, r.z]]])); s.visible = installedAll || t >= t0; });
  // --- monitor + T bracket (staging at left, back facing camera)
  {
    const STG = [-0.8, 0.47, -0.45];
    let pos, ry = 0;
    if (installedAll) pos = MON_REST;
    else if (t < p.p2[0]) { pos = V(...STG); }
    else pos = path(t, [[58.5, STG], [59.6, [-0.4, SC + 0.12, -0.55]], [60.6, [0, SC, -0.5]], [62.2, [MON_REST.x, MON_REST.y, MON_REST.z]]]);
    if (!installedAll && t >= p.p1[0] && t < 58.5) pos = V(...STG);
    setT(monitor, pos); monitor.rotation.y = ry;
    monitor.visible = installedAll || (t >= p.p2[0] - 0.5 && t < p.p7[0]) || t >= 62.2;
    if (!installedAll && t < p.p2[0] - 0.5) monitor.visible = false;
    setT(tbr, installedAll ? TBR_REST : path(t, [[54.6, [TBR_REST.x, TBR_REST.y + 0.25, TBR_REST.z - 0.25]], [56, [TBR_REST.x, TBR_REST.y, TBR_REST.z]]]));
    tbr.visible = installedAll || t >= 54.6;
    tBolts.forEach((b, i) => { const t0 = 56.2 + i * 0.8, k = installedAll ? 1 : R(t, t0, t0 + 0.7); const r = b.userData.rest; b.position.set(r.x, r.y, r.z - 0.03 * (1 - k)); b.rotation.z = (1 - k) * 10; b.visible = installedAll || t >= t0; });
  }
  lPlates.forEach((g, i) => {
    const t0 = 63.8 + i * 1.0, r = g.userData.rest, sx = g.userData.sx;
    setT(g, installedAll ? r : path(t, [[t0, [r.x - sx * 0.08, r.y, r.z - 0.3]], [t0 + 0.6, [r.x - sx * 0.04, r.y, r.z - 0.02]], [t0 + 0.8, [r.x, r.y, r.z]]]));
    g.visible = installedAll || t >= t0;
    const sc = g.userData.sc, k = installedAll ? 1 : R(t, t0 + 0.8, t0 + 1.0);
    sc.position.copy(sc.userData.base).add(V(-sx * 0.02 * (1 - k), 0, 0)); sc.rotation.x = (1 - k) * 8;
  });
  // --- cables
  grow(hdmiCable, installedAll ? 1 : t < p.p3[0] ? 0 : lerp(L(t, 75, 79) * HDMI_SPLIT, 1, L(t, 119, 120.6)));
  grow(monPower, installedAll ? 1 : t < p.p3[0] ? 0 : L(t, 78, 82.2));
  monPlug.visible = installedAll || t >= 82.2;
  grow(usbTouch, installedAll ? 1 : t < p.p5[0] ? 0 : L(t, 120.4, 122.4));
  // --- PC
  {
    const r = PC_REST;
    let pos;
    if (installedAll) pos = r;
    else pos = path(t, [[105, [0.9, 0.8, -0.7]], [106.6, [0, 0.42, -0.3]], [108.2, [r.x, r.y, r.z]]]);
    setT(pc, pos);
    const kr = installedAll ? 1 : R(t, 105.4, 107.4);
    pc.rotation.set(PC_ROT * kr, (1 - kr) * 0.8, 0);
    pc.visible = installedAll || (t >= 105 && t >= p.p5[0]);
    setT(pcL, installedAll ? PCL_REST : path(t, [[110.6, [PCL_REST.x, PCL_REST.y - 0.12, PCL_REST.z - 0.3]], [111.8, [PCL_REST.x, PCL_REST.y, PCL_REST.z]]]));
    pcL.visible = installedAll || t >= 110.6;
    pcLScrews.forEach((s, i) => { const k = installedAll ? 1 : R(t, 112 + i * 0.4, 112.4 + i * 0.4); s.position.z = -0.003 - 0.02 * (1 - k); s.rotation.z = (1 - k) * 8; });
    tape.visible = installedAll || t >= 113.2;
    tape.scale.x = installedAll ? 1 : R(t, 113.2, 113.9);
    setT(psu, installedAll ? PSU_REST : path(t, [[114, [PSU_REST.x, 0.35, -0.4]], [115.2, [PSU_REST.x, 0.12, -0.05]], [115.8, [PSU_REST.x, PSU_REST.y + 0.002, PSU_REST.z]]]));
    psu.visible = installedAll || t >= 114;
    grow(psuAC, installedAll ? 1 : L(t, 116, 117.4)); psuPlug.visible = installedAll || t >= 117.4;
    grow(psuDC, installedAll ? 1 : L(t, 117.6, 119));
    // pendrive in p6
    const pk = path(t, [[132.6, [PEN_REST.x, PEN_REST.y + 0.12, PEN_REST.z - 0.08]], [133.8, [PEN_REST.x, PEN_REST.y + 0.02, PEN_REST.z]], [134.3, [PEN_REST.x, PEN_REST.y, PEN_REST.z]]]);
    setT(pen, pk); pen.visible = inR(t, 132.6, p.p7[0]);
  }
  // --- remote
  {
    const on = inR(t, 88.6, 92.4);
    remote.visible = on;
    const rp = path(t, [[88.6, [0.55, 0.6, 1.6]], [89.6, [0.22, 0.92, 1.0]]]);
    remote.position.copy(rp); remote.rotation.set(-1.15, 0.25, 0);
    const beam = R(t, 89.9, 90.1) * (1 - R(t, 90.5, 90.9));
    irBeam.material.opacity = beam * 0.6; irBeam.visible = beam > 0.01;
    const a = remote.localToWorld(V(-0.012, 0.09, 0)), b = V(0.05, 0.75, 0.08);
    irBeam.position.copy(a).lerp(b, 0.5); irBeam.scale.set(1, a.distanceTo(b), 1);
    irBeam.quaternion.setFromUnitVectors(V(0, -1, 0), b.clone().sub(a).normalize());
  }
  // --- packing
  {
    const inP7 = t >= p.p7[0];
    pack.visible = inP7;
    mbox.position.set(0, inP7 ? lerp(BOX_REST_Y + 1.25, BOX_REST_Y, R(t, 145.6, 148.2)) : 10, 0);
    mbox.visible = inP7 && t >= 145.2;
    films.forEach((f, i) => { f.visible = inP7 && t >= 149 + i * 0.22; });
    shipLabel.position.set(0.05, BOX_REST_Y - 0.12, BOX.d / 2 + 0.006); shipLabel.visible = inP7 && t >= 154.2;
    shipLabel.scale.setScalar(t >= 154.2 ? lerp(0.6, 1, R(t, 154.2, 154.8)) : 1);
    // crate & lift
    const lift = R(t, 157, 158.5) * (inP7 ? 1 : 0);
    totem.position.y = lift * PALLET_Y; extCord.visible = lift < 0.01;
    crate.visible = inP7 && t >= 156.6;
    pallet.position.x = lerp(1.6, 0, R(t, 157.6, 158.8));
    crateParts.forEach((c, i) => { c.visible = t >= 159 + i * 0.12; });
    if (!inP7) totem.position.y = 0;
    // during p7 everything inside is installed; only the box side panel visible
    sun.shadow.camera.updateProjectionMatrix();
  }
  // floor-laid parts in materials scene
  if (inR(t, p.mat[0], p.mat[1])) {
    frame.visible = glass.visible = monitor.visible = pc.visible = true;
    frame.position.set(-1.35, 0.02, 0.55); frame.rotation.set(-Math.PI / 2, 0, 0.1);
    glass.position.set(-1.2, 0.04, 1.0); glass.rotation.set(-Math.PI / 2, 0, -0.08);
    monitor.position.set(-0.65, 0.056, 0.75); monitor.rotation.set(-Math.PI / 2, 0, 0.05);
    pc.position.set(0.55, 0.045, 0.45); pc.rotation.set(0, -0.6, 0);
    // these are children of body (y offset BASE) — compensate
    [frame, glass, monitor, pc].forEach(o => o.position.y -= BASE);
    [tbr, ...tBolts, ...lPlates, ...flatSp, ...stopSp, pcL, psu, tape, pen].forEach(o => o.visible = false);
    tbr.visible = false;
    for (const c of [hdmiCable, monPower, usbTouch, psuDC, psuAC]) c.visible = false;
    monPlug.visible = psuPlug.visible = false;
  } else {
    frame.rotation.set(0, 0, 0); glass.rotation.set(0, 0, 0); monitor.rotation.set(0, 0, 0);
  }
  totem.visible = !inR(t, p.p0[0], p.p0[1]);
  bench.visible = inR(t, p.p0[0], p.p0[1]);
  // shadow camera follows
  const focus = bench.visible ? V(BENCH_X, 0, 0) : V(-0.3, 0, 0.3);
  sun.position.set(focus.x + 2.2, 4.5, focus.z + 3.2); sun.target.position.copy(focus); sun.target.updateMatrixWorld();
}

function annotations() {
  const S = P;
  LABELS = [
    { t0: 9.2, t1: 17.6, at: () => wp(body, -0.3, 1.3, 0.07), dx: -150, dy: -30, text: 'Cuerpo tótem' },
    { t0: 10.2, t1: 17.6, at: () => wp(monitor, 0.15, 0.3, 0.012), dx: -40, dy: -170, text: 'Monitor 43"' },
    { t0: 11.2, t1: 17.6, at: () => wp(frame, -0.29, 0.2, 0), dx: -40, dy: -130, text: 'Marco táctil 43"' },
    { t0: 12.2, t1: 17.6, at: () => wp(glass, 0.25, -0.3, 0), dx: 60, dy: 120, text: 'Vidrio templado' },
    { t0: 13.2, t1: 17.6, at: () => wp(pc, 0, 0.03, 0), dx: -40, dy: 150, text: 'Mini PC', sub: 'i5 o i7 según orden de compra' },
    { t0: 19.5, t1: 28.6, at: () => wp(benchPC, 0, 0.03, 0), dx: 80, dy: 110, text: 'Mini PC' },
    { t0: 29.6, t1: 33, at: () => wp(UP.g, 0, 0.1, -0.005), dx: 160, dy: -230, text: 'Tapa trasera superior', sub: '5 tornillos' },
    { t0: 38.4, t1: 41.6, at: () => wp(frame, -0.29, 0.25, 0), dx: -130, dy: -60, text: 'Marco táctil' },
    { t0: 42.2, t1: 45, at: () => wp(glass, 0.2, 0.3, 0), dx: 150, dy: -80, text: 'Vidrio templado', sub: 'presiona el marco' },
    { t0: 45.8, t1: 49, at: () => wp(flatSp[2], 0, 0, 0), dx: 170, dy: 90, text: 'Separadores planos', sub: 'abajo · sujetan marco y vidrio' },
    { t0: 49.2, t1: 52.8, at: () => wp(stopSp[3], 0, 0, -0.013), dx: 150, dy: -90, text: 'Separadores con tope', sub: 'a los lados · sujetan el monitor' },
    { t0: 55.2, t1: 58.4, at: () => wp(tbr, 0.2, 0.17, 0), dx: 140, dy: -110, text: 'T de metal', sub: 'centra y sujeta el monitor' },
    { t0: 65, t1: 72.5, at: () => wp(lPlates[1], 0.02, 0, -0.021), dx: 150, dy: -60, text: 'Placas en L', sub: '4 · atornilladas a los costados' },
    { t0: 74, t1: 78, at: () => wp(monitor, 0.075, -0.40, -0.036), dx: 160, dy: -80, text: 'HDMI 1' },
    { t0: 77.5, t1: 81, at: () => wp(body, 0.22, SHELF, -0.04), dx: 190, dy: 20, text: 'Canal de cables' },
    { t0: 82, t1: 86.6, at: () => wp(ext, 0.03, 0.04, 0), dx: 170, dy: 60, text: 'Extensión' },
    { t0: 105.6, t1: 110, at: () => wp(body, 0.075, 0.43, -0.002), dx: 180, dy: -90, text: 'Puntos de anclaje' },
    { t0: 111.6, t1: 114, at: () => wp(pcL, 0, 0, -0.04), dx: -170, dy: 70, text: 'Placa en L', sub: 'tope del mini PC' },
    { t0: 114.2, t1: 118.6, at: () => wp(psu, 0, 0.03, 0), dx: -180, dy: -60, text: 'Fuente de poder', sub: 'cinta doble contacto' },
    { t0: 119, t1: 121, at: () => wp(pc, 0.03, 0, -0.08), dx: 180, dy: 60, text: 'HDMI al PC' },
    { t0: 121.4, t1: 125.4, at: () => wp(body, -0.035, 0.448, -0.04), dx: 180, dy: -90, text: 'USB marco táctil' },
    { t0: 133.6, t1: 134.9, at: () => wp(pen, 0, 0.05, 0), dx: 160, dy: -80, text: 'Pendrive' },
    { t0: 145.4, t1: 148.6, at: () => wp(mbox, 0.39, -0.3, 0), dx: 120, dy: 60, text: 'Caja del monitor', sub: 'con un costado cortado' },
    { t0: 154.6, t1: 157, at: () => wp(shipLabel, 0.12, 0, 0), dx: 140, dy: 40, text: 'Rótulo', sub: 'envío y contacto del cliente' },
    { t0: 159.4, t1: 165.6, at: () => wp(crate, 0.48, 1.0, 0.25), dx: 120, dy: -40, text: 'Despacho Starken', sub: 'cajón de madera paletizado' },
  ];
  MARKS = [
    { t0: 29.8, t1: 33.8, pts: () => UP.screws.map(s => wp(s, 0, 0, -0.002)), r: 20 },
    { t0: 56, t1: 58.2, pts: () => tBolts.map(b => wp(b)), r: 22 },
    { t0: 73.8, t1: 76.5, pts: () => [wp(monitor, 0.075, -0.40, -0.036)], r: 24 },
    { t0: 77.5, t1: 80, pts: () => [wp(body, 0.22, SHELF, -0.03), wp(body, -0.22, SHELF, -0.03)], r: 28 },
    { t0: 99.6, t1: 102.6, pts: () => LP.screws.map(s => wp(s, 0, 0, -0.002)), r: 20 },
    { t0: 104.4, t1: 106.2, pts: () => anchors.map(a => wp(a)), r: 16 },
    { t0: 108.6, t1: 111, pts: () => [wp(pc, -0.07, 0.002, 0.076), wp(pc, -0.02, 0, 0.076), wp(pc, 0.027, 0, 0.076)], r: 18 },
    { t0: 119.2, t1: 122.8, pts: () => [wp(pc, 0.03, 0, -0.076), wp(body, -0.035, 0.448, -0.04)], r: 20 },
  ];
  ARROWS = [
    { t0: 108.6, t1: 111, from: () => wp(pc, 0.12, 0, -0.02), to: () => wp(pc, 0.12, 0, 0.16) },
    { t0: 59.4, t1: 62.2, from: () => wp(body, -0.36, SC + 0.17, -0.03), to: () => wp(body, -0.31, SC + 0.17, -0.03) },
    { t0: 59.4, t1: 62.2, from: () => wp(body, 0.36, SC + 0.17, -0.03), to: () => wp(body, 0.31, SC + 0.17, -0.03) },
  ];
}
annotations();

window.hideGlass = () => { M.glass.visible = false; };
window.dbg = () => ({mon: monitor.visible, mpos: monitor.position.toArray(), frame: frame.visible, fpos: frame.position.toArray(), body: body.visible, totem: totem.visible});
window.renderAt = function (t) {
  state(t);
  camAt(t);
  drawTotemScreen(t);
  if (bench.visible) drawBenchScreen(t);
  scene.updateMatrixWorld(true);
  renderer.render(scene, camera);
  overlay(t);
  drawAnnotations(t);
  return true;
};
window.DURATION = DURATION;
await document.fonts.load('800 40px M'); await document.fonts.load('600 40px M'); await document.fonts.load('700 40px M');
await Promise.all([fondoImg.decode(), logoImg.decode()]);
const q = new URLSearchParams(location.search);
window.renderAt(+(q.get('t') || 0));
window.READY = true;
