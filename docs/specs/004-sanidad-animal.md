# Spec 004: Sanidad Animal

## Estado

Lista para implementar MVP v2 (2026-07-13)

## Objetivo

Mantener historial sanitario trazable de animales y lotes mediante vacunaciones,
diagnosticos, tratamientos, controles y asignaciones de veterinario tratante.

## Dependencias

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `002-gestion-animales.md`
- `003-gestion-lotes.md`
- `docs/03-catalogo-maestras.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

## Alcance MVP v2

Incluye:

- Veterinario tratante historico para animal o lote.
- Vacunacion.
- Diagnostico/caso sanitario.
- Tratamiento vinculado opcionalmente a un diagnostico.
- Control preventivo.
- Eventos sobre un animal o un lote.
- Cantidad tratada en eventos de lote.
- Periodo de retiro y bloqueo de salida para consumo.
- Anulacion con motivo.
- Catalogos sanitarios.

No incluye:

- Inventario de medicamentos/vacunas.
- Eventos para varios lotes a la vez.
- Clonar eventos del lote a cada animal.
- Alertas/notificaciones automaticas.
- Recetas, laboratorios, costos o autoridades sanitarias.

## Modelo conceptual

### Sujeto sanitario

Cada evento aplica exactamente a un `animalId` o un `loteId`, nunca a ambos. Un evento de
lote es un solo registro y conserva `cantidadTratada`; no crea eventos individuales.

### Evento sanitario

Cabecera inmutable con tenant, granja, sujeto, tipo, fecha, responsable, observaciones y
auditoria. Tipos:

- `VACUNACION`
- `DIAGNOSTICO`
- `TRATAMIENTO`
- `CONTROL_PREVENTIVO`

Cada tipo tiene detalle propio.

### Caso sanitario

Un diagnostico abre un caso con estado:

`ACTIVO | EN_TRATAMIENTO | RECUPERADO | CRONICO | FALLECIDO | CERRADO`.

Cambios de estado son seguimientos fechados, no edicion destructiva.

### Periodo de retiro

Intervalo hasta el cual un animal o lote tratado no puede venderse o salir para consumo. El
tratamiento conserva la fecha calculada como dato historico.

## Maestras

Por compania:

- Vacuna.
- Enfermedad.
- Medicamento/producto sanitario, con `diasRetiroDefault`.
- Via de aplicacion.
- Unidad de dosis.
- Gravedad.
- Motivo de control.

Enums globales:

- Tipo de evento sanitario.
- Estado de caso.

Son valores fijos con `codigoSistema`, no maestras ABM.

En MVP son catalogos; no controlan existencias.

## Veterinario tratante

Datos: sujeto, veterinario, fecha inicio, fecha fin opcional y observaciones.

Reglas:

1. Veterinario es usuario activo de la misma compania con perfil `Veterinario` o permisos
   sanitarios equivalentes.
2. La asignacion es opcional.
3. Solo existe una asignacion vigente por sujeto.
4. Los intervalos son `[fechaInicio, fechaFin)`. Al reemplazar, `fechaFin` anterior toma la
   nueva `fechaInicio`, sin solapamiento.
5. Fechas no se solapan ni preceden alta del sujeto.
6. El historial no se elimina.

## Datos por evento

### Comunes

- `granjaId`, sujeto y `fecha`.
- `veterinarioResponsableId` segun tipo.
- `cantidadTratada` obligatoria para lote y no mayor que cantidad disponible en esa fecha.
- Observaciones opcionales.

### Vacunacion

- `vacunaId`.
- Dosis y unidad, ambas presentes o ausentes.
- Via de aplicacion opcional.
- Proxima fecha sugerida opcional y posterior al evento.

### Diagnostico

- `enfermedadId`.
- Descripcion/hallazgos.
- Gravedad opcional.
- Estado inicial `ACTIVO`.

### Tratamiento

- `diagnosticoId` opcional y del mismo sujeto.
- `medicamentoId`.
- Dosis/unidad y frecuencia opcionales.
- Fecha inicio y fin planificada opcional.
- Resultado opcional.
- `diasRetiroAplicado` y `fechaFinRetiro` calculada.

### Control preventivo

- `motivoControlId`.
- Hallazgos y recomendaciones opcionales.

## Reglas

1. Todo dato filtra por tenant y granja permitida.
2. Sujeto debe pertenecer a la granja y estar operativo al momento del evento.
3. Fechas no pueden ser futuras ni anteriores al alta/inicio del sujeto.
4. Diagnostico y tratamiento exigen veterinario responsable.
5. Vacunacion y control permiten veterinario opcional; `createdBy` siempre identifica a
   quien registro.
6. Catalogos deben estar activos al crear; historiales conservan inactivos.
7. Tratamiento vinculado debe corresponder al mismo sujeto y caso no anulado.
8. `fechaFin >= fechaInicio`.
9. Retiro usa dias informados o default del medicamento; no puede ser negativo.
10. La mayor fecha de retiro vigente del sujeto bloquea venta/salida para consumo; no
    bloquea registrar muerte o descarte.
11. Eventos registrados son inmutables.
12. Correcciones se hacen anulando con motivo y creando otro evento.
13. Anular un diagnostico con tratamientos vigentes se bloquea hasta anular estos.
14. Anular tratamiento recalcula la restriccion de retiro.
15. Evento anulado no participa en historial operativo, casos ni reportes, pero queda en
    auditoria.
16. Para evento de lote, la cantidad disponible en `fecha` es:

```text
con engorde vigente para esa fecha:
  cantidadInicialEngorde - SUM(bajas vigentes con fecha <= evento)
