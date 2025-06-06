import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { SendGridService } from 'src/common/helpers/sendgrid';
import { RolesModule } from '../roles/roles.module';
import { TaskModule } from '../task/task.module';
import { ConversationEntity } from '../conversation/entities/conversation.entity';
import { ConversationModule } from '../conversation/conversation.module';
import { RoleEntity } from '../roles/entities/role.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity, ConversationEntity, RoleEntity]),
		ConversationModule,
		RolesModule,
		forwardRef(() => TaskModule),
	],
	controllers: [UsersController],
	providers: [UsersService, SendGridService],
	exports: [UsersService],
})
export class UsersModule {}
