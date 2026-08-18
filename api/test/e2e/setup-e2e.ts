import 'dotenv/config'

import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client'

const baseDatabaseURL = process.env.DATABASE_URL

if (!baseDatabaseURL) {
	throw new Error('Provide a DATABASE_URL environment variable')
}

// Conexao administrativa, sempre no schema padrao, usada apenas para o DROP.
const adapter = new PrismaPg({ connectionString: baseDatabaseURL })

const prisma = new PrismaClient({ adapter, log: ['error'] })

function generateUniqueDatabaseURL(schemaId: string) {
	const url = new URL(baseDatabaseURL as string)

	url.searchParams.set('schema', schemaId)

	return url.toString()
}

const schemaId = `test_${randomUUID().replaceAll('-', '')}`
const databaseURL = generateUniqueDatabaseURL(schemaId)

// IMPORTANTE: precisa acontecer no topo do modulo, e nao dentro do `beforeAll`.
// O `ConfigModule.forRoot()` do AppModule le o `process.env` no momento em que o
// decorator `@Module` e avaliado, ou seja, no import do app.module.ts - que
// ocorre antes de qualquer hook rodar.
process.env.DATABASE_URL = databaseURL

beforeAll(async () => {
	execSync('pnpm prisma migrate deploy', {
		env: { ...process.env, DATABASE_URL: databaseURL },
		stdio: 'ignore',
	})
})

afterAll(async () => {
	await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`)
	await prisma.$disconnect()
})
