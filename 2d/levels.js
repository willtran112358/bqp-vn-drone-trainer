/**
 * Kịch bản huấn luyện UAV — BQP Việt Nam
 * Bám sát tư tưởng: phát hiện sớm · cảnh báo nhanh · trinh sát VLOS · phòng chống UAV bay thấp
 * (Tham chiếu công khai: huấn luyện UAV VN, diễn tập phòng không PK-KQ, phòng chống UAV bầy đàn)
 */

export const ARENA = { w: 800, h: 600, margin: 28 };

/** Hướng đe dọa mô phỏng — phía Đông (tọa độ +X) */
export const THREAT_BEARING = 'Đ';

export const LEVELS = [
    {
        id: 'co-so-vlos',
        name: 'Cơ sở — Làm chủ VLOS',
        desc: 'Huấn luyện ban đầu · ga, xoay hướng, ổn định độ cao',
        doctrine: 'Làm quen phương tiện trước khi vào kịch bản tác chiến',
        spawn: { x: 400, y: 450, angle: -Math.PI / 2 },
        checkpoints: [],
        allyPosts: [{ x: 120, y: 300, label: 'Sân VN' }],
    },
    {
        id: 'trinh-sat-hanh-lang',
        name: 'Trinh sát tình hình · Hành lang biên',
        desc: 'Thu thập ảnh/tín hiệu tại các điểm quan sát — mô phỏng UAV trinh sát VLOS',
        doctrine: 'Phát hiện sớm · ghi nhận tình hình khu vực',
        spawn: { x: 140, y: 300, angle: 0 },
        allyPosts: [
            { x: 100, y: 300, label: '🇻🇳 Căn cứ' },
            { x: 100, y: 480, label: '◆ Hỗ trợ' },
        ],
        threatZones: [
            { x: 680, y: 180, r: 70, label: 'Đe dọa Đ' },
            { x: 720, y: 420, r: 55, label: 'UAV lạ' },
        ],
        checkpoints: [
            { x: 220, y: 300, r: 32, label: 'QS-1' },
            { x: 360, y: 200, r: 30, label: 'QS-2' },
            { x: 480, y: 320, r: 30, label: 'QS-3' },
            { x: 580, y: 240, r: 28, label: 'QS-4' },
        ],
    },
    {
        id: 'phan-ung-uav-thap-dong',
        name: 'Phản ứng UAV bay thấp · Hướng Đông',
        desc: 'Mô phỏng tốp mục tiêu bay thấp từ hướng Đ — bám điểm, báo cáo nhanh (Trung đoàn 280)',
        doctrine: 'Chế áp kịp thời · đánh chặn nhiều lớp',
        spawn: { x: 400, y: 520, angle: -Math.PI / 2 },
        defaultWind: { strength: 0.35, angle: 0 },
        allyPosts: [
            { x: 80, y: 300, label: 'Radar VQ' },
            { x: 400, y: 80, label: 'CHQS' },
        ],
        threatZones: [
            { x: 700, y: 300, r: 85, label: 'Tốp Đ' },
            { x: 620, y: 150, r: 45, label: 'UAV' },
            { x: 650, y: 480, r: 45, label: 'UAV' },
        ],
        checkpoints: [
            { x: 620, y: 300, r: 34, label: 'Mục tiêu 1' },
            { x: 500, y: 220, r: 32, label: 'Mục tiêu 2' },
            { x: 380, y: 300, r: 32, label: 'Xác nhận' },
            { x: 280, y: 380, r: 30, label: 'Báo cáo' },
        ],
    },
    {
        id: 'bao-ve-muc-tieu',
        name: 'Bảo vệ mục tiêu trọng yếu',
        desc: 'Tuần tra vòng ngoài công trình quốc gia · phát hiện sớm trước khi UAV tiếp cận',
        doctrine: 'Bảo vệ mục tiêu trọng yếu là trung tâm',
        spawn: { x: 400, y: 500, angle: -Math.PI / 2 },
        protectZone: { x: 400, y: 280, r: 65, label: 'MTTQ' },
        threatZones: [
            { x: 150, y: 120, r: 50, label: 'Đ' },
            { x: 650, y: 120, r: 50, label: 'Đ' },
            { x: 700, y: 450, r: 55, label: 'Đ' },
        ],
        allyPosts: [
            { x: 400, y: 520, label: '🇻🇳 Gác' },
            { x: 60, y: 500, label: '◆ Yểm trợ' },
        ],
        checkpoints: [
            { x: 400, y: 420, r: 28, label: 'Vòng 1' },
            { x: 520, y: 320, r: 28, label: 'Vòng 2' },
            { x: 400, y: 160, r: 28, label: 'Vòng 3' },
            { x: 260, y: 320, r: 28, label: 'Vòng 4' },
        ],
    },
    {
        id: 'ne-bay-dan-cam-tu',
        name: 'Hành lang né UAV · Kiểu bầy đàn',
        desc: 'Vượt hành lang hẹp · tránh vùng đe dọa (mô phỏng UAV cảm tử / bầy đàn)',
        doctrine: 'Hiệp đồng thống nhất · không lọt vào vùng chết',
        spawn: { x: 400, y: 540, angle: -Math.PI / 2 },
        defaultWind: { strength: 0.25, angle: Math.PI * 0.15 },
        obstacles: [
            { x: 280, y: 180, w: 20, h: 140 },
            { x: 500, y: 180, w: 20, h: 140 },
            { x: 340, y: 400, w: 120, h: 18 },
        ],
        threatZones: [
            { x: 180, y: 250, r: 55, label: '!' },
            { x: 620, y: 250, r: 55, label: '!' },
            { x: 400, y: 120, r: 48, label: '!' },
            { x: 400, y: 480, r: 40, label: '!' },
        ],
        checkpoints: [
            { x: 400, y: 460, r: 30, label: '1' },
            { x: 400, y: 340, r: 28, label: '2' },
            { x: 400, y: 220, r: 28, label: '3' },
            { x: 400, y: 100, r: 32, label: '4' },
        ],
    },
    {
        id: 'so-tan-bai-h',
        name: 'Hạ cánh khu sơ tán · Bãi H',
        desc: 'Hoàn thành trinh sát → hạ cánh an toàn tại khu vực sơ tán (có gió)',
        doctrine: 'Kết thúc nhiệm vụ · giữ ổn định · ga thấp',
        spawn: { x: 400, y: 520, angle: -Math.PI / 2 },
        defaultWind: { strength: 0.45, angle: -Math.PI / 2 },
        allyPosts: [{ x: 680, y: 200, label: '◆ Cover' }],
        threatZones: [{ x: 650, y: 400, r: 60, label: 'Đ' }],
        landing: { x: 400, y: 180, r: 52, holdSec: 2.5, label: 'Sơ tán' },
        checkpoints: [
            { x: 400, y: 460, r: 34, label: 'Rút' },
            { x: 400, y: 340, r: 30, label: 'Hạ dần' },
        ],
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
