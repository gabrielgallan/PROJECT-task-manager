export abstract class SessionTokenHasher {
	abstract hash(plain: string): string
}
