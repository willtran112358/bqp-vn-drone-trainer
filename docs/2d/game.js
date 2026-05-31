import { ARENA, LEVELS, SKILLS } from './levels.js';
import { readInputs, consumeKey, lastInputs } from './input.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let levelIdx = 0;
let skillId = 'co-ban';
let running = false;
let finished = false;
let cpIndex = 0;
let elapsed = 0;
let landTimer = 0;
let tipHidden = false;

const drone = { x: 400, y: 300, angle: 0, vx: 0, vy: 0, alt: 0.5 };
let scale = 1, offsetX = 0, offsetY = 0;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    scale = Math.min(canvas.width / ARENA.w, canvas.height / ARENA.h) * 0.88;
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
    updateObjective();
}

function skill() { return SKILLS[skillId]; }
function level() { return LEVELS[levelIdx]; }

function getObjectiveText() {
    const lv = level();
    const cps = lv.checkpoints;
    if (finished) return { main: '✅ Hoàn thành!', sub: `Thời gian: ${formatTime(elapsed)}` };
    if (!cps.length) return { main: 'Tự do — Làm quen điều khiển', sub: 'Thử W/S ga · A/D xoay · mũi tên di chuyển' };
    if (lv.landing && cpIndex >= cps.length) {
        return {
            main: '🛬 Hạ cánh vào vòng xanh',
            sub: `Giữ yên trong vòng 2 giây · Ga thấp (S) · ${landTimer.toFixed(1)}/2.0s`,
        };
    }
    return {
        main: `Bay qua vòng vàng số ${cpIndex + 1}`,
        sub: `${cpIndex}/${cps.length} checkpoint · Xoay (A/D) hướng mũi về vòng rồi giữ ↑`,
    };
}

function updateObjective() {
    const { main, sub } = getObjectiveText();
    document.getElementById('objText').textContent = main;
    document.getElementById('objSub').textContent = sub;
}

function updateStickHud() {
    const { throttle, yaw, pitch, roll } = lastInputs;
    const dotL = document.getElementById('dotL');
    const dotR = document.getElementById('dotR');
    dotL.style.left = `${50 + yaw * 38}%`;
    dotL.style.top = `${50 - throttle * 38}%`;
    dotR.style.left = `${50 + roll * 38}%`;
    dotR.style.top = `${50 - pitch * 38}%`;
}

function updateHud() {
    const lv = level();
    const total = lv.checkpoints.length;
    document.getElementById('statTime').textContent = formatTime(elapsed);
    document.getElementById('statSkill').textContent = skill().name;

    let cpText = total ? `${Math.min(cpIndex, total)} / ${total}` : 'Tự do';
    document.getElementById('statCp').textContent = cpText;
    document.getElementById('altFill').style.height = `${drone.alt * 100}%`;
    updateObjective();
    updateStickHud();
}

function update(dt) {
    if (!running) return;

    const inp = readInputs();
    if (inp.reset) resetDrone();
    if (consumeKey('h')) toggleHelp();

    if (finished) {
        updateHud();
        return;
    }

    const s = skill();
    elapsed += dt;

    drone.angle += inp.yaw * s.yawRate * dt;
    const thrust = (inp.throttle * 0.5 + 0.5) * s.thrustPower;
    drone.alt += (thrust - 0.35) * s.altDecay * dt;
    drone.alt = Math.max(0.05, Math.min(1, drone.alt));

    let p = inp.pitch, r = inp.roll;
    if (s.stabilization > 0) {
        p *= (1 - s.stabilization);
        r *= (1 - s.stabilization);
    }
    const mag = Math.hypot(p, r);
    if (mag > s.angleLimit) { const f = s.angleLimit / mag; p *= f; r *= f; }

    const speedMul = 0.4 + drone.alt * 0.9;
    const localFx = -p * s.maxSpeed * speedMul;
    const localRy = r * s.maxSpeed * speedMul;
    const cos = Math.cos(drone.angle), sin = Math.sin(drone.angle);
    drone.vx += (cos * localFx - sin * localRy) * s.accel * dt;
    drone.vy += (sin * localFx + cos * localRy) * s.accel * dt;
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
    updateHud();

    if (!tipHidden && elapsed > 10) {
        tipHidden = true;
        const tip = document.getElementById('tipBanner');
        tip.style.opacity = '0';
        setTimeout(() => tip.classList.add('hidden'), 500);
    }
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
        cpIndex++;
        if (cpIndex >= cps.length && !level().landing) finished = true;
    }
}

function checkLanding(dt) {
    const land = level().landing;
    if (!land || cpIndex < level().checkpoints.length) return;
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
    return `${String(m).padStart(2, '0')}:${(t - m * 60).toFixed(1).padStart(4, '0')}`;
}

function drawArena() {
    ctx.fillStyle = '#14532d';
    ctx.fillRect(offsetX - 4, offsetY - 4, ARENA.w * scale + 8, ARENA.h * scale + 8);

    ctx.fillStyle = '#166534';
    ctx.fillRect(offsetX, offsetY, ARENA.w * scale, ARENA.h * scale);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= ARENA.w; x += 50) {
        const [sx] = worldToScreen(x, 0);
        ctx.beginPath(); ctx.moveTo(sx, offsetY); ctx.lineTo(sx, offsetY + ARENA.h * scale); ctx.stroke();
    }
    for (let y = 0; y <= ARENA.h; y += 50) {
        const [, sy] = worldToScreen(0, y);
        ctx.beginPath(); ctx.moveTo(offsetX, sy); ctx.lineTo(offsetX + ARENA.w * scale, sy); ctx.stroke();
    }

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4 * scale;
    ctx.setLineDash([8 * scale, 6 * scale]);
    ctx.strokeRect(
        offsetX + ARENA.margin * scale, offsetY + ARENA.margin * scale,
        (ARENA.w - 2 * ARENA.margin) * scale, (ARENA.h - 2 * ARENA.margin) * scale
    );
    ctx.setLineDash([]);
}

