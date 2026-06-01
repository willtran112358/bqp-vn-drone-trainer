import { touchLeft, touchRight } from './touch-controls.js';



const keys = {};

const pressed = {};

export let lastInputs = { throttle: 0, yaw: 0, pitch: 0, roll: 0 };



window.addEventListener('keydown', (e) => {

    const k = e.key.toLowerCase();

    keys[k] = true;

    if (!e.repeat) pressed[k] = true;

});

window.addEventListener('keyup', (e) => {

    keys[e.key.toLowerCase()] = false;

});



export function consumeKey(k) {

    if (pressed[k]) { pressed[k] = false; return true; }

    return false;

}



export function readInputs() {

    let throttle = 0, yaw = 0, pitch = 0, roll = 0;



    if (keys['w']) throttle += 1;

    if (keys['s']) throttle -= 1;

    if (keys['a']) yaw -= 1;

    if (keys['d']) yaw += 1;

    if (keys['arrowup']) pitch -= 1;

    if (keys['arrowdown']) pitch += 1;

    if (keys['arrowleft']) roll -= 1;

    if (keys['arrowright']) roll += 1;



    const gp = navigator.getGamepads()[0];

    if (gp) {

        const dz = (v) => Math.abs(v) < 0.12 ? 0 : v;

        yaw += dz(gp.axes[0]);

        throttle += dz(-gp.axes[1]);

        roll += dz(gp.axes[2]);

        pitch += dz(gp.axes[3]);

    }



    yaw += touchLeft.x;
    throttle += touchLeft.y;

    if (touchRight.x || touchRight.y) {

        roll += touchRight.x;

        pitch -= touchRight.y;

    }



    const clamp1 = (v) => Math.max(-1, Math.min(1, v));

    lastInputs = {

        throttle: clamp1(throttle),

        yaw: clamp1(yaw),

        pitch: clamp1(pitch),

        roll: clamp1(roll),

        reset: consumeKey('r'),

    };

    return lastInputs;

}

