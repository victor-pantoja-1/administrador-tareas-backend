import { DataSource, EntitySubscriberInterface, EventSubscriber, UpdateEvent } from "typeorm";
import { Injectable } from "@nestjs/common";
import { ChangeAuditSubscriber } from "./change-audit-subscriber";
import { MessageReadStatusEntity } from "src/modules/messages/entities/message-read-status.entity";

@Injectable()
@EventSubscriber()
export class MessageReadStatusSubscriber implements EntitySubscriberInterface<MessageReadStatusEntity> {

  constructor(
    private readonly commonSubscriber: ChangeAuditSubscriber,
    dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  private loadedEntityBeforeUpdate: MessageReadStatusEntity;

  listenTo(): Function | string {
    return MessageReadStatusEntity;
  }

  afterLoad(entity: MessageReadStatusEntity) {
    this.loadedEntityBeforeUpdate = entity;
  }

  async afterUpdate(event: UpdateEvent<MessageReadStatusEntity>): Promise<any> {
    const documentId = this.loadedEntityBeforeUpdate?.id;
    const entityBefore = this?.loadedEntityBeforeUpdate;

    await this.commonSubscriber.handleCommonUpdates<MessageReadStatusEntity>(event, documentId, entityBefore);
  }
}