'use client';

import { useId, useState, type ReactNode } from 'react';

type VerificationDisclosureProps = {
  children: ReactNode;
};

export default function VerificationDisclosure({ children }: VerificationDisclosureProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const triggerId = `verification-trigger-${id}`;
  const panelId = `verification-panel-${id}`;

  return (
    <div className="verification-disclosure" data-open={open}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className="verification-disclosure__trigger"
        id={triggerId}
        onClick={() => setOpen(value => !value)}
        type="button"
      >
        <svg aria-hidden="true" className="verification-disclosure__indicator" viewBox="0 0 16 16">
          <path d="m3.5 6 4.5 4.5L12.5 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
        </svg>
        <span>What was verified</span>
      </button>
      <div
        aria-hidden={!open}
        aria-labelledby={triggerId}
        className="verification-disclosure__panel"
        id={panelId}
        role="region"
      >
        <div className="verification-disclosure__inner">{children}</div>
      </div>
    </div>
  );
}
