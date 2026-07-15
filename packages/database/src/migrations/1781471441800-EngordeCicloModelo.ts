import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Alinea el modelo de engorde/pesos con ADR 0009 y specs 012/013.
 * No edita la migracion inicial; datos productivos de engorde/pesos se asumen
 * inexistentes o descartables en entornos de desarrollo previos al modulo.
 */
export class EngordeCicloModelo1781471441800 implements MigrationInterface {
  name = 'EngordeCicloModelo1781471441800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "finalidades_productivas"
      ADD COLUMN IF NOT EXISTS "codigoSistema" character varying(50)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_finalidades_compania_codigo_sistema"
      ON "finalidades_productivas" ("companiaId", "codigoSistema")
      WHERE "codigoSistema" IS NOT NULL
    `);
    await queryRunner.query(`
      UPDATE "finalidades_productivas"
      SET "codigoSistema" = 'ENGORDE'
      WHERE lower("nombre") = 'engorde' AND "codigoSistema" IS NULL
    `);
    await queryRunner.query(`
      UPDATE "finalidades_productivas"
      SET "codigoSistema" = 'REPRODUCCION'
      WHERE lower("nombre") = 'reproduccion' AND "codigoSistema" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "motivos_baja_engorde"
      ADD COLUMN IF NOT EXISTS "cuentaComoMortalidad" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cierres_engorde" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "companiaId" uuid NOT NULL,
        "granjaId" uuid NOT NULL,
        "engordeId" uuid NOT NULL,
        "loteId" uuid NOT NULL,
        "fechaCierre" date NOT NULL,
        "cantidadFinal" integer NOT NULL,
        "motivoCierreId" uuid NOT NULL,
        "observaciones" character varying,
        "anulado" boolean NOT NULL DEFAULT false,
        "anuladoAt" TIMESTAMPTZ,
        "anuladoById" character varying,
        "motivoAnulacion" character varying,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "createdById" character varying NOT NULL,
        CONSTRAINT "PK_cierres_engorde" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cierres_engorde_compania" FOREIGN KEY ("companiaId") REFERENCES "companias"("id"),
        CONSTRAINT "FK_cierres_engorde_granja" FOREIGN KEY ("granjaId") REFERENCES "granjas"("id"),
        CONSTRAINT "FK_cierres_engorde_engorde" FOREIGN KEY ("engordeId") REFERENCES "engordes_lote"("id"),
        CONSTRAINT "FK_cierres_engorde_lote" FOREIGN KEY ("loteId") REFERENCES "lotes"("id"),
        CONSTRAINT "FK_cierres_engorde_motivo" FOREIGN KEY ("motivoCierreId") REFERENCES "motivos_cierre_engorde"("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_cierres_engorde_vigente"
      ON "cierres_engorde" ("engordeId")
      WHERE "anulado" = false
    `);

    await queryRunner.query(`
      ALTER TABLE "engordes_lote"
      ADD COLUMN IF NOT EXISTS "objetivoPesoKg" numeric(10,3)
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'engordes_lote'
            AND column_name = 'objetivoPeso'
        ) THEN
          UPDATE "engordes_lote"
          SET "objetivoPesoKg" = "objetivoPeso"
          WHERE "objetivoPeso" IS NOT NULL AND "objetivoPesoKg" IS NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "engordes_lote"
      DROP COLUMN IF EXISTS "pesoInicialPromedio",
      DROP COLUMN IF EXISTS "objetivoPeso",
      DROP COLUMN IF EXISTS "fechaCierre",
      DROP COLUMN IF EXISTS "cantidadFinal",
      DROP COLUMN IF EXISTS "pesoFinalPromedio",
      DROP COLUMN IF EXISTS "motivoCierreId",
      DROP COLUMN IF EXISTS "anulado"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_engordes_lote_vigente"
      ON "engordes_lote" ("loteId")
      WHERE "estado" <> 'ANULADO'
    `);

    await queryRunner.query(`
      ALTER TABLE "bajas_engorde"
      ADD COLUMN IF NOT EXISTS "companiaId" uuid,
      ADD COLUMN IF NOT EXISTS "granjaId" uuid
    `);
    await queryRunner.query(`
      UPDATE "bajas_engorde" b
      SET "companiaId" = e."companiaId", "granjaId" = e."granjaId"
      FROM "engordes_lote" e
      WHERE b."engordeId" = e."id"
        AND (b."companiaId" IS NULL OR b."granjaId" IS NULL)
    `);
    await queryRunner.query(`
      DELETE FROM "bajas_engorde" WHERE "companiaId" IS NULL OR "granjaId" IS NULL OR "motivoId" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "bajas_engorde"
      ALTER COLUMN "companiaId" SET NOT NULL,
      ALTER COLUMN "granjaId" SET NOT NULL,
      ALTER COLUMN "motivoId" SET NOT NULL
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "bajas_engorde"
          ADD CONSTRAINT "FK_bajas_engorde_compania" FOREIGN KEY ("companiaId") REFERENCES "companias"("id");
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "bajas_engorde"
          ADD CONSTRAINT "FK_bajas_engorde_granja" FOREIGN KEY ("granjaId") REFERENCES "granjas"("id");
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "bajas_engorde"
          ADD CONSTRAINT "FK_bajas_engorde_lote" FOREIGN KEY ("loteId") REFERENCES "lotes"("id");
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."controles_peso_momento_enum" AS ENUM('INICIAL', 'INTERMEDIO', 'FINAL');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."controles_peso_modalidad_enum" AS ENUM('PROMEDIO_LOTE', 'MUESTRA');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."controles_peso_origen_enum" AS ENUM('ENGORDE_INICIO', 'MANUAL', 'ENGORDE_CIERRE');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`TRUNCATE TABLE "controles_peso"`);

    await queryRunner.query(`
      ALTER TABLE "controles_peso"
      DROP CONSTRAINT IF EXISTS "FK_14b053796f3fdab1d57218d1be4"
    `);
    await queryRunner.query(`
      ALTER TABLE "controles_peso"
      DROP COLUMN IF EXISTS "tipoControlId",
      DROP COLUMN IF EXISTS "peso"
    `);
    await queryRunner.query(`
      ALTER TABLE "controles_peso"
      ADD COLUMN IF NOT EXISTS "momento" "public"."controles_peso_momento_enum",
      ADD COLUMN IF NOT EXISTS "modalidad" "public"."controles_peso_modalidad_enum",
      ADD COLUMN IF NOT EXISTS "origen" "public"."controles_peso_origen_enum",
      ADD COLUMN IF NOT EXISTS "pesoPromedioKg" numeric(10,3),
      ADD COLUMN IF NOT EXISTS "cierreEngordeId" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "controles_peso"
      ALTER COLUMN "momento" SET NOT NULL,
      ALTER COLUMN "modalidad" SET NOT NULL,
      ALTER COLUMN "origen" SET NOT NULL,
      ALTER COLUMN "pesoPromedioKg" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "controles_peso"
      ALTER COLUMN "engordeId" SET NOT NULL,
      ALTER COLUMN "metodoPesajeId" SET NOT NULL
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "controles_peso"
          ADD CONSTRAINT "FK_controles_peso_cierre" FOREIGN KEY ("cierreEngordeId") REFERENCES "cierres_engorde"("id");
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "controles_peso" DROP CONSTRAINT IF EXISTS "FK_controles_peso_cierre"`);
    await queryRunner.query(`
      ALTER TABLE "controles_peso"
      DROP COLUMN IF EXISTS "momento",
      DROP COLUMN IF EXISTS "modalidad",
      DROP COLUMN IF EXISTS "origen",
      DROP COLUMN IF EXISTS "pesoPromedioKg",
      DROP COLUMN IF EXISTS "cierreEngordeId"
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."controles_peso_origen_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."controles_peso_modalidad_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."controles_peso_momento_enum"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_engordes_lote_vigente"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_cierres_engorde_vigente"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cierres_engorde"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_finalidades_compania_codigo_sistema"`);
    await queryRunner.query(`ALTER TABLE "finalidades_productivas" DROP COLUMN IF EXISTS "codigoSistema"`);
    await queryRunner.query(`ALTER TABLE "motivos_baja_engorde" DROP COLUMN IF EXISTS "cuentaComoMortalidad"`);
  }
}
