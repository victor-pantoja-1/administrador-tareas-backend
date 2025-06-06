import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { IJwtPayload } from 'src/common/interfaces/auth/jwt-payload.interface';
import { PublicEndpoint } from '../../common/decorator/public-endpoint/public-endpoint.decorator';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/request/change-password.dto';
import { RequestResetPasswordDto } from './dto/request/request-reset-password.dto';
import { Resend2FACode } from './dto/request/resend-2fa-code.dto';
import { ResetPasswordDto } from './dto/request/reset-password';
import { SetNewPassword } from './dto/request/set-new-password.dto';
import { SingInDto } from './dto/request/singIn.dto';
import { Verify2faDto } from './dto/request/verify-2fa.dto';
import { SystemRoutesEnum } from '../../common/enums/routes.enum';
import { Permission } from 'src/common/decorator/permission/permission.decorator';
import { SystemActionEnum } from 'src/common/enums/action.enum';

@ApiTags('auth')
@Controller(SystemRoutesEnum.AUTH)
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('login')
	@PublicEndpoint()
	login(@Body() singInDto: SingInDto, @Req() request: Request) {
		const origin = request.headers['x-client-type'] || '';
		return this.authService.login(singInDto, origin.toString());
	}

	@Post('forgot-password')
	@PublicEndpoint()
	forgotPassword(@Body() forgotPasswordDto: RequestResetPasswordDto) {
		const { email, language } = forgotPasswordDto;
		return this.authService.forgotPassword(email, language);
	}

	@Post('reset-password')
	@PublicEndpoint()
	resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
		return this.authService.resetPassword(resetPasswordDto);
	}

	@Post('change-password')
	@Permission(SystemActionEnum.AuthChangePassword)
	changePassword(
		@Body() changePasswordDto: ChangePasswordDto,
		@Req() req: IJwtPayload,
	) {
		return this.authService.changePassword(changePasswordDto, req);
	}

	@Post('refresh-token')
	refreshToken(@Req() request: Request) {
		const [_type, token] = request.headers.authorization.split(' ') || [];
		return this.authService.refreshToken(token);
	}

	@Post('verify-2fa')
	@PublicEndpoint()
	verify2fa(@Body() verify2faDto: Verify2faDto) {
		return this.authService.verify2fa(verify2faDto);
	}

	@Post('resend-2fa-code')
	@PublicEndpoint()
	resend2FACode(@Body() resend2FACode: Resend2FACode) {
		return this.authService.resend2FACode(resend2FACode.twoFaToken);
	}

	@Post('set-new-password')
	setNewPassword(
		@Body() setNewPassword: SetNewPassword,
		@Req() request: Request,
	) {
		const [_type, token] = request.headers.authorization.split(' ') || [];
		return this.authService.setNewPassword(setNewPassword.password, token);
	}
}
