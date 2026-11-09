// Tło całej strony: realistyczna płyta główna (granatowa maska) powielona bez końca,
// widziana z oddali, powoli obracana, nieruchoma przy przewijaniu.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('bg3d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 720;
const PAL = window.PALETA || {};                     // podgląd palet ?p=N (index.html)
const BG = PAL.bg || '#060606';

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.25 : 1.5));
renderer.setClearColor(BG);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = !small;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(BG, 260, 620);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.85;

const camera = new THREE.PerspectiveCamera(28, 1, 1, 1100);
scene.add(new THREE.HemisphereLight(0xe8e8e8, 0x140606, 0.6));
const sun = new THREE.DirectionalLight(0xfff4e6, 2.6);
sun.position.set(45, 90, 35);
sun.castShadow = !small;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -160, right: 160, top: 160, bottom: -160, near: 5, far: 300 });
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.02;
scene.add(sun);
const blueLight = new THREE.PointLight(PAL.p1 || 0xff3b30, 260, 70, 1.5);
blueLight.position.set(0, 10, 0);
scene.add(blueLight);

const world = new THREE.Group(), board = new THREE.Group();
scene.add(world); world.add(board);

// ---------- generator układu płyty ----------
const S = 128;
const TEX = small ? 2048 : 4096;
const K = TEX / S;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

const traces = [], vias = [], pads = [], labels = [], parts = [], pours = [], keepout = [], chips = [];

function fanout(cx, cz, size, legs, pitch, reachMin, reachMax, name) {
  chips.push({ x: cx, z: cz, size, legs, pitch, name });
  keepout.push([cx, cz, size / 2 + 3]);
  for (let side = 0; side < 4; side++) {
    const r = side * Math.PI / 2, c = Math.cos(r), s = Math.sin(r);
    const R = p => [cx + p[0] * c - p[1] * s, cz + p[0] * s + p[1] * c];
    const spread = rnd(2.2, 3.2), h0 = rnd(1, 1.8), reach = rnd(reachMin, reachMax);
    for (let i = 0; i < legs; i++) {
      const x = (i - (legs - 1) / 2) * pitch, start = size / 2 + 0.9;
      const xf = x * spread, d = Math.abs(xf - x);
      const y1 = start + h0, y2 = y1 + d;
      const end = Math.max(y2 + 1.5, start + reach * (0.55 + 0.45 * Math.cos(x * 0.6)) + rnd(-1, 1));
      // część ścieżek skręca na końcu jeszcze raz o 45°, jak przy prowadzeniu do złącza
      const pts = [[x, start - 0.6], [x, y1], [xf, y2], [xf, end]];
      if (Math.random() < 0.35) { const t = Math.sign(xf || 1) * rnd(2, 5); pts.push([xf + t, end + Math.abs(t)]); }
      const P = pts.map(R);
      traces.push({ pts: P, w: 0.17 });
      const e = P[P.length - 1];
      if (Math.random() < 0.8) vias.push([e[0], e[1], 0.32]); else pads.push([e[0], e[1], 0.55, 0.55]);
      pads.push([...R([x, start - 0.25]), side % 2 ? 0.7 : 0.22, side % 2 ? 0.22 : 0.7]);
    }
  }
  labels.push([cx, cz + size / 2 + 2.6, name, 0.9]);
}
// główny procesor i układy pomocnicze
fanout(0, 0, 10, 20, 0.42, 12, 22, 'U1');
const sat = [];
for (let k = 0; k < (small ? 5 : 8); k++) {
  for (let t = 0; t < 40; t++) {
    const a = rnd(0, Math.PI * 2), r = rnd(24, S / 2 - 12), x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (sat.every(p => Math.hypot(p[0] - x, p[1] - z) > 22)) { sat.push([x, z]); break; }
  }
}
sat.forEach(([x, z], i) => { const sz = pick([4.5, 5.5, 6.5]); fanout(x, z, sz, Math.round(sz * 1.6), 0.5, 5, 10, 'U' + (i + 2)); });
// różne obudowy układów pomocniczych: QFP z nóżkami, BGA bez nóżek, układ z radiatorem
chips.forEach((c, i) => { c.kind = i ? pick(['qfp', 'qfp', 'bga', 'hs']) : 'cpu'; });

