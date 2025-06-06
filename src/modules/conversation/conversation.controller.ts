import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	UseGuards,
	HttpCode,
	Query,
	Patch,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SystemRoutesEnum } from 'src/common/enums/routes.enum';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsGuard } from 'src/common/guards/permission/permission.guard';
import { SystemActionEnum } from 'src/common/enums/action.enum';
import { Permission } from 'src/common/decorator/permission/permission.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { AuditReads } from 'src/common/decorator/audit/audit-reads.decorator';

@Controller(SystemRoutesEnum.CONVERSATIONS)
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
export class ConversationController {
	constructor(private readonly conversationService: ConversationService) {}

	@HttpCode(201)
	@Post()
	@Permission(SystemActionEnum.ConversationsCreate)
	create(@Body() createConversationDto: CreateConversationDto) {
		return this.conversationService.create(createConversationDto);
	}

	@Get('paginate')
	@AuditReads('ConversationEntity')
	@Permission(SystemActionEnum.ConversationsGetAllPaginated)
	findAllPaginates(@Query() paginationDto: PaginationDto) {
		return this.conversationService.findAllPaginates(paginationDto);
	}

	@Get(':id')
	@AuditReads('ConversationEntity')
	@Permission(SystemActionEnum.ConversationsGetById)
	findOne(@Param('id') id: string) {
		return this.conversationService.findOne(id);
	}

	@Patch(':id')
	@Permission(SystemActionEnum.ConversationsUpdate)
	update(@Param('id') id: string, @Body() updateDto: UpdateConversationDto) {
		return this.conversationService.update(id, updateDto);
	}

	@Patch(':id/add-users')
	@Permission(SystemActionEnum.ConversationsUpdate)
	addUsers(
		@Param('id') conversationId: string,
		@Body('userIds') userIds: string[],
	) {
		return this.conversationService.addUsers(
			conversationId,
			userIds,
		);
	}

	@Patch(':id/remove-users')
	@Permission(SystemActionEnum.ConversationsUpdate)
	removeUsers(
		@Param('id') conversationId: string,
		@Body('userIds') userIds: string[],
	) {
		return this.conversationService.removeUsers(
			conversationId,
			userIds,
		);
	}
}
