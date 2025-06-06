import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 } from 'uuid';

export class AddPermissionToViewRequestTasksClient1724947947270
	implements MigrationInterface
{
	permissions = [
		{
			target: 'request-task.create',
			resource: 'request-task',
		},
		{
			target: 'request-task.update',
			resource: 'request-task',
		},
		{
			target: 'request-task.getAll',
			resource: 'request-task',
		},
		{
			target: 'request-task.getById',
			resource: 'request-task',
		},
		{
			target: 'request-task.delete',
			resource: 'request-task',
		},
	];

	roles = [
		{
			name: 'client',
			description: 'Client role',
			permissions: [
				'request-task.create',
				'request-task.update',
				'request-task.getAll',
				'request-task.getById',
				'request-task.delete',
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
