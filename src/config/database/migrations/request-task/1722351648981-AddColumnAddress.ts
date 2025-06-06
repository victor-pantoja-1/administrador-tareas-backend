import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddColumnAddressRequestsTasks1722350689520 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('request_tasks'); 
        const columnExists = table.columns.some(column => column.name === 'address');
        if (columnExists) {
            console.log('Column address already exists.');
            return;
        }

        await queryRunner.addColumn('request_tasks', 
            new TableColumn({
                name: 'address',
                type: 'varchar',
                isNullable: false,
                length: '125'
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('request_tasks', 'address');
    }
}
