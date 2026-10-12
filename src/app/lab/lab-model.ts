export type ArtExperiment = 'light' | 'type' | 'signal' | 'gravity' | 'waves' | 'flow' | 'reaction';
export type Alignment = 'left' | 'center' | 'right';
export type Grouping = 'word' | 'character';
export type RevealStyle = 'unfold' | 'lift';
export type RevealDirection = 'left' | 'right' | 'up' | 'down';

export type LightSettings = {
  intensity: number; exposure: number; contrast: number; warmth: number; sourceX: number;
  bandWidth: number; verticalSpread: number; horizontalSpread: number; falloff: number; layers: number;
  darkness: number; flowSpeed: number; flowDirection: number; distortion: number; turbulence: number;
  spatialFrequency: number; temporalFrequency: number; noiseScale: number; noiseAmplitude: number;
  pointerInfluence: number; pointerRadius: number; response: number;
};

export type SignalSettings = {
  density: number; amplitude: number; wavelength: number; phaseOffset: number; curvature: number;
  baselineDirection: number; edgeFade: number; extent: number; forceStrength: number; influenceRadius: number;
  mass: number; stiffness: number; damping: number; momentumPersistence: number; rippleSpeed: number;
  frequency: number; waveDecay: number; turbulence: number; sensitivity: number; brightness: number;
};

export type TypeSettings = {
  phrase: string; fontSize: number; letterSpacing: number; wordSpacing: number; lineSpacing: number;
  maxWidth: number; alignment: Alignment; grouping: Grouping; reveal: RevealStyle; revealDuration: number;
  stagger: number; direction: RevealDirection; repeat: boolean; mass: number; stiffness: number;
  damping: number; impulse: number; returnToRest: boolean; pointerInfluence: number; pointerRadius: number;
};

export type FieldPoint = { x: number; y: number };
export type WaveSource = FieldPoint & { phase: number };
export type GravitySettings = {
  strength: number; attractorCount: number; attractorMass: number; particleCount: number;
  initialVelocity: number; orbitalBias: number; drag: number; trailPersistence: number;
  softening: number; attractors: FieldPoint[];
};
export type WaveSettings = {
  sourceCount: number; amplitude: number; wavelength: number; frequency: number;
  phaseOffset: number; speed: number; decay: number; visualizationScale: number;
  paletteBalance: number; motionSpeed: number; sources: WaveSource[];
};
export type FlowSettings = {
  particleCount: number; strength: number; spatialScale: number; rotation: number;
  turbulence: number; timeSpeed: number; trailPersistence: number;
  pointerInfluence: number; influenceRadius: number; boundary: 'wrap' | 'reflect';
};
export type ReactionSettings = {
  feed: number; kill: number; diffusionA: number; diffusionB: number; speed: number;
  brushSize: number; brushIntensity: number; palette: number; resolution: number;
  pattern: 'center' | 'scattered' | 'rings';
};

export type NewExperiment = 'gravity' | 'waves' | 'flow' | 'reaction';
export type NewExperimentSettings = GravitySettings | WaveSettings | FlowSettings | ReactionSettings;

export const defaultLight: LightSettings = {
  intensity: 68, exposure: 1.1, contrast: 1.1, warmth: 34, sourceX: 28, bandWidth: 16,
  verticalSpread: 58, horizontalSpread: 74, falloff: 22, layers: 4, darkness: 78,
  flowSpeed: 0.42, flowDirection: 1, distortion: 26, turbulence: 34, spatialFrequency: 1.8,
  temporalFrequency: 0.32, noiseScale: 1.7, noiseAmplitude: 0.24, pointerInfluence: 0.58,
  pointerRadius: 180, response: 8,
};

