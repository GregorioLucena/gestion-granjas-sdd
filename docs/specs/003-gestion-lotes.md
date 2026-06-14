# Spec 003: Gestion de Lotes

## Estado

Borrador inicial

## Objetivo

Permitir registrar y consultar lotes de animales manejados como una unidad productiva dentro de una granja. Esta especificacion soporta procesos como engorde, cria grupal y otros manejos donde no se requiere identificar individualmente a cada animal.

## Dependencias

Esta especificacion depende de:

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`

## Alcance

Incluye:

- Registro de lotes.
- Asignacion de lote a compania y granja.
- Asignacion de tipo de animal.
- Asignacion de finalidad productiva.
- Registro de cantidad inicial.
- Registro de fecha de inicio.
- Consulta de ficha basica del lote.
- Cambio de estado del lote.
- Asignacion opcional de ubicacion interna.

No incluye en esta version:

- Consumo de alimento por lote.
- Controles de peso.
- Cierre productivo detallado.
- Veterinario tratante, vacunaciones, enfermedades o tratamientos.
- Inventario.
- Reportes avanzados.

## Conceptos principales

### Lote

Grupo de animales manejado como unidad productiva. Puede representar animales de engorde, crias agrupadas, aves o cualquier grupo donde el control individual no sea necesario.

### Cantidad inicial

Numero de animales con los que inicia el lote.

### Cantidad actual

Numero de animales presentes en el lote despues de bajas, ventas, traslados u otros movimientos. Su calculo detallado se definira en especificaciones futuras.

## Datos requeridos

### Lote

- Codigo o identificacion unica.
- Compania.
- Granja.
- Tipo de animal.
- Finalidad productiva.
- Fecha de inicio.
- Cantidad inicial.
- Ubicacion interna opcional.
- Estado.
- Observaciones opcionales.

## Reglas de negocio

- Todo lote debe pertenecer a una compania y a una granja.
- La granja del lote debe pertenecer a la compania seleccionada.
- El usuario debe tener permiso para registrar o modificar lotes.
- El usuario solo puede operar sobre lotes de granjas a las que tiene acceso.
- Todo lote debe tener una identificacion unica dentro de la granja.
- Todo lote debe pertenecer a un tipo de animal.
- Todo lote debe tener una finalidad productiva.
- La cantidad inicial debe ser mayor que cero.
- Si se asigna ubicacion interna, la ubicacion debe pertenecer a la misma granja del lote.
- Los estados iniciales permitidos para un lote son: activo, cerrado, cancelado.
- Un lote cerrado no debe recibir nuevos eventos productivos, salvo que una especificacion futura indique lo contrario.

## Criterios de aceptacion

### CA-001: Registrar lote

Dado que existe una compania activa, una granja activa, un tipo de animal activo y una finalidad productiva activa, cuando un usuario con permisos registra un lote con datos validos, entonces el lote queda guardado en estado activo.

### CA-002: Evitar identificacion duplicada por granja

Dado que existe un lote con codigo `LOT-001` dentro de una granja, cuando el usuario intenta registrar otro lote con el mismo codigo en esa granja, entonces el sistema debe rechazarlo.

### CA-003: Validar cantidad inicial

Dado un usuario registrando un lote, cuando informa cantidad inicial menor o igual a cero, entonces el sistema debe rechazar el registro.

### CA-004: Consultar ficha del lote

Dado un lote registrado, cuando el usuario consulta su ficha, entonces el sistema muestra codigo, compania, granja, tipo de animal, finalidad, fecha de inicio, cantidad inicial, ubicacion, estado y observaciones.

### CA-005: Cambiar estado del lote

Dado un lote activo, cuando el usuario cambia su estado a cerrado o cancelado, entonces el lote deja de estar disponible para nuevos eventos productivos.

### CA-006: Validar acceso del usuario a la granja

Dado un usuario sin acceso a una granja, cuando intenta consultar o modificar lotes de esa granja, entonces el sistema debe impedir la accion.

## Preguntas abiertas

- La identificacion del lote sera manual, automatica o ambas?
- La cantidad actual se calculara por movimientos o se editara manualmente en el MVP?
- Se permitiran traslados de animales entre lotes?
- Un lote podra dividirse o fusionarse con otro lote?

## Notas para futuras specs

- El consumo de alimento por lote se definira en `007-consumo-alimento.md`.
- El veterinario tratante y el historial sanitario del lote se gestionan en `004-sanidad-animal.md`.
- Los movimientos de ubicacion se gestionan en `006-movimientos-ubicacion.md`.
- Los controles de peso se definen en `013-controles-peso.md`.
- El cierre productivo detallado se define en `012-engorde-lotes.md`.
