import { MigrationInterface, QueryRunner } from "typeorm";
import { v4 as v4 } from 'uuid';

export class AddGetPublicOrPrivateInfoPermissionForUsers1723074260981 implements MigrationInterface {
    permissions = [
        {
            target: 'users.getPublicOrPrivateInfo',
            resource: 'users',
        },
    ];

    roles = [
        {
            name: 'superAdmin',
            description: 'Super Administrator role',
            permissions: [
                'users.getPublicOrPrivateInfo',
            ],
        },
        {
            name: 'admin',
            description: 'Administrator role',
            permissions: [
                'users.getPublicOrPrivateInfo',
            ],
        },
        {
            name: 'supervisor',
            description: 'Supervisor role',
            permissions: [
                'users.getPublicOrPrivateInfo'
            ],
        },
        {
            name: 'technician',
            description: 'Technician role',
            permissions: [
                'users.getPublicOrPrivateInfo'
            ],
        },
        {
            name: 'client',
            description: 'client role',
            permissions: [
                'users.getPublicOrPrivateInfo'
            ],
        },
    ]

    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            await queryRunner.startTransaction();
            for await (const permission of this.permissions) {
                const UUID = v4();
                await queryRunner.query(
                    `INSERT INTO permissions (id, target, resource, createdAt, updatedAt) VALUES ('${UUID}', '${permission.target}','${permission.resource}', NOW(), NOW())`,
                );
            }

            for await (const role of this.roles) {
                const roleFromDB = await queryRunner.query(
                    `SELECT id FROM roles WHERE name = '${role.name}'`,
                );

                const roleId = roleFromDB[0].id;
                for await (const permission of role.permissions) {
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
        for await (const permission of this.permissions) {
            await queryRunner.query(
                `DELETE FROM permissions WHERE target = '${permission.target}'`,
            );
        }
    }
}