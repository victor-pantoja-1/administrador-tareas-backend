import { TaskStatusEnum } from 'src/common/enums/task-status.enum';

export interface ICreateTaskInterface {
	title: string;
	description?: string;
	location?: { latitude: number; longitude: number };
	status?: TaskStatusEnum;
	tags?: string[];
	client: string;
	technicians?: string[];
	startDate: Date;
	endDate: Date;
}

export interface IFilterTaskInterface {
	startDate: Date;
	endDate: Date;
	search?: string;
	tags?: string[];
	technicians?: string[];
	clients?: string[];
	pendings?: string;
}

export interface ITaskDashboardInterface {
	totalsByDays: ITaskStatusTotals[];
	clients: number;
	totals: Partial<ITaskStatusTotals>;
	};


export interface ITaskStatusTotals {
	TODO: number;
	IN_PROGRESS: number;
	DONE: number;
	date?: Date;
}
