# Spec 013: Controles de Peso

## Estado

Lista para implementar MVP v1 (2026-07-13)

## Objetivo

Permitir registrar y consultar la evolucion del peso promedio por animal de lotes con
engorde activo, distinguiendo el momento productivo, la modalidad del control y el metodo
empleado.

Los controles son eventos historicos e inmutables. Los pesos inicial y final pueden
originarse automaticamente desde `012-engorde-lotes.md`.

`ControlPeso` es la fuente canonica de todos los pesos. El proceso y el cierre no conservan
copias editables del valor.

## Dependencias

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `003-gestion-lotes.md`
- `012-engorde-lotes.md`
- `docs/03-catalogo-maestras.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`
- `docs/decisions/0009-ciclo-engorde-y-cantidad-lote.md`

`002-gestion-animales.md` no es dependencia del alcance MVP v1.

## Alcance MVP v1

Incluye:

- Controles exclusivamente por lote y asociados a un engorde.
- Peso promedio por animal expresado en kilogramos.
- Momento `INICIAL`, `INTERMEDIO` o `FINAL`.
- Modalidad `PROMEDIO_LOTE` o `MUESTRA`.
- Metodo de pesaje obligatorio y configurable por compania.
- Estimacion visual permitida e identificada por su metodo.
- Cantidad de animales obligatoria para muestras.
- Controles inicial y final generados por inicio/cierre del engorde.
- Controles intermedios registrados desde la pantalla de pesos.
- Historial por engorde/lote.
- Diferencia de peso contra el control vigente anterior.
- Anulacion con motivo.
- Seguridad por tenant, granja y permisos.

No incluye:

- Peso de animales individuales.
- Peso total del lote.
- Unidades distintas de kilogramos.
- Edicion de controles.
- Integracion con basculas.
- Importacion masiva.
- Condicion corporal.
- Predicciones, alertas o analisis estadistico.
- Ganancia diaria promedio o conversion alimenticia.

## Modelo conceptual

Las dimensiones del control son independientes:

### Momento

- `INICIAL`: generado por el inicio del engorde.
- `INTERMEDIO`: creado manualmente durante el proceso.
- `FINAL`: generado por el cierre del engorde.

### Modalidad

- `PROMEDIO_LOTE`: valor promedio declarado para el lote completo.
- `MUESTRA`: promedio calculado a partir de una cantidad informada de animales.

### Metodo de pesaje

Maestra por compania que indica como se obtuvo el valor.

Ejemplos:

- Bascula individual.
- Bascula de corral.
- Estimacion visual.

El metodo no reemplaza la modalidad: una muestra puede pesarse con distintos metodos.

`MetodoPesaje` requiere seed inicial y ABM por compania en
`/configuracion/maestras/metodos-pesaje`. El ABM usa `maestras.administrar`; los usuarios
con permisos de pesos solo consultan metodos activos.

## Datos requeridos

### Control de peso

| Campo | Regla |
|-------|-------|
| `companiaId` | Derivado del tenant |
| `granjaId` | Derivado del engorde y validado contra acceso |
| `loteId` | Derivado del engorde |
| `engordeId` | Obligatorio |
| `fecha` | Obligatoria |
| `momento` | `INICIAL`, `INTERMEDIO` o `FINAL` |
| `modalidad` | `PROMEDIO_LOTE` o `MUESTRA` |
| `metodoPesajeId` | Obligatorio, activo y de la misma compania |
| `pesoPromedioKg` | Obligatorio y mayor que cero |
| `cantidadMuestra` | Obligatoria solo para `MUESTRA` |
| `origen` | `ENGORDE_INICIO`, `MANUAL` o `ENGORDE_CIERRE` |
| `cierreEngordeId` | Obligatorio solo para origen `ENGORDE_CIERRE` |
| `observaciones` | Opcional |
| auditoria/anulacion | Responsable, fechas y motivo |

La unidad no se recibe desde el cliente: en MVP v1 siempre es `kg`.

## Reglas de negocio

### Reglas generales

