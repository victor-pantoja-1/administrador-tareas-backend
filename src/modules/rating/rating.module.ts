import { Module } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingEntity } from './entities/rating.entity';
import { TaskModule } from '../task/task.module';
import { UserEntity } from '../users/entities/user.entity';
import { FirebaseMessagingService } from 'src/common/helpers/firebase-messaging.service';
import { UsersModule } from '../users/users.module';

@Module({
	imports: [TypeOrmModule.forFeature([RatingEntity, UserEntity]), TaskModule, UsersModule],
	controllers: [RatingController],
	providers: [RatingService, FirebaseMessagingService],
})
export class RatingModule {}
