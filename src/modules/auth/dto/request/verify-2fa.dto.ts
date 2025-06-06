import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class Verify2faDto {
	@IsString()
	@IsNotEmpty()
	@MinLength(6)
	code: string;

	@IsString()
	@IsNotEmpty()
	twoFaToken: string;
}
