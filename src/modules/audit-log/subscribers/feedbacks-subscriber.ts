import { DataSource, EntitySubscriberInterface, EventSubscriber, UpdateEvent } from "typeorm";
import { Injectable } from "@nestjs/common";
import { ChangeAuditSubscriber } from "./change-audit-subscriber";
import { FeedbackEntity } from "src/modules/feedback/entities/feedback.entity";

@Injectable()
@EventSubscriber()
export class FeedbacksSubscriber implements EntitySubscriberInterface<FeedbackEntity> {

  constructor(
    private readonly commonSubscriber: ChangeAuditSubscriber,
    dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  private loadedEntityBeforeUpdate: FeedbackEntity;

  listenTo(): Function | string {
    return FeedbackEntity;
  }

  afterLoad(entity: FeedbackEntity) {
    this.loadedEntityBeforeUpdate = entity;
  }

  async afterUpdate(event: UpdateEvent<FeedbackEntity>): Promise<any> {
    const documentId = this.loadedEntityBeforeUpdate?.id;
    const entityBefore = this?.loadedEntityBeforeUpdate;

    await this.commonSubscriber.handleCommonUpdates<FeedbackEntity>(event, documentId, entityBefore);
  }
}