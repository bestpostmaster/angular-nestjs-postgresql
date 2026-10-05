import { MigrationInterface, QueryRunner } from 'typeorm';

// Utilisateur de test (développement uniquement) : user@test.com / abcd1234
// Le mot de passe est haché en bcrypt via pgcrypto (compatible avec la lib bcrypt).
export class SeedTestUser1791190100000 implements MigrationInterface {
  name = 'SeedTestUser1791190100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await queryRunner.query(
      `INSERT INTO "users" ("email", "passwordHash")
       VALUES ('user@test.com', crypt('abcd1234', gen_salt('bf', 10)))
       ON CONFLICT ("email") DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "users" WHERE "email" = 'user@test.com'`,
    );
  }
}
