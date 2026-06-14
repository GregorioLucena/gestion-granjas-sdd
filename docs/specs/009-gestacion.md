# Spec 009: Gestacion

## Estado

Borrador inicial

## Objetivo

Permitir confirmar, registrar y dar seguimiento a la gestacion de hembras servidas, partiendo de un servicio reproductivo registrado en `008-montas.md`.

Esta especificacion conecta montas e inseminaciones con el registro posterior de partos en `010-partos.md`.

## Dependencias

Esta especificacion depende de:

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `002-gestion-animales.md`
- `008-montas.md`
- `docs/03-catalogo-maestras.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

## Alcance

Incluye:

- Registro de confirmacion de gestacion.
- Registro de resultado de confirmacion.
- Registro de metodo de confirmacion.
- Creacion o actualizacion de gestacion asociada a un servicio reproductivo.
- Seguimiento de estado de gestacion.
- Registro de fecha probable de parto.
- Registro de controles de gestacion.
- Registro de fallos reproductivos como no gestante, aborto o repeticion.
- Consulta de historial de gestacion por hembra.
- Anulacion de registros de gestacion o controles registrados por error.

No incluye en esta version:

- Registro de parto.
- Registro de crias.
- Destete.
- Alimentacion detallada durante gestacion.
- Alertas automaticas de parto proximo.
- Ecografias con adjuntos o imagenes.
- Protocolos reproductivos avanzados.

## Conceptos principales

### Gestacion

Periodo reproductivo iniciado cuando una hembra se confirma o se considera en seguimiento luego de un servicio reproductivo.

### Confirmacion de gestacion

Evaluacion para determinar si una hembra servida esta gestante.

### Control de gestacion

Revision realizada durante el periodo de gestacion para verificar estado, observaciones o recomendaciones.

### Fallo reproductivo

Resultado negativo o interrupcion del proceso reproductivo.

Ejemplos:

- No gestante.
- Repeticion de celo.
- Aborto.
- Reabsorcion.

## Datos requeridos

### Gestacion

- Compania.
- Granja.
- Hembra.
- Servicio reproductivo.
- Fecha de inicio.
- Fecha probable de parto.
- Estado de gestacion.
- Resultado de confirmacion opcional.
- Metodo de confirmacion opcional.
- Fecha de confirmacion opcional.
- Responsable.
- Observaciones opcionales.
- Datos de auditoria.

### Control de gestacion

- Gestacion.
- Fecha del control.
- Metodo de control opcional.
- Resultado del control opcional.
- Responsable.
- Observaciones opcionales.
- Recomendaciones opcionales.
- Datos de auditoria.

### Fallo reproductivo

- Gestacion o servicio reproductivo.
- Fecha del fallo.
- Causa de fallo reproductivo.
- Responsable.
- Observaciones opcionales.
- Datos de auditoria.

## Reglas de negocio

- Toda gestacion debe pertenecer a una compania y granja.
- Toda gestacion debe estar asociada a una hembra individual.
- Toda gestacion debe originarse desde un servicio reproductivo registrado.
- La hembra de la gestacion debe ser la misma hembra del servicio reproductivo.
- La hembra debe estar activa y tener sexo `Hembra`.
- El servicio reproductivo no debe estar anulado.
- No debe existir mas de una gestacion activa para la misma hembra.
- El usuario debe tener permiso para registrar o consultar gestacion.
- El usuario solo puede operar gestaciones de granjas a las que tiene acceso.
- El metodo de confirmacion debe venir de maestra activa cuando se informe.
- El resultado de confirmacion debe venir de maestra activa cuando se informe.
- Si el resultado de confirmacion es `Gestante`, la gestacion debe quedar activa.
- Si el resultado de confirmacion es `No gestante`, el servicio reproductivo debe quedar como fallido o equivalente.
- Si se registra un fallo reproductivo, la gestacion debe cerrarse o marcarse como fallida.
- La fecha probable de parto debe heredarse del servicio reproductivo o calcularse con la duracion esperada de gestacion del tipo de animal.
- Los controles de gestacion deben quedar asociados a una gestacion activa, salvo que se registren como cierre o fallo.
- Una gestacion no debe eliminarse fisicamente; si fue registrada por error, debe anularse segun `0005-auditoria-y-trazabilidad.md`.

## Permisos requeridos

- `reproduccion.gestacion.ver`: consultar gestaciones y controles.
- `reproduccion.gestacion.crear`: registrar o confirmar gestacion.
- `reproduccion.gestacion.editar`: modificar datos permitidos antes del parto.
- `reproduccion.gestacion.controlar`: registrar controles de gestacion.
- `reproduccion.gestacion.anular`: anular registros de gestacion o controles.

## Criterios de aceptacion

### CA-001: Confirmar gestacion positiva

Dado un servicio reproductivo registrado para una hembra activa, cuando un usuario con permisos registra resultado `Gestante`, entonces se crea o actualiza una gestacion activa asociada a ese servicio.

### CA-002: Confirmar no gestante

Dado un servicio reproductivo registrado, cuando un usuario con permisos registra resultado `No gestante`, entonces no queda gestacion activa y el servicio reproductivo queda marcado como fallido o equivalente.

### CA-003: Impedir doble gestacion activa

Dado una hembra con gestacion activa, cuando el usuario intenta crear otra gestacion activa para la misma hembra, entonces el sistema debe rechazar la accion.

### CA-004: Registrar control de gestacion

Dado una gestacion activa, cuando un usuario con permisos registra un control con datos validos, entonces el control queda en el historial de la gestacion.

### CA-005: Registrar fallo reproductivo

Dado una gestacion activa, cuando un usuario registra un fallo reproductivo con causa valida, entonces la gestacion queda cerrada o fallida y se conserva el historial.

### CA-006: Consultar historial de gestacion por hembra

Dado una hembra con gestaciones registradas, cuando el usuario consulta su historial reproductivo, entonces el sistema muestra servicios, confirmaciones, controles, estados, fallos y fecha probable de parto.

### CA-007: Validar acceso por granja

Dado un usuario sin acceso a la granja de la hembra, cuando intenta registrar o consultar una gestacion, entonces el sistema debe impedir la accion.

### CA-008: Preparar registro de parto

Dado una gestacion activa con fecha probable de parto, cuando se consulte la gestacion, entonces el sistema debe mostrar la informacion necesaria para registrar el parto en `010-partos.md`.

### CA-009: Anular gestacion

Dado una gestacion registrada por error, cuando un usuario con permiso la anula indicando motivo, entonces la gestacion queda marcada como anulada y se conserva en el historial.

## Preguntas abiertas

- La gestacion se crea automaticamente al registrar la monta o solo al confirmar resultado gestante?
- El resultado `Dudoso` dejara la gestacion como pendiente o requerira nuevo control?
- Se permitira registrar alimentacion especifica de gestacion desde esta spec o solo desde `007-consumo-alimento.md`?
- Se permitiran adjuntos o archivos de ecografia en una fase futura?
- Los estados sugeridos de gestacion seran suficientes para el MVP o se requiere algun estado adicional?

## Decisiones tomadas

- La gestacion se relaciona con un servicio reproductivo.
- Solo puede existir una gestacion activa por hembra.
- La confirmacion de gestacion y sus controles forman parte del historial reproductivo.
- Los fallos reproductivos se registran como eventos historicos.
- El parto se gestiona en `010-partos.md`.
