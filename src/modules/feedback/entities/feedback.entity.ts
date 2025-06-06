import { TaskEntity } from 'src/modules/task/entities/task.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity('feedbacks')
export class FeedbackEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	content: string;

	@ManyToOne(() => TaskEntity, (task) => task.feedbacks, {
		onDelete: 'CASCADE',
	})
	task: TaskEntity;

	@ManyToOne(() => UserEntity, (user) => user.feedbacks, {
		onDelete: 'CASCADE',
	})
	user: UserEntity;

	@CreateDateColumn({ type: 'timestamp' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updatedAt: Date;
}
