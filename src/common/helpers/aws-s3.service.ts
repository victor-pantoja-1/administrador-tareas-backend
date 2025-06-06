import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AWSS3Service {
	client: S3Client;

	constructor(
		private readonly configService: ConfigService
	) {
		const region = this.configService.get('S3_REGION');

		this.client = new S3Client({
			region: region,
			credentials: {
				accessKeyId: this.configService.get('S3_ACCESS_KEY'),
				secretAccessKey: this.configService.get('S3_SECRET_KEY'),
			},
		});
	}

	async uploadFile(fileName: string, file: Buffer) {
		const key = `images/${uuidv4()}-${fileName}`;

		const newFile = new PutObjectCommand({
			Bucket: this.configService.get('S3_BUCKET_NAME'),
			Key: key,
			Body: file,
		});
		try {
			await this.client.send(newFile);
			return `${this.configService.get('URL_CDN')}/${key}`;
		} catch (error) {
			throw new HttpException(
				error.message || 'Internal server error',
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
