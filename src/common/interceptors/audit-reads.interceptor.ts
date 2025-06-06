import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditLogEntity } from 'src/modules/audit-log/entities/audit-log.entity';
import { AuditLogsActionsEnum } from '../enums/audit-logs-actions.enum';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class AuditReadsInterceptor implements NestInterceptor {
  constructor(
    @Inject(getRepositoryToken(AuditLogEntity))
    private auditLogRepository: Repository<AuditLogEntity>,
    private readonly clsService: ClsService,
    private reflector: Reflector,
  ) {}

  private get user() {
    return this.clsService.get('user');
  }

  private get ipAddress() {
    return this.clsService.get('ipAddress');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const entity = this.reflector.get<string>('audit-reads', context.getHandler());

    if (entity) {
      return next.handle().pipe(
        tap({
          next: async () => {
            if (entity === AuditLogEntity.name || typeof this.user !== 'object')
              return next.handle();

            const auditLog = this.auditLogRepository.create({
              entity,
              action: AuditLogsActionsEnum.READ,
              documentId: null,
              ipAddress: this.ipAddress,
              user: this.user,
              snapshot: {},
              beforeChanges: {},
            });
            await this.auditLogRepository.save(auditLog);
          },
          error: (err) => {
            console.log(err);
            next.handle();
          },
        }),
      );
    }

    return next.handle();
  }
}