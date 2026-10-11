'use client';
import { useId, useState } from 'react';
import Image from 'next/image';
import Arrow from './Arrow';
import SelectionMark from './SelectionMark';
import type { Project } from '../lib/site';

const stories = {
  rewatch: [
    { title: 'Discovery first', heading: 'A clear route into the catalogue.', text: 'A persistent search action and four media categories give discovery a visible starting point. Explore, Browse, Moods, and Community sit in the main navigation rather than being buried in account settings.', capture: 'desktop', width: 1425, height: 891, alt: 'Rewatch public homepage with search, media categories, and catalogue', href: 'https://rewatch.cc/explore', link: 'Explore Rewatch' },
    { title: 'A clear invitation', heading: 'Explain the product before asking for an account.', text: 'The opening pairs the promise “keep your taste” with a short explanation of what belongs here. Creating an account and logging in remain separate actions. This close-up shows the real homepage introduction, not a signed-in diary screen.', capture: 'detail', width: 1425, height: 612, alt: 'Close-up of Rewatch’s homepage introduction and account actions', href: 'https://rewatch.cc/', link: 'Open Rewatch' },
  ],
  arcus: [
    { title: 'Training overview', heading: 'Make the next action easy to find.', text: 'The captured dashboard leads with starting a workout, then brings weekly sessions, volume, and records together. Programs, exercises, history, and import tools provide supporting paths. The numbers shown are the captured interface state, not claimed results.', capture: 'desktop', width: 1425, height: 891, alt: 'Arcus captured training dashboard with next-session action and weekly summary', href: 'https://thearcus.vercel.app/dashboard', link: 'Open training dashboard' },
    { title: 'The next session', heading: 'One primary action, with a path to planning.', text: 'The training panel puts “Start a workout” ahead of the supporting program link. Its instruction explains the first task: choose exercises and log sets. The close-up is cropped from the October 10 dashboard capture; the live dashboard has since evolved.', capture: 'detail', width: 1425, height: 1075, alt: 'Close-up crop of Arcus next-session panel, weekly summary, and training tools', href: 'https://thearcus.vercel.app/workout', link: 'Explore the workout flow' },
  ],
} as const;

export default function ProjectStory({ id }: { id: Project['id'] }) {
  const [selected, setSelected] = useState(0);
  const selectionId = useId();
  const story = stories[id][selected];
  const panelId = `${id}-story-panel`;
  return <section className="case-story container" id="product-story" aria-labelledby="story-heading">
    <div className="story-heading"><h2 id="story-heading">{id === 'rewatch' ? 'Discovery, considered.' : 'Built around the session.'}</h2><p>Choose a view to inspect the interface and the job it helps people do.</p></div>
    <div className="story-layout"><div className="story-controls" role="group" aria-label="Interface story views">{stories[id].map((item, index) => <button key={item.title} type="button" aria-pressed={selected === index} aria-controls={panelId} onClick={() => setSelected(index)}>{selected === index && <SelectionMark id={selectionId} style="rail"/>}{item.title}<Arrow/></button>)}</div>
      <div className="story-panel" id={panelId}><div key={selected}>
        <figure><a className="story-image" href={`/projects/${id}-${story.capture}.webp`} target="_blank" rel="noopener noreferrer" aria-label={`Open full-size ${story.title.toLowerCase()} screenshot in a new tab`}><Image src={`/projects/${id}-${story.capture}.webp`} alt={story.alt} width={story.width} height={story.height} sizes="(max-width: 800px) 90vw, 850px"/></a><figcaption><span>{story.capture === 'detail' ? 'Close-up crop of the original capture' : 'Actual public interface · October 10, 2026'}</span><span>Click image to inspect full-size ↗</span></figcaption></figure>
        <div className="story-description" aria-live="polite" aria-atomic="true"><h3>{story.heading}</h3><p>{story.text}</p></div><a className="text-link" href={story.href} target="_blank" rel="noopener noreferrer">{story.link}<Arrow diagonal/></a>
      </div></div>
    </div>
  </section>;
}
