const $ = (id) => document.getElementById(id);

/** All DOM overlay handling lives here. */
export class UI {
  constructor() {
    this.el = {
      hud: $('hud'), prompt: $('prompt'), toastEl: $('toast'), fill: $('battery-fill'),
      inv: $('inventory'), objective: $('objective'),
      menu: $('screen-menu'), pause: $('screen-pause'), end: $('screen-end'), dead: $('screen-dead'), hearts: $('hearts'), flashEl: $('flash'), keypad: $('keypad'), keyInput: $('keypad-input'),
    };
    this._toastTimer = 0;
  }
  showScreen(name) {
    for (const k of ['menu', 'pause', 'end', 'dead']) this.el[k].classList.toggle('hidden', k !== name);
    this.el.hud.classList.toggle('hidden', name === 'menu');
  }
  hideScreens() {
    for (const k of ['menu', 'pause', 'end', 'dead']) this.el[k].classList.add('hidden');
    this.el.hud.classList.remove('hidden');
  }
  setPrompt(text) {
    this.el.prompt.textContent = text ? `[E] ${text}` : '';
    this.el.prompt.classList.toggle('hidden', !text);
  }
  toast(msg, ms = 2800) {
    this.el.toastEl.textContent = msg;
    this.el.toastEl.classList.remove('hidden');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.el.toastEl.classList.add('hidden'), ms);
  }
  setBattery(pct, low) {
    this.el.fill.style.width = `${Math.max(0, pct)}%`;
    this.el.fill.classList.toggle('low', low);
  }
  setInventory(items) {
    this.el.inv.replaceChildren(...items.map((it) => {
      const d = document.createElement('div');
      d.className = 'slot';
      const icon = document.createElement('b');
      icon.textContent = it.icon;
      d.append(icon, it.name);
      return d;
    }));
  }
  setHearts(n) { this.el.hearts.textContent = '❤'.repeat(n) + '🖤'.repeat(3 - n); }
  flash() { this.el.flashEl.classList.remove('hidden'); setTimeout(() => this.el.flashEl.classList.add('hidden'), 350); }
  setObjective(text) { this.el.objective.textContent = text; }
}
