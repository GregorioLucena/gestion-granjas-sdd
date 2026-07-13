# Cierre del SDD

Este documento cierra la fase de especificacion funcional del proyecto. Resume lo completado, resuelve preguntas abiertas relevantes para el MVP v1 y declara el SDD listo para pasar a diseno tecnico e implementacion.

## Estado general

| Area | Estado | Observacion |
|------|--------|-------------|
| Vision y principios | Completo | `00-vision.md` |
| Glosario | Completo | `01-glossary.md` |
| Roadmap SDD | Completo | `02-roadmap-sdd.md` |
| Catalogo de maestras | Completo | `03-catalogo-maestras.md` |
| Diagramas de flujo | Completo | `04-diagrama-flujo.md` |
| MVP tecnico v1 | Completo | `05-mvp-tecnico.md` |
| Specs funcionales | Completo | 18 specs en `docs/specs/` |
| Decisiones de dominio | Completo | ADRs en `docs/decisions/`, incluidas `0009` engorde y `0010` reproduccion |
| Decision de stack | Completo | `decisions/0006-stack-tecnologico.md` |
| Diseno tecnico | Completo | MVP v1 en `07-10`; MVP v2 en `15-diseno-tecnico-mvp-v2.md` |
| Implementacion | En curso | MVP v1 implementado hasta consumo; siguientes: engorde y pesos |

## Cobertura funcional

### Especificado y listo para implementar (MVP v1)

- Configuracion base: companias, granjas, maestras.
- Seguridad: usuarios, perfiles, permisos, acceso por granja.
- Lotes productivos.
- Movimientos de ubicacion (lotes).
- Inventario de alimentos.
- Consumo de alimento por lote.
- Engorde de lotes.
- Controles de peso por lote.
- Reportes basicos de alimentacion y engorde.

### Especificado para fases posteriores (MVP v2+)

- Animales individuales completos.
- Sanidad animal.
- Ciclo reproductivo: montas, gestacion, partos, destete.
- Reportes reproductivos y sanitarios.
- Alertas, exportaciones avanzadas, app movil nativa.

## Verificacion de calidad SDD

Todas las specs cumplen la regla de avance definida en `02-roadmap-sdd.md`:

- Objetivo claro.
- Alcance y fuera de alcance.
- Datos requeridos.
- Reglas de negocio.
- Criterios de aceptacion.
- Preguntas abiertas resueltas o marcadas para despues.

## Resolucion de preguntas abiertas para MVP v1

Las preguntas que afectan directamente al MVP v1 se resuelven aqui. Las demas quedan explicitamente pospuestas para MVP v2 o fases futuras.

### Seguridad (`001-usuarios-perfiles.md`)

| Pregunta | Decision MVP v1 |
|----------|-----------------|
| Correo como usuario obligatorio? | Si. El login usara correo electronico como identificador unico. |
| Recuperacion de contrasena en MVP? | No. Queda para fase posterior. En v1 el administrador puede restablecer la contrasena. |

### Configuracion base (`000-configuracion-base.md`)

| Pregunta | Decision MVP v1 |
|----------|-----------------|
| Identificacion fiscal obligatoria? | No. Campo opcional. |
| Jerarquia de ubicaciones? | No en v1. Ubicaciones planas por granja. Jerarquia (galpon > corral) en v2. |
| Coordenadas geograficas de granja? | Opcional. No requerido en v1. |

### Lotes (`003-gestion-lotes.md`)

| Pregunta | Decision MVP v1 |
|----------|-----------------|
| Identificacion manual o automatica? | Manual en v1. El modelo debe permitir automatica futura. |
| Cantidad actual calculada o manual? | Calculada desde bajas de engorde. No editable manualmente en v1. |
| Traslados entre lotes? | No en v1. |
| Division o fusion de lotes? | No en v1. |

### Inventario (`005-inventario-alimentos.md`)

| Pregunta | Decision MVP v1 |
|----------|-----------------|
| Inventario negativo? | No permitido. |
| Metodo de costo? | Costo manual por movimiento en v1. Promedio ponderado en fase posterior. |
| Control de vencimiento? | No en v1. |
| Conversion presentacion/unidad base? | Si. Ejemplo: 1 saco = 40 kg. |
| Mezclas de alimentos? | No en v1. |

### Consumo (`007-consumo-alimento.md`)

| Pregunta | Decision MVP v1 |
|----------|-----------------|
| Consumo sin almacen origen? | No. Todo consumo debe descontar inventario de un almacen. |
| Consumo estimado? | No en v1. Cantidad exacta requerida. |
| Etapa productiva obligatoria? | No en v1. |
| Metodo de costo del consumo? | Costo del movimiento de inventario asociado cuando exista. |

### Engorde (`012-engorde-lotes.md`)

| Pregunta | Decision MVP v1 |
|----------|-----------------|
| Engorde automatico al crear lote? | No. El engorde se inicia explicitamente. |
| Cantidad actual del lote? | Se calcula desde bajas no anuladas; no es editable. |
| Motivos de cierre (venta, sacrificio)? | Si, como maestra de motivo de cierre dentro de engorde. |
| Conversion alimenticia? | Solo en reportes, no en pantalla de engorde. |
| Reabrir engorde cerrado? | Solo anulando el cierre con motivo; se conserva el cierre y se reabren engorde/lote. |
| Cantidad final distinta de la calculada? | No. Toda diferencia debe registrarse antes como baja. |
| Varios engordes por lote? | Un solo proceso valido; un inicio anulado sin actividad puede reemplazarse. |

### Controles de peso (`013-controles-peso.md`)

