import { DataSource, EntitySubscriberInterface, EventSubscriber, UpdateEvent } from "typeorm";
import { Injectable } from "@nestjs/common";
import { ChangeAuditSubscriber } from "./change-audit-subscriber";
import { MessageEntity } from "src/modules/messages/entities/message.entity";

@Injectable()
@EventSubscriber()
export class MessagesSubscriber implements EntitySubscriberInterface<MessageEntity> {

  constructor(
    private readonly commonSubscriber: ChangeAuditSubscriber,
    dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  private loadedEntityBeforeUpdate: MessageEntity;

  listenTo(): Function | string {
    return MessageEntity;
  }

  afterLoad(entity: MessageEntity) {
    this.loadedEntityBeforeUpdate = entity;
  }

  async afterUpdate(event: UpdateEvent<MessageEntity>): Promise<any> {
    const documentId = this.loadedEntityBeforeUpdate?.id;
    const entityBefore = this?.loadedEntityBeforeUpdate;

    await this.commonSubscriber.handleCommonUpdates<MessageEntity>(event, documentId, entityBefore);
  }
}