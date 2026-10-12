const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

const seededRandom = seed => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const wrapUnit = value => ((value % 1) + 1) % 1;

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

/** Softened Newtonian acceleration. Test-particle mass cancels from F = m·a. */
export function gravityAcceleration(position, attractors, strength, attractorMass, softening) {
  const epsilon = clamp(softening, 0.005, 0.2);
  let ax = 0;
  let ay = 0;
  for (const attractor of attractors) {
    const dx = attractor.x - position.x;
    const dy = attractor.y - position.y;
    const radiusSquared = dx * dx + dy * dy + epsilon * epsilon;
    const magnitude = clamp(strength, 0, 0.04) * clamp(attractorMass, 0.1, 5) / (radiusSquared ** 1.5);
    ax += dx * magnitude;
    ay += dy * magnitude;
  }
  const length = Math.hypot(ax, ay);
  if (length > 3) { ax = ax / length * 3; ay = ay / length * 3; }
  return { x: ax, y: ay };
}

/** Seeded orbital initial conditions in a normalized 0..1 canvas domain. */
export function createGravityParticles(count, seed, settings) {
  const random = seededRandom(seed);
  const targetCount = clamp(Math.round(count), 12, 700);
  const attractors = settings.attractors.slice(0, Math.max(1, settings.attractorCount));
  return Array.from({ length: targetCount }, () => {
    const attractor = attractors[Math.floor(random() * attractors.length)] ?? { x: 0.5, y: 0.5 };
    const angle = random() * Math.PI * 2;
    const radius = 0.08 + random() * 0.37;
    const radialX = Math.cos(angle);
    const radialY = Math.sin(angle);
    const speed = settings.initialVelocity * (0.55 + random() * 0.9);
    const direction = random() < 0.5 ? -1 : 1;
    return {
      x: wrapUnit(attractor.x + radialX * radius), y: wrapUnit(attractor.y + radialY * radius),
      vx: -radialY * speed * settings.orbitalBias + radialX * speed * (1 - settings.orbitalBias) * 0.24,
      vy: radialX * speed * settings.orbitalBias + radialY * speed * (1 - settings.orbitalBias) * 0.24,
      phase: random() * Math.PI * 2, direction,
    };
  });
}

/** Seeded starting positions for the advection study. */
export function createFlowParticles(count, seed) {
  const random = seededRandom(seed);
  return Array.from({ length: clamp(Math.round(count), 24, 900) }, () => ({
    x: random(), y: random(), vx: 0, vy: 0, phase: random() * Math.PI * 2,
  }));
}

/** Velocity-Verlet step with a bounded frame delta and exponential drag. */
export function stepGravityParticle(particle, delta, settings) {
  const dt = clamp(delta, 0, 0.05);
  if (dt === 0) return particle;
  const attractors = settings.attractors.slice(0, Math.max(1, settings.attractorCount));
  const start = gravityAcceleration(particle, attractors, settings.strength, settings.attractorMass, settings.softening);
  particle.x += particle.vx * dt + start.x * dt * dt * 0.5;
  particle.y += particle.vy * dt + start.y * dt * dt * 0.5;
  const end = gravityAcceleration(particle, attractors, settings.strength, settings.attractorMass, settings.softening);
  particle.vx = (particle.vx + (start.x + end.x) * dt * 0.5) * Math.exp(-clamp(settings.drag, 0, 2) * dt);
  particle.vy = (particle.vy + (start.y + end.y) * dt * 0.5) * Math.exp(-clamp(settings.drag, 0, 2) * dt);
  const speed = Math.hypot(particle.vx, particle.vy);
  if (speed > 1.8) { particle.vx *= 1.8 / speed; particle.vy *= 1.8 / speed; }
  if (particle.x < 0 || particle.x > 1 || particle.y < 0 || particle.y > 1) {
    particle.x = wrapUnit(particle.x);
    particle.y = wrapUnit(particle.y);
  }
  return particle;
}

