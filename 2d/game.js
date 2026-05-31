import { ARENA, LEVELS, SKILLS, THREAT_BEARING, BRANCHES, BRANCH_ORDER, COMPANY, FEATURES } from './levels.js';
import { readInputs, consumeKey, lastInputs } from './input.js';
import { initTouchControls, setTouchControlsVisible } from './touch-controls.js';
import {
    updatePropAnimation, drawDroneTopDown, drawHelipad, drawCheckpointRing, drawThreatDrone,
} from './drone-sprite.js';
import { drawCompassRose, drawArenaGround, drawMapAttribution } from './terrain.js';
import { preloadMapTiles, isMapReady, isMapLoading, getMapLoadError } from './map-tiles.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let levelIdx = 0;
let skillId = 'co-ban';
let running = false;
let finished = false;
let cpIndex = 0;
let elapsed = 0;
let landTimer = 0;
let showPathGuide = true;
let showGrid = true;
let showMapTiles = false;
let mapLoading = false;
let windStrength = 0;
let windAngle = 0;
let inThreatZone = false;
let threatPulse = 0;

const drone = { x: 400, y: 300, angle: 0, vx: 0, vy: 0, alt: 0.5 };
let scale = 1, offsetX = 0, offsetY = 0;
let arenaRect = { x: 0, y: 0, w: 0, h: 0 };

function resize() {
    const sidebar = 52;
    const topPad = 8;
    const rightPad = 8;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const availW = canvas.width - sidebar - rightPad * 2;
    const availH = canvas.height - topPad * 2;
    scale = Math.min(availW / ARENA.w, availH / ARENA.h) * 0.96;
    offsetX = sidebar + (availW - ARENA.w * scale) / 2;
    offsetY = topPad + (availH - ARENA.h * scale) / 2;
    arenaRect = { x: offsetX, y: offsetY, w: ARENA.w * scale, h: ARENA.h * scale };
}
window.addEventListener('resize', resize);
resize();

function worldToScreen(x, y) {
    return [offsetX + x * scale, offsetY + y * scale];
}

function resetDrone() {
    const lv = LEVELS[levelIdx];
    drone.x = lv.spawn.x;
    drone.y = lv.spawn.y;
    drone.angle = lv.spawn.angle;
    drone.vx = drone.vy = 0;
    drone.alt = 0.5;
    cpIndex = 0;
    elapsed = 0;
    finished = false;
    landTimer = 0;
    if (lv.defaultWind) {
        windStrength = lv.defaultWind.strength;
        windAngle = lv.defaultWind.angle;
        document.getElementById('chkWind').checked = windStrength > 0;
        document.getElementById('windSlider').value = Math.round(windStrength * 10);
    } else {
        windStrength = 0;
        document.getElementById('chkWind').checked = false;
        document.getElementById('windSlider').value = 0;
    }
    updateObjective();
    updateWindDial();
}

function skill() { return SKILLS[skillId]; }
function level() { return LEVELS[levelIdx]; }

function getObjectiveText() {
    const lv = level();
    const cps = lv.checkpoints;
    if (finished) return { main: '✓ Hoàn thành nhiệm vụ!', sub: `${formatTime(elapsed)} · ${lv.doctrine ?? ''}` };
    if (inThreatZone) return { main: '⚠ Vùng đe dọa — thoát ngay!', sub: 'UAV địch mô phỏng · hướng ' + THREAT_BEARING };
    if (!cps.length) return { main: lv.name, sub: lv.doctrine ?? 'Luyện ga · xoay · VLOS' };
    if (lv.landing && cpIndex >= cps.length) {
        return {
            main: `Hạ cánh · ${lv.landing.label ?? 'Bãi H'}`,
            sub: `Giữ ổn định ${landTimer.toFixed(1)}/${lv.landing.holdSec}s · S = ga thấp`,
        };
    }
    const cp = cps[cpIndex];
    return {
        main: `→ ${cp.label ?? `Điểm ${cpIndex + 1}`}`,
        sub: `${cpIndex}/${cps.length} · ${lv.doctrine ?? ''}`,
    };
}

