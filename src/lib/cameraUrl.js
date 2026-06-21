// src/lib/cameraUrl.js
// Encode/decode the current camera pose to the URL hash so a view is shareable.
// Hash format:  #@<lon>,<lat>,<alt>,<heading>,<pitch>
//   lon/lat in degrees, alt in metres, heading/pitch in radians.
import * as Cesium from 'cesium';

const HASH_RE =
  /^#@(-?[\d.]+),(-?[\d.]+),(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)/;

/** Parse the current location hash into a camera state, or null if absent/invalid. */
export function readCameraHash() {
  const match = HASH_RE.exec(window.location.hash);
  if (!match) return null;
  const [, lon, lat, alt, heading, pitch] = match.map(Number);
  if ([lon, lat, alt, heading, pitch].some(Number.isNaN)) return null;
  return { lon, lat, alt, heading, pitch };
}

/** Write a camera state to the URL hash without adding a history entry. */
export function writeCameraHash({ lon, lat, alt, heading, pitch }) {
  // Never emit a corrupt hash from a transient non-finite camera read.
  if (![lon, lat, alt, heading, pitch].every(Number.isFinite)) return;
  const f = (n, d) => Number(n).toFixed(d);
  const hash = `#@${f(lon, 5)},${f(lat, 5)},${f(alt, 1)},${f(heading, 4)},${f(pitch, 4)}`;
  window.history.replaceState(null, '', hash);
}

/** Snap a viewer's camera to a saved state (used once on load). */
export function applyCameraHash(viewer, state) {
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(state.lon, state.lat, state.alt),
    orientation: { heading: state.heading, pitch: state.pitch, roll: 0 },
  });
}
