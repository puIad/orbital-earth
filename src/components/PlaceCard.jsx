// src/components/PlaceCard.jsx
import { useEffect, useRef } from 'react';
import Spinner from './Spinner';
import styles from '../styles/PlaceCard.module.css';

/**
 * Small popup shown after the user clicks a point on the globe. Displays the
 * reverse-geocoded place name (or a loading state). Closes on ✕ or Escape, and
 * moves focus to the close button when it opens.
 *
 * Props:
 *   place: { lon, lat, label, loading }   (always defined while mounted)
 *   onClose()
 */
export default function PlaceCard({ place, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const fmt = (n) => (Number.isFinite(n) ? n.toFixed(5) : '—');

  return (
    <div className={styles.card} role="dialog" aria-label="Selected location">
      <button
        ref={closeRef}
        className={styles.close}
        type="button"
        onClick={onClose}
        aria-label="Close"
      >
        ✕
      </button>

      <div className={styles.label}>PINNED LOCATION</div>

      {place.loading ? (
        <div className={styles.loading}>
          <Spinner size={16} />
          <span>Resolving place…</span>
        </div>
      ) : (
        <div className={styles.name}>{place.label ?? 'Unknown location'}</div>
      )}

      <div className={styles.coords}>
        {fmt(place.lat)}°, {fmt(place.lon)}°
      </div>
    </div>
  );
}
