import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 } from 'uuid';

export class AddPermissionToConversations1723137002963
	implements MigrationInterface
{
	permissions = [
		{
			target: 'conversations.create',
			resource: 'conversations',
		},
		{
			target: 'conversations.getById',
			resource: 'conversations',
		},
        {
			target: 'conversations.getAll',
			resource: 'conversations',
		},
		{
			target: 'conversations.getAllPaginated',
			resource: 'conversations',
		},
		{
			target: 'conversations.update',
			resource: 'conversations',
		},
		{
			target: 'conversations.delete',
			resource: 'conversations',
		},
	];

	roles = [
		{
			name: 'admin',
			description: 'Administrator role',
			permissions: [
				'conversations.create',
				'conversations.getById',
				'conversations.getAll',
				'conversations.getAllPaginated',
				'conversations.update',
				'conversations.delete'				
			],
		},
		{
			name: 'client',
			description: 'Client role',
			permissions: [
				'conversations.getById',
				'conversations.getAll',
				'conversations.getAllPaginated',
			],
		},
		{
			name: 'supervisor',
			description: 'Supervisor role',
			permissions: [
				'conversations.create',
				'conversations.getById',
				'conversations.getAll',
				'conversations.getAllPaginated',
				'conversations.update',
				'conversations.delete'	
			],
		},
		{
			name: 'technician',
			description: 'Technician role',
			permissions: [
				'conversations.getById',
				'conversations.getAll',
				'conversations.getAllPaginated',
			],
		},
		{
			name: 'superAdmin',
			description: 'Super Administrator role',
			permissions: [
				'conversations.create',
				'conversations.getById',
				'conversations.getAll',
				'conversations.getAllPaginated',
				'conversations.update',
				'conversations.delete'	
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
