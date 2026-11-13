import * as THREE from 'three';
import { brickMaterial, makeStudBox, makeLabelTexture } from './lego.js';

/** Room 2 – Security room: screwdriver → fuse box (power) → keypad (code from the note) → final door. */
export function buildSecurityRoom({ scene, wall, prop, addCollider, interactables, updaters, hitSphere, hd }) {
  const z0 = -hd - 4.5, z1 = z0 - 6, zm = (z0 + z1) / 2, col = 0x34405a;
  wall(-4, z0, -1.75, z0, { color: col }); wall(1.75, z0, 4, z0, { color: col });
  wall(-4, z0, -4, z1, { color: col }); wall(4, z0, 4, z1, { color: col });
  wall(-4, z1, -1.5, z1, { color: col }); wall(1.5, z1, 4, z1, { color: col });
  wall(-1.5, z1, 1.5, z1, { y0: 3.6, collide: false, color: col });
  const fl = makeStudBox(8.5, 0.3, 6.5, 0x2a3140); fl.position.set(0, -0.3, zm); scene.add(fl);
  const ce = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.3, 6.5), brickMaterial(0x15181e)); ce.position.set(0, 5.15, zm); scene.add(ce);
  const lamp = new THREE.PointLight(0x2a5cff, 8, 12, 2); lamp.position.set(0, 4, zm); scene.add(lamp);
  const add = (item, obj, game, msg) => { game.inventory.add(item); scene.remove(obj); interactables.splice(interactables.indexOf(item.ref), 1); game.ui.toast(msg); };
  let power = false;

  // screwdriver on a desk
  prop(-2.8, zm, 2, 1, 0.9, 0x6b4f2f);
  const sd = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 8), new THREE.MeshStandardMaterial({ color: 0xd22 }));
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6), brickMaterial(0xaaaaaa)); tip.position.y = 0.2;
  sd.add(handle, tip, hitSphere(0.4)); sd.rotation.z = Math.PI / 2; sd.position.set(-2.8, 1.1, zm); scene.add(sd);
  const sdItem = { object: sd, prompt: () => 'Take screwdriver', use(game) { game.inventory.add({ id: 'screwdriver', name: 'Screwdriver', icon: '🪛' }); scene.remove(sd); interactables.splice(interactables.indexOf(sdItem), 1); game.ui.toast('Picked up: Screwdriver'); } };
  interactables.push(sdItem);

  // fuse box on the east wall
  const fuse = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.6), new THREE.MeshStandardMaterial({ color: 0x333840, emissive: 0x300000 }));
  fuse.position.set(3.7, 1.5, zm); scene.add(fuse);
  // keypad on the north wall
  const kpMat = new THREE.MeshStandardMaterial({ color: 0x222, emissive: 0x330000 });
  const keypad = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.12), kpMat); keypad.position.set(2.7, 1.5, z1 + 0.3); scene.add(keypad);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.4), new THREE.MeshBasicMaterial({ map: makeLabelTexture('SECURITY', { w: 256, h: 72, bg: '#112', fg: '#8af', font: 'bold 40px Impact' }) }));
  sign.position.set(-2.5, 3, z1 + 0.26); scene.add(sign);

  const fuseItem = {
    object: fuse,
    prompt: (g) => (power ? null : g.inventory.has('screwdriver') ? 'Repair fuse box' : 'Inspect fuse box'),
    use(g) {
      if (!g.inventory.has('screwdriver')) { g.ui.toast('The panel is screwed shut. I need a screwdriver.'); return; }
      power = true; lamp.color.set(0x99bbff); lamp.intensity = 40;
      fuse.material.emissive.set(0x00aa33); kpMat.emissive.set(0x00aa33);
      g.ui.toast('Power restored. The keypad lights up.'); g.ui.setObjective('Enter the 4-digit code from the note');
    },
  };
  const keypadItem = {
    object: keypad,
    prompt: () => (final.state === 'locked' ? (power ? 'Use keypad' : 'Inspect keypad') : null),
    use(g) { if (!power) g.ui.toast('The keypad is dead. No power.'); else g.openKeypad(); },
  };
  interactables.push(fuseItem, keypadItem);

  // final exit door
  const door = new THREE.Group(); door.position.set(0, 0, z1);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(3, 3.6, 0.4), new THREE.MeshStandardMaterial({ color: 0x1d6b3a, metalness: 0.4, roughness: 0.5 }));
  panel.position.y = 1.8; door.add(panel);
  const exit = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), new THREE.MeshBasicMaterial({ map: makeLabelTexture('EXIT', { w: 256, h: 80, bg: '#063', fg: '#6f9', font: 'bold 52px Impact' }) }));
  exit.position.set(0, 2.8, 0.21); door.add(exit); scene.add(door);
  const green = new THREE.PointLight(0x38ff7a, 20, 8, 2); green.position.set(0, 3, z1 + 1); scene.add(green);
  const dc = addCollider(-1.5, z1 - 0.2, 1.5, z1 + 0.2, 3.6);
  const final = { state: 'locked' };
  updaters.push((dt, t, game) => {
    if (final.state === 'opening') { door.position.y += 2.2 * dt; if (door.position.y >= 3.6) final.state = 'open'; }
    if (final.state !== 'locked' && game.player.position.z < z1 - 0.8) game.win();
  });
  return { unlockFinal(g) { final.state = 'opening'; dc.active = false; g.ui.toast('The exit door opens!'); g.ui.setObjective('Escape!'); } };
}
