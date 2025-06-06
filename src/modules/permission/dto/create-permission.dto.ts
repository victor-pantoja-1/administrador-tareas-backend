import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePermissionDto {
	@ApiProperty({
		description: 'Target of the permission',
		example: 'tasks.create',
	})
	@IsNotEmpty()
	@IsString()
	target: string;

	@ApiProperty({
		description: 'Target resource of the permission',
		example: 'tasks',
	})
	@IsNotEmpty()
	@IsString()
	resource: string;
}
