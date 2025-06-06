import { PartialType } from '@nestjs/swagger';
import { CreateRequestTaskDto } from './create-request-task.dto';

export class UpdateRequestTaskDto extends PartialType(CreateRequestTaskDto) {}
