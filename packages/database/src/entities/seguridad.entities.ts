import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EstadoRegistro, EstadoUsuario } from '../enums';
import { Compania, Granja } from './organizacion.entities';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column()
  nombre!: string;

  @Column({ nullable: true })
  apellido?: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ type: 'enum', enum: EstadoUsuario, default: EstadoUsuario.ACTIVO })
  estado!: EstadoUsuario;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Compania)
  @JoinColumn({ name: 'companiaId' })
  compania!: Compania;

  @OneToMany(() => UsuarioGranja, (ug) => ug.usuario)
  granjas!: UsuarioGranja[];

  @OneToMany(() => UsuarioPerfil, (up) => up.usuario)
  perfiles!: UsuarioPerfil[];

  @OneToMany(() => Session, (s) => s.user)
  sessions!: Session[];
}

@Entity('perfiles')
export class Perfil {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  nombre!: string;

  @Column({ nullable: true })
  descripcion?: string;

  @Column({ type: 'enum', enum: EstadoRegistro, default: EstadoRegistro.ACTIVO })
  estadoRegistro!: EstadoRegistro;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => PerfilPermiso, (pp) => pp.perfil)
  permisos!: PerfilPermiso[];

  @OneToMany(() => UsuarioPerfil, (up) => up.perfil)
  usuarios!: UsuarioPerfil[];
}

@Entity('permisos')
export class Permiso {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  codigo!: string;

  @Column()
  nombre!: string;

  @Column()
  modulo!: string;

  @Column()
  accion!: string;

  @Column({ nullable: true })
  descripcion?: string;

  @OneToMany(() => PerfilPermiso, (pp) => pp.permiso)
  perfiles!: PerfilPermiso[];
}

@Entity('perfil_permisos')
export class PerfilPermiso {
  @PrimaryColumn('uuid')
  perfilId!: string;

  @PrimaryColumn('uuid')
  permisoId!: string;

  @ManyToOne(() => Perfil, (perfil) => perfil.permisos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'perfilId' })
  perfil!: Perfil;

  @ManyToOne(() => Permiso, (permiso) => permiso.perfiles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permisoId' })
  permiso!: Permiso;
}

@Entity('usuario_perfiles')
export class UsuarioPerfil {
  @PrimaryColumn('uuid')
  usuarioId!: string;

  @PrimaryColumn('uuid')
  perfilId!: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.perfiles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuarioId' })
  usuario!: Usuario;

  @ManyToOne(() => Perfil, (perfil) => perfil.usuarios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'perfilId' })
  perfil!: Perfil;
}

@Entity('usuario_granjas')
export class UsuarioGranja {
  @PrimaryColumn('uuid')
  usuarioId!: string;

  @PrimaryColumn('uuid')
  granjaId!: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.granjas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuarioId' })
  usuario!: Usuario;

  @ManyToOne(() => Granja, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'granjaId' })
  granja!: Granja;
}

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  sessionToken!: string;

  @Column('uuid')
  userId!: string;

  @Column({ type: 'timestamptz' })
  expires!: Date;

  @ManyToOne(() => Usuario, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: Usuario;
}
