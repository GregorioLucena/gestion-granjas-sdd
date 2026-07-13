# Vision del Producto

## Nombre provisional

Gestion de Granjas Productivas

## Problema

Muchas granjas registran informacion productiva en cuadernos, hojas de calculo o de forma incompleta. Esto dificulta conocer el historial de los animales, controlar reproduccion, medir consumo de alimento, evaluar engordes, calcular costos y tomar decisiones a tiempo.

## Vision

Crear una plataforma modular para registrar, controlar y analizar la produccion animal de una o varias granjas. El sistema debe permitir trabajar con multiples companias, multiples granjas por compania, animales individuales y lotes, gestionando eventos productivos y manteniendo trazabilidad de reproduccion, sanidad, alimentacion, inventario y resultados.

## Enfoque inicial

El primer enfoque sera la produccion porcina, especialmente:

- Registro de animales reproductores.
- Control de montas.
- Seguimiento de gestacion.
- Registro de partos y crias.
- Control de lotes de engorde.
- Control sanitario basico: veterinario tratante, vacunaciones, enfermedades y tratamientos.
- Consumo de alimento por animal o lote.
- Inventario basico de alimentos.

Aunque el enfoque inicial sea porcino, el modelo debe permitir agregar otros tipos de animales sin redisenar todo el sistema.

## Usuarios objetivo

- Dueno o administrador de granja.
- Encargado de produccion.
- Tecnico agropecuario o veterinario.
- Operador que registra informacion diaria.

## Objetivos por version

El alcance vinculante del MVP v1 esta en `05-mvp-tecnico.md`.

### MVP v1

- Registrar companias y granjas.
- Registrar usuarios, perfiles y permisos.
- Registrar maestras base como tipos de animales, razas, finalidades productivas, tipos de ubicacion y ubicaciones internas.
- Registrar tipos de animales y sus finalidades productivas.
- Registrar lotes de engorde.
- Registrar alimentos, costos y movimientos de inventario.
- Registrar consumo de alimento por lote.
- Registrar engorde, bajas y controles de peso.
- Consultar reportes basicos de alimentacion y engorde.

### MVP v2

- Registrar animales individuales con identificacion unica.
- Registrar veterinario tratante, vacunaciones, diagnosticos, tratamientos y controles.
- Registrar ciclos reproductivos, gestaciones, partos, lactancia y destete.
- Consultar historiales y reportes reproductivos y sanitarios.

## Fuera de alcance inicial

- Facturacion y contabilidad completa.
- Aplicacion movil offline.
- Sensores automaticos.
- Predicciones con inteligencia artificial.
- Integraciones externas.
- Gestion sanitaria avanzada, como alertas automaticas, recetas digitales o integraciones con laboratorios.
- Nomina o gestion de empleados.

## Principios del producto

- El sistema debe ser multi-compania.
- Una compania puede tener una o varias granjas.
- Toda informacion productiva debe pertenecer a una granja.
- El acceso a la informacion debe controlarse por usuario, perfil, compania y granja.
- El sistema debe ser multiespecie.
- El sistema debe soportar manejo individual y manejo por lotes.
- Las maestras deben poder gestionarse desde ABM.
- Todo evento importante debe quedar registrado con fecha.
- La informacion productiva debe poder consultarse como historial.
- La informacion sanitaria debe formar parte del historial del animal o lote.
- Las reglas especificas de una especie no deben bloquear el uso para otras especies.
