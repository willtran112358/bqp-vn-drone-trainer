/** Vector hướng dẫn bay — input / hướng / gia tốc / gió / tổng hợp */

export const GUIDE_COLORS = {
    input: '#86efac',
    orientation: '#fb923c',
    acceleration: '#60a5fa',
    wind: '#16a34a',
    composite: '#f87171',
};

export const GUIDE_LABELS = {
    input: 'Lệnh',
    orientation: 'Hướng',
    acceleration: 'Gia tốc',
    wind: 'Gió',
    composite: 'Tổng hợp',
};

function drawArrow(ctx, x0, y0, dx, dy, color, scale, label) {
    const mag = Math.hypot(dx, dy);
    if (mag < 0.5) return;
    const maxLen = 72 * scale;
    const len = Math.min(mag * 14 * scale, maxLen);
    const nx = dx / mag;
    const ny = dy / mag;
    const x1 = x0 + nx * len;
    const y1 = y0 + ny * len;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(2, 2.2 * scale);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    const head = 7 * scale;
    const ang = Math.atan2(ny, nx);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - head * Math.cos(ang - 0.45), y1 - head * Math.sin(ang - 0.45));
    ctx.lineTo(x1 - head * Math.cos(ang + 0.45), y1 - head * Math.sin(ang + 0.45));
    ctx.closePath();
    ctx.fill();

    if (label && len > 12 * scale) {
        ctx.font = `bold ${Math.max(9, 10 * scale)}px Segoe UI, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.65)';
        ctx.shadowBlur = 3;
        ctx.fillText(label, x1 + nx * 10 * scale, y1 + ny * 10 * scale);
        ctx.shadowBlur = 0;
    }
    ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} sx screen x drone center
 * @param {object} v { input, orientation, acceleration, wind, composite } world vectors
 * @param {object} flags { player, wind }
 */
/** Mũi tên trắng — hướng mũi / lực đẩy (tham khảo 2D Drone Simulator) */
export function drawHeadingArrow(ctx, sx, sy, angle, scale, alt) {
    const len = (28 + alt * 24) * scale;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = Math.max(1.8, 2.2 * scale);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
    ctx.stroke();
    const head = 6 * scale;
    const ax = sx + Math.cos(angle) * len;
    const ay = sy + Math.sin(angle) * len;
    const a = angle;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - head * Math.cos(a - 0.5), ay - head * Math.sin(a - 0.5));
    ctx.lineTo(ax - head * Math.cos(a + 0.5), ay - head * Math.sin(a + 0.5));
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();
    ctx.restore();
}

export function drawFlightGuides(ctx, sx, sy, scale, v, flags, headingAngle, alt) {
    if (flags.player && headingAngle != null) {
        drawHeadingArrow(ctx, sx, sy, headingAngle, scale, alt ?? 0.5);
    }
    if (flags.player) {
        drawArrow(ctx, sx, sy, v.input.x, v.input.y, GUIDE_COLORS.input, scale, GUIDE_LABELS.input);
        drawArrow(ctx, sx, sy, v.orientation.x, v.orientation.y, GUIDE_COLORS.orientation, scale, GUIDE_LABELS.orientation);
        drawArrow(ctx, sx, sy, v.acceleration.x, v.acceleration.y, GUIDE_COLORS.acceleration, scale, GUIDE_LABELS.acceleration);
        drawArrow(ctx, sx, sy, v.composite.x, v.composite.y, GUIDE_COLORS.composite, scale, GUIDE_LABELS.composite);
    }
    if (flags.wind && (Math.hypot(v.wind.x, v.wind.y) > 0.3)) {
        drawArrow(ctx, sx, sy, v.wind.x, v.wind.y, GUIDE_COLORS.wind, scale, GUIDE_LABELS.wind);
    }
}

/** Mũi tên hướng khi nhấn phím / cần (HUD nhỏ quanh drone) */
export function drawInputHints(ctx, sx, sy, scale, inp, active) {
    if (!active) return;
    const hints = [
        { key: inp.throttle > 0.15, dx: 0, dy: -1, color: '#a7f3d0', label: '↑ Ga' },
        { key: inp.throttle < -0.15, dx: 0, dy: 1, color: '#a7f3d0', label: '↓ Ga' },
        { key: inp.yaw < -0.15, dx: -1, dy: 0, color: '#fde68a', label: '↺' },
        { key: inp.yaw > 0.15, dx: 1, dy: 0, color: '#fde68a', label: '↻' },
        { key: inp.pitch < -0.15, dx: 0, dy: -1, color: '#93c5fd', label: 'Tiến' },
        { key: inp.pitch > 0.15, dx: 0, dy: 1, color: '#93c5fd', label: 'Lùi' },
        { key: inp.roll < -0.15, dx: -1, dy: 0, color: '#93c5fd', label: 'Trái' },
        { key: inp.roll > 0.15, dx: 1, dy: 0, color: '#93c5fd', label: 'Phải' },
    ];
    const off = 42 * scale;
    ctx.save();
    ctx.font = `bold ${9 * scale}px Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const h of hints) {
        if (!h.key) continue;
        const px = sx + h.dx * off;
        const py = sy + h.dy * off;
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.arc(px, py, 11 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = h.color;
        ctx.fillText(h.label, px, py);
    }
    ctx.restore();
}