function updateObjective() {
    const { main, sub } = getObjectiveText();
    document.getElementById('objText').textContent = main;
    document.getElementById('objSub').textContent = sub;
}

function updateWindDial() {
    const deg = ((windAngle * 180 / Math.PI) + 360) % 360;
    document.getElementById('windVal').textContent = `${Math.round(windStrength * 10)} m/s`;
    const dot = document.getElementById('windDot');
    const r = 18;
    dot.style.left = `${30 + Math.sin(windAngle) * r}px`;
    dot.style.top = `${30 - Math.cos(windAngle) * r}px`;
}

function updateStickHud() {
    const { throttle, yaw, pitch, roll } = lastInputs;
    document.getElementById('dotL').style.left = `${50 + yaw * 36}%`;
    document.getElementById('dotL').style.top = `${50 - throttle * 36}%`;
    document.getElementById('dotR').style.left = `${50 + roll * 36}%`;
    document.getElementById('dotR').style.top = `${50 - pitch * 36}%`;
}

function updateHud() {
    document.getElementById('statTime').textContent = formatTime(elapsed);
    document.getElementById('statSkill').textContent = skill().name;
    const br = BRANCHES[level().branch];
    document.getElementById('statBranch').textContent = br ? `${br.icon} ${br.name}` : '—';
    const total = level().checkpoints.length;
    document.getElementById('statCp').textContent = total ? `${Math.min(cpIndex, total)}/${total}` : '—';
    document.getElementById('altFill').style.height = `${drone.alt * 100}%`;
    document.getElementById('altVal').textContent = `${Math.round(drone.alt * 120)}m`;
    updateObjective();
    updateStickHud();
}

function update(dt) {
    if (!running) return;
    const inp = readInputs();
    if (inp.reset) resetDrone();
    if (consumeKey('h')) toggleHelp();

    updatePropAnimation(dt, (inp.throttle * 0.5 + 0.5));

    if (finished) { updateHud(); return; }

    const s = skill();
    elapsed += dt;
    drone.angle += inp.yaw * s.yawRate * dt;

    const thrust = (inp.throttle * 0.5 + 0.5) * s.thrustPower;
    drone.alt += (thrust - 0.35) * s.altDecay * dt;
    drone.alt = Math.max(0.05, Math.min(1, drone.alt));

    let p = inp.pitch, r = inp.roll;
    if (s.stabilization > 0) { p *= (1 - s.stabilization); r *= (1 - s.stabilization); }
    const mag = Math.hypot(p, r);
    if (mag > s.angleLimit) { const f = s.angleLimit / mag; p *= f; r *= f; }

    const speedMul = 0.4 + drone.alt * 0.9;
    const localFx = -p * s.maxSpeed * speedMul;
    const localRy = r * s.maxSpeed * speedMul;
    const cos = Math.cos(drone.angle), sin = Math.sin(drone.angle);
    drone.vx += (cos * localFx - sin * localRy) * s.accel * dt;
    drone.vy += (sin * localFx + cos * localRy) * s.accel * dt;

    if (windStrength > 0) {
        drone.vx += Math.cos(windAngle) * windStrength * 18 * dt;
        drone.vy += Math.sin(windAngle) * windStrength * 18 * dt;
    }

    drone.vx *= s.drag;
    drone.vy *= s.drag;
    drone.x += drone.vx * dt;
    drone.y += drone.vy * dt;

    const m = ARENA.margin;
    if (drone.x < m) { drone.x = m; drone.vx *= -0.3; }
    if (drone.x > ARENA.w - m) { drone.x = ARENA.w - m; drone.vx *= -0.3; }
    if (drone.y < m) { drone.y = m; drone.vy *= -0.3; }
    if (drone.y > ARENA.h - m) { drone.y = ARENA.h - m; drone.vy *= -0.3; }

    for (const ob of level().obstacles ?? []) {
        if (pointInRect(drone.x, drone.y, ob)) {
            drone.vx *= -0.5; drone.vy *= -0.5;
            pushOutOfRect(drone, ob);
        }
    }

    checkCheckpoints();
    checkLanding(dt);
    checkThreatZones();
    updateHud();
}

