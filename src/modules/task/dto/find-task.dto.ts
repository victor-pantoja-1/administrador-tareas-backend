import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBooleanString, IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { FilterTaskEnum } from 'src/common/enums/filter-task.enum';
import { IFilterTaskInterface } from 'src/common/interfaces/task/task.interfaces';

export class FindAllTasksDto implements IFilterTaskInterface {
	@ApiProperty({
		description: 'Start date',
		example: '2023-05-20T14:26:53.000Z',
	})
	@IsDate()
	@Transform(({ value }) => new Date(value))
	startDate: Date;

	@ApiProperty({
		description: 'End date',
		example: '2025-12-31T23:26:53.000Z',
	})
	@IsDate()
	@Transform(({ value }) => new Date(value))
	endDate: Date;

	@ApiPropertyOptional({
		description: 'Search by text',
		example: 'Search by text',
	})
	@IsOptional()
	@IsString()
	search?: string;

	@ApiPropertyOptional({
		description: 'Tags IDs',
		example: ['ece3395b-2e57-4eee-b973-d6c80c1144ef'],
	})
	@IsOptional()
	@IsString({ each: true })
	@Transform(({ value }) => {
		if (Array.isArray(value)) {
			return value.map((item) => item.trim());
		} else if (typeof value === 'string') {
			return value.split(',').map((item) => item.trim());
		}
		return [];
	})
	tags?: string[];

	@ApiPropertyOptional({
		description: 'Technicians IDs',
		example: [
			'22417793-fe34-4f83-a472-be0e4bfd1c9c',
			'89aae85b-a987-46c8-8645-db4a9421ac36',
		],
	})
	@IsOptional()
	@IsString({ each: true })
	@Transform(({ value }) => {
		if (Array.isArray(value)) {
			return value.map((item) => item);
		} else if (typeof value === 'string') {
			return value.split(',').map((item) => item.trim());
		}
		return [];
	})
	technicians?: string[];

	@ApiPropertyOptional({
		description: 'Client ID',
		example: ['cb888b02-e168-4555-abbd-621cf8dcbf6a'],
	})
	@IsOptional()
	@IsString({ each: true })
	@Transform(({ value }) => {
		if (Array.isArray(value)) {
			return value.map((item) => item);
		} else if (typeof value === 'string') {
			return value.split(',').map((item) => item.trim());
		}
		return [];
	})
	clients?: string[];

	@ApiPropertyOptional({
		description: 'day | update | endDate',
		example: 'day',
		enum: FilterTaskEnum,
	})
	@IsOptional()
	@IsEnum(FilterTaskEnum)
	filter?: FilterTaskEnum;

	@ApiPropertyOptional({
		description: 'Search pendings only',
		example: true,
	})
	@IsOptional()
	@IsBooleanString()
	pendings?: string;
}
