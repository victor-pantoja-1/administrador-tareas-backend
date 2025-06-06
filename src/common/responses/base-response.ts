import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto<T> {
	@ApiProperty({
		example: 'data',
	})
	data: T;
	@ApiProperty({
		example: 'message',
	})
	message: string;
	@ApiProperty({
		example: 200,
	})
	statusCode: number;
}
