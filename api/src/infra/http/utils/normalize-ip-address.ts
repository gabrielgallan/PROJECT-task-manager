export function normalizeIpAddress(ip?: string | null): string | undefined {
	if (!ip) return undefined

	const normalized = ip.trim()

	// IPv4 representado como IPv6
	if (normalized.startsWith('::ffff:')) {
		return normalized.slice(7)
	}

	// localhost IPv6
	if (normalized === '::1') {
		return '127.0.0.1'
	}

	return normalized
}
