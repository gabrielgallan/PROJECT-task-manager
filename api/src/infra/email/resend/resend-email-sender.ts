import { BadGatewayException, Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import { EmailSender } from '@/domain/identity/application/email/email-sender'
import { EnvService } from '@/infra/env/env.service'
import { recoveryCodeEmail } from '../templates/recovery-code-email'

@Injectable()
export class ResendEmailSender implements EmailSender {
    private resend: Resend

    constructor(private env: EnvService) {
        this.resend = new Resend(env.get('RESEND_API_KEY'))
    }

    async sendRecoveryCode(to: string, code: string) {
        const recoverUrl = `${this.env.get('FRONTEND_URL')}/auth/reset-password?code=${code}`

        const { subject, text, html } = recoveryCodeEmail(recoverUrl)

        const { error } = await this.resend.emails.send({
            from: `"Smart Finance" <onboarding@resend.dev>`,
            to,
            subject,
            text,
            html
        })

        if (error) {
            throw new BadGatewayException({
                message: `Failed to send E-mail with Resend. ${error.message}`
            })
        }
    }
}