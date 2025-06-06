import { DataSource, EntitySubscriberInterface, EventSubscriber, UpdateEvent } from "typeorm";
import { Injectable } from "@nestjs/common";
import { ChangeAuditSubscriber } from "./change-audit-subscriber";
import { TaskEntity } from "src/modules/task/entities/task.entity";

@Injectable()
@EventSubscriber()
export class TasksSubscriber implements EntitySubscriberInterface<TaskEntity> {

  constructor(
    private readonly commonSubscriber: ChangeAuditSubscriber,
    dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  private loadedEntityBeforeUpdate: TaskEntity;

  listenTo(): Function | string {
    return TaskEntity;
  }

  afterLoad(entity: TaskEntity) {
    this.loadedEntityBeforeUpdate = entity;
  }

  async afterUpdate(event: UpdateEvent<TaskEntity>): Promise<any> {
    const documentId = this.loadedEntityBeforeUpdate?.id;
    const entityBefore = this?.loadedEntityBeforeUpdate;

    await this.commonSubscriber.handleCommonUpdates<TaskEntity>(event, documentId, entityBefore);
  }
}