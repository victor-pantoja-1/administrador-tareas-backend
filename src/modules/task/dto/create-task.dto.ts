import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsDateString,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsObject,
	IsOptional,
	IsString,
	Min,
} from 'class-validator';
import { TaskStatusEnum } from 'src/common/enums/task-status.enum';
import { ICreateTaskInterface } from 'src/common/interfaces/task/task.interfaces';

export class CreateTaskDto implements ICreateTaskInterface {
	@ApiProperty({
		description: 'The title of the task',
		example: 'Learn NestJS',
	})
	@IsNotEmpty()
	@IsString()
	title: string;

	@ApiProperty({
		description: 'The description of the task',
		example: 'Learn NestJS for 30 days',
	})
	@IsOptional()
	@IsString()
	description: string;

	@IsOptional()
	@IsObject()
	@ApiProperty({
		example: '{"latitude": 0, "longitude": 0}',
		description: 'Location for task',
	})
	location?: { latitude: number; longitude: number };

	@ApiProperty({
		enum: TaskStatusEnum,
	})
	@IsEnum(TaskStatusEnum)
	@IsOptional()
	status?: TaskStatusEnum;

	@ApiProperty({
		description: 'The tags of the task',
		example: ['ece3395b-2e57-4eee-b973-d6c80c1144ef'],
	})
	@IsOptional()
	@IsString({ each: true })
	tags?: string[];

	@ApiProperty({
		description: 'The client of the task',
		example: 'cb888b02-e168-4555-abbd-621cf8dcbf6a',
	})
	@IsString()
	client: string;

	@ApiProperty({
		description: 'The technicians of the task',
		example: ['22417793-fe34-4f83-a472-be0e4bfd1c9c'],
	})
	@IsOptional()
	@IsString({ each: true })
	technicians?: string[];

	@ApiPropertyOptional({
		description: 'The images of the task',
		example: ['image1.png', 'image2.png'],
	})
	@IsOptional()
	@IsString({ each: true })
	images?: string[];

	@IsDateString()
	@ApiProperty({
		example: '2024-05-20T14:26:53.000Z',
		description: 'Start date for task',
	})
	startDate: Date;

	@IsDateString()
	@ApiProperty({
		example: '2024-05-20T14:26:53.000Z',
		description: 'End date for task',
	})
	endDate: Date;

	@IsNumber()
	@ApiProperty({
		example: 5,
		description: 'The time estimation of the task',
	})
	@Min(1, { message: 'The timeEstimation must be greater than zero' })
	timeEstimation: number;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		description: 'The address of the task',
		example: '1234 Elm Street',
	})
	address: string;
}
