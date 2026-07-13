# Spec 009: Confirmacion y Gestacion

## Estado

Lista para implementar MVP v2 (2026-07-13)

## Objetivo

Registrar confirmaciones, crear gestacion solo ante resultado positivo, controlar su
evolucion y cerrar fallos reproductivos de forma trazable.

## Dependencias

- `002-gestion-animales.md`
- `008-montas.md`
- `docs/decisions/0010-ciclo-reproductivo.md`

## Alcance

- Confirmaciones positivas, negativas y dudosas.
- Metodo de confirmacion.
- Gestacion activa a partir de positivo.
- Controles de gestacion.
- Aborto, reabsorcion y otros fallos.
- Historial y anulacion.

No incluye adjuntos, alertas, alimentacion especifica ni parto.

## Datos

### Confirmacion

- Ciclo.
- Fecha.
- Resultado global: `POSITIVA`, `NEGATIVA`, `DUDOSA`.
- Metodo de confirmacion por compania.
- Responsable y observaciones.

### Gestacion

- Ciclo y hembra.
- Origen `CONFIRMADA` o `NO_CONFIRMADA`.
- Fecha de inicio: primer servicio del ciclo.
- Fecha probable heredada del ciclo al confirmar.
- Estado derivado: `ACTIVA`, `FINALIZADA_PARTO`, `FALLIDA`.

### Control

- Gestacion, fecha, metodo, resultado, responsable, observaciones y recomendaciones.

### Fallo

- Gestacion.
- Fecha.
- Causa por compania con `codigoSistema`: `ABORTO`, `REABSORCION`, `OTRO`.
- Responsable y observaciones.

## Reglas

1. Ciclo, hembra y eventos pertenecen al mismo tenant/granja.
2. Solo ciclos `PENDIENTE_CONFIRMACION` y no anulados reciben confirmaciones.
3. Fechas respetan el orden del ADR 0010 y no son futuras.
4. Resultado dudoso conserva ciclo pendiente y exige nuevo control; no crea gestacion.
5. Resultado positivo crea una sola gestacion activa en transaccion.
   La gestacion copia la fecha probable canonica del ciclo como snapshot; despues de la
   confirmacion no se agregan servicios ni se recalcula.
6. Resultado negativo cierra el ciclo como fallo `NO_GESTANTE`, sin crear gestacion.
7. Solo existe una gestacion activa por hembra.
8. Metodo debe estar activo al registrar.
9. Controles solo se agregan a gestacion activa.
10. Un fallo cierra gestacion y ciclo.
11. Eventos son inmutables.
12. Se anulan en orden inverso: controles/fallo, gestacion/confirmacion.
13. Gestacion con parto vigente no puede anularse.
14. Anular resultado definitivo recalcula ciclo; una gestacion creada por esa confirmacion se
    anula en la misma transaccion solo si no tiene dependencias.

## Permisos

- `reproduccion.gestacion.ver`
- `reproduccion.gestacion.confirmar`
- `reproduccion.gestacion.controlar`
- `reproduccion.gestacion.finalizar`
- `reproduccion.gestacion.anular`

## API

| Metodo | Ruta |
|--------|------|
| `POST` | `/reproduccion/ciclos/:id/confirmaciones` |
| `GET` | `/reproduccion/gestaciones` |
| `GET` | `/reproduccion/gestaciones/:id` |
| `POST` | `/reproduccion/gestaciones/:id/controles` |
| `POST` | `/reproduccion/gestaciones/:id/fallos` |
| `POST` | `/reproduccion/confirmaciones/:id/anular` |
| `POST` | `/reproduccion/controles/:id/anular` |
| `POST` | `/reproduccion/fallos/:id/anular` |

Listados requieren granja; aceptan hembra, estado, resultado, periodo y paginacion.
Confirmaciones usan `reproduccion.gestacion.confirmar`, controles usan `.controlar`, fallos
usan `.finalizar` y anulaciones usan `.anular`.

## UX

- Ciclos pendientes, dudosos, gestantes y proximos a fecha probable.
- Confirmacion como accion contextual del ciclo.
- Dudoso muestra `Requiere nuevo control`.
- Gestacion usa linea de tiempo.
- Sin notificaciones automaticas.

## Criterios de aceptacion

1. Positivo crea gestacion activa atomicamente.
2. Negativo cierra ciclo sin gestacion.
3. Dudoso deja pendiente.
4. Se impide doble gestacion activa.
5. Controles y fallos respetan estado y fechas.
6. Fallo cierra gestacion/ciclo.
7. Anulacion bloquea dependencias y recalcula estados.
8. Se respeta tenant y permisos.

## Verificacion

- Matriz positiva/negativa/dudosa.
- Orden de fechas y doble gestacion.
- Fallos, anulaciones y rollback.
- Multi-tenant y UX mobile-first.

## Preguntas abiertas

No quedan preguntas que bloqueen MVP v2.

## Decisiones

- Gestacion solo tras positivo.
- Dudoso mantiene ciclo pendiente.
- Parto no confirmado es excepcion de spec 010.
- Eventos inmutables.
