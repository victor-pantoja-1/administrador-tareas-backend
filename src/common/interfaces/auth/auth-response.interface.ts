import { RoleEntity } from 'src/modules/roles/entities/role.entity';

export interface ITokenResponse {
	access_token: string;
	refresh_token: string;
	isNew?: boolean,
	roles: RoleEntity;
	userId: string;
}
