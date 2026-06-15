import Link from 'next/link';

const links = [
  {
    href: '/configuracion',
    title: 'Configuracion',
    description: 'Companias, granjas y catalogos maestros.',
  },
  { href: '/dashboard', title: 'Dashboard', description: 'Resumen operativo.' },
];

export default function MasPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-black/5">
        <h1 className="text-2xl font-bold">Mas</h1>
        <p className="text-sm text-muted">Accesos adicionales y administracion.</p>
      </div>

      <div className="grid gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl bg-surface p-4 ring-1 ring-black/5"
          >
            <h2 className="font-semibold text-primary">{link.title}</h2>
            <p className="text-sm text-muted">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
