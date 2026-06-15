# Catalogo Consolidado de Maestras

Este documento identifica las maestras necesarias para el proyecto completo. Su objetivo es evitar que conceptos reutilizables queden mezclados dentro de eventos, movimientos o historiales.

## Regla general

Una maestra define opciones reutilizables. Un evento o movimiento registra algo que ocurrio en una fecha.

Ejemplos:

- `Vacuna` es maestra.
- `Vacunacion aplicada a CER-001 el 2026-06-10` es evento sanitario.
- `Tipo de alimento` es maestra.
- `Consumo de 20 kg de alimento en LOT-001` es movimiento.
- `Enfermedad` es maestra.
- `Diagnostico de neumonia en LOT-001` es evento sanitario.

## Operaciones ABM sobre maestras

Las maestras administrables en configuracion base siguen el patron **alta, edicion e inactivacion** (sin borrado fisico). Detalle funcional, campos editables y criterios de aceptacion: `docs/specs/000-configuracion-base.md`.

## Alcance de las maestras

Las maestras pueden tener distintos alcances:

- Global del sistema: compartida por todas las companias. Ejemplos: permisos, perfiles base, unidades comunes.
- Por compania: configurable por cada compania. Ejemplos: alimentos, proveedores, medicamentos, vacunas.
- Por granja: especifica de una granja. Ejemplos: ubicaciones internas, almacenes.

Para el MVP se recomienda:

- Mantener como globales las maestras tecnicas y de seguridad.
- Mantener por compania las maestras productivas y sanitarias.
- Mantener por granja las maestras fisicas internas.

## Maestras organizacionales

## Maestras tecnicas transversales

### Estado de registro

Control tecnico comun para activar o inactivar registros administrables por ABM.

Ejemplos:

- Activo.
- Inactivo.

Alcance recomendado: global del sistema.

Uso recomendado:

- Compania.
- Granja.
- Maestras.
- Usuarios, perfiles y permisos, cuando aplique.
- Ubicaciones.
- Alimentos, vacunas, medicamentos y otros catalogos.

Este estado no reemplaza los estados operativos del negocio. Por ejemplo, un animal puede tener estado operativo `Vendido`, mientras que una vacuna maestra solo necesita estado de registro `Activo` o `Inactivo`.

### Compania

Entidad base del modelo multi-compania. Aunque no es una maestra simple, se administra desde ABM.

Alcance: global del sistema.

### Granja

Unidad productiva perteneciente a una compania. Aunque no es una maestra simple, se administra desde ABM.

Alcance: por compania.

### Tipo de ubicacion

Clasifica ubicaciones internas.

Ejemplos:

- Galpon.
- Corral.
- Jaula.
- Sala.
- Potrero.
- Deposito.

Alcance recomendado: global del sistema o por compania.

### Ubicacion

Lugar fisico dentro de una granja.

Ejemplos:

- Sala de gestacion.
- Corral de engorde 01.
- Deposito de alimentos.

Alcance recomendado: por granja.

### Almacen o deposito

Lugar donde se guardan alimentos, medicamentos o insumos.

Ejemplos:

- Deposito principal.
- Deposito de alimentos.
- Botiquin veterinario.

Alcance recomendado: por granja.

### Motivo de movimiento de ubicacion

Razon por la que un animal o lote cambia de ubicacion dentro de una granja.

Ejemplos:

- Inicio de gestacion.
- Paso a sala de parto.
- Destete.
- Cambio a engorde.
- Manejo sanitario.
- Limpieza de corral.
- Reorganizacion interna.

Alcance recomendado: por compania.

## Maestras de seguridad

### Perfil

Grupo global de permisos.

Ejemplos:

- Administrador de sistema.
- Administrador de compania.
- Encargado de granja.
- Veterinario.
- Operador.
- Consulta.

Alcance recomendado: global del sistema.

### Permiso

Accion controlada por seguridad.

Ejemplos:

