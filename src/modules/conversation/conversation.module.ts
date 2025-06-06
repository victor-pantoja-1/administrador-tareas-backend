import { forwardRef, Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationEntity } from './entities/conversation.entity';
import { ConversationController } from './conversation.controller';
import { UsersModule } from '../users/users.module';
import { UserEntity } from '../users/entities/user.entity';
import { MessageReadStatusEntity } from '../messages/entities/message-read-status.entity';

@Module({
	imports: [TypeOrmModule.forFeature([ConversationEntity, UserEntity, MessageReadStatusEntity]),forwardRef(() => UsersModule),],
	providers: [ConversationService],
	controllers: [ConversationController],
	exports: [ConversationService],
})
export class ConversationModule {}
