import { useState } from 'react'
import {
	KanbanBoard,
	KanbanCard,
	KanbanCards,
	KanbanHeader,
	KanbanProvider,
} from '@/components/kibo-ui/kanban'
import {
	TASK_STATUS_ICON,
	TASK_STATUS_ICON_COLOR,
	TASK_STATUS_LABEL,
	TASK_STATUSES,
} from '@/features/tasks/model/task-status'
import type { TaskStatus } from '@/features/tasks/model/task-types'
import { cn } from '@/lib/utils'
import { GridFrame } from './grid-frame'

interface IShowcaseColumn {
	id: TaskStatus
	name: string
}

interface IShowcaseCard {
	id: string
	name: string
	column: TaskStatus
}

/** Derived from the product's own lifecycle, so the board cannot drift from it. */
const SHOWCASE_COLUMNS: IShowcaseColumn[] = TASK_STATUSES.map((status) => ({
	id: status,
	name: TASK_STATUS_LABEL[status],
}))

/** The board itself is the pitch: every card is a step into the product. */
const SHOWCASE_CARDS: IShowcaseCard[] = [
	{ id: 'create-account', name: 'Create your account', column: 'BACKLOG' },
	{ id: 'register-tasks', name: 'Start registering your tasks', column: 'BACKLOG' },
	{ id: 'plan-week', name: 'Plan your week', column: 'IN_PROGRESS' },
	{ id: 'track-hours', name: 'Track the hours you work', column: 'IN_PROGRESS' },
	{ id: 'manage-flow', name: 'Manage your workflow', column: 'DONE' },
]

export function ProductShowcase() {
	const [cards, setCards] = useState<IShowcaseCard[]>(SHOWCASE_CARDS)

	return (
		<div className="mx-auto max-w-xl">
			<GridFrame offset={34} lineClassName="border-primary-foreground/10">
				<div>
					<KanbanProvider columns={SHOWCASE_COLUMNS} data={cards} onDataChange={setCards}>
						{(column) => {
							const Icon = TASK_STATUS_ICON[column.id]

							return (
								// The panel paints everything `primary-foreground`, which lands
								// invisible on the board's own surface. It has to state its own.
								<KanbanBoard
									key={column.id}
									id={column.id}
									className="h-70 text-secondary-foreground"
								>
									<KanbanHeader className="flex items-center gap-2">
										<Icon className={cn(['size-3.5', TASK_STATUS_ICON_COLOR[column.id]])} />
										{column.name}
									</KanbanHeader>

									<KanbanCards id={column.id}>
										{(card: IShowcaseCard) => (
											<KanbanCard key={card.id} {...card} className="px-3 py-2" />
										)}
									</KanbanCards>
								</KanbanBoard>
							)
						}}
					</KanbanProvider>
				</div>
			</GridFrame>
		</div>
	)
}
