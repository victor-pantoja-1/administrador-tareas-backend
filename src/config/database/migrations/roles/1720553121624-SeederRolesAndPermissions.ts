import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as v4 } from 'uuid';

export class SeederRolesAndPermissions1720553121624
	implements MigrationInterface
{
	permissions = [
		{
			target: 'app.web',
			resource: 'app',
		},
		{
			target: 'app.mobile',
			resource: 'app',
		},
		{
			target: 'users.create',
			resource: 'users',
		},
		{
			target: 'users.update',
			resource: 'users',
		},
		{
			target: 'users.getAll',
			resource: 'users',
		},
		{
			target: 'users.getById',
			resource: 'users',
		},
		{
			target: 'users.delete',
			resource: 'users',
		},
		{
			target: 'users.getByRole',
			resource: 'users',
		},
		{
			target: 'users.updateStatus',
			resource: 'users',
		},
		{
			target: 'roles.setupInfo',
			resource: 'roles',
		},
		{
			target: 'roles.create',
			resource: 'roles',
		},
		{
			target: 'roles.update',
			resource: 'roles',
		},
		{
			target: 'roles.getAll',
			resource: 'roles',
		},
		{
			target: 'roles.getById',
			resource: 'roles',
		},
		{
			target: 'roles.delete',
			resource: 'roles',
		},
		{
			target: 'permissions.setupInfo',
			resource: 'permissions',
		},
		{
			target: 'permissions.create',
			resource: 'permissions',
		},
		{
			target: 'permissions.update',
			resource: 'permissions',
		},
		{
			target: 'permissions.getAll',
			resource: 'permissions',
		},
		{
			target: 'permissions.getById',
			resource: 'permissions',
		},
		{
			target: 'permissions.delete',
			resource: 'permissions',
		},
		{
			target: 'tasks.create',
			resource: 'tasks',
		},
		{
			target: 'tasks.update',
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
		{
			target: 'tasks.getById',
			resource: 'tasks',
		},
		{
			target: 'tasks.delete',
			resource: 'tasks',
		},
		{
			target: 'tasks.updateStatus',
			resource: 'tasks',
		},
		{
			target: 'tags.create',
			resource: 'tags',
		},
		{
			target: 'tags.getAll',
			resource: 'tags',
		},
		{
			target: 'feedbacks.create',
			resource: 'feedbacks',
		},
		{
			target: 'feedbacks.update',
			resource: 'feedbacks',
		},
		{
			target: 'feedbacks.delete',
			resource: 'feedbacks',
		},
		{
			target: 'ratings.client',
			resource: 'ratings',
		},
		{
			target: 'ratings.tehnician',
			resource: 'ratings',
		},
		{
			target: 'ratings.ratingOfTask',
			resource: 'ratings',
		},
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
		{
			target: 'request-task.updateStatus',
			resource: 'request-task',
		},
		{
			target: 'images.upload',
			resource: 'images',
		},
	];

	roles = [
		{
			name: 'admin',
			description: 'Administrator role',
			permissions: [
				'app.web', 
				'users.create',
				'users.update',
				'users.getAll',
				'users.getById',
				'users.delete',
				'users.getByRole',
				'users.updateStatus',
				'roles.setupInfo',
				'roles.create',
				'roles.update',
				'roles.getAll',
				'roles.getById',
				'roles.delete',
				'permissions.setupInfo',
				'permissions.create',
				'permissions.update',
				'permissions.getAll',
				'permissions.getById',
				'permissions.delete',
				'tasks.create',
				'tasks.update',
				'tasks.getAll',
				'tasks.getAllPaginated',
				'tasks.getById',
				'tasks.delete',
				'tasks.updateStatus',
				'tags.create',
				'tags.getAll',
				'feedbacks.create',
				'feedbacks.update',
				'feedbacks.delete',
				'ratings.client',
				'ratings.tehnician',
				'ratings.ratingOfTask',
				'request-task.create',
				'request-task.update',
				'request-task.getAll',
				'request-task.getById',
				'request-task.delete',
				'request-task.updateStatus',
				'images.upload',
			],
		},
		{
			name: 'client',
			description: 'Client role',
			permissions: ['app.mobile'],
		},
		{
			name: 'supervisor',
			description: 'Supervisor role',
			permissions: ['app.web'],
		},
		{
			name: 'technician',
			description: 'Technician role',
			permissions: ['app.mobile'],
		},
		{
			name: 'superAdmin',
			description: 'Super Administrator role',
			permissions: [
				'app.web', 
				'app.mobile',
				'users.create',
				'users.update',
				'users.getAll',
				'users.getById',
				'users.delete',
				'users.getByRole',
				'users.updateStatus',
				'roles.setupInfo',
				'roles.create',
				'roles.update',
				'roles.getAll',
				'roles.getById',
				'roles.delete',
				'permissions.setupInfo',
				'permissions.create',
				'permissions.update',
				'permissions.getAll',
				'permissions.getById',
				'permissions.delete',
				'tasks.create',
				'tasks.update',
				'tasks.getAll',
				'tasks.getAllPaginated',
				'tasks.getById',
				'tasks.delete',
				'tasks.updateStatus',
				'tags.create',
				'tags.getAll',
				'feedbacks.create',
				'feedbacks.update',
				'feedbacks.delete',
				'ratings.client',
				'ratings.tehnician',
				'ratings.ratingOfTask',
				'request-task.create',
				'request-task.update',
				'request-task.getAll',
				'request-task.getById',
				'request-task.delete',
				'request-task.updateStatus',
				'images.upload',
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
				const UUID = v4();
				await queryRunner.query(
					`INSERT INTO roles (id, name, description, createdAt, updatedAt) VALUES ('${UUID}', '${role.name}', '${role.description}', NOW(), NOW())`,
				); 
				
				for (const permission of role.permissions) {
					const permissionId = await queryRunner.query(
						`SELECT id FROM permissions WHERE target = '${permission}'`,
					);
					await queryRunner.query(
						`INSERT INTO roles_permissions (rolesId, permissionsId) VALUES ('${UUID}', '${permissionId[0].id}')`,
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
		for (const permission of this.permissions) {
			await queryRunner.query(
				`DELETE FROM permissions WHERE target = '${permission.target}'`,
			);
		}
		for (const role of this.roles) {
			await queryRunner.query(`DELETE FROM roles WHERE name = '${role.name}'`);
		}
	}
}
