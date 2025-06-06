import { Test, TestingModule } from '@nestjs/testing';
import { RequestTaskController } from './request-task.controller';
import { RequestTaskService } from './request-task.service';

describe('RequestTaskController', () => {
	let controller: RequestTaskController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [RequestTaskController],
			providers: [RequestTaskService],
		}).compile();

		controller = module.get<RequestTaskController>(RequestTaskController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
