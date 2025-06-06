
import { ConversationEntity } from 'src/modules/conversation/entities/conversation.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import {
	Column,
	Entity,
	JoinColumn,	
	ManyToOne,	
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('chats')
export class ChatEntity {
	@PrimaryGeneratedColumn('uuid')
	id?: string;

	@Column({
		type: 'varchar',
		length: 100,
		nullable: true,
	})
	socketId: string;

    @Column({
		type: 'boolean',
		default: false,
	})
	isOnline: boolean;	

	@Column({
		type: 'boolean',
		default: false,
	})
	isInChat: boolean; 

	@OneToOne(() => UserEntity, (user) => user.chat)
    @JoinColumn()
	user: UserEntity;	
	
	@ManyToOne(() => ConversationEntity, (conversation) => conversation.chats)
	@JoinColumn()
  	conversation: ConversationEntity;
}