- `animales.crear`
- `lotes.editar`
- `sanidad.crear`
- `inventario.ver`
- `inventario.alimentos.crear`
- `inventario.movimientos.crear`
- `inventario.ajustes.crear`
- `alimentacion.consumo.crear`
- `alimentacion.consumo.anular`
- `reproduccion.montas.ver`
- `reproduccion.montas.crear`
- `reproduccion.montas.editar`
- `reproduccion.montas.anular`
- `reproduccion.gestacion.ver`
- `reproduccion.gestacion.crear`
- `reproduccion.gestacion.editar`
- `reproduccion.gestacion.controlar`
- `reproduccion.gestacion.anular`
- `reproduccion.partos.ver`
- `reproduccion.partos.crear`
- `reproduccion.partos.editar`
- `reproduccion.partos.anular`
- `reproduccion.destete.ver`
- `reproduccion.destete.crear`
- `reproduccion.destete.editar`
- `reproduccion.destete.anular`
- `engorde.ver`
- `engorde.iniciar`
- `engorde.bajas.crear`
- `engorde.cerrar`
- `engorde.anular`
- `pesos.ver`
- `pesos.crear`
- `pesos.editar`
- `pesos.anular`
- `reportes.reproduccion.ver`
- `reportes.alimentacion.ver`
- `reportes.sanidad.ver`
- `reportes.engorde.ver`

Alcance recomendado: global del sistema.

## Maestras de animales

### Tipo de animal

Especie o categoria productiva general. Usar nombre de categoria (ej. `Porcino`, `Bovino`, `Cunicula`), no el animal individual (ej. `Cerdo`).

Ejemplos:

- Porcino.
- Bovino.
- Caprino.
- Aviar.
- Cunicula.

Alcance recomendado: global del sistema, con posibilidad futura de extension por compania.

Puede incluir configuraciones reproductivas generales, como duracion esperada de gestacion en dias cuando aplique.

### Raza

Raza asociada a un tipo de animal.

Ejemplos:

- Yorkshire.
- Duroc.
- Landrace.
- Holstein.

Alcance recomendado: global del sistema o por compania.

### Sexo

Valores permitidos para animales.

Ejemplos:

- Macho.
- Hembra.
- Desconocido.

Alcance recomendado: global del sistema.

### Finalidad productiva

Proposito principal del animal o lote.

Ejemplos:

- Reproduccion.
- Engorde.
- Cria.
- Leche.
- Postura.
- Venta.

Alcance recomendado: por compania, con valores iniciales sugeridos por el sistema.

### Etapa productiva

Fase productiva de un animal o lote.

Ejemplos:

- Reproduccion.
- Gestacion.
- Lactancia.
- Destete.
- Crecimiento.
- Engorde.
- Finalizacion.

Alcance recomendado: por compania.

### Estado de animal

Estado operativo del animal. No debe confundirse con el estado tecnico de registro `Activo/Inactivo`.

Ejemplos:

- Activo.
- Vendido.
- Muerto.
- Descartado.

Alcance recomendado: global del sistema.

### Causa de baja de animal

Motivo por el que un animal deja de estar activo.

Ejemplos:

- Venta.
- Muerte.
- Descarte reproductivo.
- Traslado.
- Robo o perdida.

Alcance recomendado: por compania.

## Maestras de lotes

### Estado de lote

Estado operativo del lote. No debe confundirse con el estado tecnico de registro `Activo/Inactivo`.

Ejemplos:

- Activo.
- Cerrado.
- Cancelado.

Alcance recomendado: global del sistema.

### Tipo de lote

Clasificacion funcional del lote.

Ejemplos:

- Engorde.
- Cria.
- Recria.
- Postura.
- Produccion.

Alcance recomendado: por compania.

### Tipo de movimiento de lote

Clasifica cambios en cantidad de animales del lote.

Ejemplos:

- Entrada.
- Baja por muerte.
- Venta.
- Traslado.
- Ajuste.

Alcance recomendado: global del sistema o por compania.

### Causa de baja en lote

Motivo de reduccion de animales en un lote.

Ejemplos:

- Mortalidad.
- Venta.
- Traslado.
- Seleccion.
- Descarte.

Alcance recomendado: por compania.

## Maestras sanitarias

### Tipo de evento sanitario

Clasifica eventos sanitarios.

Ejemplos:

- Vacunacion.
- Enfermedad.
- Diagnostico.
- Tratamiento.
- Control preventivo.

Alcance recomendado: global del sistema.

### Enfermedad

Catalogo de enfermedades o condiciones sanitarias.

Ejemplos:

- Diarrea.
- Neumonia.
- Mastitis.
- Parasitosis.
- Fiebre.

Alcance recomendado: por compania, con base global sugerida.

### Sintoma

Senal observada en un animal o lote.

Ejemplos:

- Fiebre.
- Tos.
- Decaimiento.
- Falta de apetito.
- Cojera.

Alcance recomendado: por compania.

### Vacuna

Producto sanitario preventivo.

Ejemplos:

- Vacuna reproductiva.
- Vacuna contra parvovirus.
- Vacuna contra leptospirosis.

Alcance recomendado: por compania.

### Medicamento o producto sanitario

Producto usado en tratamientos.

Ejemplos:

- Antibiotico.
- Antiinflamatorio.
- Antiparasitario.
- Vitamina.

Alcance recomendado: por compania.

### Via de aplicacion

Forma de administrar vacuna o medicamento.

Ejemplos:

- Oral.
- Intramuscular.
- Subcutanea.
- Topica.

Alcance recomendado: global del sistema.

### Unidad de dosis

Unidad usada para dosis sanitarias.

Ejemplos:

- ml.
- cc.
- mg.
- g.
- dosis.

Alcance recomendado: global del sistema.

### Frecuencia de tratamiento

Periodicidad de aplicacion.

Ejemplos:

- Una vez.
- Cada 12 horas.
- Diario.
- Semanal.

Alcance recomendado: por compania.

### Gravedad sanitaria

Nivel de severidad del caso.

Ejemplos:

- Leve.
- Moderada.
- Grave.
- Critica.

Alcance recomendado: global del sistema.

### Estado de caso sanitario

Estado operativo de una enfermedad, diagnostico o tratamiento. No debe confundirse con el estado tecnico de registro `Activo/Inactivo`.

Ejemplos:

- Activo.
- En tratamiento.
- Recuperado.
- Cronico.
- Fallecido.
- Cerrado.

Alcance recomendado: global del sistema.

### Resultado de tratamiento

Resultado final o parcial de un tratamiento.

Ejemplos:

- En curso.
- Efectivo.
- Sin respuesta.
- Suspendido.
- Requiere seguimiento.

Alcance recomendado: global del sistema o por compania.

### Motivo de control sanitario

Razon de una revision sanitaria.

Ejemplos:

- Revision preventiva.
- Seguimiento de tratamiento.
- Preparto.
- Posparto.
- Control de lote.

Alcance recomendado: por compania.

### Protocolo sanitario

Plantilla de tratamiento, vacunacion o control recomendado.

Ejemplos:

- Plan de vacunacion reproductoras.
- Protocolo de desparasitacion.
- Tratamiento sugerido para diarrea neonatal.

Alcance recomendado: por compania.

## Maestras de reproduccion

### Tipo de servicio reproductivo

Clasifica la forma de monta o inseminacion.

Ejemplos:

- Monta natural.
- Inseminacion artificial.
- Transferencia embrionaria.

Alcance recomendado: global del sistema.

### Estado de servicio reproductivo

Estado posterior a una monta o inseminacion.

Ejemplos:

- Registrado.
- Pendiente de confirmacion.
- Confirmado gestante.
- Fallido.
- Repetido.

Alcance recomendado: global del sistema.

### Metodo de confirmacion de gestacion

Forma de confirmar gestacion.

Ejemplos:

- Observacion.
- Ecografia.
- Palpacion.
- Prueba hormonal.

Alcance recomendado: por compania.

### Resultado de confirmacion

Resultado del control de gestacion.

Ejemplos:

- Gestante.
- No gestante.
- Dudoso.
- Repetir control.

Alcance recomendado: global del sistema.

### Estado de gestacion

Estado operativo de una gestacion.

Ejemplos:

- Pendiente de confirmacion.
- Activa.
- Fallida.
- Cerrada por parto.
- Anulada.

Alcance recomendado: global del sistema.

### Causa de fallo reproductivo

Motivo de fallo de servicio o gestacion.

Ejemplos:

- Repeticion de celo.
- Aborto.
- Reabsorcion.
- Muerte embrionaria.
- Causa desconocida.

Alcance recomendado: por compania.

### Tipo de parto

Clasifica el parto.

Ejemplos:

- Natural.
- Asistido.
- Cesarea.
- Prematuro.

Alcance recomendado: global del sistema o por compania.

### Estado de parto

Estado operativo de un parto registrado.

Ejemplos:

- Registrado.
- Anulado.
- Cerrado para destete.

Alcance recomendado: global del sistema.

### Estado de destete

Estado operativo de un destete registrado.

Ejemplos:

- Registrado.
- Anulado.

Alcance recomendado: global del sistema.

### Estado de cria

Estado de una cria al nacer o durante seguimiento.

Ejemplos:

- Viva.
- Muerta.
- Debil.
- Adoptada.
- Destetada.

Alcance recomendado: global del sistema.

### Causa de mortalidad de cria

