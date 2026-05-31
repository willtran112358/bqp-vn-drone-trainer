/**
 * Kịch bản huấn luyện UAV tác chiến — BQP Việt Nam
 * Phát triển bởi Công Ty TNHH Công Nghệ Đông A
 */

export const COMPANY = {
    name: 'Công Ty TNHH Công Nghệ Đông A',
    short: 'Đông A Tech',
    tagline: 'Mô phỏng huấn luyện UAV tác chiến',
};

export const ARENA = { w: 800, h: 600, margin: 28 };
export const THREAT_BEARING = 'Đ';

export const BRANCHES = {
    'co-so': { name: 'Cơ sở HL', icon: '🎓', color: '#6b7280', hint: 'Làm quen VLOS trước tác chiến' },
    'bien-phong': { name: 'Biên phòng QB', icon: '🛡️', color: '#15803d', hint: 'Tuần biên · UAV xâm nhập' },
    'pk-kq': { name: 'PK-KQ QA', icon: '✈️', color: '#1d4ed8', hint: 'Chống UAV bay thấp' },
    'hai-quan': { name: 'HQ · CSB', icon: '⚓', color: '#0369a1', hint: 'Ven biển · cảng · CSB' },
    'quan-khu': { name: 'Quân khu', icon: '🗺️', color: '#b45309', hint: 'QK4 KD · QK5 KV · KT Thủ đô' },
    'lien-hop': { name: 'Liên hợp', icon: '🤝', color: '#7c3aed', hint: '', hidden: true },
};

/** Nhóm hiển thị menu (ẩn liên hợp nước ngoài) */
export const BRANCH_ORDER = ['co-so', 'bien-phong', 'pk-kq', 'hai-quan', 'quan-khu'];

export const FEATURES = [
    { id: 'vlos', name: 'Bay VLOS tác chiến', desc: 'Huấn luyện tầm nhìn trực tiếp — không FPV' },
    { id: 'wind', name: 'Gió / ECM', desc: 'Môi trường nhiễu · gió cản trở' },
    { id: 'threat', name: 'UAV địch m/ph', desc: 'Vùng đỏ hướng Đông — mô phỏng xâm nhập' },
    { id: 'radar', name: 'Hiệp đồng PK-KQ', desc: 'Radar VQ · UAV chỉ mục tiêu cho hỏa lực' },
    { id: 'naval', name: 'Tác chiến ven biển', desc: 'HQ/CSB · bảo vệ cảng–tàu' },
    { id: 'gamepad', name: 'Tay cầm Mode 2', desc: 'Xbox / PS' },
    { id: 'touch', name: 'Cần ảo mobile', desc: 'Tablet · điện thoại' },
];

