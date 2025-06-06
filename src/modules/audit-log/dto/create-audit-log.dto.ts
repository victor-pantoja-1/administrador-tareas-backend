import { AuditLogsActionsEnum } from "src/common/enums/audit-logs-actions.enum";
import { UserEntity } from "src/modules/users/entities/user.entity";

export class CreateAuditLogDto {
  entity: string;
  documentId: string;
  action: AuditLogsActionsEnum;
  user: UserEntity;
  ipAddress: string;
  snapshot: object;
  beforeChanges: object;
}
