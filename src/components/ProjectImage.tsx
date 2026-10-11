import Image from 'next/image';
import type { Project } from '../lib/site';

export type ProjectCaptureView = 'desktop' | 'mobile';

export default function ProjectImage({ id, mobile = false, eager = false, view = mobile ? 'mobile' : 'desktop' }: { id: Project['id']; mobile?: boolean; eager?: boolean; view?: ProjectCaptureView }) {
  const capture = view;
  const dimensions = view === 'mobile'
    ? { width: 375, height: 812 }
    : { width: 1425, height: 891 };
  const descriptions = {
    rewatch: { desktop: 'homepage with media search, diary introduction, and catalogue', mobile: 'mobile homepage with media search, diary introduction, and catalogue' },
    arcus: { desktop: 'dashboard with start-workout action and training summary', mobile: 'mobile dashboard with start-workout action and training summary' },
  } as const;

  return <Image className="project-screenshot" src={`/projects/${id}-${capture}.webp`}
    alt={`${id === 'rewatch' ? 'Rewatch' : 'Arcus'} ${descriptions[id][capture]}`}
    width={dimensions.width} height={dimensions.height}
    sizes={capture === 'mobile' ? '(max-width: 540px) 75vw, 375px' : '(max-width: 800px) 90vw, 1200px'}
    loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'}/>;
}
