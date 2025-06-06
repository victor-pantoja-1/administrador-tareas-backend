import { IRole } from '../roles/roles.interface';

export interface IBasicUser {
	id?: string;
	name: string;
	lastName: string;
	photo?: string;
	isPrivate: boolean;
	role: IRole;
}

export interface IGender {
	id: number;
	name?: string;
}

export interface IUser extends IBasicUser {
	gender?: IGender;
	email: string;
	prefix?: string;
	phoneNumber?: string;
}

export interface IRegisterUser
	extends Omit<IUser, 'role' | 'isPrivate' | 'gender'> {
	rolId: number;
	genderId: number;
	password: string;
	location: string | null;
}

export interface ILocation {
	lat: number;
	lng: number;
}
