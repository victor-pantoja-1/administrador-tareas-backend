import { MigrationInterface, QueryRunner } from "typeorm";
import { v4 } from 'uuid';

export class AddPermissionToMessages1723046400738 implements MigrationInterface {
    permissions = [		
        {
            target: 'messages.getAll',
            resource: 'messages',
        },
        {
            target: 'messages.getById',
            resource: 'messages',
        },
        {
            target: 'messages.getAllPaginated',
            resource: 'messages',
        },		
        {
            target: 'messages.updateStatus',
            resource: 'messages',
        },
        {
            target: 'messages.delete',
            resource: 'messages',
        },		
    ];

    roles = [
        {
            name: 'admin',
            description: 'Administrator role',
            permissions: [				
                'messages.getAll',
                'messages.getAllPaginated',
                'messages.getById',
                'messages.delete',
                'messages.updateStatus',
            ],
        },
        {
            name: 'client',
            description: 'Client role',
            permissions: ['messages.getAll', 'messages.getAllPaginated', 'messages.getById'],
        },
        {
            name: 'supervisor',
            description: 'Supervisor role',
            permissions: [
                'messages.getAll',
                'messages.getAllPaginated',
                'messages.getById',
                'messages.delete',
                'messages.updateStatus'],
        },
        {
            name: 'technician',
            description: 'Technician role',
            permissions: ['messages.getAll', 'messages.getAllPaginated', 'messages.getById'],
        },
        {
            name: 'superAdmin',
            description: 'Super Administrator role',
            permissions: [
                'messages.getAll',
                'messages.getAllPaginated',
                'messages.getById',
                'messages.delete',
                'messages.updateStatus'
            ],
        },
    ];

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.startTransaction();
        try {
            for (const permission of this.permissions) {
                const UUID = v4();
                await queryRunner.query(
                    `INSERT INTO permissions (id, target, resource, createdAt, updatedAt) VALUES ('${UUID}', '${permission.target}','${permission.resource}', NOW(), NOW())`,
                );
            }

            for (const role of this.roles) {
                let roleResult = await queryRunner.query(
                    `SELECT id FROM roles WHERE name = '${role.name}' LIMIT 1`,
                );
                let roleId = roleResult.length > 0 ? roleResult[0].id : null;

                if (roleId === null) {
                    const UUID = v4();
                    await queryRunner.query(
                        `INSERT INTO roles (id, name, description, createdAt, updatedAt) VALUES ('${UUID}', '${role.name}', '${role.description}', NOW(), NOW())`,
                    );

                    roleResult = await queryRunner.query(
                        `SELECT id FROM roles WHERE name = '${role.name}' LIMIT 1`,
                    );
                    roleId = roleResult[0].id;
                }

                for (const permission of role.permissions) {
                    const permissionResult = await queryRunner.query(
                        `SELECT id FROM permissions WHERE target = '${permission}'`,
                    );
                    const permissionId = permissionResult[0].id;
                    await queryRunner.query(
                        `INSERT INTO roles_permissions (rolesId, permissionsId) VALUES ('${roleId}', '${permissionId}')`,
                    );
                }
            }

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.startTransaction();
        try {
            for (const role of this.roles) {
                const roleResult = await queryRunner.query(
                    `SELECT id FROM roles WHERE name = '${role.name}'`,
                );
                if (roleResult.length > 0) {
                    const roleId = roleResult[0].id;
                    for (const permission of role.permissions) {
                        const permissionResult = await queryRunner.query(
                            `SELECT id FROM permissions WHERE target = '${permission}'`,
                        );
                        const permissionId = permissionResult[0].id;
                        await queryRunner.query(
                            `DELETE FROM roles_permissions WHERE rolesId = '${roleId}' AND permissionsId = '${permissionId}'`,
                        );
                    }
                }
            }

            for (const permission of this.permissions) {
                await queryRunner.query(
                    `DELETE FROM permissions WHERE target = '${permission.target}'`,
                );
            }

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
    }
}
