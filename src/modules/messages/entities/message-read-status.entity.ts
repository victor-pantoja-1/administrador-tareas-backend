import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MessageEntity } from './message.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { ChangeStatusOfEntity } from 'src/common/decorator/entities/changeStatus.decorator';

@Entity('message_read_status')
export class MessageReadStatusEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ManyToOne(() => MessageEntity, (message) => message.readStatuses, {
		onDelete: 'CASCADE',
	})
	message: MessageEntity;

	@ManyToOne(() => UserEntity, (user) => user.readStatuses, {
		onDelete: 'CASCADE',
	})
	user: UserEntity;

	@ChangeStatusOfEntity()
	@Column({ default: false })
	isRead: boolean;
}