/** Damped circular wave superposition; sources with opposite phase cancel. */
export function sampleInterference(x, y, time, sources, settings) {
  const wavelength = clamp(settings.wavelength, 0.015, 1);
  const frequency = clamp(settings.frequency, 0, 4);
  const decay = clamp(settings.decay, 0, 10);
  const speed = clamp(settings.speed, 0, 4);
  const omegaTime = time * frequency * speed * Math.PI * 2;
  let value = 0;
  for (const source of sources.slice(0, 4)) {
    const distance = Math.hypot(x - source.x, y - source.y);
    const attenuation = Math.exp(-distance * decay);
    const phase = distance / wavelength * Math.PI * 2 - omegaTime + source.phase + settings.phaseOffset * Math.PI / 180;
    value += settings.amplitude * attenuation * Math.sin(phase);
  }
  return value;
}

/** Smooth seeded vector field with a directional current and local vortices. */
export function flowVelocity(x, y, time, settings, pointer = null) {
  const scale = clamp(settings.spatialScale, 0.2, 8) * Math.PI * 2;
  const phase = x * scale + Math.sin(y * scale * 0.73 + time * 0.18) * 0.8;
  const angle = settings.rotation + settings.turbulence * (
    Math.sin(y * scale + time * 0.42) * 0.58 + Math.cos(x * scale * 0.78 - time * 0.31) * 0.42
  );
  let vx = Math.cos(angle) * settings.strength;
  let vy = Math.sin(angle) * settings.strength;
  const vortex = Math.sin(phase + time * 0.14) * settings.turbulence * settings.strength * 0.42;
  vx += -Math.sin(y * scale + time * 0.2) * vortex;
  vy += Math.cos(x * scale - time * 0.17) * vortex;
  if (pointer?.active && settings.pointerInfluence > 0) {
    const dx = x - pointer.x;
    const dy = y - pointer.y;
    const radius = Math.max(0.01, settings.influenceRadius);
    const weight = Math.exp(-0.5 * (dx * dx + dy * dy) / (radius * radius)) * settings.pointerInfluence;
    vx += -dy / radius * settings.strength * weight;
    vy += dx / radius * settings.strength * weight;
  }
  if (settings.boundary === 'reflect') {
    const edge = 0.012;
    if ((x <= edge && vx < 0) || (x >= 1 - edge && vx > 0)) vx = -vx;
    if ((y <= edge && vy < 0) || (y >= 1 - edge && vy > 0)) vy = -vy;
  }
  return { x: clamp(vx, -1.2, 1.2), y: clamp(vy, -1.2, 1.2) };
}

/** Midpoint/RK2 advection with selectable wrap or reflective boundaries.
 * @param {null | {x:number,y:number,active:boolean}} [pointer]
 */
export function stepFlowParticle(particle, delta, time, settings, pointer = null) {
  const dt = clamp(delta, 0, 0.04) * clamp(settings.timeSpeed, 0, 2);
  if (dt === 0) return particle;
  const start = flowVelocity(particle.x, particle.y, time, settings, pointer);
  const midpoint = flowVelocity(particle.x + start.x * dt * 0.5, particle.y + start.y * dt * 0.5, time + dt * 0.5, settings, pointer);
  particle.x += midpoint.x * dt;
  particle.y += midpoint.y * dt;
  let velocityX = midpoint.x;
  let velocityY = midpoint.y;
  if (settings.boundary === 'reflect') {
    if (particle.x < 0 || particle.x > 1) { particle.x = clamp(particle.x, 0, 1); velocityX = -velocityX; }
    if (particle.y < 0 || particle.y > 1) { particle.y = clamp(particle.y, 0, 1); velocityY = -velocityY; }
  } else {
    particle.x = wrapUnit(particle.x);
    particle.y = wrapUnit(particle.y);
  }
  particle.vx = velocityX;
  particle.vy = velocityY;
  return particle;
}

