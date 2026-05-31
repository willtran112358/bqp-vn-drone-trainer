/** Cần ảo kép Mode 2 — mobile / tablet (pointer events) */

export const touchLeft = { x: 0, y: 0 };
export const touchRight = { x: 0, y: 0 };

export function isTouchDevice() {
    return matchMedia('(hover: none) and (pointer: coarse)').matches
        || matchMedia('(max-width: 768px)').matches
        || navigator.maxTouchPoints > 0;
}

function bindStick(zone, knob, store) {
    let pid = null;

    const radius = () => Math.min(zone.clientWidth, zone.clientHeight) * 0.38;

    const setKnob = (dx, dy) => {
        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    };

    const reset = () => {
        store.x = 0;
        store.y = 0;
        setKnob(0, 0);
        pid = null;
    };

    const apply = (clientX, clientY) => {
        const rect = zone.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = clientX - cx;
        let dy = clientY - cy;
        const r = radius();
        const dist = Math.hypot(dx, dy);
        if (dist > r) {
            dx = (dx / dist) * r;
            dy = (dy / dist) * r;
        }
        store.x = dx / r;
        store.y = -dy / r;
        setKnob(dx, dy);
    };

    zone.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        pid = e.pointerId;
        zone.setPointerCapture(e.pointerId);
        apply(e.clientX, e.clientY);
    });

    zone.addEventListener('pointermove', (e) => {
        if (e.pointerId !== pid) return;
        e.preventDefault();
        apply(e.clientX, e.clientY);
    });

    const end = (e) => {
        if (e.pointerId !== pid) return;
        reset();
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
    zone.addEventListener('lostpointercapture', () => { if (pid !== null) reset(); });
}

export function initTouchControls() {
    const left = document.getElementById('touchLeft');
    const right = document.getElementById('touchRight');
    if (!left || !right) return;
    bindStick(left, document.getElementById('knobLeft'), touchLeft);
    bindStick(right, document.getElementById('knobRight'), touchRight);
}

export function setTouchControlsVisible(visible) {
    const el = document.getElementById('touchControls');
    if (!el) return;
    el.classList.toggle('active', visible && isTouchDevice());
}
