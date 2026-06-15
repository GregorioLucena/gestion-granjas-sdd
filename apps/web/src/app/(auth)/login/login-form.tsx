'use client';

import { FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PASSWORD_POLICY_MESSAGE } from '@gestion-granjas/shared/schemas/seguridad.schemas';
import { Field, FormRequiredLegend, getInputClassName } from '@/components/forms/field';
import { PasswordInput } from '@/components/forms/password-input';
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
    <main className="flex min-h-dvh items-center justify-center p-6">
      <section className="w-full max-w-sm space-y-6 rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-black/5">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Iniciar sesion</h1>
          <p className="text-sm text-muted">Accede con tu correo y contrasena.</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <FormRequiredLegend />

          <Field
            label="Correo electronico"
            htmlFor="email"
            required
            error={fieldErrors.email}
          >
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Ingresando...' : 'Iniciar sesion'}
          </button>
        </form>

        <p className="text-xs text-muted">{PASSWORD_POLICY_MESSAGE}</p>
        {searchParams.get('next') ? (
          <p className="text-xs text-muted">Tras iniciar sesion volveras a tu pantalla anterior.</p>
        ) : null}
      </section>
    </main>
  );
}
