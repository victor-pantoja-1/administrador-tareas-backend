import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FindTagsQueryDto {
	@IsOptional()
	@IsString()
	@ApiPropertyOptional({ description: 'Tag name', example: 'electricista' })
	q?: string;
}
