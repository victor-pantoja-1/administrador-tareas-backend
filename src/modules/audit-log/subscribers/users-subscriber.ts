import { DataSource, EntitySubscriberInterface, EventSubscriber, UpdateEvent } from "typeorm";
import { Injectable } from "@nestjs/common";
import { UserEntity } from "src/modules/users/entities/user.entity";
import { ChangeAuditSubscriber } from "./change-audit-subscriber";
import { AfterQueryEvent } from "typeorm/subscriber/event/QueryEvent";

@Injectable()
@EventSubscriber()
export class UsersSubscriber implements EntitySubscriberInterface<UserEntity> {

  constructor(
    private readonly commonSubscriber: ChangeAuditSubscriber,
    dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  private loadedEntityBeforeUpdate: UserEntity;

  listenTo(): Function | string {
    return UserEntity;
  }

  afterLoad(entity: UserEntity) {
    this.loadedEntityBeforeUpdate = entity;
  }

  async afterUpdate(event: UpdateEvent<UserEntity>): Promise<any> {
    const documentId = this.loadedEntityBeforeUpdate?.id;
    const entityBefore = this?.loadedEntityBeforeUpdate;

    await this.commonSubscriber.handleCommonUpdates<UserEntity>(event, documentId, entityBefore);
  }
}