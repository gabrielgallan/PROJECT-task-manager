import type { EmailSender } from '@/domain/identity/application/email/email-sender'

export class EmailSenderStub implements EmailSender {
	public emails: { to: string; subject: string; text: string }[] = []

	sendRecoveryLink(to: string, tokenId: string) {
		this.emails.push({
			to,
			subject: 'Recovery Link',
			text: `Your recovery link is: ${tokenId}`,
		})

		return Promise.resolve()
	}
}
