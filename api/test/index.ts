import { createHash, randomBytes } from 'node:crypto'

function hashToken(token: string) {
	return createHash('sha256').update(token).digest('hex')
}

async function test() {
	const _token = randomBytes(32).toString('base64url')

	const tokenHash = hashToken('H_iOd6tFESVBW1cAY_hZfadsGua7UwxvnROSgajnXLs')

	console.log({ tokenHash })
}
test()
