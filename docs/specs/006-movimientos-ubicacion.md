# Spec 006: Movimientos de Ubicacion

## Estado

Borrador inicial

## Objetivo

Permitir registrar y consultar movimientos de ubicacion de animales individuales y lotes dentro de una granja, manteniendo trazabilidad de origen, destino, fecha, responsable y motivo.

Esta especificacion evita que la ubicacion actual sea solo un dato editable sin historial.

## Dependencias

Esta especificacion depende de:

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `002-gestion-animales.md`
- `003-gestion-lotes.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

## Alcance

Incluye:

- Registro de movimientos de ubicacion de animales individuales.
- Registro de movimientos de ubicacion de lotes.
- Actualizacion de ubicacion actual del animal o lote.
- Consulta de historial de ubicaciones.
- Validacion de acceso por compania y granja.
- Anulacion de movimientos registrados por error.

No incluye en esta version:

- Traslado entre granjas.
- Traslado entre companias.
- Division o fusion de lotes.
- Movimientos masivos complejos.
- Control automatico de capacidad de ubicaciones.

## Conceptos principales

### Movimiento de ubicacion

Evento fechado que registra el cambio de ubicacion de un animal o lote dentro de la misma granja.

### Ubicacion origen

Ubicacion donde se encontraba el animal o lote antes del movimiento. Puede ser opcional si es el primer movimiento registrado.

### Ubicacion destino

Ubicacion a la que se mueve el animal o lote.

### Motivo de movimiento

Razon del cambio de ubicacion.

Ejemplos:

- Inicio de gestacion.
- Paso a sala de parto.
- Destete.
- Cambio a engorde.
- Limpieza de corral.
- Manejo sanitario.
- Reorganizacion interna.

## Datos requeridos

### Movimiento de ubicacion

- Compania.
- Granja.
- Animal o lote.
- Ubicacion origen opcional.
- Ubicacion destino.
- Fecha del movimiento.
- Motivo de movimiento opcional.
- Responsable.
- Observaciones opcionales.
- Estado del movimiento.
- Datos de auditoria.

## Reglas de negocio

- Todo movimiento de ubicacion debe pertenecer a una compania y granja.
- El movimiento debe aplicar a un animal individual o a un lote, pero no a ambos al mismo tiempo.
- El animal o lote debe pertenecer a la misma granja del movimiento.
- La ubicacion destino debe pertenecer a la misma granja del movimiento.
- Si existe ubicacion origen, debe pertenecer a la misma granja del movimiento.
- El usuario debe tener permiso para registrar movimientos de ubicacion.
- El usuario solo puede registrar movimientos en granjas a las que tiene acceso.
- No debe permitirse mover un animal o lote inactivo, salvo que una especificacion futura lo permita.
- No debe permitirse registrar un movimiento hacia la misma ubicacion actual sin motivo justificado.
- Al registrar un movimiento valido, la ubicacion actual del animal o lote debe actualizarse a la ubicacion destino.
- El movimiento debe quedar en el historial de ubicaciones del animal o lote.
- Un movimiento no debe eliminarse fisicamente; si fue registrado por error, debe anularse con motivo.
- Si se anula el ultimo movimiento vigente, la ubicacion actual debe recalcularse o requerir correccion manual controlada.

## Permisos requeridos

- `ubicaciones.movimientos.ver`: consultar historial de movimientos.
- `ubicaciones.movimientos.crear`: registrar movimientos.
- `ubicaciones.movimientos.anular`: anular movimientos registrados por error.

## Criterios de aceptacion

### CA-001: Registrar movimiento de animal

Dado un animal activo con acceso permitido al usuario, cuando el usuario registra un movimiento hacia una ubicacion valida de la misma granja, entonces el movimiento queda guardado y la ubicacion actual del animal se actualiza.

### CA-002: Registrar movimiento de lote

Dado un lote activo con acceso permitido al usuario, cuando el usuario registra un movimiento hacia una ubicacion valida de la misma granja, entonces el movimiento queda guardado y la ubicacion actual del lote se actualiza.

### CA-003: Validar ubicacion de la misma granja

Dado un animal o lote de una granja, cuando el usuario intenta moverlo a una ubicacion de otra granja, entonces el sistema debe rechazar el movimiento.

### CA-004: Validar acceso por granja

Dado un usuario sin acceso a la granja del animal o lote, cuando intenta registrar un movimiento de ubicacion, entonces el sistema debe impedir la accion.

### CA-005: Consultar historial de ubicaciones

Dado un animal o lote con movimientos registrados, cuando el usuario consulta su historial de ubicaciones, entonces el sistema muestra fecha, origen, destino, responsable, motivo y observaciones.

### CA-006: Anular movimiento

Dado un movimiento registrado por error, cuando un usuario con permiso lo anula indicando motivo, entonces el movimiento queda marcado como anulado y se conserva en el historial.

### CA-007: Impedir movimiento de entidad inactiva

Dado un animal o lote inactivo, cuando el usuario intenta registrar un movimiento de ubicacion, entonces el sistema debe rechazar la accion.

## Preguntas abiertas

- Se permitiran movimientos entre granjas en una fase futura?
- El sistema debe controlar capacidad maxima de una ubicacion?
- Se permitiran movimientos masivos simples desde el MVP?
- La anulacion del ultimo movimiento debe recalcular automaticamente la ubicacion actual o requerir correccion manual?

## Decisiones tomadas

- La ubicacion actual de animales y lotes debe tener historial.
- Los movimientos de ubicacion son eventos historicos, no maestras.
- En el MVP solo se permitiran movimientos dentro de la misma granja.
- Los movimientos de ubicacion seguiran la decision `0005-auditoria-y-trazabilidad.md`.
