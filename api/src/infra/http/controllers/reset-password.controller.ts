import {
    BadRequestException,
    Body,
    Controller,
    HttpCode,
    InternalServerErrorException,
    NotFoundException,
    Patch,
} from '@nestjs/common'
import { z } from 'zod'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { InvalidTokenError } from '@/domain/identity/application/use-cases/errors/invalid-token-error'
import { ResetPasswordUseCase } from '@/domain/identity/application/use-cases/reset-password'
import { Public } from '@/infra/auth/public.decorator'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'

const resetPasswordBodySchema = z.object({
    code: z.string(),
    password: z.string().min(6).max(18),
})

type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>

@Controller()
@Public()
export class ResetPasswordController {
    constructor(private readonly resetPassword: ResetPasswordUseCase) {}

    @Patch('/api/profile/password')
    @HttpCode(204)
    async handle(
        @Body(new ZodValidationPipe(resetPasswordBodySchema))
        body: ResetPasswordBody,
    ) {
        const { code, password } = body

        const result = await this.resetPassword.execute({
            recoverCode: code,
            password
        })

        if (result.isLeft()) {
            const error = result.value

            switch (error.constructor) {
                case ResourceNotFoundError:
                    throw new NotFoundException(error.message)

                case InvalidTokenError:
                    throw new BadRequestException(error.message)

                default:
                    throw new InternalServerErrorException()
            }
        }

        return null
    }
}
