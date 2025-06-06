import { ApiProperty } from '@nestjs/swagger';

export class Error403Dto {
	@ApiProperty({
		example: 403,
	})
	statusCode: number;

	@ApiProperty({
		example: 'Forbidden',
	})
	message: string;
}
