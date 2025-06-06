import { ChangeStatusOfEntity } from 'src/common/decorator/entities/changeStatus.decorator';
import { AuditLogEntity } from 'src/modules/audit-log/entities/audit-log.entity';
import { ChatEntity } from 'src/modules/chat/entities/chat.entity';
import { ConversationEntity } from 'src/modules/conversation/entities/conversation.entity';
import { FeedbackEntity } from 'src/modules/feedback/entities/feedback.entity';
import { MessageReadStatusEntity } from 'src/modules/messages/entities/message-read-status.entity';
import { MessageEntity } from 'src/modules/messages/entities/message.entity';
import { RatingEntity } from 'src/modules/rating/entities/rating.entity';
import { RequestTaskEntity } from 'src/modules/request-task/entities/request-task.entity';
import { RoleEntity } from 'src/modules/roles/entities/role.entity';
import { TaskEntity } from 'src/modules/task/entities/task.entity';
import {
	Column,
	Entity,
	JoinColumn,
	ManyToMany,
	ManyToOne,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class UserEntity {
	@PrimaryGeneratedColumn('uuid')
	id?: string;

	@Column({
		type: 'varchar',
		length: 100,
	})
	name: string;

	@Column({
		type: 'varchar',
		length: 100,
	})
	lastName: string;

	@Column({
		type: 'boolean',
		default: false,
	})
	isPrivate: boolean;

	@Column({
		type: 'varchar',
		length: 100,
		unique: true,
	})
	email: string;

	@Column({
		type: 'varchar',
		length: 100,
	})
	password: string;

	@Column({
		type: 'varchar',
		length: 15,
		nullable: true,
	})
	docNumber?: string;

	@Column({
		type: 'varchar',
		default: null,
	})
	prefix: string;

	@Column({
		type: 'varchar',
		default: null,
	})
	phoneNumber: string;

	@Column({
		type: 'varchar',
		length: 250,
		default: null,
	})
	photo: string;

	@ChangeStatusOfEntity()
	@Column({
		type: 'boolean',
		default: true,
	})
	active: boolean;

	@Column({
		type: 'boolean',
		default: false,
	})
	enable2FA: boolean;

	@Column({
		type: 'varchar',
		default: null,
		length: 100,
		select: false,
	})
	code2FA: string;

	@Column({
		type: 'timestamp',
		nullable: true,
		default: null,
		onUpdate: 'CURRENT_TIMESTAMP',
	})
	emailVerifiedAt: Date;

	@Column({
		type: 'json',
		nullable: true,
		default: null,
	})
	location: {
		lat: number;
		lng: number;
	};

	@Column({
		type: 'boolean',
		nullable: false,
	})
	isNew?: boolean;

	@Column({
		type: 'json',
		nullable: true,
		default: null,
	})
	gender?: {
		id: number;
		name: string;
	};

	@Column({
		type: 'varchar',
		length: 100,
		nullable: true,
		default: null,
	})
	resetPasswordToken?: string;

	@Column('text', { nullable: true })
  notificationsTokens?: string;

	@Column({
		type: 'varchar',
		length: 125,
		nullable: true,
		default: null,
	})
	lang?: string;

	@OneToMany(() => TaskEntity, (task) => task.client)
	tasks: TaskEntity[];

	@ManyToMany(() => TaskEntity, (task) => task.technicians)
	technicianTasks: TaskEntity[];

	@OneToMany(() => FeedbackEntity, (feedback) => feedback.user)
	feedbacks: FeedbackEntity[];

	@OneToMany(() => RatingEntity, (rating) => rating.user)
	ratings: RatingEntity[];

	@ManyToOne(() => RoleEntity, (role) => role.user, {
    eager: true,
  })
	@JoinColumn()
	role: RoleEntity;

	@OneToMany(() => RequestTaskEntity, (resquetTask) => resquetTask.client)
	requestTasks: RequestTaskEntity[];

	@ManyToMany(() => ConversationEntity, (conversation) => conversation.users)
	conversations: ConversationEntity[];

	@OneToMany(() => MessageEntity, (message) => message.user)
	messages: MessageEntity[];

	@OneToOne(() => ChatEntity, (chat) => chat.user)
    chat: ChatEntity;

	@OneToMany(() => MessageReadStatusEntity, (readStatus) => readStatus.user)
	readStatuses: MessageReadStatusEntity[];

	@OneToMany(() => AuditLogEntity, auditLog => auditLog.user)
  auditLogs: AuditLogEntity[];
}
