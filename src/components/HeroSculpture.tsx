'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import './hero-sculpture.css';

const soundtrack = {
  source: 'https://cdn.pixabay.com/download/audio/2025/04/06/audio_b861f2e62d.mp3?filename=pripac-soft-ambient-texture-for-meditation-323665.mp3',
  page: 'https://pixabay.com/music/ambient-soft-ambient-texture-for-meditation-323665/',
};

// Keep one media element for the lifetime of the App Router session. The hero
// unmounts when the visitor changes route, but audio playback should continue.
let sharedSoundtrack: HTMLAudioElement | null = null;
let sharedFadeFrame = 0;
let sharedPlaybackGeneration = 0;

function getSoundtrack() {
  if (typeof Audio === 'undefined') return null;
  if (!sharedSoundtrack) {
    sharedSoundtrack = new Audio(soundtrack.source);
    sharedSoundtrack.preload = 'none';
    sharedSoundtrack.loop = true;
  }
  return sharedSoundtrack;
}

type Point = readonly [number, number];
type FlowPath = {
  id: string;
  start: Point;
  control1: Point;
  control2: Point;
  end: Point;
  secondControl2?: Point;
  secondEnd?: Point;
  thirdControl1?: Point;
  thirdControl2?: Point;
  thirdEnd?: Point;
  duration: number;
  phase: number;
};

// These control points describe the existing SVG curves; later segments retain
// the original S-command tangents while only the control handles drift by a few px.
const flowPaths: FlowPath[] = [
  { id: 'flow-path-1', start: [-30, 520], control1: [160, 480], control2: [190, 200], end: [400, 145], secondControl2: [600, 160], secondEnd: [700, 150], duration: 24, phase: 0.1 },
  { id: 'flow-path-2', start: [-30, 540], control1: [165, 500], control2: [215, 235], end: [410, 172], secondControl2: [600, 188], secondEnd: [700, 183], duration: 29, phase: 1.2 },
  { id: 'flow-path-3', start: [-30, 570], control1: [170, 540], control2: [240, 280], end: [430, 215], secondControl2: [610, 235], secondEnd: [700, 227], duration: 27, phase: 2.1 },
  { id: 'flow-path-4', start: [-30, 155], control1: [170, 110], control2: [290, 190], end: [380, 310], secondControl2: [500, 480], secondEnd: [700, 510], duration: 31, phase: 2.8 },
  { id: 'flow-path-5', start: [-30, 125], control1: [170, 80], control2: [300, 170], end: [400, 288], secondControl2: [530, 460], secondEnd: [700, 480], duration: 26, phase: 3.6 },
  { id: 'flow-path-6', start: [140, 640], control1: [220, 450], control2: [275, 290], end: [480, 20], duration: 33, phase: 4.4 },
];

function pointOnCurve(start: Point, control1: Point, control2: Point, end: Point, t: number): Point {
  const inverse = 1 - t;
  const a = inverse * inverse * inverse;
  const b = 3 * inverse * inverse * t;
  const c = 3 * inverse * t * t;
  const d = t * t * t;
  return [
    a * start[0] + b * control1[0] + c * control2[0] + d * end[0],
    a * start[1] + b * control1[1] + c * control2[1] + d * end[1],
  ];
}

function initialDotTransform(pathIndex: number, phase: number, range: number) {
  const path = flowPaths[pathIndex];
  const progress = 0.49 + range * Math.cos(phase);
  const [x, y] = pointOnCurve(path.start, path.control1, path.control2, path.end, progress);
  return `translate(${x.toFixed(2)} ${y.toFixed(2)})`;
}

function animatedPathData(path: FlowPath, time: number, index: number) {
  const wave = Math.sin(time * (2 * Math.PI / path.duration) + path.phase);
  const cross = Math.cos(time * (2 * Math.PI / (path.duration * 1.31)) + path.phase * 0.7);
  const c1: Point = [path.control1[0] + wave * 1.2, path.control1[1] + cross * 2.2];
  const c2: Point = [path.control2[0] + cross * 3.2, path.control2[1] + wave * 4];
  const segment = `M${path.start[0]} ${path.start[1]}C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${path.end[0]} ${path.end[1]}`;

  if (path.secondEnd && path.secondControl2) {
    const control1: Point = [2 * path.end[0] - c2[0], 2 * path.end[1] - c2[1]];
    const control2: Point = [path.secondControl2[0] + cross * 1.7, path.secondControl2[1] - wave * 2.4];
    return `${segment}C${control1[0].toFixed(2)} ${control1[1].toFixed(2)} ${control2[0].toFixed(2)} ${control2[1].toFixed(2)} ${path.secondEnd[0]} ${path.secondEnd[1]}`;
  }

  // Keep `index` in the signature so every strand can be assigned an independent phase.
  void index;
  return segment;
}

