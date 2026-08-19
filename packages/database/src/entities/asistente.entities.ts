import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  CicloRecomendacion,
  DecisionFeedback,
  EstadoRecomendacion,
  FuenteMensaje,
  SeveridadRecomendacion,
  TipoRecomendacion,
} from '../enums';
import { Compania, Granja } from './organizacion.entities';

/** Hipotesis de causa asociada a una recomendacion, ordenada por score descendente. */
export type HipotesisRecomendacion = {
  codigo: string;
  etiqueta: string;
  score: number;
  motivo: string;
};

@Entity('recomendaciones')
@Index(['companiaId', 'granjaId', 'estado'])
export class Recomendacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companiaId!: string;

  @Column('uuid')
  granjaId!: string;

  @Column('uuid', { nullable: true })
  loteId?: string;

  @Column('uuid', { nullable: true })
  almacenId?: string;

  @Column({ type: 'enum', enum: TipoRecomendacion })
  tipo!: TipoRecomendacion;

  @Column({ type: 'enum', enum: CicloRecomendacion })
  ciclo!: CicloRecomendacion;

  @Column({ type: 'enum', enum: SeveridadRecomendacion })
  severidad!: SeveridadRecomendacion;

  @Column({
    type: 'enum',
    enum: EstadoRecomendacion,
    default: EstadoRecomendacion.PENDIENTE,
  })
  estado!: EstadoRecomendacion;

  @Column()
  titulo!: string;

  @Column({ type: 'text' })
  mensaje!: string;

  @Column({
    type: 'enum',
    enum: FuenteMensaje,
    default: FuenteMensaje.PLANTILLA,
  })
  fuenteMensaje!: FuenteMensaje;

  /** Nombre del modelo si el mensaje salio de un LLM; nulo en plantilla. */
  @Column({ nullable: true })
  modeloMensaje?: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  hipotesis!: HipotesisRecomendacion[];

  @Column({ type: 'text' })
  accionSugerida!: string;

  @Column({ type: 'jsonb', nullable: true })
  evidencia?: Record<string, unknown>;

  @Column('uuid', { nullable: true })
  consumoId?: string;

  @Column('uuid', { nullable: true })
  engordeId?: string;

  @Column('int', { default: 0 })
  prioridad!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /** Nulo cuando la genera el sistema (ciclo automatico). */
  @Column({ nullable: true })
  createdById?: string;

  @ManyToOne(() => Compania)
  @JoinColumn({ name: 'companiaId' })
  compania!: Compania;

  @ManyToOne(() => Granja)
  @JoinColumn({ name: 'granjaId' })
  granja!: Granja;
}

@Entity('feedback_recomendaciones')
@Index(['recomendacionId'])
export class FeedbackRecomendacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  recomendacionId!: string;

  @Column({ type: 'enum', enum: DecisionFeedback })
  decision!: DecisionFeedback;

  @Column({ nullable: true })
  motivo?: string;

  @Column('uuid')
  usuarioId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Recomendacion)
  @JoinColumn({ name: 'recomendacionId' })
  recomendacion!: Recomendacion;
}
