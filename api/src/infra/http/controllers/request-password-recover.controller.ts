import {
    Body,
    Controller,
    HttpCode,
    InternalServerErrorException,
    NotFoundException,
    Post,
} from '@nestjs/common'
import { z } from 'zod'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { RequestPasswordRecoverUseCase } from '@/domain/identity/application/use-cases/request-password-recover'
import { Public } from '@/infra/auth/public.decorator'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'

const requestPasswordRecoverBodySchema = z.object({
    email: z.email()
})

type RequestPasswordRecoverBody = z.infer<typeof requestPasswordRecoverBodySchema>

@Controller()
@Public()
export class RequestPasswordRecoverController {
    constructor(private readonly requestPasswordRecover: RequestPasswordRecoverUseCase) {}

    @Post('/api/profile/password/recover')
    @HttpCode(201)
    async handle(
        @Body(new ZodValidationPipe(requestPasswordRecoverBodySchema))
        body: RequestPasswordRecoverBody,
    ) {
        const { email } = body

        const result = await this.requestPasswordRecover.execute({
            email
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
