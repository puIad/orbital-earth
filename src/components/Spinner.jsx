// src/components/Spinner.jsx
import styles from '../styles/Spinner.module.css';

/** Minimal orbital loading ring. `size` is the diameter in px. */
export default function Spinner({ size = 22, label }) {
  return (
    <span className={styles.wrap} role="status" aria-live="polite">
      <span
        className={styles.ring}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
      {label ? <span className={styles.label}>{label}</span> : null}
    </span>
  );
}
