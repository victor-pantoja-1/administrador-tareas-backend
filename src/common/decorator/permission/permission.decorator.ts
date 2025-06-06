import { SetMetadata } from '@nestjs/common';

export const PERMISSION_ACTION_KEY = 'permission_action';
export const Permission = (action: string) =>
	SetMetadata(PERMISSION_ACTION_KEY, action);