function checkThreatZones() {
    inThreatZone = false;
    for (const z of level().threatZones ?? []) {
        if (Math.hypot(drone.x - z.x, drone.y - z.y) < z.r) {
            inThreatZone = true;
            drone.vx *= 0.92;
            drone.vy *= 0.92;
            break;
        }
    }
    threatPulse += 0.05;
}

function pointInRect(x, y, r) {
    return x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
}

function pushOutOfRect(d, r) {
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    if (Math.abs(d.x - cx) / r.w > Math.abs(d.y - cy) / r.h) {
        d.x = d.x < cx ? r.x - 2 : r.x + r.w + 2;
    } else {
        d.y = d.y < cy ? r.y - 2 : r.y + r.h + 2;
    }
}

function checkCheckpoints() {
    const cps = level().checkpoints;
    if (!cps.length || cpIndex >= cps.length) return;
    if (Math.hypot(drone.x - cps[cpIndex].x, drone.y - cps[cpIndex].y) < cps[cpIndex].r) {
        cpIndex++;
        if (cpIndex >= cps.length && !level().landing) finished = true;
    }
}

function checkLanding(dt) {
    const land = level().landing;
    if (!land || cpIndex < level().checkpoints.length) return;
    const dist = Math.hypot(drone.x - land.x, drone.y - land.y);
    if (dist < land.r && Math.hypot(drone.vx, drone.vy) < 40 && drone.alt < 0.35) {
        landTimer += dt;
        if (landTimer >= land.holdSec) finished = true;
    } else {
        landTimer = 0;
    }
}

function formatTime(t) {
    const m = Math.floor(t / 60);
    return `${String(m).padStart(2, '0')}:${(t - m * 60).toFixed(1).padStart(4, '0')}`;
}

function drawArenaBackground() {
    ctx.fillStyle = '#2a2620';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawArenaGround(ctx, arenaRect.x, arenaRect.y, arenaRect.w, arenaRect.h, scale, showMapTiles);

    if (showGrid) {
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= ARENA.w; x += 40) {
            const [sx] = worldToScreen(x, 0);
            ctx.beginPath();
            ctx.moveTo(sx, arenaRect.y);
            ctx.lineTo(sx, arenaRect.y + arenaRect.h);
            ctx.stroke();
        }
        for (let y = 0; y <= ARENA.h; y += 40) {
            const [, sy] = worldToScreen(0, y);
            ctx.beginPath();
            ctx.moveTo(arenaRect.x, sy);
            ctx.lineTo(arenaRect.x + arenaRect.w, sy);
            ctx.stroke();
        }
    }

    // La bàn sân — hướng Đ (đe dọa mô phỏng)
    ctx.fillStyle = 'rgba(220,38,38,0.85)';
    ctx.font = `bold ${11 * scale}px Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↑ Bắc', offsetX + arenaRect.w / 2, arenaRect.y - 8);
    ctx.textAlign = 'left';
    ctx.fillText(`${THREAT_BEARING} →`, offsetX + arenaRect.w - 28, arenaRect.y + arenaRect.h / 2);

    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 4 * scale;
    ctx.strokeRect(
        offsetX + ARENA.margin * scale, offsetY + ARENA.margin * scale,
        (ARENA.w - 2 * ARENA.margin) * scale, (ARENA.h - 2 * ARENA.margin) * scale
    );

    if (showMapTiles && isMapReady()) {
        drawMapAttribution(ctx, arenaRect.x, arenaRect.y, arenaRect.w, scale);
    }
}

function drawSeaZone() {
    const sea = level().seaZone;
    if (!sea) return;
    const [sx, sy] = worldToScreen(sea.x, sea.y);
    ctx.save();
    ctx.fillStyle = 'rgba(14,116,144,0.35)';
    ctx.fillRect(sx, sy, sea.w * scale, sea.h * scale);
    ctx.strokeStyle = 'rgba(56,189,248,0.5)';
    ctx.lineWidth = 2 * scale;
    ctx.setLineDash([10 * scale, 6 * scale]);
    ctx.strokeRect(sx, sy, sea.w * scale, sea.h * scale);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(3,105,161,0.85)';
    ctx.font = `bold ${11 * scale}px Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('≋ BIỂN ≋', sx + sea.w * scale / 2, sy + sea.h * scale / 2);
    ctx.restore();
}

