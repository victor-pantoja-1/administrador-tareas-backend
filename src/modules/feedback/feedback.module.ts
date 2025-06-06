import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackEntity } from './entities/feedback.entity';
import { UsersModule } from '../users/users.module';

@Module({
	imports: [TypeOrmModule.forFeature([FeedbackEntity]), UsersModule],
	controllers: [FeedbackController],
	providers: [FeedbackService],
})
export class FeedbackModule {}
