import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	HttpCode,
	Query,
	UseGuards,
	Req,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UpdateTaskStatusDto } from './dto/update-status.dto';
import { FindAllTasksDto } from './dto/find-task.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Permission } from 'src/common/decorator/permission/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permission/permission.guard';
import { SystemRoutesEnum } from 'src/common/enums/routes.enum';
import { SystemActionEnum } from 'src/common/enums/action.enum';
import { FindTasksByViewportDto } from './dto/find-task-by-viewport.dto';
import { FindTaskByCalendarDto } from './dto/find-task-by-calendar.dto';
import { AuditReads } from 'src/common/decorator/audit/audit-reads.decorator';

@ApiTags('tasks')
@Controller(SystemRoutesEnum.TASKS)
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
export class TaskController {
	constructor(private readonly taskService: TaskService) {}

	@HttpCode(201)
	@Post()
	@Permission(SystemActionEnum.TasksCreate)
	create(@Body() createTaskDto: CreateTaskDto) {
		return this.taskService.create(createTaskDto);
	}

	@Get()
	@AuditReads('TaskEntity')
	@Permission(SystemActionEnum.TasksGetAll)
	findAll(@Req() req, @Query() params?: FindAllTasksDto) {
		const userId = req.user.id;
		return this.taskService.findAll(params, userId);
	}

	@Get('paginate')
	@AuditReads('TaskEntity')
	@Permission(SystemActionEnum.TasksGetAllPaginated)
	findAllPaginates(@Query() paginationDto: PaginationDto) {
		return this.taskService.findAllPaginates(paginationDto);
	}

	@Get('calendar')
	@AuditReads('TaskEntity')
	@Permission(SystemActionEnum.TasksGetAll)
	getTasksByCalendar(@Req() req, @Query() calendarDto: FindTaskByCalendarDto) {
		const userId = req.user.id;
		return this.taskService.findTasksByCalendar(userId, calendarDto);
	}

	@Get('viewport')
	@AuditReads('TaskEntity')
	@Permission(SystemActionEnum.TasksGetAll)
	async getTasksByLocation(@Query() params: FindTasksByViewportDto) {
		return await this.taskService.findTasksInViewport(params);
	}

	@Get('dashboard')
	@AuditReads('TaskEntity')
	@Permission(SystemActionEnum.TasksGetAll)
	async findTotalLastSevenDaysTasksByStatus() {
		return await this.taskService.findTotalLastSevenDaysTasksByStatus();
	}

	@Get(':id')
	@AuditReads('TaskEntity')
	@Permission(SystemActionEnum.TasksGetById)
	findOne(@Param('id') id: string) {
		return this.taskService.findOne(id);
	}

	@Patch(':id')
	@Permission(SystemActionEnum.TasksUpdate)
	update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
		return this.taskService.update(id, updateTaskDto);
	}

	@Patch('update-status/:id')
	@Permission(SystemActionEnum.TasksUpdateStatus)
	updateStatus(
		@Req() req,
		@Param('id') taskId: string,
		@Body() updateTaskStatusDto: UpdateTaskStatusDto,
	) {
		const userId = req.user.id;
		return this.taskService.updateStatus(userId, taskId, updateTaskStatusDto);
	}

	@Delete(':id')
	@Permission(SystemActionEnum.TasksDelete)
	remove(@Param('id') id: string) {
		return this.taskService.remove(id);
	}
}
