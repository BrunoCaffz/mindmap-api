import { REPOSITORY_URL } from "@/lib/demo";

export function DemoBanner() {
  return (
    <p className="border-b border-line bg-t-blue px-4 py-2 text-center text-[13px] text-ink">
      Isto é uma demonstração, com um mapa de mentira. Pra usar com as suas páginas do Notion, rode o projeto na sua
      máquina.{" "}
      <a
        href={REPOSITORY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold underline underline-offset-2 hover:text-primary"
      >
        Ver o código no GitHub
      </a>
    </p>
  );
}
