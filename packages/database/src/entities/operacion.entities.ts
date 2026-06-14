import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import {
  EstadoEngorde,
  EstadoLote,
  EstadoRegistro,
} from '../enums';
import { Compania, Granja } from './organizacion.entities';
import {
  FinalidadProductiva,
  MetodoPesaje,
  MotivoBajaEngorde,
  MotivoCierreEngorde,
  MotivoMovimientoUbicacion,
  PresentacionAlimento,
  TipoAlimento,
  TipoAnimal,
  TipoControlPeso,
  TipoMovimientoInventario,
  Ubicacion,
  UnidadMedida,
} from './maestras.entities';

@Entity('lotes')
@Unique(['granjaId', 'codigo'])
export class Lote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column('uuid')
  granjaId!: string;

  @Column()
  codigo!: string;

  @Column('uuid')
  tipoAnimalId!: string;

  @Column('uuid')
  finalidadProductivaId!: string;

  @Column({ type: 'date' })
  fechaInicio!: string;

  @Column('int')
  cantidadInicial!: number;

  @Column('uuid', { nullable: true })
  ubicacionId?: string;

  @Column({ type: 'enum', enum: EstadoLote, default: EstadoLote.ACTIVO })
  estadoOperativo!: EstadoLote;

  @Column({ nullable: true })
  observaciones?: string;

  @Column({ type: 'enum', enum: EstadoRegistro, default: EstadoRegistro.ACTIVO })
  estadoRegistro!: EstadoRegistro;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true })
  createdById?: string;

  @Column({ nullable: true })
  updatedById?: string;

  @ManyToOne(() => Compania)
  @JoinColumn({ name: 'companiaId' })
  compania!: Compania;

  @ManyToOne(() => Granja)
  @JoinColumn({ name: 'granjaId' })
  granja!: Granja;

  @ManyToOne(() => TipoAnimal)
  @JoinColumn({ name: 'tipoAnimalId' })
  tipoAnimal!: TipoAnimal;

  @ManyToOne(() => FinalidadProductiva)
  @JoinColumn({ name: 'finalidadProductivaId' })
  finalidadProductiva!: FinalidadProductiva;

  @ManyToOne(() => Ubicacion, { nullable: true })
  @JoinColumn({ name: 'ubicacionId' })
  ubicacion?: Ubicacion;
}

@Entity('movimientos_ubicacion')
export class MovimientoUbicacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column('uuid')
  granjaId!: string;

  @Column('uuid')
  loteId!: string;

  @Column('uuid', { nullable: true })
  ubicacionOrigenId?: string;

  @Column('uuid')
  ubicacionDestinoId!: string;

  @Column('uuid', { nullable: true })
  motivoId?: string;

  @Column({ type: 'date' })
  fecha!: string;

  @Column({ nullable: true })
  observaciones?: string;

  @Column({ default: false })
  anulado!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  anuladoAt?: Date;

  @Column({ nullable: true })
  anuladoById?: string;

  @Column({ nullable: true })
  motivoAnulacion?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  createdById!: string;

  @ManyToOne(() => Granja)
  @JoinColumn({ name: 'granjaId' })
  granja!: Granja;

  @ManyToOne(() => Lote)
  @JoinColumn({ name: 'loteId' })
  lote!: Lote;

  @ManyToOne(() => Ubicacion, { nullable: true })
  @JoinColumn({ name: 'ubicacionOrigenId' })
  ubicacionOrigen?: Ubicacion;

  @ManyToOne(() => Ubicacion)
  @JoinColumn({ name: 'ubicacionDestinoId' })
  ubicacionDestino!: Ubicacion;

  @ManyToOne(() => MotivoMovimientoUbicacion, { nullable: true })
  @JoinColumn({ name: 'motivoId' })
  motivo?: MotivoMovimientoUbicacion;
}

@Entity('alimentos')
@Unique(['companiaId', 'nombre'])
export class Alimento {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column()
  nombre!: string;

  @Column('uuid')
  tipoAlimentoId!: string;

  @Column('uuid')
  presentacionId!: string;

  @Column('uuid')
  unidadMedidaId!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 1 })
  factorConversion!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  costoReferencia?: string;

  @Column({ nullable: true })
  observaciones?: string;

  @Column({ type: 'enum', enum: EstadoRegistro, default: EstadoRegistro.ACTIVO })
  estadoRegistro!: EstadoRegistro;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true })
  createdById?: string;

  @Column({ nullable: true })
  updatedById?: string;

  @ManyToOne(() => Compania)
  @JoinColumn({ name: 'companiaId' })
  compania!: Compania;

  @ManyToOne(() => TipoAlimento)
  @JoinColumn({ name: 'tipoAlimentoId' })
  tipoAlimento!: TipoAlimento;

  @ManyToOne(() => PresentacionAlimento)
  @JoinColumn({ name: 'presentacionId' })
  presentacion!: PresentacionAlimento;

  @ManyToOne(() => UnidadMedida)
  @JoinColumn({ name: 'unidadMedidaId' })
  unidadMedida!: UnidadMedida;
}

