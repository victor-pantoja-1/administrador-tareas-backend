import { ApiProperty } from '@nestjs/swagger';
import {
	ArrayMaxSize,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	ValidateIf,
} from 'class-validator';
import { TargetType } from 'src/common/enums/ratings-target.enum';

export class CreateRatingDto {
	@IsNotEmpty()
	@IsNumber()
	@Max(5)
	@ApiProperty({ example: 5 })
	rating: number;

	@IsNotEmpty()
	@IsString()
	@ApiProperty({ example: 'Good job!' })
	comment: string;

	@IsOptional()
	@IsString({ each: true })
	@ArrayMaxSize(5)
	@ApiProperty({
		example: ['https://example.com/image.jpg'],
	})
	images?: string[];

	@IsNotEmpty()
	@IsString()
	@ApiProperty({ example: '0fd1906d-e753-45b9-9a13-4920093984ef' })
	taskId: string;

	@ValidateIf((o) => o.targetType !== 'company')
	@IsNotEmpty()
	@ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
	targetUserId: string;

	@IsNotEmpty()
	@IsEnum(TargetType)
	@ApiProperty({ example: TargetType.COMPANY, enum: TargetType })
	targetType: TargetType;
}
