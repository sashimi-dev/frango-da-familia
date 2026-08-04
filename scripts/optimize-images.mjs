// Otimização automática de imagens no build (local e Cloudflare).
// - Fotos do cardápio: gera uma versão limpa em public/images/menu/<slug>.jpg,
//   enquadrada em 4:3 (prato inteiro visível), a partir do arquivo enviado pelo /admin.
//   NÃO renomeia nem altera o arquivo original nem as referências (.md) -> sem conflitos.
// - Demais imagens: comprime/redimensiona no lugar.
// Se o sharp falhar, sai sem erro (não quebra o build).

import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (e) {
  console.warn('[optimize-images] sharp indisponível — pulando.', e?.message);
  process.exit(0);
}

const IMG_DIR = 'public/images';
const MENU_MD = 'src/content/menu';
const MENU_OUT = 'public/images/menu';
const CREAM = { r: 239, g: 225, b: 205 }; // #efe1cd
const MENU_MAXW = 1100;
const OTHER_MAXW = 1600;
const SKIP_BYTES = 230 * 1024;
const TARGET = 4 / 3;

function slugify(s) {
  return (s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
}

// 1) Coleta itens do cardápio: {slug, src}
const menuItems = [];
const menuSrcNames = new Set();
try {
  for (const f of await readdir(MENU_MD)) {
    if (!f.endsWith('.md')) continue;
    const txt = await readFile(path.join(MENU_MD, f), 'utf8');
    const nome = (txt.match(/^nome:\s*(.+?)\s*$/m) || [])[1];
    const foto = (txt.match(/^foto:\s*(.+?)\s*$/m) || [])[1];
    if (!nome || !foto) continue;
    if (!/\.(jpe?g|png|webp)$/i.test(foto)) continue; // pula svg/placeholder
    menuItems.push({ slug: slugify(nome), src: 'public' + foto });
    menuSrcNames.add(path.basename(foto));
  }
} catch {}

// 2) Gera fotos limpas do cardápio, enquadradas em 4:3
await mkdir(MENU_OUT, { recursive: true });
let made = 0;
for (const { slug, src } of menuItems) {
  try {
    if (!existsSync(src)) { console.warn('[optimize-images] fonte não encontrada:', src); continue; }
    const meta = await sharp(src).metadata();
    const cw = Math.ceil(Math.max(meta.width / 0.9, (meta.height / 0.9) * TARGET));
    const ch = Math.ceil(cw / TARGET);
    const left = Math.floor((cw - meta.width) / 2);
    const right = cw - meta.width - left;
    const top = Math.floor((ch - meta.height) / 2);
    const bottom = ch - meta.height - top;
    const buf = await sharp(src)
      .flatten({ background: CREAM })
      .extend({ top, bottom, left, right, background: CREAM })
      .resize({ width: Math.min(cw, MENU_MAXW) })
      .jpeg({ quality: 74, mozjpeg: true })
      .toBuffer();
    await writeFile(path.join(MENU_OUT, `${slug}.jpg`), buf);
    made++;
  } catch (e) {
    console.warn('[optimize-images] pulou cardápio', slug, e?.message);
  }
}

// 3) Otimiza as demais imagens no lugar (hero, og, logo, história, etc.)
async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(fp)));
    else if (/\.(jpe?g|png|webp)$/i.test(e.name)) out.push(fp);
  }
  return out;
}
let opt = 0;
for (const fp of await walk(IMG_DIR)) {
  try {
    const base = path.basename(fp);
    if (menuSrcNames.has(base)) continue;          // fontes do cardápio (não usadas na página)
    if (fp.replace(/\\/g, '/').startsWith(MENU_OUT + '/')) continue; // já geradas acima
    const s = await stat(fp);
    const meta = await sharp(fp).metadata();
    if (s.size <= SKIP_BYTES && meta.width <= OTHER_MAXW) continue;
    let pipe = sharp(fp);
    if (meta.width > OTHER_MAXW) pipe = pipe.resize({ width: OTHER_MAXW });
    const ext = path.extname(fp).toLowerCase();
    if (ext === '.png') pipe = pipe.png({ compressionLevel: 9 });
    else if (ext === '.webp') pipe = pipe.webp({ quality: 74 });
    else pipe = pipe.jpeg({ quality: 72, mozjpeg: true });
    await writeFile(fp, await pipe.toBuffer());
    opt++;
  } catch (e) {
    console.warn('[optimize-images] pulou', fp, e?.message);
  }
}
console.log(`[optimize-images] cardápio: ${made} · outras: ${opt}`);
