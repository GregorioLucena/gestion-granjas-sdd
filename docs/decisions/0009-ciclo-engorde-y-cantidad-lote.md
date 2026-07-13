# ADR 0009: Ciclo de Engorde y Cantidad Actual del Lote

## Estado

Aceptada.

## Contexto

El MVP v1 necesita iniciar y cerrar engordes, registrar disminuciones del lote, controlar
pesos y calcular indicadores. Estos modulos comparten dos conceptos que no pueden quedar
definidos de forma distinta:

- La cantidad actual disponible del lote.
- El ciclo de vida del proceso de engorde y su cierre.

El lote ya conserva `cantidadInicial` y un estado operativo. Guardar tambien una cantidad
actual editable produciria diferencias entre lotes, bajas, controles y reportes. Del mismo
modo, guardar el cierre como una simple modificacion del engorde impediria anularlo y
reabrir el proceso sin perder el historial.

## Decision

### Relacion entre lote y engorde

- En el MVP v1 un lote puede tener un solo proceso de engorde valido durante su vida.
- El engorde se inicia manualmente por un usuario con permiso.
- Solo puede iniciarse para un lote con estado de registro `ACTIVO`, estado operativo
  `ACTIVO` y finalidad productiva con `codigoSistema = ENGORDE`.
- El proceso usa estados `EN_CURSO`, `CERRADO` y `ANULADO`.
- El estado operativo del lote permanece `ACTIVO` mientras el engorde esta en curso y pasa
  a `CERRADO` al registrar un cierre valido.

### Cantidad actual

La cantidad actual no se edita ni se persiste como valor independiente. Se calcula:

```text
cantidadActual = cantidadInicialEngorde - SUM(bajas no anuladas)
```

- Toda disminucion debe registrarse como baja antes del cierre.
- Una baja puede representar muerte, descarte, venta parcial u otra salida.
- La cantidad final representa los animales que completan el proceso antes de una eventual
  salida comercial y debe ser igual a la cantidad actual calculada.
- Las divisiones, fusiones y traslados entre lotes quedan fuera del MVP v1.
- Cuando esos movimientos existan, esta decision debera ampliarse para incorporarlos al
  calculo sin convertir la cantidad actual en un campo editable.

### Bajas y mortalidad

- Las bajas son eventos historicos e inmutables.
- Una baja incorrecta se anula con motivo y se registra nuevamente.
- El motivo de baja es una maestra por compania.
- Cada motivo indica mediante `cuentaComoMortalidad` si sus cantidades se incluyen en los
  indicadores de mortalidad.

### Cierre y reapertura

- El cierre es un evento separado del proceso de engorde.
- Un cierre valido conserva fecha, cantidad final, motivo, observaciones, responsable y
  auditoria.
- Al cerrar, engorde y lote cambian de estado dentro de una misma transaccion.
- Si el cierre fue incorrecto, se anula con motivo; el cierre permanece en el historial y
  engorde y lote vuelven a `EN_CURSO` y `ACTIVO`, respectivamente.
- Al anular un cierre tambien se anula, en la misma transaccion, el control de peso final
  generado por ese cierre cuando exista.
- No existe una reapertura directa sin anulacion trazable.

### Anulacion del proceso

- El proceso completo solo puede anularse si no tiene bajas, consumos ni controles
  manuales asociados. El control inicial automatico, si existe, se anula junto al proceso.
- La anulacion conserva el proceso y su auditoria; no elimina registros fisicamente.
- Un proceso anulado no cuenta como proceso valido. Si la anulacion cumplio las condiciones
  anteriores, el lote puede iniciar un nuevo proceso correcto.

### Pesos de inicio y cierre

- El peso inicial y final son opcionales.
- Cuando se informan, inicio y cierre generan automaticamente controles de peso vinculados
  al engorde con momento `INICIAL` o `FINAL`.
- La anulacion del proceso o del cierre mantiene consistencia con esos controles mediante
  anulacion transaccional.

## Invariantes

1. Un lote no tiene mas de un proceso de engorde no anulado.
2. No existen dos cierres vigentes para un engorde.
3. La cantidad actual nunca es negativa.
4. La suma de bajas vigentes nunca supera la cantidad inicial del engorde.
5. La cantidad final siempre coincide con la cantidad actual.
6. Un lote cerrado no recibe bajas, consumos ni controles nuevos.
7. Toda correccion de un evento conserva usuario, fecha y motivo.

## Consecuencias

- Se requiere una entidad o tabla `CierreEngorde` separada de `EngordeLote`.
- `BajaEngorde` y `CierreEngorde` deben conservar `companiaId` y `granjaId` para cumplir
  las reglas de tenant y facilitar consultas seguras.
- El modelo inicial existente debera ajustarse mediante una nueva migracion; no se modifica
  la migracion ya aplicada.
- Los reportes pueden reconstruir cantidades y estados desde eventos validos.
- La futura incorporacion de movimientos, divisiones o fusiones requerira extender la
  formula de cantidad actual.

## Alternativas descartadas

### Cantidad actual editable

Descartada porque permite diferencias entre el lote y sus eventos.

### Sobrescribir los datos del cierre al reabrir

Descartada porque elimina trazabilidad del cierre incorrecto.

### Permitir varios engordes secuenciales por lote

Descartada en MVP v1 para mantener un ciclo productivo simple y reportes no ambiguos.

## Referencias

- `docs/specs/003-gestion-lotes.md`
- `docs/specs/012-engorde-lotes.md`
- `docs/specs/013-controles-peso.md`
- `docs/specs/017-reportes-engorde.md`
- `docs/decisions/0004-estado-registro-vs-estado-operativo.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`
