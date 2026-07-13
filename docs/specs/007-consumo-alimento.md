# Spec 007: Consumo de Alimento

## Estado

Implementado MVP v1 (2026-06-17)

## Objetivo

Permitir registrar y consultar consumo de alimento por lote, descontando inventario de un
almacen y conservando trazabilidad.

Esta especificacion conecta la gestion productiva con el inventario de alimentos definido en `005-inventario-alimentos.md`.

## Dependencias

Esta especificacion depende de:

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `003-gestion-lotes.md`
- `005-inventario-alimentos.md`
- `docs/03-catalogo-maestras.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

## Alcance

Incluye:

- Registro de consumo de alimento por lote.
- Asociacion del consumo a compania, granja, almacen y alimento.
- Registro de cantidad consumida.
- Registro de fecha de consumo.
- Descuento obligatorio desde un almacen.
- Consulta de historial de consumo por lote.
- Consulta de consumo por alimento, granja, almacen y periodo.
- Anulacion de consumos registrados por error.

No incluye en esta version:

- Consumo por animal individual (fuera de MVP v1; ver `002-gestion-animales.md`).
- Formulacion de raciones.
- Recetas o mezclas automaticas de alimento.
- Planificacion automatica de alimentacion.
- Alertas de consumo fuera de rango.
- Integracion con balanzas o sensores.
- Costeo avanzado por conversion alimenticia.
- Consumo masivo por multiples lotes a la vez.

## Conceptos principales

### Consumo de alimento

Evento productivo que registra la cantidad de alimento entregada o consumida por un lote en
una fecha determinada.

### Consumo por lote

Consumo asociado a un lote.

Ejemplo:

- Un lote de engorde consume 80 kg de alimento en una fecha.

### Almacen origen

Almacen desde donde sale el alimento consumido. Permite descontar inventario.

## Datos requeridos

### Consumo de alimento

- Compania.
- Granja.
- Lote.
- Fecha de consumo.
- Alimento.
- Almacen origen obligatorio.
- Cantidad.
- Unidad de medida.
- Responsable.
- Movimiento de inventario relacionado, generado por servidor.
- Observaciones opcionales.
- Estado del consumo.
- Datos de auditoria.

## Reglas de negocio

- Todo consumo debe pertenecer a una compania y una granja.
- Todo consumo debe aplicar a un lote de la misma granja.
- El alimento debe pertenecer a la misma compania del consumo.
- El usuario debe tener permiso para registrar consumo de alimento.
- El usuario solo puede registrar consumo en granjas a las que tiene acceso.
- La cantidad consumida debe ser mayor que cero.
- La unidad de medida debe estar activa.
- El almacen origen debe pertenecer a la granja y tener existencia suficiente.
- El consumo debe generar un movimiento de inventario de tipo consumo.
- No debe permitirse registrar consumo para lotes inactivos o cerrados.
- Un consumo registrado no debe eliminarse fisicamente; si fue registrado por error, debe anularse segun `0005-auditoria-y-trazabilidad.md`.
- Al anular un consumo que afecto inventario, debe anularse o compensarse tambien el movimiento de inventario relacionado.
- El historial debe conservarse aunque el alimento o lote luego quede inactivo.

## Permisos requeridos

- `alimentacion.consumo.ver`: consultar consumos.
- `alimentacion.consumo.crear`: registrar consumos.
- `alimentacion.consumo.anular`: anular consumos registrados por error.

## Criterios de aceptacion

### CA-001: Registrar consumo por lote

Dado un lote, alimento y almacen validos, cuando se registra una cantidad positiva, entonces
el consumo queda en el historial del lote.

### CA-002: Exigir almacen

Dado un consumo sin almacen origen, cuando se intenta registrar, entonces se rechaza.

### CA-003: Descontar inventario por consumo

Dado un consumo con almacen origen y existencia suficiente, cuando el usuario registra el consumo, entonces el sistema crea o asocia un movimiento de inventario de tipo consumo y disminuye la existencia del alimento.

### CA-004: Impedir consumo sin existencia suficiente

Dado un alimento con existencia insuficiente en el almacen origen, cuando el usuario intenta registrar consumo por una cantidad mayor a la disponible, entonces el sistema debe rechazar el registro.

### CA-005: Validar lote de la misma granja

Dado un consumo asociado a una granja, cuando se selecciona un lote de otra granja, entonces
se rechaza.

### CA-006: Validar acceso por granja

Dado un usuario sin acceso a la granja del lote, cuando intenta registrar o consultar
consumo, entonces se impide la accion.

### CA-007: Consultar historial por lote

Dado un lote con consumos registrados, cuando se consulta su historial, entonces se muestra
fecha, alimento, cantidad, unidad, almacen y responsable.

### CA-008: Conservar historial

Dado un lote o alimento inactivo con consumos historicos, cuando se consulta, entonces los
registros siguen visibles.

### CA-009: Anular consumo

Dado un consumo registrado por error, cuando un usuario con permiso lo anula indicando motivo, entonces el consumo queda marcado como anulado y se conserva en el historial.

### CA-010: Anular consumo con movimiento de inventario

Dado un consumo que genero movimiento de inventario, cuando el consumo se anula, entonces el sistema debe anular o compensar el movimiento de inventario relacionado.

## Cierre de implementacion MVP v1

**Fecha de cierre:** 2026-06-17  
**Rama de trabajo:** `feature/consumo-alimento`

### Alcance real MVP v1

- Solo **consumo por lote** (no animal individual).
- **Almacen origen obligatorio** en cada registro.
- Sin etapa productiva en pantalla ni API v1.

### Entregables implementados

| Capa | Alcance |
|------|---------|
| API (`apps/api`) | Modulo `consumo`: listar, crear y anular; movimiento `SALIDA_CONSUMO` en transaccion; validacion de lote activo, stock y tenant/granja; permisos `alimentacion.consumo.*` |
| Web (`apps/web`) | Pantalla `/consumo`: registro rapido, stock visible, historial con filtro por lote, anulacion con motivo |
| Datos | Entidad `ConsumoAlimento` (migracion inicial); seed con permiso `alimentacion.consumo.anular` en perfiles demo |
| Shared | Schemas Zod en `consumo.schemas.ts`; permisos en `PERMISOS` |

### Pantallas web

- `/consumo` — registro por lote, almacen, alimento y cantidad; historial paginado; anulacion inline con confirmacion y motivo

### Verificacion de criterios de aceptacion

| ID | Estado | Notas |
|----|--------|-------|
| CA-001 | OK | Registro por lote activo con cantidad > 0 |
| CA-002 | OK | Almacen origen obligatorio |
| CA-003 | OK | Crea `SALIDA_CONSUMO` y descuenta existencia en transaccion |
| CA-004 | OK | Error `CONSUMO_STOCK_INSUFICIENTE` |
| CA-005 | OK | Lote debe pertenecer a la granja del consumo |
| CA-006 | OK | `requireGranjaAccess` en listar, crear y anular |
| CA-007 | OK | Historial por lote con fecha, alimento, cantidad, unidad y almacen |
| CA-008 | OK | Historial preservado con maestras o lote inactivos |
| CA-009 | OK | Anulacion con motivo; registro conservado |
| CA-010 | OK | Anula tambien el `MovimientoInventario` vinculado |

### Verificacion tecnica

- [x] `pnpm run typecheck`
- [x] Prueba manual funcional (reiniciar API tras agregar `ConsumoModule`; re-login tras seed si faltan permisos)

### Dependencias para modulos siguientes (no bloquean cierre de spec)

- **Reportes (`015`):** consumiran `consumos_alimento` y movimientos asociados.
- **Engorde (`012`):** el consumo no requiere engorde iniciado. El resumen de un engorde
  incluye consumos no anulados del lote con fecha desde el inicio hasta el cierre o la fecha
  actual; consumos anteriores quedan fuera.
- **Etapa productiva:** campo no modelado en v1.

### Mejoras opcionales pospuestas

- Consumo por animal individual.
- Filtro por alimento o rango de fechas en historial.
- Costo unitario visible en listado (desde movimiento asociado).
- Metrica «Consumo hoy» en dashboard.
- Tests automatizados de `consumo.rules.ts`.

## Preguntas abiertas

Resueltas para MVP v1 (ver `docs/06-cierre-sdd.md`):

| Pregunta | Decision MVP v1 |
|----------|-----------------|
| Consumo sin almacen origen? | No. Todo consumo debe descontar inventario de un almacen. |
| Consumo estimado? | No. Cantidad exacta requerida. |
| Etapa productiva obligatoria? | No en v1. |
| Costo del consumo? | Costo del movimiento de inventario asociado cuando exista. |
| Consumo masivo por lotes? | No en v1. |

Pendientes para fases posteriores:

- Consumo por animal individual.
- Etapa productiva obligatoria por tipo de animal o finalidad.
- Costo promedio del alimento en reportes.

## Decisiones tomadas

- El consumo de alimento sera un evento historico.
- En MVP v1 el consumo aplica solo a lote.
- Todo consumo descuenta inventario desde un almacen origen.
- El consumo no se elimina fisicamente; se anula con trazabilidad.
- El consumo alimentara futuros reportes de costos y productividad.
