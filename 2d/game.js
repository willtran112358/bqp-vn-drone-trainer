import { ARENA, LEVELS, SKILLS } from './levels.js';
import { readInputs, consumeKey } from './input.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let levelIdx = 0;
let skillId = 'co-ban';
let running = false;
let finished = false;
let cpIndex = 0;
let elapsed = 0;
let landTimer = 0;

const drone = {
    x: 400, y: 300, angle: 0,
    vx: 0, vy: 0,
    alt: 0.5,
};

let scale = 1;
let offsetX = 0;
let offsetY = 0;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    scale = Math.min(canvas.width / ARENA.w, canvas.height / ARENA.h) * 0.95;
    offsetX = (canvas.width - ARENA.w * scale) / 2;
    offsetY = (canvas.height - ARENA.h * scale) / 2;
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
}

function skill() { return SKILLS[skillId]; }
function level() { return LEVELS[levelIdx]; }

function update(dt) {
    if (!running || finished) return;

    const inp = readInputs();
    if (inp.reset) resetDrone();
    if (consumeKey('h')) toggleHelp();

    const s = skill();
    elapsed += dt;

    drone.angle += inp.yaw * s.yawRate * dt;

    const thrust = (inp.throttle * 0.5 + 0.5) * s.thrustPower;
    drone.alt += (thrust - 0.35) * s.altDecay * dt;
    drone.alt = Math.max(0.05, Math.min(1, drone.alt));

    let p = inp.pitch;
    let r = inp.roll;
    if (s.stabilization > 0) {
        p *= (1 - s.stabilization);
        r *= (1 - s.stabilization);
    }
    const mag = Math.hypot(p, r);
    if (mag > s.angleLimit) {
        const f = s.angleLimit / mag;
        p *= f; r *= f;
    }

    const speedMul = 0.4 + drone.alt * 0.9;
    const localFx = -p * s.maxSpeed * speedMul;
    const localRy = r * s.maxSpeed * speedMul;
    const cos = Math.cos(drone.angle);
    const sin = Math.sin(drone.angle);
    const ax = (cos * localFx - sin * localRy) * s.accel * dt;
    const ay = (sin * localFx + cos * localRy) * s.accel * dt;

    drone.vx += ax;
    drone.vy += ay;
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
            drone.vx *= -0.5;
            drone.vy *= -0.5;
            pushOutOfRect(drone, ob);
        }
    }

    checkCheckpoints();
    checkLanding(dt);
    updateHud();
}

function pointInRect(x, y, r) {
    return x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
}

function pushOutOfRect(d, r) {
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
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
    const dist = Math.hypot(drone.x - cp.x, drone.y - cp.y);
    if (dist < cp.r) {
        cpIndex++;
        if (cpIndex >= cps.length && !level().landing) {
            finished = true;
        }
    }
}

function checkLanding(dt) {
    const land = level().landing;
    if (!land) return;
    if (cpIndex < level().checkpoints.length) return;

    const dist = Math.hypot(drone.x - land.x, drone.y - land.y);
    const slow = Math.hypot(drone.vx, drone.vy) < 40;
    if (dist < land.r && slow && drone.alt < 0.35) {
        landTimer += dt;
        if (landTimer >= land.holdSec) finished = true;
    } else {
        landTimer = 0;
    }
}

function formatTime(t) {
    const m = Math.floor(t / 60);
    const s = t - m * 60;
    return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
}

function updateHud() {
    const lv = level();
    const total = lv.checkpoints.length;
    document.getElementById('hudMission').textContent = lv.name;
    document.getElementById('hudSkill').textContent = skill().name;
    document.getElementById('hudTime').textContent = formatTime(elapsed);
    document.getElementById('hudTime').className = finished ? 'ok' : 'gold';

    let cpText = total ? `${Math.min(cpIndex, total)}/${total}` : '—';
    if (lv.landing && cpIndex >= total) {
        cpText += ` · Hạ cánh ${landTimer.toFixed(1)}/${lv.landing.holdSec}s`;
    }
    document.getElementById('hudCp').textContent = cpText;
    document.getElementById('altFill').style.height = `${drone.alt * 100}%`;
}

