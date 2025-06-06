import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TRANSLATE_NOTIFICATION } from 'src/common/constants/notifications.constants';

export class SingInDto {
	@IsString()
	@IsNotEmpty()
	email: string;

	@IsString()
	@IsNotEmpty()
	password: string;

	@IsString()
	@IsOptional()
	notificationsToken?: string;

  @IsString()
  @IsEnum(Object.keys(TRANSLATE_NOTIFICATION))
	@IsOptional()
  lang?: string;
}
