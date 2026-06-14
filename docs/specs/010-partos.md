# Spec 010: Partos

## Estado

Borrador inicial

## Objetivo

Permitir registrar y consultar partos de hembras gestantes, incluyendo fecha real de parto, tipo de parto, cantidad de crias nacidas, mortalidad, observaciones y cierre de la gestacion asociada.

Esta especificacion conecta el seguimiento de gestacion con el posterior control de destete definido en `011-destete.md`.

## Dependencias

Esta especificacion depende de:

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `002-gestion-animales.md`
- `009-gestacion.md`
- `docs/03-catalogo-maestras.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

## Alcance

Incluye:

- Registro de parto asociado a una gestacion activa.
- Registro de fecha y hora opcional del parto.
- Registro de tipo de parto.
- Registro de nacidos vivos.
- Registro de nacidos muertos.
- Registro de crias debiles o con observacion.
- Registro de total nacido.
- Registro opcional de peso promedio al nacer.
- Registro opcional de peso individual de crias.
- Creacion opcional de crias como animales individuales.
- Cierre de gestacion por parto.
- Consulta de historial de partos por hembra.
- Anulacion de partos registrados por error.

No incluye en esta version:

- Destete.
- Lactancia detallada.
- Adopciones o transferencia de crias entre madres.
- Mortalidad posterior al parto.
- Registro sanitario automatico de crias.
- Evaluacion genetica avanzada.

## Conceptos principales

### Parto

Evento reproductivo donde una hembra gestante da nacimiento a sus crias.

### Cria

Animal nacido a partir de un parto. Puede registrarse como conteo o como animal individual cuando el manejo lo requiera.

### Nacidos vivos

Cantidad de crias nacidas con vida.

### Nacidos muertos

Cantidad de crias nacidas sin vida.

### Crias debiles

Cantidad de crias nacidas vivas pero con condicion inicial comprometida.

### Total nacido

Suma de nacidos vivos y nacidos muertos. Las crias debiles forman parte de los nacidos vivos, salvo que una regla futura defina otra clasificacion.

## Datos requeridos

### Parto

- Compania.
- Granja.
- Gestacion.
- Hembra.
- Fecha del parto.
- Hora del parto opcional.
- Tipo de parto opcional.
- Nacidos vivos.
- Nacidos muertos.
- Crias debiles opcional.
- Total nacido.
- Peso promedio al nacer opcional.
- Responsable.
- Observaciones opcionales.
- Estado del parto.
- Datos de auditoria.

### Cria individual opcional

- Parto.
- Identificacion opcional.
- Sexo opcional.
- Peso al nacer opcional.
- Estado de cria.
- Observaciones opcionales.

## Reglas de negocio

- Todo parto debe pertenecer a una compania y granja.
- Todo parto debe estar asociado a una gestacion activa.
- La hembra del parto debe ser la misma hembra de la gestacion.
- La hembra debe estar activa y tener sexo `Hembra`.
- El usuario debe tener permiso para registrar o consultar partos.
- El usuario solo puede operar partos de granjas a las que tiene acceso.
- No debe permitirse registrar mas de un parto activo para la misma gestacion.
- La fecha del parto no debe ser anterior a la fecha del servicio reproductivo asociado.
- Nacidos vivos y nacidos muertos deben ser mayores o iguales a cero.
- El total nacido debe ser igual a nacidos vivos mas nacidos muertos.
- Las crias debiles no pueden ser mayores que nacidos vivos.
- Si se crean crias individuales, la cantidad de crias creadas no debe superar los nacidos vivos.
- Si se crean crias individuales como animales, deben quedar asociadas al parto y a la misma compania y granja.
- Al registrar un parto valido, la gestacion asociada debe cerrarse como `Cerrada por parto` o equivalente.
- El tipo de parto debe venir de maestra activa cuando se informe.
- El estado de cria debe venir de maestra activa cuando se creen crias individuales.
- Un parto no debe eliminarse fisicamente; si fue registrado por error, debe anularse segun `0005-auditoria-y-trazabilidad.md`.
- Al anular un parto, debe revisarse el estado de la gestacion asociada y las crias individuales generadas.

## Permisos requeridos

- `reproduccion.partos.ver`: consultar partos.
- `reproduccion.partos.crear`: registrar partos.
- `reproduccion.partos.editar`: modificar datos permitidos antes de destete.
- `reproduccion.partos.anular`: anular partos registrados por error.

## Criterios de aceptacion

### CA-001: Registrar parto de gestacion activa

Dado una gestacion activa, cuando un usuario con permisos registra un parto con datos validos, entonces el parto queda asociado a la gestacion y al historial reproductivo de la hembra.

### CA-002: Cerrar gestacion por parto

Dado una gestacion activa, cuando se registra un parto valido, entonces la gestacion queda cerrada por parto o estado equivalente.

### CA-003: Calcular total nacido

Dado un parto con nacidos vivos y nacidos muertos, cuando se guarda el registro, entonces el total nacido debe ser igual a la suma de ambos valores.

### CA-004: Validar crias debiles

Dado un parto con crias debiles informadas, cuando la cantidad de crias debiles es mayor que nacidos vivos, entonces el sistema debe rechazar el registro.

### CA-005: Crear crias individuales

Dado un parto con nacidos vivos, cuando el usuario registra crias individuales, entonces cada cria queda asociada al parto, compania, granja y madre.

### CA-006: Impedir doble parto por gestacion

Dado una gestacion que ya tiene parto activo registrado, cuando el usuario intenta registrar otro parto para la misma gestacion, entonces el sistema debe rechazar la accion.

### CA-007: Consultar historial de partos por hembra

Dado una hembra con partos registrados, cuando el usuario consulta su historial reproductivo, entonces el sistema muestra fecha, tipo de parto, nacidos vivos, nacidos muertos, crias debiles, total nacido y observaciones.

### CA-008: Validar acceso por granja

Dado un usuario sin acceso a la granja de la gestacion, cuando intenta registrar o consultar un parto, entonces el sistema debe impedir la accion.

### CA-009: Anular parto

Dado un parto registrado por error, cuando un usuario con permiso lo anula indicando motivo, entonces el parto queda marcado como anulado y se conserva en el historial.

### CA-010: Preparar destete

Dado un parto registrado con nacidos vivos, cuando se consulte el parto, entonces el sistema debe mostrar la informacion necesaria para registrar el destete en `011-destete.md`.

## Preguntas abiertas

- En el MVP las crias se registraran solo como conteo o tambien como animales individuales?
- El sistema generara identificaciones automaticas para crias individuales?
- Se permitira registrar adopciones o transferencia de crias entre madres en una fase futura?
- Se registrara mortalidad durante lactancia en partos o en una spec separada?
- El peso al nacer sera promedio, individual o ambos segun especie?

## Decisiones tomadas

- El parto se relaciona con una gestacion activa.
- Registrar un parto cierra la gestacion asociada.
- Los nacidos vivos, nacidos muertos y crias debiles forman parte del historial reproductivo.
- Las crias individuales seran opcionales para mantener soporte multiespecie.
- El destete se gestiona en `011-destete.md`.
