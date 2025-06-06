import { DataSource, EntitySubscriberInterface, EventSubscriber, UpdateEvent } from "typeorm";
import { Injectable } from "@nestjs/common";
import { ChangeAuditSubscriber } from "./change-audit-subscriber";
import { ChatEntity } from "src/modules/chat/entities/chat.entity";

@Injectable()
@EventSubscriber()
export class ChatsSubscriber implements EntitySubscriberInterface<ChatEntity> {

  constructor(
    private readonly commonSubscriber: ChangeAuditSubscriber,
    dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  private loadedEntityBeforeUpdate: ChatEntity;

  listenTo(): Function | string {
    return ChatEntity;
  }

  afterLoad(entity: ChatEntity) {
    this.loadedEntityBeforeUpdate = entity;
  }

  async afterUpdate(event: UpdateEvent<ChatEntity>): Promise<any> {
    const documentId = this.loadedEntityBeforeUpdate?.id;
    const entityBefore = this?.loadedEntityBeforeUpdate;

    await this.commonSubscriber.handleCommonUpdates<ChatEntity>(event, documentId, entityBefore);
  }
}