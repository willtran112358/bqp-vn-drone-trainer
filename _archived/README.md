# 3D Simulator — Tạm ẩn

Phiên bản 3D FPV (`simulator3d.html`) **không được deploy** lên GitHub Pages.

**Lý do:** Cần tải ~190 MB asset (Three.js + GLB maps + HDR + audio) trước khi chơi — dễ treo/lag trên mạng chậm.

**Chạy local (dev only):**

```bash
python -m http.server 8000
# http://localhost:8000/_archived/simulator3d.html?config=configs/san-tap.json5,configs/co-ban.json5
```

**Production:** Chỉ deploy thư mục `docs/` (2D nhẹ).
