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

Puede limitarse en MVP v1 a lotes, dejando animales individuales para una fase posterior.

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

- Inicio de engorde.
- Cantidad inicial.
- Peso inicial promedio.
- Bajas.
- Cierre de engorde.
- Cantidad final.
- Peso final promedio.
- Motivo de cierre.

### 8. Controles de peso

Specs relacionadas:

- `013-controles-peso.md`

Incluye:

- Peso promedio de lote.
- Muestra de lote.
- Metodo de pesaje.
- Historial de peso.
- Asociacion con engorde.

No incluye en MVP v1:

- Pesaje individual avanzado.
- Integracion con basculas.
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

## Modulos fuera de MVP v1

Quedan para fases posteriores:

- `002-gestion-animales.md` completo para animales individuales.
- `004-sanidad-animal.md`, salvo una version minima si se requiere.
- `008-montas.md`.
- `009-gestacion.md`.
- `010-partos.md`.
- `011-destete.md`.
- `014-reportes-reproduccion.md`.
- `016-reportes-sanidad.md`.
- Inventario de medicamentos.
- Alertas.
- Facturacion.
- Contabilidad.
- Aplicacion movil offline.

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
- Autenticacion: Auth.js (sesiones web).
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
11. Crear controles de peso.
12. Crear engorde y cierre.
13. Crear reportes basicos.

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
