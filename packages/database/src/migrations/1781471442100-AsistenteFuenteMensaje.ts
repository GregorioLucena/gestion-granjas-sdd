import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AsistenteFuenteMensaje1781471442100 implements MigrationInterface {
  name = 'AsistenteFuenteMensaje1781471442100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."recomendaciones_fuenteMensaje_enum" AS ENUM('PLANTILLA', 'OLLAMA', 'OPENAI')`,
    );
    await queryRunner.query(
      `ALTER TABLE "recomendaciones" ADD "fuenteMensaje" "public"."recomendaciones_fuenteMensaje_enum" NOT NULL DEFAULT 'PLANTILLA'`,
    );
    await queryRunner.query(
      `ALTER TABLE "recomendaciones" ADD "modeloMensaje" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "recomendaciones" DROP COLUMN "modeloMensaje"`);
    await queryRunner.query(`ALTER TABLE "recomendaciones" DROP COLUMN "fuenteMensaje"`);
    await queryRunner.query(`DROP TYPE "public"."recomendaciones_fuenteMensaje_enum"`);
  }
}
