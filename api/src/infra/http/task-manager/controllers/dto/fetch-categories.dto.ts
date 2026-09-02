import { ApiProperty } from '@nestjs/swagger'
import { CategoryDto } from '../../dtos/category.dto'

export class FetchCategoriesResponseDto {
	@ApiProperty({
		type: CategoryDto,
		isArray: true,
	})
	data!: CategoryDto[]
}
