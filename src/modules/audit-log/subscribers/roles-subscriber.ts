import { DataSource, EntitySubscriberInterface, EventSubscriber, UpdateEvent } from "typeorm";
import { Injectable } from "@nestjs/common";
import { ChangeAuditSubscriber } from "./change-audit-subscriber";
import { RoleEntity } from "src/modules/roles/entities/role.entity";

@Injectable()
@EventSubscriber()
export class RolesSubscriber implements EntitySubscriberInterface<RoleEntity> {

  constructor(
    private readonly commonSubscriber: ChangeAuditSubscriber,
    dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  private loadedEntityBeforeUpdate: RoleEntity;

  listenTo(): Function | string {
    return RoleEntity;
  }

  afterLoad(entity: RoleEntity) {
    this.loadedEntityBeforeUpdate = entity;
  }

  async afterUpdate(event: UpdateEvent<RoleEntity>): Promise<any> {
    const documentId = this.loadedEntityBeforeUpdate?.id;
    const entityBefore = this?.loadedEntityBeforeUpdate;

    await this.commonSubscriber.handleCommonUpdates<RoleEntity>(event, documentId, entityBefore);
  }
}