// magistrale pamięci: szerokie pęki równoległych ścieżek z załamaniami 45°
function bus(x0, z0, dir, n, len1, len2, turn) {
  const [dx, dz] = dir, gap = 0.55, nx = -dz, nz = dx;
  for (let i = 0; i < n; i++) {
    const ox = x0 + nx * i * gap, oz = z0 + nz * i * gap;
    const l1 = len1 + i * gap * 0.414 * turn;
    const b = [ox + dx * l1, oz + dz * l1];
    const t = turn > 0 ? [dx + nx, dz + nz] : [dx - nx, dz - nz];
    const c = [b[0] + t[0] * 3, b[1] + t[1] * 3];
    const d = [c[0] + dx * len2, c[1] + dz * len2];
    traces.push({ pts: [[ox, oz], b, c, d], w: 0.17 });
    vias.push([ox, oz, 0.28]); vias.push([d[0], d[1], 0.28]);
  }
}
for (let k = 0; k < (small ? 14 : 26); k++) {
  const a = rnd(0, Math.PI * 2), r = rnd(16, S / 2 - 6);
  bus(Math.cos(a) * r, Math.sin(a) * r, pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), Math.floor(rnd(5, 14)), rnd(2, 8), rnd(4, 14), pick([1, -1]));
}
// szerokie ścieżki zasilania
for (let k = 0; k < 10; k++) {
  const x = rnd(-S / 2 + 6, S / 2 - 6), z = rnd(-S / 2 + 6, S / 2 - 6), l = rnd(10, 25), d = pick([[1, 0], [0, 1]]);
  traces.push({ pts: [[x, z], [x + d[0] * l, z + d[1] * l], [x + d[0] * l + 4, z + d[1] * l + 4]], w: rnd(0.6, 1.1) });
}
// pola miedzi z przelotkami
for (let k = 0; k < 12; k++) {
  const x = rnd(-S / 2 + 4, S / 2 - 16), z = rnd(-S / 2 + 4, S / 2 - 14), w = rnd(8, 16), h = rnd(6, 12);
  if (Math.hypot(x + w / 2, z + h / 2) < 18) continue;
  pours.push([x, z, w, h]);
  for (let vx = x + 1; vx < x + w - 0.6; vx += 1.8) for (let vz = z + 1; vz < z + h - 0.6; vz += 1.8) vias.push([vx, vz, 0.22]);
}

// złącza na brzegach: listwy goldpin i gniazda
const headers = [];
for (let k = 0; k < 6; k++) {
  const side = k % 4, n = Math.floor(rnd(8, 20)), rows = pick([1, 2]);
  const off = rnd(-S / 2 + 20, S / 2 - 20), e = S / 2 - 4;
  const [x, z, rot] = side === 0 ? [off, -e, 0] : side === 1 ? [e, off, Math.PI / 2] : side === 2 ? [off, e, 0] : [-e, off, Math.PI / 2];
  headers.push({ x, z, n, rows, rot });
  keepout.push([x, z, n * 0.6 + 2]);
  labels.push([x, z + (rot ? 0 : -2.4), 'J' + (k + 1), 0.8]);
}
// gniazdo PCIe przy brzegu i złącza zewnętrzne (USB, RJ45) na krawędzi
const pcie = { x: rnd(-20, 20), z: S / 2 - 16 };
for (let x = -21; x <= 21; x += 6) keepout.push([pcie.x + x, pcie.z, 3]);
labels.push([pcie.x - 25, pcie.z, 'PCIE1', 0.9]);
const ports = [];
for (let k = 0, x = -S / 2 + 12; k < 5; k++) {
  const t = k === 2 ? 'rj' : 'usb', w = t === 'rj' ? 6 : 4.4, cx = x + w / 2; x += w + 2.5;
  if (headers.some(h => !h.rot && h.z < 0 && Math.abs(h.x - cx) < h.n * 0.64 + w / 2 + 1)) continue;
  ports.push({ t, x: cx, w }); keepout.push([cx, -S / 2 + 4, 4]);
}
// serpentyny wyrównujące długość ścieżek
for (let k = 0; k < 8; k++) {
  const x0 = rnd(-S / 2 + 10, S / 2 - 30), z0 = rnd(-S / 2 + 10, S / 2 - 10), pts = [[x0, z0]];
  for (let i = 0; i < 9; i++) { const x = x0 + 1 + i * 1.6, d = i % 2 ? -1.6 : 1.6; pts.push([x, z0], [x, z0 + d], [x + 0.8, z0 + d], [x + 0.8, z0]); }
  traces.push({ pts, w: 0.15 });
}
// gniazda pamięci RAM (długie sloty)
const slots = [];
{ const x0 = rnd(20, 34) * pick([1, -1]); for (let i = 0; i < 2; i++) { slots.push({ x: x0 + i * 4, z: 0 }); keepout.push([x0 + i * 4, -18, 4], [x0 + i * 4, 0, 4], [x0 + i * 4, 18, 4]); } }