/** Create bounded Gray–Scott concentration fields on a toroidal grid. */
export function createReactionState(width, height, seed, pattern = 'center') {
  const w = clamp(Math.round(width), 24, 192);
  const h = clamp(Math.round(height), 24, 144);
  const a = new Float32Array(w * h).fill(1);
  const b = new Float32Array(w * h);
  const random = seededRandom(seed);
  const stamps = pattern === 'scattered' ? 18 : pattern === 'rings' ? 8 : 5;
  for (let stamp = 0; stamp < stamps; stamp += 1) {
    const centerAngle = (stamp - 1) / 4 * Math.PI * 2;
    const centerOffset = pattern === 'center' && stamp > 0 ? 0.12 : 0;
    const ringAngle = stamp / stamps * Math.PI * 2;
    const cx = pattern === 'center' ? w * (0.5 + Math.cos(centerAngle) * centerOffset)
      : pattern === 'rings' ? w * (0.5 + Math.cos(ringAngle) * 0.22) : random() * w;
    const cy = pattern === 'center' ? h * (0.5 + Math.sin(centerAngle) * centerOffset)
      : pattern === 'rings' ? h * (0.5 + Math.sin(ringAngle) * 0.22) : random() * h;
    const radius = pattern === 'center' ? (stamp === 0 ? 6 + random() * 2 : 3 + random() * 1.5) : 2 + random() * 3;
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > radius ** 2) continue;
        const wrappedX = ((x % w) + w) % w;
        const wrappedY = ((y % h) + h) % h;
        const index = wrappedY * w + wrappedX;
        a[index] = pattern === 'center' ? 0.45 + random() * 0.1 : 0.5 + random() * 0.08;
        b[index] = pattern === 'center' ? 0.52 + random() * 0.12 : 0.25 + random() * 0.1;
      }
    }
  }
  return { width: w, height: h, a, b, nextA: new Float32Array(w * h), nextB: new Float32Array(w * h) };
}

/** Advance the Gray–Scott model with a 9-point periodic Laplacian. */
export function stepReaction(state, settings, requestedSteps = 1) {
  const { width, height } = state;
  const steps = clamp(Math.floor(requestedSteps), 0, 4);
  const feed = clamp(settings.feed, 0.01, 0.08);
  const kill = clamp(settings.kill, 0.03, 0.08);
  const diffusionA = clamp(settings.diffusionA, 0.05, 1.5);
  const diffusionB = clamp(settings.diffusionB, 0.02, 1);
  for (let step = 0; step < steps; step += 1) {
    const currentA = state.a;
    const currentB = state.b;
    const nextA = state.nextA;
    const nextB = state.nextB;
    for (let y = 0; y < height; y += 1) {
      const north = ((y - 1 + height) % height) * width;
      const south = ((y + 1) % height) * width;
      const row = y * width;
      for (let x = 0; x < width; x += 1) {
        const west = (x - 1 + width) % width;
        const east = (x + 1) % width;
        const index = row + x;
        const a = currentA[index];
        const b = currentB[index];
        const lapA = -a + (currentA[row + west] + currentA[row + east] + currentA[north + x] + currentA[south + x]) * 0.2
          + (currentA[north + west] + currentA[north + east] + currentA[south + west] + currentA[south + east]) * 0.05;
        const lapB = -b + (currentB[row + west] + currentB[row + east] + currentB[north + x] + currentB[south + x]) * 0.2
          + (currentB[north + west] + currentB[north + east] + currentB[south + west] + currentB[south + east]) * 0.05;
        const reaction = a * b * b;
        nextA[index] = clamp(a + (diffusionA * lapA - reaction + feed * (1 - a)) * 0.82, 0, 1);
        nextB[index] = clamp(b + (diffusionB * lapB + reaction - (feed + kill) * b) * 0.82, 0, 1);
      }
    }
    state.a = nextA;
    state.b = nextB;
    state.nextA = currentA;
    state.nextB = currentB;
  }
  return state;
}

/** Brush directly changes A/B concentrations, so the reaction evolves from it. */
export function applyReactionBrush(state, x, y, radius, intensity) {
  const centerX = clamp(x, 0, 1) * state.width;
  const centerY = clamp(y, 0, 1) * state.height;
  const radiusX = Math.max(1, clamp(radius, 0.005, 0.2) * state.width);
  const radiusY = Math.max(1, clamp(radius, 0.005, 0.2) * state.height);
  const force = clamp(intensity, 0, 1);
  for (let py = Math.max(0, Math.floor(centerY - radiusY)); py < Math.min(state.height, Math.ceil(centerY + radiusY)); py += 1) {
    for (let px = Math.max(0, Math.floor(centerX - radiusX)); px < Math.min(state.width, Math.ceil(centerX + radiusX)); px += 1) {
      const distance = ((px - centerX) / radiusX) ** 2 + ((py - centerY) / radiusY) ** 2;
      if (distance > 1) continue;
      const index = py * state.width + px;
      const deposit = force * Math.exp(-distance * 3);
      state.b[index] = clamp(state.b[index] + deposit * 0.65, 0, 1);
      state.a[index] = clamp(state.a[index] - deposit * 0.25, 0, 1);
    }
  }
  return state;
}
