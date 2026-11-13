import * as THREE from 'three';
import { CONFIG } from './config.js';

/** Spotlight parented to the camera, with a drain-over-time battery. */
export class Flashlight {
  constructor(camera, ui) {
    this.ui = ui;
    this.battery = CONFIG.battery.max;
    this.on = true;
    this.base = 220;
    this.light = new THREE.SpotLight(0xfff1d0, this.base, 26, 0.5, 0.55, 2);
    this.light.position.set(0.2, -0.15, 0);
    this.light.target.position.set(0, 0, -5);
    this.light.castShadow = true;
    this.light.shadow.mapSize.set(1024, 1024);
    this.light.shadow.bias = -0.0005;
    camera.add(this.light, this.light.target);
    this.refreshHud();
  }
  toggle() {
    if (!this.on && this.battery <= 0) { this.ui.toast('The battery is dead.'); return; }
    this.on = !this.on;
  }
  recharge(amount) {
    this.battery = Math.min(CONFIG.battery.max, this.battery + amount);
  }
  update(dt) {
    if (this.on) {
      this.battery = Math.max(0, this.battery - CONFIG.battery.drainPerSec * dt);
      if (this.battery === 0) { this.on = false; this.ui.toast('Your flashlight died…'); }
    }
    const low = this.battery < CONFIG.battery.lowThreshold;
    const flicker = low && Math.random() < 0.05 ? 0.2 : 1;
    this.light.intensity = this.on ? this.base * flicker : 0;
    this.refreshHud();
  }
  refreshHud() {
    this.ui.setBattery(this.battery, this.battery < CONFIG.battery.lowThreshold);
  }
}
