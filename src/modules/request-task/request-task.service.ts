import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRequestTaskDto } from './dto/create-request-task.dto';
import { UpdateRequestTaskDto } from './dto/update-request-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestTaskEntity } from './entities/request-task.entity';
import { Repository } from 'typeorm';
import { ResponseFormatter } from 'src/common/helpers/response-formatter.service';
import { HttpMessages } from 'src/common/enums/http-messages.enum';
import { UpdateTaskStatusDto } from './dto/update-status.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AWSS3Service } from 'src/common/helpers/aws-s3.service';
import { RequestTaskStatusEnum } from 'src/common/enums/request-task-status.enum';
import { IJwtPayload } from 'src/common/interfaces/auth/jwt-payload.interface';
import { UsersService } from '../users/users.service';
import { TaskService } from '../task/task.service';
import { CreateTaskDto } from '../task/dto/create-task.dto';
import { TaskStatusEnum } from 'src/common/enums/task-status.enum';
import { TaskRequestResponse } from 'src/common/interfaces/request-task/request-task-response.interface';
import { JwtService } from '@nestjs/jwt';
import { IBaseResponse } from 'src/common/interfaces/common/base-response';
import { FirebaseMessagingService } from 'src/common/helpers/firebase-messaging.service';

@Injectable()
export class RequestTaskService extends ResponseFormatter {
	constructor(
		@InjectRepository(RequestTaskEntity)
		private requestTaskRepository: Repository<RequestTaskEntity>,
		private readonly notificationsService: FirebaseMessagingService,
		private s3Service: AWSS3Service,
		private userService: UsersService,
		private taskService: TaskService,
		private jwtService: JwtService,
	) {
		super();
	}

