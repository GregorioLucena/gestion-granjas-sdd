'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthGuard } from '@/components/auth/auth-guard';
import { GranjaSelector } from '@/components/auth/granja-selector';
import { HeaderSession } from '@/components/auth/header-session';
import { APP_NAV_ITEMS, isNavItemActive } from '@/components/layout/app-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthGuard>
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-20 border-b border-primary/10 bg-surface/85 shadow-sm shadow-primary/5 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <GranjaSelector />
            </div>
            <HeaderSession />
          </div>

          {/* Desktop nav — guia UX: navegacion clara desde md */}
          <nav
            className="hidden border-t border-primary/8 md:block"
            aria-label="Navegacion principal"
          >
            <ul className="mx-auto flex max-w-5xl gap-1 px-4 py-2">
              {APP_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(pathname, item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition ${
                        active
                          ? 'bg-primary text-white shadow-sm shadow-primary/25'
                          : 'text-muted hover:bg-primary/8 hover:text-primary'
                      }`}
                    >
                      <Icon className="size-4" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 p-4 pb-28 md:pb-8">{children}</main>

        {/* Mobile bottom nav */}
        <nav
          className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
          aria-label="Navegacion principal"
        >
          <ul className="mx-auto grid max-w-lg grid-cols-5 rounded-2xl bg-surface/95 p-1.5 shadow-[0_-8px_40px_rgba(11,77,49,0.12)] ring-1 ring-primary/10 backdrop-blur-xl">
            {APP_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isNavItemActive(pathname, item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-semibold transition ${
                      active
                        ? 'bg-primary text-white shadow-md shadow-primary/25'
                        : 'text-muted hover:bg-primary/5 hover:text-primary'
                    }`}
                  >
                    <Icon className="size-4" aria-hidden />
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
