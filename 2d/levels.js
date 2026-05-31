/**
 * Kịch bản huấn luyện UAV — BQP Việt Nam
 * Phát triển bởi Công Ty TNHH Công Nghệ Đông A
 */

export const COMPANY = {
    name: 'Công Ty TNHH Công Nghệ Đông A',
    short: 'Đông A Tech',
    tagline: 'Giải pháp mô phỏng huấn luyện UAV',
};

export const ARENA = { w: 800, h: 600, margin: 28 };
export const THREAT_BEARING = 'Đ';

/** Quân chủng / loại hình tác chiến */
export const BRANCHES = {
    'co-so': { name: 'Cơ sở', icon: '🎓', color: '#6b7280' },
    'bo-doi': { name: 'Bộ đội · Trinh sát', icon: '🇻🇳', color: '#15803d' },
    'khong-quan': { name: 'Không quân PK-KQ', icon: '✈️', color: '#1d4ed8' },
    'hai-quan': { name: 'Hải quân', icon: '⚓', color: '#0369a1' },
    'lien-hop': { name: 'Tác chiến liên hợp', icon: '🤝', color: '#7c3aed' },
};

/** Tính năng mô phỏng (hiển thị Guide) */
export const FEATURES = [
    { id: 'vlos', name: 'Bay VLOS', desc: 'Tầm nhìn trực tiếp — không FPV' },
    { id: 'wind', name: 'Mô phỏng gió / ECM', desc: 'Gió và nhiễu môi trường' },
    { id: 'threat', name: 'Vùng đe dọa UAV', desc: 'UAV địch mô phỏng hướng Đ' },
    { id: 'radar', name: 'Hiệp đồng radar VQ', desc: 'Không quân — bám mục tiêu bay thấp' },
    { id: 'naval', name: 'Bảo vệ mục tiêu hải quân', desc: 'Tuần tra vùng ven biển / cảng' },
    { id: 'joint', name: 'Liên hợp đa quân chủng', desc: 'VN + điểm yểm trợ ◆ (Mỹ/Nga mô phỏng)' },
    { id: 'gamepad', name: 'Tay cầm Mode 2', desc: 'Xbox / PS · cần trái-phải chuẩn radio' },
    { id: 'touch', name: 'Cần ảo cảm ứng', desc: 'Mobile / tablet — cần kép trên màn hình' },
];

