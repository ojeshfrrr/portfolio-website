import Link from 'next/link';
export default function PlannerHandoff() {
  return <aside className="planner-handoff"><h2>Your project, carried forward.</h2><p>Your planner answers are filled in below. Edit anything before reviewing.</p><Link href="/start" className="text-link">Return to the planner</Link></aside>;
}
