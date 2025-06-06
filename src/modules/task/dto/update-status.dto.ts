import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { TaskStatusEnum } from 'src/common/enums/task-status.enum';

export class UpdateTaskStatusDto {
	@IsNotEmpty()
	@IsEnum(TaskStatusEnum)
	@ApiProperty({ enum: TaskStatusEnum, example: TaskStatusEnum.DONE })
	status: TaskStatusEnum;
}
