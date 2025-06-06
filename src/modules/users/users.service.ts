import {
	Injectable,
	HttpException,
	HttpStatus,
	InternalServerErrorException,
	NotFoundException,
	ForbiddenException,
	BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateLangUserDto, UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { hashPassword } from '../../common/helpers/bcrypt';
import { ConfigService } from '@nestjs/config';
import { HttpMessages } from 'src/common/enums/http-messages.enum';
import { GENDERS } from 'src/common/enums/gender.enum';
import { SuperAdmin } from 'src/common/resources/super.admin';
import { ResponseFormatter } from 'src/common/helpers/response-formatter.service';
import { WelcomeTemplate } from 'src/common/templates/welcome.template';
import { ISendgridOptions } from 'src/common/interfaces/sendgrid/options.interface';
import { SendGridService } from 'src/common/helpers/sendgrid';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import {
	IBaseResponse,
	IPaginationResponse,
} from 'src/common/interfaces/common/base-response';
import { RolesService } from '../roles/roles.service';
import { SystemRolesEnum } from 'src/common/enums/roles.enum';
import { IJwtPayload } from 'src/common/interfaces/auth/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { RoleEntity } from '../roles/entities/role.entity';
import { UserPublicResponse } from 'src/common/interfaces/users/user-public-response.interface';
import { TechnicianAvailabilityDto } from './dto/technician-availability.dto';
import { TaskService } from '../task/task.service';
import { FindAllTasksDto } from '../task/dto/find-task.dto';
import { ITechniciansAbailableInterface } from 'src/common/interfaces/users/technicians-available.interface';
import { ConversationEntity } from '../conversation/entities/conversation.entity';
import { ConversationService } from '../conversation/conversation.service';

@Injectable()
export class UsersService extends ResponseFormatter {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly configService: ConfigService,
		private readonly sendGridService: SendGridService,
		private readonly rolesService: RolesService,
		private jwtService: JwtService,
		private readonly taskService: TaskService,
		@InjectRepository(ConversationEntity)
		private readonly conversationRepository: Repository<ConversationEntity>,
		private readonly conversationService: ConversationService,
		@InjectRepository(RoleEntity)
		private readonly roleRepository: Repository<RoleEntity>,
	) {
		super();
	}

	async seeds() {
		const superAdminRoleId = await this.rolesService.findRoleIdByName(
			SystemRolesEnum.SUPER_ADMIN,
		);
		const superAdmin: CreateUserDto = {
			name: SuperAdmin.name,
			lastName: SuperAdmin.lastName,
			email: SuperAdmin.email,
			isPrivate: true,
			role: superAdminRoleId,
			prefix: SuperAdmin.prefix,
			phoneNumber: SuperAdmin.phoneNumber,
			gender: {
				id: SuperAdmin.gender.id,
				name: SuperAdmin.gender.name,
			},
			isNew: false,
		};
		const criptoPassword = await hashPassword(
			SuperAdmin.password,
			Number(this.configService.get<string>('SALT_ROUNDS')),
		);

		const user = this.userRepository.create({
			...superAdmin,
			role: {
				id: superAdminRoleId,
			},
			password: criptoPassword,
		});
		const userCreated = await this.userRepository.save(user);
		await this.setRoleIsActive(superAdminRoleId);
		return userCreated;
	}

	async create(createUserDto: CreateUserDto) {
		try {
			const userExists = await this.userRepository.findBy({
				email: createUserDto.email,
			});
			if (userExists.length > 0) {
				throw new HttpException(
					HttpMessages.USER_ALREADY_EXISTS,
					HttpStatus.CONFLICT,
				);
			}
			const role = (await this.rolesService.findOne(createUserDto.role)).data;

			if (!role) {
				throw new BadRequestException(HttpMessages.ROLE_NOT_FOUND);
			}

			if (createUserDto.gender.id in GENDERS) {
				createUserDto.gender = {
					id: createUserDto.gender.id,
					name: GENDERS[createUserDto.gender.id],
				};
			} else {
				throw new BadRequestException(HttpMessages.INVALID_ROLE_OR_GENDER);
			}

			createUserDto.isNew = true;
			const randomPassword = await this.generateRandomPassword();

			const user = this.userRepository.create({
				...createUserDto,
				password: await hashPassword(
					randomPassword,
					Number(this.configService.get<string>('SALT_ROUNDS')),
				),
				role: role,
			});
			const userCreated = await this.userRepository.save(user);

			await this.setRoleIsActive(role.id);

			await this.sendWelcomeMail(userCreated, randomPassword);

			const rolesToAdd = ['admin', 'supervisor', 'superAdmin'];
			if (rolesToAdd.includes(role.name)) {
				const conversations = await this.conversationRepository.find();
				for (const conversation of conversations) {
					await this.conversationService.addUsers(conversation.id, [
						userCreated.id,
					]);
				}
			}
			return userCreated;
		} catch (error) {
			throw new HttpException(
				error.message || 'Error creating user',
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findAll(
		paginationDto: PaginationDto,
	): Promise<IPaginationResponse<UserEntity>> {
		try {
			const queryBuilder = this.userRepository
				.createQueryBuilder('users')
				.leftJoinAndSelect('users.role', 'role')
				.leftJoinAndSelect('role.permissions', 'permissions')
				.select([
					'users.id',
					'users.name',
					'users.lastName',
					'users.email',
					'users.active',
					'role.id',
					'role.name',
					'role.description',
					'role.isActive',
					'permissions.target',
				]);

			if (paginationDto.search !== undefined) {
				queryBuilder.andWhere(
					'users.name LIKE :search OR users.lastName LIKE :search  OR users.email LIKE :search',
					{
						search: `%${paginationDto.search}%`,
					},
				);
			}

			const users = await this.paginate(queryBuilder, paginationDto);

			if (!users) {
				throw new HttpException(
					HttpMessages.USERS_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}
			return users;
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findOne(id: string): Promise<UserEntity> {
		try {
			const user = await this.userRepository.findOne({
				where: { id },
				relations: ['role'],
			});
			if (!user) {
				throw new HttpException(
					HttpMessages.USER_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}
			return user;
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async getAllControlDashboardUsers(): Promise<UserEntity[]> {
		const specialRoles = ['admin', 'superAdmin', 'supervisor'];
		const usersWithSpecialRoles = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')
        .where('role.name IN (:...roles)', { roles: specialRoles })
        .getMany();

		return usersWithSpecialRoles;
	}

	async update(id: string, updateUserDto: UpdateUserDto) {
		try {
			const existUser = await this.findOne(id);
			let newRole;
			const oldRole = existUser.role;

			const user = new UserEntity();
			user.name = updateUserDto.name ? updateUserDto.name : existUser.name;
			user.lastName = updateUserDto.lastName
				? updateUserDto.lastName
				: existUser.lastName;
			user.isPrivate = updateUserDto.isPrivate
				? updateUserDto.isPrivate
				: existUser.isPrivate;
			user.email = updateUserDto.email ? updateUserDto.email : existUser.email;
			user.docNumber = updateUserDto.docNumber
				? updateUserDto.docNumber
				: existUser.docNumber;
			user.prefix = updateUserDto.prefix
				? updateUserDto.prefix
				: existUser.prefix;
			user.phoneNumber = updateUserDto.phoneNumber
				? updateUserDto.phoneNumber
				: existUser.phoneNumber;
			user.photo = updateUserDto.photo ? updateUserDto.photo : existUser.photo;

			if (
				updateUserDto.enable2FA === false &&
				existUser.enable2FA != updateUserDto.enable2FA
			) {
				user.enable2FA = updateUserDto.enable2FA;
			} else {
				user.enable2FA = true;
			}

			if (updateUserDto.code2FA && existUser.code2FA != updateUserDto.code2FA) {
				user.code2FA = updateUserDto.code2FA;
			}

			user.location = updateUserDto.location
				? updateUserDto.location
				: existUser.location;

			if (updateUserDto.active !== undefined) {
				user.active = updateUserDto.active;
			} else {
				user.active = existUser.active;
			}

			if (updateUserDto.role) {
				user.role = (
					await this.rolesService.findOne(updateUserDto.role.toString())
				).data;
				newRole = user.role;
			} else {
				user.role = existUser.role;
			}

			if (updateUserDto.gender && updateUserDto.gender.id in GENDERS) {
				user.gender = {
					id: updateUserDto.gender.id,
					name: GENDERS[updateUserDto.gender.id],
				};
			} else {
				user.gender = user.gender;
			}

			await this.userRepository.update(id, user);

			if (updateUserDto.role) {
				await this.setRoleIsActive(newRole.id);
				await this.checkRoleIsActve(oldRole.id);
				const specialsRoles = ['admin', 'superAdmin', 'supervisor'];
				if (
					specialsRoles.includes(newRole.name) &&
					!specialsRoles.includes(oldRole.name)
				) {
					const conversations = await this.conversationRepository.find();
					for (const conversation of conversations) {
						await this.conversationService.addUsers(conversation.id, [id]);
					}
				}
				if (
					!specialsRoles.includes(newRole.name) &&
					specialsRoles.includes(oldRole.name)
				) {
					const conversations = await this.conversationRepository.find();
					for (const conversation of conversations) {
						await this.conversationService.removeUsers(conversation.id, [id]);
					}
				}
			}

			return this.standartResponse<null>(
				null,
				HttpStatus.OK,
				HttpMessages.USER_UPDATED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpStatus.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async updateLangUser(userId: string, entry: UpdateLangUserDto) {
		const { lang } = entry;
		const updatedUser = await this.userRepository.update({ id: userId }, { lang })

		if (updatedUser && updatedUser.affected === 0) {
			throw new HttpException(
				HttpMessages.USER_NOT_FOUND,
				HttpStatus.NOT_FOUND,
			);
		}

		return { updated: !!updatedUser.affected };
	}

	async remove(id: string) {
		try {
			const user = await this.findOne(id);
			if (user.role.name === SystemRolesEnum.SUPER_ADMIN)
				throw new HttpException(
					HttpMessages.USER_NOT_AUTHORIZED,
					HttpStatus.UNAUTHORIZED,
				);
			return await this.userRepository.remove(user);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findByEmail(email: string): Promise<UserEntity> {
		try {
			const user = await this.userRepository.findOne({
				where: { email },
				relations: ['role'],
			});
			if (!user) {
				throw new HttpException(
					HttpMessages.USER_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}

			return user;
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findByEmailWithoutException(email: string): Promise<UserEntity> {
		try {
			return await this.userRepository.findOne({
				where: { email },
				relations: ['role'],
			});
		} catch (error) {
			throw new InternalServerErrorException(
				HttpMessages.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async updatePassword(user: UserEntity) {
		const userUpdated = await this.userRepository
			.createQueryBuilder()
			.update(UserEntity)
			.set({
				password: user.password,
				resetPasswordToken: null,
			})
			.where('id = :id', { id: user.id })
			.execute();

		if (userUpdated && userUpdated.affected === 0) {
			throw new HttpException(
				HttpMessages.USER_NOT_FOUND,
				HttpStatus.NOT_FOUND,
			);
		}

		return userUpdated;
	}

	async updateIsNew(user: UserEntity) {
		const userUpdated = await this.userRepository
			.createQueryBuilder()
			.update(UserEntity)
			.set({
				isNew: user.isNew,
			})
			.where('id = :id', { id: user.id })
			.execute();

		if (userUpdated && userUpdated.affected === 0) {
			throw new HttpException(
				HttpMessages.USER_NOT_FOUND,
				HttpStatus.NOT_FOUND,
			);
		}

		return userUpdated;
	}

	async findUsersWithRole(
		roleName: string,
		paginationDto: PaginationDto,
		usePagination = true,
		showTokens = false,
	): Promise<IPaginationResponse<UserEntity> | UserEntity[]> {
		try {
			const queryBuilder = this.userRepository
				.createQueryBuilder('users')
				.leftJoinAndSelect('users.role', 'role')
				.where('role.name = :roleName', { roleName })
				.select([
					'users.id',
					'users.name',
					'users.lastName',
					'users.photo',
					'users.email',
					'role.name',
					'users.gender',
					'users.active',
					...(showTokens ? ['users.notificationsTokens'] : []),
				]);

			if (paginationDto.search) {
				queryBuilder.andWhere(
					'(users.name LIKE :search OR users.lastName LIKE :search)',
					{
						search: `%${paginationDto.search}%`,
					},
				);
			}

			const users = !!usePagination ? await this.paginate(queryBuilder, paginationDto) : await queryBuilder.getMany();

			if (!users) {
				throw new HttpException(
					HttpMessages.USERS_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}
			return users;
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async getUserByResetPasswordToken(token: string) {
		const user = await this.userRepository.findOneBy({
			resetPasswordToken: token,
		});
		if (!user) {
			throw new HttpException(
				HttpMessages.INVALID_RESET_TOKEN,
				HttpStatus.NOT_FOUND,
			);
		}

		return user;
	}

	async getUserByPrefixAndPhoneNumber(prefix: string, phoneNumber: string) {
		const user = await this.userRepository.findOneBy({ prefix, phoneNumber });
		if (!user) {
			throw new ForbiddenException(HttpMessages.USER_NOT_FOUND);
		}

		return user;
	}

	async getUserBy2faToken(twoFaToken: string) {
		const user = await this.userRepository.findOneBy({ code2FA: twoFaToken });
		if (!user) {
			throw new NotFoundException(HttpMessages.USER_NOT_FOUND);
		}

		return user;
	}

	async validateTechnicians(technicians: string[]): Promise<UserEntity[]> {
		if (technicians === undefined || technicians.length === 0) return [];
		try {
			const technicianRoleId = await this.rolesService.findRoleIdByName(
				SystemRolesEnum.TECHNICIAN,
			);

			const users = await this.userRepository
				.createQueryBuilder('users')
				.leftJoinAndSelect('users.role', 'role')
				.where('role.id = :roleId', { roleId: technicianRoleId })
				.andWhere('users.id IN (:...technicians)', { technicians })
				.getMany();

			if (!users || users.length === 0) {
				throw new HttpException(
					HttpMessages.ACCESS_DENIED,
					HttpStatus.FORBIDDEN,
				);
			}
			return users;
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async validateClient(client: string): Promise<UserEntity> {
		const clientRoleId = await this.rolesService.findRoleIdByName(
			SystemRolesEnum.CLIENT,
		);
		try {
			const user = await this.userRepository
				.createQueryBuilder('users')
				.where('users.roleId = :roleId', { roleId: clientRoleId })
				.andWhere('users.id = :clientId', { clientId: client })
				.getOne();

			if (!user) {
				throw new HttpException(
					HttpMessages.ACCESS_DENIED,
					HttpStatus.FORBIDDEN,
				);
			}

			return user;
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async generateRandomPassword() {
		const caracteresPosibles =
			'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?~';
		let password = '';

		for (let i = 0; i < 8; i++) {
			const indiceAleatorio = Math.floor(
				Math.random() * caracteresPosibles.length,
			);
			password += caracteresPosibles.charAt(indiceAleatorio);
		}

		return password;
	}

	async sendWelcomeMail(user: UserEntity, randomPassword) {
		const redirectionUrl = `${this.configService.get<string>('URL_FRONT_WEB')}/auth/login`;
		const template = WelcomeTemplate(
			user,
			redirectionUrl,
			'es',
			randomPassword,
		);
		const sendgridOptioons: ISendgridOptions = {
			to: user.email,
			subject: `WELCOME TO TASK-MANAGER`,
			template,
		};

		await this.sendGridService.sendMail(sendgridOptioons);
	}

	async update2faCode(user: UserEntity) {
		const userUpdated = await this.userRepository
			.createQueryBuilder()
			.update(UserEntity)
			.set({
				code2FA: user.code2FA,
			})
			.where('id = :id', { id: user.id })
			.execute();

		if (userUpdated && userUpdated.affected === 0) {
			throw new HttpException(
				HttpMessages.USER_NOT_FOUND,
				HttpStatus.NOT_FOUND,
			);
		}

		return userUpdated;
	}

	async updateResetPasswordToken(user: UserEntity) {
		const userUpdated = await this.userRepository
			.createQueryBuilder()
			.update(UserEntity)
			.set({
				resetPasswordToken: user.resetPasswordToken,
			})
			.where('id = :id', { id: user.id })
			.execute();

		if (userUpdated && userUpdated.affected === 0) {
			throw new HttpException(
				HttpMessages.USER_NOT_FOUND,
				HttpStatus.NOT_FOUND,
			);
		}

		return userUpdated;
	}

	async profile(token: string): Promise<IBaseResponse<RoleEntity>> {
		const jwtPayload: IJwtPayload = this.jwtService.decode(token);
		const user = await this.findByEmail(jwtPayload.email);

		const roles: RoleEntity = user.role;

		return this.standartResponse<RoleEntity>(
			roles,
			HttpStatus.OK,
			HttpMessages.ROLES_AND_PERMISSIONS_RETRIEVED_SUCCESSFULLY,
		);
	}

	async techniciansAvailability(dates: TechnicianAvailabilityDto) {
		try {
			const technicianRoleId = await this.rolesService.findRoleIdByName(
				SystemRolesEnum.TECHNICIAN,
			);

			const queryTasks: FindAllTasksDto = {
				startDate: dates.startDate,
				endDate: dates.endDate,
			};
			const tasks = await this.taskService.findAll(queryTasks);

			const unabailableTechnicians: string[] = [];
			tasks.data.forEach((task) => {
				if (task.technicians.length > 0) {
					task.technicians.forEach((technician) => {
						unabailableTechnicians.push(technician.id);
					});
				}
			});

			const users = this.userRepository
				.createQueryBuilder('users')
				.leftJoinAndSelect('users.role', 'role')
				.where('role.id = :roleId', { roleId: technicianRoleId })
				.select([
					'users.id',
					'users.name',
					'users.lastName',
					'users.email',
					'users.active',
					'role.id',
					'role.name',
					'role.description',
				])
				.getMany();

			const techniciansAvailability: ITechniciansAbailableInterface[] = [];
			(await users).forEach((user) => {
				let techniciann = {
					id: user.id,
					name: user.name,
					lastName: user.lastName,
					photo: user.photo,
					available: null,
				};

				if (unabailableTechnicians.length > 0) {
					unabailableTechnicians.forEach((technician) => {
						if (user.id === technician) {
							techniciann.available = false;
						} else {
							techniciann.available = true;
						}
					});

					techniciansAvailability.push(techniciann);
				} else {
					techniciann.available = true;
					techniciansAvailability.push(techniciann);
				}
			});

			return techniciansAvailability;
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async profileInfo(
		id: string,
		token: string,
	): Promise<IBaseResponse<UserPublicResponse>> {
		let userToReturn: UserPublicResponse = null;
		if (id) {
			const user = await this.findOne(id);

			userToReturn = {
				id: user.id,
				name: user.name,
				lastName: user.lastName,
				photo: user.photo,
			};
		} else {
			const jwtPayload: IJwtPayload = this.jwtService.decode(token);
			const user = await this.findByEmail(jwtPayload.email);

			userToReturn = {
				id: user.id,
				name: user.name,
				lastName: user.lastName,
				photo: user.photo,
				email: user.email,
				prefix: user.prefix,
				phoneNumber: user.phoneNumber,
				gender: user.gender,
				location: user.location,
			};
		}

		return this.standartResponse<UserPublicResponse>(
			userToReturn,
			HttpStatus.OK,
			HttpMessages.USER_RETRIEVED_SUCCESSFULLY,
		);
	}

	async checkRoleIsActve(roleId: string) {
		try {
			const role = await this.roleRepository.findOne({
				where: {
					id: roleId,
				},
			});
			if (!role) {
				throw new HttpException(
					HttpMessages.ROLE_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}
			const users = await this.userRepository.findOne({
				where: {
					role: role,
				},
			});

			role.isActive = users ? true : false;
			await this.roleRepository.save(role);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async setRoleIsActive(roleId: string) {
		try {
			const role = await this.roleRepository.findOne({
				where: {
					id: roleId,
				},
			});
			if (!role) {
				throw new HttpException(
					HttpMessages.ROLE_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}
			role.isActive = true;
			await this.roleRepository.save(role);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async updateNotificationsToken(user: UserEntity) {
		const userUpdated = await this.userRepository
			.createQueryBuilder()
			.update(UserEntity)
			.set({
				notificationsTokens: user.notificationsTokens,
			})
			.where('id = :id', { id: user.id })
			.execute();

		if (userUpdated && userUpdated.affected === 0) {
			throw new HttpException(
				HttpMessages.USER_NOT_FOUND,
				HttpStatus.NOT_FOUND,
			);
		}

		return userUpdated;
	}
}
