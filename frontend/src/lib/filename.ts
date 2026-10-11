const FALLBACK_NAME = "mindmap";
const MAX_LENGTH = 80;

// O título vem de conteúdo não confiável. Para virar nome de arquivo ele passa por aqui: minúsculas,
// sem acentos, qualquer sequência fora de [a-z0-9] vira um hífen, e sobram só letras, números e hífens.
export function slugifyFilename(title: string | null | undefined): string {
  const slug = (title ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LENGTH)
    .replace(/-+$/g, "");
  return slug || FALLBACK_NAME;
}
