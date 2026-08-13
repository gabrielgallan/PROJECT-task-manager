export abstract class Hasher {
	abstract generate(plain: string): Promise<string>
	abstract compare(plain: string, hash: string): Promise<boolean>
}
