import {
    Body,
    Controller,
    HttpCode,
    InternalServerErrorException,
    NotFoundException,
    Put,
} from '@nestjs/common'
import z from 'zod'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { EditProfileUseCase } from '@/domain/identity/application/use-cases/edit-profile'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import type { UserPayload } from '@/infra/auth/user-payload'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'

const editProfileBodySchema = z.object({
    name: z.string().optional(),
    jobTitle: z.string().optional(),
})

type EditProfileBody = z.infer<typeof editProfileBodySchema>

@Controller()
export class EditProfileController {
    constructor(private readonly editProfile: EditProfileUseCase) {}

    @Put('/api/profile')
    @HttpCode(204)
    async handle(
        @CurrentUser()
        user: UserPayload, 
        
        @Body(new ZodValidationPipe(editProfileBodySchema))
        body: EditProfileBody
    ) {
        const { name, jobTitle } = body
        
        const result = await this.editProfile.execute({
            userId: user.id,
            name,
            jobTitle
        })

        if (result.isLeft()) {
            const error = result.value

            switch (error.constructor) {
                case ResourceNotFoundError:
                    throw new NotFoundException(error.message)

                default:
                    throw new InternalServerErrorException()
            }
        }

        return null
    }
}
