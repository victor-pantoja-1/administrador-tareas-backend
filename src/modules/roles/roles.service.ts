import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from './entities/role.entity';
import { Repository } from 'typeorm';
import { HttpMessages } from 'src/common/enums/http-messages.enum';
import { PermissionService } from '../permission/permission.service';
import { ResponseFormatter } from 'src/common/helpers/response-formatter.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class RolesService extends ResponseFormatter {
	constructor(
		@InjectRepository(RoleEntity)
		private roleRepository: Repository<RoleEntity>,
		private readonly permissionService: PermissionService,
	) {
		super();
	}

	async create(createRoleDto: CreateRoleDto) {
		try {
			const existingRole = await this.roleRepository.findOne({
				where: {
					name: createRoleDto.name,
				},
			});
			if (existingRole) {
				throw new HttpException(
					HttpMessages.ROLE_ALREADY_EXISTS,
					HttpStatus.CONFLICT,
				);
			}
			const permissions = await this.permissionService.validatePermissions(
				createRoleDto.permissions,
			);
			if (!permissions || permissions.length === 0) {
				throw new HttpException(
					HttpMessages.ROLE_MUST_HAVE_PERMISSIONS,
					HttpStatus.BAD_REQUEST,
				);
			}
			const role = this.roleRepository.create({
				...createRoleDto,
				permissions: permissions,
			});
			await this.roleRepository.save(role);
			return this.standartResponse(
				role,
				HttpStatus.CREATED,
				HttpMessages.ROLE_CREATED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findAll(paginationDto: PaginationDto) {
		try {
			const queryBuilder = this.roleRepository
				.createQueryBuilder('role')
				.leftJoinAndSelect('role.permissions', 'permission')
				.select([
					'role.id',
					'role.name',
					'role.description',
					'role.isActive',
					'permission.id',
					'permission.target',
					'permission.resource',
				]);

			if (paginationDto.search) {
				queryBuilder.andWhere(
					'(role.name LIKE :search OR role.description LIKE :search)',
					{
						search: `%${paginationDto.search}%`,
					},
				);
			}

			const roles = await this.paginate(queryBuilder, paginationDto);

			if (!roles) {
				throw new HttpException(
					HttpMessages.ROLE_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}

			return roles;
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findOne(id: string) {
		try {
			const role = await this.roleRepository.findOne({
				where: {
					id: id,
				},
			});
			if (!role) {
				throw new HttpException(
					HttpMessages.ROLE_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}
			return this.standartResponse(role);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async update(id: string, updateRoleDto: UpdateRoleDto) {
		try {
			const role = await this.roleRepository.findOne({
				where: {
					id: id,
				},
			});
			const permissions = await this.permissionService.validatePermissions(
				updateRoleDto.permissions,
			);
			if (!permissions || permissions.length === 0) {
				throw new HttpException(
					HttpMessages.ROLE_MUST_HAVE_PERMISSIONS,
					HttpStatus.BAD_REQUEST,
				);
			}
			role.permissions = permissions;
			if (updateRoleDto.name) {
				role.name = updateRoleDto.name;
			}
			if (updateRoleDto.description) {
				role.description = updateRoleDto.description;
			}

			return this.standartResponse(
				await this.roleRepository.save(role),
				HttpStatus.OK,
				HttpMessages.ROLE_UPDATED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async remove(id: string) {
		try {
			const role = await this.roleRepository.findOne({
				where: { id },
				relations: ['user'],
			});

			if (!role) {
				throw new HttpException(
					HttpMessages.ROLE_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}

			if (role.user && role.user.length > 0) {
				throw new HttpException(
					HttpMessages.ROLE_IN_USE,
					HttpStatus.BAD_REQUEST,
				);
			}

			const roleForDelete = await this.roleRepository.findBy({ id });
			await this.roleRepository.remove(roleForDelete);

			return this.standartResponse(
				true,
				HttpStatus.OK,
				HttpMessages.ROLE_DELETED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findRoleIdByName(name: string) {
		try {
			const role = await this.roleRepository.findOne({
				where: {
					name: name,
				},
			});
			if (!role) {
				throw new HttpException(
					HttpMessages.ROLE_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}
			return role.id;
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
