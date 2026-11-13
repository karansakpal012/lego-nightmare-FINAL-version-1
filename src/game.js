import * as THREE from 'three';
import { UI } from './ui.js';
import { Inventory } from './inventory.js';
import { buildFactoryRoom } from './world.js';
import { Player } from './player.js';
import { Flashlight } from './flashlight.js';
import { Interaction } from './interaction.js';
import { Monster } from './monster.js';
import { AudioFX } from './audio.js';

/** Owns renderer, state machine (menu → playing ⇄ paused → won) and the main loop. */
export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.state = 'menu';
    this.time = 0;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x03040a);
    this.scene.fog = new THREE.FogExp2(0x05070d, 0.04);
    this.camera = new THREE.PerspectiveCamera(72, 1, 0.05, 60);
    this.scene.add(this.camera);

    this.ui = new UI();
    this.inventory = new Inventory((items) => this.ui.setInventory(items));
    this.world = buildFactoryRoom(this.scene);
    this.player = new Player(this.camera, this.world.colliders, this.world.spawn);
    this.flashlight = new Flashlight(this.camera, this.ui);
    this.interaction = new Interaction(this.camera, this.world.interactables, this.ui, this);
    this.audio = new AudioFX();
    this.monster = new Monster(this.scene);
    this.hearts = 3;
    this.ui.setHearts(3);
    this.ui.setObjective('Find a way out of the factory');
    this.ui.showScreen('menu');

    this.bindEvents();
    this.resize();
    this.clock = new THREE.Clock();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  bindEvents() {
    const lock = () => this.canvas.requestPointerLock();
    document.getElementById('btn-start').onclick = () => { lock(); this.audio.start(); };
    document.getElementById('btn-resume').onclick = lock;
    document.getElementById('btn-restart').onclick = () => location.reload();
    document.getElementById('btn-again').onclick = () => location.reload();
    const closeKp = () => { this.ui.el.keypad.classList.add('hidden'); lock(); };
    const inp = this.ui.el.keyInput;
    document.getElementById('keypad-cancel').onclick = closeKp;
    document.getElementById('keypad-ok').onclick = () => {
      if (inp.value === '4719') { this.world.room2.unlockFinal(this); this.audio.pickup(); closeKp(); }
      else { this.ui.toast('Wrong code.'); this.audio.tone(120, 0.3, 'sawtooth', 0.1); inp.value = ''; }
    };
    inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') document.getElementById('keypad-ok').click(); };
    document.getElementById('btn-retry').onclick = () => location.reload();
    addEventListener('resize', () => this.resize());

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === this.canvas) {
        this.state = 'playing';
        this.ui.hideScreens();
      } else if (this.state === 'playing') {
        this.state = 'paused';
        this.player.reset();
        this.ui.showScreen('pause');
      }
    });
    addEventListener('keydown', (e) => {
      if (this.state !== 'playing' || e.repeat) return;
      if (e.code === 'KeyF') this.flashlight.toggle();
      if (e.code === 'KeyE') this.interact();
    });
    this.canvas.addEventListener('mousedown', () => this.state === 'playing' && this.interact());
  }

  interact() {
    if (this.player.hidden) { this.player.unhide(); return; }
    if (this.interaction.current) { this.interaction.use(); this.audio.pickup(); }
  }

  openKeypad() {
    this.state = 'keypad';
    document.exitPointerLock();
    this.player.reset();
    this.ui.el.keypad.classList.remove('hidden');
    this.ui.el.keyInput.value = '';
    this.ui.el.keyInput.focus();
  }

  caught() {
    this.hearts--;
    this.ui.setHearts(this.hearts);
    this.audio.scare();
    this.ui.flash();
    if (this.hearts <= 0) { this.state = 'dead'; document.exitPointerLock(); this.ui.showScreen('dead'); return; }
    this.monster.sendAway(this.player.position.x, this.player.position.z);
    this.ui.toast('It got you! Run and hide!');
  }

  win() {
    if (this.state === 'won') return;
    this.state = 'won';
    document.exitPointerLock();
    this.ui.showScreen('end');
  }

  resize() {
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }

  loop() {
    requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (this.state === 'playing') {
      this.time += dt;
      this.player.update(dt);
      this.flashlight.update(dt);
      if (this.player.hidden) this.ui.setPrompt('Leave locker');
      else this.interaction.update();
      this.monster.update(dt, this);
      this.audio.update(dt, this.monster.chasing);
      for (const fn of this.world.updaters) fn(dt, this.time, this);
    }
    this.renderer.render(this.scene, this.camera);
  }
}