Motivo de muerte de una cria.

Ejemplos:

- Aplastamiento.
- Debilidad.
- Enfermedad.
- Bajo peso.
- Desconocida.

Alcance recomendado: por compania.

## Maestras de alimentacion e inventario

### Tipo de alimento

Clasifica alimentos.

Ejemplos:

- Iniciador.
- Crecimiento.
- Engorde.
- Gestacion.
- Lactancia.

Alcance recomendado: por compania.

### Presentacion de alimento

Formato comercial.

Ejemplos:

- Saco.
- Granel.
- Litro.
- Mezcla.

Alcance recomendado: por compania.

### Unidad de medida

Unidad para cantidades.

Ejemplos:

- kg.
- g.
- lb.
- saco.
- litro.
- unidad.

Alcance recomendado: global del sistema, con extension por compania.

### Destino de alimento

Uso productivo recomendado.

Ejemplos:

- Gestacion.
- Lactancia.
- Engorde.
- Reproductores.
- Cria.

Alcance recomendado: por compania.

### Proveedor

Entidad que suministra alimentos, medicamentos o insumos.

Alcance recomendado: por compania.

### Tipo de movimiento de inventario

Clasifica entradas y salidas de inventario.

Ejemplos:

- Compra.
- Consumo.
- Ajuste positivo.
- Ajuste negativo.
- Devolucion.
- Vencimiento.

Alcance recomendado: global del sistema.

### Motivo de ajuste de inventario

Explica ajustes manuales.

Ejemplos:

- Diferencia fisica.
- Perdida.
- Vencimiento.
- Error de registro.
- Donacion.

Alcance recomendado: por compania.

### Moneda

Moneda usada para costos.

Ejemplos:

- USD.
- DOP.
- COP.
- EUR.

Alcance recomendado: global del sistema.

## Maestras de controles de peso y engorde

### Tipo de control de peso

Clasifica controles de peso.

Ejemplos:

- Individual.
- Promedio de lote.
- Muestra de lote.

Alcance recomendado: global del sistema.

### Metodo de pesaje

Forma en que se obtiene el peso.

Ejemplos:

- Bascula individual.
- Bascula de corral.
- Estimado visual.
- Muestra representativa.

Alcance recomendado: por compania.

### Motivo de cierre de lote

Motivo por el que termina un lote.

Ejemplos:

- Venta.
- Traslado.
- Sacrificio.
- Fusion.
- Cancelacion.

Alcance recomendado: por compania.

## Maestras que no deben confundirse con eventos

No son maestras:

- Animal registrado.
- Lote registrado.
- Monta realizada.
- Gestacion registrada.
- Parto ocurrido.
- Vacunacion aplicada.
- Enfermedad diagnosticada en un animal o lote.
- Tratamiento aplicado.
- Consumo de alimento.
- Movimiento de inventario.
- Control de peso.
- Baja de animal.
- Cierre de lote.

Estos son registros operativos, eventos o movimientos con fecha e historial.

## Prioridad para el MVP

### Imprescindibles

- Compania.
- Granja.
- Perfil.
- Permiso.
- Estado de registro.
- Tipo de animal.
- Raza.
- Sexo.
- Finalidad productiva.
- Tipo de ubicacion.
- Ubicacion.
- Estado de animal.
- Estado de lote.
- Tipo de evento sanitario.
- Enfermedad.
- Vacuna.
- Medicamento o producto sanitario.
- Via de aplicacion.
- Unidad de dosis.
- Tipo de alimento.
- Presentacion de alimento.
- Unidad de medida.
- Tipo de movimiento de inventario.
- Motivo de movimiento de ubicacion.

### Recomendadas para primera version productiva

- Etapa productiva.
- Causa de baja de animal.
- Tipo de lote.
- Causa de baja en lote.
- Sintoma.
- Frecuencia de tratamiento.
- Gravedad sanitaria.
- Estado de caso sanitario.
- Resultado de tratamiento.
- Motivo de control sanitario.
- Proveedor.
- Motivo de ajuste de inventario.
- Tipo de servicio reproductivo.
- Resultado de confirmacion de gestacion.
- Tipo de parto.
- Estado de cria.

### Posteriores

- Protocolo sanitario.
- Metodo de confirmacion de gestacion.
- Causa de fallo reproductivo.
- Causa de mortalidad de cria.
- Tipo de control de peso.
- Metodo de pesaje.
- Motivo de cierre de lote.
- Moneda, si el MVP no calcula costos multi-moneda.
