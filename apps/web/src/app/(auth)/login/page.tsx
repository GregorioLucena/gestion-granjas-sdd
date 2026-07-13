import { Suspense } from 'react';
import { LoginForm } from './login-form';

function LoginFallback() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <section className="w-full max-w-sm space-y-6 rounded-[2rem] bg-surface/95 p-6 shadow-lg ring-1 ring-primary/10">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl font-semibold">Iniciar sesion</h1>
          <p className="text-sm text-muted">Cargando...</p>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
