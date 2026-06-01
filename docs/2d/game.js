import { ARENA, LEVELS, SKILLS, THREAT_BEARING, BRANCHES, BRANCH_ORDER, COMPANY, FEATURES } from './levels.js';
import { readInputs, consumeKey, lastInputs } from './input.js';
import { initTouchControls, setTouchControlsVisible } from './touch-controls.js';
import {
    updatePropAnimation, drawDroneTopDown, drawHelipad, drawCheckpointRing, drawThreatDrone,
} from './drone-sprite.js';
import { drawCompassRose, drawArenaGround, drawMapAttribution } from './terrain.js';
import {
    preloadMapTiles, isMapReady, isMapLoading, getMapLoadError, getMapAttribution,
    invalidateMapCache,
} from './map-tiles.js';
import { drawCourseTrack } from './course-geometry.js';
import { drawFlightGuides, drawInputHints } from './flight-guides.js';
import { renderWikiPanel } from './uav-wiki.js';
import { resumeAudio, updateDroneAudio, stopDroneAudio, setBodyVolume, setWindVolume } from './drone-audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const mapCanvas = document.getElementById('mapCanvas');
const mapCtx = mapCanvas.getContext('2d');

let levelIdx = 0;
let skillId = 'co-ban';
let running = false;
let finished = false;
let cpIndex = 0;
let elapsed = 0;
let landTimer = 0;
let landHoldToastShown = false;
let showPathGuide = true;
let showGrid = true;
let showMapTiles = false;
let mapLoading = false;
let windStrength = 0;
let windAngle = 0;
let inThreatZone = false;
let threatPulse = 0;
let menuCanResume = false;
let showGuidePlayer = true;
let showGuideWind = true;
let showInputHints = true;
let soundEnabled = true;
let guidePanelOpen = true;
let pirouetteYawAccum = 0;

/** Độ cao chuẩn hóa 0..1 — 0 = chạm đất */
const GROUND_ALT = 0;
/** alt chuẩn hóa ≤ ngưỡng này = chạm đất, không bay ngang */
const GROUND_EPS = 0.08;

const drone = { x: 400, y: 300, angle: 0, vx: 0, vy: 0, alt: 0.5 };
let prevVx = 0;
let prevVy = 0;
const guideVectors = {
    input: { x: 0, y: 0 },
    orientation: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    wind: { x: 0, y: 0 },
    composite: { x: 0, y: 0 },
};
let scale = 1, offsetX = 0, offsetY = 0;
let arenaRect = { x: 0, y: 0, w: 0, h: 0 };
let prevAlt = 0.35;
const ghostTrail = [];
const GHOST_TRAIL_MAX = 5;

function isMobileLayout() {
    return window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)').matches;
}

function applyGuidePanelUi() {
    document.getElementById('btnGuide')?.classList.toggle('active', isMobileLayout() && guidePanelOpen);
    resize();
}

function toggleGuidePanel() {
    guidePanelOpen = !guidePanelOpen;
    applyGuidePanelUi();
}

function resize() {
    const mobile = isMobileLayout();
    document.body.classList.toggle('mobile-guide-hidden', mobile && !guidePanelOpen);
    document.getElementById('topRight')?.classList.toggle('guide-collapsed', mobile && !guidePanelOpen);
    const sidebar = mobile ? 44 : 52;
    const guideOpen = !mobile || guidePanelOpen;
    const topPad = mobile ? (guideOpen ? 78 : 36) : 8;
    const bottomPad = mobile ? 118 : 8;
    const rightPad = mobile ? 40 : 8;

    const vw = window.visualViewport?.width ?? window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;

    canvas.width = vw;
    canvas.height = vh;
    mapCanvas.width = vw;
    mapCanvas.height = vh;

    const availW = vw - sidebar - rightPad;
    const availH = vh - topPad - bottomPad;
    scale = Math.min(availW / ARENA.w, availH / ARENA.h) * (mobile ? 1.04 : 0.96);
    offsetX = sidebar + Math.max(0, (availW - ARENA.w * scale) / 2);
    offsetY = topPad + Math.max(0, (availH - ARENA.h * scale) / 2);
    arenaRect = { x: offsetX, y: offsetY, w: ARENA.w * scale, h: ARENA.h * scale };
}
window.addEventListener('resize', resize);
window.visualViewport?.addEventListener('resize', resize);
window.visualViewport?.addEventListener('scroll', resize);
resize();

