'use client';

import { useId } from 'react';
import type { ReactNode } from 'react';
import { defaultGravity } from './lab-model';
import type { FlowSettings, GravitySettings, NewExperiment, NewExperimentSettings, ReactionSettings, WaveSettings } from './lab-model';
import styles from './lab.module.css';

type Props = { mode: NewExperiment; settings: NewExperimentSettings; onUpdate: (settings: NewExperimentSettings) => void };

function RangeField({ label, value, min, max, step = 1, format = value => String(value), onChange }: {
  label: string; value: number; min: number; max: number; step?: number; format?: (value: number) => string; onChange: (value: number) => void;
}) {
  const id = useId();
  return <label className={styles.rangeControl} htmlFor={id}><span>{label}<output htmlFor={id}>{format(value)}</output></span><input id={id} max={max} min={min} onChange={event => onChange(Number(event.currentTarget.value))} step={step} type="range" value={value}/></label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  const id = useId();
  return <label className={styles.selectControl} htmlFor={id}><span>{label}</span><select id={id} onChange={event => onChange(event.currentTarget.value)} value={value}>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return <div className={styles.parameterGroup}><h4>{title}</h4><div className={styles.parameterGrid}>{children}</div></div>;
}

export default function PhysicsControls({ mode, settings, onUpdate }: Props) {
  if (mode === 'gravity') {
    const value = settings as GravitySettings;
    const update = <K extends keyof GravitySettings>(key: K, next: GravitySettings[K]) => onUpdate({ ...value, [key]: next });
    return <>
      <Group title="Composition">
        <RangeField label="Particle count" min={40} max={500} step={20} value={value.particleCount} format={next => `${next} particles`} onChange={next => update('particleCount', next)}/>
        <RangeField label="Attractor count" min={1} max={3} value={value.attractorCount} format={next => `${next} attractor${next === 1 ? '' : 's'}`} onChange={next => onUpdate({ ...value, attractorCount: next, attractors: Array.from({ length: Math.max(next, value.attractors.length) }, (_, index) => value.attractors[index] ?? defaultGravity.attractors[index]) })}/>
        <RangeField label="Attractor X position" min={5} max={95} value={(value.attractors[0]?.x ?? 0.5) * 100} format={next => `${Math.round(next)}%`} onChange={next => update('attractors', value.attractors.map((point, index) => index === 0 ? { ...point, x: next / 100 } : point))}/>
        <RangeField label="Attractor Y position" min={8} max={92} value={(value.attractors[0]?.y ?? 0.52) * 100} format={next => `${Math.round(next)}%`} onChange={next => update('attractors', value.attractors.map((point, index) => index === 0 ? { ...point, y: next / 100 } : point))}/>
      </Group>
      <details className={styles.advancedSettings}><summary>Advanced gravity parameters <span>Mass, response & trail rendering</span></summary><Group title="Dynamics">
        <RangeField label="Gravitational strength" min={0.002} max={0.02} step={0.001} value={value.strength} format={next => next.toFixed(3)} onChange={next => update('strength', next)}/>
        <RangeField label="Attractor mass" min={0.3} max={3} step={0.1} value={value.attractorMass} format={next => `${next.toFixed(1)} M`} onChange={next => update('attractorMass', next)}/>
        <RangeField label="Initial velocity" min={0.05} max={0.7} step={0.01} value={value.initialVelocity} format={next => `${next.toFixed(2)} u/s`} onChange={next => update('initialVelocity', next)}/>
        <RangeField label="Orbital bias" min={0} max={1} step={0.01} value={value.orbitalBias} format={next => `${Math.round(next * 100)}%`} onChange={next => update('orbitalBias', next)}/>
        <RangeField label="Velocity drag" min={0} max={0.2} step={0.005} value={value.drag} format={next => next.toFixed(3)} onChange={next => update('drag', next)}/>
        <RangeField label="Trail persistence" min={0.55} max={0.98} step={0.01} value={value.trailPersistence} format={next => `${Math.round(next * 100)}%`} onChange={next => update('trailPersistence', next)}/>
        <RangeField label="Softening radius" min={0.015} max={0.1} step={0.005} value={value.softening} format={next => next.toFixed(3)} onChange={next => update('softening', next)}/>
      </Group></details>
      <p className={styles.interactionHint}>Drag an attractor in the field, or use the position controls above. Test-particle mass is omitted because it cancels from gravitational acceleration.</p>
    </>;
  }

  if (mode === 'waves') {
    const value = settings as WaveSettings;
    const update = <K extends keyof WaveSettings>(key: K, next: WaveSettings[K]) => onUpdate({ ...value, [key]: next });
    return <>
      <Group title="Composition">
        <RangeField label="Wave sources" min={1} max={4} value={value.sourceCount} format={next => `${next} sources`} onChange={next => onUpdate({ ...value, sourceCount: next, sources: Array.from({ length: Math.max(next, value.sources.length) }, (_, index) => value.sources[index] ?? { x: index % 2 ? 0.68 : 0.32, y: index < 2 ? 0.36 : 0.66, phase: index * value.phaseOffset * Math.PI / 180 }) })}/>
        <RangeField label="Amplitude" min={0.2} max={1.4} step={0.02} value={value.amplitude} format={next => next.toFixed(2)} onChange={next => update('amplitude', next)}/>
        <RangeField label="Wavelength" min={0.045} max={0.34} step={0.005} value={value.wavelength} format={next => `${Math.round(next * 100)}% field`} onChange={next => update('wavelength', next)}/>
        <RangeField label="Source 1 X" min={5} max={95} value={(value.sources[0]?.x ?? 0.38) * 100} format={next => `${Math.round(next)}%`} onChange={next => update('sources', value.sources.map((source, index) => index === 0 ? { ...source, x: next / 100 } : source))}/>
        <RangeField label="Source 1 Y" min={8} max={92} value={(value.sources[0]?.y ?? 0.48) * 100} format={next => `${Math.round(next)}%`} onChange={next => update('sources', value.sources.map((source, index) => index === 0 ? { ...source, y: next / 100 } : source))}/>
      </Group>
      <details className={styles.advancedSettings}><summary>Advanced wave parameters <span>Frequency, decay, palette & motion</span></summary><Group title="Wave dynamics">
        <RangeField label="Frequency" min={0.1} max={1.6} step={0.02} value={value.frequency} format={next => `${next.toFixed(2)} Hz`} onChange={next => update('frequency', next)}/>
        <RangeField label="Phase offset" min={0} max={360} value={value.phaseOffset} format={next => `${next}°`} onChange={next => update('phaseOffset', next)}/>
        <RangeField label="Propagation speed" min={0.15} max={1.8} step={0.05} value={value.speed} format={next => `${next.toFixed(2)}×`} onChange={next => update('speed', next)}/>
        <RangeField label="Spatial decay" min={0.2} max={6} step={0.1} value={value.decay} format={next => next.toFixed(1)} onChange={next => update('decay', next)}/>
        <RangeField label="Visualization scale" min={0.35} max={1.8} step={0.05} value={value.visualizationScale} format={next => `${next.toFixed(2)}×`} onChange={next => update('visualizationScale', next)}/>
        <RangeField label="Ivory / amber balance" min={0} max={1} step={0.01} value={value.paletteBalance} format={next => `${Math.round(next * 100)}% amber`} onChange={next => update('paletteBalance', next)}/>
        <RangeField label="Motion speed" min={0} max={1.4} step={0.05} value={value.motionSpeed} format={next => `${next.toFixed(2)}×`} onChange={next => update('motionSpeed', next)}/>
      </Group></details>
      <p className={styles.interactionHint}>Drag a source in the field, or adjust source 1 with the keyboard-accessible position controls.</p>
    </>;
  }

  if (mode === 'flow') {
    const value = settings as FlowSettings;
    const update = <K extends keyof FlowSettings>(key: K, next: FlowSettings[K]) => onUpdate({ ...value, [key]: next });
    return <>
      <Group title="Composition">
        <RangeField label="Particle count" min={80} max={760} step={20} value={value.particleCount} format={next => `${next} particles`} onChange={next => update('particleCount', next)}/>
        <RangeField label="Current strength" min={0.08} max={0.65} step={0.01} value={value.strength} format={next => `${next.toFixed(2)} u/s`} onChange={next => update('strength', next)}/>
        <RangeField label="Field rotation" min={-3.14} max={3.14} step={0.05} value={value.rotation} format={next => `${Math.round(next * 180 / Math.PI)}°`} onChange={next => update('rotation', next)}/>
        <RangeField label="Spatial scale" min={0.5} max={5} step={0.1} value={value.spatialScale} format={next => `${next.toFixed(1)} cycles`} onChange={next => update('spatialScale', next)}/>
      </Group>
      <details className={styles.advancedSettings}><summary>Advanced field parameters <span>Turbulence, interaction & boundaries</span></summary><Group title="Field response">
        <RangeField label="Turbulence" min={0} max={1} step={0.02} value={value.turbulence} format={next => `${Math.round(next * 100)}%`} onChange={next => update('turbulence', next)}/>
        <RangeField label="Time speed" min={0.15} max={1.5} step={0.05} value={value.timeSpeed} format={next => `${next.toFixed(2)}×`} onChange={next => update('timeSpeed', next)}/>
        <RangeField label="Trail persistence" min={0.5} max={0.97} step={0.01} value={value.trailPersistence} format={next => `${Math.round(next * 100)}%`} onChange={next => update('trailPersistence', next)}/>
        <RangeField label="Pointer influence" min={0} max={1} step={0.01} value={value.pointerInfluence} format={next => `${Math.round(next * 100)}%`} onChange={next => update('pointerInfluence', next)}/>
        <RangeField label="Influence radius" min={0.05} max={0.45} step={0.01} value={value.influenceRadius} format={next => `${Math.round(next * 100)}%`} onChange={next => update('influenceRadius', next)}/>
        <SelectField label="Boundary behavior" onChange={next => update('boundary', next as FlowSettings['boundary'])} options={[{ value: 'wrap', label: 'Wrap through edges' }, { value: 'reflect', label: 'Reflect at edges' }]} value={value.boundary}/>
      </Group></details>
      <p className={styles.interactionHint}>Move or touch the field to add a local vortex. Seed controls reproduce starting particle positions.</p>
    </>;
  }

  const value = settings as ReactionSettings;
  const update = <K extends keyof ReactionSettings>(key: K, next: ReactionSettings[K]) => onUpdate({ ...value, [key]: next });
  return <>
    <Group title="Reaction kinetics">
      <RangeField label="Feed rate" min={0.02} max={0.065} step={0.0005} value={value.feed} format={next => next.toFixed(4)} onChange={next => update('feed', next)}/>
      <RangeField label="Kill rate" min={0.045} max={0.07} step={0.0005} value={value.kill} format={next => next.toFixed(4)} onChange={next => update('kill', next)}/>
      <RangeField label="Simulation speed" min={0.2} max={1.4} step={0.05} value={value.speed} format={next => `${next.toFixed(2)}×`} onChange={next => update('speed', next)}/>
      <RangeField label="Grid resolution" min={72} max={160} step={8} value={value.resolution} format={next => `${next} × ${Math.round(next * 0.62)}`} onChange={next => update('resolution', next)}/>
    </Group>
    <details className={styles.advancedSettings}><summary>Advanced reaction parameters <span>Diffusion, palette & initial pattern</span></summary><Group title="Brush & diffusion">
      <RangeField label="Brush size" min={0.012} max={0.12} step={0.002} value={value.brushSize} format={next => `${Math.round(next * 100)}%`} onChange={next => update('brushSize', next)}/>
      <RangeField label="Brush intensity" min={0.1} max={1} step={0.02} value={value.brushIntensity} format={next => `${Math.round(next * 100)}%`} onChange={next => update('brushIntensity', next)}/>
      <RangeField label="Species A diffusion" min={0.35} max={1.35} step={0.05} value={value.diffusionA} format={next => next.toFixed(2)} onChange={next => update('diffusionA', next)}/>
      <RangeField label="Species B diffusion" min={0.12} max={0.75} step={0.02} value={value.diffusionB} format={next => next.toFixed(2)} onChange={next => update('diffusionB', next)}/>
      <RangeField label="Palette warmth" min={0} max={1} step={0.01} value={value.palette} format={next => `${Math.round(next * 100)}%`} onChange={next => update('palette', next)}/>
      <SelectField label="Initial pattern" onChange={next => update('pattern', next as ReactionSettings['pattern'])} options={[{ value: 'center', label: 'Center seed' }, { value: 'scattered', label: 'Scattered seeds' }, { value: 'rings', label: 'Ring seeds' }]} value={value.pattern}/>
    </Group></details>
    <p className={styles.interactionHint}>Paint directly into the B concentration field. Feed and kill rates change the evolving pattern, not just its color.</p>
  </>;
}