sin engorde:
  cantidadInicialLote
```

   Un lote cerrado no recibe eventos nuevos; el calculo historico se usa solo para fechas en
   las que estaba activo. Engordes y bajas anulados se ignoran.

## Permisos

- `sanidad.ver`
- `sanidad.crear`
- `sanidad.anular`
- `sanidad.casos.seguir`
- `sanidad.veterinario_asignar`
- `maestras.administrar`

No existe `sanidad.editar`.

## API

| Metodo | Ruta |
|--------|------|
| `GET` | `/sanidad/eventos` |
| `POST` | `/sanidad/eventos` |
| `GET` | `/sanidad/eventos/:id` |
| `POST` | `/sanidad/eventos/:id/anular` |
| `POST` | `/sanidad/diagnosticos/:id/seguimientos` |
| `GET` | `/sanidad/historial/animales/:animalId` |
| `GET` | `/sanidad/historial/lotes/:loteId` |
| `GET/POST/PATCH` | `/sanidad/veterinarios-tratantes` |

Listado: granja y periodo obligatorios; sujeto, tipo, veterinario, enfermedad, vacuna y
estado de caso opcionales; paginado.

Campos de tenant, auditoria, estado de anulacion y retiro calculado son de servidor.

## UX

Hub `/sanidad` con accesos a eventos, casos, proximas vacunaciones y veterinarios tratantes.
Un formulario cambia campos segun tipo sin mostrar secciones irrelevantes.

- Granja y sujeto visibles.
- Eventos en linea de tiempo.
- Casos activos destacados.
- Retiro vigente con fecha y bloqueo explicito.
- Anulacion confirmada con motivo y toast.
- Carga/error/empty segun guia UX.

## Criterios de aceptacion

### CA-001: Asignar veterinario

Dado veterinario valido, cuando se asigna, entonces se cierra cualquier asignacion vigente
sin solapamiento y se conserva historial.

### CA-002: Registrar vacunacion

Dado sujeto y vacuna validos, cuando se registra, entonces queda un evento auditable con
proxima fecha opcional.

### CA-003: Registrar diagnostico

Dado veterinario valido, cuando registra diagnostico, entonces se abre caso activo.

### CA-004: Registrar tratamiento

Dado medicamento y veterinario validos, cuando registra tratamiento, entonces se conserva
detalle, vinculo opcional y retiro calculado.

### CA-005: Evento por lote

Dado lote con cantidad disponible, cuando se registra cantidad tratada valida, entonces se
crea un solo evento de lote.

### CA-006: Bloquear salida por retiro

Dado retiro vigente, cuando se intenta venta/salida para consumo, entonces se rechaza con
fecha final.

### CA-007: Inmutabilidad

Dado evento registrado, cuando se intenta editar o eliminar, entonces se rechaza.

### CA-008: Anular evento

Dado evento sin dependencias bloqueantes, cuando se anula con motivo, entonces se excluye de
operacion y reportes, conservando auditoria.

### CA-009: Proteger diagnostico

Dado diagnostico con tratamientos vigentes, cuando se intenta anular, entonces se rechaza.

### CA-010: Respetar tenant

Dado usuario sin acceso a granja, cuando consulta o muta, entonces no se exponen datos.

## Verificacion

- Unitarias de tipo/detalle, fechas, cantidad y retiro.
- Integracion de diagnostico, tratamiento, anulacion y bloqueo.
- Asignaciones sin solapamiento.
- Multi-tenant y permisos.
- Prueba manual mobile-first.

## Preguntas abiertas

No quedan preguntas que bloqueen MVP v2.

Futuro:

- Inventario sanitario y vencimientos.
- Eventos masivos.
- Alertas y notificaciones.
- Costos e integraciones.

## Decisiones MVP v2

- Veterinario obligatorio solo en diagnostico/tratamiento.
- Eventos inmutables.
- Evento de lote unico.
- Retiro con bloqueo.
- Catalogos sin inventario.
- Proximas fechas visibles, sin alertas automaticas.
