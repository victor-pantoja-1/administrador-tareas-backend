import {
	Controller,
	Get,
	Body,
	Patch,
	Param,
	Delete,
	Post,
	Query,
	UseInterceptors,
	UploadedFiles,
	Req,
} from '@nestjs/common';
import { RequestTaskService } from './request-task.service';
import { CreateRequestTaskDto } from './dto/create-request-task.dto';
import { UpdateRequestTaskDto } from './dto/update-request-task.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UpdateTaskStatusDto } from './dto/update-status.dto';
import { SystemRoutesEnum } from 'src/common/enums/routes.enum';
import { Permission } from 'src/common/decorator/permission/permission.decorator';
import { SystemActionEnum } from 'src/common/enums/action.enum';
import { Request } from 'express';
import { AuditReads } from 'src/common/decorator/audit/audit-reads.decorator';

@ApiTags(SystemRoutesEnum.REQUEST_TASK)
@Controller(SystemRoutesEnum.REQUEST_TASK)
@ApiBearerAuth()
export class RequestTaskController {
	constructor(private readonly requestTaskService: RequestTaskService) {}

	@Post()
	@Permission(SystemActionEnum.RequestTaskCreate)
	create(
		@Body() createRequestTaskDto: CreateRequestTaskDto,
		@Req() req: any,
	) {
		return this.requestTaskService.create(
			createRequestTaskDto,
			req.user,
		);
	}

	@Get()
	@AuditReads('RequestTaskEntity')
	@Permission(SystemActionEnum.RequestTaskGetAll)
	findAll(@Query() paginate: PaginationDto) {
		return this.requestTaskService.findAll(paginate);
	}

	@Get('last-five')
	@AuditReads('RequestTaskEntity')
	@Permission(SystemActionEnum.RequestTaskGetAll)
	findLastFive() {
		return this.requestTaskService.findLastFive();
	}

	@Get(':id')
	@AuditReads('RequestTaskEntity')
	@Permission(SystemActionEnum.RequestTaskGetById)
	findOne(@Param('id') id: string) {
		return this.requestTaskService.findOne(id);
	}

	@Patch(':id')
	@UseInterceptors(FilesInterceptor('files'))
	@Permission(SystemActionEnum.RequestTaskUpdate)
	update(
		@Param('id') id: string,
		@Body() updateRequestTaskDto: UpdateRequestTaskDto,
		@UploadedFiles() files: Array<Express.Multer.File>,
		@Req() req,
	) {
		return this.requestTaskService.update(
			id,
			updateRequestTaskDto,
			files,
			req.user,
		);
	}

	@Patch('uptade-status/:id')
	@Permission(SystemActionEnum.RequestTaskUpdateStatus)
	updateStatus(
		@Param('id') id: string,
		@Body() updateTaskStatusDto: UpdateTaskStatusDto,
	) {
		return this.requestTaskService.updateStatus(id, updateTaskStatusDto);
	}

	@Delete(':id')
	@Permission(SystemActionEnum.RequestTaskDelete)
	remove(@Param('id') id: string) {
		return this.requestTaskService.remove(id);
	}

	@Get('get-all/by-user')
	@AuditReads('RequestTaskEntity')
	@Permission(SystemActionEnum.RequestTaskGetAll)
	getByUser(@Req() request: Request) {
		const [_type, token] = request.headers.authorization.split(' ') || [];
		return this.requestTaskService.getByUser(token);
	}
}
