export abstract class EmailSender {
	abstract sendRecoveryLink(to: string, tokenId: string): Promise<void>
}
