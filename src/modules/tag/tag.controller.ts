import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { FindTagsQueryDto } from './dto/find-tags-dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SystemRoutesEnum } from 'src/common/enums/routes.enum';
import { Permission } from 'src/common/decorator/permission/permission.decorator';
import { SystemActionEnum } from 'src/common/enums/action.enum';
import { AuditReads } from 'src/common/decorator/audit/audit-reads.decorator';

@ApiTags('tags')
@Controller(SystemRoutesEnum.TAGS)
@ApiBearerAuth()
export class TagController {
	constructor(private readonly tagService: TagService) {}

	@Post()
	@Permission(SystemActionEnum.TagsCreate)
	create(@Body() createTagDto: CreateTagDto) {
		return this.tagService.create(createTagDto);
	}

	@Get()
	@AuditReads('TagEntity')
	@Permission(SystemActionEnum.TagsGetAll)
	findAll(@Query() query: FindTagsQueryDto) {
		return this.tagService.findTags(query);
	}
}
