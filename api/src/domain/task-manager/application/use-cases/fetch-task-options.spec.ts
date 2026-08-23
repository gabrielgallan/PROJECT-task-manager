import { makeTask } from 'test/unit/factories/make-tasks'
import { InMemoryTasksRepository } from 'test/unit/repositories/in-memory-tasks-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { FetchTaskOptionsUseCase } from './fetch-task-options'

let tasksRepository: InMemoryTasksRepository
let sut: FetchTaskOptionsUseCase

describe('Fetch task options [USE CASE]', () => {
	beforeEach(() => {
		tasksRepository = new InMemoryTasksRepository()
		sut = new FetchTaskOptionsUseCase(tasksRepository)
	})

	it('should fetch all user task statuses in deterministic title order', async () => {
		await tasksRepository.create(
			makeTask(
				{ userId: new UniqueEntityID('user-1'), title: 'Zebra', status: 'DONE' },
				new UniqueEntityID('task-3'),
			),
		)
		await tasksRepository.create(
			makeTask(
				{ userId: new UniqueEntityID('user-1'), title: 'Ábaco', status: 'BACKLOG' },
				new UniqueEntityID('task-1'),
			),
		)
		await tasksRepository.create(
			makeTask(
				{ userId: new UniqueEntityID('user-1'), title: 'banana', status: 'IN_PROGRESS' },
				new UniqueEntityID('task-2'),
			),
		)
		await tasksRepository.create(
			makeTask(
				{ userId: new UniqueEntityID('user-2'), title: 'Aardvark' },
				new UniqueEntityID('other-user-task'),
			),
		)

		const result = await sut.execute({ userId: 'user-1', limit: 10 })

		expect(result.isRight()).toBe(true)
		expect(result.value?.items.map((task) => task.title)).toEqual(['Ábaco', 'banana', 'Zebra'])
		expect(result.value?.nextCursor).toBeNull()
	})

	it('should search only titles ignoring accents, case and external spaces', async () => {
		await tasksRepository.create(
			makeTask({
				userId: new UniqueEntityID('user-1'),
				title: 'Revisar autenticação',
				description: 'Outro assunto',
			}),
		)
		await tasksRepository.create(
			makeTask({
				userId: new UniqueEntityID('user-1'),
				title: 'Documentar API',
				description: 'Autenticação do usuário',
			}),
		)

		const result = await sut.execute({
			userId: 'user-1',
			search: '  AUTENTICACAO  ',
			limit: 10,
		})

		expect(result.value?.items.map((task) => task.title)).toEqual(['Revisar autenticação'])
	})

	it('should break normalized title ties by id', async () => {
		await tasksRepository.create(
			makeTask(
				{ userId: new UniqueEntityID('user-1'), title: 'Árvore' },
				new UniqueEntityID('task-b'),
			),
		)
		await tasksRepository.create(
			makeTask(
				{ userId: new UniqueEntityID('user-1'), title: 'arvore' },
				new UniqueEntityID('task-a'),
			),
		)

		const result = await sut.execute({ userId: 'user-1', limit: 10 })

		expect(result.value?.items.map((task) => task.id.toString())).toEqual([
			'task-a',
			'task-b',
		])
	})

	it('should navigate cursor pages without gaps or duplicates', async () => {
		for (const [index, title] of ['Alpha', 'Beta', 'Charlie', 'Delta', 'Echo'].entries()) {
			await tasksRepository.create(
				makeTask(
					{ userId: new UniqueEntityID('user-1'), title },
					new UniqueEntityID(`task-${index + 1}`),
				),
			)
		}

		const firstPage = await sut.execute({ userId: 'user-1', limit: 2 })
		const secondPage = await sut.execute({
			userId: 'user-1',
			limit: 2,
			cursor: firstPage.value?.nextCursor ?? undefined,
		})
		const lastPage = await sut.execute({
			userId: 'user-1',
			limit: 2,
			cursor: secondPage.value?.nextCursor ?? undefined,
		})

		expect(firstPage.value?.items.map((task) => task.title)).toEqual(['Alpha', 'Beta'])
		expect(secondPage.value?.items.map((task) => task.title)).toEqual(['Charlie', 'Delta'])
		expect(lastPage.value?.items.map((task) => task.title)).toEqual(['Echo'])
		expect(lastPage.value?.nextCursor).toBeNull()
	})

	it('should continue after a removed cursor record and handle empty results', async () => {
		const alpha = makeTask(
			{ userId: new UniqueEntityID('user-1'), title: 'Alpha' },
			new UniqueEntityID('task-1'),
		)
		const beta = makeTask(
			{ userId: new UniqueEntityID('user-1'), title: 'Beta' },
			new UniqueEntityID('task-2'),
		)

		await tasksRepository.create(alpha)
		await tasksRepository.create(beta)

		const firstPage = await sut.execute({ userId: 'user-1', limit: 1 })

		await tasksRepository.delete(alpha)

		const nextPage = await sut.execute({
			userId: 'user-1',
			limit: 1,
			cursor: firstPage.value?.nextCursor ?? undefined,
		})
		const empty = await sut.execute({ userId: 'user-without-tasks', limit: 10 })

		expect(nextPage.value?.items.map((task) => task.title)).toEqual(['Beta'])
		expect(nextPage.value?.nextCursor).toBeNull()
		expect(empty.value).toEqual({ items: [], nextCursor: null })
	})
})
