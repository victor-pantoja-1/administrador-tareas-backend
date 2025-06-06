import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { TaskStatusEnum } from 'src/common/enums/task-status.enum';

export class FindTasksByViewportDto {
  
  @IsNumber()
  @Transform(({ value }) => parseFloat(parseFloat(value).toFixed(7)))
  neLat: number;  

  @IsNumber()
  @Transform(({ value }) => parseFloat(parseFloat(value).toFixed(7)))
  neLng: number;  

  @IsNumber()
  @Transform(({ value }) => parseFloat(parseFloat(value).toFixed(7)))
  swLat: number;  

  @IsNumber()
  @Transform(({ value }) => parseFloat(parseFloat(value).toFixed(7)))
  swLng: number; 

  @IsOptional()
  @IsString()
	startDate?: string;

	@IsOptional()
  @IsString()
	endDate?: string;

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
