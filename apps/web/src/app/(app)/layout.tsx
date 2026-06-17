'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Layers3, MoreHorizontal, PackageOpen, Wheat } from 'lucide-react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { GranjaSelector } from '@/components/auth/granja-selector';
import { HeaderSession } from '@/components/auth/header-session';

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/lotes', label: 'Lotes', icon: Layers3 },
  { href: '/inventario', label: 'Inventario', icon: PackageOpen },
  { href: '/consumo', label: 'Consumo', icon: Wheat },
  { href: '/mas', label: 'Mas', icon: MoreHorizontal },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthGuard>
      <div className="flex min-h-dvh flex-col bg-background bg-[radial-gradient(circle_at_top_left,rgba(242,201,76,0.18),transparent_32rem)]">
        <header className="sticky top-0 z-10 border-b border-primary/10 bg-surface/90 px-4 py-3 shadow-sm shadow-primary/5 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <GranjaSelector />
            </div>
            <HeaderSession />
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 p-4 pb-24">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 border-t border-primary/10 bg-surface/95 shadow-[0_-12px_30px_rgba(20,90,56,0.08)] backdrop-blur md:hidden">
          <ul className="mx-auto grid max-w-lg grid-cols-5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold transition ${
                      isActive ? 'text-primary' : 'text-muted hover:text-primary'
                    }`}
                  >
                    <span
                      className={`flex size-8 items-center justify-center rounded-xl transition ${
                        isActive ? 'bg-primary/10 ring-1 ring-primary/15' : 'bg-transparent'
                      }`}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </AuthGuard>
  );
}
