import { forwardRef, Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from './entities/task.entity';
import { UsersModule } from '../users/users.module';
import { TagModule } from '../tag/tag.module';
import { TaskEventsModule } from 'src/common/gateway/task-events/task-events.module';
import { ConversationModule } from '../conversation/conversation.module';
import { UserEntity } from '../users/entities/user.entity';
import { SendGridService } from 'src/common/helpers/sendgrid';
import { FirebaseMessagingService } from 'src/common/helpers/firebase-messaging.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([TaskEntity, UserEntity]),
		TagModule,
		forwardRef(() => UsersModule),
		TaskEventsModule,
    ConversationModule,
	],
	controllers: [TaskController],
	providers: [
		TaskService,
		SendGridService,
		FirebaseMessagingService
	],
	exports: [TaskService],
})
export class TaskModule {}
