import { DataSource, EntitySubscriberInterface, EventSubscriber, UpdateEvent } from "typeorm";
import { Injectable } from "@nestjs/common";
import { ChangeAuditSubscriber } from "./change-audit-subscriber";
import { PermissionEntity } from "src/modules/permission/entities/permission.entity";

@Injectable()
@EventSubscriber()
export class PermissionsSubscriber implements EntitySubscriberInterface<PermissionEntity> {

  constructor(
    private readonly commonSubscriber: ChangeAuditSubscriber,
    dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  private loadedEntityBeforeUpdate: PermissionEntity;

  listenTo(): Function | string {
    return PermissionEntity;
  }

  afterLoad(entity: PermissionEntity) {
    this.loadedEntityBeforeUpdate = entity;
  }

  async afterUpdate(event: UpdateEvent<PermissionEntity>): Promise<any> {
    const documentId = this.loadedEntityBeforeUpdate?.id;
    const entityBefore = this?.loadedEntityBeforeUpdate;

    await this.commonSubscriber.handleCommonUpdates<PermissionEntity>(event, documentId, entityBefore);
  }
}