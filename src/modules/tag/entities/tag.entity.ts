import { TaskEntity } from 'src/modules/task/entities/task.entity';
import { Entity, Column, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tags')
export class TagEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	name: string;

	@ManyToMany(() => TaskEntity, (task) => task.tags, {
		onDelete: 'CASCADE',
	})
	tasks: TaskEntity[];
}
