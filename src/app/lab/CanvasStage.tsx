'use client';

import { useCallback, useEffect, useRef } from 'react';

export type CanvasStageProps = {
  mode: 'light' | 'signal';
  motion: boolean;
  intensity: number;
  density: number;
  seed: number;
};

type Point = { x: number; y: number; active: boolean };

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

function paintFrame(
  delta: number,
  current: CanvasStageProps,
  context: CanvasRenderingContext2D | null,
  canvas: HTMLCanvasElement | null,
  size: { width: number; height: number; ratio: number },
  point: Point,
  timeRef: { current: number },
) {
  const { width, height, ratio } = size;
  if (!context || !canvas || !width || !height) return;
  timeRef.current += current.motion ? delta : 0;
  const time = timeRef.current;
  const ctx = context;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#090a0c';
  ctx.fillRect(0, 0, width, height);

  const leftWash = ctx.createLinearGradient(0, 0, width * .82, 0);
  leftWash.addColorStop(0, 'rgba(116, 5, 14, .63)');
  leftWash.addColorStop(.28, 'rgba(95, 5, 13, .44)');
  leftWash.addColorStop(.61, 'rgba(42, 7, 13, .22)');
  leftWash.addColorStop(1, 'rgba(5, 6, 8, 0)');
  ctx.fillStyle = leftWash;
  ctx.fillRect(0, 0, width, height);

  const level = current.intensity / 100;
  const phase = time * .24 + current.seed * .00013;
  const ribbons = [
    { x: .10, w: .12, a: .34, offset: 0 },
    { x: .29, w: .16, a: .56, offset: 1.7 },
    { x: .51, w: .14, a: .32, offset: 3.5 },
    { x: .69, w: .11, a: .16, offset: 5.1 },
  ];
  for (const ribbon of ribbons) {
    const pointerDrift = point.active ? (point.x - .5) * width * .035 : 0;
    const drift = current.mode === 'light' ? Math.sin(phase + ribbon.offset) * width * .012 + pointerDrift : 0;
    const center = width * ribbon.x + drift;
    const span = width * ribbon.w;
    const gradient = ctx.createLinearGradient(center - span, 0, center + span, 0);
    const alpha = ribbon.a * level;
    gradient.addColorStop(0, 'rgba(99, 7, 16, 0)');
    gradient.addColorStop(.36, `rgba(170, 10, 23, ${alpha * .35})`);
    gradient.addColorStop(.52, `rgba(218, 31, 38, ${alpha * .48})`);
    gradient.addColorStop(.67, `rgba(127, 12, 21, ${alpha * .28})`);
    gradient.addColorStop(1, 'rgba(55, 8, 15, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(center - span, 0, span * 2, height);
  }

  const verticalTone = ctx.createLinearGradient(0, 0, 0, height);
  verticalTone.addColorStop(0, `rgba(150, 10, 20, ${.17 * level})`);
  verticalTone.addColorStop(.48, 'rgba(55, 4, 10, .08)');
  verticalTone.addColorStop(1, 'rgba(0, 0, 0, .62)');
  ctx.fillStyle = verticalTone;
  ctx.fillRect(0, 0, width, height);

  if (current.mode === 'light') {
    for (let index = 0; index < 2; index += 1) {
      const x = width * (.26 + index * .22) + Math.sin(phase + index * 2.4) * width * .018;
      const shaft = ctx.createLinearGradient(x, 0, x, height);
      shaft.addColorStop(0, `rgba(255, 99, 50, ${.10 * level})`);
      shaft.addColorStop(.54, `rgba(164, 27, 31, ${.05 * level})`);
      shaft.addColorStop(1, 'rgba(36, 4, 9, 0)');
      ctx.fillStyle = shaft;
      ctx.fillRect(x - width * .018, 0, width * .036, height);
    }
  } else {
    const lines = current.density;
    const verticalSpacing = height / (lines + 1);
    const influenceX = point.x * width;
    const influenceY = point.y * height;
    ctx.lineWidth = .7;
    for (let line = 0; line < lines; line += 1) {
      const baseY = verticalSpacing * (line + 1);
      const variation = Math.sin(line * .19 + current.seed * .003) * .5 + .5;
      ctx.strokeStyle = `rgba(${variation > .8 ? '211, 105, 60' : '159, 75, 46'}, ${.12 + variation * .16})`;
      ctx.beginPath();
      const steps = 50;
      for (let step = 0; step <= steps; step += 1) {
        const x = width * step / steps;
        const distanceX = (x - influenceX) / Math.max(width * .28, 1);
        const distanceY = (baseY - influenceY) / Math.max(height * .29, 1);
        const falloff = point.active ? Math.exp(-(distanceX * distanceX + distanceY * distanceY) * 1.6) : 0;
        const ripple = Math.sin(step * .085 + line * .18 + phase + current.seed * .002) * height * .009;
        const displacement = Math.sin((step / steps) * Math.PI * 2 + line * .11 + phase * .42) * height * .018;
        const y = baseY + ripple + displacement + (influenceY - baseY) * falloff * .17;
        if (step === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  const lowerShade = ctx.createLinearGradient(0, height * .64, 0, height);
  lowerShade.addColorStop(0, 'rgba(8, 8, 9, 0)');
  lowerShade.addColorStop(1, 'rgba(4, 5, 6, .56)');
  ctx.fillStyle = lowerShade;
  ctx.fillRect(0, height * .64, width, height * .36);
}

/** A small, route-local 2D canvas. It owns one RAF only while its study is active. */
export default function CanvasStage(props: CanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const lastFrameRef = useRef(0);
  const timeRef = useRef(0);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useRef({ width: 0, height: 0, ratio: 1 });
  const pointRef = useRef<Point>({ x: 0.64, y: 0.54, active: false });
  const propsRef = useRef(props);
  const draw = useCallback((delta: number) => paintFrame(
    delta,
    propsRef.current,
    contextRef.current,
    canvasRef.current,
    sizeRef.current,
    pointRef.current,
    timeRef,
  ), []);

  useEffect(() => {
    propsRef.current = props;
  }, [props]);

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
      pointRef.current = {
        x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
        y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
        active: true,
      };
      if (!propsRef.current.motion) draw(0);
    };
    const pointerLeave = () => {
      pointRef.current.active = false;
      if (!propsRef.current.motion) draw(0);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener('pointermove', pointerMove, { passive: true });
    canvas.addEventListener('pointerleave', pointerLeave, { passive: true });
    resize();

    return () => {
      cancelAnimationFrame(frameRef.current);
      observer?.disconnect();
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerleave', pointerLeave);
      contextRef.current = null;
    };
  }, [draw]);

  useEffect(() => {
    cancelAnimationFrame(frameRef.current);
    lastFrameRef.current = 0;
    if (!props.motion || document.visibilityState === 'hidden') {
      draw(0);
      return;
    }

    const animate = () => {
      if (frameRef.current) return;
      frameRef.current = requestAnimationFrame(tick);
    };
    const tick = (timestamp: number) => {
      frameRef.current = 0;
      if (document.visibilityState === 'hidden') return;
      // Cap this decorative canvas at 30fps; scroll and input remain on the browser's
      // normal rendering path and no React updates occur per frame.
      if (timestamp - lastFrameRef.current >= 1000 / 30) {
        const elapsed = lastFrameRef.current ? Math.min(timestamp - lastFrameRef.current, 50) : 0;
        lastFrameRef.current = timestamp;
        draw(elapsed / 1000);
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      } else {
        lastFrameRef.current = 0;
        animate();
      }
    };
    animate();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [draw, props.motion, props.mode, props.intensity, props.density, props.seed]);

  return <canvas
    aria-label={props.mode === 'light' ? 'Animated scarlet and amber light ribbons' : 'Interactive field of fine contours'}
    className="lab-canvas"
    ref={canvasRef}
    role="img"
  />;
}
