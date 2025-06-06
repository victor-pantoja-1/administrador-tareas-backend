import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddColumnReasonOfCancelation1721384261655 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('request_tasks'); 
        const columnExists = table.columns.some(column => column.name === 'reasonOfCancelation');
        if (columnExists) {
            console.log('Column reasonOfCancelation already exists.');
            return;
        }

        await queryRunner.addColumn('request_tasks', 
            new TableColumn({
                name: 'reasonOfCancelation',
                type: 'varchar',
                isNullable: false,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('request_task', 'reason_of_cancelation');
    }
}
