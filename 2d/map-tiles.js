/**
 * Nền bản đồ thật — ưu tiên nguồn miễn phí, không bắt buộc API key.
 *
 * Mặc định: Esri World Imagery (ảnh vệ tinh, không cần key — ghi attribution).
 * Tùy chọn: OSM, MapTiler free tier (key trong config.local.js).
 */

import { ARENA } from './levels.js';

const TILE = 256;
const cache = new Map();

/** Khu vực mô phỏng — ven biển Đà Nẵng (có thể đổi trong config.local.js) */
export let mapConfig = {
    center: { lat: 16.0544, lon: 108.2022 },
    spanM: { w: 1100, h: 825 },
    zoom: 17,
    provider: 'esri',
    maptilerKey: '',
};

let stitched = null;
let loading = null;
let loadError = null;

const PROVIDERS = {
    esri: {
        name: 'Esri World Imagery',
        url: (z, x, y) =>
            `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
        attr: '© Esri · Maxar · Earthstar',
    },
    osm: {
        name: 'OpenStreetMap',
        url: (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
        attr: '© OpenStreetMap',
    },
    'maptiler-satellite': {
        name: 'MapTiler Satellite',
        url: (z, x, y, key) =>
            `https://api.maptiler.com/tiles/satellite-v2/${z}/${x}/${y}.jpg?key=${key}`,
        attr: '© MapTiler · © OpenStreetMap',
        needsKey: true,
    },
};

export async function loadMapConfig() {
    try {
        const mod = await import('./config.local.js');
        if (mod.MAP_CONFIG) mapConfig = { ...mapConfig, ...mod.MAP_CONFIG };
    } catch {
        /* config.local.js không bắt buộc */
    }
}

function worldToLatLon(wx, wy) {
    const { center, spanM } = mapConfig;
    const mLat = 111320;
    const mLon = 111320 * Math.cos((center.lat * Math.PI) / 180);
    const lat = center.lat + ((spanM.h / 2 - (wy / ARENA.h) * spanM.h) / mLat);
    const lon = center.lon + (((wx / ARENA.w) * spanM.w - spanM.w / 2) / mLon);
    return { lat, lon };
}

function latLonToTile(lat, lon, z) {
    const n = 2 ** z;
    const x = Math.floor(((lon + 180) / 360) * n);
    const latR = (lat * Math.PI) / 180;
    const y = Math.floor(((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n);
    return { x, y };
}

function tileToLatLon(x, y, z) {
    const n = 2 ** z;
    const lon = (x / n) * 360 - 180;
    const latR = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
    return { lat: (latR * 180) / Math.PI, lon };
}

function loadTile(url) {
    if (cache.has(url)) return cache.get(url);
    const p = new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Tile fail: ${url}`));
        img.src = url;
    });
    cache.set(url, p);
    return p;
}

function providerUrl(z, x, y) {
    const p = PROVIDERS[mapConfig.provider] ?? PROVIDERS.esri;
    if (p.needsKey && !mapConfig.maptilerKey) return null;
    return p.needsKey
        ? p.url(z, x, y, mapConfig.maptilerKey)
        : p.url(z, x, y);
}

export function getMapAttribution() {
    const p = PROVIDERS[mapConfig.provider] ?? PROVIDERS.esri;
    return p.attr;
}

export function isMapReady() {
    return !!stitched;
}

export function getMapLoadError() {
    return loadError;
}

/** Tải và ghép tile cho vùng sân bay */
export async function preloadMapTiles() {
    if (stitched) return stitched;
    if (loading) return loading;

    await loadMapConfig();
    const z = mapConfig.zoom;

    const nw = worldToLatLon(0, 0);
    const se = worldToLatLon(ARENA.w, ARENA.h);
    const tNW = latLonToTile(nw.lat, nw.lon, z);
    const tSE = latLonToTile(se.lat, se.lon, z);

    const x0 = Math.min(tNW.x, tSE.x);
    const x1 = Math.max(tNW.x, tSE.x);
    const y0 = Math.min(tNW.y, tSE.y);
    const y1 = Math.max(tNW.y, tSE.y);

    loading = (async () => {
        loadError = null;
        const cols = x1 - x0 + 1;
        const rows = y1 - y0 + 1;
        const canvas = document.createElement('canvas');
        canvas.width = cols * TILE;
        canvas.height = rows * TILE;
        const g = canvas.getContext('2d');

        const nwLatLon = tileToLatLon(x0, y0, z);
        const seLatLon = tileToLatLon(x1 + 1, y1 + 1, z);

        for (let ty = y0; ty <= y1; ty++) {
            for (let tx = x0; tx <= x1; tx++) {
                const url = providerUrl(z, tx, ty);
                if (!url) throw new Error('Thiếu MapTiler API key — xem config.local.example.js');
                try {
                    const img = await loadTile(url);
                    g.drawImage(img, (tx - x0) * TILE, (ty - y0) * TILE);
                } catch (e) {
                    loadError = e.message;
                    throw e;
                }
            }
        }

        stitched = { canvas, x0, y0, z, cols, rows, nwLatLon, seLatLon };
        return stitched;
    })();

    try {
        return await loading;
    } catch {
        stitched = null;
        return null;
    } finally {
        loading = null;
    }
}

/** Vẽ ảnh vệ tinh/bản đồ khớp tọa độ world → screen */
export function drawMapBackground(ctx, screenX, screenY, w, h) {
    if (!stitched) return false;

    const { canvas, nwLatLon, seLatLon } = stitched;
    const nw = worldToLatLon(0, 0);
    const se = worldToLatLon(ARENA.w, ARENA.h);

    const u0 = (nw.lon - nwLatLon.lon) / (seLatLon.lon - nwLatLon.lon);
    const v0 = (nwLatLon.lat - nw.lat) / (nwLatLon.lat - seLatLon.lat);
    const u1 = (se.lon - nwLatLon.lon) / (seLatLon.lon - nwLatLon.lon);
    const v1 = (nwLatLon.lat - se.lat) / (nwLatLon.lat - seLatLon.lat);

    const sx = Math.max(0, u0 * canvas.width);
    const sy = Math.max(0, v0 * canvas.height);
    const sw = Math.min(canvas.width, u1 * canvas.width) - sx;
    const sh = Math.min(canvas.height, v1 * canvas.height) - sy;

    ctx.drawImage(canvas, sx, sy, sw, sh, screenX, screenY, w, h);
    return true;
}

export function invalidateMapCache() {
    stitched = null;
    loading = null;
    cache.clear();
}
