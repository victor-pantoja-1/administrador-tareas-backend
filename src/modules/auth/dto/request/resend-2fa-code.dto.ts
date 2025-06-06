import { IsNotEmpty, IsString } from 'class-validator';

export class Resend2FACode {
	@IsString()
	@IsNotEmpty()
	twoFaToken: string;
}
