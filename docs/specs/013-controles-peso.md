# Spec 013: Controles de Peso

## Estado

Borrador inicial

## Objetivo

Permitir registrar y consultar controles de peso de animales individuales y lotes, incluyendo peso individual, peso promedio, muestras representativas, metodo de pesaje y relacion con procesos de engorde.

Esta especificacion complementa `012-engorde-lotes.md` y alimenta futuros reportes de productividad.

## Dependencias

Esta especificacion depende de:

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `002-gestion-animales.md`
- `003-gestion-lotes.md`
- `012-engorde-lotes.md`
- `docs/03-catalogo-maestras.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

## Alcance

Incluye:

- Registro de peso de animal individual.
- Registro de peso promedio de lote.
- Registro de peso por muestra de lote.
- Registro de cantidad de animales pesados en una muestra.
- Registro de metodo de pesaje.
- Asociacion opcional a proceso de engorde.
- Consulta de historial de peso por animal.
- Consulta de historial de peso por lote.
- Calculo basico de ganancia entre controles.
- Anulacion de controles registrados por error.

No incluye en esta version:

- Integracion con basculas digitales.
- Predicciones de peso.
- Alertas automaticas por bajo rendimiento.
- Calculo avanzado de conversion alimenticia.
- Analisis estadistico avanzado de muestras.

## Conceptos principales

### Control de peso

Evento fechado donde se registra el peso de un animal o lote.

### Peso individual

Peso registrado para un animal individual.

### Peso promedio de lote

Peso promedio registrado o calculado para un lote.

### Muestra de lote

Subconjunto de animales pesados para estimar el peso promedio del lote.

### Metodo de pesaje

Forma en que se obtuvo el peso.

Ejemplos:

- Bascula individual.
- Bascula de corral.
- Estimado visual.
- Muestra representativa.

## Datos requeridos

### Control de peso

- Compania.
- Granja.
- Animal o lote.
- Fecha del control.
- Tipo de control de peso.
- Metodo de pesaje opcional.
- Peso.
- Unidad de medida.
- Cantidad de animales pesados opcional.
- Proceso de engorde opcional.
- Responsable.
- Observaciones opcionales.
- Estado del control.
- Datos de auditoria.

## Reglas de negocio

- Todo control de peso debe pertenecer a una compania y granja.
- Todo control de peso debe aplicar a un animal individual o a un lote, pero no a ambos al mismo tiempo.
- El animal o lote debe pertenecer a la misma granja del control.
- El usuario debe tener permiso para registrar o consultar controles de peso.
- El usuario solo puede operar controles de peso de granjas a las que tiene acceso.
- El peso debe ser mayor que cero.
- La unidad de medida debe estar activa.
- El tipo de control de peso debe venir de maestra activa.
- El metodo de pesaje debe venir de maestra activa cuando se informe.
- Si el control es de animal individual, debe informarse animal y no lote.
- Si el control es de lote, debe informarse lote y no animal.
- Si el control es muestra de lote, la cantidad de animales pesados debe ser mayor que cero.
- La cantidad de animales pesados no debe superar la cantidad actual del lote.
- Si se asocia a engorde, el lote del control debe coincidir con el lote del proceso de engorde.
- No debe permitirse registrar controles para animales vendidos, muertos o descartados.
- No debe permitirse registrar controles para lotes cerrados, salvo que el control corresponda al cierre permitido.
- Un control de peso no debe eliminarse fisicamente; si fue registrado por error, debe anularse segun `0005-auditoria-y-trazabilidad.md`.

## Permisos requeridos

- `pesos.ver`: consultar controles de peso.
- `pesos.crear`: registrar controles de peso.
- `pesos.editar`: modificar datos permitidos.
- `pesos.anular`: anular controles registrados por error.

## Criterios de aceptacion

### CA-001: Registrar peso individual

Dado un animal activo, cuando un usuario con permisos registra un control de peso individual con datos validos, entonces el control queda en el historial del animal.

### CA-002: Registrar peso promedio de lote

Dado un lote activo, cuando un usuario con permisos registra un peso promedio con datos validos, entonces el control queda en el historial del lote.

### CA-003: Registrar muestra de lote

Dado un lote activo, cuando un usuario registra un control por muestra con cantidad de animales pesados y peso validos, entonces el control queda registrado como muestra del lote.

### CA-004: Validar cantidad de muestra

Dado un lote con cantidad actual conocida, cuando el usuario registra una muestra mayor a la cantidad actual del lote, entonces el sistema debe rechazar el control.

### CA-005: Asociar control a engorde

Dado un proceso de engorde activo, cuando el usuario registra un control de peso del mismo lote, entonces el control puede asociarse al proceso de engorde.

### CA-006: Consultar historial de peso por animal

Dado un animal con controles de peso registrados, cuando el usuario consulta su historial, entonces el sistema muestra fecha, peso, unidad, metodo, responsable y observaciones.

### CA-007: Consultar historial de peso por lote

Dado un lote con controles de peso registrados, cuando el usuario consulta su historial, entonces el sistema muestra fecha, tipo de control, peso, unidad, cantidad de muestra, metodo y responsable.

### CA-008: Calcular ganancia entre controles

Dado dos controles de peso comparables, cuando se consulta la evolucion, entonces el sistema muestra la diferencia de peso entre ambos controles.

### CA-009: Validar acceso por granja

Dado un usuario sin acceso a la granja del animal o lote, cuando intenta registrar o consultar controles de peso, entonces el sistema debe impedir la accion.

### CA-010: Anular control de peso

Dado un control de peso registrado por error, cuando un usuario con permiso lo anula indicando motivo, entonces el control queda marcado como anulado y se conserva en el historial.

## Preguntas abiertas

- El peso de lote representara peso promedio por animal o peso total del lote?
- Se permitira registrar peso estimado visual en el MVP?
- Los controles de peso de cierre de engorde se registraran aqui o solo en `012-engorde-lotes.md`?
- Se calculara ganancia diaria promedio desde esta spec o solo en reportes?
- Se requerira registrar condicion corporal en una fase futura?

## Decisiones tomadas

- Los controles de peso son eventos historicos.
- El control puede aplicar a animal individual o lote.
- Los controles de peso de lote pueden ser promedio o muestra.
- Los controles pueden asociarse a procesos de engorde.
- Los reportes de productividad usaran esta informacion para calcular evolucion y ganancia.
