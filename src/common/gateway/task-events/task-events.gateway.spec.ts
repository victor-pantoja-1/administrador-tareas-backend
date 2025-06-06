import { Test, TestingModule } from '@nestjs/testing';
import { TaskEventsGateway } from './task-events.gateway';

describe('EventGateway', () => {
	let gateway: TaskEventsGateway;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [TaskEventsGateway],
		}).compile();

		gateway = module.get<TaskEventsGateway>(TaskEventsGateway);
	});

	it('should be defined', () => {
		expect(gateway).toBeDefined();
	});
});
