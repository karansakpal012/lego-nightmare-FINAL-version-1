import * as THREE from 'three';
import { CONFIG } from './config.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** First-person controller: pointer-lock look, WASD movement, circle-vs-AABB collision. */
export class Player {
  constructor(camera, colliders, spawn) {
    this.camera = camera;
    this.colliders = colliders;
    this.position = camera.position;
    this.position.set(spawn.x, CONFIG.eyeHeight, spawn.z);
    camera.rotation.order = 'YXZ';
    this.yaw = 0;
    this.pitch = 0;
    this.keys = new Set();
    this.bobT = 0;
    this.hidden = false; this.crouching = false; this.running = false; this.eye = CONFIG.eyeHeight;
    addEventListener('keydown', (e) => this.keys.add(e.code));
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.reset());
    addEventListener('mousemove', (e) => {
      if (!document.pointerLockElement) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch = clamp(this.pitch - e.movementY * 0.0022, -1.5, 1.5);
    });
  }
  reset() { this.keys.clear(); }

  blocked(x, z) {
    const r = CONFIG.playerRadius;
    for (const c of this.colliders) {
      if (!c.active) continue;
      const cx = clamp(x, c.box.min.x, c.box.max.x), cz = clamp(z, c.box.min.z, c.box.max.z);
      if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return true;
    }
    return false;
  }

  hide(spot, out, yaw) {
    this.hidden = true; this.out = out; this.yaw = yaw; this.pitch = 0;
    this.position.x = spot.x; this.position.z = spot.z; this.eye = CONFIG.eyeHeight;
  }
  unhide() { this.hidden = false; this.position.x = this.out.x; this.position.z = this.out.z; }

  update(dt) {
    const k = this.keys;
    this.crouching = k.has('KeyC');
    this.running = !this.crouching && (k.has('ShiftLeft') || k.has('ShiftRight'));
    this.eye += ((this.crouching ? 0.85 : CONFIG.eyeHeight) - this.eye) * Math.min(1, dt * 10);
    const f = (k.has('KeyW') ? 1 : 0) - (k.has('KeyS') ? 1 : 0);
    const s = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0);
    const moving = !this.hidden && (f !== 0 || s !== 0);
    if (moving) {
      const base = this.running ? CONFIG.runSpeed : this.crouching ? CONFIG.walkSpeed * 0.5 : CONFIG.walkSpeed;
      const speed = (base * dt) / Math.hypot(f, s);
      const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
      const vx = (-sin * f + cos * s) * speed, vz = (-cos * f - sin * s) * speed;
      if (!this.blocked(this.position.x + vx, this.position.z)) this.position.x += vx;
      if (!this.blocked(this.position.x, this.position.z + vz)) this.position.z += vz;
      this.bobT += dt;
    }
    this.position.y = this.eye + (moving && !this.crouching ? Math.sin(this.bobT * 9) * 0.025 : 0);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
}
