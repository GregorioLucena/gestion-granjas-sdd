# ADR 0010: Ciclo reproductivo y trazabilidad de crias

## Estado

Aceptada - 2026-07-13

## Contexto

Una hembra puede recibir varios servicios durante el mismo celo. Contar cada servicio como
una gestacion potencial distorsiona tasas y hace ambiguo el vinculo con confirmacion, parto
y destete. Tambien se necesita soportar especies manejadas por conteo y otras con crias
individuales.

## Decision

### Ciclo reproductivo

El intento estadistico es `CicloReproductivo`, no cada servicio.

- Pertenece a una hembra y granja.
- Inicia con el primer servicio.
- Puede contener varios servicios ordenados antes del resultado definitivo.
- Solo existe un ciclo no terminal por hembra.
- Servicios y demas eventos son inmutables.

### Confirmacion y gestacion

- `DUDOSA`: mantiene el ciclo pendiente; no crea gestacion.
- `POSITIVA`: crea una gestacion activa.
- `NEGATIVA`: cierra el ciclo como fallo sin gestacion.
- Excepcionalmente, un parto puede registrarse desde un ciclo `PENDIENTE_CONFIRMACION`. La API
  crea una gestacion historica `NO_CONFIRMADA` y la cierra por parto en la misma transaccion.

### Fin de gestacion

Una gestacion termina por:

- Parto.
- Aborto.
- Reabsorcion.
- Otro fallo configurado.

### Parto y crias

- Conteos de vivos y muertos son obligatorios.
- Crias debiles son subconjunto de vivos.
- Crear animales individuales es opcional y nunca puede superar vivos.
- Cada cria individual exige identificacion manual unica.
- Madre se asigna siempre; padre solo cuando todos los servicios del ciclo tienen un mismo
  padre identificable. En otro caso queda desconocido.
- Pesos se registran como promedio o para todas las crias individualizadas; si existen pesos
  individuales completos, el promedio se deriva.
- El parto cierra la gestacion. Si hay nacidos vivos, el ciclo pasa a `EN_LACTANCIA` y no
  admite nuevos servicios. Si no hay nacidos vivos, pasa a `CERRADO_SIN_CRIAS` y no requiere
  destete.

### Lactancia y destete

- Mortalidad se registra mediante `BajaLactancia` fechada, con cantidad y causa.
- Para crias individualizadas muertas, la baja y el evento de muerte animal se crean en una
  transaccion.
- En esta version no hay adopciones, transferencias ni destetes parciales.
- Cuando hay nacidos vivos, un unico destete cierra el ciclo y debe cumplir:

```text
cantidadDestetada + SUM(bajasLactanciaVigentes) = nacidosVivos
```

### Fechas

```text
inicioCiclo <= servicios <= confirmaciones/controles
             <= finGestacion/parto <= bajasLactancia <= destete
```

No se permiten fechas futuras. Eventos en la misma fecha se ordenan por `createdAt`.

### Anulacion

Se anula en orden inverso de dependencias:

1. Destete.
2. Bajas de lactancia.
3. Parto y crias generadas sin actividad posterior.
4. Controles/fallos de gestacion.
5. Confirmacion/gestacion.
6. Servicios.
7. Ciclo sin eventos vigentes.

Una entidad con dependencias vigentes no puede anularse. Toda anulacion exige motivo,
recalcula estados derivados en transaccion y conserva auditoria.

### Estados del ciclo

```text
PENDIENTE_CONFIRMACION
  -> GESTANTE
  -> EN_LACTANCIA
  -> CERRADO_DESTETE

PENDIENTE_CONFIRMACION/GESTANTE -> FALLIDO
GESTANTE -> CERRADO_SIN_CRIAS
```

`EN_LACTANCIA` no es un ciclo abierto para nuevos servicios; solo habilita bajas y destete.

Para admitir servicios, solo `PENDIENTE_CONFIRMACION` es abierto. Confirmacion positiva o
negativa, fallo de gestacion y parto son resultados definitivos para bloquear nuevos
servicios; una confirmacion dudosa no lo es.

Estado operativo y resultado de reporte son dimensiones distintas:

| Estado del ciclo | Resultado de cohorte |
|------------------|-----------------------|
| `EN_LACTANCIA` o `CERRADO_DESTETE` con vivos | `PARTO` |
| `CERRADO_SIN_CRIAS` | `PARTO_SIN_VIVOS` |
| `FALLIDO` | Causa terminal correspondiente |

### Tasas

Las tasas se calculan por cohorte de ciclos cuyo primer servicio cae en el periodo. Ciclos
pendientes se informan separados y no ingresan al denominador de resultados definitivos.
Sin denominador, el indicador es `null`/`No disponible`, no cero.

## Consecuencias

- Se agrega `CicloReproductivo` como raiz del agregado.
- Los estados se derivan de eventos vigentes.
- Se evita duplicar intentos por multiples servicios.
- El flujo soporta conteos e individuos sin obligar a identificar toda camada.
- Anulaciones requieren validacion de dependencias y transacciones.

## Alternativas descartadas

- Usar cada servicio como intento independiente.
- Crear gestacion al registrar una monta.
- Guardar mortalidad solo como total editable en destete.
- Crear automaticamente todos los animales nacidos.
- Permitir editar eventos historicos.
