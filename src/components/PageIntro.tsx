import PageHeading from './PageHeading';
export default function PageIntro({ label, title, text }: { label: string; title: string; text: string }) {
  return <section className="page-intro container"><span className="section-label">{label}</span><PageHeading>{title}</PageHeading><p>{text}</p></section>;
}
