import {
	ForbiddenException,
	HttpException,
	HttpStatus,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MessageEntity } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { IJwtPayload } from 'src/common/interfaces/auth/jwt-payload.interface';
import { ConversationEntity } from '../conversation/entities/conversation.entity';
import { UserEntity } from '../users/entities/user.entity';
import { MessageReadStatusEntity } from './entities/message-read-status.entity';
import { CreateMessageResponse } from 'src/common/interfaces/messages/create-message-response.interface';
import { UpdateMessageStatusDto } from './dto/update-message-status.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import {
	IBaseResponse,
	IPaginationResponse,
} from 'src/common/interfaces/common/base-response';
import { ResponseFormatter } from 'src/common/helpers/response-formatter.service';
import { HttpMessages } from 'src/common/enums/http-messages.enum';
import { ChatEntity } from '../chat/entities/chat.entity';

@Injectable()
export class MessagesService extends ResponseFormatter {
	private readonly logger = new Logger(MessagesService.name);

	constructor(
		@InjectRepository(MessageEntity)
		private readonly messageRepository: Repository<MessageEntity>,
		@InjectRepository(ConversationEntity)
		private readonly conversationRepository: Repository<ConversationEntity>,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		@InjectRepository(MessageReadStatusEntity)
		private readonly messageReadStatusRepository: Repository<MessageReadStatusEntity>,
	) {
		super();
	}

	async create(
		createMessageDto: CreateMessageDto,
		req: IJwtPayload, usersInChat: ChatEntity[]
	): Promise<CreateMessageResponse> {
		const { conversationId, message } = createMessageDto;

		try {
			const conversation = await this.conversationRepository.findOne({
				where: { id: conversationId },
				relations: ['users'],
			});

			if (!conversation) {
				throw new Error('Conversation not found');
			}

			const user = await this.userRepository.findOne({
				where: { id: req.id },
				relations: ['role'],
			});

			if (!user) {
				throw new Error('User not found');
			}

			const userInConversation = conversation.users.some(
				(conversationUser) => conversationUser.id === req.id,
			);

			const allowedRoles = ['supervisor', 'admin', 'superAdmin'];
			const userHasAllowedRole = allowedRoles.includes(user.role.name);

			if (!userInConversation && !userHasAllowedRole) {
				throw new Error(
					'User not authorized to create messages in this conversation',
				);
			}

			const newMessage = this.messageRepository.create({
				conversation: { id: conversationId },
				message,
				user: { id: req.id },
			});

			const savedMessage = await this.messageRepository.save(newMessage);

			const usersInChatIds = usersInChat?.map(userChat => userChat.user.id) || [];

			for (const conversationUser of conversation.users) {
				const isUserInChat = usersInChatIds.includes(conversationUser.id);
				await this.messageReadStatusRepository.save(
					this.messageReadStatusRepository.create({
						message: savedMessage,
						user: conversationUser,
						isRead: conversationUser.id === req.id || isUserInChat, 
					}),
				);
			}
			
			savedMessage.user = {
				id: user.id,
				name: user.name,
				lastName: user.lastName,
				photo: user.photo,
			} as UserEntity;

			return { message: savedMessage, users: conversation.users };
		} catch (error) {
			this.logger.error('Error creating message', error.stack);
			return {
				message: null,
				users: [],
				error: error.message || 'Internal Server Error',
			};
		}
	}

	async countUnreadMessages(
		userId: string,
		conversationId: string,
	): Promise<number> {
		return this.messageReadStatusRepository
			.createQueryBuilder('messageReadStatus')
			.leftJoin('messageReadStatus.message', 'message')
			.leftJoin('message.conversation', 'conversation')
			.where('messageReadStatus.userId = :userId', { userId })
			.andWhere('conversation.id = :conversationId', { conversationId })
			.andWhere('messageReadStatus.isRead = false')
			.andWhere('message.isDeleted = false')
			.getCount();
	}

