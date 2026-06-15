export const REQUIRED_FIELD_MESSAGE = 'Este campo es obligatorio.';

export type FieldErrors = Record<string, string>;

export function getRequiredFieldError(value: string): string | undefined {
  return value.trim() ? undefined : REQUIRED_FIELD_MESSAGE;
}

export function getEmailFieldError(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(trimmed) ? undefined : 'Ingresa un correo valido.';
}

export function clearFieldError(
  field: string,
  setFieldErrors: (value: FieldErrors | ((prev: FieldErrors) => FieldErrors)) => void,
) {
  setFieldErrors((prev) => {
    if (!prev[field]) return prev;
    const next = { ...prev };
    delete next[field];
    return next;
  });
}

export function buildOptionalStringFields(
  fields: Record<string, string>,
): Record<string, string | undefined> {
  const payload: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(fields)) {
    const trimmed = value.trim();
    payload[key] = trimmed || undefined;
  }

  return payload;
}
