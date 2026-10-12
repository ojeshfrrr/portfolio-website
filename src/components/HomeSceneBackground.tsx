'use client';

import { useEffect, useRef } from 'react';

const vertexShader = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const fragmentShader = `
precision mediump float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uPointer;
uniform float uPointerStrength;
uniform float uHorizontalSpread;

void main() {
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  float t = uTime;
  // Give the red light field more horizontal room on narrow portrait screens.
  float x = uv.x / uHorizontalSpread;
  float y = uv.y;
  vec2 cursorDelta = vec2((x - uPointer.x) * 1.05, (y - uPointer.y) * 1.45);
  float cursorInfluence = exp(-dot(cursorDelta, cursorDelta) * 5.5) * uPointerStrength;

  // Low-frequency warping gives the vertical light its soft, material-like flow.
  float domain = y + 0.026 * sin(y * 5.4 + t * 0.13)
                   + 0.012 * sin(y * 12.0 - t * 0.09);
  float rightFade = 1.0 - smoothstep(0.56, 0.91, x);
  float upper = 1.0 - smoothstep(0.02, 0.53,
      y + 0.04 * sin(x * 5.2 + t * 0.11) + 0.018 * sin(x * 12.0 - t * 0.07));
  float upperLight = upper * (1.0 - smoothstep(0.32, 0.79, x)) * rightFade;

  // Dark burgundy is held in the lower-left; the far right falls to near-black.
  vec3 burgundy = vec3(0.050, 0.008, 0.016);
  vec3 nearBlack = vec3(0.0045, 0.0050, 0.0060);
  vec3 color = mix(burgundy, nearBlack, smoothstep(0.24, 0.87, x));
  color = mix(color, vec3(0.31, 0.009, 0.020), upperLight * 0.62);

  float ribbons = 0.0;
  float innerLight = 0.0;
  for (int i = 0; i < 4; i++) {
    float index = float(i);
    float baseX = 0.115 + index * 0.112;
    float center = baseX
      + 0.022 * sin(domain * 5.8 + index * 1.71 + t * 0.10)
      + 0.010 * sin(domain * 13.0 - index * 1.13 - t * 0.065)
      + cursorInfluence * (uPointer.x - x) * 0.25;
    float width = (0.064 - index * 0.004) * (0.82 + 0.18 * sin(y * 3.1 + index))
      * (1.0 + cursorInfluence * 0.14);
    float distanceToFlow = abs(x - center);
    float veil = exp(-pow(distanceToFlow / width, 2.0) * 1.35);
    float core = exp(-pow(distanceToFlow / (width * 0.24), 2.0) * 1.4);

    // One central-left strand reaches farther into the dark lower field.
    float tail = 1.0 - smoothstep(i == 1 ? 0.84 : 0.60, i == 1 ? 1.08 : 0.93, y);
    float topEnergy = 0.56 + 0.44 * (1.0 - smoothstep(0.13, 0.68, y));
    float flow = veil * tail * topEnergy * rightFade;
    ribbons += flow;
    innerLight += core * tail * topEnergy * rightFade;
  }

  color += vec3(0.57, 0.012, 0.023) * ribbons * 0.38;
  color += vec3(0.36, 0.018, 0.025) * innerLight * 0.11;
  color += vec3(0.22, 0.006, 0.014) * upperLight * 0.54;
  color += vec3(0.20, 0.008, 0.014) * cursorInfluence * (0.4 + ribbons * 0.35);

  // A restrained, continuous change in the illumination, never a global pulse.
  float breathing = 0.97 + 0.03 * sin(t * 0.21 + x * 2.0 + y * 0.7);
  color = mix(nearBlack, color, breathing);
  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create background shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Background shader compilation failed.';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

export default function HomeSceneBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    let context: WebGLRenderingContext | null = null;
    let buffer: WebGLBuffer | null = null;
    let program: WebGLProgram | null = null;
    let timeLocation: WebGLUniformLocation | null = null;
    let pointerLocation: WebGLUniformLocation | null = null;
    let pointerStrengthLocation: WebGLUniformLocation | null = null;
    let horizontalSpreadLocation: WebGLUniformLocation | null = null;
    let frame = 0;
    let running = false;
    let startTime = 0;
    let lastRender = 0;
    let previousRender = 0;
    let elapsedTime = 0;
    let pointerX = 0.5;
    let pointerY = 0.5;
    let targetPointerX = 0.5;
    let targetPointerY = 0.5;
    let pointerStrength = 0;
    let targetPointerStrength = 0;
    const fpsInterval = 1000 / 30;

    const setStaticFallback = () => {
      wrapper.dataset.scene = 'static';
    };

    const draw = (time: number) => {
      if (!context || !program) return;
      context.useProgram(program);
      if (timeLocation) context.uniform1f(timeLocation, time);
      if (pointerLocation) {
        const spread = window.innerWidth / Math.max(1, window.innerHeight) < 0.9 ? 1.65 : 1;
        context.uniform2f(pointerLocation, pointerX / spread, pointerY);
      }
      if (pointerStrengthLocation) context.uniform1f(pointerStrengthLocation, pointerStrength);
      context.drawArrays(context.TRIANGLES, 0, 6);
    };

    const resize = () => {
      if (!context) return;
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1 : 1.25);
      // The CSS canvas follows the full document, while its drawing buffer is
      // capped to avoid allocating a massive WebGL surface on long pages.
      const renderScale = Math.min(dpr, 2048 / Math.max(1, bounds.width), 4096 / Math.max(1, bounds.height));
      const width = Math.max(1, Math.round(bounds.width * renderScale));
      const height = Math.max(1, Math.round(bounds.height * renderScale));
      if (horizontalSpreadLocation) {
        context.uniform1f(horizontalSpreadLocation, window.innerWidth / Math.max(1, window.innerHeight) < 0.9 ? 1.65 : 1);
      }
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      context.viewport(0, 0, width, height);
      // Resizing a WebGL drawing buffer clears it. Paint the current frame
      // immediately so layout changes (including an expanding disclosure)
      // never expose the cleared buffer while the next animation frame waits.
      draw(elapsedTime);
    };

    // Keep the ambient backdrop moving whenever the page is visible. The foreground
    // line/audio control does not pause this shared background layer.
    const isMoving = () => !document.hidden;

    const render = (timestamp: number) => {
      if (!running || !isMoving()) return;
      frame = requestAnimationFrame(render);
      if (timestamp - lastRender < fpsInterval) return;
      const delta = previousRender ? Math.min(timestamp - previousRender, 100) : fpsInterval;
      previousRender = timestamp;
      lastRender = timestamp;
      if (!startTime) startTime = timestamp - elapsedTime * 1000;
      elapsedTime = (timestamp - startTime) * 0.001;
      const response = 1 - Math.exp(-delta / 90);
      pointerX += (targetPointerX - pointerX) * response;
      pointerY += (targetPointerY - pointerY) * response;
      pointerStrength += (targetPointerStrength - pointerStrength) * response;
      draw(elapsedTime);
    };

    const start = () => {
      if (!context || !program) return;
      if (isMoving()) {
        if (running) return;
        running = true;
        startTime = 0;
        lastRender = 0;
        previousRender = 0;
        frame = requestAnimationFrame(render);
      } else {
        running = false;
        cancelAnimationFrame(frame);
        frame = 0;
        targetPointerStrength = 0;
        pointerStrength = 0;
        draw(elapsedTime);
      }
    };

    const onVisibilityChange = () => start();
    const onPointerMove = (event: PointerEvent) => {
      if ((event.pointerType !== 'mouse' && event.pointerType !== 'pen') || !isMoving()) return;
      targetPointerX = Math.min(1, Math.max(0, event.clientX / Math.max(1, window.innerWidth)));
      targetPointerY = Math.min(1, Math.max(0, event.clientY / Math.max(1, window.innerHeight)));
      targetPointerStrength = 1;
    };
    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget === null) targetPointerStrength = 0;
    };
    const onWindowBlur = () => {
      targetPointerStrength = 0;
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      running = false;
      cancelAnimationFrame(frame);
      setStaticFallback();
    };

    try {
      context = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'low-power',
        premultipliedAlpha: false,
      });
      if (!context) throw new Error('WebGL is unavailable.');

      const vertex = compileShader(context, context.VERTEX_SHADER, vertexShader);
      const fragment = compileShader(context, context.FRAGMENT_SHADER, fragmentShader);
      program = context.createProgram();
      if (!program) throw new Error('Unable to create background program.');
      context.attachShader(program, vertex);
      context.attachShader(program, fragment);
      context.linkProgram(program);
      context.deleteShader(vertex);
      context.deleteShader(fragment);
      if (!context.getProgramParameter(program, context.LINK_STATUS)) {
        throw new Error(context.getProgramInfoLog(program) || 'Background program linking failed.');
      }
      timeLocation = context.getUniformLocation(program, 'uTime');
      pointerLocation = context.getUniformLocation(program, 'uPointer');
      pointerStrengthLocation = context.getUniformLocation(program, 'uPointerStrength');
      horizontalSpreadLocation = context.getUniformLocation(program, 'uHorizontalSpread');

      buffer = context.createBuffer();
      if (!buffer) throw new Error('Unable to create background geometry.');
      context.bindBuffer(context.ARRAY_BUFFER, buffer);
      context.bufferData(context.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1,
      ]), context.STATIC_DRAW);
      context.useProgram(program);
      const position = context.getAttribLocation(program, 'aPosition');
      context.enableVertexAttribArray(position);
      context.vertexAttribPointer(position, 2, context.FLOAT, false, 0, 0);
      wrapper.dataset.scene = 'webgl';

      const observer = new ResizeObserver(resize);
      observer.observe(canvas);
      window.addEventListener('resize', resize, { passive: true });
      window.visualViewport?.addEventListener('resize', resize, { passive: true });
      document.addEventListener('visibilitychange', onVisibilityChange);
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerout', onPointerOut, { passive: true });
      window.addEventListener('blur', onWindowBlur, { passive: true });
      canvas.addEventListener('webglcontextlost', onContextLost);
      resize();
      start();

      return () => {
        running = false;
        cancelAnimationFrame(frame);
        observer.disconnect();
        window.removeEventListener('resize', resize);
        window.visualViewport?.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerout', onPointerOut);
        window.removeEventListener('blur', onWindowBlur);
        canvas.removeEventListener('webglcontextlost', onContextLost);
        if (buffer) context?.deleteBuffer(buffer);
        if (program) context?.deleteProgram(program);
      };
    } catch {
      if (buffer) context?.deleteBuffer(buffer);
      if (program) context?.deleteProgram(program);
      setStaticFallback();
    }
  }, []);

  return <div className="home-scene-background" ref={wrapperRef} data-scene="static" aria-hidden="true">
    <canvas className="home-flow-canvas" ref={canvasRef} />
    <div className="home-scene-fallback" />
  </div>;
}
