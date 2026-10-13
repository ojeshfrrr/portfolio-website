import PageHeading from '../../components/PageHeading';
import ProjectPlanner from '../../components/ProjectPlanner';
import type { Metadata } from 'next';
import { pageMetadata } from '../../lib/metadata';
import './planner.css';

export const metadata: Metadata = {
  ...pageMetadata('Project planner', 'Shape your website or web application idea into a clear brief. Choose goals, features, budget, and timing before contacting OVIO.', '/start'),
  robots: { index: false, follow: true },
};
export default function StartPage() {
  return <section className="planner-page container"><header className="planner-intro"><span className="section-label">OVIO / Project planner</span><PageHeading>Good projects start<br/>with a clear brief<span className="brand-dot">.</span></PageHeading><p>Five small steps to shape what you need. No estimates or commitments — just a useful starting point for a conversation.</p></header><ProjectPlanner/></section>;
}
