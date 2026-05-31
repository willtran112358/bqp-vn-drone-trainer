/**
 * Sao chép file này thành config.local.js (đã gitignore) để tùy chỉnh nền bản đồ.
 *
 * Nguồn miễn phí:
 * - provider: 'esri'  — ảnh vệ tinh, KHÔNG cần key (mặc định)
 * - provider: 'osm'    — bản đồ đường phố OpenStreetMap, KHÔNG cần key
 *
 * MapTiler (free ~100k tile/tháng): https://cloud.maptiler.com/
 * - provider: 'maptiler-satellite'
 * - maptilerKey: 'YOUR_KEY'
 */
export const MAP_CONFIG = {
    center: { lat: 16.0544, lon: 108.2022 },
    spanM: { w: 1100, h: 825 },
    zoom: 17,
    provider: 'esri',
    maptilerKey: '',
};
