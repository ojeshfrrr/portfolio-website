'use client';

import dynamic from 'next/dynamic';
import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { motion as motionElement } from 'motion/react';
import { stepDampedSpring } from './lab-physics.mjs';
import { defaultFlow, defaultGravity, defaultLight, defaultReaction, defaultSignal, defaultType, defaultWaves, experimentPresets } from './lab-model';
import type { Alignment, ArtExperiment, FlowSettings, GravitySettings, Grouping, LightSettings, NewExperiment, NewExperimentSettings, ReactionSettings, RevealDirection, RevealStyle, SignalSettings, TypeSettings, WaveSettings, WaveSource } from './lab-model';
import { useMotionPreference } from '../../lib/useMotionPreference';
import { motionTiming } from '../../lib/motion-system';
import styles from './lab.module.css';
import type { CanvasStageProps } from './CanvasStage';
import PhysicsStage from './PhysicsStage';
import PhysicsControls from './PhysicsControls';

type ExperimentId = ArtExperiment | 'console';

const CanvasStage = dynamic<CanvasStageProps>(() => import('./CanvasStage'), {
  ssr: false,
  loading: () => <div className={styles.stageFallback} aria-hidden="true"><i/><i/><i/><span/></div>,
});

const experiments: { id: ArtExperiment; number: string; name: string; short: string; format: string; description: string }[] = [
  { id: 'light', number: '01', name: 'Light field', short: 'Bend the atmosphere', format: 'Canvas / generative light', description: 'A layered spatial light field. Adjust its illumination and follow the pointer through the ribbons to draw a soft local distortion.' },
  { id: 'type', number: '02', name: 'Type in motion', short: 'Give a phrase some weight', format: 'DOM / mass–spring type', description: 'Each word or character acts as a damped spring. Pointer movement adds an impulse; mass, stiffness, and damping decide how the type settles.' },
  { id: 'signal', number: '03', name: 'Signal field', short: 'Disturb the signal', format: 'Canvas / damped wave field', description: 'Pointer movement emits localized radial impulses. The contour field carries them outward, then loses energy through damping.' },
  { id: 'gravity', number: '04', name: 'Gravity well', short: 'Bend the trajectories', format: 'Canvas / softened Newtonian field', description: 'Particles pass and orbit around attractors under a softened inverse-square acceleration field. Drag an attractor to reshape the trajectories.' },
  { id: 'waves', number: '05', name: 'Wave interference', short: 'Watch fields overlap', format: 'Canvas / damped wave superposition', description: 'A signed scalar field sums damped circular waves, revealing constructive and destructive interference as their sources move.' },
  { id: 'flow', number: '06', name: 'Particle flow', short: 'Find a current', format: 'Canvas / midpoint advection', description: 'Seeded particles travel through a smooth directional and vortical vector field. Pointer movement adds a local rotational current.' },
  { id: 'reaction', number: '07', name: 'Reaction lab', short: 'Grow a living pattern', format: 'Canvas / Gray–Scott reaction diffusion', description: 'Two concentrations diffuse and react on a bounded grid. Paint B into the simulation and watch the chemistry evolve.' },
];

type SpringState = { x: { position: number; velocity: number }; y: { position: number; velocity: number } };
type UnitMetric = { x: number; y: number };
type RangeFieldProps = {
  label: string; value: number; min: number; max: number; step?: number; hint?: string;
  format?: (value: number) => string; onChange: (value: number) => void;
};

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

function RangeField({ label, value, min, max, step = 1, hint, format = number => `${number}`, onChange }: RangeFieldProps) {
  const id = useId();
  return <label className={styles.rangeControl} htmlFor={id}>
    <span>{label}<output htmlFor={id}>{format(value)}</output></span>
    <input aria-describedby={hint ? `${id}-hint` : undefined} id={id} max={max} min={min} onChange={event => onChange(Number(event.currentTarget.value))} step={step} type="range" value={value}/>
    {hint ? <small id={`${id}-hint`}>{hint}</small> : null}
  </label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  const id = useId();
  return <label className={styles.selectControl} htmlFor={id}><span>{label}</span><select id={id} onChange={event => onChange(event.currentTarget.value)} value={value}>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function ChoiceField<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <div className={styles.choiceControl}>
    <span>{label}</span>
    <div aria-label={label} role="group">{options.map(option => <button aria-pressed={value === option.value} key={option.value} onClick={() => onChange(option.value)} type="button">{option.label}</button>)}</div>
  </div>;
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const id = useId();
  return <label className={styles.toggleControl} htmlFor={id}><input checked={checked} id={id} onChange={event => onChange(event.currentTarget.checked)} type="checkbox"/><span>{label}</span></label>;
}

function phraseParts(phrase: string, grouping: Grouping) {
  return grouping === 'character' ? Array.from(phrase) : phrase.split(/(\s+)/u).filter(Boolean);
}

