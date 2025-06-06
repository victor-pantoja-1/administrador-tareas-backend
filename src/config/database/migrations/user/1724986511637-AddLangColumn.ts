import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddLangColumn1724986511637 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('users'); 
        const columnExists = table.columns.some(column => column.name === 'lang');

        if (columnExists) {
            console.log('Column lang already exists.');
            return;
        }

        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'lang',
                type: 'varchar',
                isNullable: true,
                length: '125',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('users', 'lang');
    }

}
