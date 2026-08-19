import { ApiProperty } from '@nestjs/swagger'

class ProfileDto {
	@ApiProperty({
		type: 'string',
		example: 'John Doe',
		nullable: true,
	})
	name!: string | null

	@ApiProperty({
		type: 'string',
		example: 'johndoe@email.com',
	})
	email!: string

	@ApiProperty({
		type: 'string',
		example: 'Developer',
		required: false,
	})
	jobTitle!: string | null

	@ApiProperty({
		type: 'string',
		example: 'http://images/avatar.png',
		required: false,
	})
	avatarUrl!: string | null
}

export class GetProfileResponseDto {
	@ApiProperty({ type: ProfileDto })
	profile!: ProfileDto
}
