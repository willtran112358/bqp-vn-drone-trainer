/**
 * Thư viện tra cứu UAV / UCAV — bối cảnh Biển Đông & HL BQP VN
 * Dữ liệu tóm lược từ tài liệu mở (Wikipedia, báo chí quốc phòng).
 */
import { WIKI_IMAGES } from './wiki-images.js';

/** Ghi chú kiến trúc mô phỏng (đối chiếu levels.js + game.js) */
export const SIM_ARCHITECTURE = {
    layers: [
        { id: 'background', name: 'Nền sân / ảnh vệ tinh', role: 'Địa hình, lưới, map tĩnh' },
        { id: 'seaZone', name: 'Vùng biển (≋)', role: 'Kịch bản HQ/CSB · ven biển' },
        { id: 'protectZone', name: 'Khu BV / AO', role: 'Vùng cần bảo vệ (vòng xanh)' },
        { id: 'threatZones', name: 'UAV địch m/ph', role: 'Vùng đỏ · mô phỏng xâm nhập hướng Đ' },
        { id: 'allyPosts', name: 'Điểm ta / gác', role: 'Vị trí 🇻🇳 · radar · sân HL' },
        { id: 'obstacles', name: 'Chướng ngại', role: 'Vật cản tĩnh trên sân' },
        { id: 'checkpoints', name: 'Điểm QS / khóa tuyến', role: 'Tuần tra · trinh sát' },
        { id: 'landing', name: 'Bãi H', role: 'Hạ cánh · rút lui' },
        { id: 'guides', name: 'Vector / gió', role: 'HL điều khiển VLOS' },
    ],
    scenarioAxes: [
        'branch (đơn vị: biên phòng, PK-KQ, hải quân, quân khu, khóa tuyến)',
        'spawn, checkpoints, landing, defaultWind',
        'threatZones + protectZone + seaZone + obstacles',
    ],
    recommendations: [
        'Giữ wiki làm lớp “tri thức” — không cần thêm object 3D ngay.',
        'Tương lai có thể thêm: vùng ADIZ (đường đứt), vùng ECM (vòng tím), quỹ đạo UAV ta (đường xanh đứt).',
        'Kịch bản mới nên gắn doctrine rõ (trinh sát / PK / cảm tử) thay vì chỉ thêm hình học.',
    ],
};

export const WIKI_CATEGORIES = [
    { id: 'all', label: 'Tất cả' },
    { id: 'khai-niem', label: 'Khái niệm' },
    { id: 'viet-nam', label: '🇻🇳 Việt Nam' },
    { id: 'doi-phuong', label: 'Đối phương khu vực' },
    { id: 'tang-hinh', label: 'Tàng hình' },
    { id: 'tac-chien', label: 'Ứng phó BQP' },
];

