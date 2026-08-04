// Codifica caminhos de imagem para URL segura (espaços, vírgulas, acentos).
export function imgSrc(p: string): string {
  if (!p) return p;
  return p
    .split('/')
    .map((seg) => (seg ? encodeURIComponent(seg) : seg))
    .join('/');
}

// Gera um "slug" limpo a partir de um texto (ex.: nome do prato).
// Precisa bater com o slug usado em scripts/optimize-images.mjs.
export function slugify(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'item';
}