function drawThreatZones() {
    for (const z of level().threatZones ?? []) {
        const [sx, sy] = worldToScreen(z.x, z.y);
        const rs = z.r * scale;
        ctx.save();
        ctx.fillStyle = 'rgba(220,38,38,0.18)';
        ctx.strokeStyle = 'rgba(220,38,38,0.55)';
        ctx.lineWidth = 2 * scale;
        ctx.setLineDash([6 * scale, 4 * scale]);
        ctx.beginPath();
        ctx.arc(sx, sy, rs, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        drawThreatDrone(ctx, sx, sy, scale, Math.sin(threatPulse) * 0.5 + 0.5);
        if (z.label) {
            ctx.fillStyle = 'rgba(220,38,38,0.9)';
            ctx.font = `bold ${10 * scale}px Segoe UI, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(z.label, sx, sy + rs + 12 * scale);
        }
        ctx.restore();
    }
}

function drawProtectZone() {
    const pz = level().protectZone;
    if (!pz) return;
    const [sx, sy] = worldToScreen(pz.x, pz.y);
    ctx.save();
    ctx.fillStyle = 'rgba(37,99,235,0.12)';
    ctx.strokeStyle = 'rgba(37,99,235,0.7)';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.arc(sx, sy, pz.r * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1d4ed8';
    ctx.font = `bold ${12 * scale}px Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pz.label ?? 'MTTQ', sx, sy);
    ctx.restore();
}

function drawAllyPosts() {
    for (const p of level().allyPosts ?? []) {
        const [sx, sy] = worldToScreen(p.x, p.y);
        ctx.save();
        ctx.fillStyle = 'rgba(34,197,94,0.2)';
        ctx.strokeStyle = 'rgba(34,197,94,0.75)';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.arc(sx, sy, 14 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#15803d';
        ctx.font = `bold ${9 * scale}px Segoe UI, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.label, sx, sy + 22 * scale);
        ctx.restore();
    }
}

function drawCourseMarkings() {
    const lv = level();
    const [sx, sy] = worldToScreen(lv.spawn.x, lv.spawn.y);
    drawHelipad(ctx, sx, sy, 38, scale);

    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 6 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    const cps = lv.checkpoints;
    if (showPathGuide && cps.length) {
        for (let i = cpIndex; i < cps.length; i++) {
            const [cx, cy] = worldToScreen(cps[i].x, cps[i].y);
            ctx.lineTo(cx, cy);
        }
    }
    ctx.stroke();

    if (lv.landing) {
        const [lx, ly] = worldToScreen(lv.landing.x, lv.landing.y);
        drawHelipad(ctx, lx, ly, lv.landing.r * 0.85, scale, lv.landing.label?.slice(0, 2) ?? 'H');
    }
}

function drawObstacles() {
    for (const ob of level().obstacles ?? []) {
        const [sx, sy] = worldToScreen(ob.x, ob.y);
        ctx.fillStyle = 'rgba(90,82,70,0.85)';
        ctx.fillRect(sx, sy, ob.w * scale, ob.h * scale);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx, sy, ob.w * scale, ob.h * scale);
    }
}

function drawCheckpoints() {
    level().checkpoints.forEach((cp, i) => {
        const [sx, sy] = worldToScreen(cp.x, cp.y);
        const state = i < cpIndex ? 'done' : i === cpIndex ? 'active' : 'pending';
        drawCheckpointRing(ctx, sx, sy, cp.r, scale, state);
        const lbl = cp.label ?? String(i + 1);
        if (state === 'active' || state === 'done') {
            ctx.fillStyle = state === 'done' ? 'rgba(34,197,94,0.95)' : 'rgba(255,255,255,0.95)';
            ctx.font = `bold ${11 * scale}px Segoe UI, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(lbl, sx, sy);
        }
    });
}

function drawWindVectors() {
    if (windStrength <= 0) return;
    ctx.strokeStyle = 'rgba(59,130,246,0.35)';
    ctx.lineWidth = 1;
    for (let x = 60; x < ARENA.w; x += 80) {
        for (let y = 60; y < ARENA.h; y += 80) {
            const [sx, sy] = worldToScreen(x, y);
            const len = windStrength * 12 * scale;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + Math.cos(windAngle) * len, sy + Math.sin(windAngle) * len);
            ctx.stroke();
        }
    }
}