/** Camera theo drone — drone luôn ở giữa vùng sân (giống simulator gốc) */
function worldToScreen(x, y) {
    const cx = offsetX + arenaRect.w / 2;
    const cy = offsetY + arenaRect.h / 2;
    return [cx + (x - drone.x) * scale, cy + (y - drone.y) * scale];
}

function arenaCenterScreen() {
    return [offsetX + arenaRect.w / 2, offsetY + arenaRect.h / 2];
}

function resetDrone() {
    const lv = LEVELS[levelIdx];
    drone.x = lv.spawn.x;
    drone.y = lv.spawn.y;
    drone.angle = lv.spawn.angle;
    drone.vx = drone.vy = 0;
    drone.alt = 0.35;
    cpIndex = 0;
    elapsed = 0;
    finished = false;
    landTimer = 0;
    landHoldToastShown = false;
    pirouetteYawAccum = 0;
    prevVx = prevVy = 0;
    prevAlt = drone.alt;
    ghostTrail.length = 0;
    prevGrounded = false;
    hideActionToast();
    hideGroundNotice();
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
    if (lv.pirouette && !finished) {
        const need = (lv.pirouette.revolutions ?? 1) * Math.PI * 2;
        const prog = Math.min(1, pirouetteYawAccum / need);
        return {
            main: 'Xoay tại chỗ · giữ vị trí',
            sub: `${Math.round(prog * 100)}% · ${lv.doctrine ?? ''}`,
        };
    }
    if (lv.freeFlight) return { main: lv.name, sub: 'Sân tự do · R = reset' };
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
    let subText = sub;
    if (running && !finished && drone.alt <= GROUND_EPS) {
        subText = `⬇ Chạm đất · W/S ga để cất cánh · chưa bay ngang`;
    }
    document.getElementById('objSub').textContent = subText;
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
    const climbEl = document.getElementById('altClimb');
    const descEl = document.getElementById('altDesc');
    if (climbEl && descEl) {
        const th = lastInputs.throttle;
        const altDelta = drone.alt - prevAlt;
        const climbPct = Math.min(100, Math.max(0, th) * 55 + Math.max(0, altDelta) * 420);
        const descPct = Math.min(100, Math.max(0, -th) * 55 + Math.max(0, -altDelta) * 420);
        climbEl.style.height = `${climbPct}%`;
        descEl.style.height = `${descPct}%`;
    }
    updateObjective();
    updateStickHud();
    updateGroundNotice();
    updateFinishOverlay();
}

function updateFinishOverlay() {
    const el = document.getElementById('finishOverlay');
    if (!el) return;
    if (finished) {
        el.classList.remove('hidden');
        const t = document.getElementById('finishTime');
        if (t) t.textContent = formatTime(elapsed);
    } else {
        el.classList.add('hidden');
    }
}

