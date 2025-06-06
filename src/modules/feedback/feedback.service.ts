import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FeedbackEntity } from './entities/feedback.entity';
import { Repository } from 'typeorm';
import {
	HttpMessages
} from 'src/common/enums/http-messages.enum';
import { ResponseFormatter } from 'src/common/helpers/response-formatter.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class FeedbackService extends ResponseFormatter {
	constructor(
		@InjectRepository(FeedbackEntity)
		private feedbackRepository: Repository<FeedbackEntity>,
		private readonly usersService: UsersService,
	) {
		super();
	}
	async create(createFeedbackDto: CreateFeedbackDto) {
		try {
			const user = await this.usersService.findOne(createFeedbackDto.userId);
			const feedback = this.feedbackRepository.create({
				...createFeedbackDto,
				user: { id: user.id },
				task: { id: createFeedbackDto.taskId },
			});

			this.feedbackRepository.save(feedback);
			return this.standartResponse(
				true,
				HttpStatus.CREATED,
				HttpMessages.FEEDBACK_CREATED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	update(id: string, updateFeedbackDto: UpdateFeedbackDto) {
		try {
			this.feedbackRepository.update(id, {
				content: updateFeedbackDto.content,
			});
			return this.standartResponse(
				true,
				HttpStatus.OK,
				HttpMessages.FEEDBACK_UPDATED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async remove(id: string) {
		try {
			// TODO: validate that this method works
			const feedback = await this.feedbackRepository.findBy({ id });
			this.feedbackRepository.remove(feedback);
			return this.standartResponse(
				true,
				HttpStatus.NO_CONTENT,
				HttpMessages.FEEDBACK_DELETE_SUCCESSFULLY
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