export default function LabExperience() {
  const reducedMotion = useMotionPreference();
  const [active, setActive] = useState<ExperimentId>('light');
  const [lastArt, setLastArt] = useState<ArtExperiment>('light');
  const [motionChoice, setMotionChoice] = useState<boolean | null>(null);
  const motion = motionChoice ?? !reducedMotion;
  const [light, setLight] = useState<LightSettings>(() => ({ ...defaultLight }));
  const [signal, setSignal] = useState<SignalSettings>(() => ({ ...defaultSignal }));
  const [type, setType] = useState<TypeSettings>(() => ({ ...defaultType }));
  const [gravity, setGravity] = useState<GravitySettings>(() => ({ ...defaultGravity, attractors: defaultGravity.attractors.map(point => ({ ...point })) }));
  const [waves, setWaves] = useState<WaveSettings>(() => ({ ...defaultWaves, sources: defaultWaves.sources.map(point => ({ ...point })) }));
  const [flow, setFlow] = useState<FlowSettings>(() => ({ ...defaultFlow }));
  const [reaction, setReaction] = useState<ReactionSettings>(() => ({ ...defaultReaction }));
  const [presets, setPresets] = useState<Record<ArtExperiment, string>>({ light: 'studio', signal: 'signal', type: 'type', gravity: 'orbit', waves: 'twin', flow: 'streamline', reaction: 'coral' });
  const [seeds, setSeeds] = useState<Record<ArtExperiment, number>>({ light: 6214, signal: 6214, type: 6214, gravity: 6214, waves: 6214, flow: 6214, reaction: 6214 });
  const [resetKey, setResetKey] = useState(0);
  const [status, setStatus] = useState('The light field is ready to explore.');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);
  const settingsCloseRef = useRef<HTMLButtonElement>(null);
  const settingsPanelRef = useRef<HTMLElement>(null);
  const typeStageRef = useRef<HTMLDivElement>(null);
  const typeUnitRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const typeMetricsRef = useRef<UnitMetric[]>([]);
  const typeSpringsRef = useRef<SpringState[]>([]);
  const typeSettingsRef = useRef(type);
  const typePointerRef = useRef({ x: 0.5, y: 0.5, previousX: 0.5, previousY: 0.5, active: false });
  useLayoutEffect(() => { typeSettingsRef.current = type; }, [type]);
  const settingsId = useId();
  const settingsHeadingId = useId();
  const controlExperiment: ArtExperiment = active === 'console' ? lastArt : active;
  const selected = experiments.find(experiment => experiment.id === active) ?? experiments[0];
  const controlInfo = experiments.find(experiment => experiment.id === controlExperiment) ?? experiments[0];
  const presented = active === 'console' ? { number: '◇', name: 'Experiment console', format: 'Live configuration / SVG', description: 'Inspect the active study’s model, seed, preset, and current parameters.' } : selected;
  const mobileSheetOpen = isCompact && settingsOpen;
  const seed = seeds[controlExperiment];
  const currentSettings = controlExperiment === 'light' ? light : controlExperiment === 'signal' ? signal : controlExperiment === 'type' ? type : controlExperiment === 'gravity' ? gravity : controlExperiment === 'waves' ? waves : controlExperiment === 'flow' ? flow : reaction;
  const currentPresets = experimentPresets[controlExperiment];
  const configuration = useMemo(() => ({
    experiment: controlExperiment,
    preset: currentPresets.find(item => item.id === presets[controlExperiment])?.label ?? 'Custom',
    seed,
    motion: motion ? 'playing' : 'paused',
    model: controlExperiment === 'signal'
      ? 'Damped radial impulse response with mass-dependent natural frequency and exponential decay.'
      : controlExperiment === 'type'
        ? 'Per-unit mass–spring–damper: a = (-k(x-target) - c·v) / m; semi-implicit integration.'
        : controlExperiment === 'gravity'
          ? 'Softened Newtonian acceleration: G·M·r / (|r|² + ε²)^(3/2), integrated with velocity Verlet. Test mass cancels from acceleration.'
          : controlExperiment === 'waves'
            ? 'Signed damped circular waves are summed at each field sample; overlap produces constructive and destructive interference.'
            : controlExperiment === 'flow'
              ? 'Seeded particles advect through a directional, vortical vector field using midpoint (RK2) integration.'
              : controlExperiment === 'reaction'
                ? 'Gray–Scott reaction–diffusion with a periodic nine-point Laplacian on a bounded concentration grid.'
                : 'Layered Gaussian illumination with spatially varying flow and exponentially smoothed pointer coupling.',
    parameters: currentSettings,
  }), [controlExperiment, currentPresets, currentSettings, motion, presets, seed]);

  const markCustom = (id: ArtExperiment) => setPresets(current => ({ ...current, [id]: 'custom' }));
  const updateLight = <K extends keyof LightSettings>(key: K, value: LightSettings[K]) => { setLight(current => ({ ...current, [key]: value })); markCustom('light'); };
  const updateSignal = <K extends keyof SignalSettings>(key: K, value: SignalSettings[K]) => { setSignal(current => ({ ...current, [key]: value })); markCustom('signal'); };
  const updateType = <K extends keyof TypeSettings>(key: K, value: TypeSettings[K]) => { setType(current => ({ ...current, [key]: value })); markCustom('type'); };
  const updateNewExperiment = (id: NewExperiment, value: NewExperimentSettings) => {
    if (id === 'gravity') setGravity(value as GravitySettings);
    if (id === 'waves') setWaves(value as WaveSettings);
    if (id === 'flow') setFlow(value as FlowSettings);
    if (id === 'reaction') setReaction(value as ReactionSettings);
    markCustom(id);
  };
  const updateSeed = (value: number) => setSeeds(current => ({ ...current, [controlExperiment]: Math.max(0, Math.min(99999, Math.round(value))) }));

  const chooseExperiment = (id: ExperimentId) => {
    setActive(id);
    if (id !== 'console') setLastArt(id);
    setStatus(`${experiments.find(experiment => experiment.id === id)?.name ?? 'Inspector'} selected.`);
  };

  const resetExperiment = (id: ArtExperiment) => {
    if (id === 'light') { setLight({ ...defaultLight }); setPresets(current => ({ ...current, light: 'studio' })); }
    if (id === 'signal') { setSignal({ ...defaultSignal }); setPresets(current => ({ ...current, signal: 'signal' })); }
    if (id === 'type') {
      setType({ ...defaultType }); setPresets(current => ({ ...current, type: 'type' }));
      typeSpringsRef.current = [];
    }
    if (id === 'gravity') { setGravity({ ...defaultGravity, attractors: defaultGravity.attractors.map(point => ({ ...point })) }); setPresets(current => ({ ...current, gravity: 'orbit' })); }
    if (id === 'waves') { setWaves({ ...defaultWaves, sources: defaultWaves.sources.map(point => ({ ...point })) }); setPresets(current => ({ ...current, waves: 'twin' })); }
    if (id === 'flow') { setFlow({ ...defaultFlow }); setPresets(current => ({ ...current, flow: 'streamline' })); }
    if (id === 'reaction') { setReaction({ ...defaultReaction }); setPresets(current => ({ ...current, reaction: 'coral' })); }
    updateSeed(6214);
    setResetKey(value => value + 1);
    setStatus(`${experiments.find(experiment => experiment.id === id)?.name ?? 'Experiment'} reset to its studio defaults.`);
  };

  const resetAll = () => {
    setLight({ ...defaultLight }); setSignal({ ...defaultSignal }); setType({ ...defaultType });
    setGravity({ ...defaultGravity, attractors: defaultGravity.attractors.map(point => ({ ...point })) });
    setWaves({ ...defaultWaves, sources: defaultWaves.sources.map(point => ({ ...point })) });
    setFlow({ ...defaultFlow }); setReaction({ ...defaultReaction });
    setPresets({ light: 'studio', signal: 'signal', type: 'type', gravity: 'orbit', waves: 'twin', flow: 'streamline', reaction: 'coral' });
    setSeeds({ light: 6214, signal: 6214, type: 6214, gravity: 6214, waves: 6214, flow: 6214, reaction: 6214 }); setResetKey(value => value + 1); setMotionChoice(null);
    typeSpringsRef.current = [];
    setStatus('All experiments returned to their starting settings.');
  };

  const applyPreset = (id: string) => {
    if (controlExperiment === 'light') {
      const choice = experimentPresets.light.find(item => item.id === id);
      if (!choice) return;
      setLight({ ...choice.values });
    } else if (controlExperiment === 'signal') {
      const choice = experimentPresets.signal.find(item => item.id === id);
      if (!choice) return;
      setSignal({ ...choice.values });
    } else if (controlExperiment === 'type') {
      const choice = experimentPresets.type.find(item => item.id === id);
      if (!choice) return;
      setType({ ...choice.values });
      typeSpringsRef.current = [];
    } else if (controlExperiment === 'gravity') {
      const choice = experimentPresets.gravity.find(item => item.id === id);
      if (!choice) return;
      setGravity({ ...choice.values, attractors: choice.values.attractors.map(point => ({ ...point })) });
      setResetKey(value => value + 1);
    } else if (controlExperiment === 'waves') {
      const choice = experimentPresets.waves.find(item => item.id === id);
      if (!choice) return;
      setWaves({ ...choice.values, sources: choice.values.sources.map(point => ({ ...point })) });
    } else if (controlExperiment === 'flow') {
      const choice = experimentPresets.flow.find(item => item.id === id);
      if (!choice) return;
      setFlow({ ...choice.values });
      setResetKey(value => value + 1);
    } else {
      const choice = experimentPresets.reaction.find(item => item.id === id);
      if (!choice) return;
      setReaction({ ...choice.values });
      setResetKey(value => value + 1);
    }
    setPresets(current => ({ ...current, [controlExperiment]: id }));
    setStatus(`${currentPresets.find(item => item.id === id)?.label ?? 'Preset'} loaded.`);
  };

  const nextComposition = () => {
    const nextSeed = (seed * 37 + 7919) % 100000;
    updateSeed(nextSeed);
    if (controlExperiment === 'waves') {
      let state = nextSeed >>> 0;
      const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
      setWaves(current => ({ ...current, sources: Array.from({ length: current.sourceCount }, (_, index) => ({ x: 0.2 + random() * 0.6, y: 0.2 + random() * 0.6, phase: index * current.phaseOffset * Math.PI / 180 })) }));
    }
    markCustom(controlExperiment);
    setStatus('A seeded variation is in place. The same seed reproduces this composition.');
  };

  const copyConfiguration = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(configuration, null, 2));
      setStatus('Current experiment settings copied as JSON.');
    } catch {
      setStatus('Clipboard access is unavailable here. Copy was not completed.');
    }
  };

  const segments = useMemo(() => phraseParts(type.phrase, type.grouping), [type.phrase, type.grouping]);
  const typeRefCallbacks = useMemo(() => {
    let visibleIndex = 0;
    return segments.map(part => {
      if (/^\s+$/u.test(part)) return null;
      const index = visibleIndex++;
      return (node: HTMLSpanElement | null) => { typeUnitRefs.current[index] = node; };
    });
  }, [segments]);
  useLayoutEffect(() => {
    if (active !== 'type') return;
    const stage = typeStageRef.current;
    if (!stage) return;
    const measure = () => {
      const stageBounds = stage.getBoundingClientRect();
      typeMetricsRef.current = typeUnitRefs.current.map(node => {
        if (!node) return { x: 0.5, y: 0.5 };
        const bounds = node.getBoundingClientRect();
        return {
          x: (bounds.left + bounds.width / 2 - stageBounds.left) / Math.max(1, stageBounds.width),
          y: (bounds.top + bounds.height / 2 - stageBounds.top) / Math.max(1, stageBounds.height),
        };
      });
      typeSpringsRef.current = typeMetricsRef.current.map((_, index) => typeSpringsRef.current[index] ?? ({ x: { position: 0, velocity: 0 }, y: { position: 0, velocity: 0 } }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [active, segments, type.fontSize, type.letterSpacing, type.wordSpacing, type.lineSpacing, type.maxWidth, type.alignment]);

  useEffect(() => {
    if (active !== 'type') typePointerRef.current.active = false;
    if (active !== 'type' || !motion) {
      if (active === 'type') {
        typeSpringsRef.current = typeMetricsRef.current.map(() => ({ x: { position: 0, velocity: 0 }, y: { position: 0, velocity: 0 } }));
        for (const node of typeUnitRefs.current) {
          node?.style.setProperty('--unit-x', '0px');
          node?.style.setProperty('--unit-y', '0px');
        }
      }
      return;
    }

    let frame = 0;
    let previousFrame = 0;
    const tick = (timestamp: number) => {
      frame = 0;
      if (document.visibilityState === 'hidden') return;
      const delta = previousFrame ? Math.min((timestamp - previousFrame) / 1000, 0.05) : 0;
      previousFrame = timestamp;
      const settings = typeSettingsRef.current;
      const stage = typeStageRef.current;
      const pointer = typePointerRef.current;
      const width = stage?.clientWidth ?? 1;
      const height = stage?.clientHeight ?? 1;
      for (let index = 0; index < typeUnitRefs.current.length; index += 1) {
        const node = typeUnitRefs.current[index];
        const metric = typeMetricsRef.current[index];
        if (!node || !metric) continue;
        const spring = typeSpringsRef.current[index] ??= { x: { position: 0, velocity: 0 }, y: { position: 0, velocity: 0 } };
        const dx = metric.x * width - pointer.x * width;
        const dy = metric.y * height - pointer.y * height;
        const distance = Math.hypot(dx, dy);
        const radius = Math.max(1, settings.pointerRadius);
        const influence = pointer.active ? Math.exp(-0.5 * (distance / radius) ** 2) * settings.pointerInfluence : 0;
        const targetX = pointer.active ? clamp(dx / radius, -1, 1) * 11 * influence : settings.returnToRest ? 0 : spring.x.position;
        const targetY = pointer.active ? clamp(dy / radius, -1, 1) * 6 * influence : settings.returnToRest ? 0 : spring.y.position;
        stepDampedSpring(spring.x, targetX, delta, settings);
        stepDampedSpring(spring.y, targetY, delta, settings);
        node.style.setProperty('--unit-x', `${spring.x.position.toFixed(2)}px`);
        node.style.setProperty('--unit-y', `${spring.y.position.toFixed(2)}px`);
      }
      frame = requestAnimationFrame(tick);
    };
    const start = () => { previousFrame = 0; if (!frame && document.visibilityState === 'visible') frame = requestAnimationFrame(tick); };
    const visibility = () => {
      if (document.visibilityState === 'hidden') { cancelAnimationFrame(frame); frame = 0; }
      else start();
    };
    start();
    document.addEventListener('visibilitychange', visibility);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', visibility); };
  }, [active, motion]);

  const typePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointer = typePointerRef.current;
    const x = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
    const y = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
    const deltaX = x - pointer.x;
    const deltaY = y - pointer.y;
    pointer.previousX = pointer.x; pointer.previousY = pointer.y; pointer.x = x; pointer.y = y; pointer.active = true;
    const settings = typeSettingsRef.current;
    if (motion) {
      for (let index = 0; index < typeMetricsRef.current.length; index += 1) {
        const metric = typeMetricsRef.current[index];
        const spring = typeSpringsRef.current[index];
        if (!spring || !metric) continue;
        const distance = Math.hypot((metric.x - x) * bounds.width, (metric.y - y) * bounds.height);
        const localImpulse = Math.exp(-0.5 * (distance / Math.max(1, settings.pointerRadius)) ** 2) * settings.pointerInfluence;
        // An impulse J changes velocity by J/m; pointer displacement scales its direction.
        spring.x.velocity += deltaX * settings.impulse * 12 * localImpulse / settings.mass;
        spring.y.velocity += deltaY * settings.impulse * 9 * localImpulse / settings.mass;
      }
    } else {
      for (let index = 0; index < typeUnitRefs.current.length; index += 1) {
        const metric = typeMetricsRef.current[index];
        const node = typeUnitRefs.current[index];
        if (!metric || !node) continue;
        const dx = (metric.x - x) * bounds.width;
        const dy = (metric.y - y) * bounds.height;
        const influence = Math.exp(-0.5 * (Math.hypot(dx, dy) / Math.max(1, settings.pointerRadius)) ** 2) * settings.pointerInfluence;
        node.style.setProperty('--unit-x', `${(clamp(dx / settings.pointerRadius, -1, 1) * 11 * influence).toFixed(2)}px`);
        node.style.setProperty('--unit-y', `${(clamp(dy / settings.pointerRadius, -1, 1) * 6 * influence).toFixed(2)}px`);
      }
    }
  };

  const clearTypePointer = () => {
    typePointerRef.current.active = false;
    if (!motion) {
      for (const node of typeUnitRefs.current) { node?.style.setProperty('--unit-x', '0px'); node?.style.setProperty('--unit-y', '0px'); }
    }
  };

  const numericParameters = Object.values(configuration.parameters).filter((value): value is number => typeof value === 'number');
  const contourPoints = Array.from({ length: 40 }, (_, index) => {
    const u = index / 39;
    const normalized = numericParameters.reduce((sum, value, item) => sum + Math.sin(value * (0.01 + item * 0.0007) + item * 1.7 + u * (2.5 + item * 0.39)) / Math.max(1, numericParameters.length), 0);
    const y = 116 - normalized * 42;
    return `${(20 + index * (760 / 39)).toFixed(1)},${Math.max(30, Math.min(204, y)).toFixed(1)}`;
  }).join(' ');

  const presetOptions = [...currentPresets.map(item => ({ value: item.id, label: item.label })), ...(presets[controlExperiment] === 'custom' ? [{ value: 'custom', label: 'Custom settings' }] : [])];

  useEffect(() => {
    const compactQuery = window.matchMedia('(max-width: 780px)');
    const updateCompact = () => setIsCompact(compactQuery.matches);
    updateCompact();
    compactQuery.addEventListener('change', updateCompact);
    return () => compactQuery.removeEventListener('change', updateCompact);
  }, []);

  useEffect(() => {
    if (!mobileSheetOpen) return;
    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    window.dispatchEvent(new CustomEvent('myovio:scroll-lock', { detail: true }));
    return () => {
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      window.dispatchEvent(new CustomEvent('myovio:scroll-lock', { detail: false }));
    };
  }, [mobileSheetOpen]);

  useEffect(() => {
    if (!isCompact || !settingsOpen) return;
    const trigger = settingsTriggerRef.current;
    const focusPanel = () => settingsCloseRef.current?.focus();
    const focusFrame = requestAnimationFrame(focusPanel);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSettingsOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const panel = settingsPanelRef.current;
      if (!panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, a[href], [tabindex]:not([tabindex="-1"])',
      )).filter(node => node.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', onKeyDown);
      if (window.matchMedia('(max-width: 780px)').matches) trigger?.focus({ preventScroll: true });
    };
  }, [isCompact, settingsOpen]);

  return <section className={styles.experience} aria-label="Interactive experiments">
    <div className={styles.workbenchTop}>
      <p className={styles.workbenchLabel}><span className={styles.liveMark} data-active={motion}/>{active === 'console' ? 'INSPECTOR / LIVE CONFIGURATION' : `${presented.number} / ${presented.format}`}</p>
      <p className={styles.motionNote}>{reducedMotion && !motion ? 'Still by default · play is always your choice' : motion ? 'The instrument is moving' : 'Motion is paused'}</p>
    </div>

    <div className={styles.workspace}>
      <nav className={styles.experimentIndex} aria-label="Select an experiment">
        {experiments.map(experiment => <button aria-pressed={active === experiment.id} className={styles.experimentButton} data-selected={active === experiment.id} key={experiment.id} onClick={() => chooseExperiment(experiment.id)} type="button">
          <span className={styles.experimentNumber}>{experiment.number}</span><span className={styles.experimentText}>{experiment.name}<small>{experiment.short}</small></span><span aria-hidden="true" className={styles.experimentArrow}>↗</span>
        </button>)}
        <button aria-pressed={active === 'console'} className={styles.inspectorButton} data-selected={active === 'console'} onClick={() => chooseExperiment('console')} type="button"><span aria-hidden="true">◇</span><span>Experiment console<small>Live recipe & model</small></span><span aria-hidden="true">↗</span></button>
      </nav>

      <div className={styles.activeStudy}>
        <div className={styles.stageFrame} data-study={active}>
          <div className={styles.stageTopline}>
            <span>{active === 'console' ? 'CONFIGURATION / LIVE' : `STUDY / ${selected.number}`}</span>
            <div className={styles.stageToolbar}>
              <span className={styles.stageRight}>{active === 'light' ? 'MOVE THROUGH THE LIGHT' : active === 'signal' ? 'DRAG TO SEND AN IMPULSE' : active === 'type' ? 'MOVE THROUGH THE TYPE' : active === 'gravity' ? 'DRAG AN ATTRACTOR' : active === 'waves' ? 'DRAG A WAVE SOURCE' : active === 'flow' ? 'MOVE THROUGH THE FIELD' : active === 'reaction' ? 'PAINT THE CONCENTRATIONS' : 'VALUES FROM THE ACTIVE STUDY'}</span>
              <button aria-controls={settingsId} aria-expanded={settingsOpen} aria-label={`${settingsOpen ? 'Hide' : 'Show'} ${controlInfo.name} settings`} className={styles.settingsToggle} onClick={() => setSettingsOpen(open => !open)} ref={settingsTriggerRef} type="button">
                <svg aria-hidden="true" className={styles.settingsGlyph} viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14"/><path d="M7 3v4M13 8v4M8 13v4"/></svg><span>Settings</span><svg aria-hidden="true" className={styles.settingsChevron} data-open={settingsOpen} viewBox="0 0 16 16" fill="none"><path d="m3 6 5 5 5-5"/></svg>
              </button>
            </div>
          </div>
          <div className={styles.stageBody}>
            {active === 'light' || active === 'signal' ? <CanvasStage key={active} mode={active} motion={motion} resetKey={resetKey} seed={seed} settings={active === 'light' ? light : signal}/> : null}
            {active === 'gravity' || active === 'waves' || active === 'flow' || active === 'reaction' ? <PhysicsStage key={active} mode={active} motion={motion} onPositionsChange={positions => {
              if (active === 'gravity') { setGravity(current => ({ ...current, attractors: current.attractors.map((point, index) => positions[index] ? { ...point, ...positions[index] } : point) })); markCustom('gravity'); }
              if (active === 'waves') { setWaves(current => ({ ...current, sources: current.sources.map((point, index) => positions[index] ? { ...point, ...positions[index], phase: (positions[index] as WaveSource).phase ?? point.phase } : point) })); markCustom('waves'); }
            }} resetKey={resetKey} seed={seed} settings={currentSettings as NewExperimentSettings}/> : null}
            {active === 'type' ? <div className={styles.typeStage} data-direction={type.direction} data-motion={motion ? 'on' : 'off'} data-repeat={type.repeat} data-style={type.reveal} onPointerLeave={clearTypePointer} onPointerMove={typePointerMove} ref={typeStageRef}>
              <p className={styles.typeIndex}>OVIO TYPE STUDY <span>—</span> {type.grouping === 'word' ? 'WORD SPRINGS' : 'CHARACTER SPRINGS'}</p>
              <h2 aria-label={type.phrase.replace(/\s+/gu, ' ').trim()} className={styles.typeDisplay} style={{ '--letter-space': `${type.letterSpacing}px`, '--word-space': `${type.wordSpacing}px`, '--type-font-size': `${type.fontSize}px`, '--type-line-height': String(type.lineSpacing), '--type-max-width': `${type.maxWidth}px`, '--type-align': type.alignment } as CSSProperties}>
                {(() => { let unitIndex = 0; return segments.map((part, index) => {
                  if (/^\s+$/u.test(part)) return <Fragment key={`space-${index}`}>{part}</Fragment>;
                  const currentIndex = unitIndex++;
                  const delay = type.stagger * currentIndex + (seed % 13) * 3;
                  return <span aria-hidden="true" className={styles.typeRevealUnit} key={`${index}-${part}`} style={{ animationDelay: `${delay}ms`, animationDuration: `${type.revealDuration}ms`, animationIterationCount: type.repeat ? 'infinite' : '1' }}><span className={styles.typePhysicsUnit} ref={typeRefCallbacks[index]}>{part}</span></span>;
                }); })()}
              </h2>
              <p className={styles.typeFootnote}>Space Grotesk / warm ivory / damped spring response</p>
            </div> : null}
            {active === 'console' ? <div className={styles.consoleStage}>
              <div className={styles.contourPanel}><div className={styles.contourHeading}><p>PARAMETER CONTOUR</p><span>{experiments.find(experiment => experiment.id === controlExperiment)?.name}</span></div>
                <svg className={styles.contourSvg} viewBox="0 0 800 230" role="img" aria-label="A live contour derived from the selected experiment parameters"><path className={styles.contourGrid} d="M20 30H780M20 80H780M20 130H780M20 180H780M20 20V210M210 20V210M400 20V210M590 20V210M780 20V210"/><polyline className={styles.contourLine} data-motion={motion} points={contourPoints}/></svg>
                <div className={styles.contourAxis}><span>lower response</span><span>higher response</span></div><p className={styles.contourCaption}>The contour responds to numeric controls in the current recipe. Copy the JSON to keep the complete configuration and seed.</p>
              </div>
              <div className={styles.configPanel}><div className={styles.configPanelTop}><span>LIVE RECIPE</span><span>{motion ? 'RUNNING' : 'PAUSED'}</span></div><p className={styles.recipeSummary}>{experiments.find(experiment => experiment.id === controlExperiment)?.name} · {configuration.preset} · seed {seed.toString().padStart(5, '0')}</p><details className={styles.recipeDetails}><summary>View configuration JSON</summary><pre aria-label="Current experiment configuration">{JSON.stringify(configuration, null, 2)}</pre></details><button className={styles.inlineAction} onClick={copyConfiguration} type="button">Copy this configuration <span aria-hidden="true">↗</span></button></div>
            </div> : null}
          </div>
        </div>

        <div className={styles.studyCaption}><div><p className={styles.studyFormat}>{presented.format}</p><h2>{presented.name}<span>.</span></h2></div><p>{presented.description}</p></div>
      </div>

      <button aria-hidden={!mobileSheetOpen} aria-label="Close experiment settings" className={styles.sheetScrim} disabled={!mobileSheetOpen} onClick={() => setSettingsOpen(false)} tabIndex={-1} type="button"/>

      <motionElement.section animate={isCompact ? { y: settingsOpen ? '0%' : '110%', opacity: settingsOpen ? 1 : 0, visibility: settingsOpen ? 'visible' : 'hidden' } : { y: '0%', opacity: 1, visibility: 'visible' }} aria-hidden={isCompact && !settingsOpen} aria-labelledby={settingsHeadingId} aria-modal={mobileSheetOpen ? true : undefined} className={styles.controlBench} data-compact={isCompact} data-open={settingsOpen} data-lenis-prevent id={settingsId} inert={isCompact && !settingsOpen} initial={false} ref={settingsPanelRef} role={mobileSheetOpen ? 'dialog' : 'region'} transition={reducedMotion ? { duration: 0 } : { y: { duration: 0.24, ease: motionTiming.ease }, opacity: { duration: 0.18, ease: motionTiming.ease }}}>
          <div className={styles.benchHead}>
            <div><p className={styles.benchEyebrow}>THE CONTROL SURFACE</p><h2 id={settingsHeadingId}>Tune the output.</h2></div>
            <p>Parameters shape a local simulation; nothing is uploaded or saved.</p>
            {isCompact ? <button aria-label="Close settings" className={styles.sheetClose} onClick={() => setSettingsOpen(false)} ref={settingsCloseRef} type="button"><span aria-hidden="true">×</span> Close</button> : null}
          </div>
          <div className={styles.benchBody}>
            <div className={styles.parameterArea}>
              <div className={styles.parameterHeading}><h3>{active === 'console' ? `${experiments.find(item => item.id === controlExperiment)?.name} settings` : `${selected.name} settings`}</h3><span>LIVE PARAMETERS</span></div>
              <div className={styles.parameterToolbar}><SelectField label="Preset" onChange={applyPreset} options={presetOptions} value={presets[controlExperiment]}/><span>{configuration.preset} · seed {seed.toString().padStart(5, '0')}</span></div>

              {controlExperiment === 'light' && <>
                <div className={styles.parameterGroup}><h4>Composition & motion</h4><div className={styles.parameterGrid}>
                  <RangeField format={value => `${value}%`} label="Illumination" max={100} min={0} onChange={value => updateLight('intensity', value)} value={light.intensity}/>
                  <RangeField format={value => `${value.toFixed(2)}×`} label="Source exposure" max={1.8} min={0.4} onChange={value => updateLight('exposure', value)} step={0.05} value={light.exposure}/>
                  <RangeField format={value => `${value}%`} label="Source position" max={68} min={5} onChange={value => updateLight('sourceX', value)} value={light.sourceX}/>
                  <RangeField format={value => `${value}%`} label="Band width" max={30} min={5} onChange={value => updateLight('bandWidth', value)} value={light.bandWidth}/>
                  <RangeField format={value => `${value.toFixed(2)} rad/s`} label="Flow speed" max={1.2} min={0} onChange={value => updateLight('flowSpeed', value)} step={0.02} value={light.flowSpeed}/>
                  <RangeField format={value => `${Math.round(value * 100)}%`} label="Pointer coupling" max={1} min={0} onChange={value => updateLight('pointerInfluence', value)} step={0.01} value={light.pointerInfluence}/>
                  <RangeField format={value => `${value}px`} label="Pointer radius" max={360} min={50} onChange={value => updateLight('pointerRadius', value)} value={light.pointerRadius}/>
                </div></div>
                <details className={styles.advancedSettings}><summary>Advanced field parameters <span>Exposure shaping, color, falloff & perturbation</span></summary><div className={styles.parameterGroup}><h4>Optics</h4><div className={styles.parameterGrid}>
                  <RangeField format={value => value.toFixed(2)} label="Contrast" max={1.8} min={0.5} onChange={value => updateLight('contrast', value)} step={0.05} value={light.contrast}/>
                  <RangeField format={value => `${value}% amber`} label="Red → amber balance" max={100} min={0} onChange={value => updateLight('warmth', value)} value={light.warmth}/>
                  <RangeField format={value => `${value}%`} label="Vertical spread" max={100} min={10} onChange={value => updateLight('verticalSpread', value)} value={light.verticalSpread}/>
                  <RangeField format={value => `${value}%`} label="Horizontal spread" max={100} min={20} onChange={value => updateLight('horizontalSpread', value)} value={light.horizontalSpread}/>
                  <RangeField format={value => `${(value / 10).toFixed(1)}×`} label="Distance falloff" max={45} min={5} onChange={value => updateLight('falloff', value)} value={light.falloff}/>
                  <RangeField format={value => `${value} layers`} label="Light layers" max={7} min={1} onChange={value => updateLight('layers', value)} value={light.layers}/>
                  <RangeField format={value => `${value}%`} label="Ambient darkness" max={98} min={35} onChange={value => updateLight('darkness', value)} value={light.darkness}/>
                </div></div><div className={styles.parameterGroup}><h4>Field dynamics</h4><div className={styles.parameterGrid}>
                  <RangeField format={value => value.toFixed(1)} label="Flow direction" max={1} min={-1} onChange={value => updateLight('flowDirection', value)} step={0.05} value={light.flowDirection}/>
                  <RangeField format={value => `${value}%`} label="Distortion" max={100} min={0} onChange={value => updateLight('distortion', value)} value={light.distortion}/>
                  <RangeField format={value => `${value}%`} label="Turbulence" max={100} min={0} onChange={value => updateLight('turbulence', value)} value={light.turbulence}/>
                  <RangeField format={value => `${value.toFixed(1)} cycles`} label="Spatial frequency" max={6} min={0.2} onChange={value => updateLight('spatialFrequency', value)} step={0.1} value={light.spatialFrequency}/>
                  <RangeField format={value => `${value.toFixed(2)} Hz`} label="Temporal frequency" max={1.6} min={0} onChange={value => updateLight('temporalFrequency', value)} step={0.02} value={light.temporalFrequency}/>
                  <RangeField format={value => value.toFixed(1)} label="Noise scale" max={5} min={0.2} onChange={value => updateLight('noiseScale', value)} step={0.1} value={light.noiseScale}/>
                  <RangeField format={value => value.toFixed(2)} label="Noise amplitude" max={0.8} min={0} onChange={value => updateLight('noiseAmplitude', value)} step={0.02} value={light.noiseAmplitude}/>
                  <RangeField format={value => `${value.toFixed(1)} s⁻¹`} label="Pointer response" max={18} min={0.5} onChange={value => updateLight('response', value)} step={0.5} value={light.response}/>
                </div></div></details>
              </>}

              {controlExperiment === 'signal' && <>
                <div className={styles.parameterGroup}><h4>Shape & impulse</h4><div className={styles.parameterGrid}>
                  <RangeField format={value => `${value} lines`} label="Line density" max={76} min={20} onChange={value => updateSignal('density', value)} step={2} value={signal.density}/>
                  <RangeField format={value => `${value}px`} label="Contour amplitude" max={54} min={4} onChange={value => updateSignal('amplitude', value)} value={signal.amplitude}/>
                  <RangeField format={value => `${value}px`} label="Wavelength" max={420} min={65} onChange={value => updateSignal('wavelength', value)} value={signal.wavelength}/>
                  <RangeField format={value => `${value}%`} label="Impulse strength" max={100} min={0} onChange={value => updateSignal('forceStrength', value)} value={signal.forceStrength}/>
                  <RangeField format={value => `${value}px`} label="Influence radius" max={360} min={40} onChange={value => updateSignal('influenceRadius', value)} value={signal.influenceRadius}/>
                  <RangeField format={value => `${value.toFixed(1)} kg`} label="Virtual mass" max={4} min={0.4} onChange={value => updateSignal('mass', value)} step={0.1} value={signal.mass}/>
                  <RangeField format={value => `${value.toFixed(1)} s⁻²`} label="Spring stiffness" max={50} min={4} onChange={value => updateSignal('stiffness', value)} step={0.5} value={signal.stiffness}/>
                  <RangeField format={value => `${value.toFixed(1)} s⁻¹`} label="Damping" max={12} min={0.2} onChange={value => updateSignal('damping', value)} step={0.1} value={signal.damping}/>
                </div></div>
                <details className={styles.advancedSettings}><summary>Advanced field parameters <span>Geometry, propagation, decay & sensitivity</span></summary><div className={styles.parameterGroup}><h4>Contour geometry</h4><div className={styles.parameterGrid}>
                  <RangeField format={value => `${value}°`} label="Phase offset" max={360} min={0} onChange={value => updateSignal('phaseOffset', value)} value={signal.phaseOffset}/>
                  <RangeField format={value => `${value}%`} label="Curvature" max={100} min={0} onChange={value => updateSignal('curvature', value)} value={signal.curvature}/>
                  <RangeField format={value => `${value}°`} label="Baseline direction" max={15} min={-15} onChange={value => updateSignal('baselineDirection', value)} value={signal.baselineDirection}/>
                  <RangeField format={value => `${value}%`} label="Edge fade" max={90} min={0} onChange={value => updateSignal('edgeFade', value)} value={signal.edgeFade}/>
                  <RangeField format={value => `${value}%`} label="Field extent" max={100} min={55} onChange={value => updateSignal('extent', value)} value={signal.extent}/>
                  <RangeField format={value => `${value}%`} label="Atmosphere brightness" max={100} min={20} onChange={value => updateSignal('brightness', value)} value={signal.brightness}/>
                </div></div><div className={styles.parameterGroup}><h4>Wave response</h4><div className={styles.parameterGrid}>
                  <RangeField format={value => `${Math.round(value * 100)}%`} label="Momentum persistence" max={1} min={0.1} onChange={value => updateSignal('momentumPersistence', value)} step={0.01} value={signal.momentumPersistence}/>
                  <RangeField format={value => `${value.toFixed(1)}×`} label="Ripple speed" max={2.4} min={0.3} onChange={value => updateSignal('rippleSpeed', value)} step={0.1} value={signal.rippleSpeed}/>
                  <RangeField format={value => `${value.toFixed(2)} Hz`} label="Wave frequency" max={3} min={0.25} onChange={value => updateSignal('frequency', value)} step={0.05} value={signal.frequency}/>
                  <RangeField format={value => `${value.toFixed(2)} s⁻¹`} label="Wave decay" max={1.8} min={0} onChange={value => updateSignal('waveDecay', value)} step={0.05} value={signal.waveDecay}/>
                  <RangeField format={value => value.toFixed(2)} label="Turbulence" max={0.8} min={0} onChange={value => updateSignal('turbulence', value)} step={0.02} value={signal.turbulence}/>
                  <RangeField format={value => value.toFixed(2)} label="Pointer sensitivity" max={2} min={0.2} onChange={value => updateSignal('sensitivity', value)} step={0.05} value={signal.sensitivity}/>
                </div></div></details>
              </>}

              {controlExperiment === 'type' && <>
                <label className={styles.textField} htmlFor="lab-type-phrase"><span>Editable sample phrase</span><textarea id="lab-type-phrase" maxLength={120} onChange={event => updateType('phrase', event.currentTarget.value)} rows={2} value={type.phrase}/></label>
                <div className={styles.parameterGroup}><h4>Typography & touch</h4><div className={styles.parameterGrid}>
                  <RangeField format={value => `${value}px`} label="Font size" max={104} min={42} onChange={value => updateType('fontSize', value)} value={type.fontSize}/>
                  <RangeField format={value => `${value}px`} label="Letter spacing" max={12} min={-2} onChange={value => updateType('letterSpacing', value)} value={type.letterSpacing}/>
                  <RangeField format={value => `${Math.round(value * 100)}%`} label="Pointer influence" max={1} min={0} onChange={value => updateType('pointerInfluence', value)} step={0.01} value={type.pointerInfluence}/>
                  <RangeField format={value => `${value}px`} label="Influence radius" max={400} min={60} onChange={value => updateType('pointerRadius', value)} value={type.pointerRadius}/>
                </div></div>
                <details className={styles.advancedSettings}><summary>Advanced type parameters <span>Spacing, reveal, alignment & physical response</span></summary><div className={styles.parameterGroup}><h4>Composition & reveal</h4><div className={styles.parameterGrid}>
                  <RangeField format={value => `${value}px`} label="Word spacing" max={18} min={0} onChange={value => updateType('wordSpacing', value)} value={type.wordSpacing}/>
                  <RangeField format={value => value.toFixed(2)} label="Line spacing" max={1.4} min={0.85} onChange={value => updateType('lineSpacing', value)} step={0.01} value={type.lineSpacing}/>
                  <RangeField format={value => `${value}px`} label="Maximum width" max={950} min={320} onChange={value => updateType('maxWidth', value)} value={type.maxWidth}/>
                  <RangeField format={value => `${value}ms`} label="Reveal duration" max={1600} min={180} onChange={value => updateType('revealDuration', value)} step={20} value={type.revealDuration}/>
                  <RangeField format={value => `${value}ms`} label="Reveal stagger" max={120} min={0} onChange={value => updateType('stagger', value)} value={type.stagger}/>
                </div><ChoiceField<Alignment> label="Alignment" onChange={value => updateType('alignment', value)} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} value={type.alignment}/>
                  <ChoiceField<Grouping> label="Physical grouping" onChange={value => { typeSpringsRef.current = []; updateType('grouping', value); }} options={[{ value: 'word', label: 'Words' }, { value: 'character', label: 'Characters' }]} value={type.grouping}/>
                  <ChoiceField<RevealStyle> label="Reveal style" onChange={value => updateType('reveal', value)} options={[{ value: 'unfold', label: 'Unfold' }, { value: 'lift', label: 'Lift' }]} value={type.reveal}/>
                  <ChoiceField<RevealDirection> label="Reveal direction" onChange={value => updateType('direction', value)} options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }, { value: 'up', label: 'Up' }, { value: 'down', label: 'Down' }]} value={type.direction}/>
                  <ToggleField checked={type.repeat} label="Repeat the reveal" onChange={value => updateType('repeat', value)}/>
                </div><div className={styles.parameterGroup}><h4>Mass–spring response</h4><div className={styles.parameterGrid}>
                  <RangeField format={value => `${value.toFixed(1)} kg`} label="Virtual mass" max={4} min={0.4} onChange={value => updateType('mass', value)} step={0.1} value={type.mass}/>
                  <RangeField format={value => `${value.toFixed(0)} s⁻²`} label="Spring stiffness" max={180} min={12} onChange={value => updateType('stiffness', value)} step={2} value={type.stiffness}/>
                  <RangeField format={value => `${value.toFixed(1)} s⁻¹`} label="Damping" max={32} min={1} onChange={value => updateType('damping', value)} step={0.5} value={type.damping}/>
                  <RangeField format={value => `${value}px/s`} label="Initial impulse" max={150} min={0} onChange={value => updateType('impulse', value)} value={type.impulse}/>
                </div><ToggleField checked={type.returnToRest} label="Return to rest when the pointer leaves" onChange={value => updateType('returnToRest', value)}/></div></details>
              </>}

              {controlExperiment === 'gravity' && <PhysicsControls mode="gravity" onUpdate={value => updateNewExperiment('gravity', value)} settings={gravity}/>}
              {controlExperiment === 'waves' && <PhysicsControls mode="waves" onUpdate={value => updateNewExperiment('waves', value)} settings={waves}/>}
              {controlExperiment === 'flow' && <PhysicsControls mode="flow" onUpdate={value => updateNewExperiment('flow', value)} settings={flow}/>}
              {controlExperiment === 'reaction' && <PhysicsControls mode="reaction" onUpdate={value => updateNewExperiment('reaction', value)} settings={reaction}/>}

              <div className={styles.parameterReadout}><span>Reproducible seed</span><output>{seed.toString().padStart(5, '0')}</output></div>
              {active === 'console' ? <details className={styles.consoleValues}><summary>Values in the recipe</summary><dl>{Object.entries(configuration.parameters).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></div>)}</dl></details> : null}
            </div>

            <div className={styles.actionArea}><p className={styles.actionEyebrow}>PLAYBACK & TOOLS</p>
              <button aria-pressed={motion} className={styles.motionButton} onClick={() => setMotionChoice(value => !(value ?? !reducedMotion))} type="button"><span aria-hidden="true" className={styles.motionIcon}>{motion ? 'Ⅱ' : '▶'}</span>{motion ? 'Pause motion' : 'Play motion'}</button>
              <div className={styles.secondaryActions}>{controlExperiment !== 'type' ? <button className={styles.textAction} onClick={nextComposition} type="button">Randomize seed <span aria-hidden="true">↗</span></button> : null}<button className={styles.textAction} onClick={active === 'console' ? resetAll : () => resetExperiment(controlExperiment)} type="button">{active === 'console' ? 'Reset all settings' : 'Reset study'}</button><button className={styles.textAction} onClick={copyConfiguration} type="button">Copy config <span aria-hidden="true">↗</span></button></div>
              <p className={styles.motionHint}>{reducedMotion && !motion ? 'Motion is still by default. Play motion is always available by choice.' : 'Rendering pauses when another study or browser tab is active.'}</p>
            </div>
          </div>
          <p className={styles.status} role="status" aria-live="polite">{status}</p>
        </motionElement.section>
    </div>
  </section>;
}
