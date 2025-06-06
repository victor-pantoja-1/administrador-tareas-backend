import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBeforeChangesColumn1724695365441 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('audit_logs'); 
        const columnExists = table.columns.some(column => column.name === 'beforeChanges');

        if (!columnExists) {
            await queryRunner.query(`ALTER TABLE audit_logs ADD COLUMN beforeChanges JSON`);
        }

        await queryRunner.query(`
            UPDATE audit_logs
            SET beforeChanges = '{}'
            WHERE beforeChanges IS NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE audit_logs DROP COLUMN beforeChanges`);
    }

}
