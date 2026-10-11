import type { Project } from '../lib/site';
import DevicePreview, { type DeviceCapture, type DeviceMode } from './DevicePreview';
import Arrow from './Arrow';

export default function ProjectGallery({ id }: { id: Project['id'] }) {
  const name = id === 'rewatch' ? 'Rewatch' : 'Arcus';
  const screen = id === 'rewatch' ? 'public media-discovery homepage' : 'public training dashboard';
  const captures: Record<DeviceMode, DeviceCapture> = {
    desktop: { src: `/projects/${id}-desktop.webp`, width: 1425, height: 891, alt: `${name} desktop ${screen}`, note: 'Original public interface · October 10, 2026' },
    tablet: { src: `/projects/${id}-tablet.webp`, width: 738, height: 1004, alt: `${name} tablet ${screen}`, note: `Captured at 768 × 1024 · October 12, 2026${id === 'rewatch' ? ' · Light theme' : ' · Updated dashboard'}` },
    mobile: { src: `/projects/${id}-mobile.webp`, width: 375, height: 812, alt: `${name} mobile ${screen}`, note: 'Original public interface · October 10, 2026' },
  };
  const productTabs = id === 'rewatch' ? [
    { label: 'Explore', href: 'https://rewatch.cc/explore' },
    { label: 'Browse', href: 'https://rewatch.cc/browse' },
    { label: 'Moods', href: 'https://rewatch.cc/moods' },
    { label: 'Community', href: 'https://rewatch.cc/discussions' },
  ] : [];
  return <div className="project-device-gallery">
    <DevicePreview name={name} captures={captures}/>
    {productTabs.length > 0 && <nav className="product-tab-links" aria-label="Visit Rewatch product sections"><span>Explore the live product</span>{productTabs.map(({ label, href }) => <a key={href} href={href} target="_blank" rel="noopener noreferrer">{label}<Arrow diagonal/></a>)}</nav>}
  </div>;
}
