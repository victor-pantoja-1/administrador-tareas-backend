import { ApiProperty } from '@nestjs/swagger';

export class Error404Dto {
	@ApiProperty({
		example: 404,
	})
	statusCode: number;

	@ApiProperty({
		example: 'Resource not found',
	})
	message: string;
}
