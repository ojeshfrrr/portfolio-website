'use client';

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { sampleRadialImpulse } from './lab-physics.mjs';
import type { LightSettings, SignalSettings } from './lab-model';

export type CanvasStageProps = {
  mode: 'light' | 'signal';
  motion: boolean;
  seed: number;
  resetKey: number;
  settings: LightSettings | SignalSettings;
};

type Point = { x: number; y: number; targetX: number; targetY: number; active: boolean };
type Disturbance = { x: number; y: number; time: number; impulse: number };
type Size = { width: number; height: number; ratio: number };
type LightBuffer = { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D; image: ImageData };

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const seeded = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

function ensureLightBuffer(bufferRef: { current: LightBuffer | null }, size: Size) {
  const bufferWidth = Math.max(1, Math.min(360, Math.round(size.width * size.ratio * 0.4)));
  const bufferHeight = Math.max(1, Math.round(bufferWidth * size.height / size.width));
  let buffer = bufferRef.current;
  if (!buffer) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return null;
    buffer = { canvas, context, image: context.createImageData(bufferWidth, bufferHeight) };
    bufferRef.current = buffer;
  }
  if (buffer.canvas.width !== bufferWidth || buffer.canvas.height !== bufferHeight) {
    buffer.canvas.width = bufferWidth;
    buffer.canvas.height = bufferHeight;
    buffer.image = buffer.context.createImageData(bufferWidth, bufferHeight);
  }
  return buffer;
}