const motionQuery = '(prefers-reduced-motion: reduce)';
const motionPreferenceKey = 'ovio-background-motion';
const motionEvent = 'myovio:background-motion';
let inMemoryMotionPreference: 'playing' | 'paused' | null = null;
let inMemorySoundPreference: 'muted' | 'enabled' | null = null;
function subscribePreferences(notify: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
}
function preferenceSnapshot() {
  return window.matchMedia(motionQuery).matches;
}
function subscribeMotionPreference(notify: () => void) {
  window.addEventListener(motionEvent, notify);
  return () => window.removeEventListener(motionEvent, notify);
}
function motionPreferenceSnapshot(): string | null {
  try {
    const preference = window.sessionStorage.getItem(motionPreferenceKey);
    if (preference === 'playing' || preference === 'paused') return preference;
  } catch {
    // Fall through to the in-memory choice when storage is restricted.
  }
  return inMemoryMotionPreference;
}
function subscribeSoundPreference(notify: () => void) {
  window.addEventListener('myovio:background-sound', notify);
  return () => window.removeEventListener('myovio:background-sound', notify);
}
function soundPreferenceSnapshot() {
  try {
    const preference = window.sessionStorage.getItem('ovio-background-sound');
    if (preference === 'muted' || preference === 'enabled') return preference === 'muted';
  } catch {
    // Fall through to the in-memory choice when storage is restricted.
  }
  return inMemorySoundPreference === 'muted';
}

