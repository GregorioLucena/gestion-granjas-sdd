# Glosario del Dominio

Este glosario define los terminos base del sistema. Debe actualizarse cuando aparezcan nuevos conceptos importantes.

## Compania

Entidad organizacional propietaria o administradora de una o varias granjas. Toda granja debe pertenecer a una compania.

## Granja

Unidad productiva donde se registran animales, lotes, ubicaciones, alimentos y eventos productivos. Una compania puede tener una o varias granjas.

## Maestra

Catalogo configurable usado por el sistema para estandarizar registros. Una maestra define opciones reutilizables; no representa un evento ocurrido. Ejemplos: tipos de animal, razas, finalidades productivas, enfermedades, vacunas, tipos de alimento y tipos de ubicacion.

## Alcance de maestra

Nivel donde aplica una maestra: global del sistema, por compania o por granja.

## ABM

Proceso de alta, baja y modificacion de registros. Se usara para gestionar maestras y entidades principales.

## Usuario

Persona que accede al sistema mediante credenciales. Pertenece a una sola compania, puede tener uno o mas perfiles y puede operar sobre una o varias granjas permitidas dentro de su compania.

## Perfil

Conjunto global de permisos asignable a usuarios para definir que acciones pueden realizar dentro del sistema.

## Permiso

Autorizacion para ejecutar una accion especifica sobre un modulo. Ejemplos: crear animales, editar granjas, consultar inventario.

## Acceso por granja

Restriccion que determina sobre cuales granjas puede consultar o modificar informacion un usuario.

## Autorizacion efectiva

Resultado de combinar compania del usuario, granjas permitidas y permisos de sus perfiles. Una accion solo debe permitirse cuando las tres condiciones son validas.

## Veterinario

Usuario con perfil global `Veterinario` o con permisos sanitarios equivalentes. Puede consultar historiales sanitarios, registrar eventos sanitarios y ser asignado como veterinario tratante.

## Veterinario tratante

Veterinario responsable del seguimiento sanitario de un animal o lote durante un periodo determinado.

## Evento sanitario

Registro fechado relacionado con la salud de un animal o lote. Ejemplos: vacunacion, enfermedad, diagnostico, tratamiento o control preventivo.

## Animal

Ser vivo registrado individualmente en la granja. Puede pertenecer a cualquier tipo de animal, como cerdo, bovino, caprino, ave, conejo u otro.

## Tipo de animal

Categoria general de especie o grupo productivo. En maestras se nombra por categoria (ej. `Porcino`, `Bovino`), no por el individuo (ej. un **cerdo** pertenece al tipo **Porcino**; un **conejo** al tipo **Cunicula**).

Ejemplos de tipos: Porcino, Bovino, Caprino, Aviar, Cunicula.

## Raza

Clasificacion genetica o comercial dentro de un tipo de animal. Ejemplos: Yorkshire, Landrace, Duroc. Puede ser requerida u opcional segun la configuracion del tipo de animal.

## Finalidad productiva

Proposito principal de un animal o lote dentro de la granja. Ejemplos: reproduccion, engorde, cria, leche, postura, venta.

## Animal individual

Animal identificado de manera unica y gestionado de forma independiente. Ejemplo: una cerda reproductora con historial de montas y partos.

## Tipo de ubicacion

Categoria de ubicacion interna dentro de una granja. Ejemplos: galpon, corral, jaula, sala, potrero.

## Ubicacion

Lugar fisico o productivo dentro de una granja donde puede estar un animal, lote, alimento o actividad. Debe pertenecer a un tipo de ubicacion.

## Movimiento de ubicacion

Evento fechado que registra el cambio de ubicacion de un animal o lote dentro de una granja.

## Motivo de movimiento

Razon por la que se mueve un animal o lote de una ubicacion a otra. Ejemplos: gestacion, parto, destete, engorde, manejo sanitario o reorganizacion interna.

## Lote

Grupo de animales manejado como una unidad productiva. Se usa principalmente cuando no se requiere seguimiento individual de cada animal, como en engorde o cria grupal.

## Evento productivo

Registro fechado de algo relevante en la vida del animal o lote. Ejemplos: monta, parto, pesaje, consumo de alimento, baja, venta.

## Monta

Evento reproductivo donde una hembra es servida por un macho o inseminada.

## Servicio reproductivo

Evento que registra una monta natural, inseminacion artificial u otro metodo reproductivo aplicado a una hembra.

## Ciclo reproductivo

Intento reproductivo de una hembra que puede agrupar uno o varios servicios del mismo celo y
continua con confirmacion, gestacion, parto, lactancia y destete o con un fallo.

## Hembra servida

Animal hembra que recibe un servicio reproductivo.

## Macho reproductor

Animal macho usado en una monta natural o como referencia genetica de una inseminacion.

## Fecha probable de parto

Fecha estimada de parto calculada o registrada a partir de un servicio reproductivo.

## Gestacion

Periodo creado al confirmar que una hembra esta gestante. Excepcionalmente puede crearse como
no confirmada al registrar un parto omitido en el seguimiento.

## Confirmacion de gestacion

Evaluacion realizada para determinar si una hembra servida esta gestante.

## Control de gestacion

Revision realizada durante una gestacion para registrar estado, observaciones, resultado o recomendaciones.

## Fallo reproductivo

Resultado negativo o interrupcion de un proceso reproductivo. Ejemplos: no gestante, repeticion de celo, aborto o reabsorcion.

## Parto

Evento donde una hembra da nacimiento a sus crias.

## Cria

Animal nacido a partir de un parto registrado.

