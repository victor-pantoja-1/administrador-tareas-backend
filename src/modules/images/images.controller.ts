import { Controller, Post, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ImagesService } from './images.service';
import { SystemRoutesEnum } from 'src/common/enums/routes.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Permission } from '../../common/decorator/permission/permission.decorator';
import { SystemActionEnum } from 'src/common/enums/action.enum';

@ApiTags(SystemRoutesEnum.IMAGES)
@Controller(SystemRoutesEnum.IMAGES)
@ApiBearerAuth()
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('file'))
  @Permission(SystemActionEnum.ImagesUpload)
  uploadImage(@UploadedFiles() file: Array<Express.Multer.File>) {
    return this.imagesService.upload(file);
  }

  @Post('many')
  @UseInterceptors(FilesInterceptor('file', 3))
  @Permission(SystemActionEnum.ImagesUpload)
  uploadManyImages(@UploadedFiles() files: Array<Express.Multer.File>) {
    return this.imagesService.uploadMany(files);
  }
}
