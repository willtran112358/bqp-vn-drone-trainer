/** Texture nền procedural — đất/sân cỏ, không cần asset ngoài */

import { drawMapBackground, isMapReady, getMapAttribution } from './map-tiles.js';

let groundPattern = null;
let dirtPattern = null;

function noiseTile(size, base, variance, count) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const g = c.getContext('2d');
    g.fillStyle = base;
    g.fillRect(0, 0, size, size);
    for (let i = 0; i < count; i++) {
        const r = Math.random();
        const hue = 28 + r * 18;
        const sat = 18 + r * 22;
        const lit = 32 + r * 28;
        g.fillStyle = `hsla(${hue},${sat}%,${lit}%,${0.08 + Math.random() * 0.14})`;
        const w = 2 + Math.random() * 6;
        const h = 2 + Math.random() * 6;
        g.fillRect(Math.random() * size, Math.random() * size, w, h);
    }
    for (let i = 0; i < count * 0.4; i++) {
        g.fillStyle = `rgba(45,45,40,${0.02 + Math.random() * 0.04})`;
        g.beginPath();
        g.arc(Math.random() * size, Math.random() * size, 0.5 + Math.random() * 1.5, 0, Math.PI * 2);
        g.fill();
    }
    return c;
}

export function initTerrain(ctx) {
    if (groundPattern) return;
    groundPattern = ctx.createPattern(noiseTile(128, '#a39478', 12, 520), 'repeat');
    dirtPattern = ctx.createPattern(noiseTile(96, '#8b7d62', 10, 380), 'repeat');
}

export function drawRealisticGround(ctx, x, y, w, h, scale) {
    initTerrain(ctx);
    ctx.save();

    const grd = ctx.createLinearGradient(x, y, x + w * 0.6, y + h);
    grd.addColorStop(0, '#b5a68a');
    grd.addColorStop(0.45, '#a89576');
    grd.addColorStop(1, '#95866a');
    ctx.fillStyle = grd;
    ctx.fillRect(x, y, w, h);

    ctx.globalAlpha = 0.55;
    ctx.fillStyle = groundPattern;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = dirtPattern;
    ctx.translate(17, 23);
    ctx.fillRect(x - 17, y - 23, w, h);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;

    // Vignette nhẹ — ánh sáng từ góc trên-trái
    const light = ctx.createRadialGradient(x + w * 0.2, y + h * 0.15, 0, x + w * 0.5, y + h * 0.5, w * 0.85);
    light.addColorStop(0, 'rgba(255,248,220,0.12)');
    light.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = light;
    ctx.fillRect(x, y, w, h);

    // Vết xe / lối mòn mờ
    ctx.strokeStyle = 'rgba(70,60,45,0.12)';
    ctx.lineWidth = 14 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.15, y + h * 0.72);
    ctx.quadraticCurveTo(x + w * 0.45, y + h * 0.68, x + w * 0.55, y + h * 0.55);
    ctx.stroke();

    ctx.restore();
}

/** Nền sân: bản đồ thật (nếu bật & đã tải) hoặc procedural */
export function drawArenaGround(ctx, x, y, w, h, scale, useMap) {
    let usedMap = false;
    if (useMap && isMapReady()) {
        usedMap = drawMapBackground(ctx, x, y, w, h);
        if (usedMap) {
            ctx.save();
            ctx.fillStyle = 'rgba(20,30,20,0.12)';
            ctx.fillRect(x, y, w, h);
            ctx.restore();
        }
    }
    if (!usedMap) drawRealisticGround(ctx, x, y, w, h, scale);
    return usedMap;
}

export function drawMapAttribution(ctx, x, y, w, scale) {
    if (!isMapReady()) return;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x + w - 168 * scale, y + h - 16 * scale, 164 * scale, 14 * scale);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `${8 * scale}px Segoe UI, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(getMapAttribution(), x + w - 4 * scale, y + h - 9 * scale);
    ctx.restore();
}

export function drawCompassRose(ctx, cx, cy, r, scale, droneAngle) {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.strokeStyle = 'rgba(55,65,81,0.5)';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Kim bắc (cố định)
    ctx.fillStyle = '#dc2626';
    ctx.font = `bold ${9 * scale}px Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('B', 0, -r * 0.62);

    // Kim hướng mũi drone (trùng trục +X vật lý)
    ctx.save();
    ctx.rotate(droneAngle);
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.moveTo(r * 0.48, 0);
    ctx.lineTo(-r * 0.1, -4.5 * scale);
    ctx.lineTo(-r * 0.1, 4.5 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#6b7280';
    ctx.font = `${7 * scale}px Segoe UI, sans-serif`;
    ctx.fillText('mũi', 0, r * 0.55);

    ctx.restore();
}
