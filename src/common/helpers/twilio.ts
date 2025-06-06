import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { HttpMessages } from '../enums/http-messages.enum';
import { TwilioResponse } from '../interfaces/twilio/twilio.response.interface';

@Injectable()
export class TwilioService {
	private client: Twilio;

	constructor(private readonly configService: ConfigService) {
		const accountSid = this.configService.get<string>('TWILIO_SID');
		const authToken = this.configService.get<string>('TWILIO_AUTHTOKEN');

		this.client = new Twilio(accountSid, authToken);
	}

	async sendMessage(number: string): Promise<TwilioResponse> {
		try {
			const res = await this.client.verify.v2
				.services(this.configService.get<string>('TWILIO_APP_SID'))
				.verifications.create({
					to: number,
					channel: 'sms',
				});

			return {
				status: res.status,
				createdAt: res.dateUpdated,
			};
		} catch (error) {
			throw new InternalServerErrorException(
				HttpMessages.TWILIO_ERROR_SENDING_MESSAGE,
			);
		}
	}

	async verifyCode(number: string, code: string): Promise<boolean> {
		try {
			const res = await this.client.verify.v2
				.services(this.configService.get<string>('TWILIO_APP_SID'))
				.verificationChecks.create({
					to: number,
					code: code,
				});

			if (res.status !== 'approved') {
				throw new BadRequestException(HttpMessages.TWILIO_ERROR_VERIFYING_CODE);
			}

			return true;
		} catch (error) {
			throw new InternalServerErrorException(
				HttpMessages.TWILIO_ERROR_VERIFYING_CODE,
			);
		}
	}
}
