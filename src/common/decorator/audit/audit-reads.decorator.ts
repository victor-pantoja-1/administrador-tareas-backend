import { SetMetadata } from '@nestjs/common';
import { AuditLogsEntitiesEnum } from 'src/common/enums/audit-logs-entities.enum';

export const AuditReads = (entity: keyof typeof AuditLogsEntitiesEnum) => SetMetadata('audit-reads', entity);
