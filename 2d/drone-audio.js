/** Âm thanh motor drone (Web Audio) — mô phỏng tiếng rè khi bay */

let ctx = null;
let masterGain = null;
let motorGain = null;
let windGain = null;
let oscA = null;
let oscB = null;
let noiseBuf = null;
let noiseSrc = null;
let started = false;
let bodyVolume = 0.55;
let windVolume = 0.35;

function ensureContext() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(ctx.destination);

    motorGain = ctx.createGain();
    motorGain.gain.value = 0;
    motorGain.connect(masterGain);

    windGain = ctx.createGain();
    windGain.gain.value = 0;
    windGain.connect(masterGain);

    oscA = ctx.createOscillator();
    oscA.type = 'sawtooth';
    oscA.frequency.value = 95;
    const filtA = ctx.createBiquadFilter();
    filtA.type = 'lowpass';
    filtA.frequency.value = 280;
    oscA.connect(filtA);
    filtA.connect(motorGain);

    oscB = ctx.createOscillator();
    oscB.type = 'square';
    oscB.frequency.value = 142;
    const filtB = ctx.createBiquadFilter();
    filtB.type = 'lowpass';
    filtB.frequency.value = 420;
    oscB.connect(filtB);
    filtB.connect(motorGain);

    const len = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.35;
    noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    noiseSrc.loop = true;
    const nf = ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = 900;
    nf.Q.value = 0.6;
    noiseSrc.connect(nf);
    nf.connect(motorGain);
    noiseSrc.connect(windGain);

    oscA.start();
    oscB.start();
    noiseSrc.start();
    return ctx;
}

export function resumeAudio() {
    const c = ensureContext();
    if (c?.state === 'suspended') c.resume();
}

export function setBodyVolume(v) {
    bodyVolume = Math.max(0, Math.min(1, v));
}

export function setWindVolume(v) {
    windVolume = Math.max(0, Math.min(1, v));
}

/** @param {number} throttle 0..1 @param {number} windStrength 0..1 @param {boolean} flying */
export function updateDroneAudio(throttle, windStrength, flying) {
    if (!flying) {
        if (motorGain) motorGain.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
        if (windGain) windGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
        started = false;
        return;
    }
    const c = ensureContext();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    started = true;

    const t = Math.max(0.08, throttle);
    const baseHz = 72 + t * 118;
    oscA.frequency.setTargetAtTime(baseHz, c.currentTime, 0.04);
    oscB.frequency.setTargetAtTime(baseHz * 1.48 + 8, c.currentTime, 0.04);

    const motorLevel = (0.04 + t * 0.42) * bodyVolume;
    motorGain.gain.setTargetAtTime(motorLevel, c.currentTime, 0.05);

    const windLevel = windStrength * 0.22 * windVolume;
    windGain.gain.setTargetAtTime(windLevel, c.currentTime, 0.12);
}

export function stopDroneAudio() {
    if (!ctx || !started) return;
    motorGain?.gain.setTargetAtTime(0, ctx.currentTime, 0.06);
    windGain?.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    started = false;
}
