import { BusinessRuleError } from '@gestion-granjas/shared/errors';

export function assertCantidadInicialValida(cantidadInicial: number) {
  if (!Number.isInteger(cantidadInicial) || cantidadInicial <= 0) {
    throw new BusinessRuleError(
      'LOTE_CANTIDAD_INICIAL_INVALIDA',
      'La cantidad inicial debe ser mayor que cero.',
    );
  }
}
