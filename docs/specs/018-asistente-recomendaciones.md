# Spec 018: Asistente de Recomendaciones

## Estado

Especificado — pendiente de implementación

## Objetivo

Agregar una capa de **asistente operativo** sobre el MVP v1 ya implementado: detectar
desvíos relevantes, generar recomendaciones accionables, persistir la decisión del usuario y
ajustar umbrales de forma acotada.

El flujo principal de esta versión es el **consumo atípico por lote**, con apoyo liviano de
alertas de reposición de stock y una nota de evaluación al cierre de engorde.

## Dependencias

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `003-gestion-lotes.md`
- `005-inventario-alimentos.md`
- `007-consumo-alimento.md`
- `012-engorde-lotes.md` (contexto de lote en engorde; evaluación al cierre)
- `015-reportes-alimentacion.md` (agregados de consumo como evidencia)
- `docs/decisions/0001-modelo-seguridad-multicompania.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

## Alcance de esta entrega (v1 mínima)

Para la primera implementación se construye únicamente el **corte vertical mínimo
demostrable**, suficiente para mostrar el ciclo completo observación → análisis →
planificación → acción → memoria de decisión:

- Recomendación de tipo `consumo_desvio` (ciclo operativo), disparada al registrar consumo.
- Hipótesis de causa ordenadas por score.
- Persistencia de la recomendación y del feedback (aceptar / descartar).
- Panel + detalle en la web con la acción de decidir.
- Mensaje al usuario por plantilla de reglas, **enriquecido por LLM si hay proveedor
  configurado** (`ollama` u `openai`). Si el modelo no responde, se usa la plantilla.
- Umbrales tomados de **constantes por defecto** (sin ABM ni aprendizaje todavía).

Alcance ampliado (posterior, si hay tiempo) — descrito en el resto de la spec:

- `stock_reposicion` y `evaluacion_cierre`.
- `UmbralGranja` como entidad configurable + aprendizaje acotado (P4).
- ABM de umbrales en UI y endpoint táctico de stock.

El resto de esta especificación describe la **visión completa** del módulo; la entrega v1
implementa el subconjunto anterior.

## Alcance de la versión (visión completa)

Incluye:

- Detección de **desvío de consumo por lote** respecto a un promedio histórico de ventana.
- Generación de **recomendación** con hipótesis de causa **ordenadas por score**.
- Persistencia de la recomendación (historial de decisiones).
- Acciones de usuario: **aceptar** o **descartar** (con motivo opcional).
- Umbrales por granja: valor base configurable + ajuste por aprendizaje simple.
- Panel/listado de recomendaciones pendientes y historial reciente.
- Texto explicativo al operador (“por qué lo sugerimos”), generado por reglas y
  opcionalmente enriquecido por un LLM vía API (si hay clave configurada).
- Evaluación al registrar un consumo válido.
- Evaluación de stock restante vs umbral de reposición (bajo demanda / endpoint).
- Nota de evaluación al cerrar un engorde si hubo recomendaciones aceptadas en el período.

No incluye en esta versión:

- Orquestación distribuida (servicios de agentes independientes o bus de mensajes).
- Sanidad, reproducción ni recomendaciones veterinarias.
- Modelos predictivos / machine learning.
- PWA / sincronización offline.
- Comparación de desempeño entre **compañías** distintas.
- Chat libre con el modelo.
- Notificaciones push / WhatsApp / email.
- Ajuste automático agresivo de umbrales sin tope.

## Principios de diseño

### P1 — Hipótesis rankeadas

El sistema asigna un **score 0–100** a cada hipótesis candidata y prioriza la de mayor score.
El humano decide; el sistema ordena.

Hipótesis iniciales para desvío de consumo (alto):

| Código | Etiqueta usuario | Señales que suben score |
|--------|------------------|-------------------------|
| `desperdicio` | Desperdicio o mal manejo en comedero | Desvío alto, sin bajas recientes, stock coherente |
| `error_registro` | Posible error de registro | Desvío extremo (> umbral crítico), primer registro del día atípico |
| `cambio_racion` | Cambio de ración / etapa | Cambio reciente de alimento vs histórico del lote |
| `enfermedad_temprana` | Revisar condición del lote | Desvío + bajas recientes en la ventana |

### P2 — Ventana temporal y obsolescencia

Los promedios y umbrales aprendidos usan **ventana temporal** (por defecto últimos 30 días o
últimos N lotes equivalentes de la misma granja). El administrador puede **resetear** un
umbral aprendido a su valor manual. No se usa histórico indefinido como única referencia.

### P3 — Multi-compañía y comparación entre granjas

- Aislamiento estricto entre **compañías**.
- Dentro de la misma compañía, solo se contextualiza con **granjas a las que el usuario
  tiene acceso** (`UsuarioGranja`).
- Nunca se cruzan datos entre compañías.

### P4 — Ventana de reposición (híbrido)

- Valor base: parámetro por granja (rango sugerido 3–7 días), configurable por admin.
- Aprendizaje: si el usuario descarta 3 alertas de stock del mismo tipo **sin** quiebre de
  stock en los 7 días siguientes, el sistema puede ampliar el margen en +1 día (tope 7).
- Si hubo quiebre de stock tras descartar, puede reducir el margen en −1 día (piso 3).

### P5 — Conflictos entre recomendaciones

Sobre el mismo lote:

1. Si llega una recomendación de **mayor prioridad** mientras otra está `pendiente` o
   `aceptada_en_evaluacion`, la de menor prioridad pasa a `en_cola` o se cierra como
   `superseded`.
2. Jerarquía: señal de bienestar/condición del lote > riesgo de pérdida inminente (stock) >
   eficiencia (desvío de consumo sin bajas).
3. En esta versión no hay recomendaciones sanitarias clínicas; la jerarquía aplica a stock vs
   consumo.

### P6 — Conectividad

Esta versión del asistente requiere conectividad. Offline / PWA queda para una fase posterior.

## Conceptos principales

### Recomendación

Salida del asistente dirigida al usuario: alerta + hipótesis ordenadas + acción sugerida +
evidencia. Es un registro persistente (no un toast efímero).

### Umbral de granja

Parámetro numérico por granja y tipo (`consumo_desvio_pct`, `consumo_desvio_critico_pct`,
`dias_reposicion`) con origen `manual` o `aprendido`.

### Feedback

Decisión del usuario sobre una recomendación (`aceptada` | `descartada`) con motivo opcional.
Alimenta evaluación y aprendizaje.

### Ciclos de evaluación

| Ciclo | Disparador | Velocidad esperada |
|-------|------------|--------------------|
| Operativo | Tras crear consumo no anulado | Minutos |
| Táctico | Endpoint / evaluación de stock | Días |
| Estratégico | Tras cerrar engorde | Al cierre del lote |

## Datos requeridos

### Recomendacion

- `companiaId`, `granjaId`, `loteId` (nullable solo para alertas de stock de almacén)
- `almacenId` (nullable; requerido en tipo stock)
- `tipo`: `consumo_desvio` | `stock_reposicion` | `evaluacion_cierre`
- `ciclo`: `operativo` | `tactico` | `estrategico`
- `severidad`: `info` | `advertencia` | `critica`
- `estado`: `pendiente` | `en_cola` | `aceptada` | `descartada` | `aceptada_en_evaluacion` | `cerrada` | `superseded`
- `titulo`, `mensaje` (texto al usuario)
- `fuenteMensaje`: `plantilla` | `ollama` | `openai` (origen del texto, no del cálculo)
- `modeloMensaje` (nullable; nombre del modelo si el texto salió de un LLM)
- `hipotesis` (JSON ordenado: `{ codigo, etiqueta, score, motivo }[]`)
- `accionSugerida` (texto)
- `evidencia` (JSON: promedios, % desvío, ventana, ids de consumos, etc.)
- `consumoId` / `engordeId` opcional (trazabilidad del disparador)
- `prioridad` (entero; mayor = más urgente)
- Auditoría: `createdAt`, `createdById` (sistema o usuario), `updatedAt`

### FeedbackRecomendacion

- `recomendacionId`
- `decision`: `aceptada` | `descartada`
- `motivo` opcional
- `usuarioId`, `createdAt`

### UmbralGranja

- `companiaId`, `granjaId`
- `tipo` (enum string)
- `valor` (decimal/number)
- `origen`: `manual` | `aprendido`
- `vigenteDesde`
- `estadoRegistro` (activo/inactivo)

Defaults si no hay fila:

| Tipo | Default |
|------|---------|
| `consumo_desvio_pct` | 15 |
| `consumo_desvio_critico_pct` | 35 |
| `dias_reposicion` | 5 |
| `ventana_dias_historico` | 30 |

## Reglas de negocio

- R-A1: Toda recomendación pertenece a una compañía y una granja del tenant.
- R-A2: El usuario solo ve/actúa recomendaciones de granjas a las que tiene acceso.
- R-A3: No se crean recomendaciones sanitarias clínicas ni se sustituye criterio veterinario.
- R-A4: Al registrar un consumo, si el lote está en engorde y hay suficiente histórico en la
  ventana, se evalúa desvío; si `%desvío >= umbral`, se crea recomendación `consumo_desvio`
  (salvo que ya exista una `pendiente` equivalente no supersedida para el mismo lote/día).
- R-A5: Las hipótesis deben ir ordenadas por `score` descendente; al menos una hipótesis.
- R-A6: Aceptar/descartar solo si estado es `pendiente` (o `en_cola` promovida).
- R-A7: Aceptar pasa a `aceptada_en_evaluacion` en ciclo operativo/táctico; en evaluación de
  cierre puede pasar a `cerrada`.
- R-A8: Descartar permite motivo opcional; siempre deja trazabilidad.
- R-A9: Comparativas históricas usan solo datos de la misma compañía y granjas permitidas.
- R-A10: Umbrales aprendidos no pueden salir del rango [piso, tope] documentado.
- R-A11: Las recomendaciones no se borran físicamente; los estados terminales conservan
  historial.
- R-A12: Si no hay API key de LLM, el mensaje se genera solo con plantillas de reglas (la app
  sigue funcionando).

## Permisos requeridos

- `asistente.recomendaciones.ver`: listar y ver detalle.
- `asistente.recomendaciones.decidir`: aceptar o descartar.
- `asistente.umbrales.ver`: consultar umbrales de la granja.
- `asistente.umbrales.editar`: editar umbrales manuales / resetear aprendidos.

Perfiles operativos (encargado) deben tener ver + decidir. Admin: todos.

## API (borrador)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/asistente/recomendaciones` | Listado filtrable (granja, estado, tipo) |
| GET | `/asistente/recomendaciones/:id` | Detalle |
| POST | `/asistente/recomendaciones/:id/decidir` | Body: `{ decision, motivo? }` |
| GET | `/asistente/umbrales` | Umbrales de granja activa |
| PUT | `/asistente/umbrales/:tipo` | Actualizar valor manual |
| POST | `/asistente/umbrales/:tipo/reset` | Volver a default/manual base |
| POST | `/asistente/ciclos/tactico/stock` | Evaluar stock (idempotente) |