export default function HeroSculpture() {
  const artworkRef = useRef<SVGSVGElement>(null);
  const mutedRef = useRef(false);
  const elapsedRef = useRef(0);
  const [soundtrackError, setSoundtrackError] = useState(false);
  const [soundtrackPlaying, setSoundtrackPlaying] = useState(false);
  const soundtrackMuted = useSyncExternalStore(subscribeSoundPreference, soundPreferenceSnapshot, () => false);
  const reduced = useSyncExternalStore(subscribePreferences, preferenceSnapshot, () => true);
  const manualMotion = useSyncExternalStore(subscribeMotionPreference, motionPreferenceSnapshot, () => null);
  const playing = manualMotion === null ? !reduced : manualMotion === 'playing';

  useEffect(() => {
    mutedRef.current = soundtrackMuted;
  }, [soundtrackMuted]);

  useEffect(() => {
    const audio = getSoundtrack();
    if (!audio) return;
    const syncPlayback = () => setSoundtrackPlaying(!audio.paused);
    const markError = () => { setSoundtrackPlaying(false); setSoundtrackError(true); };
    audio.addEventListener('play', syncPlayback);
    audio.addEventListener('pause', syncPlayback);
    audio.addEventListener('error', markError);
    syncPlayback();
    return () => {
      audio.removeEventListener('play', syncPlayback);
      audio.removeEventListener('pause', syncPlayback);
      audio.removeEventListener('error', markError);
    };
  }, []);

  useEffect(() => {
    const artwork = artworkRef.current;
    if (!artwork) return;

    if (!playing) return;

    const paths = flowPaths.map(path => ({
      config: path,
      element: artwork.querySelector<SVGPathElement>(`#${path.id}`),
    }));
    const dots = [
      { pathIndex: 0, element: artwork.querySelector<SVGGElement>('[data-flow-dot="one"]'), duration: 19, phase: 0.25, range: 0.115 },
      { pathIndex: 3, element: artwork.querySelector<SVGGElement>('[data-flow-dot="two"]'), duration: 23, phase: 2.2, range: 0.105 },
      { pathIndex: 4, element: artwork.querySelector<SVGGElement>('[data-flow-dot="three"]'), duration: 17, phase: 4.1, range: 0.11 },
    ];
    let frame = 0;
    let lastFrame = 0;
    let elapsed = elapsedRef.current;
    const frameInterval = 1000 / 30;

    const animate = (timestamp: number) => {
      frame = requestAnimationFrame(animate);
      if (!lastFrame) {
        lastFrame = timestamp;
        return;
      }
      if (timestamp - lastFrame < frameInterval) return;
      elapsed += (timestamp - lastFrame) / 1000;
      elapsedRef.current = elapsed;
      lastFrame = timestamp;

      for (const { config, element } of paths) {
        if (!element) continue;
        element.setAttribute('d', animatedPathData(config, elapsed, config.phase));
      }

      for (const dot of dots) {
        if (!dot.element) continue;
        const path = flowPaths[dot.pathIndex];
        const progress = 0.49 + dot.range * Math.cos(elapsed * (2 * Math.PI / dot.duration) + dot.phase);
        const flowPath = paths[dot.pathIndex].config;
        const wave = Math.sin(elapsed * (2 * Math.PI / flowPath.duration) + flowPath.phase);
        const cross = Math.cos(elapsed * (2 * Math.PI / (flowPath.duration * 1.31)) + flowPath.phase * 0.7);
        const control1: Point = [path.control1[0] + wave * 1.2, path.control1[1] + cross * 2.2];
        const control2: Point = [path.control2[0] + cross * 3.2, path.control2[1] + wave * 4];
        const [x, y] = pointOnCurve(path.start, control1, control2, path.end, progress);
        dot.element.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
        lastFrame = 0;
      } else if (!frame) {
        frame = requestAnimationFrame(animate);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [playing]);

  const cancelFade = () => {
    cancelAnimationFrame(sharedFadeFrame);
    sharedFadeFrame = 0;
  };

  const fadeAudio = (audio: HTMLAudioElement, to: number, duration: number, pauseAfter: boolean) => {
    cancelFade();
    const from = audio.volume;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      // Smoothstep avoids an abrupt first or last volume step.
      const eased = progress * progress * (3 - 2 * progress);
      audio.volume = Math.max(0, Math.min(1, from + (to - from) * eased));
      if (progress < 1) {
        sharedFadeFrame = requestAnimationFrame(tick);
      } else {
        sharedFadeFrame = 0;
        if (pauseAfter) audio.pause();
      }
    };
    sharedFadeFrame = requestAnimationFrame(tick);
  };

  const startSoundtrack = (restart: boolean) => {
    const audio = getSoundtrack();
    if (!audio || mutedRef.current) return;
    const generation = ++sharedPlaybackGeneration;
    cancelFade();
    setSoundtrackError(false);
    audio.volume = 0;
    if (restart) audio.currentTime = 0;
    void audio.play().then(() => {
      if (generation !== sharedPlaybackGeneration || mutedRef.current) {
        audio.pause();
        return;
      }
      // Keep the ambience clearly in the background for visitors.
      fadeAudio(audio, 0.24, 1800, false);
    }).catch(() => {
      setSoundtrackError(true);
      audio.pause();
    });
  };

  const stopSoundtrack = () => {
    const audio = getSoundtrack();
    sharedPlaybackGeneration += 1;
    cancelFade();
    if (!audio || audio.paused) return;
    fadeAudio(audio, 0, 1800, true);
  };

  const toggleMotion = () => {
    const nextPlaying = !playing;

    if (nextPlaying) {
      startSoundtrack(true);
    } else {
      stopSoundtrack();
    }

    inMemoryMotionPreference = nextPlaying ? 'playing' : 'paused';

    try {
      window.sessionStorage.setItem(motionPreferenceKey, nextPlaying ? 'playing' : 'paused');
    } catch {
      // The in-memory choice still updates the control in restricted browser contexts.
    }

    window.dispatchEvent(new CustomEvent(motionEvent, { detail: { playing: nextPlaying } }));
  };

  const toggleSoundtrack = () => {
    const nextMuted = !mutedRef.current;
    mutedRef.current = nextMuted;
    inMemorySoundPreference = nextMuted ? 'muted' : 'enabled';
    try {
      window.sessionStorage.setItem('ovio-background-sound', nextMuted ? 'muted' : 'enabled');
    } catch {
      // Keep the preference in memory for this session if storage is restricted.
    }
    window.dispatchEvent(new CustomEvent('myovio:background-sound'));
    if (nextMuted) stopSoundtrack();
    else if (playing) startSoundtrack(true);
  };

  const status = playing
    ? soundtrackError ? 'Light field moving. Soundtrack unavailable.' : soundtrackMuted ? 'Light field moving. Sound muted.' : soundtrackPlaying ? 'Light field and soundtrack playing.' : 'Light field moving. Music starts when motion is restarted.'
      : reduced
      ? 'Background stays in motion. Line motion reduced to your preference.'
      : 'Line motion and soundtrack paused. Background remains animated.';

  return <div className="hero-feature sculpture-feature">
    <div className="sculpture-stage" role="img" aria-label="Amber curves and traveling points flowing over a dark red light field">
      <svg
        ref={artworkRef}
        className="sculpture-artwork"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 640 592"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
      >
        <g fill="none" stroke="#D9824B" strokeWidth="1">
          <path id="flow-path-1" opacity=".42" d="M-30 520C160 480 190 200 400 145S600 160 700 150" />
          <path id="flow-path-2" opacity=".18" d="M-30 540C165 500 215 235 410 172S600 188 700 183" />
          <path id="flow-path-3" opacity=".13" d="M-30 570C170 540 240 280 430 215S610 235 700 227" />
          <path id="flow-path-4" opacity=".34" d="M-30 155C170 110 290 190 380 310S500 480 700 510" />
          <path id="flow-path-5" opacity=".15" d="M-30 125C170 80 300 170 400 288S530 460 700 480" />
          <path id="flow-path-6" opacity=".13" d="M140 640C220 450 275 290 480 20" />
        </g>

        {/* The original soft amber anchors stay in place while each bright point travels on its matching artwork path. */}
        <g fill="#D9824B">
          <circle cx="220" cy="330" r="16" opacity=".025"/><circle cx="220" cy="330" r="7" opacity=".09"/>
          <circle cx="420" cy="361" r="16" opacity=".025"/><circle cx="420" cy="361" r="7" opacity=".09"/>
          <circle cx="465" cy="211" r="13" opacity=".02"/>
        </g>
        <g className="flow-dots">
          <g data-flow-dot="one" transform={initialDotTransform(0, 0.25, 0.115)}>
            <circle r="16" fill="#D9824B" opacity=".025"/><circle r="7" fill="#D9824B" opacity=".09"/><circle r="2.5" fill="#F0E8DE" />
          </g>
          <g data-flow-dot="two" transform={initialDotTransform(3, 2.2, 0.105)}>
            <circle r="16" fill="#D9824B" opacity=".025"/><circle r="7" fill="#D9824B" opacity=".09"/><circle r="2.5" fill="#F0E8DE" />
          </g>
          <g data-flow-dot="three" transform={initialDotTransform(4, 4.1, 0.11)}>
            <circle r="13" fill="#D9824B" opacity=".02"/><circle r="2" fill="#F0E8DE" />
          </g>
        </g>
      </svg>
    </div>
    <div className="sculpture-caption">
      <div className="sculpture-motion-caption">
        <span aria-live="polite">{status}</span>
        {soundtrackPlaying && <a className="soundtrack-credit" href={soundtrack.page} target="_blank" rel="noopener noreferrer">Music by Pripac · Pixabay</a>}
        {playing && <button className="soundtrack-toggle" type="button" aria-pressed={!soundtrackMuted} onClick={toggleSoundtrack} aria-label={soundtrackMuted ? 'Enable ambient music' : 'Mute ambient music'}>
          <svg aria-hidden="true" viewBox="0 0 20 20" focusable="false">
            {soundtrackMuted ? <><path d="M3 8v4h3l4 3V5L6 8H3Z"/><path d="m13 8 4 4m0-4-4 4"/></> : <><path d="M3 8v4h3l4 3V5L6 8H3Z"/><path d="M13 7a4 4 0 0 1 0 6m2-8a7 7 0 0 1 0 10"/></>}
          </svg><span>{soundtrackMuted ? 'Sound off' : 'Sound on'}</span>
        </button>}
        <button className="motion-toggle" type="button" aria-pressed={playing} onClick={toggleMotion}>
          {playing ? 'Pause line motion' : soundtrackMuted ? 'Play line motion' : 'Play line motion & music'}
          <svg aria-hidden="true" viewBox="0 0 16 16" focusable="false">
            {playing
              ? <><path d="M5 3.5v9M11 3.5v9" /></>
              : <path d="m5.5 3.5 7 4.5-7 4.5z" />}
          </svg>
        </button>
      </div>
    </div>
  </div>;
}
