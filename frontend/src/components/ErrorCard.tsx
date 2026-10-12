import type { ReactNode } from "react";
import { LoginButton } from "./AppHeader";
import { AlertIcon, LockIcon } from "./icons";
import { Mascot } from "./Mascot";

export interface LoadError {
  message: string;
  // Status HTTP da resposta, ou null quando o servidor nem respondeu.
  status: number | null;
}

const BUTTON =
  "mt-1.5 inline-flex h-9 items-center self-start rounded-sm bg-primary px-3.5 font-semibold text-on-primary transition-[background-color,transform] duration-100 hover:bg-primary-hover active:scale-[0.97]";

interface Look {
  art: ReactNode;
  eyebrow: string;
  title: string;
}

function IconTile({ tone, children }: { tone: "blue" | "red" | "green"; children: ReactNode }) {
  const bg = tone === "blue" ? "bg-t-blue" : tone === "red" ? "bg-t-red" : "bg-t-green";
  return <div className={`flex h-11 w-11 items-center justify-center rounded-md ${bg}`}>{children}</div>;
}

// O desenho e o título mudam com o tipo de problema. O texto de baixo é o que o backend mandou.
function lookFor(status: number | null): Look {
  if (status === 404) {
    return {
      art: <Mascot name="dog-stand" height={90} />,
      eyebrow: "Página não encontrada",
      title: "O salsicha farejou e não achou nada",
    };
  }
  if (status === 403) {
    return {
      art: (
        <IconTile tone="blue">
          <LockIcon width={22} height={22} className="text-c-blue" />
        </IconTile>
      ),
      eyebrow: "Sem acesso",
      title: "Essa página ficou de fora",
    };
  }
  if (status === 400) {
    return {
      art: (
        <IconTile tone="red">
          <AlertIcon width={22} height={22} className="text-c-red" />
        </IconTile>
      ),
      eyebrow: "ID inválido",
      title: "Esse ID não parece certo",
    };
  }
  if (status === 429) {
    return {
      art: (
        <IconTile tone="green">
          <AlertIcon width={22} height={22} className="text-c-green" />
        </IconTile>
      ),
      eyebrow: "Muitas tentativas",
      title: "Calma, o Notion pediu um respiro",
    };
  }
  if (status === null) {
    return { art: <Mascot name="cat-sit" height={90} />, eyebrow: "Sem resposta", title: "O servidor não atendeu" };
  }
  return {
    art: <Mascot name="cat-sit" height={90} />,
    eyebrow: "Notion lento ou fora do ar",
    title: "O feitiço não pegou dessa vez",
  };
}

interface ErrorCardProps {
  error: LoadError;
  onRetry: () => void;
  onPasteAnother: () => void;
}

export function ErrorCard({ error, onRetry, onPasteAnother }: ErrorCardProps) {
  const { art, eyebrow, title } = lookFor(error.status);
  const askForAnotherId = error.status === 404 || error.status === 400;

  return (
    <div role="alert" className="rise mt-6 flex flex-col gap-2.5 rounded-lg border border-line bg-bg p-6">
      <div className="mb-1">{art}</div>
      <div className="text-xs font-semibold text-muted">{eyebrow}</div>
      <h2 className="text-[17px] font-bold">{title}</h2>
      <p className="text-muted">{error.message}</p>
      {error.status === 403 ? (
        <LoginButton label="Escolher mais páginas" />
      ) : askForAnotherId ? (
        <button type="button" onClick={onPasteAnother} className={BUTTON}>
          Colar outro ID
        </button>
      ) : (
        <button type="button" onClick={onRetry} className={BUTTON}>
          Tentar de novo
        </button>
      )}
    </div>
  );
}
