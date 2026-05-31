/** Nhiệm vụ huấn luyện 2D — tọa độ trong arena 800×600 logic */

export const ARENA = { w: 800, h: 600, margin: 28 };

export const LEVELS = [
    {
        id: 'tu-do',
        name: 'Sân tập tự do',
        desc: 'Làm quen ga, xoay và di chuyển — không checkpoint',
        checkpoints: [],
        spawn: { x: 400, y: 300, angle: -Math.PI / 2 },
    },
    {
        id: 'co-ban-8',
        name: 'Slalom cơ bản — 4 vòng',
        desc: 'Bay qua 4 checkpoint theo thứ tự',
        checkpoints: [
            { x: 400, y: 120, r: 36 },
            { x: 620, y: 220, r: 36 },
            { x: 400, y: 380, r: 36 },
            { x: 180, y: 220, r: 36 },
        ],
        spawn: { x: 400, y: 480, angle: -Math.PI / 2 },
    },
    {
        id: 'trung-cap-12',
        name: 'Đường hẹp — 8 vòng',
        desc: 'Luyện phản xạ giữa các chướng ngại',
        obstacles: [
            { x: 300, y: 200, w: 24, h: 120 },
            { x: 500, y: 280, w: 24, h: 120 },
            { x: 400, y: 450, w: 160, h: 20 },
        ],
        checkpoints: [
            { x: 400, y: 80, r: 32 },
            { x: 680, y: 150, r: 32 },
            { x: 720, y: 400, r: 32 },
            { x: 500, y: 520, r: 32 },
            { x: 200, y: 480, r: 32 },
            { x: 80, y: 300, r: 32 },
            { x: 200, y: 120, r: 32 },
            { x: 400, y: 300, r: 40 },
        ],
        spawn: { x: 400, y: 540, angle: -Math.PI / 2 },
    },
    {
        id: 'dap-diem',
        name: 'Hạ cánh điểm đích',
        desc: 'Bay vào vùng đáp (vòng xanh) và giữ ổn định 2 giây',
        landing: { x: 400, y: 200, r: 55, holdSec: 2 },
        checkpoints: [
            { x: 400, y: 480, r: 40 },
            { x: 400, y: 340, r: 35 },
        ],
        spawn: { x: 400, y: 520, angle: -Math.PI / 2 },
    },
];

export const SKILLS = {
    'co-ban': {
        name: 'Cơ bản',
        maxSpeed: 140,
        yawRate: 2.2,
        accel: 320,
        drag: 0.92,
        stabilization: 0.35,
        angleLimit: 0.55,
        altDecay: 0.3,
        thrustPower: 0.55,
    },
    'trung-cap': {
        name: 'Trung cấp',
        maxSpeed: 200,
        yawRate: 3.2,
        accel: 420,
        drag: 0.94,
        stabilization: 0.12,
        angleLimit: 0.85,
        altDecay: 0.45,
        thrustPower: 0.75,
    },
    'nang-cao': {
        name: 'Nâng cao',
        maxSpeed: 280,
        yawRate: 4.5,
        accel: 550,
        drag: 0.96,
        stabilization: 0,
        angleLimit: 1.2,
        altDecay: 0.6,
        thrustPower: 1.0,
    },
};
