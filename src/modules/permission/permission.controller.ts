import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { SystemRoutesEnum } from 'src/common/enums/routes.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission } from 'src/common/decorator/permission/permission.decorator';
import { SystemActionEnum } from 'src/common/enums/action.enum';
import { AuditReads } from 'src/common/decorator/audit/audit-reads.decorator';

@ApiTags('permission')
@Controller(SystemRoutesEnum.PERMISSIONS)
@ApiBearerAuth()
export class PermissionController {
	constructor(private readonly permissionService: PermissionService) {}

	@Post()
	@Permission(SystemActionEnum.PermissionsCreate)
	create(@Body() createPermissionDto: CreatePermissionDto) {
		return this.permissionService.create(createPermissionDto);
	}

	@Get()
	@AuditReads('PermissionEntity')
	@Permission(SystemActionEnum.PermissionsGetAll)
	findAll() {
		return this.permissionService.findAll();
	}

	@Get(':id')
	@AuditReads('PermissionEntity')
	@Permission(SystemActionEnum.PermissionsGetById)
	findOne(@Param('id') id: string) {
		return this.permissionService.findOne(id);
	}

	@Delete(':id')
	@Permission(SystemActionEnum.PermissionsDelete)
	remove(@Param('id') id: string) {
		return this.permissionService.remove(id);
	}
}
