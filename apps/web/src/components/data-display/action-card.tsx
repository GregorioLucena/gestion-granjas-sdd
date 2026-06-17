import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

type ActionTone = 'primary' | 'secondary' | 'accent' | 'success' | 'info';

type ActionCardProps = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: ActionTone;
};

const toneClasses: Record<ActionTone, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/30 text-primary-dark',
  accent: 'bg-accent/10 text-accent',
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
};

export function ActionCard({
  href,
  title,
  description,
  icon: Icon,
  tone = 'primary',
}: ActionCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:ring-primary/25"
    >
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-foreground">{title}</span>
        <span className="mt-1 block text-sm text-muted">{description}</span>
      </span>
      <ChevronRight
        className="mt-2 size-5 shrink-0 text-muted transition group-hover:text-primary"
        aria-hidden
      />
    </Link>
  );
}
