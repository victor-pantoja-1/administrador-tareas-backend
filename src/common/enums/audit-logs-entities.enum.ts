import { ChatEntity } from "src/modules/chat/entities/chat.entity";
import { ConversationEntity } from "src/modules/conversation/entities/conversation.entity";
import { FeedbackEntity } from "src/modules/feedback/entities/feedback.entity";
import { MessageReadStatusEntity } from "src/modules/messages/entities/message-read-status.entity";
import { MessageEntity } from "src/modules/messages/entities/message.entity";
import { PermissionEntity } from "src/modules/permission/entities/permission.entity";
import { RatingEntity } from "src/modules/rating/entities/rating.entity";
import { RequestTaskEntity } from "src/modules/request-task/entities/request-task.entity";
import { RoleEntity } from "src/modules/roles/entities/role.entity";
import { TagEntity } from "src/modules/tag/entities/tag.entity";
import { TaskEntity } from "src/modules/task/entities/task.entity";
import { UserEntity } from "src/modules/users/entities/user.entity";

// Add all Entity tables
export const AuditLogsEntitiesEnum = {
  ChatEntity: ChatEntity.name,
  ConversationEntity: ConversationEntity.name,
  FeedbackEntity: FeedbackEntity.name,
  MessageReadStatusEntity: MessageReadStatusEntity.name,
  MessageEntity: MessageEntity.name,
  PermissionEntity: PermissionEntity.name,
  RatingEntity: RatingEntity.name,
  RequestTaskEntity: RequestTaskEntity.name,
  RoleEntity: RoleEntity.name,
  TagEntity: TagEntity.name,
  TaskEntity: TaskEntity.name,
  UserEntity: UserEntity.name,
}