function drawArena() {
    ctx.fillStyle = '#0c4a2e';
    ctx.fillRect(offsetX, offsetY, ARENA.w * scale, ARENA.h * scale);

    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 3 * scale;
    ctx.strokeRect(offsetX + ARENA.margin * scale, offsetY + ARENA.margin * scale,
        (ARENA.w - 2 * ARENA.margin) * scale, (ARENA.h - 2 * ARENA.margin) * scale);

    ctx.strokeStyle = 'rgba(201,162,39,0.25)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= ARENA.w; x += 50) {
        const [sx] = worldToScreen(x, 0);
        ctx.beginPath();
        ctx.moveTo(sx, offsetY);
        ctx.lineTo(sx, offsetY + ARENA.h * scale);
        ctx.stroke();
    }
    for (let y = 0; y <= ARENA.h; y += 50) {
        const [, sy] = worldToScreen(0, y);
        ctx.beginPath();
        ctx.moveTo(offsetX, sy);
        ctx.lineTo(offsetX + ARENA.w * scale, sy);
        ctx.stroke();
    }
}

function drawObstacles() {
    for (const ob of level().obstacles ?? []) {
        const [sx, sy] = worldToScreen(ob.x, ob.y);
        ctx.fillStyle = '#475569';
        ctx.fillRect(sx, sy, ob.w * scale, ob.h * scale);
        ctx.strokeStyle = '#94a3b8';
        ctx.strokeRect(sx, sy, ob.w * scale, ob.h * scale);
    }
}

function drawCheckpoints() {
    const cps = level().checkpoints;
    cps.forEach((cp, i) => {
        const [sx, sy] = worldToScreen(cp.x, cp.y);
        const r = cp.r * scale;
        const done = i < cpIndex;
        const active = i === cpIndex;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.strokeStyle = done ? '#22c55e' : active ? '#c9a227' : '#64748b';
        ctx.lineWidth = active ? 4 : 2;
        ctx.stroke();
        if (active) {
            ctx.fillStyle = 'rgba(201,162,39,0.15)';
            ctx.fill();
        }
        ctx.fillStyle = '#fff';
        ctx.font = `${12 * scale}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(String(i + 1), sx, sy + 4 * scale);
    });

    const land = level().landing;
    if (land && cpIndex >= cps.length) {
        const [sx, sy] = worldToScreen(land.x, land.y);
        ctx.beginPath();
        ctx.arc(sx, sy, land.r * scale, 0, Math.PI * 2);
        ctx.strokeStyle = landTimer > 0 ? '#22c55e' : '#3b82f6';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(59,130,246,0.12)';
        ctx.fill();
    }
}

function drawDrone() {
    const [sx, sy] = worldToScreen(drone.x, drone.y);
    const size = (14 + drone.alt * 10) * scale;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(drone.angle + Math.PI / 2);

    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 8 * drone.alt;

    ctx.fillStyle = '#1a5c2e';
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.65, size * 0.5);
    ctx.lineTo(0, size * 0.2);
    ctx.lineTo(-size * 0.65, size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -size * 0.3, 3 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawFinishBanner() {
    if (!finished) return;
    ctx.fillStyle = 'rgba(15,23,42,0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 28px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✅ HOÀN THÀNH NHIỆM VỤ!', canvas.width / 2, canvas.height / 2 - 16);
    ctx.fillStyle = '#c9a227';
    ctx.font = '18px monospace';
    ctx.fillText(formatTime(elapsed), canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Segoe UI, sans-serif';
    ctx.fillText('Nhấn R reset · Menu để đổi nhiệm vụ', canvas.width / 2, canvas.height / 2 + 52);
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawArena();
    drawObstacles();
    drawCheckpoints();
    drawDrone();
    drawFinishBanner();
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
    LEVELS.forEach((lv, i) => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="radio" name="level" value="${i}" ${i === 0 ? 'checked' : ''}>
            <span><strong>${lv.name}</strong><br><small style="color:#94a3b8">${lv.desc}</small></span>`;
        el.appendChild(label);
    });
}

function getSelectedLevel() {
    const r = document.querySelector('input[name="level"]:checked');
    return r ? parseInt(r.value, 10) : 0;
}

function showMenu(show) {
    document.getElementById('menuOverlay').classList.toggle('hidden', !show);
    document.getElementById('hud').classList.toggle('hidden', show);
    document.getElementById('bottomBar').classList.toggle('hidden', show);
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
    levelIdx = getSelectedLevel();
    showMenu(false);
});

document.getElementById('btnMenu').addEventListener('click', () => showMenu(true));
document.getElementById('btnReset').addEventListener('click', () => resetDrone());
document.getElementById('btnHelp').addEventListener('click', () => toggleHelp());
document.getElementById('btnHelpClose').addEventListener('click', () => toggleHelp());

buildLevelList();
requestAnimationFrame(loop);
