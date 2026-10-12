'use client';

import dynamic from 'next/dynamic';
import { useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { useMotionPreference } from '../../lib/useMotionPreference';
import styles from './lab.module.css';
import type { CanvasStageProps } from './CanvasStage';

type ExperimentId = 'light' | 'type' | 'signal' | 'console';
type ArtExperiment = Exclude<ExperimentId, 'console'>;
type RevealStyle = 'unfold' | 'lift';

const CanvasStage = dynamic<CanvasStageProps>(() => import('./CanvasStage'), {
  ssr: false,
  loading: () => <div className={styles.stageFallback} aria-hidden="true"><i/><i/><i/><span/></div>,
});

const experiments: { id: ExperimentId; number: string; name: string; short: string; format: string; description: string }[] = [
  { id: 'light', number: '01', name: 'Light field', short: 'Bend the atmosphere', format: 'Canvas / generative light', description: 'Broad bands of scarlet and ember shift through a dark field. Move across the surface to pull the light off its axis.' },
  { id: 'type', number: '02', name: 'Type in motion', short: 'Give a phrase some weight', format: 'CSS / kinetic type', description: 'A type specimen with room to breathe. Change its tracking, choose a reveal, then draw a little tension through the line.' },
  { id: 'signal', number: '03', name: 'Signal field', short: 'Disturb the signal', format: 'Canvas / vector field', description: 'Fine, measured contours bend around your pointer, then settle back into a quiet, precise field.' },
  { id: 'console', number: '04', name: 'Experiment console', short: 'Inspect the live recipe', format: 'Live configuration / SVG', description: 'A working control surface. Every value here belongs to the experiment you were just shaping.' },
];

const phrases = [
  ['Good ideas', 'need a surface.'],
  ['Make room', 'for the unknown.'],
  ['Form follows', 'feeling.'],
] as const;

const defaults = { intensity: 68, density: 46, letterSpacing: 0, typeStrength: 48, reveal: 'unfold' as RevealStyle, phrase: 0, seed: 6214 };

export default function LabExperience() {
  const reducedMotion = useMotionPreference();
  const [active, setActive] = useState<ExperimentId>('light');
  const [lastArt, setLastArt] = useState<ArtExperiment>('light');
  const [motionChoice, setMotionChoice] = useState<boolean | null>(null);
  const motion = motionChoice ?? !reducedMotion;
  const [intensity, setIntensity] = useState(defaults.intensity);
  const [density, setDensity] = useState(defaults.density);
  const [letterSpacing, setLetterSpacing] = useState(defaults.letterSpacing);
  const [typeStrength, setTypeStrength] = useState(defaults.typeStrength);
  const [reveal, setReveal] = useState<RevealStyle>(defaults.reveal);
  const [phrase, setPhrase] = useState(defaults.phrase);
  const [seed, setSeed] = useState(defaults.seed);
  const [status, setStatus] = useState('The light field is ready to explore.');
  const typeStageRef = useRef<HTMLDivElement>(null);
  const intensityId = useId();
  const densityId = useId();
  const spacingId = useId();
  const strengthId = useId();
  const controlExperiment: ArtExperiment = active === 'console' ? lastArt : active;
  const selected = experiments.find(experiment => experiment.id === active) ?? experiments[0];

  const chooseExperiment = (id: ExperimentId) => {
    setActive(id);
    if (id !== 'console') setLastArt(id);
    setStatus(`${experiments.find(experiment => experiment.id === id)?.name ?? 'Experiment'} selected.`);
  };

  const resetExperiment = (id: ArtExperiment) => {
    if (id === 'light') { setIntensity(defaults.intensity); setSeed(defaults.seed); }
    if (id === 'signal') { setIntensity(defaults.intensity); setDensity(defaults.density); setSeed(defaults.seed); }
    if (id === 'type') {
      setLetterSpacing(defaults.letterSpacing);
      setTypeStrength(defaults.typeStrength);
      setReveal(defaults.reveal);
      setPhrase(defaults.phrase);
      typeStageRef.current?.style.setProperty('--type-x', '0px');
      typeStageRef.current?.style.setProperty('--type-y', '0px');
    }
    setStatus(`${experiments.find(experiment => experiment.id === id)?.name ?? 'Experiment'} reset.`);
  };

  const resetAll = () => {
    setIntensity(defaults.intensity);
    setDensity(defaults.density);
    setLetterSpacing(defaults.letterSpacing);
    setTypeStrength(defaults.typeStrength);
    setReveal(defaults.reveal);
    setPhrase(defaults.phrase);
    setSeed(defaults.seed);
    setMotionChoice(null);
    typeStageRef.current?.style.setProperty('--type-x', '0px');
    typeStageRef.current?.style.setProperty('--type-y', '0px');
    setStatus('All experiments returned to their starting settings.');
  };

  const nextComposition = () => {
    setSeed(current => (current * 37 + 7919) % 100000);
    setStatus('A new composition is in place.');
  };

  const configuration = useMemo(() => {
    const parameters = controlExperiment === 'light'
      ? { intensity, seed }
      : controlExperiment === 'signal'
        ? { density, intensity, seed }
        : { letterSpacing, motionStrength: typeStrength, reveal, phrase: phrases[phrase].join(' ') };
    return { experiment: controlExperiment, motion: motion ? 'playing' : 'paused', parameters };
  }, [controlExperiment, density, intensity, letterSpacing, motion, phrase, reveal, seed, typeStrength]);

  const copyConfiguration = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(configuration, null, 2));
      setStatus('Current experiment settings copied as JSON.');
    } catch {
      setStatus('Clipboard access is unavailable here. Copy was not completed.');
    }
  };

  const typePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!motion || event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const amount = typeStrength / 100;
    event.currentTarget.style.setProperty('--type-x', `${((event.clientX - bounds.left) / bounds.width - 0.5) * amount * 18}px`);
    event.currentTarget.style.setProperty('--type-y', `${((event.clientY - bounds.top) / bounds.height - 0.5) * amount * 8}px`);
  };

  const clearTypePointer = () => {
    typeStageRef.current?.style.setProperty('--type-x', '0px');
    typeStageRef.current?.style.setProperty('--type-y', '0px');
  };

  const consoleValues = controlExperiment === 'light'
    ? { intensity: `${intensity}%`, seed }
    : controlExperiment === 'signal'
      ? { density: `${density} lines`, intensity: `${intensity}%`, seed }
      : { letterSpacing: `${letterSpacing}px`, motionStrength: `${typeStrength}%`, reveal, phrase: phrases[phrase].join(' ') };
  const plotStrength = controlExperiment === 'type' ? typeStrength / 100 : intensity / 100;
  const plotDensity = controlExperiment === 'signal' ? density / 80 : controlExperiment === 'type' ? (letterSpacing + 3) / 15 : plotStrength;
  const contourPoints = Array.from({ length: 28 }, (_, index) => {
    const x = 20 + index * (760 / 27);
    const u = index / 27;
    const wobble = Math.sin(u * 8.5 + seed * 0.0013) * (16 + plotDensity * 20) + Math.sin(u * 3.2 + seed * 0.0004) * 14;
    const y = 128 - plotStrength * 54 - wobble;
    return `${x.toFixed(1)},${Math.max(28, Math.min(204, y)).toFixed(1)}`;
  }).join(' ');

  return <section className={styles.experience} aria-label="Interactive experiments">
    <div className={styles.workbenchTop}>
      <p className={styles.workbenchLabel}><span className={styles.liveMark} data-active={motion}/>{selected.number} <span aria-hidden="true">/</span> {selected.format}</p>
      <p className={styles.motionNote}>{reducedMotion && !motion ? 'Still by default · play is always your choice' : motion ? 'The instrument is moving' : 'Motion is paused'}</p>
    </div>

    <div className={styles.workspace}>
      <nav className={styles.experimentIndex} aria-label="Select an experiment">
        {experiments.map(experiment => <button
          aria-pressed={active === experiment.id}
          className={styles.experimentButton}
          data-selected={active === experiment.id}
          key={experiment.id}
          onClick={() => chooseExperiment(experiment.id)}
          type="button"
        >
          <span className={styles.experimentNumber}>{experiment.number}</span>
          <span className={styles.experimentText}>{experiment.name}<small>{experiment.short}</small></span>
          <span className={styles.experimentArrow} aria-hidden="true">↗</span>
        </button>)}
      </nav>

      <div className={styles.activeStudy}>
        <div className={styles.stageFrame} data-study={active}>
          <div className={styles.stageTopline}>
            <span>{active === 'console' ? 'CONFIGURATION / LIVE' : `STUDY / ${selected.number}`}</span>
            <span className={styles.stageRight}>{active === 'light' ? 'MOVE THROUGH THE LIGHT' : active === 'signal' ? 'MOVE TO BEND THE FIELD' : active === 'type' ? 'MOVE TO SET THE TENSION' : 'VALUES FROM THE ACTIVE STUDY'}</span>
          </div>
          <div className={styles.stageBody}>
            {active === 'light' || active === 'signal' ? <CanvasStage
              mode={active}
              motion={motion}
              intensity={intensity}
              density={density}
              seed={seed}
            /> : null}

            {active === 'type' ? <div
              className={styles.typeStage}
              data-motion={motion ? 'on' : 'off'}
              data-style={reveal}
              onPointerMove={typePointerMove}
              onPointerLeave={clearTypePointer}
              ref={typeStageRef}
            >
              <p className={styles.typeIndex}>OVIO TYPE STUDY <span>—</span> {String(phrase + 1).padStart(2, '0')}</p>
              <h2 className={styles.typeDisplay} style={{ '--letter-space': `${letterSpacing}px` } as CSSProperties}>
                <span key={`${phrase}-${reveal}`} className={styles.typeReveal}>{phrases[phrase][0]}<br/>{phrases[phrase][1]}</span>
              </h2>
              <p className={styles.typeFootnote}>Space Grotesk / warm ivory / live tracking</p>
            </div> : null}

            {active === 'console' ? <div className={styles.consoleStage}>
              <div className={styles.contourPanel}>
                <div className={styles.contourHeading}><p>PARAMETER CONTOUR</p><span>{experiments.find(experiment => experiment.id === controlExperiment)?.name}</span></div>
                <svg className={styles.contourSvg} viewBox="0 0 800 230" role="img" aria-label="A live contour mapped from the selected experiment settings">
                  <path className={styles.contourGrid} d="M20 30H780M20 80H780M20 130H780M20 180H780M20 20V210M210 20V210M400 20V210M590 20V210M780 20V210"/>
                  <polyline className={styles.contourLine} data-motion={motion} points={contourPoints}/>
                </svg>
                <div className={styles.contourAxis}><span>lower influence</span><span>higher influence</span></div>
                <p className={styles.contourCaption}>This line is mapped from the current intensity, density, or type settings — change a control below to reshape it.</p>
              </div>
              <div className={styles.configPanel}>
                <div className={styles.configPanelTop}><span>LIVE RECIPE</span><span>{motion ? 'RUNNING' : 'PAUSED'}</span></div>
                <pre aria-label="Current experiment configuration">{JSON.stringify(configuration, null, 2)}</pre>
                <button className={styles.inlineAction} onClick={copyConfiguration} type="button">Copy this configuration <span aria-hidden="true">↗</span></button>
              </div>
            </div> : null}
          </div>
        </div>

        <div className={styles.studyCaption}>
          <div><p className={styles.studyFormat}>{selected.format}</p><h2>{selected.name}<span>.</span></h2></div>
          <p>{selected.description}</p>
        </div>
      </div>
    </div>

    <section className={styles.controlBench} aria-labelledby="bench-title">
      <div className={styles.benchHead}>
        <div><p className={styles.benchEyebrow}>THE CONTROL SURFACE</p><h2 id="bench-title">Tune the output.</h2></div>
        <p>Changes are local to this page. Nothing is uploaded or saved.</p>
      </div>
      <div className={styles.benchBody}>
        <div className={styles.parameterArea}>
          <div className={styles.parameterHeading}><h3>{active === 'console' ? `${experiments.find(item => item.id === controlExperiment)?.name} settings` : `${selected.name} settings`}</h3><span>LIVE PARAMETERS</span></div>

          {(controlExperiment === 'light' || controlExperiment === 'signal') && <>
            <label className={styles.rangeControl} htmlFor={intensityId}>
              <span>Light intensity <output htmlFor={intensityId}>{intensity}%</output></span>
              <input id={intensityId} type="range" min="0" max="100" step="1" value={intensity} onChange={event => setIntensity(Number(event.currentTarget.value))}/>
              <small>Adjust the strength of the red and amber field.</small>
            </label>
          </>}

          {controlExperiment === 'signal' && <label className={styles.rangeControl} htmlFor={densityId}>
            <span>Line density <output htmlFor={densityId}>{density}</output></span>
            <input id={densityId} type="range" min="24" max="76" step="2" value={density} onChange={event => setDensity(Number(event.currentTarget.value))}/>
            <small>Set the number of contours in the field.</small>
          </label>}

          {controlExperiment === 'type' && <>
            <label className={styles.rangeControl} htmlFor={spacingId}>
              <span>Letter spacing <output htmlFor={spacingId}>{letterSpacing}px</output></span>
              <input id={spacingId} type="range" min="-2" max="12" step="1" value={letterSpacing} onChange={event => setLetterSpacing(Number(event.currentTarget.value))}/>
              <small>Change the tracking of the specimen.</small>
            </label>
            <label className={styles.rangeControl} htmlFor={strengthId}>
              <span>Motion strength <output htmlFor={strengthId}>{typeStrength}%</output></span>
              <input id={strengthId} type="range" min="0" max="100" step="1" value={typeStrength} onChange={event => setTypeStrength(Number(event.currentTarget.value))}/>
              <small>Set how far the line follows your pointer.</small>
            </label>
            <div className={styles.choiceControl}>
              <span>Reveal style</span>
              <div role="group" aria-label="Choose a reveal style">
                <button aria-pressed={reveal === 'unfold'} onClick={() => setReveal('unfold')} type="button">Unfold</button>
                <button aria-pressed={reveal === 'lift'} onClick={() => setReveal('lift')} type="button">Lift</button>
              </div>
            </div>
            <div className={styles.phraseControl}>
              <span>Phrase</span>
              <div role="group" aria-label="Choose a type specimen">
                {phrases.map((item, index) => <button key={item.join(' ')} aria-pressed={phrase === index} onClick={() => setPhrase(index)} type="button">0{index + 1}</button>)}
              </div>
            </div>
          </>}

          {controlExperiment === 'light' && <div className={styles.parameterReadout}><span>Current seed</span><output>{seed.toString().padStart(5, '0')}</output></div>}
          {controlExperiment === 'signal' && <div className={styles.parameterReadout}><span>Current seed</span><output>{seed.toString().padStart(5, '0')}</output></div>}

          {active === 'console' ? <div className={styles.consoleValues}><p>VALUES IN THE RECIPE</p><dl>{Object.entries(consoleValues).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl></div> : null}
        </div>

        <div className={styles.actionArea}>
          <p className={styles.actionEyebrow}>PLAYBACK & TOOLS</p>
          <button className={styles.motionButton} aria-pressed={motion} onClick={() => setMotionChoice(value => !(value ?? !reducedMotion))} type="button">
            <span className={styles.motionIcon} aria-hidden="true">{motion ? 'Ⅱ' : '▶'}</span>{motion ? 'Pause motion' : 'Play motion'}
          </button>
          <div className={styles.secondaryActions}>
            {(controlExperiment === 'light' || controlExperiment === 'signal') && <button className={styles.textAction} onClick={nextComposition} type="button">Regenerate <span aria-hidden="true">↗</span></button>}
            <button className={styles.textAction} onClick={active === 'console' ? resetAll : () => resetExperiment(controlExperiment)} type="button">{active === 'console' ? 'Reset all settings' : 'Reset study'}</button>
            <button className={styles.textAction} onClick={copyConfiguration} type="button">Copy config <span aria-hidden="true">↗</span></button>
          </div>
          <p className={styles.motionHint}>{reducedMotion && !motion ? 'Motion is still by default. Play motion is always available by choice.' : 'Motion runs only while this study is active and the page is visible.'}</p>
        </div>
      </div>
      <p className={styles.status} role="status" aria-live="polite">{status}</p>
    </section>
  </section>;
}
