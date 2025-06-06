import { DataSource, EntitySubscriberInterface, EventSubscriber, UpdateEvent } from "typeorm";
import { Injectable } from "@nestjs/common";
import { ChangeAuditSubscriber } from "./change-audit-subscriber";
import { RequestTaskEntity } from "src/modules/request-task/entities/request-task.entity";

@Injectable()
@EventSubscriber()
export class RequestTasksSubscriber implements EntitySubscriberInterface<RequestTaskEntity> {

  constructor(
    private readonly commonSubscriber: ChangeAuditSubscriber,
    dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  private loadedEntityBeforeUpdate: RequestTaskEntity;

  listenTo(): Function | string {
    return RequestTaskEntity;
  }

  afterLoad(entity: RequestTaskEntity) {
    this.loadedEntityBeforeUpdate = entity;
  }

  async afterUpdate(event: UpdateEvent<RequestTaskEntity>): Promise<any> {
    const documentId = this.loadedEntityBeforeUpdate?.id;
    const entityBefore = this?.loadedEntityBeforeUpdate;

    await this.commonSubscriber.handleCommonUpdates<RequestTaskEntity>(event, documentId, entityBefore);
  }
}