'use client';

import { useContactModal } from './ContactModal';
import { ReactNode } from 'react';

export default function ContactButton({ children, className, style }: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { open } = useContactModal();
  return (
    <button onClick={open} className={className} style={style}>
      {children}
    </button>
  );
}