1. El usuario debe tener acceso a la granja y el permiso correspondiente.
2. Engorde y lote deben pertenecer a la compania y granja del contexto.
3. El lote debe tener `estadoRegistro = ACTIVO`.
4. El peso representa promedio por animal, debe ser mayor que cero y admite hasta tres
   decimales.
5. La cantidad aplicable del lote debe ser mayor que cero.
6. El metodo de pesaje debe estar activo y pertenecer a la misma compania.
7. Los controles no se eliminan ni editan.
8. Una correccion requiere anular el control con motivo y registrar otro cuando aplique.
9. Los listados excluyen anulados por defecto y permiten incluirlos para auditoria.

### Control intermedio manual

1. Requiere `pesos.crear`.
2. Solo puede crearse para un engorde `EN_CURSO` y lote operativo `ACTIVO`.
3. Su momento siempre es `INTERMEDIO` y su origen `MANUAL`; el cliente no puede
   sobrescribirlos.
4. La fecha debe estar entre la fecha de inicio del engorde y la fecha actual.
5. Se permiten varios controles el mismo dia; `createdAt` define el orden cuando comparten
   fecha productiva.

### Modalidad muestra

1. `cantidadMuestra` es obligatoria, entera y mayor que cero.
2. En controles manuales no puede superar la cantidad disponible en la fecha productiva:

```text
cantidadEnFecha = cantidadInicial - SUM(bajas no anuladas con fecha <= fechaControl)
```

3. En controles automaticos no puede superar la cantidad inicial o final del evento de
   origen.
4. No se exige porcentaje minimo en MVP v1.
5. En `PROMEDIO_LOTE`, `cantidadMuestra` debe ser nula.

### Controles inicial y final

1. No se crean directamente desde `/pesos`.
2. El control inicial se genera en la transaccion de inicio cuando se informa peso.
3. El control final se genera en la transaccion de cierre cuando se informa peso.
4. Los datos de pesaje se validan con las mismas reglas que un control intermedio.
5. La fecha coincide con la fecha de inicio o cierre.
6. El control inicial queda vinculado por `engordeId`; el final agrega `cierreEngordeId`.
7. La anulacion del proceso o cierre anula tambien el control correspondiente.

Mapeo automatico:

| Operacion origen | `momento` | `origen` | Datos copiados |
|------------------|-----------|----------|----------------|
| Inicio de engorde | `INICIAL` | `ENGORDE_INICIO` | Fecha, peso, modalidad, metodo y muestra |
| Cierre de engorde | `FINAL` | `ENGORDE_CIERRE` | Fecha, peso, modalidad, metodo, muestra y `cierreEngordeId` |

Los valores `momento` y `origen` los asigna el servicio; nunca provienen del cliente.

### Orden y comparacion

1. El historial se ordena por fecha y fecha de creacion.
2. La diferencia se calcula contra el control vigente inmediatamente anterior:

```text
diferenciaKg = pesoPromedioKgActual - pesoPromedioKgAnterior
```

3. Si no existe control anterior, la diferencia se muestra como no disponible.
4. Los controles anulados no participan en la comparacion.
5. No se calcula ganancia diaria promedio en esta spec.

### Anulacion

1. Requiere `pesos.anular` y motivo no vacio.
2. Un control ya anulado no puede anularse nuevamente.
3. Los controles de origen `ENGORDE_INICIO` o `ENGORDE_CIERRE` no se anulan directamente
   desde `/pesos`; se corrige anulando el proceso o cierre que los genero.
4. Un control manual se anula directamente y permanece en historial.
5. En anulaciones automaticas, el control hereda el mismo motivo y usuario del evento de
   engorde que origino la correccion.

## Permisos

- `pesos.ver`
- `pesos.crear`
- `pesos.anular`

No existe `pesos.editar` en MVP v1 porque los controles son eventos inmutables.

Los controles automaticos se autorizan mediante `engorde.iniciar` o `engorde.cerrar`; no
requieren `pesos.crear` adicional. Su anulacion transaccional se autoriza con
`engorde.anular`, sin exigir `pesos.anular`. Para consultarlos en `/pesos` si se requiere
`pesos.ver`.

## API esperada

