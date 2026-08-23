export function normalizeDisplayText(value: string) {
	return value.normalize('NFC').trim().replace(/\s+/gu, ' ')
}

export function normalizeSearchText(value: string) {
	return normalizeDisplayText(value)
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
}
