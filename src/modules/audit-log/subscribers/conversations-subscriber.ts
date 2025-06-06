import { DataSource, EntitySubscriberInterface, EventSubscriber, UpdateEvent } from "typeorm";
import { Injectable } from "@nestjs/common";
import { ChangeAuditSubscriber } from "./change-audit-subscriber";
import { ConversationEntity } from "src/modules/conversation/entities/conversation.entity";

@Injectable()
@EventSubscriber()
export class ConversationsSubscriber implements EntitySubscriberInterface<ConversationEntity> {

  constructor(
    private readonly commonSubscriber: ChangeAuditSubscriber,
    dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  private loadedEntityBeforeUpdate: ConversationEntity;

  listenTo(): Function | string {
    return ConversationEntity;
  }

  afterLoad(entity: ConversationEntity) {
    this.loadedEntityBeforeUpdate = entity;
  }

  async afterUpdate(event: UpdateEvent<ConversationEntity>): Promise<any> {
    const documentId = this.loadedEntityBeforeUpdate?.id;
    const entityBefore = this?.loadedEntityBeforeUpdate;

    await this.commonSubscriber.handleCommonUpdates<ConversationEntity>(event, documentId, entityBefore);
  }
}