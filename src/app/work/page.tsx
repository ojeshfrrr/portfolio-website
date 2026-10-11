import PageIntro from '../../components/PageIntro';
import ProjectShowcase from '../../components/ProjectShowcase';
import ContactCTA from '../../components/ContactCTA';
import { projects } from '../../lib/site';
import { pageMetadata } from '../../lib/metadata';
import './work.css';
export const metadata = pageMetadata('Selected work', 'Explore Rewatch, a media diary, and Arcus, a fitness product for planning and reviewing training.', '/work');
export default function Work() {
  return <><PageIntro label="Selected work" title="Two products. Two different needs." text="Rewatch brings media discovery and a personal diary together. Arcus gives training its own place to plan, log, and review. Explore the public interfaces and the decisions visible in each."/><section className="portfolio-list container" aria-label="Project showcases">{projects.map(project => <ProjectShowcase project={project} key={project.id}/>)}</section><ContactCTA/></>;
}
