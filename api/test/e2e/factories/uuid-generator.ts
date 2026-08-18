import { randomUUID } from 'node:crypto'

export function UUIDGenerator(arrayLength: number) {
	const array: string[] = []

	for (let c = 1; c <= arrayLength; c++) {
		array.push(randomUUID())
	}

	return array
}
