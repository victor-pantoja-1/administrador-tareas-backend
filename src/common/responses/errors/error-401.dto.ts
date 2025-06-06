import { ApiProperty } from '@nestjs/swagger';

export class Error401Dto {
	@ApiProperty({
		example: 401,
	})
	statusCode: number;

	@ApiProperty({
		example:
			'Invalid credentials, please check your email and password and try again',
	})
	message: string;
}
