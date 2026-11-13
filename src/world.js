import * as THREE from 'three';
import { CONFIG } from './config.js';
import { buildSecurityRoom } from './room2.js';
import { brickMaterial, makeBrickWall, makeStudBox, makeLabelTexture, rng } from './lego.js';

/**
 * Builds Room 1 (Factory entrance / hall) plus a short exit corridor.
 * Returns data the game loop needs: colliders, interactables and per-frame updaters.
 */
export function buildFactoryRoom(scene) {
  const { w, d, h } = CONFIG.room;
  const hw = w / 2, hd = d / 2;
  const colliders = [], interactables = [], updaters = [];

  const addCollider = (minX, minZ, maxX, maxZ, maxY = h) => {
    const c = { active: true, box: new THREE.Box3(new THREE.Vector3(minX, 0, minZ), new THREE.Vector3(maxX, maxY, maxZ)) };
    colliders.push(c);
    return c;
  };
  const wall = (x0, z0, x1, z1, { y0 = 0, y1 = h, color = 0x7a2e2a, collide = true } = {}) => {
    scene.add(makeBrickWall({ from: [x0, z0], to: [x1, z1], y0, y1, color }));
    if (collide) addCollider(Math.min(x0, x1) - 0.25, Math.min(z0, z1) - 0.25, Math.max(x0, x1) + 0.25, Math.max(z0, z1) + 0.25, y1);
  };
  const prop = (x, z, pw, pd, ph, color, y = 0, collide = true) => {
    const m = makeStudBox(pw, ph, pd, color);
    m.position.set(x, y, z);
    scene.add(m);
    if (collide) addCollider(x - pw / 2, z - pd / 2, x + pw / 2, z + pd / 2, y + ph);
    return m;
  };

  // ---- Atmosphere lighting ----
  scene.add(new THREE.HemisphereLight(0x2a3a66, 0x080808, 0.6));
  const blue = new THREE.PointLight(0x2a5cff, 40, 18, 2);
  blue.position.set(0, 4.2, 0);
  scene.add(blue);
  const reds = [[hw - 1.5, hd - 2], [-hw + 1.5, -2]].map(([x, z]) => {
    const l = new THREE.PointLight(0xff1a1a, 60, 14, 2);
    l.position.set(x, 4.3, z);
    scene.add(l);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), new THREE.MeshBasicMaterial({ color: 0xff2020 }));
    bulb.position.copy(l.position).setY(4.75);
    scene.add(bulb);
    return l;
  });
  updaters.push((dt, t) => reds.forEach((l, i) => (l.intensity = 25 + 45 * Math.max(0, Math.sin(t * 2.4 + i * 1.7)))));

  // ---- Floor, ceiling, walls ----
  const floor = makeStudBox(w + 1, 0.3, d + 1, 0x3a4048); floor.position.y = -0.3; scene.add(floor);
  const cFloor = makeStudBox(3.5, 0.3, 4.5, 0x2c3a33); cFloor.position.set(0, -0.3, -hd - 2.25); scene.add(cFloor);
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 0.3, d + 1), brickMaterial(0x15181e));
  ceil.position.y = h + 0.15; ceil.receiveShadow = true; scene.add(ceil);
  const cCeil = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.3, 4.5), brickMaterial(0x15181e));
  cCeil.position.set(0, h + 0.15, -hd - 2.25); scene.add(cCeil);
  for (const z of [-3.5, 0, 3.5]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(w, 0.35, 0.5), brickMaterial(0x2a2f38));
    beam.position.set(0, h - 0.2, z); beam.castShadow = true; scene.add(beam);
  }

  wall(-hw, hd, hw, hd);                                  // south
  wall(-hw, -hd, -hw, hd);                                // west
  wall(hw, -hd, hw, hd);                                  // east
  wall(-hw, -hd, -1.5, -hd);                              // north-left
  wall(1.5, -hd, hw, -hd);                                // north-right
  wall(-1.5, -hd, 1.5, -hd, { y0: 3.6, collide: false }); // lintel above exit door
  // exit corridor
  wall(-1.75, -hd, -1.75, -hd - 4.5, { color: 0x2f4a3c });
  wall(1.75, -hd, 1.75, -hd - 4.5, { color: 0x2f4a3c });
  const green = new THREE.PointLight(0x38ff7a, 28, 9, 2);
  green.position.set(0, 3.2, -hd - 2.5);
  scene.add(green);

  // ---- Props ----
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4, 1),
    new THREE.MeshStandardMaterial({ map: makeLabelTexture('FACTORY No. 13', { w: 512, h: 128, bg: '#3a1210', fg: '#e8d6b0' }), roughness: 0.8 }));
  sign.position.set(-3, 3, hd - 0.27); sign.rotation.y = Math.PI; scene.add(sign);

  prop(-3.5, -1.5, 1.4, 1.4, 1.2, 0xc0392b);
  prop(-3.5, -1.5, 1.0, 1.0, 0.9, 0xf1c40f, 1.2, false);
  prop(2.5, -3.5, 1.2, 1.2, 1.2, 0x2980b9);
  prop(-1, 3.5, 1.2, 1.2, 1.2, 0xe67e22);
  prop(6.5, -3.5, 1.4, 1.4, 1.4, 0x27ae60);

  // shelf (west wall) with battery on middle plank
  for (const px of [-7.5, -6.5]) for (const pz of [-3, 0.5]) prop(px, pz, 0.15, 0.15, 2.8, 0x555b66, 0, false);
  for (const py of [0.3, 1.3, 2.3]) prop(-7, -1.25, 1.1, 3.6, 0.1, 0x6b4f2f, py, false);
  addCollider(-7.6, -3.1, -6.4, 0.6, 2.8);
  prop(-7, -2.4, 0.8, 0.8, 0.6, 0x2980b9, 1.4, false);

  // workbench (east side) with the key
  for (const [lx, lz] of [[4.2, 1.5], [6.8, 1.5], [4.2, 2.5], [6.8, 2.5]]) prop(lx, lz, 0.15, 0.15, 1.0, 0x555b66, 0, false);
  prop(5.5, 2, 3, 1.3, 0.15, 0x8d6e4b, 1.0, false);
  addCollider(4, 1.3, 7, 2.7, 1.15);

  const rand = rng(13);
  const palette = [0xc0392b, 0xf1c40f, 0x2980b9, 0x27ae60, 0xe67e22];
  for (let i = 0; i < 14; i++) {
    const b = makeStudBox(0.5 + rand() * 0.5, 0.25, 0.5, palette[i % 5]);
    b.position.set((rand() - 0.5) * (w - 3), 0, (rand() - 0.3) * (d - 3));
    b.rotation.y = rand() * Math.PI;
    scene.add(b);
  }

  // ---- Interactables ----
  const hitSphere = (r) => new THREE.Mesh(new THREE.SphereGeometry(r), new THREE.MeshBasicMaterial({ visible: false }));

  const key = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0xffc928, emissive: 0x553300, metalness: 0.6, roughness: 0.3 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.05, 8, 16), gold);
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.08), gold); shaft.position.x = 0.4;
  const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.08), gold); t1.position.set(0.58, -0.1, 0);
  const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.08), gold); t2.position.set(0.44, -0.07, 0);
  const keyLight = new THREE.PointLight(0xffd060, 5, 5, 2);
  key.add(ring, shaft, t1, t2, keyLight, hitSphere(0.5));
  key.position.set(5.2, 1.5, 2);
  key.traverse((o) => (o.castShadow = o.isMesh && o.material.visible !== false));
  scene.add(key);
  updaters.push((dt, t) => { key.rotation.y = t * 1.5; key.position.y = 1.5 + Math.sin(t * 2) * 0.05; });

  const keyItem = {
    object: key,
    prompt: () => 'Pick up storage key',
    use(game) {
      game.inventory.add({ id: 'storage_key', name: 'Storage Key', icon: '🔑' });
      scene.remove(key);
      interactables.splice(interactables.indexOf(keyItem), 1);
      game.ui.toast('Picked up: Storage Key');
      game.ui.setObjective('Unlock the exit door');
    },
  };
  interactables.push(keyItem);

  const battery = new THREE.Group();
  const cell = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.35, 12), new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x0a4a22 }));
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 8), brickMaterial(0xcccccc));
  cap.position.y = 0.2;
  battery.add(cell, cap, hitSphere(0.4));
  battery.position.set(-7, 1.65, -0.3);
  scene.add(battery);
  const batteryItem = {
    object: battery,
    prompt: () => 'Take battery',
    use(game) {
      game.flashlight.recharge(CONFIG.battery.pickupAmount);
      scene.remove(battery);
      interactables.splice(interactables.indexOf(batteryItem), 1);
      game.ui.toast('Flashlight recharged');
    },
  };
  interactables.push(batteryItem);

  // ---- Exit door (slides up into the lintel) ----
  const door = new THREE.Group();
  door.position.set(0, 0, -hd);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(3, 3.6, 0.4), new THREE.MeshStandardMaterial({ color: 0x5a5f6a, metalness: 0.5, roughness: 0.5 }));
  panel.position.y = 1.8; panel.castShadow = panel.receiveShadow = true;
  const lockedTex = makeLabelTexture('LOCKED', { w: 256, h: 80, bg: '#400', fg: '#f44', font: 'bold 48px Impact' });
  const openTex = makeLabelTexture('OPEN', { w: 256, h: 80, bg: '#040', fg: '#4f4', font: 'bold 48px Impact' });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.38), new THREE.MeshBasicMaterial({ map: lockedTex }));
  plate.position.set(0, 1.8, 0.21);
  door.add(panel, plate);
  scene.add(door);
  const doorCollider = addCollider(-1.5, -hd - 0.2, 1.5, -hd + 0.2, 3.6);
  const doorState = { state: 'locked' };

  const doorItem = {
    object: panel,
    prompt: (game) => (doorState.state !== 'locked' ? null : game.inventory.has('storage_key') ? 'Unlock door' : 'Inspect door'),
    use(game) {
      if (doorState.state !== 'locked') return;
      if (!game.inventory.has('storage_key')) { game.ui.toast('Locked. There must be a key somewhere in this room…'); return; }
      game.inventory.remove('storage_key');
      doorState.state = 'opening';
      plate.material.map = openTex;
      doorCollider.active = false;
      game.ui.toast('The door grinds open…');
      game.ui.setObjective('Find a screwdriver, restore power, find the 4-digit code');
    },
  };
  interactables.push(doorItem);
  updaters.push((dt, t, game) => {
    if (doorState.state === 'opening') {
      door.position.y += 2.2 * dt;
      if (door.position.y >= 3.6) { door.position.y = 3.6; doorState.state = 'open'; }
    }
  });

  // ---- Note with the keypad code ----
  const note = new THREE.Group();
  const paper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.4), new THREE.MeshStandardMaterial({ color: 0xf5f0dc, emissive: 0x333322 }));
  note.add(paper, hitSphere(0.4)); note.position.set(2.5, 1.32, -3.5); scene.add(note);
  const noteItem = {
    object: note, prompt: () => 'Read note',
    use(game) {
      game.inventory.add({ id: 'note', name: 'Code 4719', icon: '📄' });
      scene.remove(note); interactables.splice(interactables.indexOf(noteItem), 1);
      game.ui.toast('A scrawled note: "Exit code: 4 7 1 9"');
    },
  };
  interactables.push(noteItem);

  // ---- Hiding lockers (E to enter, E to leave) ----
  const locker = (x, z, ox, oz, yaw) => {
    const m = prop(x, z, 0.9, 0.9, 2.0, 0x3d5a80);
    const item = { object: m, prompt: () => 'Hide in locker', use(game) { game.flashlight.on = false; game.player.hide({ x, z }, { x: ox, z: oz }, yaw); game.ui.toast('Hiding… press E to leave'); } };
    interactables.push(item);
  };
  locker(7.3, -1.0, 6.2, -1.0, Math.PI / 2);
  locker(-1.2, -5.3, -1.2, -4.3, Math.PI);

  const room2 = buildSecurityRoom({ scene, wall, prop, addCollider, interactables, updaters, hitSphere, hd });

  return { room2, colliders, interactables, updaters, spawn: { x: -5.5, z: 4.5 } };
}
