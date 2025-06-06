import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddNotificationsTokensColumn1724794511729 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('users'); 
        const columnExists = table.columns.some(column => column.name === 'notificationsTokens');

        if (columnExists) {
            console.log('Column notificationsTokens already exists.');
            return;
        }

        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'notificationsTokens',
                type: 'text',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('users', 'notificationsTokens');
    }

}