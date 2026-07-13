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
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-foreground">
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
        <p className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {hint && !error ? <p className="text-xs leading-5 text-muted">{hint}</p> : null}
    </div>
  );
}

export const inputClassName =
  'w-full min-h-11 rounded-xl border border-primary/15 bg-background/60 px-3.5 text-base text-foreground shadow-sm shadow-primary/[0.03] outline-none transition placeholder:text-muted/70 hover:border-primary/25 focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/20';

export function getInputClassName(hasError?: boolean) {
  return hasError
    ? `${inputClassName} border-danger/60 bg-danger/[0.03] focus:border-danger focus:ring-danger/20`
    : inputClassName;
}

export function FormRequiredLegend() {
  return (
    <p className="rounded-xl bg-primary/[0.04] px-3 py-2 text-xs text-muted ring-1 ring-primary/10">
      Los campos marcados con <span className="font-semibold text-danger">*</span> son obligatorios.
    </p>
  );
}
