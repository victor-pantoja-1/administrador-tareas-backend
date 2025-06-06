import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	HttpCode,
	Query,
	Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateLangUserDto, UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { TechnicianAvailabilityDto } from './dto/technician-availability.dto';
import { PublicEndpoint } from 'src/common/decorator/public-endpoint/public-endpoint.decorator';
import { Permission } from 'src/common/decorator/permission/permission.decorator';
import { SystemRoutesEnum } from 'src/common/enums/routes.enum';
import { SystemActionEnum } from 'src/common/enums/action.enum';
import { Request } from 'express';
import { AuditReads } from 'src/common/decorator/audit/audit-reads.decorator';

@Controller(SystemRoutesEnum.USERS)
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post('seeds')
	@PublicEndpoint()
	seeds() {
		return this.usersService.seeds();
	}

	@Post()
	@Permission(SystemActionEnum.UsersCreate)
	create(@Body() createUserDto: CreateUserDto) {
			return this.usersService.create(createUserDto);
	}

	@Get()
	@AuditReads('UserEntity')
	@Permission(SystemActionEnum.UsersGetAll)
	findAll(@Query() paginationDto: PaginationDto) {
			return this.usersService.findAll(paginationDto);
	}

	@Patch(':id/lang')
	@Permission(SystemActionEnum.UsersUpdate)
	updateLang(@Param('id') id: string, @Body() updateLangUserDto: UpdateLangUserDto) {
			return this.usersService.updateLangUser(id, updateLangUserDto);
	}

	@Patch(':id')
	@Permission(SystemActionEnum.UsersUpdate)
	update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
			return this.usersService.update(id, updateUserDto);
	}

	@Delete(':id')
	@HttpCode(204)
	@Permission(SystemActionEnum.UsersDelete)
	remove(@Param('id') id: string) {
			return this.usersService.remove(id);
	}

	@Get('roles/:roleName')
	@AuditReads('UserEntity')
	@Permission(SystemActionEnum.UsersGetByRole)
	async roles(@Param('roleName') roleName: string, @Query() paginationDto: PaginationDto) {
			return await this.usersService.findUsersWithRole(roleName, paginationDto);
	}

	@Get('profile/me')
	@AuditReads('UserEntity')
	@Permission(SystemActionEnum.UsersGetPublicOrPrivateInfo)
	async myProfile(@Req() request: Request) {
			const [_type, token] = request.headers.authorization.split(' ') || [];
			return await this.usersService.profile(token);
	}

	@Get('technicians/availability')
	@AuditReads('UserEntity')
	@Permission(SystemActionEnum.UsersGetAll)
	async techniciansAvailability(@Query() dates: TechnicianAvailabilityDto) {
			return await this.usersService.techniciansAvailability(dates);
	}

	@Get('profile/info/:id?')
	@AuditReads('UserEntity')
	@Permission(SystemActionEnum.UsersGetPublicOrPrivateInfo)
	async profileInfo(
			@Param('id') id: string,
			@Req() request: Request,
	) {
			const [_type, token] = request.headers.authorization.split(' ') || [];
			return await this.usersService.profileInfo(id, token);
	}

	@Get(':id')
	@AuditReads('UserEntity')
	@Permission(SystemActionEnum.UsersGetById)
	findOne(@Param('id') id: string) {
			return this.usersService.findOne(id);
	}
}