## Nacidos vivos

Cantidad de crias nacidas con vida en un parto.

## Nacidos muertos

Cantidad de crias nacidas sin vida en un parto.

## Crias debiles

Crias nacidas vivas pero con condicion inicial comprometida o que requieren observacion especial.

## Destete

Separacion de las crias de la madre, generalmente registrada con fecha, cantidad de crias destetadas y peso.

## Cantidad destetada

Numero de crias que llegan vivas al destete.

## Mortalidad durante lactancia

Suma de bajas de lactancia fechadas entre el parto y el destete.

## Peso al destete

Peso promedio o individual de las crias al momento del destete.

## Engorde

Proceso productivo en el que uno o varios animales aumentan de peso hasta alcanzar una condicion objetivo.

## Inicio de engorde

Registro que marca el comienzo productivo del engorde para un lote.

## Cierre de engorde

Evento historico que marca el final productivo del engorde y resume cantidades, pesos y
resultado. Puede anularse con trazabilidad para reabrir el proceso y el lote.

## Ganancia de peso

Diferencia entre peso final y peso inicial de un animal o lote.

## Baja de engorde

Reduccion de animales durante el proceso de engorde por muerte, venta, traslado, descarte u otra causa.

## Control de peso

Evento historico e inmutable que registra el peso de un animal o lote en una fecha
determinada. En MVP v1 aplica solo a lotes con engorde.

## Peso individual

Peso registrado para un animal individual.

## Peso promedio de lote

Peso promedio registrado o calculado para los animales de un lote.

## Muestra de lote

Subconjunto de animales pesados para estimar el peso promedio de un lote.

## Metodo de pesaje

Forma usada para obtener el peso, como bascula individual, bascula de corral o estimacion
visual.

## Momento del control de peso

Posicion del control dentro del ciclo: inicial, intermedio o final.

## Modalidad del control de peso

Indica si el peso promedio corresponde al lote completo o se obtuvo desde una muestra. La
modalidad es independiente del metodo de pesaje.

## Vacunacion

Evento sanitario donde se registra la aplicacion de una vacuna a un animal o lote.

## Enfermedad

Condicion sanitaria detectada en un animal o lote, que puede requerir diagnostico, tratamiento y seguimiento.

## Diagnostico

Resultado de una evaluacion sanitaria realizada por un veterinario o responsable autorizado.

## Tratamiento

Accion sanitaria aplicada a un animal o lote para prevenir, controlar o resolver una enfermedad o condicion. Puede incluir medicamento, dosis, frecuencia y duracion.

## Periodo de retiro

Intervalo posterior a un tratamiento durante el cual el animal o lote no puede venderse o
salir para consumo.

## Alimento

Producto consumido por animales o lotes. Puede tener unidad, costo, destino productivo e inventario.

## Inventario de alimento

Control de entradas, salidas y existencias de alimentos disponibles en la granja.

## Consumo de alimento

Registro de la cantidad de alimento entregada o consumida por un animal o lote en una fecha determinada.

## Consumo individual

Consumo de alimento asociado a un animal registrado individualmente.

## Consumo por lote

Consumo de alimento asociado a un lote de animales manejado como unidad productiva.

## Baja

Salida de un animal o reduccion de animales de un lote por muerte, venta, descarte, traslado u otra causa.

## Estado

Condicion actual de un animal o lote. Ejemplos: activo, vendido, muerto, descartado, cerrado.

## Estado de registro

Estado tecnico usado en ABM para indicar si un registro esta disponible para nuevas operaciones. Valores iniciales: activo e inactivo. No debe confundirse con estados operativos del negocio, como vendido, muerto, cerrado, en tratamiento o recuperado.

## Auditoria

Informacion que permite conocer quien creo, actualizo o anulo un registro, cuando lo hizo y, cuando aplique, por que motivo.

## Anulacion

Accion usada para dejar sin efecto un evento o movimiento historico registrado por error, conservando su trazabilidad.

## Reporte

Vista o consulta que consolida informacion operativa para apoyar decisiones.

## Indicador productivo

Medida calculada a partir de datos registrados. Ejemplos: promedio de nacidos vivos, promedio de destetados, consumo por lote o ganancia de peso.

## Reporte de consumo

Vista que consolida alimento consumido por lote, alimento, granja o periodo en MVP v1.

## Reporte de existencia

Vista que muestra cantidad disponible de alimentos por granja, almacen y alimento.

## Costo de consumo

Valor estimado del alimento consumido, calculado a partir del costo disponible en inventario o movimientos asociados.

## Reporte sanitario

Vista que consolida eventos relacionados con salud animal por periodo, granja, animal, lote o veterinario.

## Caso sanitario activo

Enfermedad, diagnostico o tratamiento que aun requiere seguimiento.

## Historial sanitario consolidado

Vista que agrupa vacunaciones, enfermedades, diagnosticos, tratamientos, controles y veterinarios tratantes de un animal o lote.

## Reporte de engorde

Vista que consolida indicadores productivos de uno o varios lotes en engorde.

## Duracion de engorde

Cantidad de dias entre fecha de inicio y fecha de cierre del engorde.

## Consumo acumulado

Suma de alimento consumido por un animal o lote durante un periodo.

## Conversion alimenticia basica

Relacion entre alimento consumido y ganancia total estimada. En MVP v1 usa la ganancia de
peso promedio multiplicada por la cantidad final del engorde.

## Historial reproductivo consolidado

Vista que agrupa servicios reproductivos, gestaciones, partos, destetes y fallos de una hembra.
