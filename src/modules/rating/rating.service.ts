import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRatingDto } from './dto/create-rating.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RatingEntity } from './entities/rating.entity';
import { Repository } from 'typeorm';

import { TaskService } from '../task/task.service';
import { HttpMessages } from 'src/common/enums/http-messages.enum';
import { IBaseResponse } from 'src/common/interfaces/common/base-response';
import { ResponseFormatter } from 'src/common/helpers/response-formatter.service';
import { IRatingResponse } from 'src/common/interfaces/rating/rating.interface';
import { UserEntity } from '../users/entities/user.entity';
import { TaskStatusEnum } from 'src/common/enums/task-status.enum';
import { TargetType } from 'src/common/enums/ratings-target.enum';
import { FirebaseMessagingService } from 'src/common/helpers/firebase-messaging.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class RatingService extends ResponseFormatter {
	constructor(
		@InjectRepository(RatingEntity)
		private readonly ratingRepository: Repository<RatingEntity>,
		private readonly notificationsService: FirebaseMessagingService,
		private readonly taskService: TaskService,
		private readonly usersService: UsersService,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
	) {
		super();
	}
	async rateTask(
		userId: string,
		createRatingDto: CreateRatingDto,
		targetType: TargetType,
	): Promise<IBaseResponse<IRatingResponse>> {
		try {
			const task = await this.taskService.findOne(createRatingDto.taskId);

			if (!task) {
				throw new HttpException(
					HttpMessages.TASK_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}

			if (task.data.status !== TaskStatusEnum.DONE) {
				throw new HttpException(
					HttpMessages.TASK_NOT_IN_DONE_STATUS,
					HttpStatus.BAD_REQUEST,
				);
			}

			let targetUser: UserEntity;

			switch (targetType) {
				case TargetType.TECHNICIAN:
					if (task.data.client.id !== userId) {
						throw new HttpException(
							HttpMessages.ACCESS_DENIED,
							HttpStatus.BAD_REQUEST,
						);
					}

					targetUser = task.data.technicians.find(
						(tech) => tech.id === createRatingDto.targetUserId,
					);

					if (!targetUser) {
						throw new HttpException(
							HttpMessages.USER_NOT_FOUND,
							HttpStatus.BAD_REQUEST,
						);
					}

					break;

				case TargetType.CLIENT: {	
					const isTechnicianInTask = task.data.technicians.some(
						(tech) => tech.id === userId,
					);

					if (!isTechnicianInTask) {
						throw new HttpException(
							HttpMessages.ACCESS_DENIED,
							HttpStatus.BAD_REQUEST,
						);
					}

					targetUser = task.data.client;

					if (targetUser.id !== createRatingDto.targetUserId) {
						throw new HttpException(
							HttpMessages.USER_NOT_FOUND,
							HttpStatus.BAD_REQUEST,
						);
					}

					break;
				}
				case TargetType.COMPANY:
					if (task.data.client.id !== userId) {
						throw new HttpException(
							HttpMessages.ACCESS_DENIED,
							HttpStatus.BAD_REQUEST,
						);
					}

					targetUser = await this.userRepository.findOneBy({
						email: 'admin@taskmanager.com',
					},						
					);

					if (!targetUser) {
						throw new HttpException(
							HttpMessages.USER_NOT_FOUND,
							HttpStatus.BAD_REQUEST,
						);
					}

					break;

				default:
					throw new HttpException(
						HttpMessages.INVALID_TARGET_TYPE,
						HttpStatus.BAD_REQUEST,
					);
			}

			const existingRating = await this.ratingRepository.findOne({
				where: {
					task: { id: task.data.id },
					targetUser: { id: targetUser.id },
					user: { id: userId },
				},
				relations: ['task', 'targetUser'],
			});

			if (existingRating) {
				throw new HttpException(
					HttpMessages.USER_ALREADY_RATED,
					HttpStatus.BAD_REQUEST,
				);
			}

			const rating = await this.ratingRepository.save({
				rating: createRatingDto.rating,
				comment: createRatingDto.comment,
				task: task.data,
				user: await this.userRepository.findOneBy({
					id: userId,
				}),
				targetUser,
				targetType,
				images: createRatingDto.images || [],
			});

			if ([TargetType.CLIENT, TargetType.TECHNICIAN].includes(targetType)) {
				const specialUsers = await this.usersService.getAllControlDashboardUsers();

				this.notificationsService.sendTaskRating(
					specialUsers,
					{
						name: task.data.title,
						score: createRatingDto.rating,
						taskId: task.data.id,
					}
				);
			}

			return this.standartResponse<RatingEntity>(
				rating,
				HttpStatus.CREATED,
				HttpMessages.RATING_CREATED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async getAllRatingsOfTask(
		taskId: string,
	): Promise<IBaseResponse<IRatingResponse[]>> {
		try {
			const ratings = await this.ratingRepository
				.createQueryBuilder('ratings')
				.leftJoinAndSelect('ratings.user', 'user')
				.where('ratings.taskId = :taskId', { taskId })
				.select([
					'ratings.id',
					'ratings.rating',
					'ratings.comment',
					'user.id',
					'user.name',
					'user.lastName',
				])
				.getMany();

			if (!ratings || ratings.length === 0) {
				throw new HttpException(
					HttpMessages.RATING_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}
			return this.standartResponse<IRatingResponse[]>(
				ratings,
				HttpStatus.OK,
				HttpMessages.RATINGS_RETRIEVED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async getTopFiveTechnicians(): Promise<IBaseResponse<IRatingResponse[]>> {
		try {
			const topTechnicians = await this.userRepository
				.createQueryBuilder('user')
				.innerJoin('user.technicianTasks', 'task')
				.innerJoin('task.ratings', 'rating', 'rating.targetUserId = user.id')
				.select('user.id', 'id')
				.addSelect('user.name', 'name')
				.addSelect('user.lastName', 'lastName')
				.addSelect('user.email', 'email')
				.addSelect('user.photo', 'photo')
				.addSelect('AVG(rating.rating)', 'averageRating')
				.groupBy('user.id')
				.orderBy('averageRating', 'DESC')
				.limit(5)
				.getRawMany();

			return this.standartResponse<IRatingResponse[]>(
				topTechnicians,
				HttpStatus.OK,
				HttpMessages.USER_RETRIEVED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
