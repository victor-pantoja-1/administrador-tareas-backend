import { ConversationEntity } from 'src/modules/conversation/entities/conversation.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { MessageReadStatusEntity } from './message-read-status.entity';

@Entity('messages')
export class MessageEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({
		type: 'longtext',
	})
	message: string;

	@ManyToOne(
		() => ConversationEntity,
		(conversation) => conversation.messages,
		{
			onDelete: 'CASCADE',
			nullable: false,
		},
	)
	@JoinColumn()
	conversation: ConversationEntity;

	@ManyToOne(() => UserEntity, (user) => user.messages, {
		onDelete: 'SET NULL',
		nullable: true,
	})
	@JoinColumn()
	user: UserEntity;

	@CreateDateColumn({ type: 'timestamp' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updatedAt: Date;

	@OneToMany(() => MessageReadStatusEntity, (readStatus) => readStatus.message)
	readStatuses: MessageReadStatusEntity[];

	@Column({ default: false })
	isDeleted: boolean;
}