function update(dt) {
    if (!running) return;
    const inp = readInputs();
    if (inp.reset) resetDrone();
    if (consumeKey('h')) toggleHelp();
    if (consumeKey('tab')) {
        showInputHints = !showInputHints;
        const el = document.getElementById('chkInputHints');
        if (el) el.checked = showInputHints;
    }

    const throttleNorm = inp.throttle * 0.5 + 0.5;
    updatePropAnimation(dt, throttleNorm);
    if (soundEnabled && running) {
        updateDroneAudio(throttleNorm, windStrength, true);
    } else {
        stopDroneAudio();
    }

    if (finished) { updateHud(); return; }

    const s = skill();
    elapsed += dt;
    drone.angle += inp.yaw * s.yawRate * dt;

    const hoverThrust = 0.35;
    const thrust = (inp.throttle * 0.5 + 0.5) * s.thrustPower;
    let lift = (thrust - hoverThrust) * s.altDecay;
    if (drone.alt <= GROUND_EPS && lift > 0) lift *= 2.5;
    drone.alt += lift * dt;
    drone.alt = Math.min(1, Math.max(0, drone.alt));
    if (drone.alt <= GROUND_EPS && lift <= 0) drone.alt = GROUND_ALT;

    const airborne = drone.alt > GROUND_EPS;

    let p = inp.pitch;
    let r = inp.roll;
    if (!airborne) {
        p = 0;
        r = 0;
        drone.vx = 0;
        drone.vy = 0;
    } else {
        if (s.stabilization > 0) { p *= (1 - s.stabilization); r *= (1 - s.stabilization); }
        const mag = Math.hypot(p, r);
        if (mag > s.angleLimit) { const f = s.angleLimit / mag; p *= f; r *= f; }

        const speedMul = 0.3 + drone.alt * 0.55;
        const localFx = -p * s.maxSpeed * speedMul;
        const localRy = r * s.maxSpeed * speedMul;
        const cos = Math.cos(drone.angle);
        const sin = Math.sin(drone.angle);
        drone.vx += (cos * localFx - sin * localRy) * s.accel * dt;
        drone.vy += (sin * localFx + cos * localRy) * s.accel * dt;

        if (windStrength > 0) {
            drone.vx += Math.cos(windAngle) * windStrength * 18 * dt;
            drone.vy += Math.sin(windAngle) * windStrength * 18 * dt;
        }
    }

    const ax = (drone.vx - prevVx) / Math.max(dt, 0.001);
    const ay = (drone.vy - prevVy) / Math.max(dt, 0.001);
    prevVx = drone.vx;
    prevVy = drone.vy;

    const drag = s.drag + (1 - s.drag) * drone.alt * 0.06;
    drone.vx *= drag;
    drone.vy *= drag;
    drone.x += drone.vx * dt;
    drone.y += drone.vy * dt;

    if (airborne && (Math.abs(drone.vx) > 8 || Math.abs(drone.vy) > 8)) {
        ghostTrail.push({ x: drone.x, y: drone.y, angle: drone.angle, alt: drone.alt });
        if (ghostTrail.length > GHOST_TRAIL_MAX) ghostTrail.shift();
    }

    updateGuideVectors(inp, p, r, ax, ay, airborne);
    prevAlt = drone.alt;
    checkPirouette(inp, dt);

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

function updateGuideVectors(inp, pitch, roll, ax, ay, airborne) {
    const orientMag = Math.hypot(pitch, roll);
    const inpMag = Math.hypot(inp.pitch, inp.roll) + Math.abs(inp.throttle) * 0.35 + Math.abs(inp.yaw) * 0.25;
    const headX = Math.cos(drone.angle);
    const headY = Math.sin(drone.angle);

    guideVectors.input.x = headX * (-inp.pitch) + (-Math.sin(drone.angle)) * inp.roll;
    guideVectors.input.y = headY * (-inp.pitch) + Math.cos(drone.angle) * inp.roll;
    if (inpMag < 0.05) {
        guideVectors.input.x = guideVectors.input.y = 0;
    } else {
        const m = Math.hypot(guideVectors.input.x, guideVectors.input.y) || 1;
        const s = inpMag / m;
        guideVectors.input.x *= s;
        guideVectors.input.y *= s;
    }

    let ox = headX * (-pitch) + (-Math.sin(drone.angle)) * roll;
    let oy = headY * (-pitch) + Math.cos(drone.angle) * roll;
    const spd = Math.hypot(drone.vx, drone.vy);
    if (airborne && spd > 25) {
        const blend = Math.min(0.45, spd / 200);
        ox = ox * (1 - blend) + (drone.vx / spd) * blend;
        oy = oy * (1 - blend) + (drone.vy / spd) * blend;
    }
    guideVectors.orientation.x = ox;
    guideVectors.orientation.y = oy;
    if (orientMag < 0.02 && spd < 25) {
        guideVectors.orientation.x = guideVectors.orientation.y = 0;
    }

    guideVectors.acceleration.x = ax * 0.02;
    guideVectors.acceleration.y = ay * 0.02;
    guideVectors.wind.x = windStrength > 0 ? Math.cos(windAngle) * windStrength : 0;
    guideVectors.wind.y = windStrength > 0 ? Math.sin(windAngle) * windStrength : 0;
    guideVectors.composite.x = drone.vx * 0.015;
    guideVectors.composite.y = drone.vy * 0.015;
}

function checkPirouette(inp, dt) {
    const p = level().pirouette;
    if (!p || finished) return;
    const dist = Math.hypot(drone.x - p.x, drone.y - p.y);
    if (dist > p.r) {
        drone.vx *= 0.9;
        drone.vy *= 0.9;
        pushOutOfCircle(drone, p.x, p.y, p.r);
    }
    pirouetteYawAccum += Math.abs(inp.yaw) * skill().yawRate * dt;
    const need = (p.revolutions ?? 1) * Math.PI * 2;
    if (pirouetteYawAccum >= need) {
        showActionToast('✓ Hoàn thành xoay tại chỗ', 2200);
        finished = true;
    }
}

function pushOutOfCircle(d, cx, cy, r) {
    const dx = d.x - cx;
    const dy = d.y - cy;
    const dist = Math.hypot(dx, dy) || 1;
    d.x = cx + (dx / dist) * (r - 2);
    d.y = cy + (dy / dist) * (r - 2);
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
    const cp = cps[cpIndex];
    if (Math.hypot(drone.x - cp.x, drone.y - cp.y) < cp.r) {
        const isLast = cpIndex + 1 >= cps.length;
        const hasLanding = !!level().landing;
        showActionToast(checkpointPassMessage(cp, isLast, hasLanding));
        cpIndex++;
        if (cpIndex >= cps.length && !hasLanding) finished = true;
    }
}

function checkLanding(dt) {
    const land = level().landing;
    if (!land || cpIndex < level().checkpoints.length) return;
    if (isLandingHoldOk(land)) {
        if (!landHoldToastShown) {
            showActionToast(landingHoldMessage(land), 3200);
            landHoldToastShown = true;
        }
        landTimer += dt;
        if (landTimer >= land.holdSec) {
            showActionToast('✓ Hạ cánh an toàn · hoàn thành nhiệm vụ', 2200);
            finished = true;
        }
    } else {
        landTimer = 0;
        landHoldToastShown = false;
    }
}

function formatTime(t) {
    const m = Math.floor(t / 60);
    return `${String(m).padStart(2, '0')}:${(t - m * 60).toFixed(1).padStart(4, '0')}`;
}

let toastTimer = null;
let prevGrounded = false;
let groundNoticeHideTimer = null;

function hideGroundNotice() {
    const el = document.getElementById('groundNotice');
    if (!el) return;
    el.classList.remove('show', 'just-landed');
    if (groundNoticeHideTimer) {
        clearTimeout(groundNoticeHideTimer);
        groundNoticeHideTimer = null;
    }
    groundNoticeHideTimer = setTimeout(() => {
        if (!el.classList.contains('show')) el.classList.add('hidden');
        groundNoticeHideTimer = null;
    }, 280);
}

/** Banner cảnh báo khi drone chạm đất — nhắc tăng ga để cất cánh */
function updateGroundNotice() {
    const el = document.getElementById('groundNotice');
    if (!el) return;
    if (!running || finished) {
        prevGrounded = false;
        hideGroundNotice();
        return;
    }
    const grounded = drone.alt <= GROUND_EPS;
    if (grounded && !prevGrounded) {
        el.classList.remove('hidden');
        el.classList.add('just-landed');
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => el.classList.remove('just-landed'), 700);
        if (groundNoticeHideTimer) {
            clearTimeout(groundNoticeHideTimer);
            groundNoticeHideTimer = null;
        }
    } else if (grounded) {
        el.classList.remove('hidden');
        if (!el.classList.contains('show')) requestAnimationFrame(() => el.classList.add('show'));
        if (groundNoticeHideTimer) {
            clearTimeout(groundNoticeHideTimer);
            groundNoticeHideTimer = null;
        }
    } else if (prevGrounded) {
        hideGroundNotice();
    }
    prevGrounded = grounded;
}

