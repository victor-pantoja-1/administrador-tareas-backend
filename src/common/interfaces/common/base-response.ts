import {
	HttpMessages,
} from 'src/common/enums/http-messages.enum';

export interface IBaseResponse<T> {
	statusCode: number;
	message: string;
	data?: T;
}

export interface IBaseWithOutDataResponse {
	statusCode: number;
	message: HttpMessages;
}

export interface IPaginationResponse<T> {
	data: T[];
	total: number;
	page: number;
	lastPage: number;
	limit: number;
	hasPrevPage: boolean;
	hasNextPage: boolean;
	statusCode: number;
	message: string;
}

export type ResponseMessage = HttpMessages | string;
