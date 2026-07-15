import type { MigrationInterface, QueryRunner } from 'typeorm';

export class LoteUbicacionInicial1781471441900 implements MigrationInterface {
  name = 'LoteUbicacionInicial1781471441900';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "lotes"
      ADD COLUMN "ubicacionInicialId" uuid
    `);

    await queryRunner.query(`
      UPDATE "lotes"
      SET "ubicacionInicialId" = "ubicacionId"
      WHERE "ubicacionId" IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "lotes"
      ADD CONSTRAINT "FK_lotes_ubicacion_inicial"
      FOREIGN KEY ("ubicacionInicialId") REFERENCES "ubicaciones"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "lotes" DROP CONSTRAINT "FK_lotes_ubicacion_inicial"
    `);
    await queryRunner.query(`
      ALTER TABLE "lotes" DROP COLUMN "ubicacionInicialId"
    `);
  }
}
