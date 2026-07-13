import type { FormEventHandler, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { FormRequiredLegend } from '@/components/forms/field';

export const formShellClassName =
  'space-y-4 rounded-3xl bg-surface/95 p-4 shadow-sm ring-1 ring-primary/10 sm:p-5';

export const formPanelWarningClassName =
  'space-y-4 rounded-3xl bg-surface/95 p-4 shadow-sm ring-1 ring-warning/25 sm:p-5';

type FormHeaderProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function FormHeader({ title, description, children }: FormHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-primary/8 pb-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? <p className="mt-1 text-xs leading-5 text-muted">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

type FormActionsProps = {
  onCancel: () => void;
  submitLabel: string;
  loadingLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  submitDisabled?: boolean;
};

export function FormActions({
  onCancel,
  submitLabel,
  loadingLabel = 'Guardando...',
  cancelLabel = 'Cancelar',
  loading = false,
  submitDisabled = false,
}: FormActionsProps) {
  return (
    <div className="flex gap-2 border-t border-primary/8 pt-4">
      <Button type="button" variant="outline" fullWidth onClick={onCancel} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button type="submit" fullWidth disabled={loading || submitDisabled}>
        {loading ? loadingLabel : submitLabel}
      </Button>
    </div>
  );
}

type FormShellProps = {
  onSubmit: FormEventHandler<HTMLFormElement>;
  title: string;
  description?: string;
  headerExtra?: ReactNode;
  showRequiredLegend?: boolean;
  children: ReactNode;
  onCancel: () => void;
  submitLabel: string;
  loadingLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  submitDisabled?: boolean;
  className?: string;
};

/**
 * Contenedor estandar de formularios ABM / operativos.
 * Unifica card, titulo, leyenda de obligatorios y acciones.
 */
export function FormShell({
  onSubmit,
  title,
  description,
  headerExtra,
  showRequiredLegend = true,
  children,
  onCancel,
  submitLabel,
  loadingLabel,
  cancelLabel,
  loading,
  submitDisabled,
  className = formShellClassName,
}: FormShellProps) {
  return (
    <form onSubmit={onSubmit} className={className}>
      <FormHeader title={title} description={description}>
        {headerExtra}
      </FormHeader>
      {showRequiredLegend ? <FormRequiredLegend /> : null}
      <div className="space-y-4">{children}</div>
      <FormActions
        onCancel={onCancel}
        submitLabel={submitLabel}
        loadingLabel={loadingLabel}
        cancelLabel={cancelLabel}
        loading={loading}
        submitDisabled={submitDisabled}
      />
    </form>
  );
}
