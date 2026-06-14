# Spec 012: Engorde de Lotes

## Estado

Borrador inicial

## Objetivo

Permitir iniciar, controlar y cerrar procesos de engorde de lotes, registrando fechas, cantidades, pesos iniciales y finales, bajas, resultado productivo y datos base para reportes de productividad.

Esta especificacion se apoya en `003-gestion-lotes.md`, `007-consumo-alimento.md` y se complementa con `013-controles-peso.md`.

## Dependencias

Esta especificacion depende de:

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `003-gestion-lotes.md`
- `007-consumo-alimento.md`
- `docs/03-catalogo-maestras.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

## Alcance

Incluye:

- Inicio de proceso de engorde para un lote.
- Registro de fecha de inicio de engorde.
- Registro de cantidad inicial para engorde.
- Registro de peso inicial promedio opcional.
- Registro de objetivo de engorde opcional.
- Registro de bajas acumuladas del lote durante engorde.
- Registro de fecha de cierre de engorde.
- Registro de cantidad final.
- Registro de peso final promedio opcional.
- Registro de motivo de cierre.
- Calculo basico de resultado productivo.
- Consulta de resumen de engorde por lote.
- Anulacion de cierres o eventos registrados por error.

No incluye en esta version:

- Controles periodicos de peso.
- Calculo avanzado de conversion alimenticia.
- Venta, facturacion o sacrificio.
- Division o fusion de lotes.
- Traslados entre lotes.
- Costeo financiero completo.

## Conceptos principales

### Engorde

Proceso productivo en el que un lote aumenta peso hasta alcanzar una condicion o fecha objetivo.

### Inicio de engorde

Registro que marca el comienzo productivo del engorde para un lote.

### Cierre de engorde

Registro que marca el final productivo del engorde y resume cantidades, pesos y resultado.

### Cantidad final

Numero de animales presentes al cierre del engorde.

### Ganancia de peso

Diferencia entre peso final y peso inicial. Puede calcularse como promedio por animal o como estimado total del lote.

### Bajas de engorde

Reducciones de animales durante el proceso por muerte, venta, traslado, descarte u otra causa.

## Datos requeridos

### Inicio de engorde

- Compania.
- Granja.
- Lote.
- Fecha de inicio.
- Cantidad inicial.
- Peso inicial promedio opcional.
- Objetivo de peso opcional.
- Responsable.
- Observaciones opcionales.
- Datos de auditoria.

### Cierre de engorde

- Lote.
- Fecha de cierre.
- Cantidad final.
- Peso final promedio opcional.
- Motivo de cierre.
- Responsable.
- Observaciones opcionales.
- Estado del cierre.
- Datos de auditoria.

### Baja de engorde

- Lote.
- Fecha de baja.
- Cantidad.
- Causa de baja.
- Responsable.
- Observaciones opcionales.
- Datos de auditoria.

## Reglas de negocio

- Todo proceso de engorde debe pertenecer a una compania y granja.
- Todo proceso de engorde debe estar asociado a un lote activo.
- El lote debe pertenecer a la misma compania y granja del proceso.
- El usuario debe tener permiso para registrar o consultar engorde.
- El usuario solo puede operar engordes de granjas a las que tiene acceso.
- No debe permitirse iniciar mas de un engorde activo para el mismo lote.
- La cantidad inicial debe ser mayor que cero.
- La cantidad inicial de engorde no debe superar la cantidad actual del lote.
- La cantidad final debe ser mayor o igual a cero.
- La cantidad final no debe superar la cantidad inicial ajustada por bajas y movimientos definidos.
- Las bajas deben tener cantidad mayor que cero.
- Las bajas acumuladas no deben superar la cantidad disponible del lote.
- La fecha de cierre no debe ser anterior a la fecha de inicio.
- Al cerrar un engorde, el lote debe quedar cerrado o con estado productivo equivalente.
- El motivo de cierre debe venir de maestra activa.
- Los consumos de alimento del lote deben poder consultarse como parte del resumen, pero se registran en `007-consumo-alimento.md`.
- Los controles de peso periodicos se registran en `013-controles-peso.md`.
- Un cierre de engorde no debe eliminarse fisicamente; si fue registrado por error, debe anularse segun `0005-auditoria-y-trazabilidad.md`.

## Permisos requeridos

- `engorde.ver`: consultar procesos de engorde.
- `engorde.iniciar`: iniciar engorde de lote.
- `engorde.bajas.crear`: registrar bajas durante engorde.
- `engorde.cerrar`: cerrar engorde de lote.
- `engorde.anular`: anular registros de engorde.

## Criterios de aceptacion

### CA-001: Iniciar engorde

Dado un lote activo con finalidad compatible con engorde, cuando un usuario con permisos registra el inicio de engorde con datos validos, entonces el lote queda asociado a un proceso de engorde activo.

### CA-002: Impedir doble engorde activo

Dado un lote con engorde activo, cuando el usuario intenta iniciar otro engorde para el mismo lote, entonces el sistema debe rechazar la accion.

### CA-003: Registrar baja de engorde

Dado un engorde activo, cuando un usuario con permisos registra una baja con cantidad y causa validas, entonces la baja queda en el historial del engorde.

### CA-004: Impedir bajas mayores a cantidad disponible

Dado un engorde activo, cuando el usuario registra bajas acumuladas mayores a la cantidad disponible del lote, entonces el sistema debe rechazar la accion.

### CA-005: Cerrar engorde

Dado un engorde activo, cuando un usuario con permisos registra cierre con cantidad final y fecha validas, entonces el engorde queda cerrado y el lote queda cerrado o con estado productivo equivalente.

### CA-006: Calcular ganancia de peso promedio

Dado un engorde con peso inicial promedio y peso final promedio, cuando se consulta el resumen, entonces el sistema muestra la ganancia de peso promedio.

### CA-007: Consultar resumen de engorde

Dado un lote con engorde registrado, cuando el usuario consulta el resumen, entonces el sistema muestra fechas, cantidades, bajas, pesos, consumo registrado y motivo de cierre.

### CA-008: Validar acceso por granja

Dado un usuario sin acceso a la granja del lote, cuando intenta registrar o consultar engorde, entonces el sistema debe impedir la accion.

### CA-009: Anular cierre de engorde

Dado un cierre registrado por error, cuando un usuario con permiso lo anula indicando motivo, entonces el cierre queda marcado como anulado y se conserva en el historial.

## Preguntas abiertas

- El proceso de engorde se inicia automaticamente al crear un lote con finalidad engorde?
- La cantidad actual del lote se calculara solo desde bajas o tambien desde traslados/divisiones futuras?
- Se requiere registrar venta o sacrificio como motivo de cierre dentro de esta spec o en modulo comercial futuro?
- La conversion alimenticia basica se calculara aqui o solo en reportes?
- Se permitira reabrir un engorde cerrado por correccion?

## Decisiones tomadas

- El engorde se gestiona como proceso productivo asociado a un lote.
- El consumo de alimento se registra en `007-consumo-alimento.md`.
- Los controles de peso se registran en `013-controles-peso.md`.
- El cierre de engorde resume cantidades, pesos y motivo de cierre.
- Los registros de engorde siguen auditoria y no borrado fisico.
