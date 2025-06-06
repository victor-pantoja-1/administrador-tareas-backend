import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnTaskId1723744597196 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('request_tasks'); 
        const columnExists = table.columns.some(column => column.name === 'taskId');

        if (!columnExists) {
            await queryRunner.query(`ALTER TABLE request_tasks ADD COLUMN taskId CHAR(36)`);
        }

        await queryRunner.query(`
            UPDATE request_tasks rt
            SET taskId = (
                SELECT t.id 
                FROM tasks t
                WHERE 
                    t.title = rt.title
                    AND t.description = rt.description
                    AND t.clientId = rt.clientId
                    AND rt.status = 'APPROVED'
                LIMIT 1
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE request_tasks DROP COLUMN taskId`);
    }

}
