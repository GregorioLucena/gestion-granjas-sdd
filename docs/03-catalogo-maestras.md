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

- `animales.ver`, `animales.crear`, `animales.editar`
- `animales.eventos.crear`, `animales.eventos.anular`
- `lotes.editar`
- `sanidad.ver`, `sanidad.crear`, `sanidad.anular`
- `sanidad.casos.seguir`, `sanidad.veterinario_asignar`
- `inventario.ver`
- `inventario.alimentos.crear`
- `inventario.movimientos.crear`
- `inventario.ajustes.crear`
- `alimentacion.consumo.crear`
- `alimentacion.consumo.anular`
- `ubicaciones.movimientos.ver`
- `ubicaciones.movimientos.crear`
- `ubicaciones.movimientos.anular`
- `reproduccion.servicios.ver`
- `reproduccion.servicios.crear`
- `reproduccion.servicios.anular`
- `reproduccion.gestacion.ver`
- `reproduccion.gestacion.confirmar`
- `reproduccion.gestacion.controlar`
- `reproduccion.gestacion.finalizar`
- `reproduccion.gestacion.anular`
- `reproduccion.partos.ver`
- `reproduccion.partos.crear`
- `reproduccion.partos.anular`
- `reproduccion.lactancia.ver`
- `reproduccion.lactancia.bajas_crear`
- `reproduccion.lactancia.bajas_anular`
- `reproduccion.destete.crear`
- `reproduccion.destete.anular`
- `engorde.ver`
- `engorde.iniciar`
- `engorde.bajas.crear`
- `engorde.cerrar`
- `engorde.anular`
- `pesos.ver`
- `pesos.crear`
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

Alcance: por compania, con valores iniciales sugeridos.

Puede incluir `duracionGestacionDias`, entero positivo y opcional.

### Raza

Raza asociada a un tipo de animal.

Ejemplos:

- Yorkshire.
- Duroc.
- Landrace.
- Holstein.

Alcance: por compania.

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

Para reglas que no deben depender del nombre visible, puede incluir `codigoSistema`
inmutable. En MVP v1 la finalidad que habilita el proceso de engorde usa
`codigoSistema = ENGORDE`. MVP v2 agrega `REPRODUCCION` y `CRIA`. El nombre puede editarse
sin romper reglas.

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

Alcance: enum global derivado de eventos de ciclo; no es ABM.

### Motivos de ciclo del animal

Catalogos por compania separados para venta, muerte y descarte.

Ejemplos:

- Venta.
- Muerte.
- Descarte reproductivo.
- Otro.

Cada motivo conserva nombre, descripcion y estado de registro. Se usa en los eventos
terminales de `002-gestion-animales.md`.

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

No se usa como catalogo separado en MVP v1. `012-engorde-lotes.md` cubre estas disminuciones
mediante `Motivo de baja de engorde`. Esta maestra general queda reservada para futuros
movimientos de lotes fuera de un proceso de engorde.

## Maestras sanitarias

### Tipo de evento sanitario (enum)

Clasifica eventos sanitarios.

Ejemplos:

- Vacunacion.
- Diagnostico.
- Tratamiento.
- Control preventivo.

Alcance: enum global fijo con `codigoSistema`; no es ABM.

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

Debe permitir `diasRetiroDefault` opcional, entero y no negativo. El tratamiento conserva
el valor aplicado como snapshot historico.

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

### Estado de ciclo reproductivo

Enum global derivado de eventos, no ABM administrable:

- Pendiente de confirmacion.
- Gestante.
- En lactancia.
- Fallido.
- Cerrado por destete.
- Cerrado sin crias vivas.

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

- Positiva.
- Negativa.
- Dudosa.

Alcance: enum global con `codigoSistema`.

### Estado de gestacion

Estado operativo de una gestacion.

Ejemplos:

- Activa.
- Fallida.
- Finalizada por parto.

Alcance: enum global derivado. `Anulada` es estado de auditoria, no estado operativo.

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

### Estado de lactancia de cria

Enum global derivado, separado del estado operativo del animal:

- En lactancia.
- Baja.
- Destetada.

Parto y destete son eventos vigentes o anulados; no requieren maestras de estado.

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

### Momento del control de peso

Clasifica la posicion del control dentro del ciclo de engorde.

Ejemplos:

- Inicial.
- Intermedio.
- Final.

Alcance MVP v1: enum global del sistema; no administrable por ABM.

### Modalidad del control de peso

Indica si el promedio corresponde al lote completo o a una muestra.

Ejemplos:

- Promedio de lote.
- Muestra.

Alcance MVP v1: enum global del sistema; no administrable por ABM.

Momento y modalidad son dimensiones distintas: un control inicial o final tambien puede
provenir de una muestra.

### Metodo de pesaje

Forma en que se obtiene el peso.

Ejemplos:

- Bascula individual.
- Bascula de corral.
- Estimacion visual.

Alcance recomendado: por compania.

En MVP v1 es obligatorio. `Muestra` no es un metodo: se representa mediante la modalidad.

### Motivo de cierre de engorde

Motivo productivo por el que termina el proceso y se cierra el lote.

Ejemplos:

- Venta.
- Sacrificio.
- Fin de ciclo.
- Otro.

Alcance recomendado: por compania.

### Motivo de baja de engorde

Motivo por el que disminuye la cantidad actual durante el proceso.

Campos adicionales:

- `cuentaComoMortalidad`: booleano obligatorio usado por reportes.

Ejemplos:

- Muerte (`cuentaComoMortalidad = true`).
- Descarte (`false`).
- Venta parcial (`false`).
- Otra salida (`false`).

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

## Prioridad por version

### MVP v1

- Organizacion, seguridad y estado de registro.
- Tipo de animal, raza, sexo, finalidad, ubicacion y estado de lote.
- Alimentos, presentaciones, unidades, proveedores, almacenes y movimientos de inventario.
- Motivo de movimiento de ubicacion, si se implementa spec `006`.
- Metodo, momento y modalidad de pesaje.
- Motivos de cierre y baja de engorde.

### MVP v2

- Motivos de venta, muerte y descarte de animal.
- Tipo de evento sanitario, enfermedad, vacuna y medicamento.
- Via/unidad de dosis, gravedad, estado de caso y motivo de control.
- Tipo de servicio, resultado/metodo de confirmacion y causa de fallo.
- Tipo de parto, estado de lactancia y causa de mortalidad de cria.

### Posteriores

- Etapa productiva y tipo de lote si aparece una regla concreta que los requiera.
- Sintomas, frecuencia/resultado de tratamiento como catalogos separados.
- Protocolo sanitario.
- Causa general de baja en lote fuera de engorde.
- Moneda y costeo multi-moneda.
