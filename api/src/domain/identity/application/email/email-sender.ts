export interface EmailSender {
	sendRecoveryCode(to: string, code: string): Promise<void>
}
