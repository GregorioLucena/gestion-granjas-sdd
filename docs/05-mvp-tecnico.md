# MVP Tecnico

Este documento define la primera version construible del sistema. Su objetivo es reducir el alcance inicial sin perder la arquitectura necesaria para crecer hacia reproduccion, sanidad avanzada y reportes completos.

## Objetivo del MVP v1

Construir una primera version funcional para administrar companias, granjas, maestras, usuarios, lotes de engorde, inventario de alimentos, consumo, controles de peso y reportes basicos.

El MVP v1 debe validar:

- Modelo multi-compania.
- Acceso por usuario, perfil y granja.
- Manejo por lotes.
- Inventario de alimentos.
- Consumo de alimento por lote.
- Control de peso por lote.
- Cierre basico de engorde.
- Reportes basicos de alimentacion y engorde.

## Enfoque recomendado

Aunque el sistema completo soportara reproduccion, sanidad, animales individuales y multiples especies, la primera version tecnica debe enfocarse en un flujo productivo simple y valioso:

```text
Compania -> Granja -> Lote de engorde -> Inventario de alimento -> Consumo -> Pesos -> Cierre -> Reporte
```

Este flujo permite probar la base del negocio sin implementar de inmediato toda la complejidad reproductiva.

## Modulos incluidos en MVP v1

### 1. Configuracion base

Specs relacionadas:

- `000-configuracion-base.md`
- `03-catalogo-maestras.md`

Incluye:

- Companias.
- Granjas.
- Tipos de animal.
- Razas cuando aplique.
- Finalidades productivas.
- Tipos de ubicacion.
- Ubicaciones.
- Almacenes.
- Estado de registro.

### 2. Seguridad

Specs relacionadas:

- `001-usuarios-perfiles.md`
- `decisions/0001-modelo-seguridad-multicompania.md`

Incluye:

- Usuarios.
- Perfiles globales.
- Permisos.
- Usuario pertenece a una compania.
- Usuario puede acceder a una o varias granjas.
- Validacion de permisos por modulo.

### 3. Lotes

Specs relacionadas:

- `003-gestion-lotes.md`

Incluye:

- Registro de lotes.
- Tipo de animal.
- Finalidad productiva.
- Cantidad inicial.
- Fecha de inicio.
- Ubicacion actual.
- Estado del lote.

No incluye en MVP v1:

- Division de lotes.
- Fusion de lotes.
- Traslados entre granjas.

### 4. Movimientos de ubicacion

Specs relacionadas:

- `006-movimientos-ubicacion.md`

Incluye:

- Movimiento de lote entre ubicaciones internas.
- Historial de ubicaciones.
- Responsable y motivo.

En MVP v1 se limita a lotes; animales individuales quedan para una extension posterior.

### 5. Inventario de alimentos

Specs relacionadas:

- `005-inventario-alimentos.md`

Incluye:

- Alimentos.
- Presentaciones.
- Unidades de medida.
- Proveedores.
- Almacenes.
- Entradas.
- Salidas.
- Ajustes.
- Existencias.
- Costo unitario y costo total cuando aplique.

Decisiones para MVP v1:

- No permitir inventario negativo.
- Permitir costo manual por movimiento.
- No implementar vencimientos avanzados.
- No implementar mezclas de alimentos.

### 6. Consumo de alimento

Specs relacionadas:

- `007-consumo-alimento.md`

Incluye:

- Consumo por lote.
- Fecha.
- Alimento.
- Cantidad.
- Unidad.
- Almacen origen.
- Descuento de inventario.
- Responsable.
- Historial de consumo.

No incluye en MVP v1:

- Consumo por animal individual, salvo que se implemente como extension simple.
- Consumo masivo para multiples lotes.
- Planificacion automatica de alimentacion.

### 7. Engorde de lotes

Specs relacionadas:

- `012-engorde-lotes.md`

Incluye:

- Inicio manual de engorde para lotes con finalidad Engorde.
- Cantidad inicial.
- Peso inicial promedio.
- Bajas por toda disminucion, con motivo y clasificacion de mortalidad.
- Cantidad actual calculada desde bajas no anuladas.
- Cierre de engorde.
- Cantidad final.
- Peso final promedio.
- Motivo de cierre.
- Anulacion trazable del cierre con reapertura.

### 8. Controles de peso

Specs relacionadas:

- `013-controles-peso.md`

Incluye:

- Peso promedio de lote.
- Muestra de lote.
- Metodo de pesaje obligatorio, incluyendo estimacion visual identificada.
- Historial de peso.
- Asociacion obligatoria con engorde en MVP v1.
- Controles inicial/final generados desde engorde y controles intermedios manuales.
- Diferencia simple contra el control anterior.

No incluye en MVP v1:

- Pesaje individual avanzado.
- Integracion con basculas.
- Unidades distintas de kg.
- Analisis estadistico avanzado.

### 9. Reportes basicos

Specs relacionadas:

- `015-reportes-alimentacion.md`
- `017-reportes-engorde.md`

Incluye:

- Existencias de alimentos.
- Movimientos de inventario.
- Consumo por lote.
- Costo de consumo cuando exista.
- Lotes en engorde.
- Lotes cerrados.
- Ganancia de peso.
- Bajas.
- Conversion alimenticia basica cuando existan datos suficientes.

No incluye en MVP v1:

- Exportacion avanzada.
- Graficos avanzados.
- Reportes personalizados.

## Estado de implementacion MVP v1

Actualizado tras la refinacion SDD de `012-engorde-lotes.md` y
`013-controles-peso.md` (2026-07-13).

