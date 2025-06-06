import { PartialType } from '@nestjs/swagger';
import { CreateMessageDto } from './create-message.dto';
import { IsBoolean } from 'class-validator';

export class UpdateMessageStatusDto extends PartialType(CreateMessageDto) {
    @IsBoolean()
    isDeleted: boolean;
}


