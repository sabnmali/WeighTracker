// Vite çıktısını tek bir index.html dosyasına gömer (Android WebView file:// için).
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

html = html.replace(/<link rel="stylesheet"[^>]*href="\.\/(assets\/[^"]+\.css)"[^>]*>/g, (_, f) => {
  const css = fs.readFileSync(path.join(dist, f), 'utf8');
  return `<style>${css}</style>`;
});
html = html.replace(/<script type="module"[^>]*src="\.\/(assets\/[^"]+\.js)"[^>]*><\/script>/g, (_, f) => {
  const js = fs.readFileSync(path.join(dist, f), 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script type="module">${js}</script>`;
});
if (/src="\.\/assets|href="\.\/assets/.test(html)) {
  console.error('Gömülemeyen varlık kaldı!');
  process.exit(1);
}
fs.writeFileSync(path.join(dist, 'index.html'), html);
fs.rmSync(path.join(dist, 'assets'), { recursive: true, force: true });
console.log(`index.html tek dosya: ${(html.length / 1024).toFixed(0)} KB`);
