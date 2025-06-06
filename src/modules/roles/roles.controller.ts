import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	Query,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SystemRoutesEnum } from 'src/common/enums/routes.enum';
import { Permission } from 'src/common/decorator/permission/permission.decorator';
import { SystemActionEnum } from 'src/common/enums/action.enum';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AuditReads } from 'src/common/decorator/audit/audit-reads.decorator';

@ApiTags('roles')
@Controller(SystemRoutesEnum.ROLES)
@ApiBearerAuth()
export class RolesController {
	constructor(private readonly rolesService: RolesService) {}

	@Post()
	@Permission(SystemActionEnum.RolesCreate)
	create(@Body() createRoleDto: CreateRoleDto) {
		return this.rolesService.create(createRoleDto);
	}

	@Get()
	@AuditReads('RoleEntity')
	@Permission(SystemActionEnum.RolesGetAll)
	findAll(
		@Query() paginationDto: PaginationDto
	) {
		return this.rolesService.findAll(paginationDto);
	}

	@Get(':id')
	@AuditReads('RoleEntity')
	@Permission(SystemActionEnum.RolesGetById)
	findOne(@Param('id') id: string) {
		return this.rolesService.findOne(id);
	}

	@Patch(':id')
	@Permission(SystemActionEnum.RolesUpdate)
	update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
		return this.rolesService.update(id, updateRoleDto);
	}

	@Delete(':id')
	@Permission(SystemActionEnum.RolesDelete)
	remove(@Param('id') id: string) {
		return this.rolesService.remove(id);
	}
}
