import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	JoinColumn,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';
import { TaskEntity } from '../../task/entities/task.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { TargetType } from 'src/common/enums/ratings-target.enum';

@Entity('ratings')
export class RatingEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'int' })
	rating: number;

	@Column({ type: 'text' })
	comment: string;

	@Column('simple-array')
	images: string[];

	@ManyToOne(() => TaskEntity, (task) => task.ratings, { nullable: false })
	@JoinColumn({ name: 'taskId' })
	task: TaskEntity;

	@ManyToOne(() => UserEntity, (user) => user.ratings, { nullable: false })
	@JoinColumn({ name: 'userId' })
	user: UserEntity;

	@ManyToOne(() => UserEntity, { nullable: false })
	@JoinColumn({ name: 'targetUserId' })
	targetUser: UserEntity;

	@Column({
		type: 'enum',
		enum: TargetType,
		nullable: false,
	})
	targetType: TargetType;

	@CreateDateColumn({ type: 'timestamp' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updatedAt: Date;
}
