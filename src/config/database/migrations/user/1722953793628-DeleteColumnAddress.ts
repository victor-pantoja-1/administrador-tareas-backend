import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class DeleteColumnAddress1722953793628 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('users'); 
        const columnExists = table.columns.some(column => column.name === 'address');
        if (!columnExists) {
            console.log('Column address not exists.');
            return;
        }
        await queryRunner.dropColumn('users', 'address');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('users', new TableColumn({
            name: 'address',
            type: 'varchar',
            isNullable: true,
            length: '100',
        }));
    }

}