function hideActionToast() {
    const el = document.getElementById('actionToast');
    if (!el) return;
    el.classList.remove('show');
    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }
    setTimeout(() => { el.classList.add('hidden'); }, 260);
}

/** Popup nhỏ khi học viên làm đúng thao tác */
function showActionToast(text, duration = 2800) {
    const el = document.getElementById('actionToast');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('hidden');
    requestAnimationFrame(() => el.classList.add('show'));
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(hideActionToast, duration);
}

function isLandingHoldOk(land) {
    const dist = Math.hypot(drone.x - land.x, drone.y - land.y);
    const speed = Math.hypot(drone.vx, drone.vy);
    const altMax = land.altMax ?? 0.35;
    const speedMax = land.speedMax ?? 40;
    return dist < land.r && speed < speedMax && drone.alt < altMax;
}

function landingHoldMessage(land) {
    const label = land.label ?? 'Bãi H';
    return `✓ Đúng thao tác · ${label} · giữ ga thấp ${land.holdSec}s`;
}

function checkpointPassMessage(cp, isLast, hasLanding) {
    const label = cp.label ?? 'điểm';
    if (isLast && !hasLanding) return `✓ Đúng thao tác · hoàn thành lộ trình`;
    if (isLast && hasLanding) return `✓ Đúng thao tác · ${label} · tiếp tục hạ cánh`;
    return `✓ Đúng thao tác · qua ${label}`;
}

