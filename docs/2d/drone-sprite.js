/** Vẽ sprite drone 2D top-down — phong cách flight simulator */

let propAngle = 0;

export function updatePropAnimation(dt, throttle) {
    propAngle += dt * (8 + throttle * 22);
}

export function drawDroneTopDown(ctx, x, y, angle, scale, alt, throttle) {
    const s = scale * (0.85 + alt * 0.25);
    const armLen = 22 * s;
    const bodyR = 7 * s;
    const motorR = 5.5 * s;
    const propR = 11 * s;

    ctx.save();
    ctx.translate(x, y);

    // bóng đổ
    ctx.save();
    ctx.translate(4 * s, 6 * s);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 0, armLen * 1.1, armLen * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.rotate(angle);

    const armAngles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];

    // cánh quạt quay
    const propAlpha = 0.35 + throttle * 0.45;
    for (const a of armAngles) {
        const mx = Math.cos(a) * armLen;
        const my = Math.sin(a) * armLen;
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(propAngle * (a > Math.PI ? -1 : 1));
        ctx.strokeStyle = `rgba(255,255,255,${propAlpha})`;
        ctx.lineWidth = 1.8 * s;
        ctx.beginPath();
        ctx.arc(0, 0, propR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-propR, 0);
        ctx.lineTo(propR, 0);
        ctx.moveTo(0, -propR);
        ctx.lineTo(0, propR);
        ctx.stroke();
        ctx.restore();
    }

    // cánh tay
    for (const a of armAngles) {
        const mx = Math.cos(a) * armLen;
        const my = Math.sin(a) * armLen;
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 4 * s;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(mx, my);
        ctx.stroke();

        // motor
        ctx.fillStyle = '#2d2d2d';
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.arc(mx, my, motorR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    // thân
    ctx.fillStyle = '#6b7280';
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(-bodyR, -bodyR * 0.7, bodyR * 2, bodyR * 1.4, 3 * s);
    } else {
        ctx.rect(-bodyR, -bodyR * 0.7, bodyR * 2, bodyR * 1.4);
    }
    ctx.fill();
    ctx.stroke();

    // đèn trước (mũi)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(bodyR * 0.6, 0, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();

    // crosshair đỏ
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.2 * s;
    const ch = 5 * s;
    ctx.beginPath();
    ctx.moveTo(-ch, 0); ctx.lineTo(ch, 0);
    ctx.moveTo(0, -ch); ctx.lineTo(0, ch);
    ctx.stroke();

    ctx.restore();
}

export function drawHelipad(ctx, x, y, r, scale, label = 'H') {
    const rs = r * scale;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 3 * scale;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.arc(x, y, rs, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2.5 * scale;
    ctx.beginPath();
    ctx.arc(x, y, rs * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = `bold ${Math.min(rs * 0.45, 14 * scale)}px Segoe UI, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
    ctx.restore();
}

export function drawThreatDrone(ctx, x, y, scale, pulse = 0) {
    const s = 10 * scale * (1 + pulse * 0.08);
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = 'rgba(220,38,38,0.85)';
    ctx.fillStyle = 'rgba(220,38,38,0.25)';
    ctx.lineWidth = 1.5 * scale;
    for (const a of [0.785, 2.356, 3.927, 5.498]) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(Math.cos(a) * s, Math.sin(a) * s, 2.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(0, 0, 3 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

export function drawCheckpointRing(ctx, x, y, r, scale, state) {
    const rs = r * scale;
    ctx.save();
    if (state === 'active') {
        ctx.strokeStyle = 'rgba(251,146,60,0.9)';
        ctx.lineWidth = 4 * scale;
        ctx.setLineDash([8 * scale, 5 * scale]);
        ctx.beginPath();
        ctx.arc(x, y, rs + 6 * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    ctx.strokeStyle = state === 'done' ? 'rgba(34,197,94,0.85)' : state === 'active' ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)';
    ctx.lineWidth = (state === 'active' ? 4 : 2.5) * scale;
    ctx.fillStyle = state === 'active' ? 'rgba(255,255,255,0.15)' : 'transparent';
    ctx.beginPath();
    ctx.arc(x, y, rs, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}