// drobne elementy
const free = (x, z, m) => keepout.every(([kx, kz, r]) => Math.hypot(kx - x, kz - z) > r + m) && parts.every(p => Math.hypot(p.x - x, p.z - z) > 2.1);
const cnt = {}; let nCell = 0, nBtn = 0;
for (let k = 0, placed = 0; k < 2000 && placed < (small ? 160 : 320); k++) {
  const x = rnd(-S / 2 + 3, S / 2 - 3), z = rnd(-S / 2 + 3, S / 2 - 3);
  const type = pick(['r', 'r', 'r', 'c', 'c', 'c', 'c', 'c', 'el', 'el', 'led', 'ind', 'xtal', 'sot', 'sot', 'sot', 'tan', 'tan', 'tp', 'tp', 'btn', 'cell']);
  if (!free(x, z, { el: 1.6, ind: 1.6, cell: 2.8, btn: 1.8 }[type] || 0.6)) continue;
  if ((type === 'cell' && nCell++ > 1) || (type === 'btn' && nBtn++ > 3)) continue;
  const rot = ['sot', 'btn', 'cell', 'tp'].includes(type) ? 0 : pick([0, Math.PI / 2]);
  parts.push({ type, x, z, rot }); placed++;
  const pre = { r: 'R', c: 'C', el: 'C', tan: 'C', led: 'D', ind: 'L', xtal: 'Y', sot: 'Q', tp: 'TP', btn: 'SW', cell: 'BT' }[type];
  labels.push([x, z + ({ el: 2.1, ind: 2, cell: 3.2, btn: 2.3 }[type] || 1.15), pre + (cnt[pre] = (cnt[pre] || 0) + 1), 0.55]);
  // krótkie odejście ścieżki z załamaniem 45° do przelotki
  if (type !== 'tp' && type !== 'cell' && Math.random() < 0.45) {
    const d = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), l = rnd(1.5, 4), sg = pick([1, -1]);
    const a = [x + d[0] * 1.2, z + d[1] * 1.2], b = [a[0] + d[0] * l, a[1] + d[1] * l], e = [b[0] + d[0] * 2 + (d[1] ? sg * 2 : 0), b[1] + d[1] * 2 + (d[0] ? sg * 2 : 0)];
    traces.push({ pts: [a, b, e], w: 0.14 }); vias.push([e[0], e[1], 0.25]);
  }
}

// rozsiane przelotki (zszywanie mas)
for (let k = 0; k < (small ? 250 : 500); k++) { const x = rnd(-S / 2 + 3, S / 2 - 3), z = rnd(-S / 2 + 3, S / 2 - 3); if (free(x, z, 0.3)) vias.push([x, z, 0.2]); }

// ---------- tekstury ----------
function mk() { const c = document.createElement('canvas'); c.width = c.height = TEX; return [c, c.getContext('2d')]; }
const [cCol, gCol] = mk(), [cRgh, gRgh] = mk(), [cBmp, gBmp] = mk();
const P = ([x, z]) => [(x / S + 0.5) * TEX, (z / S + 0.5) * TEX];
const MASK = PAL.mask || '#2b0807', UNDER = PAL.tr || '#630705', UNDER_HI = PAL.hi || '#860703', POUR = PAL.pour || '#400706', GOLD = PAL.pad || '#b5a584';

gCol.fillStyle = MASK; gCol.fillRect(0, 0, TEX, TEX);
{ const nc = document.createElement('canvas'); nc.width = nc.height = 256; const ng = nc.getContext('2d'), im = ng.createImageData(256, 256);
  for (let i = 0; i < im.data.length; i += 4) { const v = Math.random(); im.data[i] = 10 * v; im.data[i + 1] = 30 * v; im.data[i + 2] = 90 * v; im.data[i + 3] = 34; }
  ng.putImageData(im, 0, 0); gCol.fillStyle = gCol.createPattern(nc, 'repeat'); gCol.fillRect(0, 0, TEX, TEX); }
gRgh.fillStyle = 'rgb(0,120,0)'; gRgh.fillRect(0, 0, TEX, TEX);
gBmp.fillStyle = '#000'; gBmp.fillRect(0, 0, TEX, TEX);

