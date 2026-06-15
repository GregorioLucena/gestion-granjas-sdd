import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source';
import {
  Compania,
  FinalidadProductiva,
  Granja,
  Perfil,
  PerfilPermiso,
  Permiso,
  Raza,
  TipoAnimal,
  TipoControlPeso,
  TipoMovimientoInventario,
  TipoUbicacion,
  Ubicacion,
  UnidadMedida,
  Usuario,
  UsuarioGranja,
  UsuarioPerfil,
} from '../entities';
import { EstadoRegistro, SignoMovimiento } from '../enums';

const PERMISOS_CONFIG = [
  { codigo: 'companias.ver', nombre: 'Ver companias', modulo: 'companias', accion: 'ver' },
  { codigo: 'companias.crear', nombre: 'Crear companias', modulo: 'companias', accion: 'crear' },
  { codigo: 'companias.editar', nombre: 'Editar companias', modulo: 'companias', accion: 'editar' },
  { codigo: 'granjas.ver', nombre: 'Ver granjas', modulo: 'granjas', accion: 'ver' },
  { codigo: 'granjas.crear', nombre: 'Crear granjas', modulo: 'granjas', accion: 'crear' },
  { codigo: 'granjas.editar', nombre: 'Editar granjas', modulo: 'granjas', accion: 'editar' },
  {
    codigo: 'maestras.administrar',
    nombre: 'Administrar maestras',
    modulo: 'maestras',
    accion: 'administrar',
  },
  { codigo: 'usuarios.ver', nombre: 'Ver usuarios', modulo: 'usuarios', accion: 'ver' },
  { codigo: 'usuarios.crear', nombre: 'Crear usuarios', modulo: 'usuarios', accion: 'crear' },
  { codigo: 'usuarios.editar', nombre: 'Editar usuarios', modulo: 'usuarios', accion: 'editar' },
  {
    codigo: 'perfiles.administrar',
    nombre: 'Administrar perfiles',
    modulo: 'perfiles',
    accion: 'administrar',
  },
  { codigo: 'lotes.ver', nombre: 'Ver lotes', modulo: 'lotes', accion: 'ver' },
  { codigo: 'lotes.crear', nombre: 'Crear lotes', modulo: 'lotes', accion: 'crear' },
  { codigo: 'lotes.editar', nombre: 'Editar lotes', modulo: 'lotes', accion: 'editar' },
  { codigo: 'inventario.ver', nombre: 'Ver inventario', modulo: 'inventario', accion: 'ver' },
  {
    codigo: 'inventario.movimientos.crear',
    nombre: 'Crear movimientos de inventario',
    modulo: 'inventario',
    accion: 'movimientos.crear',
  },
  {
    codigo: 'alimentacion.consumo.ver',
    nombre: 'Ver consumo de alimento',
    modulo: 'alimentacion',
    accion: 'consumo.ver',
  },
  {
    codigo: 'alimentacion.consumo.crear',
    nombre: 'Registrar consumo de alimento',
    modulo: 'alimentacion',
    accion: 'consumo.crear',
  },
  { codigo: 'engorde.ver', nombre: 'Ver engorde', modulo: 'engorde', accion: 'ver' },
  { codigo: 'engorde.iniciar', nombre: 'Iniciar engorde', modulo: 'engorde', accion: 'iniciar' },
  { codigo: 'pesos.ver', nombre: 'Ver controles de peso', modulo: 'pesos', accion: 'ver' },
  { codigo: 'pesos.crear', nombre: 'Registrar controles de peso', modulo: 'pesos', accion: 'crear' },
  {
    codigo: 'reportes.alimentacion.ver',
    nombre: 'Ver reportes de alimentacion',
    modulo: 'reportes',
    accion: 'alimentacion.ver',
  },
  {
    codigo: 'reportes.engorde.ver',
    nombre: 'Ver reportes de engorde',
    modulo: 'reportes',
    accion: 'engorde.ver',
  },
];

const PERFIL_ADMIN_SISTEMA = PERMISOS_CONFIG.map((p) => p.codigo);

const PERFIL_ADMIN_COMPANIA = [
  'granjas.ver',
  'granjas.crear',
  'granjas.editar',
  'maestras.administrar',
  'usuarios.ver',
  'usuarios.crear',
  'usuarios.editar',
  'perfiles.administrar',
];

const PERFIL_OPERADOR_GRANJA = [
  'granjas.ver',
  'maestras.administrar',
  'lotes.ver',
  'lotes.crear',
  'lotes.editar',
  'inventario.ver',
  'inventario.movimientos.crear',
  'alimentacion.consumo.ver',
  'alimentacion.consumo.crear',
  'engorde.ver',
  'engorde.iniciar',
  'pesos.ver',
  'pesos.crear',
  'reportes.alimentacion.ver',
  'reportes.engorde.ver',
];

