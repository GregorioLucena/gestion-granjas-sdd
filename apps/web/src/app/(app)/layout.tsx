import Link from 'next/link';

const navItems = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/lotes', label: 'Lotes' },
  { href: '/inventario', label: 'Inventario' },
  { href: '/consumo', label: 'Consumo' },
  { href: '/mas', label: 'Mas' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-surface/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Granja activa</p>
            <p className="text-sm font-medium">Seleccion pendiente</p>
          </div>
          <span className="rounded-full bg-secondary/30 px-3 py-1 text-xs font-medium">MVP v1</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 p-4 pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-black/5 bg-surface md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium text-muted"
              >
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
