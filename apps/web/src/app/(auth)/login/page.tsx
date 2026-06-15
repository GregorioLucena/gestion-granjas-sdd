import { Suspense } from 'react';
import { LoginForm } from './login-form';

function LoginFallback() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <section className="w-full max-w-sm space-y-6 rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-black/5">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Iniciar sesion</h1>
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
