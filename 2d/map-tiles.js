/**
 * Nền bản đồ thật — tải nền, không block UI.
 */

import { ARENA } from './levels.js';

const TILE = 256;
const MAX_TILES = 24;
const TILE_TIMEOUT_MS = 12000;
const CONCURRENCY = 4;
const cache = new Map();

export let mapConfig = {
    center: { lat: 16.0544, lon: 108.2022 },
    spanM: { w: 1100, h: 825 },
    zoom: 16,
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
        attr: '© Esri · Maxar',
        cors: false,
    },
    osm: {
        name: 'OpenStreetMap',
        url: (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
        attr: '© OpenStreetMap',
        cors: true,
    },
    'maptiler-satellite': {
        name: 'MapTiler Satellite',
        url: (z, x, y, key) =>
            `https://api.maptiler.com/tiles/satellite-v2/${z}/${x}/${y}.jpg?key=${key}`,
        attr: '© MapTiler',
        needsKey: true,
        cors: true,
    },
};

export async function loadMapConfig() {
    try {
        const mod = await import('./config.local.js');
        if (mod.MAP_CONFIG) mapConfig = { ...mapConfig, ...mod.MAP_CONFIG };
    } catch { /* optional */ }
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
    return { x: Math.max(0, Math.min(n - 1, x)), y: Math.max(0, Math.min(n - 1, y)) };
}

function tileToLatLon(x, y, z) {
    const n = 2 ** z;
    const lon = (x / n) * 360 - 180;
    const latR = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
    return { lat: (latR * 180) / Math.PI, lon };
}

function loadTile(url, useCors) {
    if (cache.has(url)) return cache.get(url);
    const p = new Promise((resolve, reject) => {
        const img = new Image();
        if (useCors) img.crossOrigin = 'anonymous';
        const timer = setTimeout(() => reject(new Error('timeout')), TILE_TIMEOUT_MS);
        img.onload = () => { clearTimeout(timer); resolve(img); };
        img.onerror = () => { clearTimeout(timer); reject(new Error('load fail')); };
        img.src = url;
    });
    cache.set(url, p);
    return p;
}

async function loadTilesParallel(jobs, useCors) {
    const results = [];
    let i = 0;
    async function worker() {
        while (i < jobs.length) {
            const idx = i++;
            const job = jobs[idx];
            try {
                const img = await loadTile(job.url, useCors);
                results[idx] = { ok: true, img, ...job };
            } catch {
                results[idx] = { ok: false, ...job };
            }
        }
    }
    const workers = Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, () => worker());
    await Promise.all(workers);
    return results;
}

function providerUrl(z, x, y) {
    const p = PROVIDERS[mapConfig.provider] ?? PROVIDERS.esri;
    if (p.needsKey && !mapConfig.maptilerKey) return null;
    return p.needsKey ? p.url(z, x, y, mapConfig.maptilerKey) : p.url(z, x, y);
}

export function getMapAttribution() {
    return (PROVIDERS[mapConfig.provider] ?? PROVIDERS.esri).attr;
}

export function isMapReady() {
    return !!stitched;
}

export function isMapLoading() {
    return !!loading;
}

export function getMapLoadError() {
    return loadError;
}

export async function preloadMapTiles() {
    if (stitched) return stitched;
    if (loading) return loading;

    loading = (async () => {
        loadError = null;
        await loadMapConfig();
        const p = PROVIDERS[mapConfig.provider] ?? PROVIDERS.esri;
        const z = mapConfig.zoom;

        const nw = worldToLatLon(0, 0);
        const se = worldToLatLon(ARENA.w, ARENA.h);
        const tNW = latLonToTile(nw.lat, nw.lon, z);
        const tSE = latLonToTile(se.lat, se.lon, z);

        const x0 = Math.min(tNW.x, tSE.x);
        const x1 = Math.max(tNW.x, tSE.x);
        const y0 = Math.min(tNW.y, tSE.y);
        const y1 = Math.max(tNW.y, tSE.y);
        const cols = x1 - x0 + 1;
        const rows = y1 - y0 + 1;

        if (cols * rows > MAX_TILES) {
            throw new Error(`Quá nhiều tile (${cols * rows}) — hạ zoom trong config`);
        }

        const jobs = [];
        for (let ty = y0; ty <= y1; ty++) {
            for (let tx = x0; tx <= x1; tx++) {
                const url = providerUrl(z, tx, ty);
                if (!url) throw new Error('Thiếu MapTiler API key');
                jobs.push({ url, tx, ty, dx: tx - x0, dy: ty - y0 });
            }
        }

        const loaded = await loadTilesParallel(jobs, !!p.cors);
        const okCount = loaded.filter((r) => r.ok).length;
        if (okCount === 0) throw new Error('Không tải được tile — thử lại sau');

        const canvas = document.createElement('canvas');
        canvas.width = cols * TILE;
        canvas.height = rows * TILE;
        const g = canvas.getContext('2d');
        g.fillStyle = '#3d3830';
        g.fillRect(0, 0, canvas.width, canvas.height);

        for (const r of loaded) {
            if (r.ok) g.drawImage(r.img, r.dx * TILE, r.dy * TILE);
        }

        stitched = {
            canvas,
            nwLatLon: tileToLatLon(x0, y0, z),
            seLatLon: tileToLatLon(x1 + 1, y1 + 1, z),
        };
        return stitched;
    })();

    try {
        return await loading;
    } catch (e) {
        loadError = e?.message ?? 'Lỗi tải bản đồ';
        stitched = null;
        return null;
    } finally {
        loading = null;
    }
}

export function drawMapBackground(ctx, screenX, screenY, w, h) {
    if (!stitched) return false;

    const { canvas, nwLatLon, seLatLon } = stitched;
    const nw = worldToLatLon(0, 0);
    const se = worldToLatLon(ARENA.w, ARENA.h);

    const dLon = seLatLon.lon - nwLatLon.lon;
    const dLat = nwLatLon.lat - seLatLon.lat;
    if (Math.abs(dLon) < 1e-9 || Math.abs(dLat) < 1e-9) return false;

    const u0 = (nw.lon - nwLatLon.lon) / dLon;
    const v0 = (nwLatLon.lat - nw.lat) / dLat;
    const u1 = (se.lon - nwLatLon.lon) / dLon;
    const v1 = (nwLatLon.lat - se.lat) / dLat;

    const sx = Math.max(0, Math.min(canvas.width - 1, u0 * canvas.width));
    const sy = Math.max(0, Math.min(canvas.height - 1, v0 * canvas.height));
    const sw = Math.max(1, Math.min(canvas.width - sx, (u1 - u0) * canvas.width));
    const sh = Math.max(1, Math.min(canvas.height - sy, (v1 - v0) * canvas.height));

    if (!Number.isFinite(sw) || !Number.isFinite(sh)) return false;

    try {
        ctx.drawImage(canvas, sx, sy, sw, sh, screenX, screenY, w, h);
        return true;
    } catch {
        return false;
    }
}

export function invalidateMapCache() {
    stitched = null;
    loading = null;
    cache.clear();
}
