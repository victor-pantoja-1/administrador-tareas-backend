import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatEntity } from './entities/chat.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { ConversationEntity } from 'src/modules/conversation/entities/conversation.entity';
import { UserDto } from './dto/user.dto';

@Injectable()
export class ChatService {
	constructor(
		@InjectRepository(ChatEntity)
		private chatRepository: Repository<ChatEntity>,
		@InjectRepository(UserEntity)
		private userRepository: Repository<UserEntity>,
		@InjectRepository(ConversationEntity)
		private conversationRepository: Repository<ConversationEntity>,
	) {}

	async updateChatStatus(
		userId: string,
		socketId: string,
		conversationId: string,
		isOnline: boolean,
		isInChat: boolean = false,
	): Promise<void> {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			const conversation = await this.conversationRepository.findOne({
				where: { id: conversationId },
			});

			if (!user) {
				throw new Error('User not found');
			}

			if (!conversation) {
				throw new Error('Conversation not found');
			}

			let chat = await this.chatRepository.findOne({
				where: { user: { id: userId }, conversation: { id: conversationId } },
			});

			if (chat) {
				chat.isOnline = isOnline;
				chat.isInChat = isInChat;
				chat.socketId = socketId;
			} else {
				chat = this.chatRepository.create({
					user,
					conversation,
					isOnline,
					isInChat,
					socketId,
				});
			}
			await this.chatRepository.save(chat);
		} catch (error) {
			throw error;
		}
	}

	async removeChatEntry(userId: string, conversationId: string): Promise<void> {
		const chatsToRemove = await this.chatRepository.findBy({
			user: { id: userId },
			conversation: { id: conversationId },
		})

		if (chatsToRemove?.length) await this.chatRepository.remove(chatsToRemove);
	}

	async getOnlineUsersInConversation(
		conversationId: string,
	): Promise<ChatEntity[]> {
		return this.chatRepository.find({
			where: {
				conversation: { id: conversationId },
				isOnline: true,
			},
			relations: ['user'],
		});
	}

	async getOnlineUsersInChat(conversationId: string): Promise<ChatEntity[]> {
		return this.chatRepository.find({
			where: {
				conversation: { id: conversationId },
				isOnline: true,
				isInChat: true,
			},
			relations: ['user'],
		});
	}

	async resetAllUsersStatus(): Promise<void> {
		const allChats = await this.chatRepository.find();
		if (allChats?.length) await this.chatRepository.remove(allChats);
	}

	async isUserInConversation(
		userId: string,
		conversationId: string,
	): Promise<boolean> {
		const conversation = await this.conversationRepository.findOne({
			where: { id: conversationId },
			relations: ['users'],
		});
		return conversation
			? conversation.users.some(
					(conversationUser) => conversationUser.id === userId,
				)
			: false;
	}

	async getUserBySocketId(socketId: string): Promise<UserEntity | null> {
		const chat = await this.chatRepository.findOne({
			where: { socketId },
			relations: ['user'],
		});
		return chat ? chat.user : null;
	}

	async getConversationIdBySocketId(socketId: string): Promise<string | null> {
		const chat = await this.chatRepository.findOne({
			where: { socketId },
			relations: ['conversation'],
		});
		return chat?.conversation ? chat.conversation.id : null;
	}

	extractUserFields(userOnline: ChatEntity[]): UserDto[] {
		return userOnline.map((chat) => ({
			id: chat.user.id,
			name: chat.user.name,
			lastName: chat.user.lastName,
			email: chat.user.email,
			role: chat.user.role.name,
			photo: chat.user.photo,
		}));
	}
}
