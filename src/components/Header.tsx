'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navLinks } from '../lib/site';
import Arrow from './Arrow';
import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import { motionTiming } from '../lib/motion-system';
import { useMotionPreference } from '../lib/useMotionPreference';

function MobileNavigation({ pathname, close }: { pathname: string; close: () => void }) {
  const present = useIsPresent();
  const reduced = useMotionPreference();
  return <motion.nav className="mobile-nav container" id="mobile-navigation" aria-label="Mobile navigation"
    data-lenis-prevent inert={!present} aria-hidden={!present}
    initial={reduced ? false : 'closed'} animate="open" exit="closed"
    variants={{ open: { opacity: 1, clipPath: 'inset(0 0 0 0)', transition: { duration: reduced ? 0 : 0.22, ease: motionTiming.ease, delayChildren: reduced ? 0 : 0.02, staggerChildren: reduced ? 0 : 0.025 } }, closed: { opacity: 0, clipPath: 'inset(0 0 100% 0)', transition: { duration: reduced ? 0 : 0.14 } } }}>
    {navLinks.map(link => <motion.div key={link.href} variants={{ open: { opacity: 1, x: 0 }, closed: { opacity: reduced ? 1 : 0.6, x: reduced ? 0 : -8 } }} transition={{ duration: reduced ? 0 : 0.2, ease: motionTiming.ease }}>
      <Link href={link.href} aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`) ? 'page' : undefined} onClick={close}>{link.label}<Arrow diagonal/></Link>
    </motion.div>)}
  </motion.nav>;
}

export default function Header() {
  const pathname = usePathname();
  return <HeaderContent key={pathname} pathname={pathname}/>;
}
function HeaderContent({ pathname }: { pathname: string }) {
  const active = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;

    const mobile = window.matchMedia('(max-width: 800px)');
    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const restoreScroll = () => {
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      window.dispatchEvent(new CustomEvent('myovio:scroll-lock', { detail: false }));
    };
    const updateScrollLock = () => {
      if (mobile.matches) {
        root.style.overflow = 'hidden';
        body.style.overflow = 'hidden';
        window.dispatchEvent(new CustomEvent('myovio:scroll-lock', { detail: true }));
      } else {
        restoreScroll();
      }
    };

    updateScrollLock();
    mobile.addEventListener('change', updateScrollLock);
    return () => {
      mobile.removeEventListener('change', updateScrollLock);
      restoreScroll();
    };
  }, [open]);
  return <header className="header" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }} onKeyDown={(event) => {
    if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus(); }
  }}>
    <div className="header-inner container">
      <Link href="/" className="wordmark" aria-label="OVIO home" onClick={() => setOpen(false)}>ovio<span className="brand-dot">.</span></Link>
      <nav className="desktop-nav" aria-label="Main navigation">{navLinks.map(link => <Link key={link.href} href={link.href} aria-current={active(link.href) ? 'page' : undefined}>{link.label}</Link>)}</nav>
      <Link className="header-cta" href="/contact" onClick={() => setOpen(false)}>Start a project <Arrow diagonal /></Link>
      <button ref={toggle} className="menu-toggle header-cta" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen(value => !value)}><span>Menu</span><span className="menu-icon" aria-hidden="true"><span/><span/><span/></span></button>
    </div>
    <AnimatePresence initial={false}>{open && <MobileNavigation key="mobile-navigation" pathname={pathname} close={() => setOpen(false)}/>}</AnimatePresence>
  </header>;
}