export const defaultSignal: SignalSettings = {
  density: 46, amplitude: 22, wavelength: 188, phaseOffset: 14, curvature: 42,
  baselineDirection: 5, edgeFade: 42, extent: 96, forceStrength: 62, influenceRadius: 145,
  mass: 1.4, stiffness: 16, damping: 2.8, momentumPersistence: 0.82, rippleSpeed: 1,
  frequency: 1.15, waveDecay: 0.3, turbulence: 0.18, sensitivity: 1.1, brightness: 68,
};

export const defaultType: TypeSettings = {
  phrase: 'Good ideas\nneed a surface.', fontSize: 78, letterSpacing: 0, wordSpacing: 3,
  lineSpacing: 1, maxWidth: 760, alignment: 'left', grouping: 'word', reveal: 'unfold',
  revealDuration: 620, stagger: 38, direction: 'left', repeat: false, mass: 1.4,
  stiffness: 70, damping: 16, impulse: 54, returnToRest: true, pointerInfluence: 0.82,
  pointerRadius: 230,
};

export const defaultGravity: GravitySettings = {
  strength: 0.009, attractorCount: 1, attractorMass: 1.35, particleCount: 220,
  initialVelocity: 0.26, orbitalBias: 0.82, drag: 0.025, trailPersistence: 0.92,
  softening: 0.035, attractors: [{ x: 0.5, y: 0.52 }, { x: 0.73, y: 0.48 }, { x: 0.28, y: 0.51 }],
};

export const defaultWaves: WaveSettings = {
  sourceCount: 2, amplitude: 0.82, wavelength: 0.14, frequency: 0.48, phaseOffset: 0,
  speed: 0.7, decay: 2.4, visualizationScale: 1, paletteBalance: 0.45, motionSpeed: 0.55,
  sources: [{ x: 0.38, y: 0.48, phase: 0 }, { x: 0.64, y: 0.52, phase: 0 }],
};

export const defaultFlow: FlowSettings = {
  particleCount: 420, strength: 0.28, spatialScale: 2.1, rotation: -0.34,
  turbulence: 0.62, timeSpeed: 0.56, trailPersistence: 0.88,
  pointerInfluence: 0.72, influenceRadius: 0.2, boundary: 'wrap',
};

export const defaultReaction: ReactionSettings = {
  feed: 0.0367, kill: 0.0649, diffusionA: 1, diffusionB: 0.5, speed: 0.72,
  brushSize: 0.035, brushIntensity: 0.8, palette: 0.52, resolution: 112, pattern: 'center',
};

