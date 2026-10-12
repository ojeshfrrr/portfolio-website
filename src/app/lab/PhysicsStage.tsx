'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  applyReactionBrush, createFlowParticles, createGravityParticles, createReactionState,
  sampleInterference, stepFlowParticle, stepGravityParticle, stepReaction,
} from './lab-physics.mjs';
import type { FieldPoint, FlowSettings, GravitySettings, ReactionSettings, WaveSettings, WaveSource } from './lab-model';
import styles from './lab.module.css';

export type PhysicsMode = 'gravity' | 'waves' | 'flow' | 'reaction';
export type PhysicsStageProps = {
  mode: PhysicsMode;
  motion: boolean;
  seed: number;
  resetKey: number;
  settings: GravitySettings | WaveSettings | FlowSettings | ReactionSettings;
  onPositionsChange: (positions: (FieldPoint | WaveSource)[]) => void;
};

type Particle = { x: number; y: number; vx: number; vy: number; phase: number; direction?: number };
type ReactionState = ReturnType<typeof createReactionState>;
type PointerState = { x: number; y: number; active: boolean };
type SourcePosition = FieldPoint | WaveSource;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const visiblePositions = (mode: PhysicsMode, settings: PhysicsStageProps['settings']): SourcePosition[] => {
  if (mode === 'gravity') return (settings as GravitySettings).attractors.slice(0, (settings as GravitySettings).attractorCount);
  if (mode === 'waves') return (settings as WaveSettings).sources.slice(0, (settings as WaveSettings).sourceCount);
  return [];
};

