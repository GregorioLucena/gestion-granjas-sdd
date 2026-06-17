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
    <main className="flex min-h-dvh items-center justify-center bg-background bg-[radial-gradient(circle_at_top_left,rgba(242,201,76,0.28),transparent_24rem),radial-gradient(circle_at_bottom_right,rgba(31,122,77,0.18),transparent_26rem)] p-6">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-4xl bg-surface shadow-xl shadow-primary/10 ring-1 ring-primary/10 md:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden min-h-136 overflow-hidden bg-primary p-8 text-white md:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(242,201,76,0.35),transparent_14rem),radial-gradient(circle_at_80%_80%,rgba(249,115,22,0.28),transparent_15rem)]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="space-y-5">
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                <Sprout className="size-6" aria-hidden />
              </span>
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
                  Gestion de granjas
                </p>
                <h1 className="max-w-md text-4xl font-bold tracking-tight">
                  Control productivo claro para decidir a tiempo.
                </h1>
                <p className="max-w-sm text-sm leading-6 text-white/80">
                  Lotes, alimento, consumo y engorde en una experiencia pensada para trabajar rapido
                  desde la granja.
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {[
                { icon: Wheat, text: 'Inventario y consumo siempre visibles' },
                { icon: ShieldCheck, text: 'Acceso seguro por compania y granja' },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.text}
                    className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15"
                  >
                    <span className="flex size-9 items-center justify-center rounded-xl bg-white/15">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div className="space-y-2 text-center md:text-left">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15 md:mx-0">
              <Sprout className="size-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-bold">Iniciar sesion</h1>
              <p className="mt-1 text-sm text-muted">Accede con tu correo y contrasena.</p>
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
              <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{formError}</p>
            ) : null}

            <Button type="submit" disabled={isSubmitting} fullWidth>
              {isSubmitting ? 'Ingresando...' : 'Iniciar sesion'}
            </Button>
          </form>

          <div className="rounded-2xl bg-background p-3 text-xs text-muted ring-1 ring-black/5">
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
