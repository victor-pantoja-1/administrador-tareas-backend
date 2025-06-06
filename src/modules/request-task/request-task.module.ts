import { Module } from '@nestjs/common';
import { RequestTaskService } from './request-task.service';
import { RequestTaskController } from './request-task.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestTaskEntity } from './entities/request-task.entity';
import { AWSS3Service } from 'src/common/helpers/aws-s3.service';
import { UsersModule } from '../users/users.module';
import { TaskModule } from '../task/task.module';
import { FirebaseMessagingService } from 'src/common/helpers/firebase-messaging.service';
@Module({
	imports: [
		TypeOrmModule.forFeature([RequestTaskEntity]),
		UsersModule,
		TaskModule,
	],
	controllers: [RequestTaskController],
	providers: [
		RequestTaskService,
		AWSS3Service,
		FirebaseMessagingService,
	],
})
export class RequestTaskModule {}