export const LEVELS = [
    {
        id: 'co-so-vlos',
        branch: 'co-so',
        name: 'Cơ sở — Làm chủ VLOS',
        desc: 'Huấn luyện ban đầu · ga, xoay hướng, ổn định độ cao',
        doctrine: 'Làm quen phương tiện trước khi vào kịch bản tác chiến',
        spawn: { x: 400, y: 450, angle: -Math.PI / 2 },
        checkpoints: [],
        allyPosts: [{ x: 120, y: 300, label: 'Sân VN' }],
    },
    {
        id: 'trinh-sat-hanh-lang',
        branch: 'bo-doi',
        name: 'Trinh sát · Hành lang biên',
        desc: 'UAV trinh sát VLOS — thu thập tại điểm QS',
        doctrine: 'Phát hiện sớm · ghi nhận tình hình khu vực',
        spawn: { x: 140, y: 300, angle: 0 },
        allyPosts: [
            { x: 100, y: 300, label: '🇻🇳 Căn cứ' },
            { x: 100, y: 480, label: '◆ Yểm trợ' },
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
        id: 'bao-ve-muc-tieu',
        branch: 'bo-doi',
        name: 'Bảo vệ mục tiêu trọng yếu',
        desc: 'Tuần tra vòng ngoài MTTQ · phát hiện sớm',
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
        branch: 'bo-doi',
        name: 'Né UAV bầy đàn / cảm tử',
        desc: 'Hành lang hẹp · tránh vùng đe dọa',
        doctrine: 'Hiệp đồng thống nhất · không lọt vùng chết',
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
    // ── Không quân PK-KQ ──
    {
        id: 'pk-kq-vq2-280',
        branch: 'khong-quan',
        name: 'PK-KQ · VQ2 bám mục tiêu hướng Đ',
        desc: 'Mô phỏng Trung đoàn 280: tốp UAV bay thấp từ hướng Đ — UAV trinh sát báo cáo CHQS',
        doctrine: 'Radar VQ2 · chế áp kịp thời · đánh chặn nhiều lớp',
        spawn: { x: 400, y: 520, angle: -Math.PI / 2 },
        defaultWind: { strength: 0.35, angle: 0 },
        allyPosts: [
            { x: 80, y: 300, label: 'VQ2 Radar' },
            { x: 400, y: 70, label: 'CHQS PK-KQ' },
            { x: 120, y: 480, label: 'Pháo 37mm' },
        ],
        threatZones: [
            { x: 700, y: 300, r: 85, label: 'Tốp Đ' },
            { x: 620, y: 150, r: 45, label: 'UAV' },
            { x: 650, y: 480, r: 45, label: 'UAV' },
        ],
        checkpoints: [
            { x: 620, y: 300, r: 34, label: 'VQ-B1' },
            { x: 500, y: 220, r: 32, label: 'VQ-B2' },
            { x: 380, y: 300, r: 32, label: 'Xác nhận' },
            { x: 280, y: 380, r: 30, label: 'Báo CHQS' },
        ],
    },
    {
        id: 'pk-kq-228-pp',
        branch: 'khong-quan',
        name: 'PK-KQ · Trung đoàn 228 luyện bắn',
        desc: 'Phối hợp pháo phòng không — UAV trinh sát chỉ mục tiêu bay thấp cho lớp hỏa lực',
        doctrine: 'Hiệp đồng radar · pháo · UAV trinh sát',
        spawn: { x: 200, y: 480, angle: -Math.PI / 2 },
        defaultWind: { strength: 0.3, angle: 0.2 },
        allyPosts: [
            { x: 180, y: 520, label: 'Tr.228' },
            { x: 400, y: 520, label: 'Đại đội' },
        ],
        obstacles: [
            { x: 350, y: 250, w: 100, h: 18 },
        ],
        threatZones: [
            { x: 680, y: 200, r: 60, label: 'UAV' },
            { x: 720, y: 380, r: 55, label: 'UAV' },
        ],
        checkpoints: [
            { x: 400, y: 420, r: 32, label: 'RS-1' },
            { x: 550, y: 320, r: 30, label: 'RS-2' },
            { x: 650, y: 280, r: 28, label: 'Chỉ mục tiêu' },
            { x: 450, y: 200, r: 30, label: 'Báo bắn' },
        ],
    },
    // ── Hải quân ──
    {
        id: 'hq-bao-ve-cang',
        branch: 'hai-quan',
        name: 'Hải quân · Bảo vệ cảng / tàu chiến',
        desc: 'Tuần tra ven biển — phát hiện UAV tiếp cận từ hướng biển (Đ)',
        doctrine: 'Trinh sát thông báo · bảo vệ mục tiêu ven biển',
        spawn: { x: 200, y: 400, angle: 0 },
        seaZone: { x: 520, y: 0, w: 280, h: 600 },
        protectZone: { x: 280, y: 320, r: 55, label: 'Tàu' },
        allyPosts: [
            { x: 120, y: 480, label: '🇻🇳 HQ' },
            { x: 120, y: 120, label: 'Radar bờ' },
        ],
        threatZones: [
            { x: 650, y: 200, r: 55, label: 'Biển Đ' },
            { x: 700, y: 400, r: 60, label: 'UAV' },
            { x: 580, y: 500, r: 45, label: 'UAV' },
        ],
        checkpoints: [
            { x: 320, y: 200, r: 30, label: 'T-1' },
            { x: 420, y: 280, r: 28, label: 'T-2' },
            { x: 380, y: 420, r: 28, label: 'T-3' },
            { x: 260, y: 480, r: 30, label: 'Báo cáo' },
        ],
    },
    {
        id: 'hq-phong-uav-bien',
        branch: 'hai-quan',
        name: 'Hải quân · Phòng UAV đường không hướng biển',
        desc: 'Mô phỏng QCHQ: trinh sát hướng địch bay vào đánh phá từ biển',
        doctrine: 'Phát hiện sớm · trận địa phòng không ven bờ',
        spawn: { x: 400, y: 500, angle: -Math.PI / 2 },
        seaZone: { x: 600, y: 80, w: 200, h: 520 },
        defaultWind: { strength: 0.4, angle: 0.1 },
        allyPosts: [
            { x: 60, y: 300, label: '⚓ HQ VN' },
            { x: 400, y: 60, label: 'CH vùng' },
        ],
        threatZones: [
            { x: 700, y: 250, r: 70, label: 'Đường biển' },
            { x: 650, y: 450, r: 50, label: 'UAV' },
        ],
        checkpoints: [
            { x: 400, y: 400, r: 32, label: 'P-1' },
            { x: 520, y: 280, r: 30, label: 'P-2' },
            { x: 620, y: 350, r: 28, label: 'Quan sát' },
            { x: 480, y: 180, r: 30, label: 'Cảnh báo' },
        ],
    },
    // ── Tác chiến liên hợp ──
    {
        id: 'lh-yem-tro-us-ru',
        branch: 'lien-hop',
        name: 'Liên hợp · Yểm trợ đa phương (Mỹ/Nga mô phỏng)',
        desc: 'UAV VN trinh sát — phối hợp điểm yểm trợ ◆US ◆RU (huấn luyện liên hợp mô phỏng)',
        doctrine: 'Hiệp đồng thống nhất · chia sẻ tình báo · yểm trợ hỏa lực',
        spawn: { x: 400, y: 520, angle: -Math.PI / 2 },
        allyPosts: [
            { x: 100, y: 300, label: '🇻🇳 CHVN' },
            { x: 100, y: 150, label: '◆ US' },
            { x: 100, y: 450, label: '◆ RU' },
            { x: 400, y: 60, label: 'Trung tâm LH' },
        ],
        threatZones: [
            { x: 680, y: 300, r: 75, label: 'Đ' },
            { x: 620, y: 150, r: 45, label: 'UAV' },
        ],
        checkpoints: [
            { x: 280, y: 400, r: 30, label: 'LH-1' },
            { x: 400, y: 300, r: 30, label: 'LH-2' },
            { x: 520, y: 220, r: 28, label: 'LH-3' },
            { x: 400, y: 140, r: 32, label: 'Báo LH' },
        ],
    },
    {
        id: 'lh-da-quan-chung',
        branch: 'lien-hop',
        name: 'Liên hợp · Phòng UAV tổng hợp 3 quân chủng',
        desc: 'PK-KQ + Hải quân + Bộ đội — UAV trinh sát liên thông tình báo chung',
        doctrine: 'Phòng chống UAV tổng hợp · không riêng lẻ phòng không',
        spawn: { x: 400, y: 540, angle: -Math.PI / 2 },
        defaultWind: { strength: 0.35, angle: 0 },
        seaZone: { x: 620, y: 300, w: 180, h: 300 },
        protectZone: { x: 400, y: 260, r: 50, label: 'MTTQ' },
        allyPosts: [
            { x: 80, y: 200, label: '✈️ PK-KQ' },
            { x: 80, y: 400, label: '⚓ HQ' },
            { x: 400, y: 80, label: '🇻🇳 BTL' },
            { x: 680, y: 520, label: '◆ Ally' },
        ],
        threatZones: [
            { x: 700, y: 180, r: 55, label: 'Đ' },
            { x: 720, y: 380, r: 55, label: 'Đ' },
            { x: 550, y: 450, r: 45, label: 'Biển' },
        ],
        checkpoints: [
            { x: 400, y: 460, r: 30, label: 'TB-1' },
            { x: 300, y: 340, r: 28, label: 'TB-2' },
            { x: 500, y: 260, r: 28, label: 'TB-3' },
            { x: 400, y: 160, r: 30, label: 'Tổng hợp' },
        ],
    },
    {
        id: 'so-tan-bai-h',
        branch: 'bo-doi',
        name: 'Hạ cánh khu sơ tán · Bãi H',
        desc: 'Kết thúc nhiệm vụ — hạ cánh an toàn có gió',
        doctrine: 'Rút lui · giữ ổn định · ga thấp',
        spawn: { x: 400, y: 520, angle: -Math.PI / 2 },
        defaultWind: { strength: 0.45, angle: -Math.PI / 2 },
        allyPosts: [
            { x: 680, y: 200, label: '◆ Cover' },
            { x: 120, y: 200, label: '🇻🇳' },
        ],
        threatZones: [{ x: 650, y: 400, r: 60, label: 'Đ' }],
        landing: { x: 400, y: 180, r: 52, holdSec: 2.5, label: 'H' },
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
