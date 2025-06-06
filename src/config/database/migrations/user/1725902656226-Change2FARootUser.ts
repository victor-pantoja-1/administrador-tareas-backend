import { MigrationInterface, QueryRunner } from "typeorm";

export class Change2FARootUser1725902656226 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const email = 'admin@taskmanager.com';
        await queryRunner.query(`
            UPDATE users
            SET enable2FA = false
            WHERE email = '${email}' AND enable2FA = true
          `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}

}
