import { Inject, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { JwtModule } from '@nestjs/jwt';
import ENV from '../../config/env/env';
import { ConfigValidationSchema } from '../../config/env/config-schema-vars';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from 'src/config/database/data-source';
import { UsersModule } from '../users/users.module';
import { TaskModule } from '../task/task.module';
import { FeedbackModule } from '../feedback/feedback.module';
import { TagModule } from '../tag/tag.module';
import { RatingModule } from '../rating/rating.module';
import { RolesModule } from '../roles/roles.module';
import { PermissionModule } from '../permission/permission.module';
import { RequestTaskModule } from '../request-task/request-task.module';

import {
	ThrottlerGuard,
	ThrottlerModule,
	ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { ImagesModule } from '../images/images.module';
import { TaskEventsModule } from 'src/common/gateway/task-events/task-events.module';
import { ConversationModule } from '../conversation/conversation.module';
import { MessagesModule } from '../messages/messages.module';
import { ChatModule } from '../chat/chat.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { ClsModule } from 'nestjs-cls';
import { APP_FILTER } from '@nestjs/core';
import { LogExceptionFilter } from 'src/common/filters/log-exception/log-exception.filter';
import { LoggerMiddleware } from 'src/common/middleware/logger/logger.middleware';

@Module({
	imports: [
		ConfigModule.forRoot({
			validationSchema: ConfigValidationSchema,
			validate: (config) => ConfigValidationSchema.parse(config),
			isGlobal: true,
			load: [ENV],
		}),
		CacheModule.register({
			isGlobal: true,
		}),
		ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true
      },
    }),
		JwtModule.registerAsync({
			global: true,
			inject: [ConfigService],
			useFactory: async (configService: ConfigService) => {
				return {
					secret: configService.get<string>('SECRET_KEY'),
					signOptions: {
						expiresIn: configService.get<string>('JWT_EXPIRATION'),
					},
				};
			},
		}),
		TypeOrmModule.forRootAsync({
			useFactory: async () => ({
				...AppDataSource.options,
				autoLoadEntities: true,
			}),
		}),
		ThrottlerModule.forRootAsync({
			useFactory: async (
				configService: ConfigService,
			): Promise<ThrottlerModuleOptions> => ({
				throttlers: [
					{
						ttl: configService.get('THROTTLE_TTL'),
						limit: configService.get('THROTTLE_LIMIT'),
					},
				],
			}),
			inject: [ConfigService],
		}),
		AuthModule,
		UsersModule,
		TaskModule,
		FeedbackModule,
		TagModule,
		RatingModule,
		RolesModule,
		PermissionModule,
		RequestTaskModule,
		ImagesModule,
		TaskEventsModule,
    	ConversationModule,
    	MessagesModule,
		ChatModule,
		AuditLogModule,
	],
	controllers: [],
	providers: [
		{
			provide: 'APP_GUARD',
			useClass: ThrottlerGuard,
		},
		{
      provide: APP_FILTER,
      useClass: LogExceptionFilter,
    },
	],
})
export class AppModule implements NestModule {
	static port: number;
	constructor(
		@Inject(ENV.KEY) private readonly configService: ConfigType<typeof ENV>,
	) {
		AppModule.port = Number(this.configService.app_port);
	}

	configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}