const path = (g, pts) => { g.beginPath(); pts.forEach((p, i) => { const [x, y] = P(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); };
function strokeAll(g, color, extra = 0) {
  g.strokeStyle = color; g.lineCap = 'round'; g.lineJoin = 'round';
  traces.forEach(t => { g.lineWidth = Math.max(1, (t.w + extra) * K); path(g, t.pts); g.stroke(); });
}
const rr = (g, x, z, w, h, r) => { const [px, py] = P([x, z]); g.beginPath(); g.roundRect(px, py, w * K, h * K, r * K); g.fill(); };
gCol.fillStyle = POUR; pours.forEach(([x, z, w, h]) => rr(gCol, x, z, w, h, 1));
gBmp.fillStyle = '#4a4a4a'; pours.forEach(([x, z, w, h]) => rr(gBmp, x, z, w, h, 1));
strokeAll(gCol, UNDER, 0.05); strokeAll(gCol, UNDER_HI, -0.07);
strokeAll(gBmp, '#fff'); strokeAll(gRgh, 'rgb(0,95,0)');

function padsFor(p) {
  if (p.type === 'xtal') return [[p.x - 1.2, p.z, 0.8, 0.9], [p.x + 1.2, p.z, 0.8, 0.9]];
  if (p.type === 'tp') return [[p.x, p.z, 0.7, 0.7]];
  if (p.type === 'sot') return [[p.x - 0.5, p.z + 0.75, 0.35, 0.5], [p.x + 0.5, p.z + 0.75, 0.35, 0.5], [p.x, p.z - 0.75, 0.35, 0.5]];
  if (p.type === 'btn') return [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => [p.x + a * 1.3, p.z + b * 1.3, 0.6, 0.6]);
  if (p.type === 'cell') return [[p.x - 2.6, p.z, 0.9, 1.4], [p.x + 2.6, p.z, 0.9, 1.4]];
  const L = { r: [0.9, 0.5], c: [0.8, 0.55], el: [1.3, 0.6], led: [0.8, 0.5], ind: [1.3, 1.0], tan: [1.0, 0.7] }[p.type];
  const [d, s] = L, h = p.rot ? [0, d] : [d, 0];
  return [[p.x - h[0], p.z - h[1], s * 1.1, s * 1.1], [p.x + h[0], p.z + h[1], s * 1.1, s * 1.1]];
}
const allPads = pads.concat(parts.flatMap(padsFor));
headers.forEach(h => { for (let i = 0; i < h.n; i++) for (let r = 0; r < h.rows; r++) { const o = (i - (h.n - 1) / 2) * 1.27, q = (r - (h.rows - 1) / 2) * 1.27; allPads.push(h.rot ? [h.x + q, h.z + o, 0.9, 0.9] : [h.x + o, h.z + q, 0.9, 0.9]); } });
const box = (g, list) => list.forEach(([x, z, w, h]) => { const [px, py] = P([x, z]); g.fillRect(px - w / 2 * K, py - h / 2 * K, w * K, h * K); });
gCol.fillStyle = GOLD; box(gCol, allPads); gRgh.fillStyle = 'rgb(0,50,255)'; box(gRgh, allPads); gBmp.fillStyle = '#fff'; box(gBmp, allPads);
vias.forEach(([x, z, r]) => {
  const [px, py] = P([x, z]);
  [[gCol, GOLD], [gRgh, 'rgb(0,55,255)'], [gBmp, '#fff']].forEach(([g, col]) => { g.fillStyle = col; g.beginPath(); g.arc(px, py, r * K, 0, 7); g.fill(); });
  gCol.fillStyle = '#04060a'; gCol.beginPath(); gCol.arc(px, py, r * 0.45 * K, 0, 7); gCol.fill();
});
// sitodruk
gCol.fillStyle = 'rgba(236,240,246,.85)'; gCol.strokeStyle = 'rgba(236,240,246,.75)'; gCol.lineWidth = Math.max(1, 0.07 * K);
gCol.textAlign = 'center'; gCol.textBaseline = 'middle';
labels.forEach(([x, z, t, sz]) => { const [px, py] = P([x, z]); gCol.font = `600 ${sz * K}px ui-monospace,Consolas,monospace`; gCol.fillText(t, px, py); });
chips.forEach(c => { const [px, py] = P([c.x, c.z]), h = (c.size / 2 + 1.6) * K; gCol.strokeRect(px - h, py - h, 2 * h, 2 * h); gCol.beginPath(); gCol.arc(px - h + 0.8 * K, py - h + 0.8 * K, 0.3 * K, 0, 7); gCol.fill(); });
parts.forEach(p => { if (p.type === 'el') { const [px, py] = P([p.x, p.z]); gCol.beginPath(); gCol.arc(px, py, 1.1 * K, 0, 7); gCol.stroke(); } });
parts.forEach(p => {
  const o = { r: [1.7, 0.9], c: [1.5, 0.9], sot: [1.6, 2], tan: [2.4, 1.2], ind: [3, 3], btn: [3.4, 3.4], cell: [6.4, 5] }[p.type]; if (!o) return;
  const [w, h] = p.rot ? [o[1], o[0]] : o, [px, py] = P([p.x, p.z]); gCol.strokeRect(px - w / 2 * K, py - h / 2 * K, w * K, h * K);
});
{ const [px, py] = P([pcie.x, pcie.z]); gCol.strokeRect(px - 22.6 * K, py - 1.8 * K, 45.2 * K, 3.6 * K); }
slots.forEach(s => { const [px, py] = P([s.x, s.z]); gCol.strokeRect(px - 1.6 * K, py - 34 * K, 3.2 * K, 68 * K); });
gCol.textAlign = 'left'; gCol.font = `700 ${2.2 * K}px system-ui,sans-serif`;
{ const [px, py] = P([-S / 2 + 8, S / 2 - 7]); gCol.fillText('3EN4ALL  MAINBOARD  REV 2.6', px, py); }
gCol.font = `500 ${1.1 * K}px ui-monospace,Consolas,monospace`;
{ const [px, py] = P([-S / 2 + 8, S / 2 - 4.5]); gCol.fillText('MADE FOR LOCAL AI · 2026 · ROHS', px, py); }
[[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1]].forEach(([a, b]) => {
  const [px, py] = P([a * (S / 2 - 3), b * (S / 2 - 3)]);
  gCol.fillStyle = GOLD; gCol.beginPath(); gCol.arc(px, py, 1.6 * K, 0, 7); gCol.fill();
  gCol.fillStyle = '#04060a'; gCol.beginPath(); gCol.arc(px, py, 1.0 * K, 0, 7); gCol.fill();
  gRgh.fillStyle = 'rgb(0,55,255)'; gRgh.beginPath(); gRgh.arc(px, py, 1.6 * K, 0, 7); gRgh.fill();
});

const aniso = renderer.capabilities.getMaxAnisotropy();
const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.anisotropy = aniso; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
const rgh = tex(cRgh);
const edge = new THREE.MeshStandardMaterial({ color: new THREE.Color(MASK).multiplyScalar(0.8), roughness: 0.7 });
const topMat = new THREE.MeshPhysicalMaterial({
  map: tex(cCol, true), roughnessMap: rgh, metalnessMap: rgh, roughness: 1, metalness: 1,
  bumpMap: tex(cBmp), bumpScale: 1.2, clearcoat: 0.55, clearcoatRoughness: 0.35,
});
const pcb = new THREE.Mesh(new THREE.BoxGeometry(S, 1.2, S), [edge, edge, topMat, edge, edge, edge]);
pcb.position.y = -0.6; pcb.receiveShadow = true;
board.add(pcb);

// ---------- elementy 3D ----------
const M = {
  black: new THREE.MeshStandardMaterial({ color: 0x15171b, roughness: 0.55 }),
  plastic: new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.7 }),
  slot: new THREE.MeshStandardMaterial({ color: 0x1b2638, roughness: 0.6 }),
  tin: new THREE.MeshStandardMaterial({ color: 0xd3d7dc, roughness: 0.25, metalness: 1 }),
  goldPin: new THREE.MeshStandardMaterial({ color: 0xe0b860, roughness: 0.25, metalness: 1 }),
  cer: new THREE.MeshStandardMaterial({ color: 0x9c835f, roughness: 0.6 }),
  alu: new THREE.MeshStandardMaterial({ color: 0xbfc4ca, roughness: 0.3, metalness: 1 }),
  sleeve: new THREE.MeshStandardMaterial({ color: 0x14161b, roughness: 0.45 }),
  ind: new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.8 }),
  xtal: new THREE.MeshStandardMaterial({ color: 0xc9cdd2, roughness: 0.2, metalness: 1 }),
  led: new THREE.MeshStandardMaterial({ color: 0xffb0a8, emissive: 0xff2a1a, emissiveIntensity: 2.4, roughness: 0.2 }),
  tan: new THREE.MeshStandardMaterial({ color: 0xc8901e, roughness: 0.5 }),
  hs: new THREE.MeshStandardMaterial({ color: 0x2b3240, roughness: 0.45, metalness: 0.7 }),
  sub: new THREE.MeshStandardMaterial({ color: 0x1f3326, roughness: 0.6 }),
  die: new THREE.MeshStandardMaterial({ color: 0x6a717b, roughness: 0.25, metalness: 0.85 }),
};
function inst(geo, mat, list) {
  if (!list.length) return;
  const m = new THREE.InstancedMesh(geo, mat, list.length), o = new THREE.Object3D();
  list.forEach((t, i) => { o.position.set(t[0], t[1], t[2]); o.rotation.set(0, t[3] || 0, 0); o.scale.set(t[4] || 1, t[5] || 1, t[6] || 1); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
  m.castShadow = m.receiveShadow = true;
  board.add(m);
}
const L = { rB: [], rE: [], cB: [], cE: [], elS: [], elT: [], led: [], ind: [], xt: [], hdr: [], pin: [], chipB: [], chipL: [], slot: [], slotC: [], sotB: [], sotL: [], tan: [], btnB: [], btnC: [], cell: [], cellH: [], hsB: [], hsF: [], bgaS: [], bgaD: [], pcie: [], usb: [], rj: [] };
parts.forEach(p => {
  const ax = p.rot ? [0, 1] : [1, 0];
  if (p.type === 'r') { L.rB.push([p.x, 0.22, p.z, p.rot]); [-1, 1].forEach(s => L.rE.push([p.x + ax[0] * s * 0.72, 0.22, p.z + ax[1] * s * 0.72, p.rot])); }
  if (p.type === 'c') { L.cB.push([p.x, 0.26, p.z, p.rot]); [-1, 1].forEach(s => L.cE.push([p.x + ax[0] * s * 0.62, 0.26, p.z + ax[1] * s * 0.62, p.rot])); }
  if (p.type === 'el') { const h = rnd(1.6, 2.6); L.elS.push([p.x, h / 2, p.z, 0, 1, h, 1]); L.elT.push([p.x, h + 0.02, p.z]); }
  if (p.type === 'led') L.led.push([p.x, 0.25, p.z, p.rot]);
  if (p.type === 'ind') L.ind.push([p.x, 0.55, p.z, p.rot]);
  if (p.type === 'xtal') L.xt.push([p.x, 0.4, p.z, 0]);
  if (p.type === 'sot') { L.sotB.push([p.x, 0.3, p.z]); [[-0.5, 0.75], [0.5, 0.75], [0, -0.75]].forEach(([a, b]) => L.sotL.push([p.x + a, 0.1, p.z + b])); }
  if (p.type === 'tan') L.tan.push([p.x, 0.35, p.z, p.rot]);
  if (p.type === 'btn') { L.btnB.push([p.x, 0.4, p.z]); L.btnC.push([p.x, 1.0, p.z]); }
  if (p.type === 'cell') { L.cellH.push([p.x, 0.3, p.z]); L.cell.push([p.x, 0.85, p.z]); }
});
headers.forEach(h => {
  L.hdr.push([h.x, 1.25, h.z, h.rot, h.n * 1.27 + 0.6, 1, h.rows * 1.27 + 0.6]);
  for (let i = 0; i < h.n; i++) for (let r = 0; r < h.rows; r++) { const o = (i - (h.n - 1) / 2) * 1.27, q = (r - (h.rows - 1) / 2) * 1.27; L.pin.push(h.rot ? [h.x + q, 2.4, h.z + o] : [h.x + o, 2.4, h.z + q]); }
});
chips.forEach(c => {
  if (c.kind === 'bga') { L.bgaS.push([c.x, 0.15, c.z, 0, c.size + 1.2, 1, c.size + 1.2]); L.bgaD.push([c.x, 0.47, c.z, 0, c.size * 0.62, 1, c.size * 0.62]); return; }
  if (c.kind === 'hs') { const w = c.size + 1.4; L.hsB.push([c.x, 1.2, c.z, 0, w, 1, w]); for (let i = 0; i < 9; i++) L.hsF.push([c.x - w / 2 + 0.2 + i * (w - 0.4) / 8, 2.9, c.z, 0, 1, 1, w]); }
  L.chipB.push([c.x, c.size > 8 ? 0.75 : 0.55, c.z, 0, c.size, c.size > 8 ? 1.1 : 0.7, c.size]);
  for (let side = 0; side < 4; side++) for (let i = 0; i < c.legs; i++) {
    const x = (i - (c.legs - 1) / 2) * c.pitch, r = side * Math.PI / 2, cs = Math.cos(r), sn = Math.sin(r), lz = c.size / 2 + 0.38;
    L.chipL.push([c.x + x * cs - lz * sn, 0.16, c.z + x * sn + lz * cs, -r]);
  }
});
slots.forEach(s => { L.slot.push([s.x, 1.1, s.z, 0, 1, 1, 1]); [-1, 1].forEach(e => L.slotC.push([s.x, 1.5, s.z + e * 34.6])); });
inst(new THREE.BoxGeometry(1.1, 0.42, 0.6), M.black, L.rB);
inst(new THREE.BoxGeometry(0.34, 0.44, 0.62), M.tin, L.rE);
inst(new THREE.BoxGeometry(0.9, 0.5, 0.62), M.cer, L.cB);
inst(new THREE.BoxGeometry(0.34, 0.52, 0.64), M.tin, L.cE);
inst(new THREE.CylinderGeometry(1, 1, 1, 32), M.sleeve, L.elS);
inst(new THREE.CylinderGeometry(0.94, 0.94, 0.06, 32), M.alu, L.elT);
inst(new THREE.BoxGeometry(0.9, 0.45, 0.55), M.led, L.led);
inst(new THREE.BoxGeometry(2.4, 1.1, 2.4), M.ind, L.ind);
inst(new THREE.CapsuleGeometry(0.4, 1.6, 4, 12).rotateZ(Math.PI / 2), M.xtal, L.xt);
inst(new THREE.BoxGeometry(1, 2.5, 1), M.plastic, L.hdr);
inst(new THREE.BoxGeometry(0.25, 1.4, 0.25), M.goldPin, L.pin);
inst(new THREE.BoxGeometry(1, 1, 1), M.black, L.chipB);
inst(new THREE.BoxGeometry(0.2, 0.14, 0.8), M.tin, L.chipL);
inst(new THREE.BoxGeometry(2.4, 2.2, 68), M.slot, L.slot);
inst(new THREE.BoxGeometry(2.6, 3, 1.6), M.plastic, L.slotC);
L.pcie.push([pcie.x, 1.1, pcie.z]);
ports.forEach(p => (p.t === 'rj' ? L.rj : L.usb).push([p.x, p.t === 'rj' ? 2.1 : 1.5, -S / 2 + 2.6, 0, p.w, 1, 1]));
inst(new THREE.BoxGeometry(0.9, 0.4, 0.75), M.black, L.sotB);
inst(new THREE.BoxGeometry(0.22, 0.12, 0.5), M.tin, L.sotL);
inst(new THREE.BoxGeometry(1.5, 0.7, 0.85), M.tan, L.tan);
inst(new THREE.BoxGeometry(2.4, 0.8, 2.4), M.alu, L.btnB);
inst(new THREE.CylinderGeometry(0.6, 0.6, 0.6, 20), M.black, L.btnC);
inst(new THREE.BoxGeometry(5.6, 0.6, 4.6), M.plastic, L.cellH);
inst(new THREE.CylinderGeometry(2, 2, 0.5, 40), M.alu, L.cell);
inst(new THREE.BoxGeometry(1, 0.6, 1), M.hs, L.hsB);
inst(new THREE.BoxGeometry(0.22, 2.8, 1), M.hs, L.hsF);
inst(new THREE.BoxGeometry(1, 0.3, 1), M.sub, L.bgaS);
inst(new THREE.BoxGeometry(1, 0.35, 1), M.die, L.bgaD);
inst(new THREE.BoxGeometry(44, 2.2, 2.4), M.plastic, L.pcie);
inst(new THREE.BoxGeometry(1, 3, 5.2), M.alu, L.usb);
inst(new THREE.BoxGeometry(1, 4.2, 6), M.plastic, L.rj);

// nadruk na głównym procesorze
const top = document.createElement('canvas'); top.width = top.height = 512;
{ const g = top.getContext('2d'); g.fillStyle = '#17191d'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`; g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2); }
  g.fillStyle = 'rgba(205,212,222,.6)'; g.textAlign = 'center';
  g.font = '700 54px system-ui,sans-serif'; g.fillText('3EN4ALL', 256, 400);
  g.font = '500 26px ui-monospace,Consolas,monospace'; g.fillText('AX-2026 · LOCAL AI', 256, 445); g.fillText('PL 2645 E3', 256, 478);
  g.beginPath(); g.arc(64, 64, 20, 0, 7); g.fillStyle = 'rgba(0,0,0,.6)'; g.fill(); }
const cpuTop = new THREE.Mesh(new THREE.PlaneGeometry(10, 10).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex(top, true), roughness: 0.6 }));
cpuTop.position.y = 1.31; board.add(cpuTop);
// logo 3EN4ALL w metalu na procesorze (kształt z logo: trzy odłamki trójkąta, współrzędne SVG)
{ const shape = q => new THREE.Shape(q.map(([x, y]) => new THREE.Vector2((x - 227.5) * 0.04, -(y - 133.5) * 0.04)));
  const geo = new THREE.ExtrudeGeometry([[[212, 69], [154, 169], [203, 155], [223, 82]], [[243, 69], [231, 117], [286, 172], [301, 168]], [[286, 196], [251, 161], [176, 180], [171, 198]]].map(shape),
    { depth: 0.3, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.07, bevelSegments: 2 }).rotateX(-Math.PI / 2);
  const logo = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xdfe4ec, metalness: 1, roughness: 0.2 }));
  logo.position.set(0, 1.4, -1.3); logo.castShadow = true; board.add(logo); }

// ---------- impulsy ----------
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.2, 'rgba(255,255,255,.85)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const paths = traces.filter(t => t.w < 0.5).map(t => t.pts.map(([x, z]) => new THREE.Vector3(x, 0.1, z)));
const TAIL = 6;
function pulses(n, color, size) {
  const arr = new Float32Array(n * TAIL * 3), geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  board.add(new THREE.Points(geo, new THREE.PointsMaterial({ color, size, map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
  return { arr, geo, st: Array.from({ length: n }, () => fresh(true)) };
}
function fresh(first) {
  const pts = pick(paths), lens = []; let total = 0;
  for (let k = 1; k < pts.length; k++) { const l = pts[k].distanceTo(pts[k - 1]); lens.push(l); total += l; }
  return { pts, lens, total, t: first ? rnd(-6, total) : -rnd(0, 4), v: rnd(6, 11) };
}
const tmp = new THREE.Vector3();
function at(s, d, out) { let k = 0; d = Math.min(Math.max(d, 0), s.total); while (k < s.lens.length - 1 && d > s.lens[k]) { d -= s.lens[k]; k++; } return out.lerpVectors(s.pts[k], s.pts[k + 1], Math.min(1, d / s.lens[k])); }
function step(Pp, dt) {
  Pp.st.forEach((s, i) => {
    s.t += s.v * dt;
    if (s.t - TAIL * 0.35 > s.total) Pp.st[i] = s = fresh();
    for (let j = 0; j < TAIL; j++) {
      const d = s.t - j * 0.35, o = (i * TAIL + j) * 3;
      if (d < 0 || d > s.total) { Pp.arr[o + 1] = -99; continue; }
      at(s, d, tmp); Pp.arr[o] = tmp.x; Pp.arr[o + 1] = tmp.y; Pp.arr[o + 2] = tmp.z;
    }
  });
  Pp.geo.attributes.position.needsUpdate = true;
}
const pBlue = pulses(small ? 70 : 150, PAL.p1 || 0xed6a66, 0.9);
const pGold = pulses(small ? 10 : 22, PAL.p2 || 0xa3a3a3, 1.0);

// płyta „bez końca”: kopie dzielą geometrię i materiały, każda obrócona o 90°·k, żeby wzór się nie powtarzał
// dalekie kafle (rozmyte, we mgle) mają samą płytkę z teksturą — mniej rysowania
for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
  const d = Math.max(Math.abs(i), Math.abs(j));
  if (!d || Math.abs(i) + Math.abs(j) > 5) continue;
  const c = d < 2 ? board.clone() : new THREE.Group().add(pcb.clone()); c.position.set(i * S, 0, j * S); c.rotation.y = Math.floor(rnd(0, 4)) * Math.PI / 2; world.add(c);
}

// ---------- kamera i pętla ----------
// rozmycie w głąb: od połowy ekranu w górę płyta coraz bardziej się rozmywa (mała głębia ostrości)
const blur = () => new ShaderPass({
  uniforms: { tDiffuse: { value: null }, d: { value: new THREE.Vector2() } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 d; varying vec2 vUv;
    void main(){ vec2 o = d * smoothstep(0.42, 1.0, vUv.y); float w[5]; w[0]=.227; w[1]=.195; w[2]=.122; w[3]=.054; w[4]=.016;
      vec4 s = texture2D(tDiffuse, vUv) * w[0];
      for (int i = 1; i < 5; i++) { s += texture2D(tDiffuse, vUv + o * float(i)) * w[i]; s += texture2D(tDiffuse, vUv - o * float(i)) * w[i]; }
      gl_FragColor = s; }`,
});
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: small ? 0 : 4 }));
const bh = blur(), bv = blur();
[new RenderPass(scene, camera), bh, bv, new OutputPass()].forEach(p => composer.addPass(p));

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const portrait = w < h;
  camera.fov = portrait ? 44 : 28;
  const shift = portrait ? 0 : Math.min(80, 22 + (w / h) * 26);
  camera.position.set(-shift, portrait ? 260 : 240, portrait ? 180 : 230);
  camera.lookAt(-shift, 0, portrait ? 10 : 18);
  camera.updateProjectionMatrix();
  composer.setSize(w, h); bh.uniforms.d.value.set(3.5 / w, 0); bv.uniforms.d.value.set(0, 3.5 / h);
}
addEventListener('resize', resize);
resize();

let last = performance.now();
document.addEventListener('visibilitychange', () => { last = performance.now(); });
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  world.rotation.y += dt * 0.03;                    // pełny obrót ok. 3,5 min
  blueLight.intensity = 230 + 50 * Math.sin(now / 1700);
  step(pBlue, dt); step(pGold, dt);
  composer.render();
}
if (reduce) { world.rotation.y = 0.5; step(pBlue, 0); step(pGold, 0); composer.render(); }
else renderer.setAnimationLoop(now => { if (!document.hidden) frame(now); });
canvas.classList.add('on');
