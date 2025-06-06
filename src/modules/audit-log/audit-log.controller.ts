import { Controller, Get, Param, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { Permission } from 'src/common/decorator/permission/permission.decorator';
import { SystemActionEnum } from 'src/common/enums/action.enum';
import { FilterPaginationAuditLog } from './dto/filter-pagination-audit-log.dto';

@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('paginate')
	@Permission(SystemActionEnum.AuditLogsGetAllPaginated)
  findAll(@Query() paginationDto: FilterPaginationAuditLog) {
    return this.auditLogService.findAllPaginated(paginationDto);
  }

  @Get(':id')
  @Permission(SystemActionEnum.AuditLogsGetById)
  findOne(@Param('id') id: string) {
    return this.auditLogService.findOne(id);
  }
}