| Modulo | Spec | Estado |
|--------|------|--------|
| Configuracion base | `000` | Implementado |
| Seguridad | `001` | Implementado |
| Lotes | `003` | Implementado |
| Inventario de alimentos | `005` | Implementado |
| Consumo por lote | `007` | Implementado |
| Movimientos de ubicacion | `006` | Spec lista; implementacion opcional pendiente |
| Engorde de lotes | `012` | Spec lista; implementacion pendiente |
| Controles de peso | `013` | Spec lista; implementacion pendiente |
| Reportes alimentacion | `015` | Spec lista; implementacion pendiente |
| Reportes engorde | `017` | Spec lista; implementacion pendiente |

**Siguiente paso recomendado:** implementar `012-engorde-lotes.md`, luego
`013-controles-peso.md`, `015-reportes-alimentacion.md` y `017-reportes-engorde.md`. El
modulo `006` es opcional y no bloquea esa secuencia.

## Modulos fuera de MVP v1

Quedan para fases posteriores:

- `002-gestion-animales.md`.
- `004-sanidad-animal.md`.
- `008-montas.md` a `011-destete.md`.
- `014-reportes-reproduccion.md`.
- `016-reportes-sanidad.md`.
- Inventario de medicamentos.
- Alertas.
- Facturacion.
- Contabilidad.
- Aplicacion movil offline.

Las specs listadas estan listas para implementar como MVP v2; su diseno tecnico se resume
en `15-diseno-tecnico-mvp-v2.md`.

## MVP v2 recomendado

Despues de validar MVP v1, la siguiente version deberia enfocarse en produccion porcina reproductiva:

- Animales individuales.
- Montas e inseminaciones.
- Gestacion.
- Partos.
- Destete.
- Reportes reproductivos.
- Sanidad basica.

## Pantallas minimas MVP v1

### Seguridad y configuracion

- Login.
- Selector de compania/granja si aplica.
- Gestion de companias.
- Gestion de granjas.
- Gestion de usuarios.
- Gestion de perfiles y permisos.
- Gestion de maestras.

### Produccion

- Gestion de lotes.
- Movimientos de ubicacion de lotes.
- Inicio/cierre de engorde.
- Registro de bajas.
- Controles de peso.

### Inventario y alimentacion

- Gestion de alimentos.
- Gestion de proveedores.
- Gestion de almacenes.
- Movimientos de inventario.
- Existencias.
- Consumo de alimento por lote.

### Reportes

- Reporte de existencias.
- Reporte de consumo por lote.
- Reporte de costos de alimentacion.
- Reporte de engorde por lote.

## Entidades principales MVP v1

- Compania.
- Granja.
- Usuario.
- Perfil.
- Permiso.
- UsuarioGranja.
- Maestra.
- TipoAnimal.
- Raza.
- FinalidadProductiva.
- TipoUbicacion.
- Ubicacion.
- Almacen.
- Lote.
- MovimientoUbicacion.
- Alimento.
- Proveedor.
- MovimientoInventario.
- ConsumoAlimento.
- EngordeLote.
- BajaEngorde.
- CierreEngorde.
- ControlPeso.

## Reglas tecnicas transversales

- Toda entidad productiva debe tener `compania_id`.
- Todo dato operativo de granja debe tener `granja_id`.
- Toda consulta debe filtrar por compania y granjas permitidas.
- Toda entidad ABM debe tener estado de registro.
- Todo evento historico debe tener auditoria.
- Los eventos y movimientos no se eliminan fisicamente.
- Las anulaciones deben registrar usuario, fecha y motivo.

## Criterios para comenzar a programar

Antes de iniciar codigo se debe tener:

- Stack tecnico definido.
- Base de datos elegida.
- Estrategia de autenticacion definida.
- Modelo inicial de datos definido.
- Convencion de permisos definida.
- Primer backlog tecnico ordenado.
- Criterios de aceptacion del MVP revisados.

## Stack tecnico

Definido en `decisions/0006-stack-tecnologico.md`. Resumen:

- Aplicacion web responsive, mobile-first.
- Next.js + TypeScript + PostgreSQL + TypeORM.
- UI: Tailwind CSS + shadcn/ui.
- Autenticacion: JWT en `apps/api` con refresh token en cookie HttpOnly, segun
  `decisions/0007-monorepo-backend-frontend.md`.
- Validacion: Zod + React Hook Form.
- PWA y app movil nativa: fases posteriores, arquitectura preparada desde el inicio.

## Primer backlog tecnico sugerido

1. Crear proyecto base.
2. Configurar base de datos.
3. Crear modelo de compania y granja.
4. Crear usuarios, perfiles y permisos.
5. Implementar login y acceso por granja.
6. Crear maestras base.
7. Crear lotes.
8. Crear almacenes y alimentos.
9. Crear movimientos de inventario.
10. Crear consumo por lote.
11. Crear engorde, bajas y cierre.
12. Crear controles de peso.
13. Crear reportes basicos.
14. *(Opcional en MVP v1)* Crear movimientos de ubicacion de lotes (`006`).

## Definicion de listo para MVP v1

El MVP v1 se considera listo cuando:

- Un usuario puede iniciar sesion.
- El usuario solo ve datos de su compania y granjas asignadas.
- Se pueden registrar maestras base.
- Se puede crear un lote de engorde.
- Se puede registrar alimento e inventario.
- Se puede registrar consumo por lote descontando inventario.
- Se pueden registrar controles de peso.
- Se puede cerrar un engorde.
- Se pueden consultar existencias, consumo y resumen de engorde.
- Los registros importantes quedan auditados.
