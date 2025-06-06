import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { AWSS3Service } from 'src/common/helpers/aws-s3.service';

@Module({
  controllers: [ImagesController],
  providers: [ImagesService, AWSS3Service],
})
export class ImagesModule {}
