const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

/**
 * Integrate a 1D mass–spring–damper with semi-implicit Euler. Stiff systems are
 * split into <= 1/120s substeps and tab-resume deltas are capped at 50ms.
 */
export function stepDampedSpring(state, target, delta, { mass, stiffness, damping }) {
  const dt = clamp(delta, 0, 0.05);
  if (dt === 0) return state;
  const steps = Math.max(1, Math.ceil(dt * 120));
  const step = dt / steps;
  for (let index = 0; index < steps; index += 1) {
    const acceleration = (-stiffness * (state.position - target) - damping * state.velocity) / mass;
    state.velocity = clamp(state.velocity + acceleration * step, -720, 720);
    state.position = clamp(state.position + state.velocity * step, -24, 24);
  }
  return state;
}
