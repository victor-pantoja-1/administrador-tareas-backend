import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ConversationEntity } from './entities/conversation.entity';
import { HttpMessages } from 'src/common/enums/http-messages.enum';
import { UserEntity } from '../users/entities/user.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { IBaseResponse, IPaginationResponse } from 'src/common/interfaces/common/base-response';
import { ResponseFormatter } from 'src/common/helpers/response-formatter.service';
import { MessageReadStatusEntity } from '../messages/entities/message-read-status.entity';

@Injectable()
export class ConversationService extends ResponseFormatter {
  constructor(
    @InjectRepository(ConversationEntity) private conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
    @InjectRepository(MessageReadStatusEntity) private messageReadStatusRepository: Repository<MessageReadStatusEntity>,
  ){
    super();
  }
  async create(createConversationDto: CreateConversationDto): Promise<IBaseResponse<ConversationEntity>> {
    try {
      const specialRoles = ['admin', 'superAdmin', 'supervisor'];
      const usersWithSpecialRoles = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')
        .where('role.name IN (:...roles)', { roles: specialRoles })
        .getMany();

      const conversation = this.conversationRepository.create({
        task: createConversationDto.task,
        users: [
          createConversationDto.task.client,
          ...createConversationDto.task.technicians,
          ...usersWithSpecialRoles
        ]
      });
      
      const conversationSaved = await this.conversationRepository.save(conversation);

      return this.standartResponse<ConversationEntity>(
				conversationSaved,
				HttpStatus.CREATED,
				HttpMessages.CONVERSATION_CREATED_SUCCESSFULLY,
			);
    } catch (error) {
      throw new HttpException(
        error.message || HttpMessages.INTERNAL_SERVER_ERROR,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
  async findAllPaginates(
    paramPaginate: PaginationDto,
  ): Promise<IPaginationResponse<ConversationEntity>> {
    const query = this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.messages', 'messages')
      .leftJoinAndSelect('conversation.users', 'usersConversation')
      .leftJoinAndSelect('usersConversation.role', 'role')
      .leftJoinAndSelect('messages.user', 'userMessage')
      .leftJoinAndSelect('userMessage.role', 'userMessageRole')
      .leftJoinAndSelect('conversation.task', 'task')      
      .select([
      'conversation.id',			
			'task.id',
			'task.title',
			'task.description',
			'task.status',
			'task.startDate',
			'task.endDate',
			'task.timeEstimation',
			'usersConversation.id',
			'usersConversation.name',
			'usersConversation.lastName',
      'usersConversation.email',
			'usersConversation.photo',
      'role.id',
      'role.name', 
			'messages.id',
			'messages.user',
			'messages.message',
			'messages.createdAt',
      'messages.isDeleted',
			'userMessage.id',
			'userMessage.name',
			'userMessage.lastName',
			'userMessage.email',
			'userMessage.photo',
      'userMessageRole.id',  
      'userMessageRole.name',
      ]);
  
    const conversations = await this.paginate<ConversationEntity>(
      query,
      paramPaginate,
      HttpStatus.OK,
      HttpMessages.CONVERSATION_RETRIEVED_SUCCESSFULLY,
    );
  
    if (!conversations) {
      throw new HttpException(
        HttpMessages.CONVERSATION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
  
    return conversations;
  }
  async findOne(id: string): Promise<IBaseResponse<ConversationEntity>> {
		try {
			const query = this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.messages', 'messages')
      .leftJoinAndSelect('conversation.users', 'usersConversation')
      .leftJoinAndSelect('usersConversation.role', 'role')
      .leftJoinAndSelect('messages.user', 'userMessage')
      .leftJoinAndSelect('userMessage.role', 'userMessageRole')
      .leftJoinAndSelect('conversation.task', 'task')   
			.where('conversation.id = :id', { id })
      .select([
        'conversation.id',			
        'task.id',
        'task.title',
        'task.description',
        'task.status',
        'task.startDate',
        'task.endDate',
        'task.timeEstimation',
        'usersConversation.id',
        'usersConversation.name',
        'usersConversation.lastName',
        'usersConversation.email',
        'usersConversation.photo',
        'role.id',
        'role.name', 
        'messages.id',
        'messages.user',
        'messages.message',
        'messages.createdAt',
        'messages.isDeleted',
        'userMessage.id',
        'userMessage.name',
        'userMessage.lastName',
        'userMessage.email',
        'userMessage.photo',
        'userMessageRole.id',  
        'userMessageRole.name',
        ]);

			const conversation = await query.getOne();

			if (!conversation) {
				throw new HttpException(
					HttpMessages.CONVERSATION_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}

			return this.standartResponse<ConversationEntity>(
				conversation,
				HttpStatus.OK,
				HttpMessages.CONVERSATION_RETRIEVED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

  async getAllUsers(conversationId: string): Promise<ConversationEntity> {
    const query = this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.users', 'usersConversation')
      .leftJoinAndSelect('conversation.task', 'task')  
      .where('conversation.id = :id', { id: conversationId })

    const conversation = await query.getOne();

    return conversation;
  }

  async addUsers(conversationId: string, userIds: string[]): Promise<IBaseResponse<ConversationEntity>> {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: { id: conversationId },
        relations: ['users','messages'],
      });

      if (!conversation) {
        throw new HttpException(HttpMessages.CONVERSATION_NOT_FOUND, HttpStatus.NOT_FOUND);
      }

      const users = await this.userRepository.find({
        where: userIds.map(id => ({ id })),
    });

    if (!users.length) {
        throw new HttpException(HttpMessages.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const newUsers = users.filter(user => !conversation.users.some(existingUser => existingUser.id === user.id));

    if (!newUsers.length) {
        throw new HttpException(HttpMessages.USER_ALREADY_EXISTS, HttpStatus.BAD_REQUEST);
    }

    conversation.users.push(...newUsers);
    const updatedConversation = await this.conversationRepository.save(conversation);

    for (const message of conversation.messages) {
      for (const user of newUsers) {
          const messageReadStatus = new MessageReadStatusEntity();
          messageReadStatus.message = message;
          messageReadStatus.user = user;
          messageReadStatus.isRead = false;

          await this.messageReadStatusRepository.save(messageReadStatus);
      }
  }

      return this.standartResponse<ConversationEntity>(
        updatedConversation,
        HttpStatus.OK,
        HttpMessages.CONVERSATION_UPDATED_SUCCESSFULLY,
      );
    } catch (error) {
      throw new HttpException(
        error.message || HttpMessages.INTERNAL_SERVER_ERROR,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async removeUsers(conversationId: string, userIds: string[]): Promise<IBaseResponse<ConversationEntity>> {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: { id: conversationId },
        relations: ['users', 'messages'],
      });

      if (!conversation) {
        throw new HttpException(HttpMessages.CONVERSATION_NOT_FOUND, HttpStatus.NOT_FOUND);
      }

      const usersToRemove = conversation.users.filter(user => userIds.includes(user.id));

        if (!usersToRemove.length) {
            throw new HttpException(HttpMessages.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        for (const message of conversation.messages) {
          const allMessageReadStatusRecords = await this.messageReadStatusRepository.findBy({
            user: { id: In(userIds) },
            message: { id: message.id },
          })

          await this.messageReadStatusRepository.remove(allMessageReadStatusRecords);
        }

        conversation.users = conversation.users.filter(user => !userIds.includes(user.id));
        const updatedConversation = await this.conversationRepository.save(conversation);
      return this.standartResponse<ConversationEntity>(
        updatedConversation,
        HttpStatus.OK,
        HttpMessages.CONVERSATION_UPDATED_SUCCESSFULLY,
      );
    } catch (error) {
      throw new HttpException(
        error.message || HttpMessages.INTERNAL_SERVER_ERROR,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  update(id: string, updateConversationDto: UpdateConversationDto) {
    return `This action updates a #${id} conversation`;
  }

  
}