Las rutas se muestran sin el prefijo global `/api` configurado por NestJS.

| Metodo | Ruta | Uso |
|--------|------|-----|
| `GET` | `/controles-peso` | Historial paginado por engorde/lote y periodo |
| `GET` | `/controles-peso/:id` | Detalle auditable |
| `POST` | `/controles-peso` | Registrar control intermedio |
| `POST` | `/controles-peso/:id/anular` | Anular control manual |
| `GET/POST/PATCH` | `/metodos-pesaje` | ABM y catalogo activo |

La creacion de controles inicial/final se realiza desde los servicios de engorde dentro de
sus transacciones, no mediante endpoints publicos adicionales.

### Contrato de listado

`GET /controles-peso` acepta:

| Parametro | Regla |
|-----------|-------|
| `granjaId` | Obligatorio en API; debe ser accesible |
| `engordeId` | Opcional |
| `loteId` | Opcional |
| `fechaDesde`, `fechaHasta` | Opcionales; rango valido |
| `incluirAnulados` | Opcional, default `false` |
| `page`, `limit` | Paginacion estandar |

### Contrato de creacion manual

`POST /controles-peso` recibe exclusivamente:

```text
engordeId
fecha
modalidad
metodoPesajeId
pesoPromedioKg
cantidadMuestra?
observaciones?
```

`momento`, `origen`, `loteId`, `granjaId`, `companiaId` y `cierreEngordeId` son campos de
servidor. Si el cliente intenta enviarlos, el schema estricto rechaza la solicitud.

### Contrato de anulacion

`POST /controles-peso/:id/anular` recibe:

```text
motivo
```

El motivo es obligatorio luego de aplicar `trim`.

## Impacto sobre el modelo preliminar

La entidad inicial de controles debe ajustarse mediante una migracion nueva:

- Reemplazar la clasificacion unica `tipoControlId` por `momento` y `modalidad`.
- Renombrar o reemplazar `peso` por `pesoPromedioKg`; la unidad kg es implicita en v1.
- Hacer `metodoPesajeId` obligatorio.
- Agregar `origen` y la relacion opcional `cierreEngordeId`.
- Conservar `cantidadMuestra` nullable, obligatoria por regla cuando modalidad es
  `MUESTRA`.
- Mantener tenant, granja, engorde, lote y auditoria de anulacion.

No se edita la migracion inicial ya aplicada.

## Errores funcionales

Los codigos `PESO_*` se definen en `docs/09-catalogo-errores.md`. La API debe distinguir
engorde no activo, peso, fecha, modalidad, muestra, metodo, origen protegido y anulacion;
no debe exponer errores genericos de base de datos.

## UX MVP

### Pantalla `/pesos`

- Contexto visible de granja activa.
- Selector de engorde en curso.
- Resumen de lote, cantidad actual, objetivo y ultimo peso.
- Formulario de control intermedio.
- Selector obligatorio de modalidad y metodo.
- Si modalidad es `MUESTRA`, mostrar y exigir cantidad de animales.
- Historial cronologico con momento, modalidad, metodo, peso y diferencia.
- Identificacion visible de estimaciones visuales.
- Estados `Vigente` y `Anulado` con texto.
- Los controles automaticos indican `Generado al iniciar` o `Generado al cerrar`.
- Enlace a `/engorde` conservando el proceso seleccionado.
- Confirmacion con motivo para anular un control manual.
- Toast en mutaciones y errores de carga inline.

La pantalla sigue `docs/11-guia-ux-ui.md`, es mobile-first y reutiliza el patron compartido
de formularios.

## Criterios de aceptacion

### CA-001: Registrar control intermedio

Dado un engorde en curso, cuando un usuario autorizado registra peso, modalidad y metodo
validos, entonces se crea un control `INTERMEDIO` vigente.

### CA-002: Exigir engorde activo

Dado un lote sin engorde en curso, cuando se intenta crear un control manual, entonces la
API rechaza la operacion.

### CA-003: Peso en kilogramos

Dado un valor de peso valido, cuando se registra, entonces queda almacenado e informado como
promedio por animal en kg.