const ANIMALES_SEED: Array<{
  nombre: string;
  requiereRaza: boolean;
  duracionGestacionDias?: number;
  razas: string[];
}> = [
  {
    nombre: 'Porcino',
    requiereRaza: true,
    duracionGestacionDias: 114,
    razas: ['Yorkshire', 'Landrace', 'Duroc', 'Pietrain', 'Hampshire', 'Large White'],
  },
  {
    nombre: 'Bovino',
    requiereRaza: true,
    duracionGestacionDias: 283,
    razas: ['Angus', 'Hereford', 'Brahman', 'Holstein', 'Nelore', 'Charolais', 'Simmental'],
  },
  {
    nombre: 'Ovino',
    requiereRaza: true,
    duracionGestacionDias: 150,
    razas: ['Suffolk', 'Dorper', 'Merino', 'Hampshire', 'Corriedale', 'Texel'],
  },
  {
    nombre: 'Caprino',
    requiereRaza: true,
    duracionGestacionDias: 150,
    razas: ['Saanen', 'Boer', 'Nubia', 'Alpina', 'Toggenburg', 'La Mancha'],
  },
  {
    nombre: 'Aviar',
    requiereRaza: true,
    duracionGestacionDias: 21,
    razas: ['Cobb 500', 'Ross 308', 'Hy-Line Brown', 'Plymouth Rock', 'Rhode Island'],
  },
  {
    nombre: 'Equino',
    requiereRaza: true,
    duracionGestacionDias: 340,
    razas: ['Criollo', 'Cuarto de Milla', 'Paso Fino', 'Pura Sangre', 'Appaloosa'],
  },
  {
    nombre: 'Cunicula',
    requiereRaza: true,
    duracionGestacionDias: 31,
    razas: ['Californiano', 'Nueva Zelanda', 'Gigante de Flandes', 'Rex', 'Belier'],
  },
];

