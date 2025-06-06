import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { RoleMigrations } from './migrations/roles';
import { UserMigrations } from './migrations/user';
import { TasksMigrations } from './migrations/task';
import { MessagesMigrations } from './migrations/messages';
import { ConversationsMigrations } from './migrations/conversations';
import { RequestTaskMigrations } from './migrations/request-task';
import { RatingsMigrations } from './migrations/ratings';
import { AuditLogsMigrations } from './migrations/audit-log';
config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
	type: 'mysql',
	host: configService.get<string>('DB_HOST'),
	port: configService.get<number>('DB_PORT'),
	username: configService.get<string>('DB_USER'),
	password: configService.get<string>('DB_PASS'),
	database: configService.get<string>('DB_NAME'),
	migrations: [
		...RoleMigrations, 
		...UserMigrations, 
		...TasksMigrations,
		...MessagesMigrations,
		...ConversationsMigrations,
		...RequestTaskMigrations,
		...RatingsMigrations,
		...AuditLogsMigrations,
	],
	migrationsTableName: 'migrations',
	synchronize: true,
});
