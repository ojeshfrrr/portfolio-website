import test from 'node:test';
import assert from 'node:assert/strict';
import { stepDampedSpring } from '../src/app/lab/lab-physics.mjs';

const spring = (mass = 1, stiffness = 64, damping = 12) => ({ mass, stiffness, damping });

test('spring acceleration follows stiffness and mass rather than a decorative multiplier', () => {
  const light = { position: 10, velocity: 0 };
  const heavy = { position: 10, velocity: 0 };
  stepDampedSpring(light, 0, 1 / 60, spring(1));
  stepDampedSpring(heavy, 0, 1 / 60, spring(2));
  assert.ok(Math.abs(light.velocity) > Math.abs(heavy.velocity));
  const stiff = { position: 10, velocity: 0 };
  stepDampedSpring(stiff, 0, 1 / 60, spring(1, 96));
  assert.ok(Math.abs(stiff.velocity) > Math.abs(light.velocity));
});

test('damping dissipates spring energy and the system returns to equilibrium', () => {
  const lowDamping = { position: 8, velocity: 0 };
  const highDamping = { position: 8, velocity: 0 };
  for (let frame = 0; frame < 90; frame += 1) {
    stepDampedSpring(lowDamping, 0, 1 / 60, spring(1, 55, 2));
    stepDampedSpring(highDamping, 0, 1 / 60, spring(1, 55, 18));
  }
  assert.ok(Math.abs(highDamping.velocity) < Math.abs(lowDamping.velocity));
  const settled = { position: 8, velocity: 0 };
  for (let frame = 0; frame < 480; frame += 1) stepDampedSpring(settled, 0, 1 / 60, spring(1.4, 70, 16));
  assert.ok(Math.abs(settled.position) < 0.02);
  assert.ok(Math.abs(settled.velocity) < 0.02);
});

test('spring integration caps long frames and remains finite under stiff settings', () => {
  const state = { position: 20, velocity: 560 };
  stepDampedSpring(state, -18, 3, spring(0.5, 180, 2));
  assert.ok(Number.isFinite(state.position) && Number.isFinite(state.velocity));
  assert.ok(Math.abs(state.position) <= 24 && Math.abs(state.velocity) <= 720);
});
