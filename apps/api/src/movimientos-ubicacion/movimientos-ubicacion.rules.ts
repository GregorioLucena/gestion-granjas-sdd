import { BusinessRuleError, ConflictError } from '@gestion-granjas/shared/errors';
import type { Lote, MovimientoUbicacion } from '@gestion-granjas/database/entities';
import { EstadoLote, EstadoRegistro } from '@gestion-granjas/database/enums';

export function assertLoteMovible(lote: Lote): void {
  if (
    lote.estadoRegistro !== EstadoRegistro.ACTIVO ||
    lote.estadoOperativo !== EstadoLote.ACTIVO
  ) {
    throw new ConflictError(
      'MOV_UBICACION_ENTIDAD_INACTIVA',
      'No puede mover un lote inactivo o cerrado.',
    );
  }
}

export function assertDestinoDistinto(
  ubicacionActualId: string | undefined | null,
  ubicacionDestinoId: string,
): void {
  if (ubicacionActualId && ubicacionActualId === ubicacionDestinoId) {
    throw new BusinessRuleError(
      'MOV_UBICACION_DESTINO_IGUAL',
      'La ubicacion destino es la misma que la actual.',
    );
  }
}

export function assertFechaMovimiento(params: {
  fecha: string;
  fechaInicioLote: string;
  fechaUltimoVigente?: string | null;
}): void {
  const hoy = new Date().toISOString().slice(0, 10);
  if (params.fecha > hoy) {
    throw new BusinessRuleError(
      'MOV_UBICACION_FECHA_INVALIDA',
      'La fecha no puede ser futura.',
    );
  }
  if (params.fecha < params.fechaInicioLote) {
    throw new BusinessRuleError(
      'MOV_UBICACION_FECHA_INVALIDA',
      'La fecha no puede ser anterior al inicio del lote.',
    );
  }
  if (params.fechaUltimoVigente && params.fecha < params.fechaUltimoVigente) {
    throw new BusinessRuleError(
      'MOV_UBICACION_FECHA_INVALIDA',
      'La fecha no puede ser anterior al ultimo movimiento vigente.',
    );
  }
}

export function assertEsUltimoVigente(
  movimiento: MovimientoUbicacion,
  ultimoVigente: MovimientoUbicacion | null,
): void {
  if (!ultimoVigente || ultimoVigente.id !== movimiento.id) {
    throw new ConflictError(
      'MOV_UBICACION_NO_ES_ULTIMO',
      'Solo puede anular el ultimo movimiento vigente.',
    );
  }
}
