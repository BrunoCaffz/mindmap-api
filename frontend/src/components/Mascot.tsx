import Image from "next/image";

// Mascotes decorativos (arquivos em public/mascotes). Alt vazio, sem foco e sem clique: quem usa leitor
// de tela ou teclado não precisa saber deles. A animação de balanço some com prefers-reduced-motion.
const MASCOTS = {
  "cat-peek": { src: "/mascotes/cat-peek.png", ratio: 282 / 334 },
  "cat-sit": { src: "/mascotes/cat-sit.png", ratio: 362 / 482 },
  "dog-peek": { src: "/mascotes/dog-peek.png", ratio: 355 / 500 },
  "dog-stand": { src: "/mascotes/dog-stand.png", ratio: 561 / 419 },
} as const;

export type MascotName = keyof typeof MASCOTS;

interface MascotProps {
  name: MascotName;
  // Altura em px; a largura sai da proporção do desenho.
  height: number;
  motion?: "bob" | "lean";
  className?: string;
}

export function Mascot({ name, height, motion, className = "" }: MascotProps) {
  const { src, ratio } = MASCOTS[name];
  const motionClass = motion === "bob" ? "mascot-bob" : motion === "lean" ? "mascot-lean" : "";
  return (
    <Image
      src={src}
      alt=""
      width={Math.round(height * ratio)}
      height={height}
      aria-hidden="true"
      tabIndex={-1}
      draggable={false}
      className={`mascot ${motionClass} ${className}`}
    />
  );
}
