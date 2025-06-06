import { MessageEntity } from "src/modules/messages/entities/message.entity";
import { UserEntity } from "src/modules/users/entities/user.entity";

export interface CreateMessageResponse {
    message: MessageEntity;
    users: UserEntity[];
    error?: string;
  }
  