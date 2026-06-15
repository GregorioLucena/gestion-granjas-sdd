type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
};

export function Field({ label, htmlFor, hint, required = false, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {hint && !error ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export const inputClassName =
  'w-full min-h-11 rounded-xl border border-black/10 bg-surface px-3 text-base text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

export function getInputClassName(hasError?: boolean) {
  return hasError
    ? `${inputClassName} border-danger focus:border-danger focus:ring-danger/20`
    : inputClassName;
}

export function FormRequiredLegend() {
  return (
    <p className="text-xs text-muted">
      Los campos marcados con <span className="font-medium text-danger">*</span> son obligatorios.
    </p>
  );
}
