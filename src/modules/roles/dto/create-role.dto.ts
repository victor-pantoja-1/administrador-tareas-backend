import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
export class CreateRoleDto {
	@ApiProperty({
		example: 'Admin',
		description: 'The name of the role',
	})
	@IsString()
	@IsNotEmpty()
	name: string;

	@ApiProperty({
		example: 'This is a description',
		description: 'The description of the role',
	})
	@IsString()
	@IsNotEmpty()
	description: string;

	@ApiProperty({
		example: ['1bcb6333-a761-4cfb-a394-60f67e0e9067'],
		description: 'The permissions of the role',
	})
	@IsString({ each: true })
	permissions?: string[];
}
