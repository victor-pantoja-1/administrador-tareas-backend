import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import * as sendgrid from '@sendgrid/mail';
import { ISendgridOptions } from '../interfaces/sendgrid/options.interface';
import { ConfigService } from '@nestjs/config';
import { HttpMessages } from '../enums/http-messages.enum';

@Injectable()
export class SendGridService {
	constructor(private readonly configService: ConfigService) {
		sendgrid.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
	}

	async sendMail(params: ISendgridOptions) {
		try {
			const fromEmail = this.configService.get<string>('SENDGRID_EMAIL');
			if (!fromEmail)
				throw new BadRequestException(
					HttpMessages.SENDGRID_EMAIL_NOT_CONFIGURED,
				);

			await sendgrid.send({
				to: params.to,
				from: {
					name: 'Codescript',
					email: fromEmail,
				},
				subject: params.subject,
				html: params.template,
			});

			return true;
		} catch (error) {
			throw new InternalServerErrorException(
				HttpMessages.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
