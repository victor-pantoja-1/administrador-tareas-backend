import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { ChangeAuditSubscriber } from './subscribers/change-audit-subscriber';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from './entities/audit-log.entity';
import { ClsModule } from 'nestjs-cls';
import { UserEntity } from '../users/entities/user.entity';
import { UsersSubscriber } from './subscribers/users-subscriber';
import { ChatsSubscriber } from './subscribers/chats-subscriber';
import { ConversationsSubscriber } from './subscribers/conversations-subscriber';
import { FeedbacksSubscriber } from './subscribers/feedbacks-subscriber';
import { MessageReadStatusSubscriber } from './subscribers/message-read-status-subscriber';
import { PermissionsSubscriber } from './subscribers/permissions-subscriber';
import { MessagesSubscriber } from './subscribers/messages-subscriber';
import { RatingsSubscriber } from './subscribers/ratings-subscriber';
import { RequestTasksSubscriber } from './subscribers/request-tasks-subscriber';
import { RolesSubscriber } from './subscribers/roles-subscriber';
import { TagsSubscriber } from './subscribers/tags-subscriber';
import { TasksSubscriber } from './subscribers/tasks-subscriber';

@Module({
  imports: [ClsModule.forFeature(), TypeOrmModule.forFeature([AuditLogEntity, UserEntity])],
  controllers: [AuditLogController],
  providers: [
    AuditLogService,
    ChangeAuditSubscriber,
    ChatsSubscriber,
    ConversationsSubscriber,
    FeedbacksSubscriber,
    MessageReadStatusSubscriber,
    MessagesSubscriber,
    PermissionsSubscriber,
    RatingsSubscriber,
    RequestTasksSubscriber,
    RolesSubscriber,
    TagsSubscriber,
    TasksSubscriber,
    UsersSubscriber,
  ],
  exports: [AuditLogService],
})
export class AuditLogModule {}
