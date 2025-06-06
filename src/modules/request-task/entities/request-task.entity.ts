import { ChangeStatusOfEntity } from 'src/common/decorator/entities/changeStatus.decorator';
import { RequestTaskStatusEnum } from 'src/common/enums/request-task-status.enum';
import { TaskEntity } from 'src/modules/task/entities/task.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity('request_tasks')
export class RequestTaskEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	title: string;

	@Column({ type: 'longtext', nullable: true })
	description: string;

	@ChangeStatusOfEntity()
	@Column({
		type: 'enum',
		enum: RequestTaskStatusEnum,
		default: RequestTaskStatusEnum.REQUESTED,
	})
	status: RequestTaskStatusEnum;

	@Column({ 
		type: 'varchar',
		nullable: true 
	})
	reasonOfCancelation: string;

	@Column('simple-array', { nullable: true })
	images: string[];

	@ManyToOne(() => UserEntity, (user) => user.requestTasks)
	client: UserEntity;

	@Column({ type: 'varchar', nullable: false, length: '125' })
	address: string;

	@Column('simple-json', {
		nullable: true,
		default: null,
	})
	location: { latitude: number; longitude: number };

	@CreateDateColumn({ type: 'timestamp' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updatedAt: Date;

	@OneToOne(() => TaskEntity, (task) => task.requestTask)
	@JoinColumn()
    task?: TaskEntity;

}
