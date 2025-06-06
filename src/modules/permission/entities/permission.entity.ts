import { RoleEntity } from 'src/modules/roles/entities/role.entity';
import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity('permissions')
export class PermissionEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	resource: string;

	@Column({
		unique: true,
	})
	target: string;

	@ManyToMany(() => RoleEntity, (role) => role.permissions, {
		onDelete: 'RESTRICT',
	})
	roles: RoleEntity[];

	@CreateDateColumn({ type: 'timestamp' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updatedAt: Date;
}
