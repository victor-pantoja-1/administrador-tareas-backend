import { MigrationInterface, QueryRunner } from "typeorm";
import { v4 } from 'uuid';
export class AddColumnConversationToOldTasks1723629125021 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const tasksWithoutConversation = await queryRunner.query(`
            SELECT t.id, t.clientId
            FROM tasks t
            LEFT JOIN conversations c ON t.id = c.taskId
            WHERE c.id IS NULL
        `);

        const usersWithSpecialRoles = await queryRunner.query(`
            SELECT u.id
            FROM users u
            JOIN roles r ON u.roleId = r.id
            WHERE r.name IN ('admin', 'superAdmin', 'supervisor')
        `);

        for await (const task of tasksWithoutConversation) {
            const technicians = await queryRunner.query(`
                SELECT usersId
                FROM task_technicians
                WHERE tasksId = '${task.id}'
            `);

            const UUID = v4();
            await queryRunner.query(`                
                INSERT INTO conversations (id, taskId)
                VALUES ('${UUID}', '${task.id}')`);

            await queryRunner.query(`
                INSERT INTO users_conversations (conversationsId, usersId)
                VALUES ('${UUID}', '${task.clientId}')`);
            
            for await ( const user of usersWithSpecialRoles) {
                await queryRunner.query(`
                    INSERT INTO users_conversations (conversationsId, usersId)
                    VALUES ('${UUID}', '${user.id}')`);
            }

            for await ( const technician of technicians) {
                if (usersWithSpecialRoles.includes(technician.usersId) || usersWithSpecialRoles.includes(task.clientId)) {
                    continue;
                }
                await queryRunner.query(`
                    INSERT INTO users_conversations (conversationsId, usersId)
                    VALUES ('${UUID}', '${technician.usersId}')`);
            }
            
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('No se deben borrarlas las conversaciones creadas anteriormente');
    }
}
