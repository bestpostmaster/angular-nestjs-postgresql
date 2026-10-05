import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPassword1791190000000 implements MigrationInterface {
  name = 'AddUserPassword1791190000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "passwordHash" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordHash"`);
  }
}
