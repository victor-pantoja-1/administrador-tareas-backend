import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException,
	HttpStatus,
	HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { ClsService } from 'nestjs-cls';
import { PERMISSION_ACTION_KEY } from 'src/common/decorator/permission/permission.decorator';
import { HttpMessages } from 'src/common/enums/http-messages.enum';
import { IJwtPayload } from 'src/common/interfaces/auth/jwt-payload.interface';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class PermissionsGuard extends AuthGuard('jwt') implements CanActivate {
	constructor(
		private reflector: Reflector,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
		private readonly userService: UsersService,
		private readonly clsService: ClsService,
	) {
		super();
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const action = this.reflector.get<string>(
			PERMISSION_ACTION_KEY,
			context.getHandler(),
		);

		const req = context.switchToHttp().getRequest();
		const ipAddress = req?.ip;

		if (!action) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromHeader(request);
		if (!token) {
			throw new UnauthorizedException(HttpMessages.USER_NOT_AUTHORIZED);
		}

		try {
			const payload: IJwtPayload = await this.jwtService.verifyAsync(token, {
				secret: this.configService.get<string>('SECRET_KEY'),
			});

			const user = await this.userService.findByEmail(payload.email);

			if (!user || !user.active) {
				return false;
			}

			const authorized = user.role.permissions.some((permission) => permission.target === action);

			if (authorized) {
				this.clsService.set('user', user);
				this.clsService.set('ipAddress', ipAddress);
			}

			return authorized;
		} catch (error) {
			console.error('Authorization error:', error);
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	private extractTokenFromHeader(request: Request) {
		const authorizationHeader = request.headers['authorization'];
		if (!authorizationHeader) {
			return undefined;
		}
		const [type, token] = authorizationHeader.split(' ');
		return type === 'Bearer' ? token : undefined;
	}
}
