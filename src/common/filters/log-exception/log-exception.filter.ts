import {
	ExceptionFilter,
	Catch,
	ArgumentsHost,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { errorLogger } from 'src/common/helpers/logger';

@Catch()
export class LogExceptionFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost): void {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();
		const status =
			exception instanceof HttpException
				? exception.getStatus()
				: HttpStatus.INTERNAL_SERVER_ERROR;

		errorLogger.error({
			code: status || HttpStatus.INTERNAL_SERVER_ERROR,
			message: exception instanceof Error ? exception.message : exception,
			method: request.method,
			url: request.url,
		});

		response.status(status).json({
			statusCode: status,
			message: exception instanceof Error ? exception.message : exception,
			// timestamp: new Date().toISOString(),
		});
	}
}