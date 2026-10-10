import { REPOSITORY_URL } from "@/lib/demo";

export function DemoBanner() {
  return (
    <p className="border-b border-line bg-accent-soft px-4 py-1.5 text-center text-xs text-muted">
      Demonstração com dados fictícios. Para usar com as suas páginas do Notion, rode o projeto
      localmente.{" "}
      <a
        href={REPOSITORY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-ink underline underline-offset-2 hover:text-accent"
      >
        Repositório no GitHub
      </a>
    </p>
  );
}
