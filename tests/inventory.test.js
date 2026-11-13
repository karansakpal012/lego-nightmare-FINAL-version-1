import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Inventory } from '../src/inventory.js';

test('add / has / remove items and notify listeners', () => {
  let last = null;
  const inv = new Inventory((l) => (last = l));
  assert.equal(inv.has('storage_key'), false);
  inv.add({ id: 'storage_key', name: 'Storage Key', icon: '🔑' });
  assert.equal(inv.has('storage_key'), true);
  assert.equal(last.length, 1);
  assert.equal(inv.remove('storage_key'), true);
  assert.equal(inv.remove('storage_key'), false);
  assert.equal(last.length, 0);
});