El ciclo operativo se engancha **dentro** del flujo de creación de consumo (mismo request o
post-commit del servicio).

## UX

- Panel “Asistente” en dashboard o hub “Más”: tarjetas de pendientes con badge de severidad
  (texto + color).
- Detalle: evidencias legibles, hipótesis ordenadas, botones Aceptar / Descartar (min 44px).
- Confirmación al descartar (motivo opcional).
- Toast de éxito/error en mutaciones.
- Copy en español claro, sin jerga técnica hacia el usuario (“Recomendación del asistente”,
  “Por qué lo sugerimos”).
- Mobile-first; umbrales en pantalla/sección aparte (no mezclar ABM con el listado de alertas).

## Criterios de aceptación

### CA-001: Desvío genera recomendación

Dado un lote con histórico en ventana y umbral 15%, cuando se registra un consumo ≥15% sobre
el promedio comparable, entonces existe una recomendación `consumo_desvio` en estado
`pendiente` con evidencia y ≥1 hipótesis ordenada.

### CA-002: Sin desvío no hay ruido

Dado un consumo dentro del umbral, cuando se registra, entonces no se crea recomendación de
desvío para ese evento.

### CA-003: Decidir

Dado una recomendación pendiente, cuando el usuario acepta o descarta, entonces queda
registrado el feedback y cambia el estado; un segundo decide se rechaza.

