import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RequestTaskStatusEnum } from 'src/common/enums/request-task-status.enum';

export class UpdateTaskStatusDto {
	@ApiProperty({
		enum: RequestTaskStatusEnum,
		example: RequestTaskStatusEnum.APPROVED,
	})
	@IsNotEmpty()
	@IsEnum(RequestTaskStatusEnum)
	status: RequestTaskStatusEnum;

	@ApiProperty({
		example: 'Canceled because of some reason',
	})
	@IsOptional()
	@IsString()
	reason?: string;
}
