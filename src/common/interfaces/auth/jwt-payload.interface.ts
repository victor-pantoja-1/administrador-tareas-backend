import { IRole } from '../roles/roles.interface';

export interface IJwtPayload {
	id: string;
	email: string;
	fullName: string;
	role: string;
	isRecovery?: boolean;
	isActivation?: boolean;
}

export interface IPayloadActivationAccount {
	email: string;
	isActivation: boolean;
}
