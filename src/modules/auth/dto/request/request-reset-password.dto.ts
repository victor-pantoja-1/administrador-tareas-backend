import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RequestResetPasswordDto {
	@IsEmail()
	@IsNotEmpty()
	@IsString()
	email: string;

	@IsString()
	@IsNotEmpty()
	language: string;
}
