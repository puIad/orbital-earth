// src/components/InfoPanel.jsx
import { useState } from 'react';
import styles from '../styles/InfoPanel.module.css';

/**
 * Bottom-right flight-console telemetry: live latitude / longitude / altitude,
 * plus a "copy share link" button (the camera pose is mirrored to the URL hash).
 *
 * Props:
 *   telemetry: { lat, lon, alt } | null
 *   ionActive: boolean   — whether the Ion satellite/terrain upgrade is live
 */
export default function InfoPanel({ telemetry, ionActive }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const copyLink = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // e.g. non-secure context where the Clipboard API is blocked — tell the user.
      setFailed(true);
      setTimeout(() => setFailed(false), 1400);
    }
  };

  const deg = (n) => (n == null ? '———.—————' : n.toFixed(5));
  const altText = () => {
    if (telemetry?.alt == null) return '————— m';
    const a = telemetry.alt;
    return a >= 1000 ? `${(a / 1000).toFixed(2)} km` : `${a.toFixed(0)} m`;
  };

  return (
    <div className={styles.panel} aria-label="Camera telemetry">
      <div className={styles.header}>
        <span className={styles.dot} data-on={ionActive} />
        <span className={styles.title}>TELEMETRY</span>
        <span className={styles.mode}>{ionActive ? 'ION · 3D' : 'KEY-FREE'}</span>
      </div>

      <dl className={styles.readout}>
        <div className={styles.row}>
          <dt>LAT</dt>
          <dd>{deg(telemetry?.lat)}°</dd>
        </div>
        <div className={styles.row}>
          <dt>LON</dt>
          <dd>{deg(telemetry?.lon)}°</dd>
        </div>
        <div className={styles.row}>
          <dt>ALT</dt>
          <dd>{altText()}</dd>
        </div>
      </dl>

      <button className={styles.share} type="button" onClick={copyLink}>
        {copied ? '✓ LINK COPIED' : failed ? '✕ COPY FAILED' : '⧉ COPY SHARE LINK'}
      </button>
    </div>
  );
}
