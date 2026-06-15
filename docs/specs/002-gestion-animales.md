# Spec 002: Gestion de Animales

## Estado

Borrador inicial

## Objetivo

Permitir registrar y consultar animales individuales dentro de una granja, manteniendo una estructura preparada para distintas especies, finalidades productivas y ubicaciones internas.

Esta especificacion es la base para modulos posteriores como reproduccion, gestacion, partos, alimentacion individual, historial sanitario y bajas.

## Dependencias

Esta especificacion depende de:

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`

## Alcance

Incluye:

- Registro de animales individuales.
- Consulta de ficha basica del animal.
- Cambio de estado del animal.
- Asignacion de animal a granja.
- Asignacion opcional de ubicacion interna.

No incluye en esta version:

- Registro de companias, granjas o maestras base.
- Registro de usuarios, perfiles o permisos.
- Registro de lotes.
- Montas, gestacion o partos.
- Vacunaciones, enfermedades, tratamientos o veterinario tratante.
- Consumo de alimento.
- Inventario.
- Reportes avanzados.

## Conceptos principales

### Tipo de animal

Representa la especie o categoria productiva general configurada en las maestras.

Ejemplos:

- Porcino
- Bovino
- Caprino
- Ave
- Conejo

### Finalidad productiva

Define para que se usa un animal dentro de la granja. Se configura como maestra.

Ejemplos:

- Reproduccion
- Engorde
- Cria
- Leche
- Postura
- Venta

### Animal

Representa un animal gestionado individualmente.

Ejemplos:

- Cerda reproductora identificada como `CER-001`.
- Verraco reproductor identificado como `VER-001`.
- Vaca lechera identificada como `BOV-010`.

## Datos requeridos

### Animal

- Identificacion unica.
- Compania.
- Granja.
- Tipo de animal.
- Sexo.
- Fecha de nacimiento o fecha de ingreso.
- Finalidad productiva.
- Raza, obligatoria solo cuando el tipo de animal la requiere.
- Ubicacion interna opcional.
- Estado.
- Observaciones opcionales.

## Reglas de negocio

- Todo animal debe pertenecer a una compania y a una granja.
- La granja del animal debe pertenecer a la compania seleccionada.
- El usuario debe tener permiso para registrar o modificar animales.
- El usuario solo puede operar sobre animales de granjas a las que tiene acceso.
- Todo animal debe tener una identificacion unica dentro de la granja.
- En el MVP la identificacion del animal sera manual.
- El modelo debe permitir una estrategia futura de identificacion automatica sin cambiar el concepto de identificacion unica.
- Todo animal debe pertenecer a un tipo de animal.
- Todo animal debe tener sexo definido como macho, hembra o desconocido.
- Todo animal debe tener al menos una fecha de referencia: nacimiento o ingreso.
- Un animal puede tener una finalidad productiva principal.
- Si el tipo de animal requiere raza, el animal debe tener una raza asociada.
- Si el tipo de animal no requiere raza, la raza puede quedar vacia.
- La raza seleccionada debe pertenecer al tipo de animal del animal.
- Si se asigna ubicacion interna, la ubicacion debe pertenecer a la misma granja del animal.
- No debe permitirse registrar dos animales activos con la misma identificacion.
- Un animal inactivo no debe usarse en nuevos eventos productivos, salvo que una especificacion futura indique lo contrario.
- Los estados iniciales permitidos para un animal son: activo, vendido, muerto, descartado.

## Criterios de aceptacion

### CA-001: Registrar animal con identificacion manual

Dado que existe una compania activa, una granja activa, un tipo de animal activo y una finalidad productiva activa, cuando un usuario con permiso registra un animal con identificacion manual unica y datos validos, entonces el animal queda guardado en estado activo.

### CA-002: Validar granja de la compania

Dado que una granja pertenece a una compania, cuando el usuario registra un animal para esa granja, entonces el animal queda asociado a la misma compania de la granja.

### CA-003: Rechazar granja de otra compania

Dado que una granja pertenece a otra compania, cuando el usuario intenta asociar el animal a esa granja desde una compania distinta, entonces el sistema debe rechazarlo.

### CA-004: Validar raza obligatoria por tipo de animal

Dado que el tipo de animal seleccionado requiere raza, cuando el usuario intenta registrar un animal sin raza, entonces el sistema debe rechazarlo.

### CA-005: Permitir raza opcional por tipo de animal

Dado que el tipo de animal seleccionado no requiere raza, cuando el usuario registra un animal sin raza, entonces el sistema debe permitirlo.

### CA-006: Evitar identificacion duplicada por granja

Dado que existe un animal con identificacion `CER-001`, cuando el usuario intenta registrar otro animal con la misma identificacion, entonces el sistema debe rechazarlo.

### CA-007: Consultar ficha del animal

Dado un animal registrado, cuando el usuario consulta su ficha, entonces el sistema muestra identificacion, compania, granja, tipo de animal, sexo, finalidad, raza, ubicacion, fechas, estado y observaciones. Si existe informacion sanitaria, podra mostrarse como resumen proveniente de `004-sanidad-animal.md`.

### CA-008: Cambiar estado del animal

Dado un animal activo, cuando el usuario cambia su estado a vendido, muerto o descartado, entonces el animal queda inactivo para nuevos eventos productivos.

### CA-009: Asignar ubicacion interna

Dado que existe una ubicacion activa dentro de la granja del animal, cuando el usuario asigna esa ubicacion al animal, entonces la ficha del animal muestra su ubicacion actual. El historial de cambios posteriores se gestiona en `006-movimientos-ubicacion.md`.

### CA-010: Validar permiso de usuario

Dado un usuario sin permiso para crear animales, cuando intenta registrar un animal, entonces el sistema debe impedir la accion.

### CA-011: Validar acceso del usuario a la granja

Dado un usuario sin acceso a una granja, cuando intenta consultar o modificar animales de esa granja, entonces el sistema debe impedir la accion.

## Preguntas abiertas

- La identificacion automatica futura usara prefijo por tipo de animal, por granja o por finalidad productiva?
- Se permitira reutilizar una identificacion de animal vendido o muerto dentro de la misma granja?
- La anulacion del ultimo movimiento de ubicacion recalculara la ubicacion actual o requerira correccion manual?

## Notas para futuras specs

- La gestion por lotes debe definirse en una especificacion separada.
- La reproduccion debe apoyarse en animales individuales, especialmente hembras y machos reproductores.
- La sanidad y el veterinario tratante se gestionan en `004-sanidad-animal.md`.
- El consumo de alimento podra registrarse por animal o por lote, pero no pertenece a esta especificacion.
- Los movimientos entre ubicaciones se gestionan en `006-movimientos-ubicacion.md`.
