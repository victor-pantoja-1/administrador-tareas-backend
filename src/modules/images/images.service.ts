import { HttpException, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AWSS3Service } from '../../common/helpers/aws-s3.service';
import { ResponseFormatter } from '../../common/helpers/response-formatter.service';
import { HttpMessages } from '../../common/enums/http-messages.enum';

@Injectable()
export class ImagesService extends ResponseFormatter {
  constructor(
    private readonly imagesService: AWSS3Service
  ) {
    super();
  }

  async upload (
    file: Array<Express.Multer.File>,
  ) {
    try {
      const imageUploaded = await this.imagesService.uploadFile(file[0].originalname, file[0].buffer);

      return this.standartResponse(
        imageUploaded,
        HttpStatus.OK,
        HttpMessages.SUCCESS,
      );
    } catch (error) {
      throw new HttpException(
        error.message || HttpMessages.INTERNAL_SERVER_ERROR,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async uploadMany (
    files: Array<Express.Multer.File>,
  ) {
    try {
      const listImages = [];

      for (const b of files) {
        listImages.push(this.imagesService.uploadFile(b.originalname, b.buffer));
      }

      const uploadPromise = await Promise.all(listImages);

      return this.standartResponse(
        uploadPromise,
        HttpStatus.OK,
        HttpMessages.SUCCESS,
      );
    } catch (error) {
      throw new HttpException(
        error.message || HttpMessages.INTERNAL_SERVER_ERROR,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
