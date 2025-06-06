import { BadRequestException } from "@nestjs/common";
import { v4 as uuidv4 } from 'uuid';

export const renameImage = (req, file, callback) => {
  const name: string = file.originalname.split('.')[0];
  const fileExtName: string = file.originalname.split('.')[1];
  const filename: string = `${uuidv4()}-${name}.${fileExtName}`;
  callback(null, filename);
}

export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return callback(new BadRequestException('Only images are accepted!'), false);
  }

  callback(null, true);
}