/** Đường tuyến bay cơ bản — tham khảo layout khóa tuyến 2D Drone Simulator (Siv3D) */

const W = 800;
const H = 600;
const M = 48;

function clampArena(x, y) {
    return {
        x: Math.max(M, Math.min(W - M, x)),
        y: Math.max(M, Math.min(H - M, y)),
    };
}

/** Điểm dọc đường cong S ngang */
function sCurveHorizontalPoints(cx, cy, spanX, spanY, segments = 8) {
    const pts = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = cx - spanX / 2 + spanX * t;
        const y = cy + Math.sin(t * Math.PI * 2) * spanY;
        pts.push(clampArena(x, y));
    }
    return pts;
}

/** S dọc */
function sCurveVerticalPoints(cx, cy, spanX, spanY, segments = 8) {
    const pts = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const y = cy - spanY / 2 + spanY * t;
        const x = cx + Math.sin(t * Math.PI * 2) * spanX;
        pts.push(clampArena(x, y));
    }
    return pts;
}

function polygonPoints(cx, cy, r, sides, startAngle = -Math.PI / 2) {
    const pts = [];
    for (let i = 0; i < sides; i++) {
        const a = startAngle + (i / sides) * Math.PI * 2;
        pts.push(clampArena(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }
    return pts;
}

function figureEightPoints(cx, cy, r, segments = 16) {
    const pts = [];
    for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        const x = cx + Math.sin(t) * r;
        const y = cy + Math.sin(t * 2) * r * 0.55;
        pts.push(clampArena(x, y));
    }
    return pts;
}

function toCheckpoints(pts, r = 28, prefix = '') {
    return pts.map((p, i) => ({
        x: p.x,
        y: p.y,
        r,
        label: prefix ? `${prefix}${i + 1}` : String(i + 1),
    }));
}

export function buildCourseLevels() {
    const cx = W / 2;
    const cy = H / 2;

    const mk = (id, name, desc, points, extra = {}) => ({
        id,
        branch: 'khoa-tuyen',
        name,
        desc,
        doctrine: 'Khóa tuyến VLOS · bám vạch trắng',
        spawn: { x: points[0]?.x ?? cx, y: (points[0]?.y ?? cy) + 80, angle: -Math.PI / 2 },
        checkpoints: toCheckpoints(points, extra.cpR ?? 30),
        courseTrack: points,
        ...extra,
    });

    return [
        mk('kt-s-ngang', 'S ngang', 'Cua S ngang', sCurveHorizontalPoints(cx, cy, 460, 90), { cpR: 28 }),
        mk('kt-s-doc', 'S dọc', 'Cua S dọc', sCurveVerticalPoints(cx, cy, 90, 430), { cpR: 28 }),
        mk('kt-tam-giac', 'Tam giác', 'Vòng tam giác', polygonPoints(cx, cy, 180, 3)),
        mk('kt-vuong', 'Vuông', 'Vòng vuông sân', polygonPoints(cx, cy, 185, 4, -Math.PI / 4), { cpR: 32 }),
        mk('kt-so-8', 'Số 8', 'Chuyển hướng liên tục', figureEightPoints(cx, cy, 150)),
        {
            id: 'kt-khan-cap',
            branch: 'khoa-tuyen',
            name: 'Khẩn cấp',
            desc: 'Leo · thoát · hạ gấp',
            doctrine: 'Xử lý sự cố · giữ VLOS',
            spawn: { x: cx, y: H - 80, angle: -Math.PI / 2 },
            defaultWind: { strength: 0.55, angle: Math.PI * 0.25 },
            checkpoints: [
                { x: cx, y: cy + 120, r: 32, label: 'Leo' },
                { x: cx + 140, y: cy, r: 30, label: 'Ngang' },
                { x: cx, y: cy - 120, r: 30, label: 'Thoát' },
                { x: cx - 100, y: cy + 40, r: 32, label: 'Hạ' },
            ],
            courseTrack: [
                { x: cx, y: H - 80 },
                { x: cx, y: cy + 120 },
                { x: cx + 140, y: cy },
                { x: cx, y: cy - 120 },
                { x: cx - 100, y: cy + 40 },
            ],
        },
        {
            id: 'kt-xoay-chu',
            branch: 'khoa-tuyen',
            name: 'Xoay chỗ',
            desc: 'Giữ vị trí · xoay 360°',
            doctrine: 'Ổn định ga · kiểm soát yaw',
            spawn: { x: cx, y: cy, angle: 0 },
            checkpoints: [],
            pirouette: { x: cx, y: cy, r: 55, revolutions: 1.5 },
        },
        {
            id: 'kt-xuat-phat',
            branch: 'khoa-tuyen',
            name: 'Sân tự do',
            desc: 'Luyện ga · xoay · R reset',
            doctrine: 'Không giới hạn CP · R reset',
            spawn: { x: cx, y: cy + 60, angle: -Math.PI / 2 },
            checkpoints: [],
            freeFlight: true,
        },
    ];
}

/** Vẽ vạch tuyến trắng (giống simulator gốc) */
export function drawCourseTrack(ctx, level, scale, worldToScreen) {
    const track = level.courseTrack;
    if (!track?.length) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.82)';
    ctx.lineWidth = 6 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const [x0, y0] = worldToScreen(track[0].x, track[0].y);
    ctx.moveTo(x0, y0);
    for (let i = 1; i < track.length; i++) {
        const [x, y] = worldToScreen(track[i].x, track[i].y);
        ctx.lineTo(x, y);
    }
    if (track.length > 2 && level.id !== 'kt-khan-cap') {
        const [xf, yf] = worldToScreen(track[0].x, track[0].y);
        ctx.lineTo(xf, yf);
    }
    ctx.stroke();
    ctx.restore();
}
