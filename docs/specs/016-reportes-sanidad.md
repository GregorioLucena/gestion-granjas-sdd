# Spec 016: Reportes de Sanidad

## Estado

Borrador inicial

## Objetivo

Permitir consultar indicadores y reportes sanitarios a partir de eventos de sanidad registrados sobre animales individuales y lotes, incluyendo vacunaciones, enfermedades, diagnosticos, tratamientos, controles preventivos y veterinarios responsables.

Esta especificacion convierte el historial sanitario en informacion util para seguimiento, prevencion y toma de decisiones.

## Dependencias

Esta especificacion depende de:

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `002-gestion-animales.md`
- `003-gestion-lotes.md`
- `004-sanidad-animal.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

## Alcance

Incluye:

- Reporte de eventos sanitarios por periodo.
- Reporte de vacunaciones.
- Reporte de enfermedades y diagnosticos.
- Reporte de tratamientos.
- Reporte de controles preventivos.
- Reporte por veterinario responsable.
- Reporte de animales o lotes con casos sanitarios activos.
- Historial sanitario consolidado por animal.
- Historial sanitario consolidado por lote.
- Filtros por compania, granja, animal, lote, veterinario, tipo de evento y periodo.

No incluye en esta version:

- Alertas automaticas de proximas vacunas.
- Indicadores epidemiologicos avanzados.
- Reportes oficiales para autoridades sanitarias.
- Integraciones con laboratorios.
- Analisis de costos sanitarios.
- Inventario de medicamentos.

## Conceptos principales

### Reporte sanitario

Vista que consolida eventos relacionados con salud animal por periodo, granja, animal, lote o veterinario.

### Caso sanitario activo

Enfermedad, diagnostico o tratamiento que todavia requiere seguimiento.

### Historial sanitario consolidado

Vista que agrupa vacunaciones, enfermedades, diagnosticos, tratamientos, controles y veterinarios tratantes de un animal o lote.

### Cobertura de vacunacion

Indicador basico que muestra animales o lotes vacunados en un periodo contra una vacuna especifica.

## Datos de entrada

Los reportes se alimentan de:

- Eventos sanitarios.
- Vacunaciones.
- Enfermedades o diagnosticos.
- Tratamientos.
- Controles sanitarios.
- Veterinarios tratantes.
- Animales.
- Lotes.
- Compania y granja.

## Filtros requeridos

- Compania.
- Granja opcional.
- Periodo desde.
- Periodo hasta.
- Animal opcional.
- Lote opcional.
- Veterinario opcional.
- Tipo de evento sanitario opcional.
- Enfermedad opcional.
- Vacuna opcional.
- Estado de caso sanitario opcional.

## Reportes iniciales

### Reporte de eventos sanitarios

Debe mostrar:

- Fecha.
- Tipo de evento sanitario.
- Animal o lote.
- Veterinario responsable.
- Estado.
- Observaciones o descripcion.

### Reporte de vacunaciones

Debe mostrar:

- Vacuna.
- Fecha de aplicacion.
- Animal o lote.
- Dosis cuando exista.
- Via de aplicacion cuando exista.
- Proxima fecha sugerida cuando exista.
- Veterinario o responsable.

### Reporte de enfermedades y diagnosticos

Debe mostrar:

- Enfermedad o diagnostico.
- Animal o lote.
- Fecha de deteccion.
- Gravedad.
- Estado del caso.
- Veterinario responsable.

### Reporte de tratamientos

Debe mostrar:

- Medicamento o producto sanitario.
- Diagnostico relacionado cuando exista.
- Fecha de inicio.
- Fecha de fin.
- Dosis y frecuencia cuando existan.
- Resultado.
- Veterinario responsable.

### Reporte de controles preventivos

Debe mostrar:

- Motivo del control.
- Animal o lote.
- Fecha.
- Hallazgos.
- Recomendaciones.
- Responsable.

### Reporte por veterinario

Debe mostrar:

- Veterinario.
- Eventos registrados.
- Animales o lotes atendidos.
- Tratamientos indicados.
- Controles realizados.
- Periodo consultado.

### Historial sanitario consolidado

Debe mostrar:

- Vacunaciones.
- Enfermedades y diagnosticos.
- Tratamientos.
- Controles preventivos.
- Veterinario tratante actual.
- Eventos anulados excluidos por defecto.

## Reglas de negocio

- Todo reporte debe respetar la compania del usuario.
- Todo reporte debe respetar las granjas a las que el usuario tiene acceso.
- Los eventos anulados deben excluirse por defecto.
- Los reportes deben usar datos historicos aunque animales, lotes, veterinarios o maestras hayan quedado inactivos.
- Los reportes deben indicar claramente periodo, filtros y fecha de consulta.
- El historial sanitario de un animal o lote debe mostrarse en orden cronologico.
- Los casos activos deben basarse en estados sanitarios no cerrados, recuperados o anulados.
- El usuario debe tener permiso para consultar reportes sanitarios.

## Permisos requeridos

- `reportes.sanidad.ver`: consultar reportes sanitarios.

## Criterios de aceptacion

### CA-001: Consultar eventos sanitarios

Dado eventos sanitarios registrados, cuando el usuario consulta el reporte por periodo, entonces el sistema muestra tipo, fecha, animal o lote, veterinario, estado y descripcion.

### CA-002: Consultar vacunaciones

Dado vacunaciones registradas, cuando el usuario consulta el reporte de vacunaciones, entonces el sistema muestra vacuna, fecha, animal o lote, dosis, via y proxima fecha sugerida cuando exista.

### CA-003: Consultar enfermedades y diagnosticos

Dado diagnosticos registrados, cuando el usuario consulta el reporte sanitario, entonces el sistema muestra enfermedad, animal o lote, fecha, gravedad, estado y veterinario responsable.

### CA-004: Consultar tratamientos

Dado tratamientos registrados, cuando el usuario consulta el reporte de tratamientos, entonces el sistema muestra medicamento, diagnostico relacionado, fechas, dosis, frecuencia, resultado y responsable.

### CA-005: Consultar casos activos

Dado casos sanitarios no cerrados, cuando el usuario consulta casos activos, entonces el sistema muestra animales o lotes que requieren seguimiento.

### CA-006: Consultar reporte por veterinario

Dado eventos con veterinario responsable, cuando el usuario filtra por veterinario, entonces el sistema muestra eventos, animales o lotes atendidos y tratamientos indicados en el periodo.

### CA-007: Consultar historial sanitario consolidado

Dado un animal o lote con eventos sanitarios, cuando el usuario consulta su historial, entonces el sistema muestra vacunaciones, diagnosticos, tratamientos, controles y veterinario tratante.

### CA-008: Respetar acceso por granja

Dado un usuario sin acceso a una granja, cuando consulta reportes sanitarios, entonces el sistema no debe incluir datos de esa granja.

### CA-009: Excluir anulados

Dado eventos sanitarios anulados, cuando el usuario consulta reportes, entonces esos eventos no deben incluirse por defecto.

## Preguntas abiertas

- Se mostraran proximas vacunas como reporte o como modulo de alertas futuro?
- Los reportes sanitarios incluiran costos cuando exista inventario de medicamentos?
- Se requiere exportacion a PDF o Excel desde el MVP?
- Se permitira clasificar enfermedades por grupos o sistemas corporales?
- Los casos activos se definiran solo por estado o tambien por fechas de tratamiento?

## Decisiones tomadas

- Los reportes sanitarios se basan en eventos historicos no anulados.
- Los reportes deben respetar seguridad multi-compania y acceso por granja.
- El historial sanitario consolidado podra consultarse por animal o lote.
- Las alertas y analisis sanitarios avanzados quedan para fases posteriores.