function drawSpawn() {
    const lv = level();
    const [sx, sy] = worldToScreen(lv.spawn.x, lv.spawn.y);
    ctx.fillStyle = 'rgba(59,130,246,0.2)';
    ctx.beginPath();
    ctx.arc(sx, sy, 22 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#93c5fd';
    ctx.font = `bold ${11 * scale}px Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('XUẤT PHÁT', sx, sy - 28 * scale);
}

function drawPathHints() {
    const cps = level().checkpoints;
    if (cps.length < 2) return;
    ctx.strokeStyle = 'rgba(201,162,39,0.35)';
    ctx.lineWidth = 2 * scale;
    ctx.setLineDash([6 * scale, 8 * scale]);
    ctx.beginPath();
    const start = level().spawn;
    ctx.moveTo(...worldToScreen(start.x, start.y));
    for (let i = 0; i < cps.length; i++) {
        if (i < cpIndex) continue;
        ctx.lineTo(...worldToScreen(cps[i].x, cps[i].y));
    }
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawObstacles() {
    for (const ob of level().obstacles ?? []) {
        const [sx, sy] = worldToScreen(ob.x, ob.y);
        ctx.fillStyle = '#334155';
        ctx.fillRect(sx, sy, ob.w * scale, ob.h * scale);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx, sy, ob.w * scale, ob.h * scale);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.font = `${10 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('⚠', sx + ob.w * scale / 2, sy + ob.h * scale / 2 + 4 * scale);
    }
}

function drawCheckpoints() {
    const cps = level().checkpoints;
    cps.forEach((cp, i) => {
        const [sx, sy] = worldToScreen(cp.x, cp.y);
        const r = cp.r * scale;
        const done = i < cpIndex;
        const active = i === cpIndex;

        if (active) {
            ctx.beginPath();
            ctx.arc(sx, sy, r + 8 * scale, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(201,162,39,0.4)';
            ctx.lineWidth = 3 * scale;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = done ? 'rgba(34,197,94,0.2)' : active ? 'rgba(201,162,39,0.25)' : 'rgba(100,116,139,0.15)';
        ctx.fill();
        ctx.strokeStyle = done ? '#22c55e' : active ? '#c9a227' : '#64748b';
        ctx.lineWidth = (active ? 5 : 2) * scale;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = `bold ${14 * scale}px Segoe UI, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), sx, sy);
    });

    const land = level().landing;
    if (land && cpIndex >= cps.length) {
        const [sx, sy] = worldToScreen(land.x, land.y);
        ctx.beginPath();
        ctx.arc(sx, sy, land.r * scale, 0, Math.PI * 2);
        ctx.fillStyle = landTimer > 0 ? 'rgba(34,197,94,0.25)' : 'rgba(59,130,246,0.2)';
        ctx.fill();
        ctx.strokeStyle = landTimer > 0 ? '#22c55e' : '#3b82f6';
        ctx.lineWidth = 4 * scale;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${12 * scale}px Segoe UI, sans-serif`;
        ctx.fillText('ĐÁP', sx, sy);
    }
}

function drawDrone() {
    const [sx, sy] = worldToScreen(drone.x, drone.y);
    const arm = (18 + drone.alt * 8) * scale;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(drone.angle);

    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 12 * drone.alt;

    // velocity trail
    const spd = Math.hypot(drone.vx, drone.vy);
    if (spd > 20) {
        ctx.strokeStyle = `rgba(34,197,94,${Math.min(0.5, spd / 200)})`;
        ctx.lineWidth = 3 * scale;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-drone.vx * 0.08 * scale, -drone.vy * 0.08 * scale);
        ctx.stroke();
    }

    // arms
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 3 * scale;
    for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * arm, Math.sin(a) * arm);
        ctx.stroke();
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * arm, Math.sin(a) * arm, 5 * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    // body
    ctx.fillStyle = '#1a5c2e';
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 8 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // nose arrow (mũi drone)
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(arm * 0.55, 0);
    ctx.lineTo(arm * 0.15, -7 * scale);
    ctx.lineTo(arm * 0.15, 7 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${9 * scale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('MŨI', arm * 0.38, -12 * scale);

    ctx.restore();
}

function drawFinishBanner() {
    if (!finished) return;
    ctx.fillStyle = 'rgba(10,15,26,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 26px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✅ HOÀN THÀNH!', canvas.width / 2, canvas.height / 2 - 12);
    ctx.fillStyle = '#c9a227';
    ctx.font = '20px monospace';
    ctx.fillText(formatTime(elapsed), canvas.width / 2, canvas.height / 2 + 22);
}

function render() {
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawArena();
    drawPathHints();
    drawSpawn();
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
    document.getElementById('gameUi').classList.toggle('hidden', show);
    running = !show;
    if (!show) {
        resetDrone();
        tipHidden = false;
        const tip = document.getElementById('tipBanner');
        tip.classList.remove('hidden');
        tip.style.opacity = '1';
    }
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
