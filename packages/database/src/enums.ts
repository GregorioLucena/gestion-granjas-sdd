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

export enum TipoRecomendacion {
  CONSUMO_DESVIO = 'CONSUMO_DESVIO',
  STOCK_REPOSICION = 'STOCK_REPOSICION',
  EVALUACION_CIERRE = 'EVALUACION_CIERRE',
}

export enum CicloRecomendacion {
  OPERATIVO = 'OPERATIVO',
  TACTICO = 'TACTICO',
  ESTRATEGICO = 'ESTRATEGICO',
}

export enum SeveridadRecomendacion {
  INFO = 'INFO',
  ADVERTENCIA = 'ADVERTENCIA',
  CRITICA = 'CRITICA',
}

export enum EstadoRecomendacion {
  PENDIENTE = 'PENDIENTE',
  EN_COLA = 'EN_COLA',
  ACEPTADA = 'ACEPTADA',
  DESCARTADA = 'DESCARTADA',
  ACEPTADA_EN_EVALUACION = 'ACEPTADA_EN_EVALUACION',
  CERRADA = 'CERRADA',
  SUPERSEDED = 'SUPERSEDED',
}

export enum DecisionFeedback {
  ACEPTADA = 'ACEPTADA',
  DESCARTADA = 'DESCARTADA',
}

/** Origen del texto "por que lo sugerimos". El calculo nunca sale del modelo. */
export enum FuenteMensaje {
  PLANTILLA = 'PLANTILLA',
  OLLAMA = 'OLLAMA',
  OPENAI = 'OPENAI',
}
