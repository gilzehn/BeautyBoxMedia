'use client';

import { useState, FormEvent } from 'react';
import styles from '../bizmanage.module.css';
import { EmailDraft, EmailTone, EmailType, generateEmailDraft } from '@/lib/aiTools';
import { AiBadge, CopyButton, DraftNote, ScreenHead } from './shared';

const TYPES: { value: EmailType; label: string }[] = [
  { value: 'cold-outreach', label: 'Cold outreach' },
  { value: 'follow-up', label: 'Follow-up' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'renewal', label: 'Renewal' },
];

const TONES: EmailTone[] = ['professional', 'friendly', 'direct'];

export default function EmailDrafterScreen() {
  const [type, setType] = useState<EmailType>('cold-outreach');
  const [tone, setTone] = useState<EmailTone>('professional');
  const [recipientName, setRecipientName] = useState('');
  const [company, setCompany] = useState('');
  const [contextPoints, setContextPoints] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<EmailDraft | null>(null);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await generateEmailDraft({
      type,
      tone,
      recipientName,
      company,
      contextPoints: contextPoints.split('\n'),
    });
    setDraft(result);
    setBusy(false);
  };

  return (
    <>
      <ScreenHead title="Email Drafter" badge={<AiBadge />} meta="Outreach and client emails from bullet points" />

      <form className={styles.formCard} onSubmit={handleGenerate}>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.label}>Email type</span>
            <select className={styles.input} value={type} onChange={(e) => setType(e.target.value as EmailType)}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Tone</span>
            <select className={styles.input} value={tone} onChange={(e) => setTone(e.target.value as EmailTone)}>
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.label}>Recipient name</span>
            <input
              className={styles.input}
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Sarah"
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Company / brand</span>
            <input
              className={styles.input}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Glow Theory"
              required
            />
          </label>
        </div>
        <label className={styles.field}>
          <span className={styles.label}>Context points (one per line)</span>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            value={contextPoints}
            onChange={(e) => setContextPoints(e.target.value)}
            rows={4}
            placeholder={'They just launched on Amazon US\nReviews are strong but traffic is low'}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Generating…' : 'Generate email'}
        </button>
      </form>

      {draft && (
        <div className={styles.outputWrap}>
          <div className={styles.outputHead}>
            <h3 className={styles.outputTitle}>Draft email</h3>
            <CopyButton text={`Subject: ${draft.subject}\n\n${draft.body}`} label="Copy email" />
          </div>
          <DraftNote />
          <div className={styles.outputCard}>
            <div className={styles.outputCardTitle}>Subject: {draft.subject}</div>
            <pre className={styles.emailBody}>{draft.body}</pre>
          </div>
        </div>
      )}
    </>
  );
}
