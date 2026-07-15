export enum EstadoRegistro {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
}

export enum EstadoUsuario {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  BLOQUEADO = 'BLOQUEADO',
}

export enum EstadoLote {
  ACTIVO = 'ACTIVO',
  CERRADO = 'CERRADO',
  CANCELADO = 'CANCELADO',
}

export enum EstadoEngorde {
  EN_CURSO = 'EN_CURSO',
  CERRADO = 'CERRADO',
  ANULADO = 'ANULADO',
}

export enum MomentoControlPeso {
  INICIAL = 'INICIAL',
  INTERMEDIO = 'INTERMEDIO',
  FINAL = 'FINAL',
}

export enum ModalidadControlPeso {
  PROMEDIO_LOTE = 'PROMEDIO_LOTE',
  MUESTRA = 'MUESTRA',
}

export enum OrigenControlPeso {
  ENGORDE_INICIO = 'ENGORDE_INICIO',
  MANUAL = 'MANUAL',
  ENGORDE_CIERRE = 'ENGORDE_CIERRE',
}

export enum SignoMovimiento {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
}
