'use client';

import { ViewTransition, type ComponentProps } from 'react';
import { usePathname } from 'next/navigation';

// Only the editorial heading participates: controls and the live canvas stay
// outside the snapshot. Synchronous form/gallery changes do not trigger it.
export default function PageHeading(props: ComponentProps<'h1'>) {
  const pathname = usePathname();
  return <ViewTransition key={pathname} name="ovio-heading" default="none" share="ovio-heading" update="none" enter="none" exit="none">
    <h1 {...props}/>
  </ViewTransition>;
}
