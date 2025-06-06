import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddColumnTimeEstimation1721762456036 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('tasks'); 
        const columnExists = table.columns.some(column => column.name === 'timeEstimation');
        if (columnExists) {
            console.log('Column timeEstimation already exists.');
            return;
        }
        await queryRunner.addColumn('tasks', 
            new TableColumn({
                name: 'timeEstimation',
                type: 'numeric',
                isNullable: false,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('tasks', 'timeEstimation');
    }
}