function drawArenaBackground() {
    const mapActive = showMapTiles && isMapReady();

    if (mapActive) {
        mapCanvas.style.visibility = 'visible';
        mapCtx.setTransform(1, 0, 0, 1, 0, 0);
        mapCtx.fillStyle = '#2a2620';
        mapCtx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
        drawArenaGround(mapCtx, arenaRect.x, arenaRect.y, arenaRect.w, arenaRect.h, scale, true);
        drawMapAttribution(mapCtx, arenaRect.x, arenaRect.y, arenaRect.w, scale);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
        mapCanvas.style.visibility = 'hidden';
        ctx.fillStyle = '#2a2620';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawArenaGround(ctx, arenaRect.x, arenaRect.y, arenaRect.w, arenaRect.h, scale, false);
    }

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
    ctx.fillText(pz.label ?? 'Khu BV', sx, sy);
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

function drawGhostTrail() {
    if (!ghostTrail.length) return;
    for (let i = 0; i < ghostTrail.length; i++) {
        const g = ghostTrail[i];
        const [gx, gy] = worldToScreen(g.x, g.y);
        const alpha = 0.08 + (i / ghostTrail.length) * 0.12;
        ctx.save();
        ctx.globalAlpha = alpha;
        drawDroneTopDown(ctx, gx, gy, g.angle, scale * 0.92, g.alt, 0.3, false);
        ctx.restore();
    }
}

function drawCenterCrosshair() {
    const [cx, cy] = arenaCenterScreen();
    const r = 5 * scale;
    ctx.save();
    ctx.strokeStyle = 'rgba(220,38,38,0.85)';
    ctx.lineWidth = Math.max(1.2, 1.5 * scale);
    ctx.beginPath();
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.stroke();
    ctx.restore();
}

function drawDroneGuides() {
    const [sx, sy] = worldToScreen(drone.x, drone.y);
    drawFlightGuides(ctx, sx, sy, scale, guideVectors, {
        player: showGuidePlayer,
        wind: showGuideWind,
    }, drone.angle, drone.alt);
    const anyInput = Math.abs(lastInputs.throttle) + Math.abs(lastInputs.yaw)
        + Math.abs(lastInputs.pitch) + Math.abs(lastInputs.roll) > 0.12;
    if (showInputHints && anyInput) {
        drawInputHints(ctx, sx, sy, scale, lastInputs, true);
    }
}

function drawDrone() {
    const [sx, sy] = worldToScreen(drone.x, drone.y);
    const throttle = lastInputs.throttle * 0.5 + 0.5;
    const onMap = showMapTiles && isMapReady();

    ctx.save();
    if (onMap) {
        const halo = 26 * scale;
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.lineWidth = 3.5 * scale;
        ctx.fillStyle = 'rgba(37,99,235,0.25)';
        ctx.beginPath();
        ctx.arc(sx, sy, halo, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    drawDroneTopDown(ctx, sx, sy, drone.angle, scale, drone.alt, throttle, false);
    ctx.restore();
    drawCompassRose(ctx, offsetX + 34 * scale, offsetY + 34 * scale, 22 * scale, scale, drone.angle);
}

function drawFinishBanner() {
    /* Hoàn thành hiển thị qua #finishOverlay (HTML) */
}

function toggleHelp() {
    document.getElementById('helpOverlay').classList.toggle('hidden');
}

let wikiCategory = 'all';

function mountWikiPanel() {
    const root = document.getElementById('wikiPanelRoot');
    if (!root) return;
    root.innerHTML = renderWikiPanel(wikiCategory);
    root.querySelectorAll('.wiki-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            wikiCategory = btn.dataset.wikiCat ?? 'all';
            mountWikiPanel();
        });
    });
}

