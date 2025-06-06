import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SetNewPassword {
	@IsString()
	@IsNotEmpty()
	@MinLength(6)
	password: string;
}
