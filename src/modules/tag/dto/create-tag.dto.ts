import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTagDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ example: 'electricista', type: String })
	name: string;
}
