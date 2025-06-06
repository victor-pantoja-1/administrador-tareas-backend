import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddColumnsTargetUserAndTargetType1724751885864 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('ratings'); 
        const columnExists = table.columns.some(column => column.name === 'targetUser');
        if (columnExists) {
            console.log('Column targetUser already exists.');
            return;
        }

        await queryRunner.addColumn('ratings',
            new TableColumn({
                name: 'targetUser',
                type: 'varchar',
                isNullable: false,
                length: '36'
            }),
        );

        const otherColumnExists = table.columns.some(column => column.name === 'targetType');
        if (otherColumnExists) {
            console.log('Column targetType already exists.');
            return;
        }

        await queryRunner.addColumn('ratings',
            new TableColumn({
                name: 'targetType',
                type: 'varchar',
                isNullable: false,
                length: '125'
            }),
        );

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('ratings', 'targetUser');
        await queryRunner.dropColumn('ratings', 'targetType');
    }

}
