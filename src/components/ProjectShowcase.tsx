import Link from 'next/link';
import type { Project } from '../lib/site';
import ProjectImage from './ProjectImage';
import Arrow from './Arrow';
export default function ProjectShowcase({ project }: { project: Project }) {
  return <article className={`project project-${project.id}`}><div className="project-visual"><Link className="project-preview-link" href={`/work/${project.id}`} aria-label={`Read ${project.name} case study`}><ProjectImage id={project.id} eager={project.id === 'rewatch'}/><span className="project-visit">Read case study <Arrow diagonal/></span></Link><div className="visual-caption"><span>{project.caption}</span><span>Actual public interface · October 2026</span></div></div><div className="project-information"><div className="project-name"><span className="project-category">{project.category}</span><h2>{project.name}</h2></div><div className="project-description"><p>{project.description}</p><ul className="project-tags">{project.details.map(detail => <li key={detail}>{detail}</li>)}</ul><div className="link-pair"><Link href={`/work/${project.id}`} className="text-link">Read case study <Arrow/></Link><a className="text-link" href={project.url} target="_blank" rel="noopener noreferrer">Visit {project.name} <Arrow diagonal/></a></div></div></div></article>;
}