| Pregunta | Decision MVP v1 |
|----------|-----------------|
| Peso de lote: promedio o total? | Promedio por animal. |
| Unidad? | Solo kg en v1. |
| Peso estimado visual? | Si, con metodo obligatorio y claramente identificado. |
| Peso de inicio/cierre? | Si se informa, engorde genera automaticamente un control vinculado. |
| Controles manuales? | Solo intermedios y para engordes activos. |
| Editar un control? | No. Se anula con motivo y se registra otro. |
| Clasificacion? | Momento, modalidad y metodo son dimensiones separadas. |
| Ganancia? | El historial muestra diferencia simple; ganancia diaria queda para reportes futuros. |

### Movimientos de ubicacion (`006-movimientos-ubicacion.md`)

| Pregunta | Decision MVP v1 |
|----------|-----------------|
| Movimientos entre granjas? | No en v1. |
| Capacidad maxima de ubicacion? | No en v1. |
| Movimientos masivos? | No en v1. |
| Anulacion recalcula ubicacion actual? | Si. Al anular el ultimo movimiento valido, se recalcula la ubicacion anterior. |
| Edicion directa de ubicacion? | Solo ubicacion inicial; cambios posteriores mediante movimientos. |
| Que movimiento se anula? | Solo el ultimo vigente. |
| Fecha y motivo? | Fecha retroactiva ordenada y motivo de maestra obligatorio. |

### Reportes MVP v1 (`015`, `017`)

| Pregunta | Decision MVP v1 |
|----------|-----------------|
| Graficos? | No. Solo tablas y totales en pantalla. |
| Exportacion Excel/PDF? | No en v1. |
| Metodo de costo en reportes? | Costo del movimiento asociado al consumo. |
| Costos faltantes? | Mostrar costo conocido parcial, cantidad sin costo y cobertura; nunca asumir cero. |
| Conversion alimenticia? | Consumo kg / ((peso final promedio - inicial) x cantidad final). |
| Comparativas entre lotes? | No en v1. |
| Ganancia diaria promedio? | No en v1. |

## Decisiones cerradas para MVP v2

- Animales: identificacion no reutilizable, parentesco opcional y estados derivados de
  eventos de venta/muerte/descarte.
- Sanidad: eventos inmutables, veterinario obligatorio en diagnostico/tratamiento, retiro
  bloqueante y catalogos sin inventario.
- Reproduccion: un ciclo agrupa servicios del mismo celo; gestacion nace de confirmacion
  positiva y un parto no confirmado se admite como excepcion trazable.
- Crias: conteos obligatorios, individuos opcionales con identificacion manual.
- Lactancia: bajas fechadas y destete total con conciliacion exacta.
- Reportes: tasas por cohorte del primer servicio y denominadores vacios como no disponible.

## Alcance futuro no bloqueante

Las decisiones funcionales de animales, sanidad y reproduccion quedaron resueltas en las
specs MVP v2 y ADR `0010`. Permanecen fuera de las versiones especificadas:

- Identificacion automatica y genealogia avanzada.
- Inventario sanitario, alertas y notificaciones.
- Adopciones, transferencias y destetes parciales.
- App movil nativa y modo offline.
- Exportaciones, graficos avanzados y filtros favoritos.
- Modulo comercial (ventas, facturacion).

## Coherencia transversal verificada

- Multi-compania y multi-granja: definido en vision, seguridad y decision `0001`.
- Maestras y alcances: catalogo consolidado y decision `0003`.
- Estado de registro vs operativo: decision `0004`.
- Auditoria y anulacion: decision `0005`, aplicada en specs de eventos.
- Ciclo de engorde, cantidad actual y reapertura: decision `0009`.
- Ciclo reproductivo, crias y anulacion en cadena: decision `0010`.
- Permisos: consolidados en `001-usuarios-perfiles.md` con acciones por modulo.
- Veterinario vs veterinario tratante: decision `0002`.

## Stack tecnologico confirmado

Ver decision completa en `decisions/0006-stack-tecnologico.md`.

Resumen:

- Aplicacion web responsive, mobile-first.
- Next.js + TypeScript + PostgreSQL + TypeORM.
- UI con Tailwind CSS y shadcn/ui.
- Autenticacion JWT en NestJS con refresh token en cookie HttpOnly, segun ADR `0007`.
- Arquitectura preparada para app movil nativa futura mediante capa de API clara.

## Criterios de cierre cumplidos

- [x] Vision y alcance definidos.
- [x] Dominio modelado con glosario y maestras.
- [x] Modulos especificados con criterios de aceptacion.
- [x] Decisiones arquitectonicas de dominio documentadas.
- [x] MVP v1 acotado y priorizado.
- [x] Preguntas abiertas del MVP v1 resueltas.
- [x] Stack tecnologico definido.
- [x] Convenciones y catalogo de errores documentados
- [x] Diseno tecnico cerrado (`10-cierre-diseno-tecnico.md`)
- [x] Monorepo Next.js + NestJS creado
- [x] Base de datos PostgreSQL configurada
- [x] Migracion inicial aplicada
- [x] Seed disponible y ejecutable
- [x] Specs 000, 001, 003, 005 y 007 implementadas
- [ ] Spec 012 engorde implementada
- [ ] Spec 013 controles de peso implementada
- [ ] Reportes MVP implementados

## Siguiente paso

Implementar `012-engorde-lotes.md`, luego `013-controles-peso.md` y finalmente los reportes
`015` y `017`. `006-movimientos-ubicacion.md` es opcional para el cierre del MVP v1.
