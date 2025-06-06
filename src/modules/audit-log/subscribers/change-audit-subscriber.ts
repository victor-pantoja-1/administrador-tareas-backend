import {
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  EventSubscriber,
  DataSource,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { AuditLogService } from '../audit-log.service';
import { AuditLogEntity } from '../entities/audit-log.entity';
import { ClsService } from 'nestjs-cls';
import { AuditLogsActionsEnum } from 'src/common/enums/audit-logs-actions.enum';
import { StateChangeProperties } from 'src/common/helpers/changeStatusEntities';

@Injectable()
@EventSubscriber()
export class ChangeAuditSubscriber implements EntitySubscriberInterface {

  constructor(
    dataSource: DataSource,
    private auditLogService: AuditLogService,
    private readonly clsService: ClsService,
  ) {
    dataSource.subscribers.push(this);
  }

  private get user() {
    return this.clsService.get('user');
  }

  private get ipAddress() {
    return this.clsService.get('ipAddress');
  }

  async afterInsert(event: InsertEvent<any>): Promise<any> {
    if (typeof event.entityId === 'object' || typeof this.user !== 'object') return;

    const entityAfter = event.entity;
    const entityType = event.metadata.targetName;

    try {
      if (entityType === AuditLogEntity.name) return;
      const documentId = entityAfter.id;

      const auditLog = {
        action: AuditLogsActionsEnum.CREATE,
        documentId,
        entity: entityType,
        ipAddress: this.ipAddress,
        snapshot: entityAfter,
        beforeChanges: {},
        user: this.user,
      };

      await this.auditLogService.create(auditLog);

      return;
    } catch (error) {
      console.log(error);
    }
  }

  async handleCommonUpdates<T = any>(event: UpdateEvent<T>, documentId: string, entityBefore: T) {
    const entityAfter = event.entity;
    const entityType = event.metadata.targetName;

    if (
      typeof entityAfter !== 'object' || // Not found entity to update
      typeof this.user !== 'object' || // Does not exist user
      !documentId || // Does not exist modified id
      !Object.keys(entityBefore).length // Not loaded entity before update
    ) return;

    let statusChanged = false;
    
    try {
      if (entityType === AuditLogEntity.name) return;

      const changeStatusPropsAllEntities = StateChangeProperties.mapEntities;
      const changeStatusProps = changeStatusPropsAllEntities.get(entityType);

      if (!!changeStatusProps?.length) {
        const changedProps = this.getChangedProperties(entityBefore, entityAfter);

        statusChanged = changedProps.some(prop => changeStatusProps.includes(prop));
      }

      const auditLog = {
        action: statusChanged
          ? AuditLogsActionsEnum.STATUS_CHANGE 
          : AuditLogsActionsEnum.UPDATE,
        documentId,
        entity: entityType,
        ipAddress: this.ipAddress,
        snapshot: entityAfter,
        beforeChanges: entityBefore as object,
        user: this.user,
      };

      await this.auditLogService.create(auditLog);

      return;
    } catch (error) {
      console.log(error);
    }
  }

  private getChangedProperties<T = any>(original: T, updated: T): string[] {
    const changedProps: string[] = [];
    for (const key in updated) {
      if (updated.hasOwnProperty(key) && original[key] !== updated[key]) {
        changedProps.push(key);
      }
    }
    return changedProps;
  }

  async beforeRemove(event: RemoveEvent<any>): Promise<any> {
    if (typeof event.entityId === 'object' || typeof this.user !== 'object') return;

    const entityAfter = event.entity;
    const entityType = event.metadata.targetName;

    if (entityType === AuditLogEntity.name) return;

    try {
      const documentId = entityAfter.id;

      const auditLog = {
        action: AuditLogsActionsEnum.DELETE,
        documentId,
        entity: entityType,
        ipAddress: this.ipAddress,
        snapshot: entityAfter,
        beforeChanges: {},
        user: this.user,
      };

      await this.auditLogService.create(auditLog);

      return;
    } catch (error) {
      console.log(error);
    }
  }
}