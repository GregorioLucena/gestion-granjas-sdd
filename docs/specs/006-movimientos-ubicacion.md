# Spec 006: Movimientos de Ubicacion

## Estado

Implementado MVP v1 (2026-07-14)

## Objetivo

Registrar cambios de ubicacion interna de lotes sin perder origen, destino, fecha, motivo y
responsable. La ubicacion inicial se asigna al crear el lote; todo cambio posterior se hace
mediante un movimiento.

## Dependencias

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `003-gestion-lotes.md`
- `docs/03-catalogo-maestras.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

No bloquea engorde, pesos ni reportes del MVP v1.

## Alcance MVP v1

Incluye:

- Movimientos de lotes dentro de la misma granja.
- Origen derivado de la ubicacion actual.
- Destino, fecha, motivo obligatorio y observaciones.
- Actualizacion transaccional de `Lote.ubicacionId`.
- Historial cronologico.
- Anulacion exclusiva del ultimo movimiento vigente.
- Recalculo de ubicacion anterior al anular.
- ABM de motivos por compania.
- Tenant, granja, permisos y auditoria.

No incluye:

- Animales individuales.
- Traslados entre granjas o companias.
- Movimientos masivos.
- Jerarquia o capacidad de ubicaciones.
- Reserva de espacios.
- Anulacion de movimientos historicos intermedios.

## Conceptos

### Ubicacion inicial

Ubicacion opcional asignada al crear el lote. No genera movimiento. Una vez que el lote
tiene un movimiento vigente, `ubicacionId` deja de ser editable directamente.

### Movimiento vigente

Evento no anulado. El ultimo determina la ubicacion actual.

### Cadena de ubicaciones

Cada movimiento conserva origen y destino. Para evitar reconstrucciones ambiguas, las fechas
no pueden retroceder respecto del ultimo movimiento vigente.

## Maestra requerida

### Motivo de movimiento de ubicacion

- Alcance por compania.
- Nombre, descripcion y estado de registro.
- Obligatorio en movimientos nuevos.
- Seed inicial: Cambio productivo, Limpieza, Manejo sanitario, Reorganizacion, Otro.
- ABM `/configuracion/maestras/motivos-movimiento-ubicacion`.
- Administracion con `maestras.administrar`.

## Datos

| Campo | Regla |
|-------|-------|
| `companiaId` | Derivado del tenant |
| `granjaId` | Obligatorio y accesible |
| `loteId` | Obligatorio |
| `ubicacionOrigenId` | Derivado por servidor; puede ser nulo |
| `ubicacionDestinoId` | Obligatorio |
| `fecha` | Obligatoria |
| `motivoId` | Obligatorio, activo y de la misma compania |
| `observaciones` | Opcional |
| auditoria/anulacion | Responsable, fechas y motivo |

## Reglas de negocio

1. Usuario, lote, origen y destino deben pertenecer al mismo tenant y granja.
2. El lote debe tener estado de registro y operativo `ACTIVO`.
3. La ubicacion destino debe estar activa.
4. El destino no puede ser igual a la ubicacion actual.
5. El origen lo deriva la API; el cliente no puede enviarlo.
6. La fecha no puede ser anterior al inicio del lote, futura ni anterior a la fecha del
   ultimo movimiento vigente.
7. Se permiten varios movimientos el mismo dia; `createdAt` desempata el orden.
8. Crear movimiento y actualizar `Lote.ubicacionId` es una operacion transaccional.
9. Luego del primer movimiento, la ubicacion no se edita desde el ABM del lote.
10. Los movimientos son inmutables.
11. Solo puede anularse el ultimo movimiento vigente.
12. Al anularlo, `Lote.ubicacionId` vuelve al destino del movimiento vigente anterior o a
    `Lote.ubicacionInicialId` si no queda ninguno.
13. Anulacion y recalculo son transaccionales.
14. Un movimiento anulado permanece en historial y no puede anularse otra vez.

## Permisos

- `ubicaciones.movimientos.ver`
- `ubicaciones.movimientos.crear`
- `ubicaciones.movimientos.anular`

## API

Rutas sin prefijo global `/api`:

| Metodo | Ruta | Uso |
|--------|------|-----|
| `GET` | `/movimientos-ubicacion` | Historial paginado |
| `POST` | `/movimientos-ubicacion` | Crear movimiento |
| `POST` | `/movimientos-ubicacion/:id/anular` | Anular ultimo vigente |
| `GET/POST/PATCH` | `/motivos-movimiento-ubicacion` | Catalogo y ABM |

`GET` acepta `granjaId` obligatorio, `loteId?`, `fechaDesde?`, `fechaHasta?`,
`incluirAnulados?`, `page` y `limit`.

`POST` recibe `granjaId`, `loteId`, `ubicacionDestinoId`, `fecha`, `motivoId` y
`observaciones?`. Origen, compania y auditoria son campos de servidor.

La anulacion recibe `{ motivo }`.

## UX

Pantalla `/movimientos-ubicacion`:

- Granja activa visible.
- Selector de lote activo.
- Ubicacion actual destacada.
- Formulario corto de destino, fecha, motivo y observaciones.
- Historial con origen, destino, motivo, fecha, responsable y estado.
- Solo el ultimo movimiento vigente muestra accion `Anular`.
- Enlace desde `/lotes`.
- Confirmacion con motivo y toast para mutaciones.
- Errores de carga inline.

## Errores

Usar codigos `MOV_UBICACION_*` de `docs/09-catalogo-errores.md`, incluyendo fecha,
destino, motivo, entidad inactiva, orden, anulacion y bloqueo de edicion directa.

## Criterios de aceptacion

### CA-001: Registrar movimiento

Dado un lote activo, cuando se registra destino, fecha y motivo validos, entonces se crea el
movimiento y se actualiza la ubicacion dentro de una transaccion.

### CA-002: Derivar origen

Dada una ubicacion actual, cuando se crea un movimiento, entonces la API la guarda como
origen sin confiar en el cliente.

### CA-003: Validar misma granja

Dado un destino de otra granja, cuando se intenta mover el lote, entonces se rechaza.

### CA-004: Impedir mismo destino

Dado un lote ya ubicado en el destino, cuando se intenta moverlo, entonces se rechaza.

### CA-005: Mantener orden temporal

Dado un ultimo movimiento vigente, cuando se informa una fecha anterior, entonces se
rechaza sin alterar la cadena.

### CA-006: Bloquear edicion directa

Dado un lote con movimientos, cuando se intenta editar `ubicacionId` desde el ABM, entonces
se exige registrar otro movimiento.

### CA-007: Anular ultimo movimiento

Dado el ultimo movimiento vigente, cuando se anula con motivo, entonces se conserva y la
ubicacion vuelve a la anterior atomicamente.

### CA-008: Proteger movimientos intermedios

Dado un movimiento que no es el ultimo vigente, cuando se intenta anular, entonces se
rechaza.

### CA-009: Historial auditable

Dado un lote con movimientos vigentes y anulados, cuando se consulta incluyendo anulados,
entonces se muestran cadena, estados, responsables y motivos.

### CA-010: Respetar acceso

Dado un usuario sin acceso a la granja, cuando consulta o muta movimientos, entonces la API
no expone ni modifica sus datos.

## Impacto sobre modulos existentes

- Agregar `Lote.ubicacionInicialId` inmutable; para lotes existentes copiar la ubicacion
  actual al aplicar la migracion.
- Bloquear actualizacion directa de `ubicacionId` luego del primer movimiento.
- Crear migracion nueva; no editar la migracion inicial.
- Incorporar motivo y permisos faltantes en seed/shared.

## Verificacion para cierre

- Pruebas unitarias de fechas, origen/destino y anulacion.
- Pruebas transaccionales de movimiento y rollback.
- Pruebas multi-tenant y por granja.
- Prueba manual mobile-first.
- Typecheck y lint sin errores nuevos.

## Preguntas abiertas

No quedan preguntas que bloqueen MVP v1.

Futuro:

- Animales individuales.
- Traslados entre granjas.
- Movimientos masivos.
- Capacidad de ubicaciones.
- Reconstruccion al anular eventos intermedios.

## Decisiones MVP v1

- Solo lotes.
- Ubicacion inicial desde alta; cambios solo mediante movimientos.
- Motivo obligatorio de maestra.
- Fechas retroactivas ordenadas.
- Solo se anula el ultimo movimiento vigente.
