# Decision 0005: Auditoria y Trazabilidad

## Estado

Aceptada

## Contexto

El sistema registrara informacion productiva, sanitaria, reproductiva, alimentaria e inventario. Muchos de esos registros afectan historiales, costos, existencias y decisiones de manejo.

Si estos datos se eliminan fisicamente o se modifican sin trazabilidad, se pierde confianza en la informacion.

## Decision

El sistema usara auditoria transversal para entidades y eventos relevantes.

Toda entidad administrada por ABM debe guardar:

- Creado por.
- Fecha de creacion.
- Actualizado por.
- Fecha de actualizacion.
- Estado de registro.

Todo evento, movimiento o registro historico relevante debe guardar:

- Creado por.
- Fecha de creacion.
- Anulado por, cuando aplique.
- Fecha de anulacion, cuando aplique.
- Motivo de anulacion, cuando aplique.

No se deben eliminar fisicamente eventos o movimientos que formen parte del historial productivo, sanitario, reproductivo o de inventario. En esos casos se debe anular el registro o crear un movimiento correctivo.

## Consecuencias

- Las maestras pueden inactivarse, pero deben conservarse para historiales pasados.
- Los eventos sanitarios no se borran; se anulan si fueron registrados por error.
- Los movimientos de inventario no se borran si afectaron existencia; se anulan o compensan con otro movimiento.
- Los cambios importantes deben permitir saber quien los realizo y cuando.
- Los reportes deben poder excluir registros anulados cuando corresponda.

## Ejemplo

Si se registra por error una salida de alimento, no se elimina directamente. El sistema debe permitir anularla con motivo o crear un movimiento correctivo, manteniendo la trazabilidad del error y la correccion.