	async create(createRequestTaskDto: CreateRequestTaskDto, user: IJwtPayload) {
		try {
			const userEntity = await this.userService.findByEmail(user.email);

			const requestTask = this.requestTaskRepository.create({
				...createRequestTaskDto,
				client: userEntity,
			});

			const response = await this.requestTaskRepository.save(requestTask);

			const specialUsers = await this.userService.getAllControlDashboardUsers();

			this.notificationsService.sendRequestTask(
				specialUsers,
				{
					name: requestTask.title,
					requestTaskId: requestTask.id,
				}
			);

			return this.standartResponse(
				response,
				HttpStatus.CREATED,
				HttpMessages.REQUEST_TASK_CREATED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findAll(paginate: PaginationDto) {
		try {
			const queryBuilder = this.requestTaskRepository
				.createQueryBuilder('request_tasks')
				.leftJoinAndSelect('request_tasks.client', 'client')
				.leftJoinAndSelect('request_tasks.task', 'task');

			if (paginate.search) {
				queryBuilder.andWhere(
					'(request_tasks.title LIKE :search OR client.name LIKE :search OR client.lastName LIKE :search)',
					{
						search: `%${paginate.search}%`,
					},
				);
			}

			const requestTasks = await this.paginate(queryBuilder, paginate);

			return requestTasks;
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findOne(id: string) {
		try {
			const requestTask = await this.requestTaskRepository
				.createQueryBuilder('request_tasks')
				.leftJoinAndSelect('request_tasks.client', 'client')
				.leftJoinAndSelect('request_tasks.task', 'task')
				.where('request_tasks.id = :id', { id })
				.getOne();

			if (!requestTask) {
				throw new HttpException(
					HttpMessages.REQUEST_TASK_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}

			return this.standartResponse(requestTask);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async update(
		id: string,
		updateRequestTaskDto: UpdateRequestTaskDto,
		files: Array<Express.Multer.File>,
		user: IJwtPayload,
	) {
		try {
			const userEntity = await this.userService.findByEmail(user.email);
			let requestTask = await this.requestTaskRepository.findOneBy({
				id,
			});
			if (!requestTask) {
				throw new HttpException(
					HttpMessages.REQUEST_TASK_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}
			// TODO: [BACK] Mejorar la lógica para actualizar la solicitud de tarea y eliminar las imagenes que ya no se usen.
			const listImages = [];
			for (const b of files) {
				listImages.push(this.s3Service.uploadFile(b.originalname, b.buffer));
			}
			const uploadPromise = await Promise.all(listImages);
			requestTask = {
				...requestTask,
				...updateRequestTaskDto,
				client: userEntity,
				images: uploadPromise,
			};
			await this.requestTaskRepository.save(requestTask);
			return this.standartResponse(
				true,
				HttpStatus.NO_CONTENT,
				HttpMessages.REQUEST_TASK_UPDATED_SUCCESSULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async updateStatus(id: string, data: UpdateTaskStatusDto) {
		try {
			const requestTask = await this.requestTaskRepository.findOne({
				where: { id },
				relations: ['client'],
			});

			if (!requestTask) {
				throw new HttpException(
					HttpMessages.REQUEST_TASK_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}

			switch (data.status) {
				case RequestTaskStatusEnum.APPROVED: {
					if (requestTask.status === RequestTaskStatusEnum.REJECTED) {
						throw new HttpException(
							HttpMessages.REQUEST_TASK_REJECTED,
							HttpStatus.CONFLICT,
						);
					}

					let startDate = new Date();
					let endDate = new Date(startDate);
					endDate.setMilliseconds(endDate.getMilliseconds() + 100);

					const task: CreateTaskDto = {
						title: requestTask.title,
						description: requestTask.description,
						client: requestTask.client.id,
						status: TaskStatusEnum.TODO,
						startDate,
						endDate,
						timeEstimation: 0,
						images: requestTask.images,
						address: requestTask.address,
						location: requestTask.location,
					};

					try {
						const taskCreated = await this.taskService.create(task);
						requestTask.task = taskCreated.data;
						await this.updateRequestStatus(
							requestTask,
							RequestTaskStatusEnum.APPROVED,
						);
						const taskResponseApproved: TaskRequestResponse =
							await this.buildResponse(taskCreated.data);

						this.notificationsService.sendTaskApproved(
							[taskCreated.data.client],
							{ name: taskCreated.data.title, taskId: taskCreated.data.id },
						)

						return this.standartResponse<TaskRequestResponse>(
							taskResponseApproved,
							HttpStatus.CREATED,
							HttpMessages.TASK_CREATED_SUCCESSFULLY,
						);
					} catch (error) {
						await this.updateRequestStatus(requestTask, requestTask.status);
						throw new HttpException(
							error.message || HttpMessages.TASK_WAS_NOT_CREATED,
							error.status || HttpStatus.INTERNAL_SERVER_ERROR,
						);
					}
				}
				case RequestTaskStatusEnum.REJECTED: {
					if (requestTask.status != RequestTaskStatusEnum.REQUESTED) {
						throw new HttpException(
							HttpMessages.REQUEST_TASK_CANT_BE_UPDATED,
							HttpStatus.CONFLICT,
						);
					}

					requestTask.reasonOfCancelation = data.reason;

					const requestTaskUpdated = await this.updateRequestStatus(
						requestTask,
						RequestTaskStatusEnum.REJECTED,
					);
					const taskResponseRejected: TaskRequestResponse =
						await this.buildResponse(requestTaskUpdated.data);

					return this.standartResponse<Record<string, any>>(
						taskResponseRejected,
						HttpStatus.OK,
						HttpMessages.REQUEST_TASK_STATUS_UPDATED_SUCCESSFULLY,
					);
				}
			}
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async remove(id: string) {
		// TODO: [BACK] Mejorar la lógica para eliminar la solicitud de tarea y eliminar las imagenes que ya no se usen.
		try {
			const requestTask = await this.requestTaskRepository.findOneBy({
				id,
			});
			if (!requestTask) {
				throw new HttpException(
					HttpMessages.REQUEST_TASK_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}
			await this.requestTaskRepository.remove(requestTask);
			return this.standartResponse(
				null,
				HttpStatus.NO_CONTENT,
				HttpMessages.REQUEST_TASK_DELETED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async updateRequestStatus(requestTask: RequestTaskEntity, status: string) {
		try {
			requestTask.status = RequestTaskStatusEnum[status];
			await this.requestTaskRepository.update(requestTask.id, requestTask);

			return this.findOne(requestTask.id);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async buildResponse(task): Promise<TaskRequestResponse> {
		if (!task.client.name) {
			task.client = await this.userService.findOne(task.client.id);
		}

		let response: TaskRequestResponse = {
			id: task.id,
			title: task.title,
			description: task.description,
			status: task.status,
			images: task.images,
			address: task.address,
			location: task.location,
			client: {
				id: task.client.id,
				email: task.client.email,
				name: `${task.client.name} ${task.client.lastName}`,
				photo: task.client.photo,
			},
		};

		if (task.reasonOfCancelation) {
			response = {
				...response,
				reasonOfCancelation: task.reasonOfCancelation,
			};
		}

		return response;
	}

	async getByUser(token: string) {
		try {
			const jwtPayload: IJwtPayload = this.jwtService.decode(token);
			const user = await this.userService.findByEmail(jwtPayload.email);

			const queryBuilder = this.requestTaskRepository
				.createQueryBuilder('request_tasks')
				.leftJoinAndSelect('request_tasks.client', 'client')
				.andWhere('client.id = :id', { id: user.id });

			const requestTasks = await queryBuilder.getMany();
			return this.standartResponse(requestTasks);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findLastFive(): Promise<IBaseResponse<RequestTaskEntity[]>> {
		try {
			const requestTasks = await this.requestTaskRepository
				.createQueryBuilder('request_tasks')
				.leftJoinAndSelect('request_tasks.client', 'client') 
				.leftJoinAndSelect('request_tasks.task', 'task') 
				.orderBy('request_tasks.createdAt', 'DESC') 
				.take(5) 
				.getMany();
	
			return this.standartResponse<RequestTaskEntity[]>(
				requestTasks,
				HttpStatus.OK,
				HttpMessages.REQUEST_TASK_RETRIEVED_SUCCESSFULLY
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
	
}
