import { DataSource, EntitySubscriberInterface, EventSubscriber, UpdateEvent } from "typeorm";
import { Injectable } from "@nestjs/common";
import { ChangeAuditSubscriber } from "./change-audit-subscriber";
import { RatingEntity } from "src/modules/rating/entities/rating.entity";

@Injectable()
@EventSubscriber()
export class RatingsSubscriber implements EntitySubscriberInterface<RatingEntity> {

  constructor(
    private readonly commonSubscriber: ChangeAuditSubscriber,
    dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  private loadedEntityBeforeUpdate: RatingEntity;

  listenTo(): Function | string {
    return RatingEntity;
  }

  afterLoad(entity: RatingEntity) {
    this.loadedEntityBeforeUpdate = entity;
  }

  async afterUpdate(event: UpdateEvent<RatingEntity>): Promise<any> {
    const documentId = this.loadedEntityBeforeUpdate?.id;
    const entityBefore = this?.loadedEntityBeforeUpdate;

    await this.commonSubscriber.handleCommonUpdates<RatingEntity>(event, documentId, entityBefore);
  }
}