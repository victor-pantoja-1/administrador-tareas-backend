import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { UsersModule } from '../users/users.module';
import { ChatEntity } from './entities/chat.entity';
import { UserEntity } from '../users/entities/user.entity';
import { MessagesService } from '../messages/messages.service';
import { MessageEntity } from '../messages/entities/message.entity';
import { ConversationEntity } from '../conversation/entities/conversation.entity';
import { MessageReadStatusEntity } from '../messages/entities/message-read-status.entity';
import { ConversationService } from '../conversation/conversation.service';
import { FirebaseMessagingService } from 'src/common/helpers/firebase-messaging.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatEntity,
      UserEntity,
      MessageEntity,
      MessageReadStatusEntity,
      ConversationEntity
    ]),
    UsersModule
  ],
  providers: [
    FirebaseMessagingService,
    ChatService,
    ChatGateway,
    MessagesService,
    ConversationService
  ],
})
export class ChatModule {}
