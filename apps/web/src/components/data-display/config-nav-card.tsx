import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

type ConfigNavCardProps = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentClass?: string;
};

export function ConfigNavCard({
  href,
  title,
  description,
  icon: Icon,
  accentClass = 'bg-primary/10 text-primary',
}: ConfigNavCardProps) {
  return (
    <Link
      href={href}
      className="group flex min-h-[72px] items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:ring-primary/25"
    >
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${accentClass}`}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-foreground">{title}</span>
        <span className="block text-sm text-muted">{description}</span>
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-muted transition group-hover:text-primary"
        aria-hidden
      />
    </Link>
  );
}
