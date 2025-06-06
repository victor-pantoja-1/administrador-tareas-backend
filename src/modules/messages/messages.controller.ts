import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Req,
	Query,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageStatusDto } from './dto/update-message-status.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IJwtPayload } from 'src/common/interfaces/auth/jwt-payload.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SystemRoutesEnum } from 'src/common/enums/routes.enum';
import { SystemActionEnum } from 'src/common/enums/action.enum';
import { Permission } from 'src/common/decorator/permission/permission.decorator';
import { ChatEntity } from '../chat/entities/chat.entity';
import { AuditReads } from 'src/common/decorator/audit/audit-reads.decorator';

@ApiTags('messages')
@Controller(SystemRoutesEnum.MESSAGES)
@ApiBearerAuth()
export class MessagesController {
	constructor(private readonly messagesService: MessagesService) {}

	@Post()
	create(@Body() createMessageDto: CreateMessageDto, @Req() { user }: { user: IJwtPayload }, usersInChat: ChatEntity[]) {
		return this.messagesService.create(createMessageDto, user, usersInChat);
	}

	@Get('conversation/:conversationId')
	@AuditReads('ConversationEntity')
	@Permission(SystemActionEnum.MessagesGetAllPaginated)
	async getMessagesByConversationPaginated(
		@Req() req,
		@Param('conversationId') conversationId: string,
		@Query() paginationDto: PaginationDto,
	) {
		const userId = req.user.id;
		return this.messagesService.getMessagesByConversationPaginated(
			userId,
			conversationId,
			paginationDto,
		);
	}

	@Patch('status/:id')
	@AuditReads('MessageEntity')
	@Permission(SystemActionEnum.MessageUpdateStatus)
	async updateMessageStatus(
		@Param('id') id: string,
		@Body() updateMessageStatusDto: UpdateMessageStatusDto,
		@Req() req
	) {
		const userId = req.user.id;
		return this.messagesService.updateMessageStatus(
			userId,
			id,
			updateMessageStatusDto,
		);
	}
}