### CA-004: Tenant y granja

Dado un usuario sin acceso a la granja G, cuando lista recomendaciones, entonces no ve las de
G.

### CA-005: LLM opcional

Dado el sistema sin API key / sin Ollama / `LLM_PROVIDER=none`, cuando se genera una
recomendación, entonces el mensaje de plantilla es válido y visible, con
`fuenteMensaje = plantilla`.

### CA-006: Umbral aprendido con tope

Dado 3 descartes de stock sin quiebre posterior, cuando corre el aprendizaje, entonces
`dias_reposicion` aumenta como máximo hasta 7.

### CA-007: UI del panel

Dado al menos una pendiente, cuando el usuario abre el panel del asistente, entonces ve
título, severidad, acción sugerida y puede decidir.

### CA-008: Redacción LLM visible

Dado un proveedor LLM configurado y disponible, cuando se genera una recomendación,
entonces el mensaje es redactado por el modelo, `fuenteMensaje` indica el proveedor y
la UI muestra un badge de origen. Los scores y la evidencia siguen saliendo de reglas.

## Componentes internos

| Responsabilidad | Dónde vive |
|-----------------|------------|
| Validación de captura (consumo/inventario) | Módulos existentes |
| Cálculo de desvío y scores de hipótesis | `asistente.rules.ts` |
| Selección de acción sugerida | `AsistenteService` |
| Persistencia y listados | `AsistenteService` + entidades |
| Evaluación al cierre / aprendizaje de umbrales | `AsistenteService` |
| Redacción LLM (opcional) | `LlmRedaccionService` vía `LLM_PROVIDER` (none / ollama / openai) |

## Errores nuevos (catálogo)

| Código | HTTP | Mensaje usuario (orientativo) |
|--------|------|-------------------------------|
| `RECOMENDACION_NO_ENCONTRADA` | 404 | No encontramos esa recomendación. |
| `RECOMENDACION_NO_PENDIENTE` | 409 | Esa recomendación ya fue resuelta. |
| `UMBRAL_FUERA_DE_RANGO` | 422 | El valor del umbral está fuera del rango permitido. |
| `UMBRAL_NO_ENCONTRADO` | 404 | No hay umbral configurado para ese tipo. |

## Definición de listo

- Spec aceptada.
- Migración TypeORM + entidades.
- Módulo API + enganche en creación de consumo.
- UI panel + detalle + decidir.
- Datos de prueba o seed con al menos una alerta visible.
- Permisos sembrados en perfiles demo.
