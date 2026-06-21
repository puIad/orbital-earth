// src/components/SearchBar.jsx
import { useEffect, useRef, useState } from 'react';
import { geocode } from '../lib/nominatim';
import styles from '../styles/SearchBar.module.css';

/**
 * Debounced geocoding search box with a results dropdown and full keyboard
 * support (↑/↓ to move, Enter to fly, Esc to close).
 *
 * Props:
 *   onSelect(lon, lat)        — chosen result, lifted to App for the camera flight
 *   onLoadingChange(boolean)  — toggles the global spinner while a request is in flight
 */
export default function SearchBar({ onSelect, onLoadingChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced fetch whenever the query changes.
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      setActive(-1);
      return undefined;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      onLoadingChange?.(true);
      geocode(query, controller.signal)
        .then((items) => {
          setResults(items);
          setOpen(true);
          setActive(-1);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') console.error(err);
        })
        .finally(() => {
          // Ignore the finally of a superseded request.
          if (abortRef.current === controller) onLoadingChange?.(false);
        });
    }, 350);

    return () => {
      clearTimeout(debounceRef.current);
      // Abort any in-flight request so it can't resolve after unmount / supersede.
      abortRef.current?.abort();
    };
  }, [query, onLoadingChange]);

  const choose = (item) => {
    if (!item) return;
    onSelect(item.lon, item.lat);
    setQuery(item.label.split(',')[0]);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open && results.length) setOpen(true);
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(active >= 0 ? results[active] : results[0]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <div className={styles.search}>
      <div className={styles.inputWrap}>
        <span className={styles.icon} aria-hidden="true">⌖</span>
        <input
          className={styles.input}
          type="text"
          value={query}
          placeholder="Search a place — e.g. Eiffel Tower"
          aria-label="Search for a location"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && results.length > 0}
          aria-controls="searchbar-listbox"
          aria-activedescendant={active >= 0 ? `searchbar-opt-${active}` : undefined}
          autoComplete="off"
          spellCheck="false"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => results.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
        />
      </div>

      {open && results.length > 0 && (
        <ul className={styles.dropdown} role="listbox" id="searchbar-listbox">
          {results.map((item, i) => (
            <li
              key={item.id}
              id={`searchbar-opt-${i}`}
              role="option"
              aria-selected={i === active}
              className={`${styles.option} ${i === active ? styles.active : ''}`}
              // onMouseDown (not onClick) so it fires before the input's onBlur.
              onMouseDown={(e) => {
                e.preventDefault();
                choose(item);
              }}
              onMouseEnter={() => setActive(i)}
            >
              <span className={styles.optName}>{item.label.split(',')[0]}</span>
              <span className={styles.optMeta}>{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
