// Cores aceitas para o fundo: o que getComputedStyle devolve (rgb, rgba ou color()). Qualquer outra
// coisa fica de fora, porque o valor entra num atributo do SVG.
const SAFE_COLOR = /^(?:rgba?|color)\([\d\s.,%/a-z-]+\)$/i;

// O html-to-image só pinta o fundo no elemento do mapa, que a exportação desloca com `translate`. Num
// SVG isso deixa o resto transparente (branco num visualizador). Este retângulo cobre a imagem inteira.
export function withSvgBackground(svg: string, color: string): string {
  const root = /<svg\b[^>]*>/.exec(svg);
  if (!root || !SAFE_COLOR.test(color)) return svg;
  const end = root.index + root[0].length;
  return `${svg.slice(0, end)}<rect width="100%" height="100%" fill="${color}"/>${svg.slice(end)}`;
}
