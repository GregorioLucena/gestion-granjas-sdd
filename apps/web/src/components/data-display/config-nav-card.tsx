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
  accentClass = 'bg-primary/10 text-primary ring-primary/15',
}: ConfigNavCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-20 items-center gap-3 overflow-hidden rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-primary/10 transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/10 hover:ring-primary/25"
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-primary/60 opacity-0 transition group-hover:opacity-100" />
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1 transition group-hover:scale-105 ${accentClass}`}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block text-sm leading-5 text-muted">{description}</span>
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden
      />
    </Link>
  );
}
