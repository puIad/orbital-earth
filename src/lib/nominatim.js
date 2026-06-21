// src/lib/nominatim.js
// Thin client for the free OpenStreetMap Nominatim geocoding API.
// Notes:
//  - Nominatim sends permissive CORS headers, so a plain browser fetch works.
//  - Browsers forbid overriding `User-Agent`; the browser sets it (plus Referer)
//    automatically, which satisfies Nominatim's identification policy. Callers
//    must debounce (<= 1 req/sec) to respect the usage policy — see SearchBar.
const ENDPOINT = 'https://nominatim.openstreetmap.org';

/**
 * Forward geocode: free-text query -> up to 5 matching places.
 * @param {string} query
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array<{id:number,label:string,lon:number,lat:number,type:string}>>}
 */
export async function geocode(query, signal) {
  const url =
    `${ENDPOINT}/search?q=${encodeURIComponent(query)}` +
    `&format=json&limit=5&addressdetails=1`;

  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Nominatim search failed: ${res.status}`);

  const data = await res.json();
  return data.map((d) => ({
    id: d.place_id,
    label: d.display_name,
    lon: parseFloat(d.lon),
    lat: parseFloat(d.lat),
    type: d.type,
  }));
}

/**
 * Reverse geocode: lat/lon -> a human-readable place label (or null).
 * @param {number} lat
 * @param {number} lon
 * @param {AbortSignal} [signal]
 * @returns {Promise<string|null>}
 */
export async function reverseGeocode(lat, lon, signal) {
  const url =
    `${ENDPOINT}/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}` +
    `&format=json&zoom=14&addressdetails=1`;

  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Nominatim reverse failed: ${res.status}`);

  const data = await res.json();
  return data && data.display_name ? data.display_name : null;
}
