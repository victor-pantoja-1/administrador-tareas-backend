import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	OnGatewayConnection,
	OnGatewayDisconnect,
	MessageBody,
	ConnectedSocket,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { SocketMiddleware } from 'src/common/middleware/socket.middleware';
import { CreateMessageDto } from '../messages/dto/create-message.dto';
import { IJwtPayload } from 'src/common/interfaces/auth/jwt-payload.interface';
import { MessagesService } from '../messages/messages.service';
import { CreateMessageResponse } from 'src/common/interfaces/messages/create-message-response.interface';
import { ChatEventsEnum } from 'src/common/enums/chat-events.enum';
import { ClsService, UseCls } from 'nestjs-cls';
import { ConversationService } from '../conversation/conversation.service';
import { FirebaseMessagingService } from 'src/common/helpers/firebase-messaging.service';

@WebSocketGateway({
	namespace: '/api/v1/chat',
	cors: {
		origin: '*',
		methods: ['GET', 'POST'],
	},
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	afterInit() {
		this.server.use((client, next) =>
			new SocketMiddleware(this.jwtService).use(client, next),
		);
		this.chatService.resetAllUsersStatus();
	}

	constructor(
		private readonly jwtService: JwtService,
		private readonly clsService: ClsService,
		private chatService: ChatService,
		private messagesService: MessagesService,
		private conversationService: ConversationService,
		private readonly notificationsService: FirebaseMessagingService,
	) {}

	@UseCls()
	async handleConnection(client: Socket) {
		const user = client.handshake.auth?.user;
		const ipAddress = client.handshake.address;
		const conversationId = client.handshake.query?.conversationId as string;

		if (!user?.id || !conversationId) {
			return client.disconnect();
		}

		this.clsService.set('user', user);
		this.clsService.set('ipAddress', ipAddress);

		const isUserInConversation = await this.chatService.isUserInConversation(
			user.id,
			conversationId,
		);
		if (!isUserInConversation) {
			return client.disconnect();
		}

		await this.chatService.updateChatStatus(
			user.id,
			client.id,
			conversationId,
			true,
		);

		const unreadMessagesCount = await this.messagesService.countUnreadMessages(
			user.id,
			conversationId,
		);
		client.emit(ChatEventsEnum.UNREAD_MESSAGES_COUNT, unreadMessagesCount);
	}

	@UseCls()
	async handleDisconnect(client: Socket) {
		const user = await this.chatService.getUserBySocketId(client.id);
		const ipAddress = client.handshake.address;

		if (user) {
			this.clsService.set('user', user);
			this.clsService.set('ipAddress', ipAddress);
			const conversationId = await this.chatService.getConversationIdBySocketId(
				client.id,
			);

			await this.chatService.removeChatEntry(user.id, conversationId);

			const onlineUsersInChat = await this.chatService.getOnlineUsersInChat(conversationId);
			const usersToSend = this.chatService.extractUserFields(onlineUsersInChat);
			onlineUsersInChat.forEach((onlineUser) => {
				this.server
					.to(onlineUser.socketId)
					.emit(ChatEventsEnum.ONLINE_USERS, usersToSend);
			});
		}
	}

	@SubscribeMessage(ChatEventsEnum.CHAT_IN)
	@UseCls()
	async handleUserEnteredChat(
		@MessageBody('conversationId') conversationId: string,
		@ConnectedSocket() client: Socket,
	) {
		const user = client.handshake.auth.user;
		const ipAddress = client.handshake.address;

		if (!user || !conversationId) {
			return client.disconnect();
		}

		this.clsService.set('user', user);
		this.clsService.set('ipAddress', ipAddress);

		const isUserInConversation = await this.chatService.isUserInConversation(
			user.id,
			conversationId,
		);
		if (!isUserInConversation) {
			return client.disconnect();
		}

		await this.chatService.updateChatStatus(
			user.id,
			client.id,
			conversationId,
			true,
			true,
		);

		const onlineUsersInChat =
			await this.chatService.getOnlineUsersInChat(conversationId);
		const usersToSend = this.chatService.extractUserFields(onlineUsersInChat);
		onlineUsersInChat.forEach((onlineUser) => {
			this.server
				.to(onlineUser.socketId)
				.emit(ChatEventsEnum.ONLINE_USERS, usersToSend);
		});
	}

	@SubscribeMessage(ChatEventsEnum.CHAT_OUT)
	@UseCls()
	async handleLeaveChat(@ConnectedSocket() client: Socket) {
		const user = client.handshake.auth?.user;
		const ipAddress = client.handshake.address;
		const conversationId = client.handshake.query?.conversationId as string;

		if (!user?.id || !conversationId) {
			return client.disconnect();
		}

		this.clsService.set('user', user);
		this.clsService.set('ipAddress', ipAddress);

		await this.chatService.updateChatStatus(
			user.id,
			client.id,
			conversationId,
			true,
			false,
		);

		const onlineUsersInChat =
			await this.chatService.getOnlineUsersInChat(conversationId);
		const usersToSend = this.chatService.extractUserFields(onlineUsersInChat);
		onlineUsersInChat.forEach((onlineUser) => {
			this.server
				.to(onlineUser.socketId)
				.emit(ChatEventsEnum.ONLINE_USERS, usersToSend);
		});

		const unreadMessagesCount = await this.messagesService.countUnreadMessages(
			user.id,
			conversationId,
		);
		client.emit(ChatEventsEnum.UNREAD_MESSAGES_COUNT, unreadMessagesCount);
	}

	@SubscribeMessage(ChatEventsEnum.CREATE_MESSAGE)
	@UseCls()
	async create(
		@MessageBody() createMessageDto: CreateMessageDto,
		@ConnectedSocket() client: Socket,
	) {
		const req: IJwtPayload = client.handshake.auth.user;

		const user = client.handshake.auth?.user;
		const ipAddress = client.handshake.address;

		this.clsService.set('user', user);
		this.clsService.set('ipAddress', ipAddress);

		try {
			const usersInChat = await this.chatService.getOnlineUsersInChat(createMessageDto.conversationId);	

			const message: CreateMessageResponse = await this.messagesService.create(
				createMessageDto,
				req,
				usersInChat
			);

			if (message.message) {
				const onlineUsers = await this.chatService.getOnlineUsersInConversation(
					createMessageDto.conversationId,
				);

				const conversation = await this.conversationService.getAllUsers(createMessageDto.conversationId);
				const allUsers = conversation.users;
				const readyUsers = onlineUsers.map((item)=> item.user)

				const inactiveUsers = allUsers.filter((user) => {
					return !readyUsers.some((activeUser) => activeUser.id === user.id);
				})

				const senderUser = message.users.find((user) => user.id === message.message.user.id);

				this.notificationsService.sendChatMessage(
					inactiveUsers,
					{
						sender: `${senderUser.name} ${senderUser.lastName}`,
						message: message.message.message,
						conversationId: conversation.id,
						taskId: conversation.task.id,
					}
				);

				for (const user of onlineUsers) {
					if (String(user.user.id) !== String(req.id)) {
						if (user.isInChat) {
							this.server
								.to(user.socketId)
								.emit(ChatEventsEnum.NEW_MESSAGE, message.message);
						} else {
							const unreadMessagesCount =
								await this.messagesService.countUnreadMessages(
									user.user.id,
									createMessageDto.conversationId,
								);
							this.server
								.to(user.socketId)
								.emit(
									ChatEventsEnum.UNREAD_MESSAGES_COUNT,
									unreadMessagesCount,
								);
						}
					}
				}

				client.emit(ChatEventsEnum.CREATE_MESSAGE, message.message);
			} else {
				client.emit(
					ChatEventsEnum.CREATE_MESSAGE,
					message.error || 'Failed to create message',
				);
			}
		} catch (error) {
			client.emit('error', error.message || 'Internal Server Error');
		}
	}
}
