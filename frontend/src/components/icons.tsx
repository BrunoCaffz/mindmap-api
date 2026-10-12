import type { SVGProps } from "react";

// Ícones de traço fino numa grade de 16 px, no mesmo desenho dos mockups. Decorativos: o texto do botão
// (ou o aria-label) é que diz o que ele faz.
function Icon({ strokeWidth = 1.4, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export function BrandIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={1.7} {...props}>
      <path d="M3 8c2.5 0 3-4 6-4M3 8c2.5 0 3 4 6 4M9 4h3M9 12h3" />
    </Icon>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={1.6} {...props}>
      <path d="M8 3v10M3 8h10" />
    </Icon>
  );
}

export function MindLayoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 8c1.5 0 2-3.5 4-3.5h3M6 8h7M6 8c1.5 0 2 3.5 4 3.5h3M3 8h3" />
    </Icon>
  );
}

export function TreeLayoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 2.5h4v3H6zM8 5.5v2.5M3.5 10.5V8h9v2.5M2 10.5h3v3H2zM11 10.5h3v3h-3z" />
    </Icon>
  );
}

export function RadialLayoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M8 6a2 2 0 110 4 2 2 0 010-4zM8 1.5V6M8 10v4.5M1.5 8H6M10 8h4.5" />
    </Icon>
  );
}

export function BubbleLayoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 2.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zM11.5 8.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5z" />
    </Icon>
  );
}

export function DownloadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M8 2.5v8M4.5 7.5L8 11l3.5-3.5M3 13.5h10" />
    </Icon>
  );
}

export function CodeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5.5 5L2.5 8l3 3M10.5 5l3 3-3 3" />
    </Icon>
  );
}

export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M13 9.5A5.5 5.5 0 116.5 3a4.5 4.5 0 006.5 6.5z" />
    </Icon>
  );
}

export function LinkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6.5 9.5l3-3M7 4.5l1-1a2.8 2.8 0 014 4l-1 1M9 11.5l-1 1a2.8 2.8 0 01-4-4l1-1" />
    </Icon>
  );
}

export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" />
    </Icon>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" />
    </Icon>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={1.6} {...props}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </Icon>
  );
}

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={1.6} {...props}>
      <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
    </Icon>
  );
}

export function FitIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={1.5} {...props}>
      <path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10" />
    </Icon>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <path d="M3.5 8.5l3 3 6-7" />
    </Icon>
  );
}

export function BulbIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 12.5h4M6.5 14.5h3M8 1.5a4.5 4.5 0 00-3 7.9c.5.5.8 1 .8 1.6h4.4c0-.6.3-1.1.8-1.6A4.5 4.5 0 008 1.5z" />
    </Icon>
  );
}

export function AlertIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3.5M8 11h.01" />
    </Icon>
  );
}

export function SproutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M8 14V8M8 8c0-2 1.3-3.3 3.5-3.3 0 2-1.3 3.3-3.5 3.3zM8 9.5C8 7.8 6.800 6.800 5 6.800c0 1.700 1.200 2.700 3 2.700z" />
    </Icon>
  );
}
