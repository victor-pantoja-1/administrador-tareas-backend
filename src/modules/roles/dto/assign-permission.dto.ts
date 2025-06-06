import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignPermissionDto {
	@ApiProperty({
		example: '777db906-0846-4111-80f3-41798b55adf2',
		description: 'The role id',
	})
	@IsString()
	@IsNotEmpty()
	roleId: string;

	@ApiProperty({
		example: ['777db906-0846-4111-80f3-41798b55adf2'],
		description: 'The permission id',
	})
	@IsString({ each: true })
	@IsNotEmpty()
	permissions: string[];
}
