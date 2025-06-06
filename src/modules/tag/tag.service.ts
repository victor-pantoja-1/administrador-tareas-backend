import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TagEntity } from './entities/tag.entity';
import { Like, Repository } from 'typeorm';
import {
	HttpMessages
} from 'src/common/enums/http-messages.enum';
import { FindTagsQueryDto } from './dto/find-tags-dto';
import { ResponseFormatter } from 'src/common/helpers/response-formatter.service';
import { IBaseResponse } from 'src/common/interfaces/common/base-response';

@Injectable()
export class TagService extends ResponseFormatter {
	constructor(
		@InjectRepository(TagEntity)
		private tagRepository: Repository<TagEntity>,
	) {
		super();
	}
	async create(createTagDto: CreateTagDto): Promise<IBaseResponse<TagEntity>> {
		const lowercaseName = createTagDto.name.toLowerCase();

		const existingTag = await this.tagRepository.findOne({
			where: { name: lowercaseName },
		});

		if (existingTag) {
			throw new HttpException(
				HttpMessages.TAG_ALREADY_EXISTS,
				HttpStatus.CONFLICT,
			);
		}

		const newTag = this.tagRepository.create({ name: lowercaseName });

		try {
			await this.tagRepository.save(newTag);
			return this.standartResponse<TagEntity>(
				newTag,
				HttpStatus.CREATED,
				HttpMessages.TAG_CREATED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findTags(query: FindTagsQueryDto): Promise<IBaseResponse<TagEntity[]>> {
		try {
			const tags = await this.tagRepository.find({
				where: {
					name: query.q ? Like(`%${query.q}%`) : undefined,
				},
			});
			return this.standartResponse<TagEntity[]>(
				tags,
				HttpStatus.OK,
				HttpMessages.TAGS_RETRIEVED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async validateTags(tags: string[]): Promise<TagEntity[]> {
		if (tags === undefined || tags.length === 0) return [];		
		try {
			const tagEntities: TagEntity[] = [];
			for (const tag of tags) {
				let tagEntity = await this.tagRepository.findOne({
					where: { name: tag },
				});
	
				if (!tagEntity) {
					tagEntity = this.tagRepository.create({ name: tag });
					await this.tagRepository.save(tagEntity);
				}
	
				tagEntities.push(tagEntity);
			}

			return tagEntities;
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
