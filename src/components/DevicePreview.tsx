'use client';

import Image from 'next/image';
import { useId, useState, type CSSProperties } from 'react';
import Arrow from './Arrow';
import SelectionMark from './SelectionMark';
import './device-preview.css';

export type DeviceMode = 'desktop' | 'tablet' | 'mobile';
export type DeviceCapture = {
  src: string;
  width: number;
  height: number;
  alt: string;
  note: string;
};
const devices = [
  { id: 'desktop', label: 'Desktop', path: 'M3 4h18v12H3z M8 21h8 M12 16v5' },
  { id: 'tablet', label: 'Tablet', path: 'M5 2h14v20H5z M11 19h2' },
  { id: 'mobile', label: 'Mobile', path: 'M7 2h10v20H7z M11 19h2' },
] as const;

function Capture({ capture }: { capture: DeviceCapture }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  return <>
    <Image src={capture.src} alt={capture.alt} width={capture.width} height={capture.height}
      sizes="(max-width: 540px) 90vw, (max-width: 1000px) 85vw, 1200px"
      onLoad={() => setStatus('ready')} onError={() => setStatus('error')}/>
    {status !== 'ready' && <span className="device-preview-feedback" role="status">
      {status === 'loading' ? 'Loading capture…' : 'Preview unavailable. Use the full-size capture link below.'}
    </span>}
  </>;
}

/** One genuine capture at a time; the stage reserves its height across device changes. */
export default function DevicePreview({ name, captures }: {
  name: string;
  captures: Record<DeviceMode, DeviceCapture>;
}) {
  const [mode, setMode] = useState<DeviceMode>('desktop');
  const panelId = useId();
  const capture = captures[mode];
  const label = devices.find(device => device.id === mode)!.label;
  return <figure className="device-preview">
    <div className="device-preview-toolbar">
      <span>Explore the responsive interface</span>
      <div className="device-selector" role="group" aria-label={`${name} device preview`}>
        {devices.map(device => <button key={device.id} type="button"
          aria-pressed={mode === device.id} aria-controls={panelId} onClick={() => setMode(device.id)}>
          {mode === device.id && <SelectionMark id={`${panelId}-selection`}/>}
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d={device.path}/></svg>
          {device.label}
        </button>)}
      </div>
    </div>
    <div className="device-preview-stage" id={panelId} aria-label={`${name} ${label.toLowerCase()} screenshot`}>
      <a className={`device-preview-frame device-preview-${mode}`} key={mode}
        style={{ '--capture-ratio': capture.width / capture.height } as CSSProperties}
        href={capture.src} target="_blank" rel="noopener noreferrer"
        aria-label={`Inspect full-size ${name} ${label.toLowerCase()} capture in a new tab`}>
        <Capture capture={capture}/>
      </a>
    </div>
    <figcaption>
      <span className="device-preview-caption" aria-live="polite" aria-atomic="true"><strong>{label} capture</strong><span>{capture.note}</span></span>
      <a className="capture-open" href={capture.src} target="_blank" rel="noopener noreferrer">Open full-size capture<Arrow diagonal/></a>
    </figcaption>
  </figure>;
}
