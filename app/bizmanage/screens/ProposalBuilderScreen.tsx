'use client';

import { useState, FormEvent } from 'react';
import styles from '../bizmanage.module.css';
import { ProposalDraft, generateProposal } from '@/lib/aiTools';
import { AiBadge, CopyButton, DraftNote, ScreenHead } from './shared';

const SERVICES = [
  'Full Marketplace Management',
  'Advertising / PPC',
  'Listing & Brand Presence',
  'Brand Onboarding',
  'Consulting',
  'Market Research',
];

export default function ProposalBuilderScreen() {
  const [client, setClient] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [scopeNotes, setScopeNotes] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<ProposalDraft | null>(null);

  const toggleService = (s: string) =>
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await generateProposal({ client, services, scopeNotes, monthlyFee });
    setDraft(result);
    setBusy(false);
  };

  const plainText = draft
    ? [draft.title, '', ...draft.sections.flatMap((s) => [s.heading.toUpperCase(), s.body, ''])].join('\n')
    : '';

  return (
    <>
      <ScreenHead title="Proposal Builder" badge={<AiBadge />} meta="Client proposals from scope and pricing" />

      <form className={styles.formCard} onSubmit={handleGenerate}>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.label}>Client</span>
            <input
              className={styles.input}
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="e.g. Glow Theory"
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Monthly fee</span>
            <input
              className={styles.input}
              value={monthlyFee}
              onChange={(e) => setMonthlyFee(e.target.value)}
              placeholder="e.g. $4,500 / month"
            />
          </label>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Services</span>
          <div className={styles.permGrid}>
            {SERVICES.map((s) => (
              <label key={s} className={styles.permItem}>
                <input type="checkbox" checked={services.includes(s)} onChange={() => toggleService(s)} />
                <span>{s}</span>
              </label>
            ))}
          </div>
        </div>
        <label className={styles.field}>
          <span className={styles.label}>Scope notes</span>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            value={scopeNotes}
            onChange={(e) => setScopeNotes(e.target.value)}
            rows={3}
            placeholder="Anything specific about the engagement…"
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Generating…' : 'Generate proposal'}
        </button>
      </form>

      {draft && (
        <div className={styles.outputWrap}>
          <div className={styles.outputHead}>
            <h3 className={styles.outputTitle}>{draft.title}</h3>
            <CopyButton text={plainText} label="Copy proposal" />
          </div>
          <DraftNote />
          <div className={styles.outputStack}>
            {draft.sections.map((section, i) => (
              <div key={i} className={styles.outputCard}>
                <div className={styles.outputCardTitle}>{section.heading}</div>
                <p className={styles.outputBody}>{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
