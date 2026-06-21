# OrbitalEarth — Google Earth Replica

A web-based 3D interactive globe built with **React (Vite) + CesiumJS**. Search any
place (OpenStreetMap Nominatim geocoding), fly the camera there, read live
lat/lon/altitude telemetry, and click the globe to identify a point.

## Stack

- **React 18** via **Vite 5**
- **CesiumJS** (`cesium`) — 3D globe engine
- **vite-plugin-static-copy** — copies Cesium static assets + sets `CESIUM_BASE_URL`
- **OpenStreetMap Nominatim** — free geocoding (no API key)

## Setup

```bash
# from this folder
npm install
npm run dev
```

Open the printed URL (default http://localhost:5173).

### Optional: photoreal satellite + 3D terrain

The app runs **key-free** by default (Esri World Imagery satellite + flat globe).
For the full "Google Earth" look (Cesium World Imagery + 3D World Terrain), add a
**free** [Cesium ion](https://ion.cesium.com/tokens) token:

```bash
cp .env.example .env
# edit .env -> VITE_CESIUM_ION_TOKEN=your_token_here
npm run dev   # restart
```

## Features

| Feature | Where |
| --- | --- |
| 3D globe + camera controls (zoom/rotate/tilt) | `src/components/EarthViewer.jsx` |
| Debounced geocoding search + keyboard nav | `src/components/SearchBar.jsx`, `src/lib/nominatim.js` |
| 3-second camera flight to result @ 2000 m | `EarthViewer.flyTo()` via `App.jsx` |
| Live LAT/LON/ALT telemetry + copy share link | `src/components/InfoPanel.jsx` |
| Click globe → reverse-geocoded place name | `EarthViewer` click handler + `App.jsx` |
| Shareable camera URL (`#@lon,lat,alt,…`) | `src/lib/cameraUrl.js` |

## How the Cesium/Vite wiring works

`vite.config.js` copies Cesium's `Workers/Assets/Widgets/ThirdParty` into
`cesiumStatic/` and defines `CESIUM_BASE_URL = "/cesiumStatic"`. If this is wrong,
Cesium can't load its workers/shaders and the app white-screens — so it is the
first thing to check if the globe doesn't appear.

## Build

```bash
npm run build      # -> dist/
npm run preview    # serve the production build
```
