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
| Decisiones de dominio | Completo | 5 ADRs en `docs/decisions/` |
| Decision de stack | Completo | `decisions/0006-stack-tecnologico.md` |
| Diseno tecnico | Completo | `07-10`, `src/database/entities/` |
| Implementacion | Pendiente | Scaffold Next.js |

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
| Cantidad actual del lote? | Se calcula desde bajas registradas en el engorde activo. |
| Motivos de cierre (venta, sacrificio)? | Si, como maestra de motivo de cierre dentro de engorde. |
| Conversion alimenticia? | Solo en reportes, no en pantalla de engorde. |
| Reabrir engorde cerrado? | No en v1. Correcciones mediante anulacion y nuevo registro. |

### Controles de peso (`013-controles-peso.md`)

| Pregunta | Decision MVP v1 |
|----------|-----------------|
| Peso de lote: promedio o total? | Promedio por animal. |
| Peso estimado visual? | No en v1. |
| Peso de cierre de engorde? | Se registra en cierre de engorde y puede replicarse como control de peso vinculado. |
| Ganancia diaria promedio? | Solo en reportes. |

### Movimientos de ubicacion (`006-movimientos-ubicacion.md`)

| Pregunta | Decision MVP v1 |
|----------|-----------------|
| Movimientos entre granjas? | No en v1. |
| Capacidad maxima de ubicacion? | No en v1. |
| Movimientos masivos? | No en v1. |
| Anulacion recalcula ubicacion actual? | Si. Al anular el ultimo movimiento valido, se recalcula la ubicacion anterior. |

### Reportes MVP v1 (`015`, `017`)

| Pregunta | Decision MVP v1 |
|----------|-----------------|
| Graficos? | No. Solo tablas y totales en pantalla. |
| Exportacion Excel/PDF? | No en v1. |
| Metodo de costo en reportes? | Costo del movimiento asociado al consumo. |
| Conversion alimenticia? | Con peso promedio del lote cuando existan datos suficientes. |
| Comparativas entre lotes? | No en v1. |
| Ganancia diaria promedio? | No en v1. |

## Preguntas pospuestas (no bloquean MVP v1)

Estas preguntas permanecen abiertas porque corresponden a modulos fuera del MVP v1 o a funcionalidades avanzadas:

- Reproduccion: montas, gestacion, partos, destete (specs 008-011, 014).
- Sanidad: inventario de medicamentos, alertas, retiro antes de venta (spec 004, 016).
- Animales individuales: reutilizacion de identificacion, prefijos automaticos (spec 002).
- App movil nativa y modo offline.
- Exportaciones, graficos avanzados, filtros favoritos.
- Modulo comercial (ventas, facturacion).

## Coherencia transversal verificada

- Multi-compania y multi-granja: definido en vision, seguridad y decision `0001`.
- Maestras y alcances: catalogo consolidado y decision `0003`.
- Estado de registro vs operativo: decision `0004`.
- Auditoria y anulacion: decision `0005`, aplicada en specs de eventos.
- Permisos: consolidados en `001-usuarios-perfiles.md` con acciones por modulo.
- Veterinario vs veterinario tratante: decision `0002`.

## Stack tecnologico confirmado

Ver decision completa en `decisions/0006-stack-tecnologico.md`.

Resumen:

- Aplicacion web responsive, mobile-first.
- Next.js + TypeScript + PostgreSQL + TypeORM.
- UI con Tailwind CSS y shadcn/ui.
- Autenticacion con Auth.js (sesiones web).
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
- [ ] Proyecto Next.js scaffolded
- [ ] Base de datos configurada
- [ ] Migracion inicial aplicada
- [ ] Seed ejecutado

## Siguiente paso

Diseno tecnico cerrado. Proceder con scaffold del proyecto.
