import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsOptional, IsPositive, Min } from 'class-validator';

export class TechnicianAvailabilityDto {
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

  @ApiProperty({
		required: false,
		type: Number,
		example: 1,
		description: 'The page number',
	})
	@IsOptional()
	@Type(() => Number)
	@IsPositive()
	page?: number;

  @ApiProperty({
		required: false,
		type: Number,
		example: 10,
		description: 'The limit number',
	})
	@IsOptional()
	@Type(() => Number)
	@IsPositive()
	@Min(1)
	limit?: number;
}