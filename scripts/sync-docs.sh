#!/bin/sh
# Đồng bộ bản 2d/ (dev) → docs/ (mirror cho GitHub Pages legacy)
set -e
mkdir -p docs/2d docs/media
cp index.html docs/index.html 2>/dev/null || cp docs/index.html docs/index.html
cat > docs/index.html <<'EOF'
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0; url=2d/">
    <script>location.replace('2d/' + location.search + location.hash);</script>
</head>
<body></body>
</html>
EOF
cp -r 2d/* docs/2d/
cp media/favicon.ico docs/media/
touch docs/.nojekyll
echo "Synced 2d -> docs/"
