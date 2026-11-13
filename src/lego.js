import * as THREE from 'three';

const studGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.1, 12);
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const matCache = new Map();
const wallMat = new THREE.MeshStandardMaterial({ roughness: 0.5 });

export function rng(seed = 1) { // mulberry32 – deterministic decoration
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function brickMaterial(color, roughness = 0.4) {
  const key = `${color}:${roughness}`;
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness }));
  return matCache.get(key);
}

/** Grid of studs (one InstancedMesh = one draw call). Centered on origin, sitting on y=0. */
export function makeStudGrid(w, d, color, spacing = 0.5) {
  const nx = Math.max(1, Math.round(w / spacing));
  const nz = Math.max(1, Math.round(d / spacing));
  const mesh = new THREE.InstancedMesh(studGeo, brickMaterial(color), nx * nz);
  const m = new THREE.Matrix4();
  let i = 0;
  for (let x = 0; x < nx; x++) {
    for (let z = 0; z < nz; z++) {
      m.makeTranslation(-w / 2 + (x + 0.5) * (w / nx), 0.05, -d / 2 + (z + 0.5) * (d / nz));
      mesh.setMatrixAt(i++, m);
    }
  }
  mesh.receiveShadow = true;
  return mesh;
}

/** A solid LEGO-style block. Origin = bottom center. */
export function makeStudBox(w, h, d, color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(boxGeo, brickMaterial(color));
  body.scale.set(w, h, d);
  body.position.y = h / 2;
  body.castShadow = body.receiveShadow = true;
  const studs = makeStudGrid(w, d, color);
  studs.position.y = h;
  g.add(body, studs);
  return g;
}

/** Axis-aligned or angled wall built from running-bond bricks in one InstancedMesh. */
export function makeBrickWall({ from, to, y0 = 0, y1 = 5, color = 0x7a2e2a, thick = 0.5, brickLen = 2 }) {
  const [x0, z0] = from, [x1, z1] = to;
  const dx = x1 - x0, dz = z1 - z0;
  const L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
  const n = Math.max(1, Math.round((y1 - y0) / 0.6));
  const h = (y1 - y0) / n;
  const rand = rng(Math.floor(Math.abs(x0 * 31 + z0 * 17 + x1 * 7 + z1 * 3)) + 1);
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.atan2(dz, dx));
  const entries = [];
  for (let i = 0; i < n; i++) {
    const off = (i % 2) * (brickLen / 2);
    for (let pos = -off; pos < L - 0.01; pos += brickLen) {
      const a = Math.max(pos, 0), b = Math.min(pos + brickLen, L);
      if (b - a < 0.08) continue;
      const t = (a + b) / 2;
      entries.push({ x: x0 + ux * t, y: y0 + h * (i + 0.5), z: z0 + uz * t, len: b - a - 0.03 });
    }
  }
  const mesh = new THREE.InstancedMesh(boxGeo, wallMat, entries.length);
  const m = new THREE.Matrix4(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const base = new THREE.Color(color);
  entries.forEach((e, i) => {
    m.compose(p.set(e.x, e.y, e.z), q, s.set(e.len, h - 0.03, thick));
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, base.clone().offsetHSL(0, 0, (rand() - 0.5) * 0.08));
  });
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

export function makeLabelTexture(text, { w = 512, h = 128, bg = '#111', fg = '#fff', font = 'bold 64px Impact, Arial' } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = fg; ctx.lineWidth = 6; ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
