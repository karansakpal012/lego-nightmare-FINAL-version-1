/** Simple item store. UI-agnostic so it can be unit tested. */
export class Inventory {
  constructor(onChange = () => {}) {
    this.items = new Map();
    this.onChange = onChange;
  }
  add(item) { this.items.set(item.id, item); this.onChange(this.list()); }
  has(id) { return this.items.has(id); }
  remove(id) {
    const removed = this.items.delete(id);
    if (removed) this.onChange(this.list());
    return removed;
  }
  list() { return [...this.items.values()]; }
}
