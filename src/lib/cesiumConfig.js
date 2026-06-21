// src/lib/cesiumConfig.js
import * as Cesium from 'cesium';

// --- Cesium ion token (optional) ---------------------------------------------
// Hybrid strategy: the app runs fully key-free by default. If the user supplies a
// free ion token via VITE_CESIUM_ION_TOKEN, we upgrade to Cesium World Imagery +
// World Terrain for the true "Google Earth" look. One code path, env-gated.
const rawToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
export const hasIonToken = Boolean(rawToken && rawToken.trim());

if (hasIonToken) {
  Cesium.Ion.defaultAccessToken = rawToken.trim();
}

/**
 * Esri World Imagery — a key-free global satellite basemap.
 * Attribution is required and is rendered by Cesium's credit display.
 */
export function createKeyFreeImageryProvider() {
  return new Cesium.UrlTemplateImageryProvider({
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maximumLevel: 19,
    credit: new Cesium.Credit(
      'Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      false
    ),
  });
}

/**
 * Returns the imagery/terrain options to spread into the `Cesium.Viewer`
 * constructor. With a token we hand back Ion-backed World Imagery + World Terrain;
 * without one we hand back the Esri base layer (terrain stays the default flat
 * EllipsoidTerrainProvider, which needs no token).
 *
 * Importantly, passing an explicit `baseLayer` stops the Viewer from trying to
 * load its default Ion imagery — which is what would otherwise error out / prompt
 * for a token when none is present.
 */
export function getImageryTerrainOptions() {
  if (hasIonToken) {
    return {
      baseLayer: Cesium.ImageryLayer.fromWorldImagery(),
      terrain: Cesium.Terrain.fromWorldTerrain(),
    };
  }
  return {
    baseLayer: new Cesium.ImageryLayer(createKeyFreeImageryProvider()),
  };
}
