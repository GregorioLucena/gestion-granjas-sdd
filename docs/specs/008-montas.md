# Spec 008: Montas e Inseminaciones

## Estado

Borrador inicial

## Objetivo

Permitir registrar y consultar servicios reproductivos de hembras, incluyendo montas naturales e inseminaciones, para iniciar el seguimiento reproductivo que luego continuara con gestacion, parto y destete.

Esta especificacion es la entrada principal al ciclo reproductivo.

## Dependencias

Esta especificacion depende de:

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `002-gestion-animales.md`
- `docs/03-catalogo-maestras.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

## Alcance

Incluye:

- Registro de monta natural.
- Registro de inseminacion artificial.
- Asociacion de hembra servida.
- Asociacion opcional de macho reproductor.
- Registro opcional de identificacion de semen o pajilla.
- Registro de fecha del servicio reproductivo.
- Registro de tipo de servicio reproductivo.
- Calculo o registro de fecha probable de parto.
- Registro de estado del servicio reproductivo.
- Consulta de historial reproductivo inicial por hembra.
- Anulacion de servicios registrados por error.

No incluye en esta version:

- Confirmacion de gestacion.
- Seguimiento de gestacion.
- Registro de partos.
- Registro de crias.
- Destete.
- Control genetico avanzado.
- Inventario de semen.
- Sincronizacion de celo.

## Conceptos principales

### Servicio reproductivo

Evento que registra que una hembra fue servida mediante monta natural, inseminacion artificial u otro metodo reproductivo.

### Hembra servida

Animal hembra que recibe el servicio reproductivo.

### Macho reproductor

Animal macho usado en una monta natural o como referencia del material genetico.

### Inseminacion artificial

Servicio reproductivo donde se registra material genetico sin requerir necesariamente un macho presente en la granja.

### Fecha probable de parto

Fecha estimada de parto calculada o registrada a partir de la fecha del servicio reproductivo y la duracion esperada de gestacion del tipo de animal.

## Datos requeridos

### Servicio reproductivo

- Compania.
- Granja.
- Hembra servida.
- Tipo de servicio reproductivo.
- Fecha del servicio.
- Macho reproductor opcional.
- Identificacion de semen o pajilla opcional.
- Responsable.
- Fecha probable de parto opcional.
- Estado del servicio reproductivo.
- Observaciones opcionales.
- Datos de auditoria.

## Reglas de negocio

- Todo servicio reproductivo debe pertenecer a una compania y granja.
- La hembra servida debe pertenecer a la misma compania y granja del servicio.
- La hembra servida debe ser un animal activo.
- La hembra servida debe tener sexo `Hembra`.
- La hembra servida debe tener finalidad productiva compatible con reproduccion.
- Si se informa macho reproductor, debe pertenecer a la misma compania.
- Si se informa macho reproductor dentro de la granja, debe ser un animal activo y de sexo `Macho`.
- Para monta natural debe informarse macho reproductor, salvo que una regla futura permita registrar macho externo.
- Para inseminacion artificial debe informarse identificacion de semen/pajilla o macho reproductor de referencia.
- El tipo de servicio reproductivo debe venir de maestra activa.
- El estado inicial del servicio reproductivo debe ser `Registrado` o equivalente segun maestra.
- El usuario debe tener permiso para registrar servicios reproductivos.
- El usuario solo puede registrar servicios en granjas a las que tiene acceso.
- No debe permitirse registrar servicios reproductivos para animales vendidos, muertos o descartados.
- No debe permitirse registrar un nuevo servicio reproductivo a una hembra con gestacion activa, salvo que una especificacion futura lo permita como repeticion o correccion.
- La fecha probable de parto puede calcularse si existe duracion de gestacion configurada para el tipo de animal; si no existe, puede registrarse manualmente.
- Un servicio reproductivo no debe eliminarse fisicamente; si fue registrado por error, debe anularse segun `0005-auditoria-y-trazabilidad.md`.

## Permisos requeridos

- `reproduccion.montas.ver`: consultar servicios reproductivos.
- `reproduccion.montas.crear`: registrar montas o inseminaciones.
- `reproduccion.montas.editar`: modificar datos permitidos antes de confirmacion.
- `reproduccion.montas.anular`: anular servicios registrados por error.

## Criterios de aceptacion

### CA-001: Registrar monta natural

Dado una hembra activa con finalidad reproductiva y un macho activo, cuando un usuario con permisos registra una monta natural con datos validos, entonces el servicio reproductivo queda registrado en el historial de la hembra.

### CA-002: Registrar inseminacion artificial

Dado una hembra activa con finalidad reproductiva, cuando un usuario con permisos registra una inseminacion artificial con identificacion de semen o macho de referencia, entonces el servicio reproductivo queda registrado en el historial de la hembra.

### CA-003: Validar sexo de la hembra

Dado un animal que no tiene sexo `Hembra`, cuando el usuario intenta registrarlo como hembra servida, entonces el sistema debe rechazar el registro.

### CA-004: Validar sexo del macho

Dado un animal que no tiene sexo `Macho`, cuando el usuario intenta usarlo como macho reproductor, entonces el sistema debe rechazar el registro.

### CA-005: Validar acceso por granja

Dado un usuario sin acceso a la granja de la hembra, cuando intenta registrar o consultar un servicio reproductivo, entonces el sistema debe impedir la accion.

### CA-006: Calcular fecha probable de parto

Dado un tipo de animal con duracion de gestacion configurada, cuando se registra un servicio reproductivo, entonces el sistema propone la fecha probable de parto a partir de la fecha del servicio.

### CA-007: Consultar historial reproductivo de hembra

Dado una hembra con servicios reproductivos registrados, cuando el usuario consulta su historial reproductivo, entonces el sistema muestra fecha, tipo de servicio, macho o semen, estado, fecha probable de parto y responsable.

### CA-008: Impedir servicio en hembra con gestacion activa

Dado una hembra con gestacion activa, cuando el usuario intenta registrar un nuevo servicio reproductivo sin marcarlo como correccion o repeticion permitida, entonces el sistema debe rechazar la accion.

### CA-009: Anular servicio reproductivo

Dado un servicio reproductivo registrado por error, cuando un usuario con permiso lo anula indicando motivo, entonces el servicio queda marcado como anulado y se conserva en el historial.

## Preguntas abiertas

- La duracion de gestacion se configurara en `Tipo de animal` o en una maestra reproductiva separada?
- Se permitira registrar macho externo no existente como animal del sistema?
- La identificacion de semen/pajilla sera texto libre en MVP o requerira inventario genetico futuro?
- Se permitiran multiples servicios en un mismo celo?
- Cuando se confirme gestacion, el estado del servicio se actualizara automaticamente?

## Decisiones tomadas

- La monta o inseminacion sera un evento historico reproductivo.
- El servicio reproductivo siempre pertenece a una hembra individual.
- El servicio puede registrar macho reproductor, semen/pajilla o ambos segun tipo de servicio.
- La fecha probable de parto podra calcularse si existe configuracion de duracion de gestacion.
- El seguimiento de gestacion se definira en `009-gestacion.md`.
