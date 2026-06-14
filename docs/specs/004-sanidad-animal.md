# Spec 004: Sanidad Animal

## Estado

Borrador inicial

## Objetivo

Permitir registrar y consultar la informacion sanitaria de animales individuales y lotes, incluyendo veterinario tratante, vacunaciones, enfermedades, diagnosticos, tratamientos y controles preventivos.

Esta especificacion busca mantener historial sanitario trazable por granja, animal, lote y veterinario responsable.

## Dependencias

Esta especificacion depende de:

- `000-configuracion-base.md`
- `docs/03-catalogo-maestras.md`
- `001-usuarios-perfiles.md`
- `002-gestion-animales.md`
- `003-gestion-lotes.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

## Alcance

Incluye:

- Asignacion de veterinario tratante a animales individuales.
- Asignacion de veterinario tratante a lotes.
- Registro de vacunaciones.
- Registro de enfermedades o diagnosticos.
- Registro de tratamientos.
- Registro de controles sanitarios preventivos.
- Consulta de historial sanitario por animal.
- Consulta de historial sanitario por lote.
- Consulta de eventos sanitarios por veterinario.

No incluye en esta version:

- Inventario de medicamentos.
- Compras de medicamentos.
- Alertas automaticas de proximas vacunas.
- Recetas digitales.
- Integraciones con laboratorios.
- Auditoria sanitaria avanzada.

## Conceptos principales

### Veterinario

Usuario del sistema con perfil global `Veterinario` o con permisos sanitarios equivalentes. Puede quedar asignado como veterinario tratante de animales o lotes, y puede ser responsable de eventos sanitarios.

### Veterinario tratante

Veterinario responsable del seguimiento sanitario de un animal o lote durante un periodo determinado.

### Evento sanitario

Registro fechado relacionado con la salud de un animal individual o lote.

Tipos iniciales:

- Vacunacion.
- Enfermedad.
- Diagnostico.
- Tratamiento.
- Control preventivo.

### Vacunacion

Evento sanitario donde se registra la aplicacion de una vacuna a un animal o lote.

### Enfermedad o diagnostico

Evento sanitario donde se registra una condicion detectada, sintomas, diagnostico y estado del caso.

### Tratamiento

Evento sanitario donde se registra el uso de medicamentos, dosis, frecuencia, duracion y resultado esperado o real.

### Control sanitario

Revision preventiva o seguimiento general realizado sobre un animal o lote.

## Datos requeridos

### Asignacion de veterinario tratante

- Compania.
- Granja.
- Animal o lote.
- Veterinario.
- Fecha de inicio.
- Fecha de fin opcional.
- Estado activo/inactivo.
- Observaciones opcionales.

### Evento sanitario

- Compania.
- Granja.
- Tipo de evento sanitario.
- Fecha del evento.
- Animal o lote.
- Veterinario responsable.
- Descripcion u observaciones.
- Estado del evento.

### Vacunacion

- Evento sanitario.
- Vacuna.
- Dosis opcional.
- Unidad de dosis opcional.
- Via de aplicacion opcional.
- Proxima fecha sugerida opcional.

### Enfermedad o diagnostico

- Evento sanitario.
- Enfermedad opcional.
- Sintomas opcionales.
- Diagnostico.
- Gravedad opcional.
- Estado del caso: activo, en tratamiento, recuperado, cronico, fallecido.

### Tratamiento

- Evento sanitario.
- Enfermedad o diagnostico relacionado opcional.
- Medicamento o producto sanitario.
- Dosis opcional.
- Frecuencia opcional.
- Fecha de inicio.
- Fecha de fin opcional.
- Resultado opcional.

### Control sanitario

- Evento sanitario.
- Motivo del control.
- Hallazgos opcionales.
- Recomendaciones opcionales.

## Reglas de negocio

- Todo evento sanitario debe pertenecer a una compania y una granja.
- Todo evento sanitario debe aplicar a un animal individual o a un lote.
- Un evento sanitario no debe aplicar simultaneamente a animal y lote, salvo que una especificacion futura defina eventos masivos mixtos.
- El animal o lote del evento debe pertenecer a la misma granja del evento.
- El veterinario responsable debe ser un usuario activo de la misma compania.
- El veterinario responsable debe tener perfil `Veterinario` o permisos sanitarios equivalentes.
- Un usuario solo puede registrar eventos sanitarios en granjas a las que tiene acceso.
- Un usuario solo puede registrar eventos sanitarios si tiene el permiso correspondiente.
- Un animal puede tener un veterinario tratante actual.
- Un lote puede tener un veterinario tratante actual.
- Solo debe existir una asignacion activa de veterinario tratante por animal.
- Solo debe existir una asignacion activa de veterinario tratante por lote.
- Al asignar un nuevo veterinario tratante, la asignacion anterior debe cerrarse con fecha de fin.
- Las vacunaciones deben quedar en el historial sanitario del animal o lote.
- Las enfermedades y tratamientos deben quedar relacionados cuando el tratamiento responda a un diagnostico.
- Vacunas, enfermedades, sintomas, medicamentos, vias de aplicacion, unidades de dosis, gravedades, estados y motivos de control deben venir de maestras configuradas.
- Los eventos sanitarios no deben eliminarse fisicamente si ya forman parte del historial; deben anularse segun `0005-auditoria-y-trazabilidad.md`.

## Permisos requeridos

- `sanidad.ver`: consultar historial sanitario.
- `sanidad.crear`: registrar eventos sanitarios.
- `sanidad.editar`: modificar eventos sanitarios permitidos.
- `sanidad.tratamientos.administrar`: administrar tratamientos.
- `sanidad.veterinario_asignar`: asignar veterinario tratante.

## Criterios de aceptacion

### CA-001: Asignar veterinario tratante a animal

Dado un animal activo y un usuario veterinario activo de la misma compania, cuando un usuario con permisos asigna el veterinario tratante, entonces el animal queda asociado a ese veterinario desde la fecha indicada.

### CA-002: Asignar veterinario tratante a lote

Dado un lote activo y un usuario veterinario activo de la misma compania, cuando un usuario con permisos asigna el veterinario tratante, entonces el lote queda asociado a ese veterinario desde la fecha indicada.

### CA-003: Reemplazar veterinario tratante

Dado un animal o lote con veterinario tratante activo, cuando se asigna un nuevo veterinario tratante, entonces la asignacion anterior queda cerrada y la nueva queda activa.

### CA-004: Registrar vacunacion

Dado un animal o lote activo, cuando un usuario con permiso `sanidad.crear` registra una vacunacion con datos validos, entonces la vacunacion queda en el historial sanitario correspondiente.

### CA-005: Registrar enfermedad o diagnostico

Dado un animal o lote activo, cuando un usuario con permiso `sanidad.crear` registra un diagnostico, entonces el caso sanitario queda disponible para seguimiento.

### CA-006: Registrar tratamiento asociado a diagnostico

Dado un diagnostico activo, cuando un usuario con permiso registra un tratamiento relacionado, entonces el tratamiento queda vinculado al diagnostico.

### CA-007: Consultar historial sanitario de animal

Dado un animal registrado, cuando un usuario con permiso consulta su historial sanitario, entonces el sistema muestra vacunaciones, diagnosticos, tratamientos, controles y veterinario tratante.

### CA-008: Consultar historial sanitario de lote

Dado un lote registrado, cuando un usuario con permiso consulta su historial sanitario, entonces el sistema muestra vacunaciones, diagnosticos, tratamientos, controles y veterinario tratante.

### CA-009: Validar acceso por granja

Dado un usuario sin acceso a la granja del animal o lote, cuando intenta registrar o consultar eventos sanitarios, entonces el sistema debe impedir la accion.

### CA-010: Validar veterinario responsable

Dado un usuario que no tiene perfil `Veterinario` ni permisos sanitarios equivalentes, cuando se intenta asignarlo como veterinario responsable, entonces el sistema debe rechazarlo.

## Preguntas abiertas

- Los medicamentos y vacunas tendran tambien control de inventario sanitario o solo catalogo maestro en el MVP?
- Se permitiran eventos sanitarios masivos para varios lotes o varias ubicaciones?
- Las proximas vacunas generaran alertas desde el MVP o en una fase posterior?
- El veterinario tratante sera obligatorio para animales reproductores o siempre opcional?
- Los tratamientos requeriran control de retiro antes de venta o consumo?

## Decisiones tomadas

- El veterinario sera un tipo/perfil de usuario del sistema.
- Animales y lotes podran tener veterinario tratante.
- La sanidad se manejara como modulo separado, no dentro de gestion de animales.
- Los eventos sanitarios podran aplicar a animal individual o lote.
- El historial sanitario sera parte importante de la trazabilidad productiva.