export const experimentPresets = {
  light: [
    { id: 'studio', label: 'Studio light', values: defaultLight },
    { id: 'quiet', label: 'Quiet current', values: { ...defaultLight, intensity: 48, warmth: 20, flowSpeed: 0.18, turbulence: 18, pointerInfluence: 0.34, darkness: 86 } },
    { id: 'ember', label: 'Ember bands', values: { ...defaultLight, intensity: 83, warmth: 72, bandWidth: 24, layers: 5, flowSpeed: 0.64, distortion: 42, pointerInfluence: 0.76 } },
  ],
  signal: [
    { id: 'signal', label: 'Amber signal', values: defaultSignal },
    { id: 'fine', label: 'Fine interference', values: { ...defaultSignal, density: 68, amplitude: 12, wavelength: 128, influenceRadius: 105, stiffness: 28, damping: 4.6, turbulence: 0.08 } },
    { id: 'elastic', label: 'Elastic field', values: { ...defaultSignal, density: 38, amplitude: 34, influenceRadius: 230, mass: 2.2, stiffness: 10, damping: 1.8, momentumPersistence: 0.94, rippleSpeed: 1.4 } },
  ],
  type: [
    { id: 'type', label: 'Soft matter', values: defaultType },
    { id: 'paper', label: 'Paper lift', values: { ...defaultType, grouping: 'word', reveal: 'lift', direction: 'up', mass: 0.8, stiffness: 96, damping: 24, impulse: 28, pointerInfluence: 0.56 } },
    { id: 'heavy', label: 'Heavy type', values: { ...defaultType, grouping: 'character', fontSize: 68, mass: 2.8, stiffness: 42, damping: 9, impulse: 82, pointerInfluence: 1, pointerRadius: 290 } },
  ],
  gravity: [
    { id: 'orbit', label: 'Orbit', values: defaultGravity },
    { id: 'collapse', label: 'Collapse', values: { ...defaultGravity, strength: 0.015, attractorMass: 1.8, initialVelocity: 0.11, orbitalBias: 0.12, drag: 0.08, trailPersistence: 0.95 } },
    { id: 'slingshot', label: 'Slingshot', values: { ...defaultGravity, strength: 0.012, attractorCount: 2, initialVelocity: 0.52, orbitalBias: 0.42, softening: 0.05 } },
    { id: 'binary', label: 'Binary', values: { ...defaultGravity, attractorCount: 2, attractorMass: 1.1, initialVelocity: 0.34, orbitalBias: 0.95, attractors: [{ x: 0.39, y: 0.5 }, { x: 0.61, y: 0.5 }, { x: 0.28, y: 0.51 }] } },
    { id: 'drift', label: 'Slow drift', values: { ...defaultGravity, strength: 0.004, initialVelocity: 0.1, orbitalBias: 0.6, drag: 0.04, trailPersistence: 0.84 } },
  ],
  waves: [
    { id: 'single', label: 'Single source', values: { ...defaultWaves, sourceCount: 1 } },
    { id: 'twin', label: 'Twin waves', values: defaultWaves },
    { id: 'grid', label: 'Interference grid', values: { ...defaultWaves, sourceCount: 3, sources: [{ x: 0.31, y: 0.34, phase: 0 }, { x: 0.68, y: 0.36, phase: 0 }, { x: 0.5, y: 0.69, phase: 0 }], wavelength: 0.11, decay: 1.4 } },
    { id: 'phase', label: 'Phase shift', values: { ...defaultWaves, phaseOffset: 180, sources: [{ x: 0.38, y: 0.48, phase: 0 }, { x: 0.64, y: 0.52, phase: Math.PI }] } },
    { id: 'quiet', label: 'Quiet ripples', values: { ...defaultWaves, amplitude: 0.48, frequency: 0.24, speed: 0.36, decay: 3.6, motionSpeed: 0.25 } },
  ],
  flow: [
    { id: 'streamline', label: 'Streamline', values: defaultFlow },
    { id: 'vortex', label: 'Vortex', values: { ...defaultFlow, rotation: 1.55, spatialScale: 1.25, turbulence: 0.22, strength: 0.31 } },
    { id: 'turbulent', label: 'Turbulent', values: { ...defaultFlow, spatialScale: 3.4, turbulence: 1, strength: 0.36, trailPersistence: 0.91 } },
    { id: 'slow', label: 'Slow drift', values: { ...defaultFlow, strength: 0.12, timeSpeed: 0.25, turbulence: 0.28, trailPersistence: 0.94 } },
    { id: 'amber', label: 'Amber current', values: { ...defaultFlow, strength: 0.42, rotation: 0.7, spatialScale: 1.7, pointerInfluence: 1, trailPersistence: 0.9 } },
  ],
  reaction: [
    { id: 'coral', label: 'Coral', values: defaultReaction },
    { id: 'branching', label: 'Branching', values: { ...defaultReaction, feed: 0.0545, kill: 0.062, pattern: 'scattered', speed: 0.82 } },
    { id: 'cells', label: 'Cell structures', values: { ...defaultReaction, feed: 0.035, kill: 0.06, pattern: 'rings', diffusionB: 0.52 } },
    { id: 'grain', label: 'Fine grain', values: { ...defaultReaction, feed: 0.026, kill: 0.055, resolution: 144, pattern: 'scattered', brushSize: 0.022 } },
    { id: 'edge', label: 'Unstable edge', values: { ...defaultReaction, feed: 0.046, kill: 0.064, pattern: 'rings', speed: 0.94, palette: 0.82 } },
  ],
} as const;