export const LEVELS = [
    {
        id: 'co-so-vlos',
        branch: 'co-so',
        name: 'VLOS · Làm chủ phương tiện',
        desc: 'Ga · xoay · ổn định — trước kịch bản tác chiến',
        doctrine: 'HL cơ sở · đọc mũi drone · la bàn sân',
        spawn: { x: 400, y: 450, angle: -Math.PI / 2 },
        checkpoints: [],
        allyPosts: [{ x: 120, y: 300, label: 'Sân HL' }],
    },
    {
        id: 'so-tan-bai-h',
        branch: 'co-so',
        name: 'Hạ cánh · Bãi H',
        desc: 'Rút lui · hạ cánh an toàn có gió',
        doctrine: 'Kết thúc nhiệm vụ · ga thấp',
        spawn: { x: 400, y: 520, angle: -Math.PI / 2 },
        defaultWind: { strength: 0.45, angle: -Math.PI / 2 },
        allyPosts: [{ x: 120, y: 200, label: '🇻🇳' }],
        threatZones: [{ x: 650, y: 400, r: 55, label: 'm/ph' }],
        landing: { x: 400, y: 180, r: 52, holdSec: 2.5, label: 'H' },
        checkpoints: [
            { x: 400, y: 460, r: 34, label: 'Rút' },
            { x: 400, y: 340, r: 30, label: 'Hạ' },
        ],
    },
    {
        id: 'qb-tuan-bien',
        branch: 'bien-phong',
        name: 'QB · Tuần tra hành lang biên',
        desc: 'UAV VLOS dọc tuyến biên — QS · báo CHQB',
        doctrine: 'Phát hiện sớm · tuần tra tuyến',
        spawn: { x: 140, y: 300, angle: 0 },
        allyPosts: [{ x: 100, y: 300, label: '🇻🇳 CHQB' }],
        threatZones: [
            { x: 680, y: 180, r: 70, label: 'm/ph' },
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
        id: 'qb-uav-xam-nhap',
        branch: 'bien-phong',
        name: 'QB · UAV xâm nhập biên',
        desc: 'Hành lang hẹp · né UAV m/ph từ hướng Đông',
        doctrine: 'Không lọt vùng chết · báo nhanh',
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
        id: 'qa-vq2-280',
        branch: 'pk-kq',
        name: 'QA · VQ2 bám mục tiêu phía Đông',
        desc: 'Tốp UAV bay thấp m/ph · báo CHQA',
        doctrine: 'Radar VQ · chế áp nhiều lớp',
        spawn: { x: 400, y: 520, angle: -Math.PI / 2 },
        defaultWind: { strength: 0.35, angle: 0 },
        allyPosts: [
            { x: 80, y: 300, label: 'VQ2' },
            { x: 400, y: 70, label: 'CHQA' },
            { x: 120, y: 480, label: 'Pháo 37' },
        ],
        threatZones: [
            { x: 700, y: 300, r: 85, label: 'Tốp' },
            { x: 620, y: 150, r: 45, label: 'UAV' },
            { x: 650, y: 480, r: 45, label: 'UAV' },
        ],
        checkpoints: [
            { x: 620, y: 300, r: 34, label: 'B1' },
            { x: 500, y: 220, r: 32, label: 'B2' },
            { x: 380, y: 300, r: 32, label: 'Xác nhận' },
            { x: 280, y: 380, r: 30, label: 'Báo' },
        ],
    },
    {
        id: 'qa-tr228',
        branch: 'pk-kq',
        name: 'QA · Tr.228 hiệp đồng bắn',
        desc: 'UAV chỉ mục tiêu cho pháo PK',
        doctrine: 'Radar · pháo · UAV trinh sát',
        spawn: { x: 200, y: 480, angle: -Math.PI / 2 },
        defaultWind: { strength: 0.3, angle: 0.2 },
        allyPosts: [
            { x: 180, y: 520, label: 'Tr.228' },
            { x: 400, y: 520, label: 'Đại đội' },
        ],
        obstacles: [{ x: 350, y: 250, w: 100, h: 18 }],
        threatZones: [
            { x: 680, y: 200, r: 60, label: 'UAV' },
            { x: 720, y: 380, r: 55, label: 'UAV' },
        ],
        checkpoints: [
            { x: 400, y: 420, r: 32, label: 'RS-1' },
            { x: 550, y: 320, r: 30, label: 'RS-2' },
            { x: 650, y: 280, r: 28, label: 'Chỉ tiêu' },
            { x: 450, y: 200, r: 30, label: 'Bắn' },
        ],
    },
    {
        id: 'hq-bao-tau',
        branch: 'hai-quan',
        name: 'HQ · Bảo vệ tàu / cảng',
        desc: 'Tuần ven biển · UAV m/ph từ biển Đông',
        doctrine: 'Trinh sát · bảo vệ mục tiêu',
        spawn: { x: 200, y: 400, angle: 0 },
        seaZone: { x: 520, y: 0, w: 280, h: 600 },
        protectZone: { x: 280, y: 320, r: 55, label: 'Tàu' },
        allyPosts: [
            { x: 120, y: 480, label: '⚓ HQ' },
            { x: 120, y: 120, label: 'Radar bờ' },
        ],
        threatZones: [
            { x: 650, y: 200, r: 55, label: 'Biển Đông' },
            { x: 700, y: 400, r: 60, label: 'UAV' },
        ],
        checkpoints: [
            { x: 320, y: 200, r: 30, label: 'T-1' },
            { x: 420, y: 280, r: 28, label: 'T-2' },
            { x: 380, y: 420, r: 28, label: 'T-3' },
            { x: 260, y: 480, r: 30, label: 'Báo' },
        ],
    },
    {
        id: 'qc-csb-bien',
        branch: 'hai-quan',
        name: 'CSB · Phòng UAV đường biển',
        desc: 'CSB tuần ven bờ · UAV m/ph từ phía biển',
        doctrine: 'Phát hiện sớm · phối hợp HQ',
        spawn: { x: 400, y: 500, angle: -Math.PI / 2 },
        seaZone: { x: 600, y: 80, w: 200, h: 520 },
        defaultWind: { strength: 0.4, angle: 0.1 },
        allyPosts: [
            { x: 60, y: 300, label: 'CSB' },
            { x: 400, y: 60, label: 'CH vùng' },
        ],
        threatZones: [
            { x: 700, y: 250, r: 70, label: 'Đường biển' },
            { x: 650, y: 450, r: 50, label: 'UAV' },
        ],
        checkpoints: [
            { x: 400, y: 400, r: 32, label: 'P-1' },
            { x: 520, y: 280, r: 30, label: 'P-2' },
            { x: 620, y: 350, r: 28, label: 'QS' },
            { x: 480, y: 180, r: 30, label: 'Cảnh báo' },
        ],
    },
    {
        id: 'qk-kt-thu-do',
        branch: 'quan-khu',
        name: 'KT · Bảo vệ vùng Thủ đô',
        desc: 'BTL Thủ đô Hà Nội — tuần MTTQ · UAV m/ph đa hướng',
        doctrine: 'Bảo vệ Thủ đô · phát hiện sớm',
        spawn: { x: 400, y: 500, angle: -Math.PI / 2 },
        protectZone: { x: 400, y: 280, r: 65, label: 'MTTQ' },
        threatZones: [
            { x: 150, y: 120, r: 50, label: '!' },
            { x: 650, y: 120, r: 50, label: '!' },
            { x: 700, y: 450, r: 55, label: '!' },
        ],
        allyPosts: [
            { x: 400, y: 520, label: '🇻🇳 KT' },
            { x: 60, y: 500, label: 'Gác' },
        ],
        checkpoints: [
            { x: 400, y: 420, r: 28, label: 'V1' },
            { x: 520, y: 320, r: 28, label: 'V2' },
            { x: 400, y: 160, r: 28, label: 'V3' },
            { x: 260, y: 320, r: 28, label: 'V4' },
        ],
    },
    {
        id: 'qk5-kv-bien-dong',
        branch: 'quan-khu',
        name: 'QK5 (KV) · Nam Trung Bộ & Tây Nguyên',
        desc: 'BTL QK5 Đà Nẵng — trinh sát ven biển · đe dọa biển Đông',
        doctrine: 'Phối hợp QA · HQ ven bờ',
        spawn: { x: 180, y: 450, angle: 0 },
        seaZone: { x: 550, y: 100, w: 250, h: 500 },
        defaultWind: { strength: 0.3, angle: 0.05 },
        allyPosts: [
            { x: 100, y: 480, label: 'QK5 KV' },
            { x: 100, y: 120, label: 'PK-KQ' },
        ],
        threatZones: [
            { x: 680, y: 280, r: 65, label: 'Biển Đông' },
            { x: 620, y: 450, r: 50, label: 'UAV' },
        ],
        checkpoints: [
            { x: 280, y: 350, r: 30, label: 'KV-1' },
            { x: 400, y: 280, r: 28, label: 'KV-2' },
            { x: 520, y: 350, r: 28, label: 'KV-3' },
            { x: 400, y: 180, r: 30, label: 'Báo QK5' },
        ],
    },
    {
        id: 'qk4-kd-bac-trung-bo',
        branch: 'quan-khu',
        name: 'QK4 (KD) · Bắc Trung Bộ',
        desc: 'BTL QK4 Vinh — trinh sát vùng · đe dọa hướng Đông',
        doctrine: 'Phòng thủ vùng · phát hiện sớm',
        spawn: { x: 400, y: 520, angle: -Math.PI / 2 },
        allyPosts: [
            { x: 80, y: 300, label: 'QK4 KD' },
            { x: 400, y: 80, label: 'CH vùng' },
        ],
        threatZones: [
            { x: 700, y: 250, r: 60, label: 'm/ph' },
            { x: 650, y: 420, r: 50, label: 'UAV' },
        ],
        checkpoints: [
            { x: 400, y: 420, r: 30, label: 'KD-1' },
            { x: 520, y: 300, r: 28, label: 'KD-2' },
            { x: 400, y: 200, r: 28, label: 'KD-3' },
            { x: 280, y: 300, r: 28, label: 'KD-4' },
        ],
    },
    // Ẩn — liên hợp nước ngoài (giữ trong data, không hiện menu)
    {
        id: 'lh-us-ru',
        branch: 'lien-hop',
        hidden: true,
        name: 'LH · ◆US ◆RU yểm trợ m/ph',
        desc: 'Ẩn',
        doctrine: '',
        spawn: { x: 400, y: 520, angle: -Math.PI / 2 },
        allyPosts: [],
        threatZones: [],
        checkpoints: [],
    },
    {
        id: 'lh-tong-hop',
        branch: 'lien-hop',
        hidden: true,
        name: 'LH · Phòng UAV tổng hợp',
        desc: 'Ẩn',
        doctrine: '',
        spawn: { x: 400, y: 540, angle: -Math.PI / 2 },
        allyPosts: [],
        threatZones: [],
        checkpoints: [],
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
