import { HttpStatus } from '@nestjs/common';
import {
	IBaseResponse,
	IBaseWithOutDataResponse,
	IPaginationResponse,
	ResponseMessage,
} from '../interfaces/common/base-response';
import { HttpMessages } from '../enums/http-messages.enum';
import { SelectQueryBuilder } from 'typeorm';
import { PaginationDto } from '../dto/pagination.dto';

export class ResponseFormatter {
	standartResponse<T>(
		data: T,
		statusCode: HttpStatus = HttpStatus.OK,
		message: ResponseMessage = HttpMessages.SUCCESS,
	): IBaseResponse<T> {
		return {
			statusCode,
			message,
			data,
		};
	}

	async paginate<T>(
		queryBuilder: SelectQueryBuilder<T>,
		paginationDto: PaginationDto,
		statusCode: HttpStatus = HttpStatus.OK,
		message: ResponseMessage = HttpMessages.SUCCESS,
	): Promise<IPaginationResponse<T>> {
		const { page = 1, limit = 10 } = paginationDto;
		const [data, total] = await queryBuilder
			.skip((page - 1) * limit)
			.take(limit)
			.getManyAndCount();

		const lastPage = Math.ceil(total / limit);

		return {
			data,
			total,
			page,
			lastPage,
			limit,
			hasPrevPage: page > 1,
			hasNextPage: page < lastPage,
			statusCode: statusCode,
			message: message,
		};
	}

	standartResponseWithOutData<T>(
		data: T,
		statusCode: HttpStatus = HttpStatus.OK,
		message: HttpMessages = HttpMessages.SUCCESS,
	): IBaseWithOutDataResponse & T {
		return {
			statusCode,
			message,
			...data,
		};
	}
}
