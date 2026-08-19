import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AsistenteRecomendaciones1781471442000 implements MigrationInterface {
  name = 'AsistenteRecomendaciones1781471442000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."recomendaciones_tipo_enum" AS ENUM('CONSUMO_DESVIO', 'STOCK_REPOSICION', 'EVALUACION_CIERRE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recomendaciones_ciclo_enum" AS ENUM('OPERATIVO', 'TACTICO', 'ESTRATEGICO')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recomendaciones_severidad_enum" AS ENUM('INFO', 'ADVERTENCIA', 'CRITICA')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recomendaciones_estado_enum" AS ENUM('PENDIENTE', 'EN_COLA', 'ACEPTADA', 'DESCARTADA', 'ACEPTADA_EN_EVALUACION', 'CERRADA', 'SUPERSEDED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."feedback_recomendaciones_decision_enum" AS ENUM('ACEPTADA', 'DESCARTADA')`,
    );

    await queryRunner.query(`
      CREATE TABLE "recomendaciones" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "companiaId" uuid NOT NULL,
        "granjaId" uuid NOT NULL,
        "loteId" uuid,
        "almacenId" uuid,
        "tipo" "public"."recomendaciones_tipo_enum" NOT NULL,
        "ciclo" "public"."recomendaciones_ciclo_enum" NOT NULL,
        "severidad" "public"."recomendaciones_severidad_enum" NOT NULL,
        "estado" "public"."recomendaciones_estado_enum" NOT NULL DEFAULT 'PENDIENTE',
        "titulo" character varying NOT NULL,
        "mensaje" text NOT NULL,
        "hipotesis" jsonb NOT NULL DEFAULT '[]',
        "accionSugerida" text NOT NULL,
        "evidencia" jsonb,
        "consumoId" uuid,
        "engordeId" uuid,
        "prioridad" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdById" character varying,
        CONSTRAINT "PK_recomendaciones" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_recomendaciones_tenant_estado" ON "recomendaciones" ("companiaId", "granjaId", "estado")`,
    );
    await queryRunner.query(`
      ALTER TABLE "recomendaciones"
      ADD CONSTRAINT "FK_recomendaciones_compania"
      FOREIGN KEY ("companiaId") REFERENCES "companias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "recomendaciones"
      ADD CONSTRAINT "FK_recomendaciones_granja"
      FOREIGN KEY ("granjaId") REFERENCES "granjas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "feedback_recomendaciones" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "recomendacionId" uuid NOT NULL,
        "decision" "public"."feedback_recomendaciones_decision_enum" NOT NULL,
        "motivo" character varying,
        "usuarioId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback_recomendaciones" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_feedback_recomendaciones_recomendacion" ON "feedback_recomendaciones" ("recomendacionId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "feedback_recomendaciones"
      ADD CONSTRAINT "FK_feedback_recomendaciones_recomendacion"
      FOREIGN KEY ("recomendacionId") REFERENCES "recomendaciones"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "feedback_recomendaciones" DROP CONSTRAINT "FK_feedback_recomendaciones_recomendacion"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_feedback_recomendaciones_recomendacion"`);
    await queryRunner.query(`DROP TABLE "feedback_recomendaciones"`);

    await queryRunner.query(
      `ALTER TABLE "recomendaciones" DROP CONSTRAINT "FK_recomendaciones_granja"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recomendaciones" DROP CONSTRAINT "FK_recomendaciones_compania"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_recomendaciones_tenant_estado"`);
    await queryRunner.query(`DROP TABLE "recomendaciones"`);

    await queryRunner.query(`DROP TYPE "public"."feedback_recomendaciones_decision_enum"`);
    await queryRunner.query(`DROP TYPE "public"."recomendaciones_estado_enum"`);
    await queryRunner.query(`DROP TYPE "public"."recomendaciones_severidad_enum"`);
    await queryRunner.query(`DROP TYPE "public"."recomendaciones_ciclo_enum"`);
    await queryRunner.query(`DROP TYPE "public"."recomendaciones_tipo_enum"`);
  }
}
