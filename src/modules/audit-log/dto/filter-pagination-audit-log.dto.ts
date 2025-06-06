import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { AuditLogsActionsEnum } from "src/common/enums/audit-logs-actions.enum";
import { AuditLogsEntitiesEnum } from "src/common/enums/audit-logs-entities.enum";

export class FilterPaginationAuditLog extends PaginationDto {
  @ApiPropertyOptional({
		description: 'Entity name',
		example: 'UserEntity',
    type: 'array',
    items: {
      type: 'string',
      example: '0015e410-bb91-49fc-8aa1-8050a6b29238',
      enum: Object.keys(AuditLogsEntitiesEnum || {}),
    },
	})
	@IsOptional()
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsEnum(Object.keys(AuditLogsEntitiesEnum || {}), { each: true })
  entities?: string[];

  @ApiPropertyOptional({
    example: new Date().toISOString(),
    description: 'Start date of logs (format date ISO8601)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsDateString({ strict: true, strictSeparator: true })
  startDate?: string;

  @ApiPropertyOptional({
    example: new Date().toISOString(),
    description: 'End date of logs (format date ISO8601)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsDateString({ strict: true, strictSeparator: true })
  endDate?: string;

  @ApiPropertyOptional({
		description: 'Log action',
		example: AuditLogsActionsEnum.CREATE,
    enum: Object.keys(AuditLogsActionsEnum || {}),
	})
	@IsOptional()
	@IsString()
  @IsEnum(Object.keys(AuditLogsActionsEnum || {}))
  action?: string;

  @ApiPropertyOptional({
    description: 'User list uuids',
    type: 'array',
    items: {
      type: 'string',
      example: '0015e410-bb91-49fc-8aa1-8050a6b29238',
    },
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  users?: string[];
}