export interface IRatingResponse {
	id: string;
	rating: number;
	comment: string;
	images: string[];
	taskId?: string;
	userId?: string;
}