function drawGravity(context: CanvasRenderingContext2D, width: number, height: number, settings: GravitySettings, particles: Particle[], positions: SourcePosition[], delta: number, elapsed: number, motion: boolean) {
  const fade = motion ? 0.5 * (1 - settings.trailPersistence) + 0.006 : 1;
  context.fillStyle = `rgba(10, 8, 10, ${fade})`;
  context.fillRect(0, 0, width, height);
  if (motion && delta > 0) for (const particle of particles) stepGravityParticle(particle, delta, { ...settings, attractors: positions as FieldPoint[] });
  for (const particle of particles) {
    const x = particle.x * width;
    const y = particle.y * height;
    const warm = Math.sin(particle.phase + elapsed * 0.4) > 0.25;
    context.fillStyle = warm ? 'rgba(241, 232, 220, .74)' : 'rgba(199, 131, 85, .85)';
    context.beginPath();
    context.arc(x, y, warm ? 1.15 : 1.45, 0, Math.PI * 2);
    context.fill();
  }
  for (const point of positions) {
    const x = point.x * width;
    const y = point.y * height;
    const halo = context.createRadialGradient(x, y, 1, x, y, 36);
    halo.addColorStop(0, 'rgba(199,131,85,.18)');
    halo.addColorStop(1, 'rgba(199,131,85,0)');
    context.fillStyle = halo;
    context.beginPath();
    context.arc(x, y, 36, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = 'rgba(241,232,220,.3)';
    context.lineWidth = 1;
    context.beginPath();
    context.arc(x, y, 5 + Math.sin(elapsed * 0.6) * 0.7, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = '#C78355';
    context.beginPath();
    context.arc(x, y, 1.7, 0, Math.PI * 2);
    context.fill();
  }
}

function drawWaves(context: CanvasRenderingContext2D, width: number, height: number, settings: WaveSettings, positions: SourcePosition[], elapsed: number, buffer: HTMLCanvasElement, bufferContext: CanvasRenderingContext2D, image: ImageData) {
  const imageData = image.data;
  for (let y = 0; y < image.height; y += 1) {
    const v = y / Math.max(1, image.height - 1);
    for (let x = 0; x < image.width; x += 1) {
      const u = x / Math.max(1, image.width - 1);
      const value = sampleInterference(u, v, elapsed * settings.motionSpeed, positions as WaveSource[], settings) * settings.visualizationScale;
      const magnitude = clamp(Math.abs(value) * 0.58, 0, 1);
      const warmSide = value >= 0;
      const index = (y * image.width + x) * 4;
      imageData[index] = warmSide ? 22 + magnitude * (156 - settings.paletteBalance * 22) : 28 + magnitude * 88;
      imageData[index + 1] = warmSide ? 15 + magnitude * 91 : 14 + magnitude * 32;
      imageData[index + 2] = warmSide ? 20 + magnitude * (49 - settings.paletteBalance * 8) : 16 + magnitude * 34;
      imageData[index + 3] = 255;
    }
  }
  bufferContext.putImageData(image, 0, 0);
  context.fillStyle = '#14110f';
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.drawImage(buffer, 0, 0, width, height);
  for (const source of positions) {
    const x = source.x * width;
    const y = source.y * height;
    context.fillStyle = 'rgba(241,232,220,.86)';
    context.beginPath();
    context.arc(x, y, 2.2, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = 'rgba(199,131,85,.55)';
    context.lineWidth = 1;
    context.beginPath();
    context.arc(x, y, 7, 0, Math.PI * 2);
    context.stroke();
  }
}

function drawFlow(context: CanvasRenderingContext2D, width: number, height: number, settings: FlowSettings, particles: Particle[], pointer: PointerState, delta: number, elapsed: number, motion: boolean) {
  const fade = motion ? 0.5 * (1 - settings.trailPersistence) + 0.007 : 1;
  context.fillStyle = `rgba(10, 8, 10, ${fade})`;
  context.fillRect(0, 0, width, height);
  if (motion && delta > 0) {
    for (const particle of particles) stepFlowParticle(particle, delta, elapsed, settings, pointer);
  }
  for (const particle of particles) {
    const shimmer = Math.sin(particle.phase + elapsed * 0.35);
    context.fillStyle = shimmer > 0.4 ? 'rgba(241,232,220,.72)' : 'rgba(199,131,85,.84)';
    context.beginPath();
    context.arc(particle.x * width, particle.y * height, shimmer > 0.7 ? 1.35 : 1, 0, Math.PI * 2);
    context.fill();
  }
  if (pointer.active && settings.pointerInfluence > 0) {
    context.strokeStyle = 'rgba(199,131,85,.24)';
    context.lineWidth = 1;
    context.beginPath();
    context.arc(pointer.x * width, pointer.y * height, settings.influenceRadius * Math.min(width, height), 0, Math.PI * 2);
    context.stroke();
  }
}

function paintReaction(image: ImageData, state: ReactionState, palette: number) {
  const pixels = image.data;
  for (let index = 0; index < state.b.length; index += 1) {
    const amount = clamp(state.b[index] * 2.7 + (1 - state.a[index]) * 0.15, 0, 1);
    const eased = amount * amount * (3 - 2 * amount);
    const offset = index * 4;
    pixels[offset] = Math.round(23 + eased * (132 + palette * 60));
    pixels[offset + 1] = Math.round(14 + eased * (48 + palette * 56));
    pixels[offset + 2] = Math.round(17 + eased * (28 + palette * 30));
    pixels[offset + 3] = 255;
  }
}

export default function PhysicsStage({ mode, motion, seed, resetKey, settings, onPositionsChange }: PhysicsStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef(settings);
  const positionsRef = useRef<SourcePosition[]>(visiblePositions(mode, settings));
  const dragIndexRef = useRef<number | null>(null);
  const pointerRef = useRef<PointerState>({ x: 0.5, y: 0.5, active: false });
  const particlesRef = useRef<Particle[]>([]);
  const reactionRef = useRef<ReactionState | null>(null);
  const elapsedRef = useRef(0);
  const initialisedRef = useRef('');
  const paintPointerRef = useRef(false);
  const repaintRef = useRef<(() => void) | null>(null);
  const reactionAccumulatorRef = useRef(0);

  useLayoutEffect(() => {
    settingsRef.current = settings;
    if (dragIndexRef.current === null) positionsRef.current = visiblePositions(mode, settings);
  }, [mode, settings]);

  const initialSignature = [mode, seed, resetKey,
    mode === 'gravity' ? (settings as GravitySettings).particleCount : '',
    mode === 'flow' ? (settings as FlowSettings).particleCount : '',
    mode === 'reaction' ? `${(settings as ReactionSettings).resolution}:${(settings as ReactionSettings).pattern}` : '',
  ].join(':');

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: false, desynchronized: true });
    if (!canvas || !context) return;
    let width = 1;
    let height = 1;
    let ratio = 1;
    let frame = 0;
    let lastTimestamp = 0;
    const buffer = document.createElement('canvas');
    let bufferContext = buffer.getContext('2d', { alpha: false });
    let image: ImageData | null = null;

    if (initialisedRef.current !== initialSignature) {
      const current = settingsRef.current;
      elapsedRef.current = 0;
      reactionAccumulatorRef.current = 0;
      positionsRef.current = visiblePositions(mode, current);
      if (mode === 'gravity') {
        const values = current as GravitySettings;
        particlesRef.current = createGravityParticles(values.particleCount, seed, values) as Particle[];
      } else if (mode === 'flow') {
        particlesRef.current = createFlowParticles((current as FlowSettings).particleCount, seed) as Particle[];
      } else if (mode === 'reaction') {
        const values = current as ReactionSettings;
        const gridWidth = Math.round(values.resolution);
        const gridHeight = Math.round(gridWidth * 0.62);
        reactionRef.current = createReactionState(gridWidth, gridHeight, seed, values.pattern);
      }
      initialisedRef.current = initialSignature;
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      ratio = Math.min(window.devicePixelRatio || 1, 1.35);
      const pixelWidth = Math.max(1, Math.round(width * ratio));
      const pixelHeight = Math.max(1, Math.round(height * ratio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (mode === 'waves' || mode === 'reaction') {
        const current = settingsRef.current;
        const targetWidth = mode === 'waves' ? 190 : Math.round((current as ReactionSettings).resolution);
        const targetHeight = mode === 'waves' ? 124 : Math.round(targetWidth * 0.62);
        buffer.width = targetWidth;
        buffer.height = targetHeight;
        bufferContext = buffer.getContext('2d', { alpha: false });
        image = bufferContext?.createImageData(targetWidth, targetHeight) ?? null;
      }
      paint(0, 0, false);
    };

    const paint = (delta: number, timestamp: number, advance: boolean) => {
      const current = settingsRef.current;
      const elapsed = elapsedRef.current;
      if (mode === 'gravity') {
        const values = current as GravitySettings;
        const gravitySettings = positionsRef.current === values.attractors ? values : { ...values, attractors: positionsRef.current as FieldPoint[] };
        drawGravity(context, width, height, gravitySettings, particlesRef.current, positionsRef.current, delta, elapsed, advance);
      } else if (mode === 'waves') {
        const values = current as WaveSettings;
        if (bufferContext && image) drawWaves(context, width, height, values, positionsRef.current, elapsed, buffer, bufferContext, image);
      } else if (mode === 'flow') {
        drawFlow(context, width, height, current as FlowSettings, particlesRef.current, pointerRef.current, delta, elapsed, advance);
      } else {
        const values = current as ReactionSettings;
        const state = reactionRef.current;
        if (!state || !bufferContext || !image) return;
        if (advance && delta > 0) {
          const accumulated = reactionAccumulatorRef.current + delta * 60 * values.speed;
          const steps = clamp(Math.floor(accumulated), 0, 4);
          reactionAccumulatorRef.current = accumulated - steps;
          if (steps > 0) stepReaction(state, values, steps);
        }
        paintReaction(image, state, values.palette);
        bufferContext.putImageData(image, 0, 0);
        context.fillStyle = '#14110f';
        context.fillRect(0, 0, width, height);
        context.imageSmoothingEnabled = false;
        context.drawImage(buffer, 0, 0, width, height);
      }
      void timestamp;
    };
    repaintRef.current = () => paint(0, 0, false);

    const tick = (timestamp: number) => {
      frame = 0;
      if (document.visibilityState === 'hidden') return;
      const delta = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.04) : 0;
      lastTimestamp = timestamp;
      if (motion) {
        elapsedRef.current += delta;
        paint(delta, timestamp, true);
        frame = requestAnimationFrame(tick);
      }
    };
    const start = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTimestamp = 0;
      if (motion && document.visibilityState === 'visible') frame = requestAnimationFrame(tick);
      else paint(0, 0, false);
    };
    const visibility = () => start();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    document.addEventListener('visibilitychange', visibility);
    resize();
    start();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      bufferContext = null;
      image = null;
      repaintRef.current = null;
    };
  }, [initialSignature, mode, motion, seed]);

  useEffect(() => {
    if (!motion) repaintRef.current?.();
  }, [mode, motion, settings]);

  const getPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: clamp((event.clientX - rect.left) / rect.width, 0, 1), y: clamp((event.clientY - rect.top) / rect.height, 0, 1) };
  };
  const brush = (point: FieldPoint) => {
    if (mode !== 'reaction' || !reactionRef.current) return;
    const current = settingsRef.current as ReactionSettings;
    applyReactionBrush(reactionRef.current, point.x, point.y, current.brushSize, current.brushIntensity);
    if (!motion) repaintRef.current?.();
  };
  const pointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const point = getPoint(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (mode === 'gravity' || mode === 'waves') {
      const nearest = positionsRef.current.reduce((best, item, index) => {
        const distance = Math.hypot(point.x - item.x, point.y - item.y);
        return distance < best.distance ? { index, distance } : best;
      }, { index: -1, distance: Infinity });
      dragIndexRef.current = nearest.index < 0 ? 0 : nearest.index;
      positionsRef.current = positionsRef.current.map((item, index) => index === dragIndexRef.current ? { ...item, ...point } : item);
      if (!motion) repaintRef.current?.();
    } else if (mode === 'reaction') {
      paintPointerRef.current = true;
      brush(point);
    } else {
      pointerRef.current = { ...point, active: true };
    }
  };
  const pointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const point = getPoint(event);
    if ((mode === 'gravity' || mode === 'waves') && dragIndexRef.current !== null) {
      positionsRef.current = positionsRef.current.map((item, index) => index === dragIndexRef.current ? { ...item, ...point } : item);
      return;
    }
    if (mode === 'reaction' && paintPointerRef.current) { brush(point); return; }
    if (mode === 'flow') { pointerRef.current = { ...point, active: true }; if (!motion) repaintRef.current?.(); }
  };
  const pointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (mode === 'gravity' || mode === 'waves') {
      if (dragIndexRef.current !== null) onPositionsChange(positionsRef.current.map(item => ({ ...item })));
      dragIndexRef.current = null;
    }
    if (mode === 'reaction') paintPointerRef.current = false;
    if (mode === 'flow') pointerRef.current.active = false;
    if (!motion) repaintRef.current?.();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const description = mode === 'gravity' ? 'Particles accelerated by a softened Newtonian field. Drag an attractor to reposition it.'
    : mode === 'waves' ? 'A damped scalar wave field formed by superposition. Drag a source to change the interference pattern.'
      : mode === 'flow' ? 'Seeded particles advected through a smooth procedural vector field. Move the pointer to add a local vortex.'
        : 'A bounded Gray–Scott reaction–diffusion field. Paint B concentration into the simulation with pointer or touch.';

  return <canvas aria-label={description} className={`${styles.physicsCanvas} lab-canvas`} onPointerCancel={pointerUp} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} ref={canvasRef} role="img" />;
}
