// Limites para o PNG não travar o navegador nem estourar o limite de canvas.
const PREFERRED_PIXEL_RATIO = 2;
// 16000 px por lado fica abaixo do limite de canvas do Chrome, Edge e Firefox (16384 ou mais).
const MAX_SIDE_PX = 16000;
const MAX_PIXELS = 40_000_000;
const MIN_PIXEL_RATIO = 0.1;

// Resolução do PNG: 2x quando cabe; em mapas muito grandes reduz até respeitar o lado e a área máximos.
export function pixelRatioFor(width: number, height: number): number {
  const bySide = MAX_SIDE_PX / Math.max(width, height);
  const byArea = Math.sqrt(MAX_PIXELS / (width * height));
  return Math.max(MIN_PIXEL_RATIO, Math.min(PREFERRED_PIXEL_RATIO, bySide, byArea));
}
