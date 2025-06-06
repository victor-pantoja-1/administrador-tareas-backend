import { ChangeStatusOfEntity } from 'src/common/decorator/entities/changeStatus.decorator';
import { PermissionEntity } from 'src/modules/permission/entities/permission.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import {
	Column,
	CreateDateColumn,
	Entity,
	JoinTable,
	ManyToMany,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity('roles')
export class RoleEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({
		unique: true,
	})
	name: string;

	@Column()
	description: string;

	@ChangeStatusOfEntity()
	@Column({ default: false })
	isActive: boolean;
	
	@OneToMany(() => UserEntity, (user) => user.role, {
		onDelete: 'RESTRICT',
	})
	user: UserEntity[];

	@ManyToMany(() => PermissionEntity, (permission) => permission.roles, {
		eager: true,
	})
	@JoinTable({
		name: 'roles_permissions',
	})
	permissions: PermissionEntity[];

	@CreateDateColumn({ type: 'timestamp' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updatedAt: Date;
}
