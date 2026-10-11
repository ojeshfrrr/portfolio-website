import test from 'node:test';
import assert from 'node:assert/strict';
import { deformLightPoint } from '../src/lib/light-field.mjs';

const sample = (time, px = 0, py = 0, strength = 0) => deformLightPoint({ x: 0, y: 0, z: 0 }, .4, .2, .1, 0, time, px, py, strength);
test('the initial calm field keeps its original coordinates', () => {
  assert.deepEqual(sample(0), { x: .4, y: .2, z: .1 });
});
test('ambient flow continues without any pointer input', () => {
  const first = sample(0);
  const later = sample(4);
  assert.ok(Math.hypot(first.x - later.x, first.y - later.y, first.z - later.z) > .03);
});
test('pointer deformation is local and disappears when its strength settles to zero', () => {
  const ambient = sample(2);
  const near = sample(2, .2, .1, 1);
  const far = sample(2, 20, 20, 1);
  assert.ok(Math.hypot(near.x - ambient.x, near.y - ambient.y) > .02);
  assert.ok(Math.hypot(far.x - ambient.x, far.y - ambient.y) < .000001);
  assert.deepEqual(sample(2, .2, .1, 0), ambient);
});
test('flow remains continuous across consecutive frames and reuses its output vector', () => {
  const a = sample(4);
  const b = sample(4 + 1 / 60);
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < .01);
  const vector = { x: 0, y: 0, z: 0 };
  assert.equal(deformLightPoint(vector, .4, .2, .1, 0, 1, 0, 0, 0), vector);
});
