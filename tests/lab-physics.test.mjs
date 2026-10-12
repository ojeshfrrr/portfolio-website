import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyReactionBrush, createFlowParticles, createGravityParticles, createReactionState, flowVelocity, gravityAcceleration,
  sampleInterference, sampleRadialImpulse, stepFlowParticle, stepGravityParticle, stepReaction, stepDampedSpring,
} from '../src/app/lab/lab-physics.mjs';

const spring = (mass = 1, stiffness = 64, damping = 12) => ({ mass, stiffness, damping });
const wave = { mass: 1.4, stiffness: 16, damping: 2.8, rippleSpeed: 1, influenceRadius: 150, wavelength: 180, frequency: 1.1, waveDecay: 0.3, momentumPersistence: 0.82 };

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

test('radial impulse propagates, depends on force, mass, stiffness, and dissipates', () => {
  const nearFront = sampleRadialImpulse(100, 1.4, 20, wave);
  const lowForce = sampleRadialImpulse(100, 1.4, 10, wave);
  const heavy = sampleRadialImpulse(100, 1.4, 20, { ...wave, mass: 2.8 });
  const stiff = sampleRadialImpulse(100, 1.4, 20, { ...wave, stiffness: 36 });
  const late = sampleRadialImpulse(100, 4, 20, wave);
  assert.notEqual(nearFront, 0);
  assert.ok(Math.abs(lowForce) < Math.abs(nearFront));
  assert.ok(Math.abs(heavy) < Math.abs(nearFront));
  assert.notEqual(stiff, nearFront);
  assert.ok(Math.abs(late) < Math.abs(nearFront));
});

test('gravity accelerates toward attractors and softening keeps collisions finite', () => {
  const target = { x: 0.5, y: 0.5 };
  const acceleration = gravityAcceleration({ x: 0.75, y: 0.5 }, [target], 0.009, 1.3, 0.035);
  assert.ok(acceleration.x < 0);
  assert.equal(acceleration.y, 0);
  const collision = gravityAcceleration(target, [target], 0.009, 1.3, 0.035);
  assert.ok(Number.isFinite(collision.x) && Number.isFinite(collision.y));
  const stronger = gravityAcceleration({ x: 0.75, y: 0.5 }, [target], 0.018, 1.3, 0.035);
  assert.ok(Math.abs(stronger.x) > Math.abs(acceleration.x));
});

test('gravity particles initialize reproducibly and integrate within finite bounds', () => {
  const settings = { strength: 0.009, attractorCount: 1, attractorMass: 1.3, initialVelocity: 0.26, orbitalBias: 0.8, drag: 0.02, softening: 0.035, attractors: [{ x: 0.5, y: 0.5 }] };
  const first = createGravityParticles(40, 6214, settings);
  const second = createGravityParticles(40, 6214, settings);
  assert.deepEqual(first, second);
  const particle = first[0];
  const before = { ...particle };
  stepGravityParticle(particle, 1 / 60, settings);
  assert.notDeepEqual(particle, before);
  assert.ok(Object.values(particle).every(Number.isFinite));
});

test('wave sources superpose and opposite phase cancels', () => {
  const settings = { amplitude: 0.8, wavelength: 0.2, frequency: 0, speed: 1, decay: 0.2, phaseOffset: 0 };
  const source = [{ x: 0.25, y: 0.5, phase: 0 }];
  const single = sampleInterference(0.35, 0.5, 0, source, settings);
  const reinforced = sampleInterference(0.35, 0.5, 0, [...source, { x: 0.25, y: 0.5, phase: 0 }], settings);
  const cancelled = sampleInterference(0.35, 0.5, 0, [...source, { x: 0.25, y: 0.5, phase: Math.PI }], settings);
  assert.notEqual(single, 0);
  assert.ok(Math.abs(reinforced - single * 2) < 1e-12);
  assert.ok(Math.abs(cancelled) < 1e-12);
});

test('particle flow follows its vector field and remains finite under midpoint integration', () => {
  const settings = { strength: 0.4, spatialScale: 1.2, rotation: 0, turbulence: 0, timeSpeed: 1, boundary: 'wrap' };
  const velocity = flowVelocity(0.5, 0.5, 0, settings);
  assert.ok(velocity.x > 0 && Math.abs(velocity.y) < 1e-12);
  const particle = { x: 0.5, y: 0.5, vx: 0, vy: 0 };
  stepFlowParticle(particle, 1 / 60, 0, settings);
  assert.ok(particle.x > 0.5);
  assert.ok(Object.values(particle).every(Number.isFinite));
  assert.deepEqual(createFlowParticles(24, 6214), createFlowParticles(24, 6214));
  const reflected = flowVelocity(0.001, 0.5, 0, { ...settings, rotation: Math.PI, boundary: 'reflect' });
  assert.ok(reflected.x > 0, 'outward field velocity reflects inward at the left boundary');
  const wrapped = { x: 0.999, y: 0.5, vx: 0, vy: 0 };
  stepFlowParticle(wrapped, 0.04, 0, { ...settings, strength: 1, timeSpeed: 1, boundary: 'wrap' });
  assert.ok(wrapped.x >= 0 && wrapped.x <= 1);
});

test('Gray–Scott state remains bounded, reacts to brush input, and reset is seeded', () => {
  const settings = { feed: 0.0367, kill: 0.0649, diffusionA: 1, diffusionB: 0.5 };
  const state = createReactionState(48, 40, 11, 'center');
  const reset = createReactionState(48, 40, 11, 'center');
  assert.deepEqual(state.b, reset.b);
  const seededB = state.b.reduce((sum, value) => sum + value, 0);
  applyReactionBrush(state, 0.75, 0.5, 0.08, 0.8);
  assert.ok(state.b.reduce((sum, value) => sum + value, 0) > seededB);
  stepReaction(state, settings, 8);
  assert.ok(state.a.every(value => Number.isFinite(value) && value >= 0 && value <= 1));
  assert.ok(state.b.every(value => Number.isFinite(value) && value >= 0 && value <= 1));
  const alternate = createReactionState(48, 40, 11, 'center');
  const baseline = createReactionState(48, 40, 11, 'center');
  stepReaction(baseline, settings, 8);
  stepReaction(alternate, { ...settings, feed: 0.055, kill: 0.061 }, 8);
  assert.notDeepEqual(alternate.b, baseline.b, 'feed and kill parameters alter the simulated concentrations');
});

