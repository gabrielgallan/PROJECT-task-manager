import { Controller, Get, HttpCode, InternalServerErrorException, } from '@nestjs/common'
import { FetchCategoriesUseCase } from '@/domain/task-manager/application/use-cases/fetch-categories'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { CategoryPresenter } from '../presenters/category-presenter'

@Controller('/api/categories')
export class FetchCategoriesController {
    constructor(private fetchCategories: FetchCategoriesUseCase) {}

    @Get()
    @HttpCode(200)
    async handle(
        @CurrentUser()
        user: UserPayload,
    ) {
        const result = await this.fetchCategories.execute({
            userId: user.id
        })

        if (result.isLeft()) {
            throw new InternalServerErrorException()
        }

        return {
            data: result.value.data.map(CategoryPresenter.toHTTP),
        }
    }
}
