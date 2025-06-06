import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateMessageDto {
	@ApiProperty({
    type: String,
    description: 'conversationId',
    required: true,
    example: '947b61d0-672f-48b2-ab08-bd763ae34fd6',
  })
	@IsString()
	conversationId: string;

	@ApiProperty({
		type: String,
		description: 'message',
		required: true,
	})
	@IsString()
	message: string;
}
