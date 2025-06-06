import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { TRANSLATE_NOTIFICATION } from 'src/common/constants/notifications.constants';

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UpdateLangUserDto {
  @ApiProperty({
    name: 'Lang of user',
    enum: Object.keys(TRANSLATE_NOTIFICATION),
  })
  @IsString()
  @IsEnum(Object.keys(TRANSLATE_NOTIFICATION))
  lang: string;
}
