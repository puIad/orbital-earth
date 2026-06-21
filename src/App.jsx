// src/App.jsx
import { useCallback, useRef, useState } from 'react';
import EarthViewer from './components/EarthViewer';
import SearchBar from './components/SearchBar';
import InfoPanel from './components/InfoPanel';
import PlaceCard from './components/PlaceCard';
import Spinner from './components/Spinner';
import { reverseGeocode } from './lib/nominatim';
import { hasIonToken } from './lib/cesiumConfig';
import styles from './styles/App.module.css';

export default function App() {
  const viewerRef = useRef(null);
  const [telemetry, setTelemetry] = useState(null);
  const [searching, setSearching] = useState(false);
  const [place, setPlace] = useState(null); // { lon, lat, label, loading }

  // Search result chosen -> fly the camera there at 2000 m.
  const handleSelect = useCallback((lon, lat) => {
    viewerRef.current?.flyTo(lon, lat, 2000);
  }, []);

  const handleTelemetry = useCallback((t) => setTelemetry(t), []);

  // Globe click -> reverse geocode the point and show a card. A ref-held
  // AbortController cancels the previous lookup so a slow earlier response can't
  // overwrite a newer pin with a mismatched label.
  const placeReqRef = useRef(null);
  const handlePlaceClick = useCallback(async ({ lon, lat }) => {
    placeReqRef.current?.abort();
    const controller = new AbortController();
    placeReqRef.current = controller;

    setPlace({ lon, lat, label: null, loading: true });
    try {
      const label = await reverseGeocode(lat, lon, controller.signal);
      if (controller.signal.aborted) return;
      setPlace({ lon, lat, label, loading: false });
    } catch (err) {
      if (err.name === 'AbortError') return;
      setPlace({ lon, lat, label: 'Unknown location', loading: false });
    }
  }, []);

  const closePlace = useCallback(() => {
    placeReqRef.current?.abort();
    setPlace(null);
  }, []);

  return (
    <div className={styles.app}>
      <EarthViewer
        ref={viewerRef}
        onTelemetry={handleTelemetry}
        onPlaceClick={handlePlaceClick}
      />

      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.glyph} aria-hidden="true">◴</span>
          ORBITAL<span className={styles.brandThin}>EARTH</span>
        </div>
        <SearchBar onSelect={handleSelect} onLoadingChange={setSearching} />
        {searching && (
          <div className={styles.searchSpinner}>
            <Spinner size={18} />
          </div>
        )}
      </header>

      {place && <PlaceCard place={place} onClose={closePlace} />}

      <InfoPanel telemetry={telemetry} ionActive={hasIonToken} />
    </div>
  );
}
