import { IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
	@ApiPropertyOptional({
		description: 'Search by text',
		example: 'Search by text',
	})
	@IsOptional()
	@IsString()
	search: string;

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
