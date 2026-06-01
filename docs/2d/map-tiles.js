/**
 * Nền ảnh trên không tĩnh — 16 tấm local, chọn ngẫu nhiên mỗi lần bật.
 * (Không tải tile vệ tinh real-time.)
 */
import { STATIC_MAPS } from './static-maps.js';

let activeMap = null;
let loading = null;
let loadError = null;

function mapUrl(file) {
    return new URL(file, import.meta.url).href;
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const timer = setTimeout(() => reject(new Error('timeout')), 15000);
        img.onload = () => {
            clearTimeout(timer);
            resolve(img);
        };
        img.onerror = () => {
            clearTimeout(timer);
            reject(new Error('load fail'));
        };
        img.src = url;
    });
}

function pickRandomMap() {
    return STATIC_MAPS[Math.floor(Math.random() * STATIC_MAPS.length)];
}

export function getMapAttribution() {
    if (!activeMap) return 'Nền mô phỏng · Đông A Tech';
    return `${activeMap.label} · ảnh nền HL`;
}

export function isMapReady() {
    return !!activeMap?.canvas;
}

export function isMapLoading() {
    return !!loading;
}

export function getMapLoadError() {
    return loadError;
}

export async function preloadMapTiles() {
    if (activeMap?.canvas) return activeMap;
    if (loading) return loading;

    loading = (async () => {
        loadError = null;
        const meta = pickRandomMap();
        const img = await loadImage(mapUrl(meta.file));
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const g = canvas.getContext('2d');
        g.drawImage(img, 0, 0);
        activeMap = { canvas, label: meta.label, file: meta.file };
        return activeMap;
    })();

    try {
        return await loading;
    } catch (e) {
        loadError = e?.message ?? 'Lỗi tải ảnh nền';
        activeMap = null;
        return null;
    } finally {
        loading = null;
    }
}

/** Vẽ cover vào vùng sân */
export function drawMapBackground(ctx, screenX, screenY, w, h) {
    if (!activeMap?.canvas) return false;
    const { canvas } = activeMap;
    const iw = canvas.width;
    const ih = canvas.height;
    const scale = Math.max(w / iw, h / ih);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (iw - sw) / 2;
    const sy = (ih - sh) / 2;
    ctx.save();
    try {
        ctx.drawImage(canvas, sx, sy, sw, sh, screenX, screenY, w, h);
        return true;
    } catch {
        return false;
    } finally {
        ctx.restore();
    }
}

export function invalidateMapCache() {
    activeMap = null;
    loading = null;
    loadError = null;
}
