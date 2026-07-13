'use client';

import { FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Sprout, Wheat } from 'lucide-react';
import { PASSWORD_POLICY_MESSAGE } from '@gestion-granjas/shared/schemas/seguridad.schemas';
import { Field, FormRequiredLegend, getInputClassName } from '@/components/forms/field';
import { PasswordInput } from '@/components/forms/password-input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { getApiErrorMessage } from '@/lib/api-client';
import {
  clearFieldError,
  getEmailFieldError,
  getRequiredFieldError,
  type FieldErrors,
} from '@/lib/form-validation';

export function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const errors: FieldErrors = {};
    const emailError = getRequiredFieldError(email) ?? getEmailFieldError(email);
    if (emailError) errors.email = emailError;
    const passwordError = getRequiredFieldError(password);
    if (passwordError) errors.password = passwordError;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const next = searchParams.get('next');
    const redirectTo = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

    try {
      await login({ email: email.trim(), password }, redirectTo);
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'No se pudo iniciar sesion.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden p-5 sm:p-8">
      <div className="pointer-events-none absolute inset-0 app-horizon" aria-hidden />
      <div
        className="pointer-events-none absolute -left-24 top-24 size-72 rounded-full bg-secondary/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-10 size-80 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />

      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-surface/95 shadow-[0_30px_80px_rgba(11,77,49,0.18)] ring-1 ring-primary/10 md:grid-cols-[1.08fr_0.92fr]">
        <div className="brand-panel relative hidden min-h-[34rem] overflow-hidden p-8 text-white md:flex md:flex-col md:justify-between">
          <div className="relative z-10 space-y-8">
            <div className="inline-flex items-center gap-3">
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                <Sprout className="size-6" aria-hidden />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                  Producto
                </p>
                <p className="font-display text-2xl font-semibold tracking-tight">
                  Gestion de Granjas
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="font-display max-w-md text-4xl font-semibold leading-[1.1] tracking-tight lg:text-5xl">
                Decide en el campo con datos claros.
              </h1>
              <p className="max-w-sm text-sm leading-7 text-white/80">
                Lotes, alimento, consumo y engorde en una experiencia hecha para trabajar rapido
                desde el telefono.
              </p>
            </div>
          </div>

          <div className="relative z-10 grid gap-3">
            {[
              { icon: Wheat, text: 'Inventario y consumo siempre a la mano' },
              { icon: ShieldCheck, text: 'Acceso seguro por compania y granja' },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.text}
                  className="flex items-center gap-3 rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/15 backdrop-blur-sm"
                >
                  <span className="flex size-9 items-center justify-center rounded-xl bg-white/15 text-white">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6 p-6 sm:p-9">
          <div className="space-y-3 text-center md:text-left">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15 md:mx-0 md:hidden">
              <Sprout className="size-6" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary md:hidden">
                Gestion de Granjas
              </p>
              <h2 className="font-display mt-1 text-3xl font-semibold tracking-tight">
                Iniciar sesion
              </h2>
              <p className="mt-1.5 text-sm text-muted">Entra con tu correo y contrasena.</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <FormRequiredLegend />

            <Field label="Correo electronico" htmlFor="email" required error={fieldErrors.email}>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email', setFieldErrors);
                }}
                className={getInputClassName(Boolean(fieldErrors.email))}
              />
            </Field>

            <Field label="Contrasena" htmlFor="password" required error={fieldErrors.password}>
              <PasswordInput
                id="password"
                value={password}
                autoComplete="current-password"
                hasError={Boolean(fieldErrors.password)}
                onChange={(value) => {
                  setPassword(value);
                  clearFieldError('password', setFieldErrors);
                }}
              />
            </Field>

            {formError ? (
              <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger ring-1 ring-danger/15">
                {formError}
              </p>
            ) : null}

            <Button type="submit" disabled={isSubmitting} fullWidth>
              {isSubmitting ? 'Ingresando...' : 'Entrar a la granja'}
            </Button>
          </form>

          <div className="rounded-2xl bg-background/80 p-3.5 text-xs leading-5 text-muted ring-1 ring-primary/10">
            <p>{PASSWORD_POLICY_MESSAGE}</p>
            {searchParams.get('next') ? (
              <p className="mt-2">Tras iniciar sesion volveras a tu pantalla anterior.</p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
