# Spec 011: Destete

## Estado

Borrador inicial

## Objetivo

Permitir registrar y consultar el destete de crias asociadas a un parto, incluyendo fecha de destete, cantidad destetada, mortalidad durante lactancia, peso al destete y cierre del ciclo reproductivo inicial.

Esta especificacion completa el flujo reproductivo basico iniciado en `008-montas.md`, seguido por `009-gestacion.md` y `010-partos.md`.

## Dependencias

Esta especificacion depende de:

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `002-gestion-animales.md`
- `010-partos.md`
- `docs/03-catalogo-maestras.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

## Alcance

Incluye:

- Registro de destete asociado a un parto.
- Registro de fecha de destete.
- Registro de cantidad destetada.
- Registro de mortalidad durante lactancia.
- Registro opcional de causa de mortalidad.
- Registro de peso promedio al destete.
- Registro opcional de peso individual por cria.
- Actualizacion de estado de crias individuales cuando existan.
- Consulta de historial de destetes por hembra o parto.
- Anulacion de destetes registrados por error.

No incluye en esta version:

- Adopciones o transferencia de crias entre madres.
- Manejo detallado de lactancia diaria.
- Creacion automatica de lotes post-destete.
- Venta de crias destetadas.
- Evaluacion genetica avanzada.
- Reportes avanzados de productividad.

## Conceptos principales

### Destete

Evento donde las crias son separadas de la madre y se registra el resultado del periodo de lactancia.

### Cantidad destetada

Numero de crias que llegan vivas al destete.

### Mortalidad durante lactancia

Cantidad de crias que murieron entre el parto y el destete.

### Peso al destete

Peso promedio o individual de las crias al momento del destete.

## Datos requeridos

### Destete

- Compania.
- Granja.
- Parto.
- Hembra.
- Fecha de destete.
- Cantidad destetada.
- Mortalidad durante lactancia opcional.
- Causa de mortalidad opcional.
- Peso promedio al destete opcional.
- Responsable.
- Observaciones opcionales.
- Estado del destete.
- Datos de auditoria.

### Peso individual de cria opcional

- Destete.
- Cria.
- Peso al destete.
- Observaciones opcionales.

## Reglas de negocio

- Todo destete debe pertenecer a una compania y granja.
- Todo destete debe estar asociado a un parto activo.
- La hembra del destete debe ser la misma hembra del parto.
- El usuario debe tener permiso para registrar o consultar destetes.
- El usuario solo puede operar destetes de granjas a las que tiene acceso.
- No debe permitirse registrar mas de un destete activo para el mismo parto.
- La fecha de destete no debe ser anterior a la fecha del parto.
- La cantidad destetada debe ser mayor o igual a cero.
- La mortalidad durante lactancia debe ser mayor o igual a cero.
- La cantidad destetada no debe ser mayor que los nacidos vivos del parto.
- La suma de cantidad destetada y mortalidad durante lactancia no debe superar los nacidos vivos del parto, salvo que una futura spec de adopciones o transferencias lo permita.
- Si se registran pesos individuales, la cantidad de pesos no debe superar la cantidad destetada.
- Si existen crias individuales asociadas al parto, las crias destetadas deben actualizar su estado a `Destetada` o equivalente.
- El parto asociado debe quedar cerrado para destete o estado equivalente.
- La causa de mortalidad debe venir de maestra activa cuando se informe.
- Un destete no debe eliminarse fisicamente; si fue registrado por error, debe anularse segun `0005-auditoria-y-trazabilidad.md`.
- Al anular un destete, debe revisarse el estado del parto y de las crias individuales afectadas.

## Permisos requeridos

- `reproduccion.destete.ver`: consultar destetes.
- `reproduccion.destete.crear`: registrar destetes.
- `reproduccion.destete.editar`: modificar datos permitidos.
- `reproduccion.destete.anular`: anular destetes registrados por error.

## Criterios de aceptacion

### CA-001: Registrar destete

Dado un parto activo con nacidos vivos, cuando un usuario con permisos registra un destete con datos validos, entonces el destete queda asociado al parto y al historial reproductivo de la hembra.

### CA-002: Validar fecha de destete

Dado un parto registrado, cuando el usuario intenta registrar un destete con fecha anterior al parto, entonces el sistema debe rechazar el registro.

### CA-003: Validar cantidad destetada

Dado un parto con nacidos vivos, cuando el usuario registra una cantidad destetada mayor que los nacidos vivos, entonces el sistema debe rechazar el registro.

### CA-004: Validar mortalidad y destetados

Dado un parto con nacidos vivos, cuando la suma de destetados y mortalidad durante lactancia supera los nacidos vivos, entonces el sistema debe rechazar el registro.

### CA-005: Registrar peso promedio al destete

Dado un destete registrado, cuando el usuario informa peso promedio al destete, entonces el peso queda disponible para reportes productivos.

### CA-006: Actualizar crias individuales

Dado un parto con crias individuales registradas, cuando se registra el destete, entonces las crias destetadas quedan con estado `Destetada` o equivalente.

### CA-007: Cerrar parto para destete

Dado un parto activo, cuando se registra un destete valido, entonces el parto queda cerrado para destete o estado equivalente.

### CA-008: Consultar historial de destete

Dado una hembra con destetes registrados, cuando el usuario consulta su historial reproductivo, entonces el sistema muestra parto, fecha de destete, destetados, mortalidad, peso y observaciones.

### CA-009: Validar acceso por granja

Dado un usuario sin acceso a la granja del parto, cuando intenta registrar o consultar un destete, entonces el sistema debe impedir la accion.

### CA-010: Anular destete

Dado un destete registrado por error, cuando un usuario con permiso lo anula indicando motivo, entonces el destete queda marcado como anulado y se conserva en el historial.

## Preguntas abiertas

- En el MVP se creara automaticamente un lote post-destete con las crias destetadas?
- Se registrara mortalidad durante lactancia solo como cantidad o con eventos detallados por fecha?
- El peso al destete sera obligatorio para produccion porcina?
- Se permitiran adopciones o transferencia de crias entre madres en una fase futura?
- El destete cerrara automaticamente el parto para reportes reproductivos?

## Decisiones tomadas

- El destete se relaciona con un parto activo.
- El destete completa el ciclo reproductivo basico de la hembra.
- La cantidad destetada y la mortalidad durante lactancia forman parte del historial reproductivo.
- Las crias individuales son opcionales para mantener soporte multiespecie.
- La creacion de lotes post-destete queda fuera del MVP hasta definir engorde y movimientos de lote.
