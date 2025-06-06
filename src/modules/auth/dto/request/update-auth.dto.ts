import { PartialType } from '@nestjs/mapped-types';
import { SingInDto } from './singIn.dto';

export class UpdateAuthDto extends PartialType(SingInDto) {}