@Entity('proveedores')
@Unique(['companiaId', 'nombre'])
export class Proveedor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column()
  nombre!: string;

  @Column({ nullable: true })
  identificacionFiscal?: string;

  @Column({ nullable: true })
  telefono?: string;

  @Column({ nullable: true })
  correo?: string;

  @Column({ nullable: true })
  direccion?: string;

  @Column({ type: 'enum', enum: EstadoRegistro, default: EstadoRegistro.ACTIVO })
  estadoRegistro!: EstadoRegistro;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true })
  createdById?: string;

  @Column({ nullable: true })
  updatedById?: string;

  @ManyToOne(() => Compania)
  @JoinColumn({ name: 'companiaId' })
  compania!: Compania;
}

@Entity('almacenes')
@Unique(['granjaId', 'nombre'])
export class Almacen {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column('uuid')
  granjaId!: string;

  @Column()
  nombre!: string;

  @Column({ nullable: true })
  codigo?: string;

  @Column('uuid', { nullable: true })
  ubicacionId?: string;

  @Column({ nullable: true })
  observaciones?: string;

  @Column({ type: 'enum', enum: EstadoRegistro, default: EstadoRegistro.ACTIVO })
  estadoRegistro!: EstadoRegistro;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true })
  createdById?: string;

  @Column({ nullable: true })
  updatedById?: string;

  @ManyToOne(() => Granja)
  @JoinColumn({ name: 'granjaId' })
  granja!: Granja;

  @ManyToOne(() => Ubicacion, { nullable: true })
  @JoinColumn({ name: 'ubicacionId' })
  ubicacion?: Ubicacion;
}

@Entity('movimientos_inventario')
export class MovimientoInventario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column('uuid')
  granjaId!: string;

  @Column('uuid')
  almacenId!: string;

  @Column('uuid')
  alimentoId!: string;

  @Column('uuid')
  tipoMovimientoId!: string;

  @Column({ type: 'date' })
  fecha!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  cantidad!: string;

  @Column('uuid')
  unidadMedidaId!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  costoUnitario?: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  costoTotal?: string;

  @Column('uuid', { nullable: true })
  proveedorId?: string;

  @Column({ nullable: true })
  referencia?: string;

  @Column({ nullable: true })
  motivoAjuste?: string;

  @Column({ nullable: true })
  observaciones?: string;

  @Column({ default: false })
  anulado!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  anuladoAt?: Date;

  @Column({ nullable: true })
  anuladoById?: string;

  @Column({ nullable: true })
  motivoAnulacion?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  createdById!: string;

  @ManyToOne(() => Granja)
  @JoinColumn({ name: 'granjaId' })
  granja!: Granja;

  @ManyToOne(() => Almacen)
  @JoinColumn({ name: 'almacenId' })
  almacen!: Almacen;

  @ManyToOne(() => Alimento)
  @JoinColumn({ name: 'alimentoId' })
  alimento!: Alimento;

  @ManyToOne(() => TipoMovimientoInventario)
  @JoinColumn({ name: 'tipoMovimientoId' })
  tipoMovimiento!: TipoMovimientoInventario;

  @ManyToOne(() => UnidadMedida)
  @JoinColumn({ name: 'unidadMedidaId' })
  unidadMedida!: UnidadMedida;

  @ManyToOne(() => Proveedor, { nullable: true })
  @JoinColumn({ name: 'proveedorId' })
  proveedor?: Proveedor;

  @OneToOne(() => ConsumoAlimento, (c) => c.movimientoInventario)
  consumo?: Relation<ConsumoAlimento>;
}

@Entity('consumos_alimento')
export class ConsumoAlimento {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column('uuid')
  granjaId!: string;

  @Column('uuid')
  loteId!: string;

  @Column('uuid')
  alimentoId!: string;

  @Column('uuid')
  almacenId!: string;

  @Column('uuid', { unique: true })
  movimientoInventarioId!: string;

  @Column({ type: 'date' })
  fecha!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  cantidad!: string;

  @Column('uuid')
  unidadMedidaId!: string;

  @Column({ nullable: true })
  observaciones?: string;

  @Column({ default: false })
  anulado!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  anuladoAt?: Date;

  @Column({ nullable: true })
  anuladoById?: string;

  @Column({ nullable: true })
  motivoAnulacion?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  createdById!: string;

