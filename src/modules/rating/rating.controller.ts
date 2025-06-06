import { Controller, Get, Post, Body, Param, Req, ParseEnumPipe } from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SystemRoutesEnum } from 'src/common/enums/routes.enum';
import { Permission } from 'src/common/decorator/permission/permission.decorator';
import { SystemActionEnum } from 'src/common/enums/action.enum';
import { AuditReads } from 'src/common/decorator/audit/audit-reads.decorator';
import { TargetType } from 'src/common/enums/ratings-target.enum';

@ApiTags('rating')
@Controller(SystemRoutesEnum.RATINGS)
@ApiBearerAuth()
export class RatingController {
	constructor(private readonly ratingService: RatingService) {}

	@Post(':targetType')
	//@Permission(SystemActionEnum.RatingsClient)
	rate( @Req() req, @Body() createRatingDto: CreateRatingDto, @Param('targetType', new ParseEnumPipe(TargetType)) targetType: TargetType) {
		const userId = req.user.id;
		return this.ratingService.rateTask(userId, createRatingDto, targetType);
	}
	
	@Get('ratings-of-task/:id')
	@AuditReads('RatingEntity')
	@Permission(SystemActionEnum.RatingsRatingOfTask)
	getAllRatingOfTask(@Param('id') id: string) {
		return this.ratingService.getAllRatingsOfTask(id);
	}

	@Get('top-five-technicians')
	@AuditReads('RatingEntity')
	@Permission(SystemActionEnum.RatingsGetAll)
	getTopFiveTechnicians() {
	  return this.ratingService.getTopFiveTechnicians();
	}
}
