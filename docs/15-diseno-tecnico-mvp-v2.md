# Diseno tecnico inicial — MVP v2

## Estado

Listo para implementar (2026-07-13)

## Alcance

Traduce las specs `002`, `004`, `008`-`011`, `014` y `016` a una estructura tecnica
coherente con NestJS, TypeORM, PostgreSQL, Next.js y paquetes compartidos.

Las reglas funcionales viven en las specs y ADR `0010`; este documento no las reemplaza.

## Modulos API

```text
apps/api/src/modules/
  animales/
  sanidad/
  reproduccion/
  reportes-sanidad/
  reportes-reproduccion/
```

Cada modulo mantiene controller, service, rules, schemas, permissions y pruebas. Controllers
validan/autorizan/delegan; reglas y transacciones viven en servicios.

## Entidades

### Animales

- `Animal`: tenant, granja, identificacion normalizada, datos base, progenitores,
  `estadoRegistro`, `estadoOperativo` denormalizado y auditoria.
- `EventoCicloAnimal`: animal, tipo, fecha, motivo, anulacion y auditoria.
- `MotivoEventoAnimal`: catalogo por compania y tipo terminal.

Restricciones:

- Unique `(granjaId, identificacionNormalizada)` sin filtrar por estado.
- Checks de fechas.
- FK de progenitores a `Animal`.
- Un evento terminal vigente por animal mediante indice parcial.

### Sanidad

- `AsignacionVeterinario`: sujeto polimorfico controlado (`animalId XOR loteId`), intervalo.
- `EventoSanitario`: cabecera comun y sujeto XOR.
- `VacunacionDetalle`.
- `DiagnosticoDetalle`.
- `SeguimientoDiagnostico`.
- `TratamientoDetalle`.
- `ControlPreventivoDetalle`.

Usar tablas de detalle 1:1 evita columnas nulas y permite constraints por tipo. Un evento
tiene exactamente un detalle compatible, validado por servicio y pruebas.

### Reproduccion

- `CicloReproductivo`.
- `ServicioReproductivo`.
- `ConfirmacionGestacion`.
- `Gestacion`.
- `ControlGestacion`.
- `FalloGestacion`.
- `Parto`.
- `CriaParto`: relaciona conteo individualizable con `animalId` opcional y estado de
  lactancia.
- `BajaLactancia`.
- `BajaLactanciaCria`.
- `Destete`.
- `PesoDesteteCria`.

Indices parciales:

- Un ciclo no terminal vigente por hembra (`PENDIENTE_CONFIRMACION`, `GESTANTE` o
  `EN_LACTANCIA`).
- Una gestacion activa vigente por hembra.
- Un parto vigente por ciclo.
- Un destete vigente por parto.

## Estados derivados

Los eventos son fuente historica. Se permite denormalizar estado actual en `Animal`,
`CicloReproductivo`, `Gestacion` y `CriaParto` para consulta, siempre actualizado dentro de
la misma transaccion que crea/anula el evento.

No se usa el estado de registro para representar venta, muerte, fallo, parto o destete.

## Sujetos polimorficos

Para sanidad se usan dos FK opcionales con check XOR:

```text
(animal_id IS NOT NULL) <> (lote_id IS NOT NULL)
```

No usar `entidadTipo + entidadId` sin FK, porque impediria integridad referencial y filtrado
seguro por tenant.

## Snapshots historicos

Conservar en el evento cuando corresponda:

- Nombre/codigo de maestra presentado.
- Identificacion y origen de macho externo/material genetico.
- Dias de retiro aplicados.
- Fecha probable calculada.
- Cantidades y pesos calculados al cierre.

La FK a maestra se mantiene; el snapshot evita que una edicion administrativa cambie el
significado historico.

## Transacciones obligatorias

- Evento terminal animal + estado derivado.
- Reemplazo de veterinario tratante.
- Tratamiento + retiro.
- Confirmacion positiva + gestacion.
- Parto + cierre de gestacion + transicion del ciclo + crias.
- Baja de lactancia + muerte de crias individuales.
- Destete + estados de crias + cierre de ciclo.
- Toda anulacion con recalculo de dependencias.

Bloquear filas raiz con `pessimistic_write` en operaciones concurrentes para evitar dos
ciclos, partos, destetes o salidas simultaneas.

## Fechas

Persistir fechas productivas sin hora como PostgreSQL `date`. Usar `timestamptz` para
auditoria y hora opcional de parto. Comparaciones productivas se realizan en la zona
configurada de la granja/compania cuando exista; hasta entonces, fechas `date` no se
convierten por zona.

## Shared

`packages/shared` publica:

- Enums globales con `codigoSistema`.
- Schemas Zod de entrada y filtros.
- DTOs de respuesta.
- Codigos de error.
- Permisos.

No publicar entidades TypeORM desde shared; pertenecen a `packages/database`.

## Migraciones y seeds

1. Reutilizar `TipoAnimal.duracionGestacionDias`.
2. Maestras de animales/sanidad/reproduccion.
3. Animales y eventos de ciclo.
4. Sanidad.
5. Ciclo y servicios.
6. Gestacion.
7. Parto/crias.
8. Lactancia/destete.
9. Permisos y perfiles base.

Crear migraciones nuevas; no editar migraciones ya aplicadas. Seeds usan codigos estables y
son idempotentes.

## Consultas y reportes

- Filtrar `companiaId` y granjas permitidas en el primer nivel de cada query.
- Agregados excluyen `anuladoAt IS NOT NULL`.
- Paginar detalle antes de hidratar relaciones.
- Usar consultas SQL/QueryBuilder dedicadas para tasas; no calcular en React.
- Cohortes reproductivas parten de `CicloReproductivo.fechaPrimerServicio`.

## Orden de implementacion

```text
002 Animales
├── 004 Sanidad ──> 016 Reportes sanidad
└── 008 Servicios ─> 009 Gestacion ─> 010 Partos ─> 011 Destete
                                             └──────> 014 Reportes reproduccion
```

## Verificacion tecnica

- Unitarias de rules y schemas.
- Integracion PostgreSQL para indices parciales, locks y rollback.
- Multi-tenant por cada raiz.
- Contratos API.
- E2E de ciclo completo y anulacion inversa.
- Lint, typecheck y migraciones en base limpia.
