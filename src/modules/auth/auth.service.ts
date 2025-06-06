import {
	BadRequestException,
	ForbiddenException,
	HttpException,
	HttpStatus,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { SingInDto } from './dto/request/singIn.dto';
import { UserEntity } from '../users/entities/user.entity';
import { comparePassword, hashPassword } from 'src/common/helpers/bcrypt';
import { HttpMessages } from 'src/common/enums/http-messages.enum';
import { IUser } from 'src/common/interfaces/users/user.interface';
import { ITokenResponse } from 'src/common/interfaces/auth/auth-response.interface';
import { JwtService } from '@nestjs/jwt';
import { IJwtPayload } from 'src/common/interfaces/auth/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { ChangePasswordDto } from './dto/request/change-password.dto';
import { UsersService } from '../users/users.service';
import { v4 } from 'uuid';
import { SendGridService } from '../../common/helpers/sendgrid';
import { ISendgridOptions } from '../../common/interfaces/sendgrid/options.interface';
import { RecoveryPasswordTemplate } from '../../common/templates/recovery-password-email.template';
import { TRANSLATE_EMAIL } from '../../common/constants/email.constants';
import { TwilioService } from '../../common/helpers/twilio';
import { Verify2faDto } from './dto/request/verify-2fa.dto';
import { ResetPasswordDto } from './dto/request/reset-password';
import { ResponseFormatter } from 'src/common/helpers/response-formatter.service';
import { I2faRequiered } from 'src/common/interfaces/auth/2fa-requiered.interface';
import { addMinutes } from 'date-fns';
import { SystemScopeEnum } from 'src/common/enums/scope.enum';

@Injectable()
export class AuthService extends ResponseFormatter {
	constructor(
		private jwtService: JwtService,
		private configService: ConfigService,
		private readonly usersService: UsersService,
		private readonly sendGridService: SendGridService,
		private readonly twilioService: TwilioService,
	) {
		super();
	}

	async login(singInDto: SingInDto, origin: string) {
		if (![SystemScopeEnum.MOBILE, SystemScopeEnum.WEB].includes(origin as SystemScopeEnum)) {
			delete singInDto?.notificationsToken;
			delete singInDto?.lang;
		}

		const user = await this.usersService.findByEmailWithoutException(
			singInDto.email,
		);
		if (!user)
			throw new UnauthorizedException(HttpMessages.USER_NOT_AUTHORIZED);
		
		if (
			(origin === SystemScopeEnum.WEB &&
				user.role.permissions.find(
					(permission) => permission.target === 'app.web',
				)) ||
			(origin === SystemScopeEnum.MOBILE &&
				user.role.permissions.find(
					(permission) => permission.target === 'app.mobile',
				))
		) {
			return await this.authenticate(singInDto, user, origin);
		} else {
			throw new UnauthorizedException(HttpMessages.USER_NOT_AUTHORIZED);
		}
	}

	async authenticate(singInDto: SingInDto, user: UserEntity, origin: string) {
		const isPasswordValid = await comparePassword(
			singInDto.password,
			user.password,
		);
		if (!isPasswordValid) {
			throw new HttpException(
				HttpMessages.EMAIL_PASSWORD_INVALID,
				HttpStatus.FORBIDDEN,
			);
		}

		if (user.enable2FA && user.prefix && user.phoneNumber) {
			const userPhoneNumber = `${user.prefix}${user.phoneNumber}`;
			const twilioResponse =
				await this.twilioService.sendMessage(userPhoneNumber);

			user.code2FA = v4();
			await this.usersService.update2faCode(user);

			return this.standartResponseWithOutData<I2faRequiered>(
				{
					two_fa_token: user.code2FA,
					created_at: twilioResponse.createdAt,
					expire_at: addMinutes(
						twilioResponse.createdAt,
						Number(this.configService.get<string>('TWILIO_EXPIRATION')),
					),
					status: twilioResponse.status,
				},
				HttpStatus.OK,
				HttpMessages.CODE_2FA_SENT,
			);
		} else if (user.enable2FA && !user.prefix && !user.phoneNumber) {
			throw new BadRequestException(
				HttpMessages.TWO_FA_USER_WITHOUT_PHONE_NUMBER,
			);
		}

		if (origin === SystemScopeEnum.MOBILE || origin === SystemScopeEnum.WEB) {
			const currentNotificationsTokens = user?.notificationsTokens ? user.notificationsTokens.split(',') : [];

			if (singInDto?.notificationsToken) {
				const existToken = currentNotificationsTokens.find((token) => token === `${origin}-${singInDto.notificationsToken}`);
				!existToken && currentNotificationsTokens.push(`${origin}-${singInDto.notificationsToken}`);
			}

			user.notificationsTokens = currentNotificationsTokens.join(',');
			await this.usersService.updateNotificationsToken(user);

			if (singInDto?.lang) {
				await this.usersService.updateLangUser(user.id, { lang: singInDto.lang });
			}

			this.usersService
		}

		const token: ITokenResponse = {
			access_token: await this.generateToken(user),
			refresh_token: await this.generateRefreshToken(user),
			isNew: user.isNew,
			roles: user.role,
			userId: user.id,
		};

		return this.standartResponseWithOutData<ITokenResponse>(
			token,
			HttpStatus.OK,
			HttpMessages.LOGIN_SUCCESS,
		);
	}

	async forgotPassword(email: string, language: string) {
		const user = await this.usersService.findByEmail(email);
		const token = v4();
		user.resetPasswordToken = token;

		await this.usersService.updateResetPasswordToken(user);

		const redirectionUrl = `${this.configService.get<string>('URL_FRONT_WEB')}/auth/reset-password/${token}`;
		
		const template = RecoveryPasswordTemplate(user, redirectionUrl, language);

		const sendgridOptioons: ISendgridOptions = {
			to: user.email,
			subject: TRANSLATE_EMAIL[language].RECOVERY_PASSWROD_SUBJECT,
			template,
		};

		await this.sendGridService.sendMail(sendgridOptioons);

		return this.standartResponseWithOutData<null>(
			null,
			HttpStatus.OK,
			HttpMessages.FORGOT_PASSWORD_SUCCESS,
		);
	}

	async changePassword(changePasswordDto: ChangePasswordDto, req: IJwtPayload) {
		const userRequest = req['user'] as IUser;
		const user = await this.usersService.findByEmail(userRequest.email);

		if (!(await comparePassword(changePasswordDto.password, user.password)))
			throw new ForbiddenException(HttpMessages.PASSWORD_INVALID);

		user.password = await hashPassword(
			changePasswordDto.newPassword,
			Number(this.configService.get<string>('SALT_ROUNDS')),
		);

		await this.usersService.updatePassword(user);

		if (user.isNew === true) {
			user.isNew = false;
		}
		await this.usersService.updateIsNew(user);

		return this.standartResponseWithOutData<null>(
			null,
			HttpStatus.OK,
			HttpMessages.CHANGE_PASSWORD_SUCCESS,
		);
	}

	async generateToken(user: UserEntity): Promise<string> {
		const payload: IJwtPayload = {
			id: user.id,
			email: user.email,
			fullName: user.name + ' ' + user.lastName,
			role: user.role.id,
		};
		
		return await this.jwtService.signAsync(payload);
	}

	async generateRefreshToken(user: UserEntity): Promise<string> {
		const payload: IJwtPayload = {
			id: user.id,
			email: user.email,
			fullName: user.name + ' ' + user.lastName,
			role: user.role.id,
		};

		return this.jwtService.signAsync(payload, {
			expiresIn: this.configService.get<string>('JWT_EXPIRATION_REFRESH_TOKEN'),
			secret: this.configService.get<string>('SECRET_KEY_REFRESH_TOKEN'),
		});
	}

	async refreshToken(refresh: string) {
		if (!refresh)
			throw new UnauthorizedException(HttpMessages.INVALID_REFRESH_TOKEN);

		try {
			const payload = await this.jwtService.verifyAsync(refresh, {
				secret: this.configService.get<string>('SECRET_KEY_REFRESH_TOKEN'),
			});

			const user = await this.usersService.findByEmail(payload.email);

			const token = {
				access_token: await this.generateToken(user),
				refresh_token: await this.generateRefreshToken(user),
				isNew: user.isNew,
				roles: user.role,
				userId: user.id,
			};

			return this.standartResponseWithOutData<ITokenResponse>(
				token,
				HttpStatus.OK,
				HttpMessages.REFRESH_TOKEN_SUCCESS,
			);
		} catch (error) {
			throw new UnauthorizedException(HttpMessages.INVALID_REFRESH_TOKEN);
		}
	}

	async resetPassword(resetPasswordDto: ResetPasswordDto) {
		const user = await this.usersService.getUserByResetPasswordToken(
			resetPasswordDto.token,
		);

		user.password = await hashPassword(
			resetPasswordDto.password,
			Number(this.configService.get<string>('SALT_ROUNDS')),
		);
		user.resetPasswordToken = null;

		await this.usersService.updatePassword(user);
		return this.standartResponseWithOutData<UserEntity>(
			null,
			HttpStatus.OK,
			HttpMessages.RESET_PASSWORD_SUCCESS,
		);
	}

	async verify2fa(verifyDto: Verify2faDto) {
		const { code, twoFaToken } = verifyDto;

		const user = await this.usersService.getUserBy2faToken(twoFaToken);
		const fullNumber = `${user.prefix}${user.phoneNumber}`;

		await this.verify2faCode(fullNumber, code);

		const token: ITokenResponse = {
			access_token: await this.generateToken(user),
			refresh_token: await this.generateRefreshToken(user),
			isNew: user.isNew,
			roles: user.role,
			userId: user.id
		};

		user.code2FA = null;
		await this.usersService.update2faCode(user);

		return this.standartResponseWithOutData<ITokenResponse>(
			token,
			HttpStatus.OK,
			HttpMessages.LOGIN_SUCCESS,
		);
	}

	async verify2faCode(number: string, code: string) {
		const res = await this.twilioService.verifyCode(number, code);
		if (!res) throw new BadRequestException(HttpMessages.CODE_2FA_INVALID);
	}

	async resend2FACode(twoFaToken: string): Promise<I2faRequiered> {
		const user = await this.usersService.getUserBy2faToken(twoFaToken);
		const fullNumber = `${user.prefix}${user.phoneNumber}`;

		const twilioResponse = await this.twilioService.sendMessage(fullNumber);

		return this.standartResponseWithOutData<I2faRequiered>(
			{
				two_fa_token: user.code2FA,
				created_at: twilioResponse.createdAt,
				expire_at: addMinutes(
					twilioResponse.createdAt,
					Number(this.configService.get<string>('TWILIO_EXPIRATION')),
				),
				status: twilioResponse.status,
			},
			HttpStatus.OK,
			HttpMessages.RESEND_2FA_CODE_SUCCESS,
		);
	}

	async setNewPassword(password: string, token: string) {
		const jwtPayload: IJwtPayload = this.jwtService.decode(token);

		const user = await this.usersService.findByEmail(jwtPayload.email);

		user.password = await hashPassword(
			password,
			Number(this.configService.get<string>('SALT_ROUNDS')),
		);

		if (user.isNew === true) {
			user.isNew = false;
		}
		await this.usersService.updateIsNew(user);

		await this.usersService.updatePassword(user);
		return this.standartResponseWithOutData<UserEntity>(
			null,
			HttpStatus.OK,
			HttpMessages.RESET_PASSWORD_SUCCESS,
		);
	}
}
