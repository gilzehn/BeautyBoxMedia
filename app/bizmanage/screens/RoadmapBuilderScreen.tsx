'use client';

import { useState, FormEvent } from 'react';
import styles from '../bizmanage.module.css';
import { Roadmap, generateRoadmap } from '@/lib/aiTools';
import { AiBadge, CopyButton, DraftNote, ScreenHead } from './shared';

export default function RoadmapBuilderScreen() {
  const [brand, setBrand] = useState('');
  const [objective, setObjective] = useState('');
  const [timeframe, setTimeframe] = useState<30 | 60 | 90>(90);
  const [busy, setBusy] = useState(false);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await generateRoadmap({ brand, objective, timeframe });
    setRoadmap(result);
    setBusy(false);
  };

  const plainText = roadmap
    ? [roadmap.title, '', ...roadmap.phases.flatMap((p) => [p.title, ...p.items.map((i) => `  • ${i}`), ''])].join(
        '\n'
      )
    : '';

  return (
    <>
      <ScreenHead title="Roadmap Builder" badge={<AiBadge />} meta="Phased growth plans for a brand" />

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
            <span className={styles.label}>Timeframe</span>
            <select
              className={styles.input}
              value={timeframe}
              onChange={(e) => setTimeframe(Number(e.target.value) as 30 | 60 | 90)}
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </label>
        </div>
        <label className={styles.field}>
          <span className={styles.label}>Objective</span>
          <input
            className={styles.input}
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="e.g. double marketplace revenue while holding ACOS under 30%"
            required
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Generating…' : 'Generate roadmap'}
        </button>
      </form>

      {roadmap && (
        <div className={styles.outputWrap}>
          <div className={styles.outputHead}>
            <h3 className={styles.outputTitle}>{roadmap.title}</h3>
            <CopyButton text={plainText} label="Copy roadmap" />
          </div>
          <DraftNote />
          <div className={styles.outputGrid}>
            {roadmap.phases.map((phase, i) => (
              <div key={i} className={styles.outputCard}>
                <div className={styles.outputCardTitle}>{phase.title}</div>
                <ul className={styles.outputList}>
                  {phase.items.map((item, j) => (
                    <li key={j}>{item}</li>
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
