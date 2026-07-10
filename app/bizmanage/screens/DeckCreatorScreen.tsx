'use client';

import { useState, FormEvent } from 'react';
import styles from '../bizmanage.module.css';
import { DeckOutline, generateDeckOutline } from '@/lib/aiTools';
import { AiBadge, CopyButton, DraftNote, ScreenHead } from './shared';

export default function DeckCreatorScreen() {
  const [brand, setBrand] = useState('');
  const [audience, setAudience] = useState('');
  const [objective, setObjective] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [busy, setBusy] = useState(false);
  const [outline, setOutline] = useState<DeckOutline | null>(null);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await generateDeckOutline({
      brand,
      audience,
      objective,
      keyPoints: keyPoints.split('\n'),
    });
    setOutline(result);
    setBusy(false);
  };

  const plainText = outline
    ? [
        outline.title,
        '',
        ...outline.slides.flatMap((s, i) => [`${i + 1}. ${s.title}`, ...s.bullets.map((b) => `   • ${b}`), '']),
      ].join('\n')
    : '';

  return (
    <>
      <ScreenHead title="Deck Creator" badge={<AiBadge />} meta="Pitch deck outlines from a short brief" />

      <form className={styles.formCard} onSubmit={handleGenerate}>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.label}>Brand</span>
            <input
              className={styles.input}
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Glow Theory"
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Audience</span>
            <input
              className={styles.input}
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. the brand's founders"
              required
            />
          </label>
        </div>
        <label className={styles.field}>
          <span className={styles.label}>Objective</span>
          <input
            className={styles.input}
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="e.g. win the Amazon management mandate"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Key points (one per line)</span>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            value={keyPoints}
            onChange={(e) => setKeyPoints(e.target.value)}
            rows={4}
            placeholder={'Listing quality is holding back conversion\nPPC is unprofitable at current ACOS'}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Generating…' : 'Generate outline'}
        </button>
      </form>

      {outline && (
        <div className={styles.outputWrap}>
          <div className={styles.outputHead}>
            <h3 className={styles.outputTitle}>{outline.title}</h3>
            <CopyButton text={plainText} label="Copy outline" />
          </div>
          <DraftNote />
          <div className={styles.outputGrid}>
            {outline.slides.map((slide, i) => (
              <div key={i} className={styles.outputCard}>
                <div className={styles.outputCardTitle}>
                  <span className={styles.slideNumber}>{i + 1}</span>
                  {slide.title}
                </div>
                <ul className={styles.outputList}>
                  {slide.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
