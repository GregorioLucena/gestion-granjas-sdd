import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="max-w-md space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Gestion de Granjas</p>
        <h1 className="text-3xl font-bold text-foreground">Tu granja, bajo control</h1>
        <p className="text-muted">
          Plataforma mobile-first para lotes, inventario, consumo, engorde y reportes productivos.
        </p>
      </div>
      <Link
        href="/login"
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
      >
        Iniciar sesion
      </Link>
    </main>
  );
}
