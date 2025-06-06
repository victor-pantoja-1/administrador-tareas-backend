import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PermissionEntity } from './entities/permission.entity';
import { Repository } from 'typeorm';
import { ResponseFormatter } from 'src/common/helpers/response-formatter.service';
import {
	HttpMessages
} from 'src/common/enums/http-messages.enum';

@Injectable()
export class PermissionService extends ResponseFormatter {
	constructor(
		@InjectRepository(PermissionEntity)
		private permissionRepository: Repository<PermissionEntity>,
	) {
		super();
	}

	async create(createPermissionDto: CreatePermissionDto) {
		try {
			const existingPermission = await this.permissionRepository.findOne({
				where: {
					target: createPermissionDto.target,
					resource: createPermissionDto.resource,
				},
			});
			if (existingPermission) {
				throw new HttpException(
					HttpMessages.PERMISSION_ALREADY_EXISTS,
					HttpStatus.CONFLICT,
				);
			}

			const permission =
				await this.permissionRepository.save(createPermissionDto);

			return this.standartResponse(
				permission,
				HttpStatus.CREATED,
				HttpMessages.PERMISSION_CREATED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findAll() {
		try {
			const permissions = await this.permissionRepository
				.find({
					select: ['id', 'target', 'resource'],
				})
				.then((permissions) => {
					const grouped = permissions.reduce((acc, permission) => {
						if (!acc[permission.resource]) {
							acc[permission.resource] = [];
						}
						acc[permission.resource].push(permission);
						return acc;
					}, {});
					return grouped;
				});
			if (!permissions) {
				throw new HttpException(
					HttpMessages.PERMISSION_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}
			return this.standartResponse(permissions);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findOne(id: string) {
		return await this.permissionRepository.findOne({
			where: { id },
		});
	}

	async remove(id: string) {
		try {
			const permission = await this.permissionRepository.findOne({
				where: { id },
			});
			if (!permission) {
				throw new HttpException(
					HttpMessages.PERMISSION_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}
			this.permissionRepository.remove(permission);
			return this.standartResponse(true);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async validatePermissions(
		permissionsIds: string[],
	): Promise<PermissionEntity[]> {
		if (permissionsIds === undefined || permissionsIds.length === 0) return [];
		try {
			const permissions = await this.permissionRepository
				.createQueryBuilder('permissions')
				.where('permissions.id IN (:...permissionsIds)', { permissionsIds })
				.getMany();

			if (!permissions || permissions.length === 0) {
				throw new HttpException(
					HttpMessages.USER_NOT_AUTHORIZED,
					HttpStatus.FORBIDDEN,
				);
			}
			return permissions;
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
