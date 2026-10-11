'use client';

import { motion } from 'motion/react';
import { motionTiming } from '../lib/motion-system';
import { useMotionPreference } from '../lib/useMotionPreference';

/** A single shared-layout marker per control group; semantic state stays native. */
export default function SelectionMark({ id, style = 'surface' }: { id: string; style?: 'surface' | 'bar' | 'rail' }) {
  const reduced = useMotionPreference();
  return <motion.i aria-hidden="true" className={`selection-mark selection-${style}`} layoutId={id}
    initial={false} transition={reduced ? { duration: 0 } : motionTiming.spring}/>;
}
