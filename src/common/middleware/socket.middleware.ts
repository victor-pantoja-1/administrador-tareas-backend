import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class SocketMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(client: Socket, next: (err?: any) => void) {
    try {
      const payload = JwtAuthGuard.socketValidateToken(client, this.jwtService);
      client.handshake.auth = { user: payload };
      next();
    } catch (error) {
      next(error);
    }
  }
}