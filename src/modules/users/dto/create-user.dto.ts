import {
	IsOptional,
	IsString,
	IsNotEmpty,
	Length,
	IsBoolean,
	IsEmail,
	IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IGender, ILocation } from 'src/common/interfaces/users/user.interface';

export class CreateUserDto {
	@ApiProperty({
		type: String,
		description: 'The name of the user',
		maxLength: 100,
		example: 'Joself',
	})
	@IsString()
	@IsNotEmpty()
	@Length(1, 100)
	name: string;

	@ApiProperty({
		type: String,
		description: 'The last name of the user',
		maxLength: 100,
		example: 'Blanco',
	})
	@IsString()
	@IsNotEmpty()
	@Length(1, 100)
	lastName: string;

	@ApiPropertyOptional({
		type: Boolean,
		description: 'Indicates if the user is private',
		example: true,
	})
	@IsBoolean()
	@IsOptional()
	isPrivate?: boolean;

	@ApiProperty({
		type: String,
		description: 'The email of the user',
		maxLength: 100,
		example: 'joselfprueba@example.com',
	})
	@IsEmail()
	@IsNotEmpty()
	@Length(1, 100)
	email: string;

	@ApiPropertyOptional({
		type: String,
		description: 'The document number of the user',
		maxLength: 15,
		example: 'A123456789',
	})
	@IsString()
	@IsOptional()
	@Length(0, 15)
	docNumber?: string;

	@ApiPropertyOptional({
		type: String,
		description: 'The prefix of the user',
		maxLength: 10,
		example: 'Mr.',
	})
	@IsString()
	@Length(0, 15)
	prefix: string;

	@ApiPropertyOptional({
		type: String,
		description: 'The phone number of the user',
		maxLength: 20,
		example: '+1234567890',
	})
	@IsString()
	@Length(0, 15	)
	phoneNumber: string;

	@ApiPropertyOptional({
		type: String,
		description: 'The photo URL of the user',
		maxLength: 250,
		example: 'http://example.com/photo.jpg',
	})
	@IsString()
	@IsOptional()
	@Length(0, 250)
	photo?: string;

	@ApiPropertyOptional({
		type: Boolean,
		description: 'Indicates if the user is active',
		example: true,
	})
	@IsBoolean()
	@IsOptional()
	active?: boolean;

	@ApiPropertyOptional({
		type: Boolean,
		description: 'Indicates if 2FA is enabled for the user',
		example: false,
	})
	@IsBoolean()
	@IsOptional()
	enable2FA?: boolean;

	@ApiPropertyOptional({
		type: String,
		description: 'The 2FA code for the user',
		maxLength: 100,
		example: '123456',
	})
	@IsString()
	@IsOptional()
	@Length(0, 100)
	code2FA?: string;

	@ApiPropertyOptional({
		type: Object,
		description: 'The location of the user',
		example: { latitude: 40.712776, longitude: -74.005974 },
	})
	@IsOptional()
	location?: ILocation;

	@ApiProperty({
		description: 'The role of the user',
		example: '777db906-0846-4111-80f3-41798b55adf2',
	})
	@IsString()
	@IsNotEmpty()
	role: string;

	@ApiProperty({
		type: Object,
		description: 'The gender of the user',
		example: { id: 1, name: 'Other' },
	})
	@IsObject()
	gender?: IGender;

	@ApiProperty({
		type: Boolean,
		description: 'Recognize if an user is new or not',
		example: true,
	})
	@IsBoolean()
	@IsOptional()
	isNew?: boolean;
}
