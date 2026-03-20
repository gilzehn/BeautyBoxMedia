'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import styles from './ContactModal.module.css';

const ContactModalContext = createContext<{ open: () => void }>({ open: () => {} });

export function useContactModal() {
  return useContext(ContactModalContext);
}

export function ContactModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, close]);

  return (
    <ContactModalContext.Provider value={{ open }}>
      {children}
      {isOpen && (
        <div className={styles.overlay} onClick={close}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.close} onClick={close} aria-label="Close">
              &times;
            </button>
            <iframe
              src="https://xqz7khwhnvc.typeform.com/to/BZ1eOL93"
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="camera; microphone; autoplay; encrypted-media;"
            />
          </div>
        </div>
      )}
    </ContactModalContext.Provider>
  );
}
