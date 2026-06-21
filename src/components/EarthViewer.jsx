// src/components/EarthViewer.jsx
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import * as Cesium from 'cesium';
import { getImageryTerrainOptions } from '../lib/cesiumConfig';
import {
  applyCameraHash,
  readCameraHash,
  writeCameraHash,
} from '../lib/cameraUrl';
import styles from '../styles/EarthViewer.module.css';

/**
 * Owns the single Cesium.Viewer instance.
 *
 * The Viewer lives in a ref (never state) so it never triggers a React re-render.
 * Initialization runs once in a `useEffect([])`; the cleanup destroys the viewer
 * and nulls the ref. A guard makes this safe under React 18 StrictMode, which
 * mounts → unmounts → remounts in development and would otherwise leak a second
 * WebGL context / globe.
 *
 * Props:
 *   onTelemetry({lon,lat,alt,heading,pitch})  — fired (throttled) as the camera moves
 *   onPlaceClick({lon,lat})                    — fired when the user clicks the globe
 * Imperative handle:
 *   flyTo(lon, lat, height=2000)               — 3s camera flight to a coordinate
 */
const EarthViewer = forwardRef(function EarthViewer({ onTelemetry, onPlaceClick }, ref) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [initError, setInitError] = useState(false);

  // Keep latest callbacks in refs so the init effect can stay `[]`-scoped
  // (re-running it would tear down and rebuild the globe).
  const onTelemetryRef = useRef(onTelemetry);
  const onPlaceClickRef = useRef(onPlaceClick);
  useEffect(() => {
    onTelemetryRef.current = onTelemetry;
  }, [onTelemetry]);
  useEffect(() => {
    onPlaceClickRef.current = onPlaceClick;
  }, [onPlaceClick]);

  useImperativeHandle(
    ref,
    () => ({
      flyTo(lon, lat, height = 2000) {
        const viewer = viewerRef.current;
        if (!viewer) return;
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
          duration: 3,
        });
      },
    }),
    []
  );

  useEffect(() => {
    // StrictMode / double-invoke guard.
    if (viewerRef.current || !containerRef.current) return undefined;

    let viewer;
    try {
      viewer = new Cesium.Viewer(containerRef.current, {
        ...getImageryTerrainOptions(),
        // Clean UI: disable all default Cesium widgets/chrome.
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        navigationHelpButton: false,
        sceneModePicker: false,
        timeline: false,
        animation: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
      });
    } catch (err) {
      // Most commonly: no WebGL support, or a bad CESIUM_BASE_URL.
      console.error('Cesium Viewer failed to initialize:', err);
      setInitError(true);
      return undefined;
    }

    viewerRef.current = viewer;

    // Pleasant defaults.
    viewer.scene.globe.enableLighting = true;
    viewer.scene.skyAtmosphere.show = true;
    viewer.cesiumWidget.creditContainer.classList.add(styles.credits);

    // Restore a shared view from the URL hash, if present.
    const saved = readCameraHash();
    if (saved) applyCameraHash(viewer, saved);

    // Read the current camera pose, or null if Cesium hasn't a valid cartographic
    // position yet (can briefly happen during the first frames / at the globe center).
    const readPose = () => {
      const carto = viewer.camera.positionCartographic;
      if (!carto) return null;
      return {
        lon: Cesium.Math.toDegrees(carto.longitude),
        lat: Cesium.Math.toDegrees(carto.latitude),
        alt: carto.height,
        heading: viewer.camera.heading,
        pitch: viewer.camera.pitch,
      };
    };

    // --- Live telemetry (throttled) ---------------------------------------
    // `camera.changed` only fires past a movement threshold; postRender gives a
    // smooth, continuous read that matches the "live console" intent.
    let lastTick = 0;
    const onPostRender = () => {
      const now = performance.now();
      if (now - lastTick < 120) return;
      lastTick = now;
      const pose = readPose();
      if (pose) onTelemetryRef.current?.(pose);
    };
    viewer.scene.postRender.addEventListener(onPostRender);

    // Persist the shareable view to the URL hash only when motion settles — not on
    // every frame — so we don't trip browser replaceState rate limits during drags.
    const onMoveEnd = () => {
      const pose = readPose();
      if (pose) writeCameraHash(pose);
    };
    viewer.camera.moveEnd.addEventListener(onMoveEnd);

    // --- Click-to-identify (reverse geocode) ------------------------------
    const clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    clickHandler.setInputAction((movement) => {
      const ray = viewer.camera.getPickRay(movement.position);
      const cartesian = ray && viewer.scene.globe.pick(ray, viewer.scene);
      if (!cartesian) return; // clicked empty space, not the globe
      const carto = Cesium.Cartographic.fromCartesian(cartesian);
      onPlaceClickRef.current?.({
        lon: Cesium.Math.toDegrees(carto.longitude),
        lat: Cesium.Math.toDegrees(carto.latitude),
      });
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      clickHandler.destroy();
      viewer.scene.postRender.removeEventListener(onPostRender);
      viewer.camera.moveEnd.removeEventListener(onMoveEnd);
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  if (initError) {
    return (
      <div className={styles.fallback} role="alert">
        <div className={styles.fallbackInner}>
          <h2>WebGL unavailable</h2>
          <p>
            This globe needs a WebGL-capable browser with hardware acceleration
            enabled. Try a recent Chrome, Edge, or Firefox.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className={styles.viewer} />;
});

export default EarthViewer;