async function runSeed() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const permisoRepo = AppDataSource.getRepository(Permiso);
  const perfilRepo = AppDataSource.getRepository(Perfil);
  const companiaRepo = AppDataSource.getRepository(Compania);
  const granjaRepo = AppDataSource.getRepository(Granja);
  const usuarioRepo = AppDataSource.getRepository(Usuario);

  for (const permiso of PERMISOS_CONFIG) {
    const exists = await permisoRepo.findOne({ where: { codigo: permiso.codigo } });
    if (!exists) {
      await permisoRepo.save(permisoRepo.create(permiso));
    }
  }

  const permisos = await permisoRepo.find({
    where: PERMISOS_CONFIG.map((p) => ({ codigo: p.codigo })),
  });

  let perfil = await perfilRepo.findOne({ where: { nombre: 'Administrador Sistema' } });
  if (!perfil) {
    perfil = await perfilRepo.save(
      perfilRepo.create({
        nombre: 'Administrador Sistema',
        descripcion: 'Acceso completo al sistema',
        estadoRegistro: EstadoRegistro.ACTIVO,
      }),
    );
  }

  async function linkPerfilPermisos(perfilId: string, codigos: string[]) {
    for (const codigo of codigos) {
      const permiso = permisos.find((p) => p.codigo === codigo);
      if (!permiso) continue;

      const link = await AppDataSource.getRepository(PerfilPermiso).findOne({
        where: { perfilId, permisoId: permiso.id },
      });
      if (!link) {
        await AppDataSource.getRepository(PerfilPermiso).save({ perfilId, permisoId: permiso.id });
      }
    }
  }

  await linkPerfilPermisos(perfil.id, PERFIL_ADMIN_SISTEMA);

  let perfilAdminCompania = await perfilRepo.findOne({ where: { nombre: 'Administrador Compania' } });
  if (!perfilAdminCompania) {
    perfilAdminCompania = await perfilRepo.save(
      perfilRepo.create({
        nombre: 'Administrador Compania',
        descripcion: 'Gestion de usuarios, granjas y maestras dentro de su compania',
        estadoRegistro: EstadoRegistro.ACTIVO,
      }),
    );
  }
  await linkPerfilPermisos(perfilAdminCompania.id, PERFIL_ADMIN_COMPANIA);

  let perfilOperador = await perfilRepo.findOne({ where: { nombre: 'Operador Granja' } });
  if (!perfilOperador) {
    perfilOperador = await perfilRepo.save(
      perfilRepo.create({
        nombre: 'Operador Granja',
        descripcion: 'Operaciones productivas MVP dentro de granjas asignadas',
        estadoRegistro: EstadoRegistro.ACTIVO,
      }),
    );
  }
  await linkPerfilPermisos(perfilOperador.id, PERFIL_OPERADOR_GRANJA);

  const unidadRepo = AppDataSource.getRepository(UnidadMedida);
  const unidades = [
    { codigo: 'KG', nombre: 'Kilogramo', abreviatura: 'kg' },
    { codigo: 'G', nombre: 'Gramo', abreviatura: 'g' },
    { codigo: 'SACO', nombre: 'Saco', abreviatura: 'saco' },
  ];
  for (const unidad of unidades) {
    const exists = await unidadRepo.findOne({ where: { codigo: unidad.codigo } });
    if (!exists) {
      await unidadRepo.save(unidadRepo.create({ ...unidad, estadoRegistro: EstadoRegistro.ACTIVO }));
    }
  }

  const tipoMovRepo = AppDataSource.getRepository(TipoMovimientoInventario);
  const tiposMov = [
    { codigo: 'ENTRADA_COMPRA', nombre: 'Entrada por compra', signo: SignoMovimiento.ENTRADA, esAjuste: false },
    { codigo: 'SALIDA_CONSUMO', nombre: 'Salida por consumo', signo: SignoMovimiento.SALIDA, esAjuste: false },
    { codigo: 'AJUSTE_POSITIVO', nombre: 'Ajuste positivo', signo: SignoMovimiento.ENTRADA, esAjuste: true },
    { codigo: 'AJUSTE_NEGATIVO', nombre: 'Ajuste negativo', signo: SignoMovimiento.SALIDA, esAjuste: true },
  ];
  for (const tipo of tiposMov) {
    const exists = await tipoMovRepo.findOne({ where: { codigo: tipo.codigo } });
    if (!exists) {
      await tipoMovRepo.save(
        tipoMovRepo.create({ ...tipo, estadoRegistro: EstadoRegistro.ACTIVO }),
      );
    }
  }

  const tipoPesoRepo = AppDataSource.getRepository(TipoControlPeso);
  const tiposPeso = [
    { codigo: 'INICIAL', nombre: 'Peso inicial' },
    { codigo: 'INTERMEDIO', nombre: 'Peso intermedio' },
    { codigo: 'FINAL', nombre: 'Peso final' },
  ];
  for (const tipo of tiposPeso) {
    const exists = await tipoPesoRepo.findOne({ where: { codigo: tipo.codigo } });
    if (!exists) {
      await tipoPesoRepo.save(
        tipoPesoRepo.create({ ...tipo, estadoRegistro: EstadoRegistro.ACTIVO }),
      );
    }
  }

  let compania = await companiaRepo.findOne({ where: { nombre: 'Productora Demo' } });
  if (!compania) {
    compania = await companiaRepo.save(
      companiaRepo.create({
        nombre: 'Productora Demo',
        correo: 'contacto@demo.local',
        estadoRegistro: EstadoRegistro.ACTIVO,
      }),
    );
  }

  let granja = await granjaRepo.findOne({
    where: { companiaId: compania.id, nombre: 'Granja Norte' },
  });
  if (!granja) {
    granja = await granjaRepo.save(
      granjaRepo.create({
        companiaId: compania.id,
        nombre: 'Granja Norte',
        codigo: 'GN-01',
        estadoRegistro: EstadoRegistro.ACTIVO,
      }),
    );
  }

  const tipoAnimalRepo = AppDataSource.getRepository(TipoAnimal);
  const razaRepo = AppDataSource.getRepository(Raza);
  let totalRazas = 0;

  for (const animal of ANIMALES_SEED) {
    let tipoAnimal = await tipoAnimalRepo.findOne({
      where: { companiaId: compania.id, nombre: animal.nombre },
    });

    if (!tipoAnimal && animal.nombre === 'Porcino') {
      const legacyCerdo = await tipoAnimalRepo.findOne({
        where: { companiaId: compania.id, nombre: 'Cerdo' },
      });
      if (legacyCerdo) {
        legacyCerdo.nombre = 'Porcino';
        tipoAnimal = await tipoAnimalRepo.save(legacyCerdo);
      }
    }

    if (!tipoAnimal && animal.nombre === 'Cunicula') {
      const legacyConejo = await tipoAnimalRepo.findOne({
        where: { companiaId: compania.id, nombre: 'Conejo' },
      });
      if (legacyConejo) {
        legacyConejo.nombre = 'Cunicula';
        tipoAnimal = await tipoAnimalRepo.save(legacyConejo);
      }
    }

    if (!tipoAnimal) {
      tipoAnimal = await tipoAnimalRepo.save(
        tipoAnimalRepo.create({
          companiaId: compania.id,
          nombre: animal.nombre,
          requiereRaza: animal.requiereRaza,
          duracionGestacionDias: animal.duracionGestacionDias,
          estadoRegistro: EstadoRegistro.ACTIVO,
        }),
      );
    }

    for (const nombreRaza of animal.razas) {
      const exists = await razaRepo.findOne({
        where: { tipoAnimalId: tipoAnimal.id, nombre: nombreRaza },
      });
      if (!exists) {
        await razaRepo.save(
          razaRepo.create({
            companiaId: compania.id,
            tipoAnimalId: tipoAnimal.id,
            nombre: nombreRaza,
            estadoRegistro: EstadoRegistro.ACTIVO,
          }),
        );
        totalRazas += 1;
      }
    }
  }

  const tiposAnimalCount = ANIMALES_SEED.length;

  const tipoUbicacionRepo = AppDataSource.getRepository(TipoUbicacion);
  const tiposUbicacionSeed = ['Galpon', 'Corral', 'Sala maternidad', 'Sala destete', 'Bodega'];
  const tiposUbicacion: Record<string, TipoUbicacion> = {};

  for (const nombre of tiposUbicacionSeed) {
    let tipo = await tipoUbicacionRepo.findOne({
      where: { companiaId: compania.id, nombre },
    });
    if (!tipo) {
      tipo = await tipoUbicacionRepo.save(
        tipoUbicacionRepo.create({
          companiaId: compania.id,
          nombre,
          estadoRegistro: EstadoRegistro.ACTIVO,
        }),
      );
    }
    tiposUbicacion[nombre] = tipo;
  }

  const finalidadRepo = AppDataSource.getRepository(FinalidadProductiva);
  for (const nombre of ['Engorde', 'Reproduccion', 'Genetica']) {
    const exists = await finalidadRepo.findOne({ where: { companiaId: compania.id, nombre } });
    if (!exists) {
      await finalidadRepo.save(
        finalidadRepo.create({
          companiaId: compania.id,
          nombre,
          estadoRegistro: EstadoRegistro.ACTIVO,
        }),
      );
    }
  }

  const ubicacionRepo = AppDataSource.getRepository(Ubicacion);
  const ubicacionesSeed = [
    { nombre: 'Galpon A', codigo: 'GA-01', tipo: 'Galpon' },
    { nombre: 'Galpon B', codigo: 'GA-02', tipo: 'Galpon' },
    { nombre: 'Corral 1', codigo: 'C-01', tipo: 'Corral' },
    { nombre: 'Sala maternidad 1', codigo: 'SM-01', tipo: 'Sala maternidad' },
    { nombre: 'Sala destete 1', codigo: 'SD-01', tipo: 'Sala destete' },
    { nombre: 'Bodega alimento', codigo: 'BOD-01', tipo: 'Bodega' },
  ];

  for (const ubicacion of ubicacionesSeed) {
    const exists = await ubicacionRepo.findOne({
      where: { granjaId: granja.id, nombre: ubicacion.nombre },
    });
    if (!exists) {
      await ubicacionRepo.save(
        ubicacionRepo.create({
          granjaId: granja.id,
          tipoUbicacionId: tiposUbicacion[ubicacion.tipo].id,
          nombre: ubicacion.nombre,
          codigo: ubicacion.codigo,
          estadoRegistro: EstadoRegistro.ACTIVO,
        }),
      );
    }
  }

  const adminEmail = process.env.DEV_USER_EMAIL ?? 'admin@demo.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';

  let usuario = await usuarioRepo.findOne({ where: { email: adminEmail } });
  if (!usuario) {
    usuario = await usuarioRepo.save(
      usuarioRepo.create({
        companiaId: compania.id,
        nombre: 'Admin',
        apellido: 'Demo',
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
      }),
    );
  }

  const usuarioPerfilRepo = AppDataSource.getRepository(UsuarioPerfil);
  const usuarioPerfil = await usuarioPerfilRepo.findOne({
    where: { usuarioId: usuario.id, perfilId: perfil.id },
  });
  if (!usuarioPerfil) {
    await usuarioPerfilRepo.save({ usuarioId: usuario.id, perfilId: perfil.id });
  }

  const usuarioGranjaRepo = AppDataSource.getRepository(UsuarioGranja);
  const usuarioGranja = await usuarioGranjaRepo.findOne({
    where: { usuarioId: usuario.id, granjaId: granja.id },
  });
  if (!usuarioGranja) {
    await usuarioGranjaRepo.save({ usuarioId: usuario.id, granjaId: granja.id });
  }

  console.log('Seed completado.');
  console.log(`Compania demo: ${compania.nombre} (${compania.id})`);
  console.log(`Granja demo: ${granja.nombre} (${granja.id})`);
  console.log(`Tipos animal: ${tiposAnimalCount} | Razas nuevas en esta ejecucion: ${totalRazas}`);
  console.log(`Tipos ubicacion: ${tiposUbicacionSeed.length} | Ubicaciones demo: ${ubicacionesSeed.length}`);
  console.log(`Usuario dev: ${adminEmail} / ${adminPassword}`);

  await AppDataSource.destroy();
}

runSeed().catch((error) => {
  console.error('Error ejecutando seed', error);
  process.exit(1);
});
