import * as THREE from 'three';
import { CONFIG } from './config.js';

/** Center-screen raycast that finds the nearest usable object and shows its prompt. */
export class Interaction {
  constructor(camera, interactables, ui, game) {
    this.camera = camera;
    this.interactables = interactables;
    this.ui = ui;
    this.game = game;
    this.ray = new THREE.Raycaster();
    this.ray.far = CONFIG.interactRange;
    this.current = null;
  }
  update() {
    this.camera.updateMatrixWorld();
    this.ray.setFromCamera({ x: 0, y: 0 }, this.camera);
    const hits = this.ray.intersectObjects(this.interactables.map((i) => i.object), true);
    this.current = null;
    for (const hit of hits) {
      let o = hit.object;
      let found = this.interactables.find((i) => i.object === o);
      while (!found && o.parent) { o = o.parent; found = this.interactables.find((i) => i.object === o); }
      if (found) { this.current = found; break; }
    }
    this.ui.setPrompt(this.current ? this.current.prompt(this.game) : null);
    if (this.current && !this.current.prompt(this.game)) this.current = null;
  }
  use() { if (this.current) this.current.use(this.game); }
}