export const WIKI_ARTICLES = [
    {
        id: 'sim-structure',
        category: 'tac-chien',
        title: 'Cấu trúc mô phỏng hiện tại',
        subtitle: 'Layer · kịch bản · gợi ý mở rộng',
        tags: ['HL', 'BQP'],
        body: `**Lớp tĩnh (vẽ theo thứ tự):** nền → biển → khu bảo vệ → vùng đỏ m/ph → điểm ta → chướng ngại → điểm QS / khóa tuyến → UAV học viên.

**Kịch bản** = một mục trong \`LEVELS\`: nhánh đơn vị, spawn, checkpoint, gió, landing, và tùy chọn seaZone / protectZone / threatZones / obstacles.

**Đánh giá:** Cấu trúc đủ cho HL VLOS + tác chiến cơ bản ven biển/Thủ đô. Chưa cần thêm layer phức tạp trước khi có nhu cầu ADIZ/ECM cụ thể.

**Gợi ý sau:** vùng ADIZ (đường viền), ECM (giảm GPS), track UAV đồng minh — triển khai khi có kịch bản doctrine tương ứng.`,
    },
    {
        id: 'uav-khai-niem',
        category: 'khai-niem',
        title: 'UAV · UAS · Drone',
        subtitle: 'Phương tiện bay không người lái',
        tags: ['cơ bản'],
        body: `**UAV** (unmanned aerial vehicle): phương tiện bay trong không khí, không có người trên máy; bay tự hành theo chương trình, điều khiển từ xa, hoặc hỗn hợp.

**UAS** (unmanned aircraft system): hệ máy bay truyền thống + tự động hóa cao — thường dùng trinh sát, tấn công chớp nhoáng (từ những năm 1950).

**Drone:** dạng mới, kích thước nhỏ–trung bình, nhiều cánh quạt; dân sự (quay phim, nông nghiệp) và quân sự.

**Flycam** tại VN thường chỉ drone gắn camera — cần phân biệt với UAV tác chiến.

**Ranh giới:** tên lửa một lần vs UAV thu hồi được; loitering munition (cảm tử) lao vào mục tiêu nhưng có thể trinh sát trước — ranh giới đã mờ.`,
    },
    {
        id: 'ucav',
        category: 'khai-niem',
        title: 'UCAV — Máy bay chiến đấu không người lái',
        subtitle: 'Trinh sát · tấn công · điều khiển từ xa',
        tags: ['tác chiến'],
        body: `UCAV có vai trò quân sự: trinh sát, tấn công, bắn tên lửa/chính xác; vẫn có người điều khiển qua liên kết vô tuyến (mức tự động tùy loại).

**Lịch sử ngắn:** ý tưởng từ những năm 1940; DARPA thử nghiệm 1973; Israel tiên phong Scout/Pioneer, vô hiệu PK Syria (1982); chiến tranh Vùng Vịnh 1991 — UAV luôn trên không.

**Thực chiến gần đây:** Nagorno-Karabakh (TB2), Ukraine (2022–), Thổ Nhĩ Kỳ tấn công phối hợp mặt đất–UAV.

**Hạn chế (nghiên cứu 2022):** UAV dễ bị PK và tác chiến điện tử; hiệu quả khi có hỗ trợ radar, PK, không quân — không thay thế hoàn toàn lực lượng có người lái.`,
    },
    {
        id: 'vu-c2',
        category: 'viet-nam',
        title: 'VU-C2 (Viettel)',
        subtitle: 'UAV cảm tử · trinh sát–tấn công',
        tags: ['🇻🇳', 'cảm tử'],
        specs: 'Sải cánh 1,5 m · dài 1,1 m · MTOW 8 kg · 40 phút · tốc độ tấn công ~130 km/h',
        imageNote: 'Ảnh minh họa loại cảm tử tương đương (Wikipedia); VU-C2 là biến thể Viettel.',
        body: `UAV cảm tử do Viettel phát triển (2024), phục vụ Lục quân VN.

**Tính năng:** động cơ điện (ít tiếng/ít IR); đầu dẫn quang + AI khóa mục tiêu; kết hợp trinh sát và tấn công; có thể thu hồi nếu chưa tấn công.

**Triển khai:** phóng từ ống (cánh gấp) hoặc thanh ray (cánh cố định).

**Vai trò:** chiến tranh phi đối xứng, bảo vệ chủ quyền — rừng nhiệt đới đến ven biển.`,
    },
    {
        id: 'vn-uav-eco',
        category: 'viet-nam',
        title: 'Hệ sinh thái UAV Việt Nam',
        subtitle: 'Triển lãm quốc phòng · tầm xa',
        tags: ['🇻🇳'],
        body: `Ngoài VU-C2, báo chí quốc phòng ghi nhận các dòng UAV tầm xa, mang vũ khí chính xác (triển lãm 2024) — hướng tới trinh sát–tấn công tích hợp.

**HL trong mô phỏng:** nhánh Cơ sở → Biên phòng → PK-KQ → Hải quân → Quân khu; khóa tuyến hình học tách riêng.`,
    },
    {
        id: 'us-reaper',
        category: 'doi-phuong',
        title: 'MQ-9 Reaper (Mỹ)',
        subtitle: 'UCAV trinh sát–tấn công tầm xa',
        tags: ['Mỹ', 'UCAV'],
        specs: 'Tầm bay lớn · vũ khí treo · ISR + strike',
        body: `Một trong các UCAV nổi tiếng nhất; hoạt động Afghanistan và nhiều chiến dịch chống khủng bố. Trong bối cảnh Thái Bình Dương: năng lực tuần tra, bắn chính xác, liên kết với tàu/tiêm kích.

**Đối phó BQP:** phát hiện sớm bằng radar VHF/UAV; ECM; che giấu mục tiêu; PK tầng thấp.`,
    },
    {
        id: 'us-stealth-uav',
        category: 'doi-phuong',
        title: 'RQ-170 · XQ-58 · MQ-25 (Mỹ)',
        subtitle: 'Trinh sát tàng hình · loyal wingman',
        tags: ['Mỹ', 'tàng hình'],
        body: `**RQ-170 Sentinel:** trinh sát, hình dáng cánh bay (tàng hình).

**XQ-58 Valkyrie:** UAV hỗ trợ tiêm kích, chi phí thấp.

**MQ-25 Stingray:** tiếp liệu trên không cho tàu sân bay.

Ứng dụng khu vực: tuần tra biển, ISR trước khi có xung đột.`,
    },
    {
        id: 'cn-wing-loong',
        category: 'doi-phuong',
        title: 'Wing Loong · GJ-11 · Dark Sword (Trung Quốc)',
        subtitle: 'UCAV / trinh sát–tấn công',
        tags: ['TQ', 'Biển Đông'],
        body: `**Wing Loong / Rainbow:** xuất khẩu và triển khai rộng; ISR + không kích có người điều khiển.

**GJ-11 / Dark Sword:** hướng tàng hình, tấn công — đe dọa tiêm kích đối phương.

Trong kịch bản mô phỏng: vùng đỏ hướng Đ = mô phỏng xâm nhập UAV đối phương từ hướng biển.`,
    },
    {
        id: 'cn-j20-h20',
        category: 'tang-hinh',
        title: 'J-20 · H-20 (Trung Quốc)',
        subtitle: 'Tiêm kích / ném bom thế hệ mới',
        tags: ['TQ', 'tàng hình'],
        body: `**J-20:** tiêm kích tàng hình, yếu tố đe dọa không phận Biển Đông.

**H-20 (dự kiến):** ném bom tàng hình tầm xa.

UAV tàng hình TQ bổ trợ: GJ-11, Tianying — cần radar cảnh giới và liên thông PK-KQ.`,
    },
    {
        id: 'ru-orion',
        category: 'doi-phuong',
        title: 'Orion · Okhotnik-B (Nga)',
        subtitle: 'UCAV trinh sát–tấn công',
        tags: ['Nga'],
        body: `**Kronshtadt Orion:** tương tự Predator class — ISR + strike.

**S-70 Okhotnik-B:** UCAV lớn, hỗ trợ Su-57 — bán tàng hình.

Khu vực: ít trực tiếp Biển Đông nhưng là mẫu UCAV hiện đại cần nắm khi đánh giá đối tác.`,
    },
    {
        id: 'tr-tb2',
        category: 'doi-phuong',
        title: 'Bayraktar TB2 · Kızılelma (Thổ Nhĩ Kỳ)',
        subtitle: 'UCAV chi phí thấp · hiệu quả cao',
        tags: ['Thổ', 'TB2'],
        body: `**TB2:** đã thay đổi chiến tranh Nagorno-Karabakh; trinh sát + chỉ mục tiêu cho pháo/rocket.

**Kızılelma:** UCAV phản lực đang phát triển.

**Bài học BQP:** UAV rẻ + EW yếu đối phương = thiệt hại lớn; cần PK lớp thấp, EW, và UAV ta.`,
    },
    {
        id: 'ir-shahed',
        category: 'doi-phuong',
        title: 'Shahed 129 (Iran)',
        subtitle: 'Hình thù gần MQ-1 Predator',
        tags: ['Iran'],
        body: `UAV trinh sát–tấn công tầm trung; đã xuất hiện trên nhiều chiến trường. Mẫu tham chiếu cho UAV “Predator-class” trong khu vực Trung Đông — có thể liên quan công nghệ chuyển giao.`,
    },
    {
        id: 'il-hermes',
        category: 'doi-phuong',
        title: 'Hermes 450 (Israel)',
        subtitle: 'ISR · tuần tra chiến trường',
        tags: ['Israel'],
        body: `UAV trinh sát ưu thế; Israel tiên phong dùng UAV làm mồi nhử PK và chiến tranh điện tử (1982). Mô hình “UAV + EW + không quân” áp dụng cho HL PK-KQ.`,
    },
    {
        id: 'stealth-tech',
        category: 'tang-hinh',
        title: 'Công nghệ tàng hình',
        subtitle: 'F-22 · B-2 · UCAV tàng hình',
        tags: ['kỹ thuật'],
        body: `Giảm phản xạ radar (RAM, hình học), giảm IR/âm thanh. Mỹ: F-117, B-2, F-22, F-35, B-21; TQ: J-20, H-20 dự kiến; Nga: Su-57, PAK DA.

**Với UAV:** RQ-170, GJ-11, Phantom Ray — trinh sát/tấn công khi PK đối phương yếu.

**Ứng phó:** radar đa băng tần, cảm biến pasive, liên kết PK-KQ, UAV ta tuần tra tầng thấp.`,
    },
    {
        id: 'bien-dong',
        category: 'tac-chien',
        title: 'UAV trong bối cảnh Biển Đông',
        subtitle: 'Trinh sát · đảo · ven biển',
        tags: ['Biển Đông', 'BQP'],
        body: `**Đặc thù:** đảo nhỏ, khoảng cách xa, gió biển, ECM; đối phương triển khai ISR và UCAV từ tàu/đảo/đất liền.

**Vai trò UAV ta:** tuần tra biên, phát hiện xâm nhập m/ph, chỉ mục tiêu cho PK-KQ/HQ, cảm tử (VU-C2) khi cần.

**Trong mô phỏng:** nhánh HQ/CSB (seaZone), Biên phòng (threatZones), PK-KQ (radar/allyPosts).`,
    },
    {
        id: 'bqp-doctrine',
        category: 'tac-chien',
        title: 'Ứng phó chiến lược BQP VN',
        subtitle: 'VLOS · PK lớp thấp · hiệp đồng',
        tags: ['BQP', 'HL'],
        body: `1. **Phân biệt** drone dân sự vs UAV tác chiếch — vùng cấm, sân bay, mục tiêu quân sự.

2. **Phát hiện sớm:** radar, quan sát VLOS, UAV trinh sát ta.

3. **Vô hiệu:** EW, PK tầng thấp, hỏa lực có chỉ dẫn từ UAV.

4. **HL:** Mode 2, vector lệnh, gió/ECM, hạ cánh an toàn — luyện trước khi tác chiến thật.

5. **Cảm tử có kiểm soát:** VU-C2 — trinh sát trước, chỉ huy quyết định tấn công.`,
    },
];

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatBody(text) {
    return escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

function wikiFigure(article) {
    const img = WIKI_IMAGES[article.id];
    if (!img?.file) return '';
    const note = article.imageNote
        ? `<span class="wiki-img-note">${escapeHtml(article.imageNote)}</span>`
        : '';
    return `<figure class="wiki-figure">
        <img src="${escapeHtml(img.file)}" alt="${escapeHtml(img.alt || article.title)}" loading="lazy" decoding="async" width="320" height="180">
        <figcaption>${escapeHtml(img.credit)} · CC BY-SA Wikipedia${note ? `<br>${note}` : ''}</figcaption>
    </figure>`;
}

/**
 * @param {string} categoryId
 * @returns {string}
 */
export function renderWikiArticles(categoryId = 'all') {
    const items = categoryId === 'all'
        ? WIKI_ARTICLES
        : WIKI_ARTICLES.filter(a => a.category === categoryId);

    if (!items.length) {
        return '<p class="wiki-empty">Chưa có mục trong nhóm này.</p>';
    }

    return items.map(a => `
        <article class="wiki-article" id="wiki-${a.id}">
            ${wikiFigure(a)}
            <header class="wiki-article-head">
                <h3>${escapeHtml(a.title)}</h3>
                ${a.subtitle ? `<p class="wiki-sub">${escapeHtml(a.subtitle)}</p>` : ''}
            </header>
            ${a.specs ? `<p class="wiki-specs">${escapeHtml(a.specs)}</p>` : ''}
            <div class="wiki-body">${formatBody(a.body)}</div>
            ${a.tags?.length ? `<div class="wiki-tags">${a.tags.map(t => `<span>${escapeHtml(t)}</span>`).join('')}</div>` : ''}
        </article>
    `).join('');
}

export function renderWikiPanel(activeCategory = 'all') {
    const tabs = WIKI_CATEGORIES.map(c =>
        `<button type="button" class="wiki-tab${c.id === activeCategory ? ' active' : ''}" data-wiki-cat="${c.id}">${escapeHtml(c.label)}</button>`
    ).join('');

    const arch = SIM_ARCHITECTURE;
    const layerList = arch.layers.map(l => `<li><strong>${escapeHtml(l.name)}</strong> — ${escapeHtml(l.role)}</li>`).join('');
    const recList = arch.recommendations.map(r => `<li>${escapeHtml(r)}</li>`).join('');

    return `
        <p class="wiki-lead">Tra cứu nhanh loại UAV/UCAV có thể gặp trong kịch bản Biển Đông — phục vụ sĩ quan/chiến sĩ HL trước khi vào mô phỏng.</p>
        <div class="wiki-arch-box">
            <strong>🗂 Lớp mô phỏng hiện có</strong>
            <ul>${layerList}</ul>
            <strong style="display:block;margin-top:8px">Gợi ý mở rộng</strong>
            <ul>${recList}</ul>
        </div>
        <div class="wiki-tabs" role="tablist">${tabs}</div>
        <div class="wiki-articles">${renderWikiArticles(activeCategory)}</div>
        <p class="wiki-foot">Nguồn tóm lược: Wikipedia, báo quốc phòng VN (2024). Chỉ dùng cho HL — không thay tài liệu mật.</p>
    `;
}
