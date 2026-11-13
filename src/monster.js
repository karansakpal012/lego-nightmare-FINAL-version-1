import * as THREE from 'three';
import { makeStudBox } from './lego.js';

const WP = [[-5.5, 5.1], [-5.5, -4.5], [0.3, -4.8], [0.3, 0.5], [2.5, 5.1]]; // patrol loop in Room 1
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function blocked(cols, x, z, r) {
  for (const c of cols) {
    if (!c.active) continue;
    const cx = clamp(x, c.box.min.x, c.box.max.x), cz = clamp(z, c.box.min.z, c.box.max.z);
    if ((x - cx) ** 2 + (z - cz) ** 2 <= r * r) return true;
  }
  return false;
}

/** Patrol → chase (sight/noise) → search (last seen spot) AI. Crouching and lockers defeat it. */
export class Monster {
  constructor(scene) {
    this.g = new THREE.Group();
    const red = new THREE.MeshStandardMaterial({ color: 0x6b1010, roughness: 0.6 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x15151a, roughness: 0.7 });
    const part = (w, h, d, x, y, z, m) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      b.position.set(x, y, z); b.castShadow = true; this.g.add(b); return b;
    };
    part(0.28, 0.9, 0.3, -0.2, 0.45, 0, dark); part(0.28, 0.9, 0.3, 0.2, 0.45, 0, dark);
    part(0.8, 0.9, 0.45, 0, 1.35, 0, red);
    this.arms = [part(0.22, 0.85, 0.22, -0.55, 1.3, 0, red), part(0.22, 0.85, 0.22, 0.55, 1.3, 0, red)];
    const head = makeStudBox(0.55, 0.5, 0.5, 0x9a9a7a); head.position.y = 1.8; this.g.add(head);
    const eye = new THREE.MeshBasicMaterial({ color: 0xff1010 });
    for (const x of [-0.14, 0.14]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.04), eye); e.position.set(x, 2.05, 0.26); this.g.add(e); }
    const l = new THREE.PointLight(0xff1a1a, 6, 7, 2); l.position.set(0, 2, 0.4); this.g.add(l);
    scene.add(this.g);
    this.g.position.set(WP[2][0], 0, WP[2][1]);
    this.i = 3; this.state = 'patrol'; this.stun = 8; this.wait = 0; this.last = null; this.chasing = false; this.t = 0;
  }
  los(cols, x0, z0, x1, z1) {
    const d = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(d / 0.4);
    for (let k = 1; k < n; k++) if (blocked(cols, x0 + ((x1 - x0) * k) / n, z0 + ((z1 - z0) * k) / n, 0)) return false;
    return true;
  }
  sendAway(px, pz) {
    let best = WP[0];
    for (const w of WP) if (Math.hypot(w[0] - px, w[1] - pz) > Math.hypot(best[0] - px, best[1] - pz)) best = w;
    this.g.position.set(best[0], 0, best[1]);
    this.state = 'patrol'; this.stun = 4; this.chasing = false;
  }
  update(dt, game) {
    const p = game.player, pos = this.g.position, cols = game.world.colliders;
    const d = Math.hypot(p.position.x - pos.x, p.position.z - pos.z);
    this.chasing = false;
    if (this.stun > 0) { this.stun -= dt; return; }
    const radius = p.crouching ? 4 : p.running ? 14 : 9;
    const sees = !p.hidden && d < radius && this.los(cols, pos.x, pos.z, p.position.x, p.position.z);
    if (sees) { this.state = 'chase'; this.last = [p.position.x, p.position.z]; }
    else if (this.state === 'chase') { this.state = 'search'; this.wait = 4; }

    let tx, tz, speed = 1.6;
    if (this.state === 'chase') { [tx, tz] = this.last; speed = 3.7; this.chasing = true; }
    else if (this.state === 'search') {
      [tx, tz] = this.last; speed = 2.6;
      if (Math.hypot(tx - pos.x, tz - pos.z) < 1) { speed = 0; this.wait -= dt; if (this.wait <= 0) this.state = 'patrol'; }
    } else {
      [tx, tz] = WP[this.i];
      if (Math.hypot(tx - pos.x, tz - pos.z) < 0.6) this.i = (this.i + 1) % WP.length;
    }
    const dx = tx - pos.x, dz = tz - pos.z, len = Math.hypot(dx, dz) || 1;
    if (speed > 0) {
      const vx = (dx / len) * speed * dt, vz = (dz / len) * speed * dt;
      if (!blocked(cols, pos.x + vx, pos.z, 0.45)) pos.x += vx;
      if (!blocked(cols, pos.x, pos.z + vz, 0.45)) pos.z += vz;
      this.g.rotation.y = Math.atan2(dx, dz);
    }
    this.t += dt * speed * 3;
    pos.y = Math.abs(Math.sin(this.t)) * 0.05;
    this.arms.forEach((a) => (a.rotation.x = this.chasing ? -1.3 : Math.sin(this.t) * 0.3));
    if (this.chasing && d < 1.0 && !p.hidden) game.caught();
  }
}
