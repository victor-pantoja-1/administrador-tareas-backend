import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessageEntity } from './entities/message.entity';
import { ConversationEntity } from '../conversation/entities/conversation.entity';
import { UserEntity } from '../users/entities/user.entity';
import { MessageReadStatusEntity } from './entities/message-read-status.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageEntity, MessageReadStatusEntity, ConversationEntity, UserEntity]),
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