function toggleWiki(force) {
    const el = document.getElementById('wikiOverlay');
    if (!el) return;
    let open;
    if (force === true) open = true;
    else if (force === false) open = false;
    else open = el.classList.contains('hidden');
    if (open) {
        mountWikiPanel();
        el.classList.remove('hidden');
        document.getElementById('helpOverlay')?.classList.add('hidden');
    } else {
        el.classList.add('hidden');
    }
}

function render() {
    try {
        resetCanvasState();
        drawArenaBackground();
    drawSeaZone();
    drawProtectZone();
    drawThreatZones();
    drawAllyPosts();
    drawWindVectors();
    drawCourseMarkings();
    drawCourseTrack(ctx, level(), scale, worldToScreen);
    drawObstacles();
    drawCheckpoints();
    drawGhostTrail();
    drawDrone();
    drawDroneGuides();
    drawCenterCrosshair();
    drawFinishBanner();
    if (running) updateStickHud();
    } catch (err) {
        console.error('render', err);
        resetCanvasState();
    }
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
        `<article class="feature-card${f.id === 'wiki' ? ' feature-card--wiki' : ''}"${f.id === 'wiki' ? ' role="button" tabindex="0" title="Mở thư viện UAV"' : ''}>
            <div class="feature-thumb feature-thumb--${f.id}" aria-hidden="true"></div>
            <div class="feature-body">
                <strong>${f.name}</strong>
                <span>${f.desc}</span>
            </div>
        </article>`
    ).join('');
    el.querySelector('.feature-card--wiki')?.addEventListener('click', () => toggleWiki(true));
}

function startSelectedLevel() {
    levelIdx = parseInt(document.querySelector('input[name="level"]:checked')?.value ?? '0', 10);
    showMenu(false);
}

function updateMenuResumeUi() {
    const showResume = menuCanResume;
    const mobile = isMobileLayout();
    const btnClose = document.getElementById('btnMenuClose');
    btnClose?.classList.toggle('hidden', !showResume && !mobile);
    btnClose?.setAttribute('title', showResume ? 'Tiếp tục bay' : 'Bắt đầu bay');
    btnClose?.setAttribute('aria-label', showResume ? 'Tiếp tục bay' : 'Bắt đầu bay');
    document.getElementById('btnMenuResume')?.classList.toggle('hidden', !showResume);
}

function onMenuCloseClick() {
    if (menuCanResume) resumeFromMenu();
    else if (isMobileLayout()) startSelectedLevel();
}

function showMenu(show, opts = {}) {
    const wikiFab = document.getElementById('wikiFab');
    if (show) {
        document.getElementById('menuOverlay').classList.remove('hidden');
        document.getElementById('gameUi').classList.add('hidden');
        wikiFab?.classList.add('hidden');
        setTouchControlsVisible(false);
        running = false;
        stopDroneAudio();
        updateMenuResumeUi();
        return;
    }

    document.getElementById('menuOverlay').classList.add('hidden');
    document.getElementById('gameUi').classList.remove('hidden');
    wikiFab?.classList.toggle('hidden', !isMobileLayout());
    setTouchControlsVisible(true);
    running = true;
    if (soundEnabled) resumeAudio();
    menuCanResume = false;
    updateMenuResumeUi();
    if (!opts.resume) {
        resetDrone();
        if (isMobileLayout()) guidePanelOpen = false;
    }
    applyGuidePanelUi();
}

function pauseToMenu() {
    const menuHidden = document.getElementById('menuOverlay').classList.contains('hidden');
    const gameVisible = !document.getElementById('gameUi').classList.contains('hidden');
    menuCanResume = menuHidden && gameVisible && running;
    showMenu(true);
}

function resumeFromMenu() {
    if (!menuCanResume) return;
    showMenu(false, { resume: true });
}

function exitToMainMenu() {
    document.getElementById('helpOverlay')?.classList.add('hidden');
    hideActionToast();
    menuCanResume = false;
    showMenu(true);
}

document.getElementById('skillList').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-skill]');
    if (!btn) return;
    skillId = btn.dataset.skill;
    document.querySelectorAll('#skillList button').forEach(b => b.classList.toggle('active', b === btn));
});

document.getElementById('btnStart').addEventListener('click', () => startSelectedLevel());

