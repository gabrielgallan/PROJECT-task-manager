import { addDays, startOfDay } from 'date-fns'
import type { Task, TaskPriority, TaskStatus } from '@/features/tasks/model/task-types'

interface ISeed {
	title: string
	description?: string
	status: TaskStatus
	priority: TaskPriority
	/** Offsets in days relative to today, so the mock stays around the "Today" marker. */
	startOffset?: number
	dueOffset?: number
	createdOffset: number
	updatedOffset: number
}

const SEEDS: ISeed[] = [
	{
		title: 'Integração DAHUA',
		description: 'Mapear os eventos da SDK e cobrir o fluxo de reconexão da câmera.',
		status: 'IN_PROGRESS',
		priority: 'CRITICAL',
		startOffset: -12,
		dueOffset: 7,
		createdOffset: -20,
		updatedOffset: -1,
	},
	{
		title: 'POC de reconhecimento de placas',
		status: 'IN_PROGRESS',
		priority: 'CRITICAL',
		startOffset: -6,
		dueOffset: 45,
		createdOffset: -8,
		updatedOffset: -2,
	},
	{
		title: 'Correção de fuso horário nos logs',
		status: 'IN_PROGRESS',
		priority: 'HIGH',
		startOffset: -1,
		dueOffset: 1,
		createdOffset: -4,
		updatedOffset: 0,
	},
	{
		title: 'Revisão Auto Guide',
		status: 'IN_PROGRESS',
		priority: 'MEDIUM',
		startOffset: -3,
		dueOffset: 2,
		createdOffset: -9,
		updatedOffset: 0,
	},
	{
		title: 'Relatório mensal de horas',
		status: 'BACKLOG',
		priority: 'HIGH',
		startOffset: -10,
		dueOffset: -2,
		createdOffset: -14,
		updatedOffset: -7,
	},
	{
		title: 'Migração do banco de imagens',
		status: 'BACKLOG',
		priority: 'HIGH',
		startOffset: 3,
		dueOffset: 24,
		createdOffset: -5,
		updatedOffset: -5,
	},
	{
		title: 'Integração HIKVISION',
		status: 'BACKLOG',
		priority: 'LOW',
		startOffset: 10,
		dueOffset: 38,
		createdOffset: -18,
		updatedOffset: -6,
	},
	{
		title: 'Documentação da API de eventos',
		description: 'Sem prazo definido: fica fora da timeline até ganhar uma data.',
		status: 'BACKLOG',
		priority: 'LOW',
		createdOffset: -11,
		updatedOffset: -3,
	},
	{
		title: 'Padronizar mensagens de erro',
		status: 'BACKLOG',
		priority: 'MEDIUM',
		createdOffset: -7,
		updatedOffset: -7,
	},
	{
		title: 'Verificação de Tickets',
		status: 'DONE',
		priority: 'HIGH',
		startOffset: -25,
		dueOffset: -14,
		createdOffset: -30,
		updatedOffset: -14,
	},
	{
		title: 'Atualização de dependências',
		status: 'DONE',
		priority: 'MEDIUM',
		startOffset: -18,
		dueOffset: -10,
		createdOffset: -22,
		updatedOffset: -10,
	},
	{
		title: 'Ajustes de layout do dashboard',
		status: 'DONE',
		priority: 'LOW',
		startOffset: -40,
		dueOffset: -28,
		createdOffset: -45,
		updatedOffset: -28,
	},
]

const TODAY = startOfDay(new Date())

export const TASKS_MOCK: Task[] = SEEDS.map((seed, index) => ({
	id: `task-${index + 1}`,
	title: seed.title,
	description: seed.description,
	status: seed.status,
	priority: seed.priority,
	startDate: seed.startOffset === undefined ? undefined : addDays(TODAY, seed.startOffset),
	dueDate: seed.dueOffset === undefined ? undefined : addDays(TODAY, seed.dueOffset),
	createdAt: addDays(TODAY, seed.createdOffset),
	updatedAt: addDays(TODAY, seed.updatedOffset),
}))
