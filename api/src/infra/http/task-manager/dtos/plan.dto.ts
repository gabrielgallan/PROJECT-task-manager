import { ApiProperty } from '@nestjs/swagger'

export class PlanDto {
	@ApiProperty()
	id!: string

	@ApiProperty({
		nullable: true,
	})
	task!: {
		id: string
		title: string
	} | null

	@ApiProperty({
		nullable: true,
	})
	category!: {
		id: string
		name: string
		color: string
	} | null

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

	@ApiProperty({
		nullable: true,
	})
	confirmedAt!: Date | null
}
