export default function Arrow({ diagonal = false, up = false }: { diagonal?: boolean; up?: boolean }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" className={`arrow${up ? ' arrow-up' : diagonal ? ' arrow-diagonal' : ''}`}><path d={up ? 'M12 20V4m-6 6 6-6 6 6' : diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h16m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
