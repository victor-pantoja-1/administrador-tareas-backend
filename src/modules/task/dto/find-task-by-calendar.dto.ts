import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { TaskStatusEnum } from 'src/common/enums/task-status.enum';

export class FindTaskByCalendarDto {
	@IsString()
	@IsOptional()
	startDate?: string;

	@IsString()
	@IsOptional()
	endDate?: string;

	@IsString()
	@IsOptional()
	date?: string;

	@IsInt()
	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	year?: number;

	@IsInt()
	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	month?: number;

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

	@IsOptional()
	@IsEnum(TaskStatusEnum)
	status?: TaskStatusEnum;
}