document.getElementById('btnMenu').addEventListener('click', () => pauseToMenu());
document.getElementById('btnMenuClose')?.addEventListener('click', () => onMenuCloseClick());
document.getElementById('btnMenuResume')?.addEventListener('click', () => resumeFromMenu());
document.getElementById('btnPower').addEventListener('click', () => exitToMainMenu());
document.getElementById('objExit')?.addEventListener('click', () => exitToMainMenu());
document.getElementById('btnFinishMenu')?.addEventListener('click', () => exitToMainMenu());
document.getElementById('btnFinishClose')?.addEventListener('click', () => exitToMainMenu());
document.getElementById('btnFinishRetry')?.addEventListener('click', () => resetDrone());
document.getElementById('btnReset').addEventListener('click', () => resetDrone());
document.getElementById('btnGuide')?.addEventListener('click', () => toggleGuidePanel());
document.getElementById('btnHelp').addEventListener('click', () => toggleHelp());
document.getElementById('btnHelpClose').addEventListener('click', () => toggleHelp());
document.getElementById('btnHelpX')?.addEventListener('click', () => toggleHelp());
document.getElementById('btnWiki')?.addEventListener('click', () => toggleWiki(true));
document.getElementById('btnMenuWiki')?.addEventListener('click', () => toggleWiki(true));
document.getElementById('wikiFab')?.addEventListener('click', () => toggleWiki(true));
document.getElementById('btnWikiX')?.addEventListener('click', () => toggleWiki(false));

document.getElementById('btnWind').addEventListener('click', () => {
    const chk = document.getElementById('chkWind');
    chk.checked = !chk.checked;
    chk.dispatchEvent(new Event('change'));
});

document.getElementById('chkPath').addEventListener('change', (e) => { showPathGuide = e.target.checked; });
document.getElementById('chkGrid').addEventListener('change', (e) => { showGrid = e.target.checked; });
document.getElementById('chkGuidePlayer')?.addEventListener('change', (e) => { showGuidePlayer = e.target.checked; });
document.getElementById('chkGuideWind')?.addEventListener('change', (e) => { showGuideWind = e.target.checked; });
document.getElementById('chkInputHints')?.addEventListener('change', (e) => { showInputHints = e.target.checked; });
document.getElementById('chkSound')?.addEventListener('change', (e) => {
    soundEnabled = e.target.checked;
    if (!soundEnabled) stopDroneAudio();
    else if (running) resumeAudio();
});
document.getElementById('bodyVolSlider')?.addEventListener('input', (e) => {
    setBodyVolume(parseFloat(e.target.value) / 100);
    const n = document.getElementById('bodyVolVal');
    if (n) n.textContent = (parseFloat(e.target.value) / 100).toFixed(2);
});
document.getElementById('windVolSlider')?.addEventListener('input', (e) => {
    setWindVolume(parseFloat(e.target.value) / 100);
    const n = document.getElementById('windVolVal');
    if (n) n.textContent = (parseFloat(e.target.value) / 100).toFixed(2);
});

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
        setMapStatus('✓ Ảnh nền');
        return;
    }
    if (mapLoading || isMapLoading()) return;

    invalidateMapCache();
    mapLoading = true;
    if (chk) chk.disabled = true;
    setMapStatus('⏳ Đang tải…');

    preloadMapTiles()
        .then(() => {
            if (!showMapTiles) {
                setMapStatus('');
                return;
            }
            if (isMapReady()) {
                const label = getMapAttribution().split(' · ')[0];
                setMapStatus(`✓ ${label}`);
            }
            else {
                setMapStatus(getMapLoadError() ? '✗ Lỗi — thử lại' : '');
                if (chk) chk.checked = false;
                showMapTiles = false;
            }
        })
        .catch(() => {
            setMapStatus('✗ Lỗi — thử lại');
            if (chk) { chk.checked = false; }
            showMapTiles = false;
        })
        .finally(() => {
            mapLoading = false;
            if (chk) chk.disabled = false;
            resetCanvasState();
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

setBodyVolume(0.7);
setWindVolume(0.7);
if (isMobileLayout()) guidePanelOpen = false;
buildLevelList();
buildFeatureList();
updateMenuResumeUi();
initTouchControls();
applyGuidePanelUi();
document.getElementById('companyFooter').textContent = COMPANY.name;
document.getElementById('companyMenu').textContent = COMPANY.name;
document.getElementById('companyHud').textContent = COMPANY.short;
requestAnimationFrame(loop);