function resetCanvasState() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.setLineDash([]);
}

function drawDrone() {
    const [sx, sy] = worldToScreen(drone.x, drone.y);
    const throttle = lastInputs.throttle * 0.5 + 0.5;
    const onMap = showMapTiles && isMapReady();

    ctx.save();
    if (onMap) {
        const r = 20 * scale;
        ctx.fillStyle = 'rgba(249,115,22,0.45)';
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 3 * scale;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(drone.angle) * r * 1.4, sy + Math.sin(drone.angle) * r * 1.4);
        ctx.stroke();
    }
    drawDroneTopDown(ctx, sx, sy, drone.angle, scale, drone.alt, throttle, onMap);
    ctx.restore();
    drawCompassRose(ctx, offsetX + 34 * scale, offsetY + 34 * scale, 22 * scale, scale, drone.angle);
}

function drawFinishBanner() {
    if (!finished) return;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(arenaRect.x, arenaRect.y, arenaRect.w, arenaRect.h);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✓ HOÀN THÀNH', canvas.width / 2, canvas.height / 2 - 8);
    ctx.font = '18px monospace';
    ctx.fillText(formatTime(elapsed), canvas.width / 2, canvas.height / 2 + 24);
}

function render() {
    resetCanvasState();
    drawArenaBackground();
    drawSeaZone();
    drawProtectZone();
    drawThreatZones();
    drawAllyPosts();
    drawWindVectors();
    drawCourseMarkings();
    drawObstacles();
    drawCheckpoints();
    drawDrone();
    drawFinishBanner();
    if (running) updateStickHud();
}

let last = performance.now();
function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
}

function buildLevelList() {
    const el = document.getElementById('levelList');
    el.innerHTML = '';
    BRANCH_ORDER.forEach((branchId) => {
        const br = BRANCHES[branchId];
        if (!br || br.hidden) return;
        const levels = LEVELS.map((lv, i) => ({ lv, i })).filter(({ lv }) => lv.branch === branchId && !lv.hidden);
        if (!levels.length) return;
        const hdr = document.createElement('div');
        hdr.className = 'branch-header';
        hdr.style.cssText = `font-size:0.78rem;font-weight:700;color:${br?.color ?? '#374151'};margin:10px 0 2px;padding-left:2px`;
        hdr.textContent = `${br?.icon ?? '•'} ${br?.name ?? branchId}`;
        if (br?.hint) {
            const sub = document.createElement('div');
            sub.style.cssText = 'font-size:0.68rem;font-weight:400;color:#9ca3af;margin:0 0 4px 18px';
            sub.textContent = br.hint;
            el.appendChild(hdr);
            el.appendChild(sub);
        } else {
            el.appendChild(hdr);
        }
        levels.forEach(({ lv, i }) => {
            const label = document.createElement('label');
            label.innerHTML = `<input type="radio" name="level" value="${i}" ${i === 0 ? 'checked' : ''}>
                <span><strong>${lv.name}</strong><br><small>${lv.desc}</small></span>`;
            el.appendChild(label);
        });
    });
}

