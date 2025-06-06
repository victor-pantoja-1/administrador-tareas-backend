import { Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { TaskEntity } from "../../task/entities/task.entity";
import { UserEntity } from "src/modules/users/entities/user.entity";
import { MessageEntity } from "src/modules/messages/entities/message.entity";
import { ChatEntity } from "src/modules/chat/entities/chat.entity";

@Entity("conversations")
export class ConversationEntity {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(() => TaskEntity, (task) => task.conversation, {
    cascade: true,
  })
  @JoinColumn()
  task: TaskEntity;

  @ManyToMany(() => UserEntity, (task) => task.conversations, {
    cascade: true,
  })
  @JoinTable({
    name: "users_conversations",
  })
  users: UserEntity[];

  @OneToMany(() => MessageEntity, (message) => message.conversation,{
    
  })
  messages: MessageEntity[];

  @OneToMany(() => ChatEntity, (chat) => chat.conversation)
  chats: ChatEntity[];
}
