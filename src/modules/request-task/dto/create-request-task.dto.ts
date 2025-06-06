import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateRequestTaskDto {
	@ApiProperty({
		description: 'Title of the task',
		type: String,
		example: 'This is a title of the task',
	})
	@IsString()
	title: string;

	@ApiProperty({
		description: 'Description of the task',
		type: String,
		example: 'This is a description of the task',
	})
	@IsString()
	description: string;

	@ApiProperty({
		description: 'Images of the task',
		type: [String],
		example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
	})
	@IsString({ each: true })
	@IsOptional()
	images?: string[];

	@ApiProperty({
		description: 'Reason of cancelation of the task',
		type: String,
		example: 'Canceled because of some reason',
	})
	@IsString()
	@IsOptional()
	reasonOfCancelation?: string;

	@ApiProperty({
		description: 'Address of the task',
		type: String,
		example: 'Some address',
	})
	@IsString()
	@IsNotEmpty()
	address: string;

	@IsObject()
	@ApiProperty({
		example: '{"latitude": 0, "longitude": 0}',
		description: 'Location for task',
	})
	location: { latitude: number; longitude: number };
}
