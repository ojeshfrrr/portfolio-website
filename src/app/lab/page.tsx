import type { Metadata } from 'next';
import PageHeading from '../../components/PageHeading';
import LabExperience from './LabExperience';
import styles from './lab.module.css';

export const metadata: Metadata = {
  title: 'OVIO Lab — Seven interactive generative studies',
  description: 'Explore seven live creative-coding studies in light, kinetic type, signal, gravity, wave interference, particle flow, and reaction diffusion.',
};

export default function LabPage() {
  return <div className={`${styles.page} container`}>
    <header className={styles.intro}>
      <p className={styles.breadcrumb}><span>OVIO</span><span aria-hidden="true">/</span><span>Lab</span></p>
      <div className={styles.introGrid}>
        <PageHeading className={styles.title} id="lab-heading">A place to test the feeling.</PageHeading>
        <p className={styles.introCopy}>Seven live studies in light, type, fields, motion, and reaction — instruments to explore, tune, and take somewhere new.</p>
      </div>
    </header>
    <LabExperience />
  </div>;
}
