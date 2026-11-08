# AGENTS.md

3D globe: React 18 + Vite 5 + CesiumJS. See `README.md` for features.

- Install and run: `npm install`, `npm run dev`. Build: `npm run build`, preview: `npm run preview`.
- Works with no key. Optional `VITE_CESIUM_ION_TOKEN` in `.env` (copy `.env.example`). Never commit `.env`.
- `vite.config.js` copies Cesium's static assets to `cesiumStatic/` and sets `CESIUM_BASE_URL`. If the globe white-screens, check this first.
- `src/components/EarthViewer.jsx` owns the camera, `src/lib/nominatim.js` the geocoding, `src/lib/cameraUrl.js` the `#@lon,lat,alt,...` share URL.
