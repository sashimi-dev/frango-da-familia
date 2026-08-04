// Otimização automática de imagens no build.
// - Comprime/redimensiona TODAS as imagens de public/images (sem alterar nomes/refs).
// - Fotos do cardápio: enquadra em 4:3 (prato inteiro visível) sobre fundo creme.
// Roda a cada build (local e Cloudflare). Idempotente: pula o que já está otimizado.
// Se o sharp falhar por qualquer motivo, sai sem erro para não quebrar o build.

import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (e) {
  console.warn('[optimize-images] sharp indisponível — pulando otimização.', e?.message);
  process.exit(0);
}

const IMG_DIR = 'public/images';
const MENU_DIR = 'src/content/menu';
const CREAM = { r: 239, g: 225, b: 205 }; // #efe1cd (fundo dos cards)
const MENU_MAXW = 1100;
const OTHER_MAXW = 1600;
const SKIP_BYTES = 230 * 1024;
const TARGET = 4 / 3;

async function menuImageSet() {
  const set = new Set();
  try {
    for (const f of await readdir(MENU_DIR)) {
      if (!f.endsWith('.md')) continue;
      const txt = await readFile(path.join(MENU_DIR, f), 'utf8');
      const m = txt.match(/^foto:\s*(.+?)\s*$/m);
      if (m) set.add(path.basename(m[1].trim()));
    }
  } catch {}
  return set;
}

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(fp)));
    else if (/\.(jpe?g|png|webp)$/i.test(e.name)) out.push(fp);
  }
  return out;
}

function encoder(fp) {
  const ext = path.extname(fp).toLowerCase();
  if (ext === '.png') return (p) => p.png({ compressionLevel: 9 });
  if (ext === '.webp') return (p) => p.webp({ quality: 74 });
  return (p) => p.jpeg({ quality: 72, mozjpeg: true });
}

const menu = await menuImageSet();
let files = [];
try { files = await walk(IMG_DIR); } catch { process.exit(0); }

let changed = 0;
for (const fp of files) {
  try {
    const isMenu = menu.has(path.basename(fp));
    const s = await stat(fp);
    const meta = await sharp(fp).metadata();
    const ar = meta.width / meta.height;
    const small = s.size <= SKIP_BYTES;

    if (isMenu) {
      // já enquadrada (4:3 e leve) -> pula (idempotente)
      if (small && Math.abs(ar - TARGET) < 0.02) continue;
      // enquadra em 4:3 com ~10% de margem, sem ampliar
      const cw = Math.ceil(Math.max(meta.width / 0.9, (meta.height / 0.9) * TARGET));
      const ch = Math.ceil(cw / TARGET);
      const left = Math.floor((cw - meta.width) / 2);
      const right = cw - meta.width - left;
      const top = Math.floor((ch - meta.height) / 2);
      const bottom = ch - meta.height - top;
      const outW = Math.min(cw, MENU_MAXW);
      const buf = await encoder(fp)(
        sharp(fp).flatten({ background: CREAM })
          .extend({ top, bottom, left, right, background: CREAM })
          .resize({ width: outW })
      ).toBuffer();
      await writeFile(fp, buf);
      changed++;
    } else {
      if (small && meta.width <= OTHER_MAXW) continue;
      let pipe = sharp(fp);
      if (meta.width > OTHER_MAXW) pipe = pipe.resize({ width: OTHER_MAXW });
      const buf = await encoder(fp)(pipe).toBuffer();
      await writeFile(fp, buf);
      changed++;
    }
  } catch (e) {
    console.warn('[optimize-images] pulou', fp, e?.message);
  }
}
console.log(`[optimize-images] otimizadas: ${changed} imagem(ns).`);
