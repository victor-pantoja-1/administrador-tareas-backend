import { ChangeStatusOfEntity } from 'src/common/decorator/entities/changeStatus.decorator';
import { TaskStatusEnum } from 'src/common/enums/task-status.enum';
import { ConversationEntity } from 'src/modules/conversation/entities/conversation.entity';
import { FeedbackEntity } from 'src/modules/feedback/entities/feedback.entity';
import { RatingEntity } from 'src/modules/rating/entities/rating.entity';
import { RequestTaskEntity } from 'src/modules/request-task/entities/request-task.entity';
import { TagEntity } from 'src/modules/tag/entities/tag.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import {
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	Entity,
	JoinTable,
	ManyToMany,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
  OneToOne,
} from 'typeorm';

@Entity('tasks')
export class TaskEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	title: string;

	@Column({ type: 'text', nullable: true })
	description: string;

	@Column('simple-json', {
		nullable: true,
		default: null,
	})
	location: { latitude: number; longitude: number };

	@ChangeStatusOfEntity()
	@Column({ type: 'enum', enum: TaskStatusEnum, default: TaskStatusEnum.TODO })
	status: TaskStatusEnum;

	@ManyToOne(() => UserEntity, (user) => user.tasks, {
		onDelete: 'CASCADE',
	})
	client: UserEntity;

	@ManyToMany(() => UserEntity, (user) => user.technicianTasks, {
		cascade: true,
	})
	@JoinTable({ name: 'task_technicians' })
	technicians: UserEntity[];

	@OneToMany(() => FeedbackEntity, (feedbacks) => feedbacks.task)
	feedbacks: FeedbackEntity[];

	@ManyToMany(() => TagEntity, (tag) => tag.tasks)
	@JoinTable({
		name: 'tasks_tags',
	})
	tags: TagEntity[];

	@OneToMany(() => RatingEntity, (rating) => rating.task)
	ratings: RatingEntity[];

	@Column('simple-array', { nullable: true })
	images: string[];

	@Column({ type: 'timestamp', nullable: true })
	startDate: Date;

	@Column({ type: 'timestamp', nullable: true })
	endDate: Date;

	@CreateDateColumn({ type: 'timestamp' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updatedAt: Date;

	@Column({ type: 'numeric', nullable: false })
  timeEstimation: number;

	@Column({ type: 'varchar', nullable: false, length: '125' })
	address: string;

  @OneToOne(() => ConversationEntity, (feedback) => feedback.task)
  conversation: ConversationEntity;

  @OneToOne(() => RequestTaskEntity, (requestTask) => requestTask.task)
  requestTask: RequestTaskEntity;
}
