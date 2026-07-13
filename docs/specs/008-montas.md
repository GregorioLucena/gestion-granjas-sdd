# Spec 008: Servicios Reproductivos

## Estado

Lista para implementar MVP v2 (2026-07-13)

## Objetivo

Iniciar ciclos reproductivos de hembras y registrar uno o varios servicios de monta o
inseminacion dentro del mismo intento.

## Dependencias

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `002-gestion-animales.md`
- `docs/decisions/0010-ciclo-reproductivo.md`

## Alcance

- Crear ciclo con su primer servicio.
- Agregar servicios al ciclo `PENDIENTE_CONFIRMACION`.
- Monta natural e inseminacion.
- Macho interno o referencia externa.
- Material genetico como texto historico.
- Fecha probable de parto calculada.
- Historial y anulacion.

No incluye inventario de semen, protocolos de celo, genetica ni gestacion.

## Datos

### Ciclo reproductivo

- Hembra, granja y fecha de inicio derivada del primer servicio.
- Estado derivado.
- Fecha probable de parto calculada desde el ultimo servicio del ciclo.

### Servicio

- `cicloId`.
- Tipo con `codigoSistema`: `MONTA_NATURAL`, `INSEMINACION_ARTIFICIAL`, `OTRO`.
- Fecha.
- `machoId` interno opcional.
- `machoExternoIdentificacion` y `machoExternoOrigen` opcionales.
- `materialGeneticoIdentificacion` opcional.
- Responsable y observaciones.

`TipoAnimal.duracionGestacionDias` es opcional y positivo.

## Reglas

1. Hembra debe ser activa, sexo `HEMBRA` y finalidad con `codigoSistema = REPRODUCCION`.
2. Sexo desconocido no participa.
3. Solo existe un ciclo no terminal por hembra.
4. Si esta `PENDIENTE_CONFIRMACION`, el usuario agrega el servicio a ese ciclo; la API no
   decide por una ventana temporal implicita.
5. Si esta gestante, en lactancia o terminal, se rechaza el nuevo servicio.
6. Fecha no es futura, no precede alta de hembra ni servicio anterior del ciclo.
7. Macho interno debe ser activo, de la misma compania/tipo, sexo `MACHO` y finalidad
   `REPRODUCCION`. Puede pertenecer a otra granja accesible de la compania.
8. Monta natural exige macho interno o referencia externa.
9. Inseminacion exige material genetico o referencia de macho.
10. Referencias externas se guardan como snapshot y no crean animales.
11. Fecha probable = fecha del ultimo servicio + dias de gestacion; si no hay configuracion,
    puede informarse manualmente y debe ser posterior.
12. Servicios son inmutables y se anulan con motivo.
13. No se anula un servicio con confirmaciones o eventos posteriores vigentes. Si hay varios
    servicios sin dependencias, solo se anula el ultimo.

## Permisos

- `reproduccion.servicios.ver`
- `reproduccion.servicios.crear`
- `reproduccion.servicios.anular`

## API

| Metodo | Ruta |
|--------|------|
| `GET` | `/reproduccion/ciclos` |
| `POST` | `/reproduccion/ciclos` |
| `GET` | `/reproduccion/ciclos/:id` |
| `POST` | `/reproduccion/ciclos/:id/servicios` |
| `POST` | `/reproduccion/servicios/:id/anular` |

Crear ciclo recibe hembra y datos del primer servicio en una transaccion. Listado requiere
granja y permite hembra, tipo, estado, periodo y paginacion.

## UX

- Hub reproductivo y ficha de ciclo.
- Al seleccionar hembra con ciclo `PENDIENTE_CONFIRMACION`, ofrecer `Agregar servicio al
  ciclo`; para otros estados no terminales explicar el bloqueo.
- Campos condicionales por tipo.
- Fecha probable explicada como estimacion.
- Linea de tiempo inmutable y anulacion confirmada.

## Criterios de aceptacion

1. Crear ciclo y primer servicio atomicamente.
2. Agrupar servicios del mismo intento sin duplicar ciclo.
3. Bloquear segundo ciclo no terminal.
4. Validar hembra, macho y referencias requeridas.
5. Recalcular fecha probable con el ultimo servicio.
6. Bloquear servicio posterior a resultado definitivo.
7. Anular solo sin dependencias y en orden.
8. Respetar tenant, granjas y permisos.

## Verificacion

- Unitarias por tipo, participantes, fechas y estimacion.
- Integracion de ciclo/multiples servicios/anulacion.
- Multi-tenant y UX mobile-first.

## Preguntas abiertas

No quedan preguntas que bloqueen MVP v2.

## Decisiones

- Un intento es un ciclo con uno o varios servicios.
- Referencias externas permitidas como snapshot.
- Duracion configurada en tipo de animal.
- Eventos inmutables.
