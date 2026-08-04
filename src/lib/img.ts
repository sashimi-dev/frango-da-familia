// Codifica caminhos de imagem para URL segura, mesmo com espaços, vírgulas
// ou acentos nos nomes de arquivo (ex.: uploads do /admin).
export function imgSrc(p: string): string {
  if (!p) return p;
  return p
    .split('/')
    .map((seg) => (seg ? encodeURIComponent(seg) : seg))
    .join('/');
}
