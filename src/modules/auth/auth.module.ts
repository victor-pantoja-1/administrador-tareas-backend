import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { UsersModule } from '../users/users.module';
import { SendGridService } from 'src/common/helpers/sendgrid';
import { TwilioService } from 'src/common/helpers/twilio';
import { RolesModule } from '../roles/roles.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PermissionsGuard } from '../../common/guards/permission/permission.guard';

@Module({
	imports: [
		UsersModule, 
		RolesModule,
		ConfigModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('SECRET_KEY'),
        signOptions: { 
					expiresIn: `${configService.get<string>('JWT_EXPIRATION')}` 
				},
      }),
      inject: [ConfigService],
    })],
	controllers: [AuthController],
	providers: [
		AuthService,
		{
			provide: APP_GUARD,
			useClass: JwtAuthGuard,
		},
		{
			provide: APP_GUARD,
			useClass: PermissionsGuard,
		},
		SendGridService,
		TwilioService,
	],
})
export class AuthModule {}
