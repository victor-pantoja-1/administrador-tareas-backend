import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { ClsService } from 'nestjs-cls';
import { AuditLogEntity } from './modules/audit-log/entities/audit-log.entity';
import { AuditReadsInterceptor } from './common/interceptors/audit-reads.interceptor';
import { getRepositoryToken } from '@nestjs/typeorm';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors({
		origin: '*',
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
		credentials: true,
	});

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

  const clsService = app.get(ClsService);
  const reflector = app.get(Reflector);
	const auditLogRepository = app.get(getRepositoryToken(AuditLogEntity));

  app.useGlobalInterceptors(
    new AuditReadsInterceptor(auditLogRepository, clsService, reflector)
  );

	app.setGlobalPrefix('api/v1/');

	const authDocument = yaml.load(fs.readFileSync('src/docs/auth.swagger.yml', 'utf8'));
	const auditLogDocument = yaml.load(fs.readFileSync('src/docs/audit-logs.swagger.yml', 'utf8'));
	const conversationsDocument = yaml.load(fs.readFileSync('src/docs/conversations.swagger.yml', 'utf8'));
	const feedbackDocument = yaml.load(fs.readFileSync('src/docs/feedback.swagger.yml', 'utf8'));
	const imagesDocument = yaml.load(fs.readFileSync('src/docs/images.swagger.yml', 'utf8'));
	const messagesDocument = yaml.load(fs.readFileSync('src/docs/messages.swagger.yml', 'utf8'));
	const permissionsDocument = yaml.load(fs.readFileSync('src/docs/permissions.swagger.yml', 'utf8'));
	const ratingDocument = yaml.load(fs.readFileSync('src/docs/rating.swagger.yml', 'utf8'));
	const requestTaskDocument = yaml.load(fs.readFileSync('src/docs/request-task.swagger.yml', 'utf8'));
	const rolesDocument = yaml.load(fs.readFileSync('src/docs/roles.swagger.yml', 'utf8'));
	const tagDocument = yaml.load(fs.readFileSync('src/docs/tag.swagger.yml', 'utf8'));
	const tasksDocument = yaml.load(fs.readFileSync('src/docs/tasks.swagger.yml', 'utf8'));
	const usersDocument = yaml.load(fs.readFileSync('src/docs/users.swagger.yml', 'utf8'));

	const mergeComponents = (...components) => {
		const merged = {};
		components.forEach(component => {
			if (component && component.schemas) {
				Object.assign(merged, component.schemas);
			}
		});
		return merged;
	};

  const combinedDocument: OpenAPIObject = {
    openapi: '3.0.0',
    info: {
      title: 'Task Manager Documentation',
      version: '1.0.0',
			description: 'This is the documentation for all API endpoints in the Task Manager project. Quite detailed examples are included to know what responses are obtained in each request.',
    },
		security: [
			{
				bearerAuth: [],
			}
		],
		servers: [
			{
				url: 'http://localhost:9000/api/v1',
				description: 'Local server',
			},
			{
				url: 'https://api-taskmanager.codescript.us/api/v1',
				description: 'Development server',
			},
		],
    paths: {
      ...authDocument.paths,
			...auditLogDocument.paths,
			...conversationsDocument.paths,
			...feedbackDocument.paths,
			...imagesDocument.paths,
			...messagesDocument.paths,
			...permissionsDocument.paths,
			...ratingDocument.paths,
			...requestTaskDocument.paths,
			...rolesDocument.paths,
			...tagDocument.paths,
			...tasksDocument.paths,
			...usersDocument.paths,
    },
		components: {
			schemas: mergeComponents(
				authDocument.components,
				auditLogDocument.components,
				conversationsDocument.components,
				feedbackDocument.components,
				imagesDocument.components,
				messagesDocument.components,
				permissionsDocument.components,
				ratingDocument.components,
				requestTaskDocument.components,
				rolesDocument.components,
				tagDocument.components,
				tasksDocument.components,
				usersDocument.components,
			),
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
				},
			},
		},
  };

  SwaggerModule.setup('api/v1/swagger', app, combinedDocument);

	const PORT = AppModule.port || 9000;
	await app.listen(PORT);
}

bootstrap();
