import { ApiProperty } from '@nestjs/swagger'

export class CreatedWorkLogDto {
	@ApiProperty()
	id!: string

	@ApiProperty({
		nullable: true,
	})
	taskId!: string | null

	@ApiProperty({
		nullable: true,
	})
	categoryId!: string | null

	@ApiProperty()
	title!: string

	@ApiProperty({
		nullable: true,
	})
	description!: string | null

	@ApiProperty()
	startsAt!: Date

	@ApiProperty()
	endsAt!: Date

	@ApiProperty()
	createdAt!: Date

	@ApiProperty({
		nullable: true,
	})
	updatedAt!: Date | null
}
