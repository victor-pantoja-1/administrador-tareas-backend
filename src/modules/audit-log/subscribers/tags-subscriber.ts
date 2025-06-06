import { DataSource, EntitySubscriberInterface, EventSubscriber, UpdateEvent } from "typeorm";
import { Injectable } from "@nestjs/common";
import { ChangeAuditSubscriber } from "./change-audit-subscriber";
import { TagEntity } from "src/modules/tag/entities/tag.entity";

@Injectable()
@EventSubscriber()
export class TagsSubscriber implements EntitySubscriberInterface<TagEntity> {

  constructor(
    private readonly commonSubscriber: ChangeAuditSubscriber,
    dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  private loadedEntityBeforeUpdate: TagEntity;

  listenTo(): Function | string {
    return TagEntity;
  }

  afterLoad(entity: TagEntity) {
    this.loadedEntityBeforeUpdate = entity;
  }

  async afterUpdate(event: UpdateEvent<TagEntity>): Promise<any> {
    const documentId = this.loadedEntityBeforeUpdate?.id;
    const entityBefore = this?.loadedEntityBeforeUpdate;

    await this.commonSubscriber.handleCommonUpdates<TagEntity>(event, documentId, entityBefore);
  }
}