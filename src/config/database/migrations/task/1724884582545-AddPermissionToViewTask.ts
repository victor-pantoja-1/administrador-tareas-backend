import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 } from 'uuid';

export class AddPermissionToViewTasks1724884582545
	implements MigrationInterface
{
	permissions = [
		{
			target: 'tasks.getById',
			resource: 'tasks',
		},
        {
			target: 'tasks.getAll',
			resource: 'tasks',
		},
		{
			target: 'tasks.getAllPaginated',
			resource: 'tasks',
		},
	];

	roles = [
		{
			name: 'technician',
			description: 'Technician role',
			permissions: [
				'tasks.getById',
				'tasks.getAll',
				'tasks.getAllPaginated',
			],
		},
	];

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.startTransaction();
		try {
			for (const permission of this.permissions) {
				const existPermission = await queryRunner.query(`SELECT id FROM permissions WHERE target = '${permission.target}' AND resource = '${permission.resource}'`);

				if (!existPermission) {
					const UUID = v4();
					await queryRunner.query(
						`INSERT INTO permissions (id, target, resource, createdAt, updatedAt) VALUES ('${UUID}', '${permission.target}','${permission.resource}', NOW(), NOW())`,
					);
				}
			}

			for (const role of this.roles) {
				const roleResult = await queryRunner.query(
					`SELECT id FROM roles WHERE name = '${role.name}'`,
				);
				const roleId = roleResult[0].id;

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

			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		}
	}
}
