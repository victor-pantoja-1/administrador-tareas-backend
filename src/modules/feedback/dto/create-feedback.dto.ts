import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateFeedbackDto {
	@ApiProperty({
		description: 'Feedback content',
		type: String,
		required: true,
		example: 'This is a feedback content',
	})
	@IsString()
	content: string;

	@ApiProperty({
		description: 'Task id',
		type: String,
		required: true,
		example: '27fb258c-8cca-4891-89b1-92411bb3027d',
	})
	@IsString()
	taskId: string;

	@ApiProperty({
		description: 'User id',
		type: String,
		required: true,
		example: '22417793-fe34-4f83-a472-be0e4bfd1c9c',
	})
	@IsString()
	userId: string;
}
