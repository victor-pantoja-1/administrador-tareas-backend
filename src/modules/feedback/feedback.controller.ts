import { Controller, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SystemRoutesEnum } from 'src/common/enums/routes.enum';
import { Permission } from 'src/common/decorator/permission/permission.decorator';
import { SystemActionEnum } from 'src/common/enums/action.enum';

@ApiTags('feedbacks')
@Controller(SystemRoutesEnum.FEEDBACKS)
@ApiBearerAuth()
export class FeedbackController {
	constructor(private readonly feedbackService: FeedbackService) {}

	@Post()
	@Permission(SystemActionEnum.FeedbacksCreate)
	create(@Body() createFeedbackDto: CreateFeedbackDto) {
		return this.feedbackService.create(createFeedbackDto);
	}

	@Patch(':id')
	@Permission(SystemActionEnum.FeedbacksUpdate)
	update(
		@Param('id') id: string,
		@Body() updateFeedbackDto: UpdateFeedbackDto,
	) {
		return this.feedbackService.update(id, updateFeedbackDto);
	}

	@Delete(':id')
	@Permission(SystemActionEnum.FeedbacksDelete)
	remove(@Param('id') id: string) {
		return this.feedbackService.remove(id);
	}
}
