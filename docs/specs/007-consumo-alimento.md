# Spec 007: Consumo de Alimento

## Estado

Borrador inicial

## Objetivo

Permitir registrar y consultar el consumo de alimento por animal individual o por lote, manteniendo trazabilidad por compania, granja, almacen, alimento, fecha, responsable y etapa productiva.

Esta especificacion conecta la gestion productiva con el inventario de alimentos definido en `005-inventario-alimentos.md`.

## Dependencias

Esta especificacion depende de:

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `002-gestion-animales.md`
- `003-gestion-lotes.md`
- `005-inventario-alimentos.md`
- `docs/03-catalogo-maestras.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

## Alcance

Incluye:

- Registro de consumo de alimento por animal individual.
- Registro de consumo de alimento por lote.
- Asociacion del consumo a compania, granja, almacen y alimento.
- Registro de cantidad consumida.
- Registro de fecha de consumo.
- Asociacion opcional a etapa productiva.
- Descuento de inventario cuando el consumo se registra desde un almacen.
- Consulta de historial de consumo por animal.
- Consulta de historial de consumo por lote.
- Consulta de consumo por alimento, granja, almacen y periodo.
- Anulacion de consumos registrados por error.

No incluye en esta version:

- Formulacion de raciones.
- Recetas o mezclas automaticas de alimento.
- Planificacion automatica de alimentacion.
- Alertas de consumo fuera de rango.
- Integracion con balanzas o sensores.
- Costeo avanzado por conversion alimenticia.
- Consumo masivo por multiples lotes a la vez.

## Conceptos principales

### Consumo de alimento

Evento productivo que registra la cantidad de alimento entregada o consumida por un animal o lote en una fecha determinada.

### Consumo individual

Consumo asociado a un animal individual.

Ejemplo:

- Una cerda en gestacion consume 2.5 kg de alimento de gestacion en una fecha.

### Consumo por lote

Consumo asociado a un lote.

Ejemplo:

- Un lote de engorde consume 80 kg de alimento en una fecha.

### Almacen origen

Almacen desde donde sale el alimento consumido. Permite descontar inventario.

### Etapa productiva

Fase productiva asociada al consumo, como gestacion, lactancia, destete, crecimiento o engorde.

## Datos requeridos

### Consumo de alimento

- Compania.
- Granja.
- Animal o lote.
- Fecha de consumo.
- Alimento.
- Almacen origen opcional.
- Cantidad.
- Unidad de medida.
- Etapa productiva opcional.
- Responsable.
- Movimiento de inventario relacionado opcional.
- Observaciones opcionales.
- Estado del consumo.
- Datos de auditoria.

## Reglas de negocio

- Todo consumo debe pertenecer a una compania y una granja.
- Todo consumo debe aplicar a un animal individual o a un lote, pero no a ambos al mismo tiempo.
- El animal o lote debe pertenecer a la misma granja del consumo.
- El alimento debe pertenecer a la misma compania del consumo.
- El usuario debe tener permiso para registrar consumo de alimento.
- El usuario solo puede registrar consumo en granjas a las que tiene acceso.
- La cantidad consumida debe ser mayor que cero.
- La unidad de medida debe estar activa.
- Si se informa almacen origen, el almacen debe pertenecer a la misma granja del consumo.
- Si se informa almacen origen, el sistema debe validar existencia suficiente antes de registrar el consumo.
- Si se informa almacen origen, el consumo debe generar o asociarse a un movimiento de inventario de tipo consumo.
- No debe permitirse registrar consumo para animales o lotes inactivos, cerrados, vendidos, muertos o descartados.
- Un consumo registrado no debe eliminarse fisicamente; si fue registrado por error, debe anularse segun `0005-auditoria-y-trazabilidad.md`.
- Al anular un consumo que afecto inventario, debe anularse o compensarse tambien el movimiento de inventario relacionado.
- El historial de consumo debe conservarse aunque el alimento, animal o lote luego quede inactivo.
- La etapa productiva debe venir de maestra cuando se informe.

## Permisos requeridos

- `alimentacion.consumo.ver`: consultar consumos.
- `alimentacion.consumo.crear`: registrar consumos.
- `alimentacion.consumo.anular`: anular consumos registrados por error.

## Criterios de aceptacion

### CA-001: Registrar consumo por animal

Dado un animal activo, un alimento activo y un usuario con permisos, cuando el usuario registra un consumo con cantidad mayor que cero, entonces el consumo queda en el historial del animal.

### CA-002: Registrar consumo por lote

Dado un lote activo, un alimento activo y un usuario con permisos, cuando el usuario registra un consumo con cantidad mayor que cero, entonces el consumo queda en el historial del lote.

### CA-003: Descontar inventario por consumo

Dado un consumo con almacen origen y existencia suficiente, cuando el usuario registra el consumo, entonces el sistema crea o asocia un movimiento de inventario de tipo consumo y disminuye la existencia del alimento.

### CA-004: Impedir consumo sin existencia suficiente

Dado un alimento con existencia insuficiente en el almacen origen, cuando el usuario intenta registrar consumo por una cantidad mayor a la disponible, entonces el sistema debe rechazar el registro.

### CA-005: Validar animal o lote de la misma granja

Dado un consumo asociado a una granja, cuando el usuario selecciona un animal o lote de otra granja, entonces el sistema debe rechazar el registro.

### CA-006: Validar acceso por granja

Dado un usuario sin acceso a la granja del animal o lote, cuando intenta registrar o consultar consumo, entonces el sistema debe impedir la accion.

### CA-007: Consultar historial por animal

Dado un animal con consumos registrados, cuando el usuario consulta su historial de alimentacion, entonces el sistema muestra fecha, alimento, cantidad, unidad, almacen, etapa productiva y responsable.

### CA-008: Consultar historial por lote

Dado un lote con consumos registrados, cuando el usuario consulta su historial de alimentacion, entonces el sistema muestra fecha, alimento, cantidad, unidad, almacen, etapa productiva y responsable.

### CA-009: Anular consumo

Dado un consumo registrado por error, cuando un usuario con permiso lo anula indicando motivo, entonces el consumo queda marcado como anulado y se conserva en el historial.

### CA-010: Anular consumo con movimiento de inventario

Dado un consumo que genero movimiento de inventario, cuando el consumo se anula, entonces el sistema debe anular o compensar el movimiento de inventario relacionado.

## Preguntas abiertas

- El consumo sin almacen origen estara permitido en el MVP o siempre debe descontar inventario?
- Se permitira registrar consumo estimado cuando no se conozca la cantidad exacta?
- La etapa productiva sera obligatoria para ciertos tipos de animales o finalidades?
- El costo del consumo se calculara con costo del movimiento de inventario o con costo promedio del alimento?
- Se permitira registrar consumo masivo para varios lotes en una fase futura?

## Decisiones tomadas

- El consumo de alimento sera un evento historico.
- El consumo puede aplicar a animal individual o lote.
- El consumo puede descontar inventario cuando se indique almacen origen.
- El consumo no se elimina fisicamente; se anula con trazabilidad.
- El consumo alimentara futuros reportes de costos y productividad.