	async getMessagesByConversation(userId: string, conversationId: string) {
		const conversation = await this.conversationRepository.findOne({
			where: { id: conversationId },
			relations: ['users'],
		});

		if (!conversation) {
			throw new NotFoundException('Conversation not found');
		}

		const userInConversation = conversation.users.some(
			(conversationUser) => conversationUser.id === userId,
		);

		if (!userInConversation) {
			throw new ForbiddenException(
				'User not authorized to view messages in this conversation',
			);
		}

		const messages = await this.messageRepository.find({
			where: { conversation: { id: conversationId } },
			order: { createdAt: 'DESC' },
			relations: ['user'],
		});

		return messages.map((message) => ({
			id: message.id,
			message: message.message,
			createdAt: message.createdAt,
			user: {
				id: message.user.id,
				name: message.user.name,
				lastName: message.user.lastName,
				email: message.user.email,
				photo: message.user.photo,
			},
		}));
	}

	async getMessagesByConversationPaginated(
		userId: string,
		conversationId: string,
		paginationDto: PaginationDto,
	): Promise<IPaginationResponse<MessageEntity>> {
		try {
			const conversation = await this.conversationRepository.findOne({
				where: { id: conversationId },
				relations: ['users'],
			});

			if (!conversation) {
				throw new HttpException(
					HttpMessages.CONVERSATION_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}

			const userInConversation = conversation.users.some(
				(conversationUser) => conversationUser.id === userId,
			);

			if (!userInConversation) {
				throw new HttpException(
					HttpMessages.USER_NOT_AUTHORIZED,
					HttpStatus.FORBIDDEN,
				);
			}

			const query = this.messageRepository
				.createQueryBuilder('messages')
				.where('messages.conversation.id = :conversationId', { conversationId })
				.andWhere('messages.isDeleted = :isDeleted', { isDeleted: false })
				.leftJoinAndSelect('messages.user', 'user')
				.leftJoinAndSelect('user.role', 'role')
				.orderBy('messages.createdAt', 'DESC')
				.select([
					'messages.id',
					'messages.message',
					'messages.createdAt',
					'messages.isDeleted',
					'user.id',
					'user.name',
					'user.lastName',
					'user.email',
					'user.photo',
					'role.name',
				]);

			if (paginationDto.search) {
				query.andWhere('messages.message LIKE :search', {
					search: `%${paginationDto.search}%`,
				});
			}

			const messagesPaginated = await this.paginate<MessageEntity>(
				query,
				paginationDto,
				HttpStatus.OK,
				HttpMessages.MESSAGE_RETRIEVED_SUCCESSFULLY,
			);

			if (!messagesPaginated) {
				throw new HttpException(
					HttpMessages.MESSAGE_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}

			const messages = messagesPaginated.data;

			const unreadMessageIds = messages
				.map((message) => message.id)
				.filter(async (messageId) => {
					const readStatus = await this.messageReadStatusRepository.findOne({
						where: {
							message: { id: messageId },
							user: { id: userId },
							isRead: false,
						},
					});
					return !!readStatus;
				});

			if (unreadMessageIds.length > 0) {
				await this.messageReadStatusRepository.update(
					{
						message: { id: In(unreadMessageIds) },
						user: { id: userId },
						isRead: false,
					},
					{ isRead: true },
				);
			}

			return messagesPaginated;
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async updateMessageStatus(
		userId: string,
		messageId: string,
		updateMessageStatusDto: UpdateMessageStatusDto,
	): Promise<IBaseResponse<boolean>> {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new HttpException(
					HttpMessages.USERS_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}

			const allowedRoles = ['admin', 'superAdmin', 'supervisor'];
			if (!allowedRoles.includes(user.role.name)) {
				throw new HttpException(
					HttpMessages.USER_NOT_AUTHORIZED,
					HttpStatus.FORBIDDEN,
				);
			}

			const message = await this.messageRepository.findOne({
				where: { id: messageId },
			});
			if (!message) {
				throw new HttpException(
					HttpMessages.MESSAGE_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}

			message.isDeleted = updateMessageStatusDto.isDeleted;
			await this.messageRepository.save(message);
			return this.standartResponse<boolean>(
				true,
				HttpStatus.OK,
				HttpMessages.MESSAGE_UPDATED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
