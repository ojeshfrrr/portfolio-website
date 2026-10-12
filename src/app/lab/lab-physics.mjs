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

/**
 * Damped radial impulse response used to displace Signal Field contours.
 * A pointer drag emits an impulse J; mass sets initial amplitude and wave speed,
 * spring stiffness sets natural frequency/speed, and damping + waveDecay dissipate it.
 */
export function sampleRadialImpulse(distance, age, impulse, settings) {
  if (age < 0 || age > 8 || impulse === 0) return 0;
  const mass = Math.max(0.1, settings.mass);
  const naturalFrequency = Math.sqrt(Math.max(0.1, settings.stiffness) / mass);
  const waveSpeed = naturalFrequency * Math.max(0.05, settings.rippleSpeed) * 28;
  const radius = Math.max(1, settings.influenceRadius);
  const localTime = age - distance / waveSpeed;
  if (localTime <= 0) return 0;
  const dampingRate = settings.damping / (2 * mass) + settings.waveDecay * 1.4;
  const dampedFrequency = Math.sqrt(Math.max(0.1, naturalFrequency ** 2 - (settings.damping / (2 * mass)) ** 2));
  const wavePacket = Math.exp(-0.5 * (waveSpeed * localTime / radius) ** 2);
  const carrierPhase = (distance / Math.max(24, settings.wavelength) - localTime * settings.frequency) * Math.PI * 2;
  // The spring's impulse response rings locally as the radial packet passes, then settles.
  const springResponse = (impulse / mass) * Math.exp(-dampingRate * localTime)
    * Math.sin(dampedFrequency * localTime) / dampedFrequency;
  return springResponse * wavePacket * Math.sin(carrierPhase) * settings.momentumPersistence;
}
