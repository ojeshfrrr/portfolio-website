import type { Metadata } from 'next';
import PageHeading from '../../components/PageHeading';
import LabExperience from './LabExperience';
import styles from './lab.module.css';

export const metadata: Metadata = {
  title: 'OVIO Lab — Interactive experiments in light, type, and signal',
  description: 'A working creative playground from OVIO. Shape a generative light field, move type, and bend a field of fine signal lines.',
};

export default function LabPage() {
  return <div className={`${styles.page} container`}>
    <header className={styles.intro}>
      <p className={styles.breadcrumb}><span>OVIO</span><span aria-hidden="true">/</span><span>Lab</span></p>
      <div className={styles.introGrid}>
        <PageHeading className={styles.title} id="lab-heading">A place to test the feeling.</PageHeading>
        <p className={styles.introCopy}>Three live studies in light, type, and signal — made to be touched, tuned, and taken somewhere new.</p>
      </div>
    </header>
    <LabExperience />
  </div>;
}