function paintLightField(
  current: CanvasStageProps,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  size: Size,
  point: Point,
  time: number,
  delta: number,
  bufferRef: { current: LightBuffer | null },
) {
  const settings = current.settings as LightSettings;
  if (current.motion && delta > 0) {
    const response = Math.max(0.1, settings.response);
    const follow = 1 - Math.exp(-response * delta);
    point.x += (point.targetX - point.x) * follow;
    point.y += (point.targetY - point.y) * follow;
  } else if (!current.motion) {
    point.x = point.targetX;
    point.y = point.targetY;
  }

  const buffer = ensureLightBuffer(bufferRef, size);
  if (!buffer) return;
  const { image } = buffer;
  const data = image.data;
  const count = Math.max(1, Math.round(settings.layers));
  const intensity = settings.intensity / 68;
  const exposure = settings.exposure;
  const contrast = settings.contrast;
  const warmth = settings.warmth / 100;
  const sourceX = settings.sourceX / 100;
  const sigma = 0.026 + settings.bandWidth / 100 * 0.27;
  const horizontalSpread = 0.13 + settings.horizontalSpread / 100 * 0.72;
  const verticalFalloff = 0.55 + (1 - settings.verticalSpread / 100) * 1.9;
  const darkness = settings.darkness / 100;
  const elapsedPhase = time * (settings.temporalFrequency * Math.PI * 2 + settings.flowSpeed * settings.flowDirection);
  const pointerRadiusX = Math.max(0.02, settings.pointerRadius / size.width);
  const pointerRadiusY = Math.max(0.02, settings.pointerRadius / size.height);

  for (let yIndex = 0; yIndex < image.height; yIndex += 1) {
    const y = yIndex / Math.max(1, image.height - 1);
    const vertical = Math.exp(-y * verticalFalloff);
    for (let xIndex = 0; xIndex < image.width; xIndex += 1) {
      const x = xIndex / Math.max(1, image.width - 1);
      const dx = (x - point.x) / pointerRadiusX;
      const dy = (y - point.y) / pointerRadiusY;
      const pointerField = point.active ? Math.exp(-0.5 * (dx * dx + dy * dy)) * settings.pointerInfluence : 0;
      const localX = x + (point.x - x) * pointerField * 0.12;
      const wash = 0.18 * Math.exp(-Math.max(0, localX - sourceX) / horizontalSpread) * vertical;
      let illumination = wash;

      for (let layer = 0; layer < count; layer += 1) {
        const centeredLayer = count === 1 ? 0 : layer / (count - 1) - 0.5;
        const seedOffset = seeded(current.seed + layer * 31) * Math.PI * 2;
        const slowFlow = Math.sin(elapsedPhase + seedOffset + y * settings.spatialFrequency * 2.1);
        const fineFlow = Math.sin(y * settings.noiseScale * 9 + time * settings.temporalFrequency * 1.9 + seedOffset);
        const turbulence = Math.sin(y * settings.spatialFrequency * 11 + time * settings.flowSpeed * 1.7 + seedOffset * 2.7);
        const warp = slowFlow * settings.distortion / 100 * 0.038
          + fineFlow * settings.noiseAmplitude * 0.019
          + turbulence * settings.turbulence / 100 * 0.014;
        const center = sourceX + centeredLayer * settings.bandWidth / 100 * 1.75 + warp;
        const distance = (localX - center) / sigma;
        const ribbon = Math.exp(-0.5 * distance * distance * Math.max(0.25, settings.falloff / 10));
        const weight = (0.18 + seeded(current.seed + layer * 7) * 0.045) * (1 - Math.abs(centeredLayer) * 0.2);
        illumination += ribbon * vertical * weight;
      }

      const floor = (1 - darkness) * 0.12;
      let light = clamp((floor + illumination * intensity * exposure) * 0.82, 0, 1);
      light = clamp((light - 0.5) * contrast + 0.5, 0, 1);
      // A restrained seed-dependent amber bias keeps regenerated fields reproducible.
      const amber = warmth * (0.72 + seeded(current.seed) * 0.28);
      const offset = (yIndex * image.width + xIndex) * 4;
      data[offset] = Math.round(7 + light * 224);
      data[offset + 1] = Math.round(4 + light * (8 + amber * 66));
      data[offset + 2] = Math.round(5 + light * (8 + amber * 32));
      data[offset + 3] = 255;
    }
  }

  buffer.context.putImageData(image, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(buffer.canvas, 0, 0, canvas.width, canvas.height);
}

function paintSignalField(
  current: CanvasStageProps,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  size: Size,
  point: Point,
  time: number,
  disturbances: Disturbance[],
) {
  const settings = current.settings as SignalSettings;
  const { width, height, ratio } = size;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#090a0c';
  ctx.fillRect(0, 0, width, height);
  const wash = ctx.createLinearGradient(0, 0, width * 0.84, height * 0.18);
  const brightness = clamp(settings.brightness / 100, 0, 1);
  wash.addColorStop(0, `rgba(133, 9, 18, ${0.48 * brightness})`);
  wash.addColorStop(0.43, `rgba(67, 8, 15, ${0.28 * brightness})`);
  wash.addColorStop(1, 'rgba(5, 6, 8, 0)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);

  const lineCount = clamp(Math.round(settings.density), 8, 100);
  const spacing = height / (lineCount + 1);
  const startX = width * (0.5 - settings.extent / 200);
  const endX = width - startX;
  const phaseBase = settings.phaseOffset * Math.PI / 180 + current.seed * 0.00091;
  const ageLimit = Math.max(0.25, settings.momentumPersistence * 7);
  const liveDisturbances = disturbances.filter(item => time - item.time <= ageLimit);
  ctx.lineWidth = Math.max(0.55, 0.72 * ratio);

  for (let line = 0; line < lineCount; line += 1) {
    const baseY = spacing * (line + 1);
    const lineTone = seeded(current.seed + line * 17);
    const alpha = (0.13 + lineTone * 0.13) * (0.25 + brightness * 0.75);
    const fade = settings.edgeFade / 100 * 0.28;
    const gradient = ctx.createLinearGradient(startX, 0, endX, 0);
    gradient.addColorStop(0, `rgba(190, 93, 58, ${alpha * fade})`);
    gradient.addColorStop(Math.max(0.02, fade), `rgba(193, 105, 68, ${alpha})`);
    gradient.addColorStop(0.5, `rgba(222, 143, 91, ${alpha * 1.08})`);
    gradient.addColorStop(1 - Math.max(0.02, fade), `rgba(193, 105, 68, ${alpha})`);
    gradient.addColorStop(1, `rgba(190, 93, 58, ${alpha * fade})`);
    ctx.strokeStyle = gradient;
    ctx.beginPath();

    const steps = clamp(Math.round(width / 8), 64, 140);
    for (let step = 0; step <= steps; step += 1) {
      const u = step / steps;
      const x = startX + (endX - startX) * u;
      const along = x - startX;
      const wavePhase = along / Math.max(24, settings.wavelength) * Math.PI * 2 + phaseBase + line * 0.19;
      const baseline = (u - 0.5) * (endX - startX) * Math.tan(settings.baselineDirection * Math.PI / 180);
      const arch = Math.sin(u * Math.PI) * settings.curvature / 100 * height * 0.045;
      const ambient = Math.sin(wavePhase - time * settings.frequency * Math.PI * 2) * settings.amplitude;
      const turbulence = Math.sin(along / 31 + line * 0.71 + time * 0.83 + current.seed * 0.002)
        * settings.turbulence * settings.amplitude * 0.42;
      let impulseDisplacement = 0;
      for (const impulse of liveDisturbances) {
        const distance = Math.hypot(x - impulse.x * width, baseY - impulse.y * height);
        impulseDisplacement += sampleRadialImpulse(distance, time - impulse.time, impulse.impulse, settings);
      }
      if (!current.motion && point.active) {
        const distance = Math.hypot(x - point.x * width, baseY - point.y * height);
        const local = Math.exp(-0.5 * (distance / Math.max(1, settings.influenceRadius)) ** 2);
        impulseDisplacement += (point.y * height - baseY) * local * settings.forceStrength / 100 * 0.18;
      }
      const y = baseY + baseline + arch + ambient + turbulence + clamp(impulseDisplacement, -settings.amplitude * 2.8, settings.amplitude * 2.8);
      if (step === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const vignette = ctx.createLinearGradient(0, height * 0.66, 0, height);
  vignette.addColorStop(0, 'rgba(5, 6, 8, 0)');
  vignette.addColorStop(1, 'rgba(4, 5, 6, .46)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, height * 0.66, width, height * 0.34);
}

function paintFrame(
  delta: number,
  current: CanvasStageProps,
  context: CanvasRenderingContext2D | null,
  canvas: HTMLCanvasElement | null,
  size: Size,
  point: Point,
  timeRef: { current: number },
  disturbancesRef: { current: Disturbance[] },
  bufferRef: { current: LightBuffer | null },
) {
  if (!context || !canvas || !size.width || !size.height) return;
  const deltaSeconds = clamp(delta, 0, 0.05);
  timeRef.current += current.motion ? deltaSeconds : 0;
  if (current.mode === 'light') {
    paintLightField(current, context, canvas, size, point, timeRef.current, deltaSeconds, bufferRef);
  } else {
    paintSignalField(current, context, canvas, size, point, timeRef.current, disturbancesRef.current);
  }
}

/** A route-local 2D canvas. It owns one RAF only while its experiment is active. */
export default function CanvasStage(props: CanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const lastFrameRef = useRef(0);
  const timeRef = useRef(0);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useRef<Size>({ width: 0, height: 0, ratio: 1 });
  const pointRef = useRef<Point>({ x: 0.28, y: 0.5, targetX: 0.28, targetY: 0.5, active: false });
  const previousPointerRef = useRef<{ x: number; y: number } | null>(null);
  const disturbancesRef = useRef<Disturbance[]>([]);
  const bufferRef = useRef<LightBuffer | null>(null);
  const propsRef = useRef(props);
  const draw = useCallback((delta: number) => paintFrame(
    delta,
    propsRef.current,
    contextRef.current,
    canvasRef.current,
    sizeRef.current,
    pointRef.current,
    timeRef,
    disturbancesRef,
    bufferRef,
  ), []);

  useLayoutEffect(() => {
    propsRef.current = props;
    if (!props.motion) draw(0);
  }, [draw, props]);

  useEffect(() => {
    disturbancesRef.current = [];
    previousPointerRef.current = null;
    const sourceX = propsRef.current.mode === 'light' ? (propsRef.current.settings as LightSettings).sourceX / 100 : 0.5;
    pointRef.current = { x: sourceX, y: 0.5, targetX: sourceX, targetY: 0.5, active: false };
    timeRef.current = 0;
    draw(0);
  }, [draw, props.resetKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: false, desynchronized: true });
    if (!canvas || !context) return;
    contextRef.current = context;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      const width = Math.max(1, Math.round(rect.width * ratio));
      const height = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      sizeRef.current = { width: rect.width, height: rect.height, ratio };
      draw(0);
    };

    const pointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const rect = canvas.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      const point = pointRef.current;
      point.targetX = x;
      point.targetY = y;
      point.active = true;

      const current = propsRef.current;
      if (current.mode === 'signal') {
        const previous = previousPointerRef.current;
        if (previous) {
          const settings = current.settings as SignalSettings;
          const distance = Math.hypot((x - previous.x) * rect.width, (y - previous.y) * rect.height);
          if (distance > 1.5) {
            const impulse = distance * settings.forceStrength / 100 * settings.sensitivity * 0.58;
            disturbancesRef.current.push({ x, y, time: timeRef.current, impulse: clamp(impulse, 0, 90) });
            if (disturbancesRef.current.length > 8) disturbancesRef.current.splice(0, disturbancesRef.current.length - 8);
          }
        }
        previousPointerRef.current = { x, y };
      }
      if (!current.motion) draw(0);
    };
    const pointerLeave = () => {
      pointRef.current.active = false;
      pointRef.current.targetX = propsRef.current.mode === 'light'
        ? (propsRef.current.settings as LightSettings).sourceX / 100
        : 0.5;
      pointRef.current.targetY = 0.5;
      previousPointerRef.current = null;
      if (!propsRef.current.motion) draw(0);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener('pointermove', pointerMove, { passive: true });
    canvas.addEventListener('pointerleave', pointerLeave, { passive: true });
    resize();

    return () => {
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerleave', pointerLeave);
      contextRef.current = null;
      bufferRef.current = null;
      disturbancesRef.current = [];
    };
  }, [draw]);

  useEffect(() => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    lastFrameRef.current = 0;
    if (!props.motion || document.visibilityState === 'hidden') {
      draw(0);
      return;
    }

    const tick = (timestamp: number) => {
      frameRef.current = 0;
      if (document.visibilityState === 'hidden') return;
      if (timestamp - lastFrameRef.current >= 1000 / 30) {
        const elapsed = lastFrameRef.current ? Math.min(timestamp - lastFrameRef.current, 50) : 0;
        lastFrameRef.current = timestamp;
        draw(elapsed / 1000);
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    const onVisibilityChange = () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
      if (document.visibilityState === 'hidden') return;
      lastFrameRef.current = 0;
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [draw, props.motion]);

  return <canvas
    aria-label={props.mode === 'light' ? 'Layered scarlet and amber light field' : 'Fine contours carrying damped pointer impulses'}
    className="lab-canvas"
    ref={canvasRef}
    role="img"
  />;
}