  @ManyToOne(() => Granja)
  @JoinColumn({ name: 'granjaId' })
  granja!: Granja;

  @ManyToOne(() => Lote)
  @JoinColumn({ name: 'loteId' })
  lote!: Lote;

  @ManyToOne(() => Alimento)
  @JoinColumn({ name: 'alimentoId' })
  alimento!: Alimento;

  @ManyToOne(() => Almacen)
  @JoinColumn({ name: 'almacenId' })
  almacen!: Almacen;

  @OneToOne(() => MovimientoInventario)
  @JoinColumn({ name: 'movimientoInventarioId' })
  movimientoInventario!: Relation<MovimientoInventario>;

  @ManyToOne(() => UnidadMedida)
  @JoinColumn({ name: 'unidadMedidaId' })
  unidadMedida!: UnidadMedida;
}

@Entity('engordes_lote')
export class EngordeLote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column('uuid')
  granjaId!: string;

  @Column('uuid')
  loteId!: string;

  @Column({ type: 'date' })
  fechaInicio!: string;

  @Column('int')
  cantidadInicial!: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  pesoInicialPromedio?: string;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  objetivoPeso?: string;

  @Column({ type: 'date', nullable: true })
  fechaCierre?: string;

  @Column('int', { nullable: true })
  cantidadFinal?: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  pesoFinalPromedio?: string;

  @Column('uuid', { nullable: true })
  motivoCierreId?: string;

  @Column({ nullable: true })
  observaciones?: string;

  @Column({ type: 'enum', enum: EstadoEngorde, default: EstadoEngorde.EN_CURSO })
  estado!: EstadoEngorde;

  @Column({ default: false })
  anulado!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  anuladoAt?: Date;

  @Column({ nullable: true })
  anuladoById?: string;

  @Column({ nullable: true })
  motivoAnulacion?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  createdById!: string;

  @ManyToOne(() => Lote)
  @JoinColumn({ name: 'loteId' })
  lote!: Lote;

  @ManyToOne(() => MotivoCierreEngorde, { nullable: true })
  @JoinColumn({ name: 'motivoCierreId' })
  motivoCierre?: MotivoCierreEngorde;
}

@Entity('bajas_engorde')
export class BajaEngorde {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  engordeId!: string;

  @Column('uuid')
  loteId!: string;

  @Column('uuid', { nullable: true })
  motivoId?: string;

  @Column({ type: 'date' })
  fecha!: string;

  @Column('int')
  cantidad!: number;

  @Column({ nullable: true })
  observaciones?: string;

  @Column({ default: false })
  anulado!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  anuladoAt?: Date;

  @Column({ nullable: true })
  anuladoById?: string;

  @Column({ nullable: true })
  motivoAnulacion?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  createdById!: string;

  @ManyToOne(() => EngordeLote)
  @JoinColumn({ name: 'engordeId' })
  engorde!: EngordeLote;

  @ManyToOne(() => MotivoBajaEngorde, { nullable: true })
  @JoinColumn({ name: 'motivoId' })
  motivo?: MotivoBajaEngorde;
}

@Entity('controles_peso')
export class ControlPeso {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column('uuid')
  granjaId!: string;

  @Column('uuid')
  loteId!: string;

  @Column('uuid', { nullable: true })
  engordeId?: string;

  @Column('uuid')
  tipoControlId!: string;

  @Column('uuid', { nullable: true })
  metodoPesajeId?: string;

  @Column({ type: 'date' })
  fecha!: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  peso!: string;

  @Column('uuid')
  unidadMedidaId!: string;

  @Column('int', { nullable: true })
  cantidadMuestra?: number;

  @Column({ nullable: true })
  observaciones?: string;

  @Column({ default: false })
  anulado!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  anuladoAt?: Date;

  @Column({ nullable: true })
  anuladoById?: string;

  @Column({ nullable: true })
  motivoAnulacion?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  createdById!: string;

  @ManyToOne(() => Granja)
  @JoinColumn({ name: 'granjaId' })
  granja!: Granja;

  @ManyToOne(() => Lote)
  @JoinColumn({ name: 'loteId' })
  lote!: Lote;

  @ManyToOne(() => EngordeLote, { nullable: true })
  @JoinColumn({ name: 'engordeId' })
  engorde?: EngordeLote;

  @ManyToOne(() => TipoControlPeso)
  @JoinColumn({ name: 'tipoControlId' })
  tipoControl!: TipoControlPeso;

  @ManyToOne(() => MetodoPesaje, { nullable: true })
  @JoinColumn({ name: 'metodoPesajeId' })
  metodoPesaje?: MetodoPesaje;

  @ManyToOne(() => UnidadMedida)
  @JoinColumn({ name: 'unidadMedidaId' })
  unidadMedida!: UnidadMedida;
}
