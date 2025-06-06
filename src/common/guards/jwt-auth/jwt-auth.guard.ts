import {
	CanActivate,
	ExecutionContext,
	HttpException,
	HttpStatus,
	Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/common/decorator/public-endpoint/public-endpoint.decorator';
import { HttpMessages } from 'src/common/enums/http-messages.enum';
import { UsersService } from 'src/modules/users/users.service';
import { Socket } from 'socket.io';
import { IJwtPayload } from 'src/common/interfaces/auth/jwt-payload.interface';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(
		private jwtService: JwtService,
		private readonly configService: ConfigService,
		private readonly reflector: Reflector,
		private readonly userService: UsersService,
		private readonly clsService: ClsService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		const req = context.switchToHttp().getRequest();
		const ipAddress = req?.ip;

		if (isPublic) {
			return true;
		}

		const request = context.switchToHttp().getRequest();

		const token = this.extractTokenFromHeader(request);
		if (!token) {
			throw new HttpException(
				HttpMessages.ACCESS_DENIED,
				HttpStatus.UNAUTHORIZED,
			);
		}
		
		try {
			const payload = await this.jwtService.verifyAsync(token, {
				secret: this.configService.get<string>('SECRET_KEY'),
			});

			const user = await this.userService.findByEmail(payload.email);
			if (!user || !user.active) {
				throw new HttpException(
					HttpMessages.ACCESS_DENIED,
					HttpStatus.FORBIDDEN,
				);
			}

			request['user'] = payload;
			this.clsService.set('user', user);
			this.clsService.set('ipAddress', ipAddress);
		} catch {
			throw new HttpException(
				HttpMessages.ACCESS_DENIED,
				HttpStatus.UNAUTHORIZED,
			);
		}
		return true;
	}

	static socketValidateToken(client: Socket, jwtService: JwtService): IJwtPayload {
		const token = client.handshake.headers.authorization?.split(' ')[1];
		if (!token) {
		  throw new HttpException('Access Denied', HttpStatus.UNAUTHORIZED);
		}
	
		try {
		  return jwtService.verify(token);
		} catch (error) {
		  throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
		}
	  }

	private extractTokenFromHeader(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}
}
