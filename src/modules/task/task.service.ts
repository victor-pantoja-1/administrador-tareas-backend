import {
	BadRequestException,
	forwardRef,
	HttpException,
	HttpStatus,
	Inject,
	Injectable,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskEntity } from './entities/task.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { UsersService } from '../users/users.service';
import { HttpMessages } from 'src/common/enums/http-messages.enum';
import { UpdateTaskStatusDto } from './dto/update-status.dto';
import { ResponseFormatter } from 'src/common/helpers/response-formatter.service';
import { FindAllTasksDto } from './dto/find-task.dto';
import { TagService } from '../tag/tag.service';
import {
	IBaseResponse,
	IPaginationResponse,
} from 'src/common/interfaces/common/base-response';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { TaskStatusEnum } from 'src/common/enums/task-status.enum';
import { TaskEvents } from 'src/common/enums/task-events.enum';
import { TaskEventsGateway } from 'src/common/gateway/task-events/task-events.gateway';
import { FilterTaskEnum } from 'src/common/enums/filter-task.enum';
import { ConversationService } from '../conversation/conversation.service';
import { FindTasksByViewportDto } from './dto/find-task-by-viewport.dto';
import { FindTaskByCalendarDto } from './dto/find-task-by-calendar.dto';
import { UserEntity } from '../users/entities/user.entity';
import { ISendgridOptions } from 'src/common/interfaces/sendgrid/options.interface';
import { SendGridService } from 'src/common/helpers/sendgrid';
import { TRANSLATE_EMAIL } from 'src/common/constants/email.constants';
import { UpdateTaskTemplate } from 'src/common/templates/update-task.template';
import { SystemRolesEnum } from 'src/common/enums/roles.enum';
import { RoleEntity } from '../roles/entities/role.entity';
import { TaskUpdatePermissionEnum } from 'src/common/enums/task-update-permission.enum';
import { FirebaseMessagingService } from 'src/common/helpers/firebase-messaging.service';
import {
	ITaskDashboardInterface,
	ITaskStatusTotals,
} from 'src/common/interfaces/task/task.interfaces';

@Injectable()
export class TaskService extends ResponseFormatter {
	constructor(
		@InjectRepository(TaskEntity)
		private taskRepository: Repository<TaskEntity>,
		private readonly tagService: TagService,
		@Inject(forwardRef(() => UsersService))
		private readonly usersService: UsersService,
		private readonly taskEventsGateway: TaskEventsGateway,
		private readonly conversationService: ConversationService,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly sendGridService: SendGridService,
		private readonly notificationsService: FirebaseMessagingService,
	) {
		super();
	}

