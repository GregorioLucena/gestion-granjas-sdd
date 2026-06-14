import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { EstadoRegistro, SignoMovimiento } from '../enums';
import { Compania, Granja } from './organizacion.entities';

@Entity('unidades_medida')
export class UnidadMedida {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  codigo!: string;

  @Column()
  nombre!: string;

  @Column()
  abreviatura!: string;

  @Column({ type: 'enum', enum: EstadoRegistro, default: EstadoRegistro.ACTIVO })
  estadoRegistro!: EstadoRegistro;
}

@Entity('tipos_movimiento_inventario')
export class TipoMovimientoInventario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  codigo!: string;

  @Column()
  nombre!: string;

  @Column({ type: 'enum', enum: SignoMovimiento })
  signo!: SignoMovimiento;

  @Column({ default: false })
  esAjuste!: boolean;

  @Column({ type: 'enum', enum: EstadoRegistro, default: EstadoRegistro.ACTIVO })
  estadoRegistro!: EstadoRegistro;
}

@Entity('tipos_control_peso')
export class TipoControlPeso {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  codigo!: string;

  @Column()
  nombre!: string;

  @Column({ type: 'enum', enum: EstadoRegistro, default: EstadoRegistro.ACTIVO })
  estadoRegistro!: EstadoRegistro;
}

@Entity('tipos_animal')
@Unique(['companiaId', 'nombre'])
export class TipoAnimal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column()
  nombre!: string;

  @Column({ nullable: true })
  descripcion?: string;

  @Column({ default: false })
  requiereRaza!: boolean;

  @Column({ nullable: true })
  duracionGestacionDias?: number;

  @Column({ type: 'enum', enum: EstadoRegistro, default: EstadoRegistro.ACTIVO })
  estadoRegistro!: EstadoRegistro;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Compania)
  @JoinColumn({ name: 'companiaId' })
  compania!: Compania;
}

@Entity('razas')
@Unique(['tipoAnimalId', 'nombre'])
export class Raza {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column('uuid')
  tipoAnimalId!: string;

  @Column()
  nombre!: string;

  @Column({ nullable: true })
  descripcion?: string;

  @Column({ type: 'enum', enum: EstadoRegistro, default: EstadoRegistro.ACTIVO })
  estadoRegistro!: EstadoRegistro;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Compania)
  @JoinColumn({ name: 'companiaId' })
  compania!: Compania;

  @ManyToOne(() => TipoAnimal)
  @JoinColumn({ name: 'tipoAnimalId' })
  tipoAnimal!: TipoAnimal;
}

@Entity('finalidades_productivas')
@Unique(['companiaId', 'nombre'])
export class FinalidadProductiva {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column()
  nombre!: string;

  @Column({ nullable: true })
  descripcion?: string;

  @Column({ type: 'enum', enum: EstadoRegistro, default: EstadoRegistro.ACTIVO })
  estadoRegistro!: EstadoRegistro;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Compania)
  @JoinColumn({ name: 'companiaId' })
  compania!: Compania;
}

@Entity('tipos_ubicacion')
@Unique(['companiaId', 'nombre'])
export class TipoUbicacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column()
  nombre!: string;

  @Column({ nullable: true })
  descripcion?: string;

  @Column({ type: 'enum', enum: EstadoRegistro, default: EstadoRegistro.ACTIVO })
  estadoRegistro!: EstadoRegistro;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Compania)
  @JoinColumn({ name: 'companiaId' })
  compania!: Compania;

  @OneToMany(() => Ubicacion, (u) => u.tipoUbicacion)
  ubicaciones!: Ubicacion[];
}

@Entity('tipos_alimento')
@Unique(['companiaId', 'nombre'])
export class TipoAlimento {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column()
  nombre!: string;

  @Column({ nullable: true })
  descripcion?: string;

  @Column({ type: 'enum', enum: EstadoRegistro, default: EstadoRegistro.ACTIVO })
  estadoRegistro!: EstadoRegistro;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Compania)
  @JoinColumn({ name: 'companiaId' })
  compania!: Compania;
}

@Entity('presentaciones_alimento')
@Unique(['companiaId', 'nombre'])
export class PresentacionAlimento {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column()
  nombre!: string;

  @Column({ nullable: true })
  descripcion?: string;

  @Column({ type: 'enum', enum: EstadoRegistro, default: EstadoRegistro.ACTIVO })
  estadoRegistro!: EstadoRegistro;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Compania)
  @JoinColumn({ name: 'companiaId' })
  compania!: Compania;
}

@Entity('motivos_movimiento_ubicacion')
@Unique(['companiaId', 'nombre'])
export class MotivoMovimientoUbicacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column()
  nombre!: string;

  @Column({ nullable: true })
  descripcion?: string;

  @Column({ type: 'enum', enum: EstadoRegistro, default: EstadoRegistro.ACTIVO })
  estadoRegistro!: EstadoRegistro;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Compania)
  @JoinColumn({ name: 'companiaId' })
  compania!: Compania;
}

@Entity('motivos_cierre_engorde')
@Unique(['companiaId', 'nombre'])
export class MotivoCierreEngorde {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column()
  nombre!: string;

  @Column({ nullable: true })
  descripcion?: string;

  @Column({ type: 'enum', enum: EstadoRegistro, default: EstadoRegistro.ACTIVO })
  estadoRegistro!: EstadoRegistro;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Compania)
  @JoinColumn({ name: 'companiaId' })
  compania!: Compania;
}

@Entity('motivos_baja_engorde')
@Unique(['companiaId', 'nombre'])
export class MotivoBajaEngorde {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column()
  nombre!: string;

  @Column({ nullable: true })
  descripcion?: string;

  @Column({ type: 'enum', enum: EstadoRegistro, default: EstadoRegistro.ACTIVO })
  estadoRegistro!: EstadoRegistro;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Compania)
  @JoinColumn({ name: 'companiaId' })
  compania!: Compania;
}

@Entity('metodos_pesaje')
@Unique(['companiaId', 'nombre'])
export class MetodoPesaje {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column()
  nombre!: string;

  @Column({ nullable: true })
  descripcion?: string;

  @Column({ type: 'enum', enum: EstadoRegistro, default: EstadoRegistro.ACTIVO })
  estadoRegistro!: EstadoRegistro;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Compania)
  @JoinColumn({ name: 'companiaId' })
  compania!: Compania;
}

@Entity('ubicaciones')
@Unique(['granjaId', 'nombre'])
export class Ubicacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  granjaId!: string;

  @Column('uuid')
  tipoUbicacionId!: string;

  @Column()
  nombre!: string;

  @Column({ nullable: true })
  codigo?: string;

  @Column({ nullable: true })
  descripcion?: string;

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

  @ManyToOne(() => TipoUbicacion, (tipo) => tipo.ubicaciones)
  @JoinColumn({ name: 'tipoUbicacionId' })
  tipoUbicacion!: TipoUbicacion;
}
