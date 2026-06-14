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
import { EstadoRegistro } from '../enums';

@Entity('companias')
export class Compania {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
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

  @OneToMany(() => Granja, (granja) => granja.compania)
  granjas!: Granja[];
}

@Entity('granjas')
@Unique(['companiaId', 'nombre'])
export class Granja {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column()
  nombre!: string;

  @Column({ nullable: true })
  codigo?: string;

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

  @ManyToOne(() => Compania, (compania) => compania.granjas)
  @JoinColumn({ name: 'companiaId' })
  compania!: Compania;
}
