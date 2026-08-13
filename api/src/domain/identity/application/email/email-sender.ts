export abstract class EmailSender {
	abstract sendRecoveryCode(to: string, code: string): Promise<void>
}
