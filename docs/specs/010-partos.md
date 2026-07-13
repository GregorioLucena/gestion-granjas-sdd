# Spec 010: Partos

## Estado

Lista para implementar MVP v2 (2026-07-13)

## Objetivo

Registrar el resultado del nacimiento, cerrar la gestacion y crear opcionalmente animales
individuales sin perder los conteos de camada.

## Dependencias

- `002-gestion-animales.md`
- `009-gestacion.md`
- `docs/decisions/0010-ciclo-reproductivo.md`

## Alcance

- Parto desde gestacion activa.
- Parto no confirmado desde ciclo `PENDIENTE_CONFIRMACION`.
- Vivos, muertos y debiles.
- Peso promedio o pesos individuales completos.
- Crias individuales opcionales.
- Cierre de gestacion.
- Anulacion con dependencias.

No incluye lactancia, adopciones, transferencias, sanidad automatica o genetica avanzada.

## Datos

### Parto

- Ciclo, gestacion y hembra derivados.
- Fecha y hora opcional.
- Tipo de parto por compania.
- `nacidosVivos`, `nacidosMuertos`, `criasDebiles`.
- `totalNacidos` derivado.
- `pesoPromedioNacimientoKg` opcional/derivado.
- Responsable y observaciones.

### Cria individual

Se crea como `Animal`:

- Identificacion manual obligatoria.
- Sexo conocido o desconocido.
- Peso al nacer opcional.
- Madre derivada.
- Padre derivado solo si es inequivoco.
- Tipo, compania, granja, nacimiento y `partoId` derivados.
- Finalidad derivada de `codigoSistema = CRIA`; raza segun reglas de animales.

## Reglas

1. Parto pertenece a un ciclo con gestacion activa o ciclo `PENDIENTE_CONFIRMACION`.
2. En el segundo caso, API crea gestacion `NO_CONFIRMADA` y la cierra por parto en la misma
   transaccion.
3. Solo existe un parto vigente por ciclo/gestacion.
4. Fecha respeta ADR 0010 y no es futura.
5. Cantidades son enteros no negativos.
6. `totalNacidos = vivos + muertos`.
7. Debiles no supera vivos.
8. Cantidad de animales creados no supera vivos.
9. Cada cria individual cumple identificacion unica y demas reglas de spec 002.
10. Si se informan pesos individuales, deben existir para todas las crias creadas y el
    promedio se calcula; no se acepta promedio manual contradictorio.
11. Sin pesos individuales completos puede informarse solo promedio positivo.
12. Padre se asigna solo si todos los servicios tienen la misma referencia interna; macho
    externo queda como referencia del ciclo, no como `padreId`.
13. Crear parto, cerrar gestacion y crear crias es transaccional. Con vivos, el ciclo pasa a
    `EN_LACTANCIA`; sin vivos, pasa a `CERRADO_SIN_CRIAS`.
14. Parto es inmutable.
15. Para anularlo deben anularse antes destete y bajas de lactancia.
16. Crias generadas impiden anulacion si tienen eventos posteriores; si no, se inactivan por
    anulacion de origen dentro de la transaccion, sin borrado fisico.

## Permisos

- `reproduccion.partos.ver`
- `reproduccion.partos.crear`
- `reproduccion.partos.anular`

## API

| Metodo | Ruta |
|--------|------|
| `GET` | `/reproduccion/partos` |
| `POST` | `/reproduccion/gestaciones/:id/partos` |
| `POST` | `/reproduccion/ciclos/:id/parto-no-confirmado` |
| `GET` | `/reproduccion/partos/:id` |
| `POST` | `/reproduccion/partos/:id/anular` |

El cuerpo incluye conteos, fecha, tipo, pesos y lista opcional de crias. Campos derivados y
auditoria son de servidor.

## UX

- Accion `Registrar parto` desde gestacion.
- Accion excepcional `Registrar parto no confirmado` con advertencia.
- Conteos recalculan total en pantalla y servidor.
- Seccion opcional `Identificar crias`.
- Errores por fila en identificaciones/pesos.
- Resumen antes de confirmar.

## Criterios de aceptacion

1. Parto valido cierra gestacion y mueve el ciclo a lactancia o cierre sin crias
   atomicamente.
2. Parto no confirmado crea/cierra gestacion historica.
3. Total y debiles se validan.
4. Crias opcionales no superan vivos y cumplen spec 002.
5. Pesos individuales completos derivan promedio.
6. Padre solo se asigna si es inequivoco.
7. Doble parto se rechaza.
8. Anulacion respeta dependencias y conserva trazabilidad.
9. Tenant y permisos se validan.

## Verificacion

- Conteos y pesos.
- Parto confirmado/no confirmado.
- Creacion transaccional de crias y rollback.
- Anulacion con/sin dependencias.
- Multi-tenant y mobile-first.

## Preguntas abiertas

No quedan preguntas que bloqueen MVP v2.

## Decisiones

- Conteos obligatorios, individuos opcionales.
- Identificacion individual manual.
- Parto no confirmado permitido desde ciclo.
- Eventos inmutables.
