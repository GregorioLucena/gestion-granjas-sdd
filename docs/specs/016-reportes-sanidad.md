# Spec 016: Reportes de Sanidad

## Estado

Lista para implementar MVP v2 (2026-07-13)

## Objetivo

Consultar actividad sanitaria, casos que requieren seguimiento, proximas vacunaciones,
retiros vigentes e historial por sujeto o veterinario.

## Dependencias

- `001-usuarios-perfiles.md`
- `002-gestion-animales.md`
- `003-gestion-lotes.md`
- `004-sanidad-animal.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

## Alcance MVP v2

Incluye:

- Eventos sanitarios por periodo.
- Vacunaciones aplicadas.
- Proximas vacunaciones sugeridas.
- Casos sanitarios activos.
- Tratamientos.
- Restricciones por retiro.
- Actividad por veterinario.
- Historial consolidado de animal o lote.

No incluye:

- Notificaciones automaticas.
- Cobertura porcentual de vacunacion.
- Epidemiologia avanzada.
- Costos, inventario sanitario o reportes oficiales.
- Graficos y exportacion.

## Fuente y exclusiones

Se usan eventos, seguimientos y asignaciones de veterinario no anulados. Registros anulados
no participan en totales ni pendientes. Maestras y sujetos inactivos se conservan en
historial.

## Filtros

- `granjaId` obligatorio y accesible.
- `fechaDesde` y `fechaHasta` obligatorios en reportes por periodo, maximo 366 dias.
- Animal o lote opcional y mutuamente excluyentes.
- Veterinario, tipo de evento, enfermedad, vacuna, medicamento y estado opcionales.
- Paginacion obligatoria en detalle.

## Reportes

### Eventos

Fecha, tipo, sujeto, cantidad tratada, veterinario, usuario registrador y resumen.

### Vacunaciones

Vacuna, fecha, sujeto, dosis/unidad, via, cantidad tratada, proxima fecha y responsable.

### Proximas vacunaciones

Una vacunacion con `proximaFechaSugerida` queda pendiente si no existe otra vacunacion
vigente posterior para el mismo sujeto y vacuna.

Estado:

- `PROXIMA`: fecha >= hoy.
- `VENCIDA`: fecha < hoy.

Es un reporte consultable; no genera alerta o notificacion.

### Casos activos

Diagnosticos cuyo ultimo estado es `ACTIVO`, `EN_TRATAMIENTO` o `CRONICO`, con sujeto,
enfermedad, gravedad, antiguedad, veterinario y ultimo seguimiento.

### Tratamientos

Medicamento, sujeto, diagnostico relacionado, fechas, dosis/frecuencia, retiro, resultado y
veterinario.

### Retiros vigentes

Animal o lote, medicamento/tratamiento origen, fecha de inicio, fecha final y dias restantes.
Si hay varios tratamientos, se muestra la mayor fecha vigente y sus fuentes.

### Actividad por veterinario

Eventos, sujetos atendidos, diagnosticos y tratamientos en el periodo. Son conteos de
actividad, no evaluacion de desempeño.

### Historial consolidado

Linea cronologica de eventos, seguimientos, veterinario tratante y anulados solo cuando se
solicite vista auditable.

Los endpoints de esta spec son un read model de reporte con filtros/metadatos y permiso
`reportes.sanidad.ver`. Los historiales de spec `004` son la vista operativa del modulo
sanitario y delegan a la misma consulta base; no se duplican reglas ni persistencia.

## Reglas

1. Consultas filtran por tenant y granjas permitidas.
2. Filtros ajenos se rechazan.
3. Anulados se excluyen por defecto y siempre de agregados.
4. Casos activos se definen por ultimo estado, no por fecha de tratamiento.
5. Una vacunacion posterior satisface la recomendacion previa del mismo sujeto/vacuna.
6. Retiro vigente usa la mayor fecha final entre tratamientos vigentes no anulados.
7. Sin datos devuelve estructura vacia, no error.
8. Backend calcula estados, dias y totales.
9. Periodo y fecha de consulta se incluyen en metadatos.

## Permiso

- `reportes.sanidad.ver`

## API

| Metodo | Ruta |
|--------|------|
| `GET` | `/reportes/sanidad/eventos` |
| `GET` | `/reportes/sanidad/vacunaciones` |
| `GET` | `/reportes/sanidad/proximas-vacunaciones` |
| `GET` | `/reportes/sanidad/casos-activos` |
| `GET` | `/reportes/sanidad/tratamientos` |
| `GET` | `/reportes/sanidad/retiros-vigentes` |
| `GET` | `/reportes/sanidad/veterinarios` |
| `GET` | `/reportes/sanidad/historial/animales/:id` |
| `GET` | `/reportes/sanidad/historial/lotes/:id` |

Respuesta separa `data`, `summary` y `meta` con filtros, periodo, fecha y paginacion.

## UX

Hub `/reportes/sanidad`, una pantalla por reporte:

- Granja y periodo visibles.
- Filtros colapsables.
- Estados con texto, no solo color.
- Casos, vacunas vencidas y retiros destacados.
- Detalle mobile-first.
- Loading, empty y error inline.
- Sin graficos, exportacion ni notificaciones.

## Criterios de aceptacion

### CA-001: Consultar eventos

Dado un periodo, cuando se consulta, entonces se muestra actividad vigente paginada.

### CA-002: Determinar proxima vacunacion

Dada recomendacion sin aplicacion posterior, cuando se consulta, entonces figura proxima o
vencida; si existe aplicacion posterior, no figura.

### CA-003: Casos activos

Dado diagnostico, cuando su ultimo estado requiere seguimiento, entonces aparece; recuperado,
cerrado o fallecido no.

### CA-004: Retiros

Dados tratamientos vigentes, cuando se consulta, entonces se informa la mayor fecha final y
dias restantes.

### CA-005: Actividad por veterinario

Dado un periodo, cuando se agrupa, entonces los conteos no duplican sujetos ni incluyen
eventos anulados.

### CA-006: Historial

Dado un sujeto, cuando se consulta, entonces eventos y seguimientos se ordenan
cronologicamente.

### CA-007: Excluir anulados

Dado evento anulado, cuando se reporta, entonces no participa en pendientes ni totales.

### CA-008: Respetar tenant

Dado acceso insuficiente, cuando se consulta, entonces no se exponen datos.

### CA-009: Validar periodo

Dado rango invertido o mayor a 366 dias, cuando se consulta, entonces se rechaza.

## Verificacion

- Pruebas de casos por ultimo estado.
- Pruebas de cumplimiento de proxima vacunacion.
- Pruebas de retiro multiple y anulacion.
- Multi-tenant y periodos.
- Prueba manual mobile-first.

## Preguntas abiertas

No quedan preguntas que bloqueen MVP v2.

Futuro:

- Alertas y notificaciones.
- Cobertura poblacional, epidemiologia y costos.
- Exportaciones y reportes oficiales.

## Decisiones MVP v2

- Proximas fechas como reporte.
- Casos activos por ultimo estado.
- Sin costos ni inventario.
- Sin exportacion/graficos.