function buildFeatureList() {
    const el = document.getElementById('featureList');
    if (!el) return;
    el.innerHTML = FEATURES.map(f =>
        `<li><strong>${f.name}</strong> — ${f.desc}</li>`
    ).join('');
}

function showMenu(show) {
    document.getElementById('menuOverlay').classList.toggle('hidden', !show);
    document.getElementById('gameUi').classList.toggle('hidden', show);
    setTouchControlsVisible(!show);
    running = !show;
    if (!show) resetDrone();
}

function toggleHelp() {
    document.getElementById('helpOverlay').classList.toggle('hidden');
}

document.getElementById('skillList').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-skill]');
    if (!btn) return;
    skillId = btn.dataset.skill;
    document.querySelectorAll('#skillList button').forEach(b => b.classList.toggle('active', b === btn));
});

document.getElementById('btnStart').addEventListener('click', () => {
    levelIdx = parseInt(document.querySelector('input[name="level"]:checked')?.value ?? '0', 10);
    showMenu(false);
});

document.getElementById('btnMenu').addEventListener('click', () => showMenu(true));
document.getElementById('btnPower').addEventListener('click', () => showMenu(true));
document.getElementById('btnReset').addEventListener('click', () => resetDrone());
document.getElementById('btnHelp').addEventListener('click', () => toggleHelp());
document.getElementById('btnHelpClose').addEventListener('click', () => toggleHelp());

document.getElementById('btnWind').addEventListener('click', () => {
    const chk = document.getElementById('chkWind');
    chk.checked = !chk.checked;
    chk.dispatchEvent(new Event('change'));
});

document.getElementById('chkPath').addEventListener('change', (e) => { showPathGuide = e.target.checked; });
document.getElementById('chkGrid').addEventListener('change', (e) => { showGrid = e.target.checked; });

function setMapStatus(text) {
    const status = document.getElementById('mapLoadStatus');
    if (status) status.textContent = text;
}

function setMapTiles(on) {
    const chk = document.getElementById('chkMap');
    showMapTiles = on;
    if (!on) {
        setMapStatus('');
        if (chk) chk.disabled = false;
        resetCanvasState();
        return;
    }
    if (isMapReady()) {
        setMapStatus('✓ Vệ tinh');
        return;
    }
    if (mapLoading || isMapLoading()) return;

    mapLoading = true;
    if (chk) chk.disabled = true;
    setMapStatus('⏳ Đang tải…');

    preloadMapTiles().then(() => {
        mapLoading = false;
        if (chk) chk.disabled = false;
        if (!showMapTiles) {
            setMapStatus('');
            return;
        }
        if (isMapReady()) setMapStatus('✓ Vệ tinh');
        else {
            setMapStatus(getMapLoadError() ? '✗ Lỗi — thử lại' : '');
            if (chk) chk.checked = false;
            showMapTiles = false;
        }
    });
}

document.getElementById('chkMap')?.addEventListener('change', (e) => { setMapTiles(e.target.checked); });
document.getElementById('chkWind').addEventListener('change', (e) => {
    if (e.target.checked) { windStrength = 0.4 + Math.random() * 0.5; windAngle = Math.random() * Math.PI * 2; }
    else { windStrength = 0; }
    updateWindDial();
});

document.getElementById('windSlider').addEventListener('input', (e) => {
    windStrength = parseFloat(e.target.value) / 10;
    updateWindDial();
});

buildLevelList();
buildFeatureList();
initTouchControls();
document.getElementById('companyFooter').textContent = COMPANY.name;
document.getElementById('companyMenu').textContent = COMPANY.name;
document.getElementById('companyHud').textContent = COMPANY.short;
requestAnimationFrame(loop);