### CA-004: Validar muestra

Dada modalidad `MUESTRA`, cuando falta cantidad, no es positiva o supera la cantidad
disponible en la fecha del control, entonces se rechaza.

### CA-005: Rechazar muestra en promedio

Dada modalidad `PROMEDIO_LOTE`, cuando se envia cantidad de muestra, entonces se rechaza la
combinacion para evitar datos ambiguos.

### CA-006: Exigir metodo

Dado un metodo ausente, inactivo o de otra compania, cuando se intenta registrar un control,
entonces la API rechaza la operacion.

### CA-007: Permitir estimacion visual

Dado el metodo activo `Estimacion visual`, cuando se registra un control valido, entonces se
acepta y el historial lo identifica claramente.

### CA-008: Generar control inicial

Dado un inicio de engorde con peso, cuando la transaccion finaliza, entonces existe un
control `INICIAL` vinculado.

### CA-009: Generar control final

Dado un cierre con peso, cuando la transaccion finaliza, entonces existe un control `FINAL`
vinculado al cierre.

### CA-010: Mostrar diferencia

Dados dos controles vigentes ordenados, cuando se consulta el historial, entonces el segundo
muestra la diferencia de kg respecto del anterior.

### CA-011: Anular control manual

Dado un control manual incorrecto, cuando se anula con motivo, entonces se conserva, deja de
participar en comparaciones y el historial se recalcula.

### CA-012: Proteger controles automaticos

Dado un control generado por inicio o cierre, cuando se intenta anular directamente,
entonces se rechaza y se indica corregir el evento de origen.

### CA-013: Respetar tenant y granja

Dado un usuario sin acceso a la granja, cuando consulta, crea o anula un control, entonces la
API no expone ni modifica sus datos.

### CA-014: Historial auditable

Dado un engorde con controles vigentes y anulados, cuando se solicita incluir anulados,
entonces se muestran estado, origen, responsable y motivo de anulacion.

### CA-015: Validar fecha

Dada una fecha anterior al inicio del engorde o futura, cuando se intenta registrar un
control manual, entonces se rechaza con `PESO_FECHA_INVALIDA`.

### CA-016: Proteger campos de servidor

Dado un alta manual que intenta enviar momento, origen o IDs derivados, cuando se valida el
body, entonces el schema estricto rechaza esos campos.

### CA-017: Excluir anulados por defecto

Dado un historial con controles anulados, cuando se consulta sin `incluirAnulados`, entonces
solo se devuelven controles vigentes y las diferencias se calculan con ellos.

### CA-018: Propagar anulacion automatica

Dado un proceso o cierre que genera un control automatico, cuando el evento origen se anula,
entonces el control se anula en la misma transaccion con igual motivo y responsable.

## Verificacion requerida para cierre

- Pruebas unitarias de validacion de peso, modalidad, muestra y diferencia.
- Pruebas de integracion para control manual, anulacion y recalculo del historial.
- Pruebas transaccionales de controles automaticos desde inicio/cierre.
- Pruebas de integracion multi-tenant y acceso por granja.
- Prueba manual mobile-first del formulario, estimacion visual, muestra e historial.
- `pnpm typecheck` y lint sin errores nuevos.

## Preguntas abiertas

No quedan preguntas abiertas que bloqueen el MVP v1.

Pendientes para fases posteriores:

- Controles de animales individuales.
- Unidades de masa convertibles.
- Integracion con basculas.
- Porcentaje minimo configurable para muestras.
- Condicion corporal y analisis estadistico.
- Ganancia diaria promedio, predicciones y alertas.

## Decisiones MVP v1

- Solo lotes con engorde activo.
- Peso promedio por animal en kg.
- Eventos inmutables: anular y volver a registrar.
- Momento, modalidad y metodo son dimensiones distintas.
- Metodo obligatorio; estimacion visual permitida.
- Muestra sin porcentaje minimo, pero con cantidad valida.
- Inicio/cierre generan controles automaticos.
- La pantalla de pesos crea solo controles intermedios.
- El historial calcula diferencia simple, no ganancia diaria.