	async create(
		createTaskDto: CreateTaskDto,
	): Promise<IBaseResponse<TaskEntity>> {
		try {
			const client = await this.usersService.findOne(createTaskDto.client);
			const technicians = await this.usersService.validateTechnicians(
				createTaskDto.technicians,
			);
			const tags = await this.tagService.validateTags(createTaskDto.tags);
			createTaskDto.status = TaskStatusEnum.TODO;

			const timeValidation = this.validateTimeEstimation(
				createTaskDto.timeEstimation,
				createTaskDto.startDate,
				createTaskDto.endDate,
			);
			if (!timeValidation) {
				throw new HttpException(
					HttpMessages.TIME_ESTIMATION_EXCEEDS_MAX_HOURS,
					HttpStatus.BAD_REQUEST,
				);
			}
			const task = this.taskRepository.create({
				...createTaskDto,
				client: client,
				technicians: technicians,
				tags: tags,
			});

			const taskSaved = await this.taskRepository.save(task);
			this.sendUpdateTaskStatusMail(
				taskSaved.client,
				taskSaved.status,
				taskSaved.title,
			);

			const usersDashboardControl = await this.usersService.getAllControlDashboardUsers();

			const allUsers: UserEntity[] = [
				...(taskSaved.technicians?.length ? taskSaved.technicians : []), taskSaved.client,
				...usersDashboardControl,
			];

			this.notificationsService.sendTaskChangeStatus(
				allUsers,
				{ name: taskSaved.title, status: taskSaved.status, taskId: taskSaved.id }
			)

			if (taskSaved.technicians.length > 0) {
				await Promise.all(
					taskSaved.technicians.map((technician) =>
						this.sendUpdateTaskStatusMail(
							technician,
							taskSaved.status,
							taskSaved.title,
						),
					),
				);

				this.notifyAssignmentToTechnicals(
					taskSaved?.technicians || [],
					taskSaved.id,
					taskSaved.title
				)
			}

			this.taskEventsGateway.server.emit(TaskEvents.TASK_CREATED, taskSaved);

			await this.conversationService.create({
				task: taskSaved,
			});

			return this.standartResponse<TaskEntity>(
				taskSaved,
				HttpStatus.CREATED,
				HttpMessages.TASK_CREATED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findAll(query?: FindAllTasksDto, userId?: string): Promise<IBaseResponse<TaskEntity[]>> {
		try {
			if (userId) {
				const user = await this.usersService.findOne(userId);

				if (user.role.name === SystemRolesEnum.TECHNICIAN) {
					query.technicians = [user.id];
				}

				if (user.role.name === SystemRolesEnum.CLIENT) {
					query.clients = [user.id];
				}
			}

			const combinedTasks: TaskEntity[] = [];

			const baseQuery = this.taskRepository
				.createQueryBuilder('tasks')
				.leftJoinAndSelect('tasks.client', 'client')
				.leftJoinAndSelect('tasks.technicians', 'technicians')
				.leftJoinAndSelect('tasks.tags', 'tags')
				.leftJoinAndSelect('tasks.feedbacks', 'feedbacks')
				.leftJoinAndSelect('tasks.ratings', 'rating')
				.leftJoinAndSelect('rating.user', 'userId')
				.leftJoinAndSelect('userId.role', 'roleId')
				.leftJoinAndSelect('feedbacks.user', 'feedbacksUser')
				.leftJoinAndSelect('tasks.conversation', 'conversation')
				.leftJoinAndSelect('conversation.messages', 'messages')
				.leftJoinAndSelect('conversation.users', 'usersConversation')
				.leftJoinAndSelect('messages.user', 'userMessage');

			if (
				query.startDate &&
				query.endDate &&
				query.filter === FilterTaskEnum.DAY
			) {
				baseQuery
					.where('tasks.createdAt >= :startDate', {
						startDate: query.startDate,
					})
					.andWhere('tasks.createdAt <= :endDate', { endDate: query.endDate });
			} else if (
				query.startDate &&
				query.endDate &&
				query.filter === FilterTaskEnum.UPDATE
			) {
				baseQuery
					.where('tasks.updatedAt >= :startDate', {
						startDate: query.startDate,
					})
					.andWhere('tasks.updatedAt <= :endDate', { endDate: query.endDate });
			} else if (
				query.startDate &&
				query.endDate &&
				query.filter === FilterTaskEnum.ENDDATE
			) {
				baseQuery
					.where('tasks.endDate >= :startDate', { startDate: query.startDate })
					.andWhere('tasks.endDate <= :endDate', { endDate: query.endDate });
			} else {
				baseQuery
					.where('tasks.startDate >= :startDate', {
						startDate: query.startDate,
					})
					.andWhere('tasks.startDate <= :endDate', { endDate: query.endDate });
			}

			if (query.technicians && query.technicians.length > 0) {
				const tasksByTechnicians = baseQuery.where(
					'technicians.id IN (:...technicians)',
					{
						technicians: query.technicians,
					},
				);

				if (query.search) {
					baseQuery.andWhere(
						'tasks.title LIKE :searchQuery OR tasks.description LIKE :searchQuery OR tasks.id LIKE :searchId',
						{
							searchQuery: `%${query.search}%`,
							searchId: `%${query.search}%`,
						},
					);
				}

				this.putPendingsFilter(query?.pendings, baseQuery);

				const tasks =
					await this.selectColumns<TaskEntity[]>(tasksByTechnicians);
				combinedTasks.push(...tasks);
			}

			if (query.tags && query.tags.length > 0) {
				const tasksByTags = baseQuery.where('tags.id IN (:...tags)', {
					tags: query.tags,
				});

				if (query.search) {
					baseQuery.andWhere(
						'tasks.title LIKE :searchQuery OR tasks.description LIKE :searchQuery OR tasks.id LIKE :searchId',
						{
							searchQuery: `%${query.search}%`,
							searchId: `%${query.search}%`,
						},
					);
				}

				const tasks = await this.selectColumns<TaskEntity[]>(tasksByTags);
				combinedTasks.push(...tasks);
			}

			if (query.clients && query.clients.length > 0) {
				const tasksByClients = baseQuery.where('client.id IN (:...clients)', {
					clients: query.clients,
				});

				if (query.search) {
					baseQuery.andWhere(
						'tasks.title LIKE :searchQuery OR tasks.description LIKE :searchQuery OR tasks.id LIKE :searchId',
						{
							searchQuery: `%${query.search}%`,
							searchId: `%${query.search}%`,
						},
					);
				}

				this.putPendingsFilter(query?.pendings, baseQuery);

				const tasks = await this.selectColumns<TaskEntity[]>(tasksByClients);
				combinedTasks.push(...tasks);
			}

			if (query.search && !query.technicians && !query.tags && !query.clients) {
				baseQuery.andWhere(
					'tasks.title LIKE :searchQuery OR tasks.description LIKE :searchQuery OR tasks.id LIKE :searchId',
					{
						searchQuery: `%${query.search}%`,
						searchId: `%${query.search}%`,
					},
				);
			}

			if (combinedTasks.length === 0) {
				const tasks = await this.selectColumns<TaskEntity[]>(baseQuery);
				if (tasks.length === 0) {
					throw new HttpException(
						HttpMessages.TASKS_NOT_FOUND,
						HttpStatus.NOT_FOUND,
					);
				}
				combinedTasks.push(...tasks);
			}

			const uniqueTasks = combinedTasks.reduce((unique, task) => {
				if (!unique.some((t) => t.id === task.id)) {
					unique.push(task);
				}
				return unique;
			}, []);

			if (!uniqueTasks.length) {
				throw new HttpException(
					HttpMessages.TASKS_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}

			return this.standartResponse<TaskEntity[]>(
				uniqueTasks,
				HttpStatus.OK,
				HttpMessages.TASKS_RETRIEVED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	private putPendingsFilter(pendings: string, baseQuery: any) {
		if (pendings === 'true') {
			baseQuery.andWhere('tasks.status IN (:...status)', {
				status: [TaskStatusEnum.TODO, TaskStatusEnum.IN_PROGRESS],
			})
		}
	}

	async findAllPaginates(
		paramPaginate: PaginationDto,
	): Promise<IPaginationResponse<TaskEntity>> {
		const query = this.taskRepository
			.createQueryBuilder('tasks')
			.leftJoinAndSelect('tasks.technicians', 'technicians')
			.leftJoinAndSelect('tasks.client', 'client')
			.leftJoinAndSelect('tasks.feedbacks', 'feedbacks')
			.leftJoinAndSelect('tasks.tags', 'tags')
			.leftJoinAndSelect('tasks.ratings', 'rating')
			.leftJoinAndSelect('rating.user', 'userId')			
			.leftJoinAndSelect('userId.role', 'roleId')
			.leftJoinAndSelect('feedbacks.user', 'feedbacksUser')
			.select([
				'tasks.id',
				'tasks.title',
				'tasks.description',
				'tasks.address',
				'tasks.status',
				'tasks.startDate',
				'tasks.endDate',
				'technicians.id',
				'technicians.name',
				'technicians.lastName',
				'technicians.email',
				'technicians.photo',
				'client.id',
				'client.name',
				'client.lastName',
				'client.email',
				'client.photo',
				'tags.id',
				'tags.name',
				'rating.id',
				'rating.rating',
				'userId.id',
				'userId.name',
				'userId.lastName',
				'userId.email',
				'userId.photo',
				'roleId.name',
				'rating.comment',
				'rating.images',
			]);
		const tasks = this.paginate<TaskEntity>(
			query,
			paramPaginate,
			HttpStatus.OK,
			HttpMessages.TASKS_RETRIEVED_SUCCESSFULLY,
		);
		if (!(await tasks)) {
			throw new HttpException(
				HttpMessages.TASKS_NOT_FOUND,
				HttpStatus.NOT_FOUND,
			);
		}
		return tasks;
	}

	async findOne(id: string): Promise<IBaseResponse<TaskEntity>> {
		try {
			const query = this.taskRepository
				.createQueryBuilder('tasks')
				.leftJoinAndSelect('tasks.technicians', 'technicians')
				.leftJoinAndSelect('tasks.client', 'client')
				.leftJoinAndSelect('tasks.feedbacks', 'feedbacks')
				.leftJoinAndSelect('tasks.tags', 'tags')
				.leftJoinAndSelect('tasks.ratings', 'rating')
				.leftJoinAndSelect('rating.user', 'userId')
				.leftJoinAndSelect('userId.role', 'roleId')
				.leftJoinAndSelect('feedbacks.user', 'feedbacksUser')
				.leftJoinAndSelect('tasks.conversation', 'conversation')
				.leftJoinAndSelect('conversation.messages', 'messages')
				.leftJoinAndSelect('conversation.users', 'usersConversation')
				.leftJoinAndSelect('messages.user', 'userMessage')
				.where('tasks.id = :id', { id });

			const result = await this.selectColumns<TaskEntity>(query, true);

			if (!result) {
				throw new HttpException(
					HttpMessages.TASKS_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}

			return this.standartResponse<TaskEntity>(
				result,
				HttpStatus.OK,
				HttpMessages.TASKS_RETRIEVED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async update(
		id: string,
		updateTaskDto: UpdateTaskDto,
	): Promise<IBaseResponse<boolean>> {
		try {
			if (updateTaskDto.status) {
				delete updateTaskDto.status;
			}
			const client = await this.usersService.findOne(updateTaskDto.client);

			const newTechnicians = await this.usersService.validateTechnicians(
				updateTaskDto.technicians,
			);

			const tags = await this.tagService.validateTags(updateTaskDto.tags);

			let task = await this.taskRepository.findOne({
				where: { id },
				relations: ['client', 'technicians', 'conversation'],
			});

			if (updateTaskDto.client && task.client.id !== updateTaskDto.client) {
				throw new HttpException(
					HttpMessages.CLIENT_SHOULD_BE_THE_SAME,
					HttpStatus.FORBIDDEN,
				);
			}

			if (!task) {
				throw new HttpException(
					HttpMessages.TASKS_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}
			if (
				updateTaskDto.startDate &&
				updateTaskDto.endDate &&
				updateTaskDto.timeEstimation
			) {
				const timeValidation = this.validateTimeEstimation(
					updateTaskDto.timeEstimation,
					updateTaskDto.startDate,
					updateTaskDto.endDate,
				);
				if (!timeValidation) {
					throw new HttpException(
						HttpMessages.TIME_ESTIMATION_EXCEEDS_MAX_HOURS,
						HttpStatus.BAD_REQUEST,
					);
				}
			}

			const currentTechnicians = task.technicians.map((tech) => tech.id);

			const techniciansToAdd = newTechnicians.filter(
				(technician) => !currentTechnicians.includes(technician.id),
			);

			const techniciansToRemove = task.technicians.filter(
				(technician) => !updateTaskDto.technicians.includes(technician.id),
			);

			if (techniciansToAdd.length > 0) {
				await this.conversationService.addUsers(
					task.conversation.id,
					techniciansToAdd.map((technician) => technician.id),
				);
			}

			if (techniciansToRemove.length > 0) {
				await this.conversationService.removeUsers(
					task.conversation.id,
					techniciansToRemove.map((technician) => technician.id),
				);
			}

			task = {
				...task,
				...updateTaskDto,
				client: task.client,
				technicians: newTechnicians,
				tags: tags,
			};

			const saved = await this.taskRepository.save(task);

			this.notifyAssignmentToTechnicals(techniciansToAdd || [], saved.id, saved.title);

			this.taskEventsGateway.server.emit(TaskEvents.TASKS_UPDATED);

			return this.standartResponse<boolean>(
				true,
				HttpStatus.OK,
				HttpMessages.TASK_UPDATED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	private notifyAssignmentToTechnicals(technicians: UserEntity[], taskId: string, name: string) {
		if (technicians.length > 0) {
			this.notificationsService.sendTaskAssignation(technicians || [], { name, taskId })
		}

		return;
	}

	async updateStatus(
		userId: string,
		taskId: string,
		updateTaskStatusDto: UpdateTaskStatusDto,
	): Promise<IBaseResponse<boolean>> {
		try {
			const user = await this.getUserWithRole(userId);
			const task = await this.getTask(taskId);

			this.validateStatusChange(
				user.role,
				task.status,
				updateTaskStatusDto.status,
			);
			await this.taskRepository.update(taskId, {
				status: updateTaskStatusDto.status,
			});

			await this.notifyStatusChange(taskId);

			return this.standartResponse<boolean>(
				true,
				HttpStatus.OK,
				HttpMessages.TASK_STATUS_UPDATED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async remove(id: string): Promise<IBaseResponse<boolean>> {
		try {
			const task = await this.taskRepository.findOne({
				where: { id },
			});

			if (!task) {
				throw new HttpException(
					HttpMessages.TASK_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}

			this.taskRepository.remove(task);
			this.taskEventsGateway.server.emit(TaskEvents.TASKS_DELETED, id);
			return this.standartResponse<boolean>(
				true,
				HttpStatus.NO_CONTENT,
				HttpMessages.TASK_DELETED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async selectColumns<T>(
		queryBuilder: SelectQueryBuilder<TaskEntity>,
		getOne: boolean = false,
	): Promise<T> {
		queryBuilder.select([
			'tasks.id',
			'tasks.title',
			'tasks.description',
			'tasks.status',
			'tasks.startDate',
			'tasks.endDate',
			'tasks.timeEstimation',
			'tasks.images',
			'tasks.location',
			'tasks.createdAt',
			'tasks.updatedAt',
			'tasks.address',
			'technicians.id',
			'technicians.name',
			'technicians.lastName',
			'technicians.email',
			'technicians.photo',
			'client.id',
			'client.name',
			'client.lastName',
			'client.email',
			'client.photo',
			'feedbacks.id',
			'feedbacks.content',
			'feedbacksUser.id',
			'feedbacksUser.name',
			'feedbacksUser.lastName',
			'tags.id',
			'tags.name',
			'rating.id',
			'rating.rating',
			'userId.id',
			'userId.name',
			'userId.lastName',
			'userId.email',
			'userId.photo',
			'roleId.name',
			'rating.comment',
			'rating.images',
			'conversation.id',
			'usersConversation.id',
			'usersConversation.name',
			'usersConversation.lastName',
			'messages.id',
			'messages.user',
			'messages.message',
			'messages.createdAt',
			'userMessage.id',
			'userMessage.name',
			'userMessage.lastName',
			'userMessage.email',
			'userMessage.photo',
		]);
		if (getOne) {
			return (await queryBuilder.getOne()) as T;
		} else {
			return (await queryBuilder.getMany()) as T;
		}
	}

	async findTasksInViewport(
		query: FindTasksByViewportDto,
	): Promise<IBaseResponse<TaskEntity[]>> {
		try {
			const {
				neLat,
				neLng,
				swLat,
				swLng,
				startDate,
				endDate,
				technicians,
				status,
			} = query;

			const baseQuery = this.taskRepository
				.createQueryBuilder('tasks')
				.leftJoinAndSelect('tasks.client', 'client')
				.leftJoinAndSelect('tasks.technicians', 'technicians')
				.where(
					'CAST(JSON_EXTRACT(tasks.location, "$.latitude") AS DECIMAL(10,7)) BETWEEN :swLat AND :neLat',
					{ swLat, neLat },
				)
				.andWhere(
					'CAST(JSON_EXTRACT(tasks.location, "$.longitude") AS DECIMAL(10,7)) BETWEEN :swLng AND :neLng',
					{ swLng, neLng },
				);

			this.applyDateFilter(baseQuery, startDate, endDate);
			this.applyTechnicianFilter(baseQuery, technicians);
			this.applyStatusFilter(baseQuery, status);

			const tasks = await baseQuery.getMany();

			return this.standartResponse<TaskEntity[]>(
				tasks,
				HttpStatus.OK,
				HttpMessages.TASKS_RETRIEVED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
	async findTasksByCalendar(
		userId: string,
		calendarDto: FindTaskByCalendarDto,
	): Promise<IBaseResponse<TaskEntity[]>> {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new HttpException(
					HttpMessages.USER_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}

			if (user.role.name === SystemRolesEnum.TECHNICIAN) {
				calendarDto.technicians = [user.id];
			}

			const query = this.taskRepository
				.createQueryBuilder('tasks')
				.leftJoinAndSelect('tasks.client', 'client')
				.leftJoinAndSelect('tasks.technicians', 'technicians')
				.leftJoinAndSelect('tasks.tags', 'tags')
				.leftJoinAndSelect('tasks.feedbacks', 'feedbacks')
				.leftJoinAndSelect('tasks.ratings', 'rating')
				.leftJoinAndSelect('feedbacks.user', 'feedbacksUser');

			this.applyDateFilters(query, calendarDto);

			this.applyTechnicianFilter(query, calendarDto.technicians);

			this.applyStatusFilter(query, calendarDto.status); 

			const tasks = await query.getMany();

			return this.standartResponse<TaskEntity[]>(
				tasks,
				HttpStatus.OK,
				HttpMessages.TASKS_RETRIEVED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findTotalLastSevenDaysTasksByStatus(): Promise<
		IBaseResponse<ITaskDashboardInterface>
	> {
		try {
			const now = new Date();
			const startDate = new Date(now);
			startDate.setDate(now.getDate() - 6);

			startDate.setHours(0, 0, 0, 0);
			now.setHours(23, 59, 59, 999);

			const baseQuery = this.taskRepository
				.createQueryBuilder('tasks')
				.leftJoinAndSelect('tasks.client', 'client') 

			this.applyDateFilter(baseQuery, startDate.toISOString(), now.toISOString());
			const tasksInRange = await baseQuery.getMany();

			const totals: ITaskDashboardInterface = {
				totalsByDays: [],
				clients: 0,
				totals: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
			};

			const uniqueClients = new Set<string>();

			const dailyTaskCounts: { [key: string]: ITaskStatusTotals } = {};

			for (let i = 0; i < 7; i++) {
				const currentDay = new Date(startDate);
				currentDay.setDate(startDate.getDate() + i);
				const dayKey = currentDay.toISOString().split('T')[0];
				dailyTaskCounts[dayKey] = {
					TODO: 0,
					IN_PROGRESS: 0,
					DONE: 0,
					date: new Date(currentDay),
				};
			}

			tasksInRange.forEach((task) => {
				const taskDate = task.startDate.toISOString().split('T')[0];
				if (dailyTaskCounts[taskDate]) {
					dailyTaskCounts[taskDate][task.status]++;
				}
				totals.totals[task.status]++;
				uniqueClients.add(task.client.id);
			});

			totals.totalsByDays = Object.values(dailyTaskCounts);

			totals.clients = uniqueClients.size;

			return this.standartResponse<ITaskDashboardInterface>(
				totals,
				HttpStatus.OK,
				HttpMessages.TASKS_RETRIEVED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	private filterByUserRole(
		query: SelectQueryBuilder<TaskEntity>,
		userRole: string,
		userId: string,
	) {
		switch (userRole) {
			case SystemRolesEnum.TECHNICIAN:
				query.andWhere('technicians.id = :userId', { userId });
				break;
			case SystemRolesEnum.CLIENT:
				query.andWhere('client.id = :userId', { userId });
				break;
			case SystemRolesEnum.ADMIN:
			case SystemRolesEnum.SUPER_ADMIN:
			case SystemRolesEnum.SUPERVISOR:
				break;
			default:
				throw new HttpException(
					HttpMessages.USER_NOT_AUTHORIZED,
					HttpStatus.FORBIDDEN,
				);
		}
	}

	private applyDateFilters(
		query: SelectQueryBuilder<TaskEntity>,
		calendarDto: FindTaskByCalendarDto,
	) {
		const { date, startDate, endDate, year, month } = calendarDto;

		if (date) {
			const formattedDate = this.formatDateString(date);
			query.andWhere(
				'DATE(tasks.startDate) <= :date AND (DATE(tasks.endDate) IS NULL OR DATE(tasks.endDate) >= :date)',
				{ date: formattedDate },
			);
		}

		if (year) {
			query.andWhere('YEAR(tasks.startDate) = :year', { year });
		}

		if (month) {
			query.andWhere('MONTH(tasks.startDate) = :month', { month });
		}

		if (startDate && endDate) {
			this.validateDateRange(startDate, endDate);
			const formattedStartDate = this.formatDateString(startDate);
			const formattedEndDate = this.formatDateString(endDate);
			query.andWhere(
				'(DATE(tasks.startDate) <= :endDate AND (DATE(tasks.endDate) IS NULL OR DATE(tasks.endDate) >= :startDate))',
				{ startDate: formattedStartDate, endDate: formattedEndDate },
			);
		}
	}

	private validateDateRange(
		startDate: string,
		endDate: string,
		notEquals: boolean = true,
	) {
		const start = new Date(startDate);
		const end = new Date(endDate);

		if (isNaN(start.getTime())) {
			throw new BadRequestException(HttpMessages.INVALID_DATE);
		}

		if (isNaN(end.getTime())) {
			throw new BadRequestException(HttpMessages.INVALID_DATE);
		}

		if (end < start) {
			throw new BadRequestException(HttpMessages.INVALID_DATE);
		}
		if (notEquals && start === end) {
			throw new BadRequestException(HttpMessages.INVALID_DATE);
		}
	}

	private formatDateString(date: string): string {
		const parsedDate = new Date(date);
		if (isNaN(parsedDate.getTime())) {
			throw new BadRequestException(HttpMessages.INVALID_DATE);
		}
		return parsedDate.toISOString().split('T')[0];
	}

	async sendUpdateTaskStatusMail(
		user: UserEntity,
		newStatus: TaskStatusEnum,
		title: string,
	) {
		const translate = TRANSLATE_EMAIL['es'];
		const template = UpdateTaskTemplate(user, 'es', newStatus, title);
		const sendgridOptions: ISendgridOptions = {
			to: user.email,
			subject: ` ${translate.TASK_STATUS_UPDATED_SUBJECT}`,
			template,
		};

		await this.sendGridService.sendMail(sendgridOptions);
	}

	private async getUserWithRole(userId: string): Promise<UserEntity> {
		const user = await this.userRepository.findOne({
			where: { id: userId },
			relations: ['role', 'role.permissions'],
		});
		if (!user) {
			throw new HttpException(
				HttpMessages.USER_NOT_FOUND,
				HttpStatus.NOT_FOUND,
			);
		}
		return user;
	}

	private async getTask(taskId: string): Promise<TaskEntity> {
		const task = await this.taskRepository.findOne({
			where: { id: taskId },
			relations: ['client', 'technicians'],
		});
		if (!task) {
			throw new HttpException(
				HttpMessages.TASK_NOT_FOUND,
				HttpStatus.NOT_FOUND,
			);
		}
		if (!task.client || task.technicians.length === 0) {
			throw new HttpException(
				HttpMessages.CLIENT_OR_TECHNICIAN_NOT_FOUND,
				HttpStatus.NOT_FOUND,
			);
		}
		return task;
	}

	private validateStatusChange(
		role: RoleEntity,
		currentStatus: TaskStatusEnum,
		newStatus: TaskStatusEnum,
	): void {
		const canUpdateStatus =
			(currentStatus === TaskStatusEnum.TODO &&
				newStatus === TaskStatusEnum.IN_PROGRESS &&
				role.permissions.some(
					(permission) =>
						permission.target === TaskUpdatePermissionEnum.UPDATE_FORWARD,
				)) ||
			(currentStatus === TaskStatusEnum.IN_PROGRESS &&
				newStatus === TaskStatusEnum.DONE &&
				role.permissions.some(
					(permission) =>
						permission.target === TaskUpdatePermissionEnum.UPDATE_FORWARD,
				)) ||
			(currentStatus === TaskStatusEnum.IN_PROGRESS &&
				newStatus === TaskStatusEnum.TODO &&
				role.permissions.some(
					(permission) =>
						permission.target === TaskUpdatePermissionEnum.UPDATE_BACKWARD,
				)) ||
			([TaskStatusEnum.TODO, TaskStatusEnum.IN_PROGRESS].includes(
				currentStatus,
			) &&
				newStatus === TaskStatusEnum.ARCHIVED &&
				role.permissions.some(
					(permission) =>
						permission.target === TaskUpdatePermissionEnum.UPDATE_BACKWARD,
				)) ||
			(currentStatus === TaskStatusEnum.ARCHIVED &&
				[TaskStatusEnum.TODO].includes(newStatus) &&
				role.permissions.some(
					(permission) =>
						permission.target === TaskUpdatePermissionEnum.UPDATE_BACKWARD,
				));

		if (!canUpdateStatus) {
			throw new HttpException(
				HttpMessages.TASK_STATUS_UPDATE_NOT_AUTHORIZED,
				HttpStatus.FORBIDDEN,
			);
		}
	}

	private async notifyStatusChange(taskId: string): Promise<void> {
		const updatedTask = await this.taskRepository.findOne({
			where: { id: taskId },
			relations: ['client', 'technicians'],
		});

		const usersDashboardControl = await this.usersService.getAllControlDashboardUsers();

		const allUsers: UserEntity[] = [
			...(updatedTask.technicians?.length ? updatedTask.technicians : []), updatedTask.client,
			...usersDashboardControl,
		];

		this.notificationsService.sendTaskChangeStatus(
			allUsers,
			{ name: updatedTask.title, status: updatedTask.status, taskId },
		)

		this.sendUpdateTaskStatusMail(
			updatedTask.client,
			updatedTask.status,
			updatedTask.title,
		);

		if (updatedTask.technicians.length > 0) {
			await Promise.all(
				updatedTask.technicians.map((technician) =>
					this.sendUpdateTaskStatusMail(
						technician,
						updatedTask.status,
						updatedTask.title,
					),
				),
			);
		}

		this.taskEventsGateway.server.emit(TaskEvents.TASKS_UPDATED);
	}

	private applyDateFilter(
		baseQuery: SelectQueryBuilder<TaskEntity>,
		startDate?: string,
		endDate?: string,
	) {
		if (startDate && endDate) {
			this.validateDateRange(startDate, endDate, false);
			const formattedStartDate = this.formatDateString(startDate);
			const formattedEndDate = this.formatDateString(endDate);
			baseQuery.andWhere(
				'(DATE(tasks.startDate) <= :endDate AND (DATE(tasks.endDate) IS NULL OR DATE(tasks.endDate) >= :startDate))',
				{ startDate: formattedStartDate, endDate: formattedEndDate },
			);
		}
	}

	private applyTechnicianFilter(
		baseQuery: SelectQueryBuilder<TaskEntity>,
		technicians?: string[],
	) {
		if (technicians && technicians.length > 0) {
			baseQuery.andWhere('technicians.id IN (:...technicians)', {
				technicians,
			});
		}
	}

	private applyStatusFilter(
		baseQuery: SelectQueryBuilder<TaskEntity>,
		status?: string,
	) {
		if (status) {
			baseQuery.andWhere('tasks.status = :status', { status });
		}
	}

	private validateTimeEstimation(
		timeEstimation: number,
		startDate: Date,
		endDate: Date,
	): boolean {
		const start = new Date(startDate);
		const end = new Date(endDate);

		if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
			return false;
		}
		const millisecondsInADay = 1000 * 60 * 60 * 24;
		const totalDays = Math.ceil(
			(end.getTime() - start.getTime()) / millisecondsInADay,
		);
		const maxHours = totalDays * 8;
		return timeEstimation <= maxHours;
	}
}
