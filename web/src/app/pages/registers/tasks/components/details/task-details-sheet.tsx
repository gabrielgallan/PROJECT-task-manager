import { format } from 'date-fns'
import { CalendarPlus, CalendarRange, CircleCheck, Clock, ExternalLink } from 'lucide-react'
import {
	groupEntriesByDay,
	type ITaskActivityEntry,
	sumEntryMinutes,
} from '@/app/pages/registers/tasks/components/details/task-activity'
import { TaskPriorityBadge } from '@/app/pages/registers/tasks/components/list/task-priority-badge'
import { TaskStatusBadge } from '@/app/pages/registers/tasks/components/list/task-status-badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet'
import { formatDuration, formatMinutes } from '@/features/calendar/lib/formatting'
import { canLogWorkForTask, canPlanTask } from '@/features/tasks/model/task-transitions'
import type { Task } from '@/features/tasks/model/task-types'
import { cn } from '@/lib/utils'

interface ITaskDetailsSheetProps {
	task: Task | null
	entries: ITaskActivityEntry[]
	summary?: { plannedMinutes: number; loggedMinutes: number }
	loading?: boolean
	error?: string | null
	onRetry: () => void
	onOpenChange: (open: boolean) => void
	onOpenPlans: (task: Task) => void
	onOpenWorkLogs: (task: Task) => void
}

function SummaryTile({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
	return (
		<div className="flex flex-col gap-0.5 rounded-md border px-3 py-2">
			<span className="text-xs text-muted-foreground">{label}</span>
			<span className={cn(['font-medium tabular-nums', muted && 'text-muted-foreground'])}>
				{value}
			</span>
		</div>
	)
}

function ActivityRow({ entry }: { entry: ITaskActivityEntry }) {
	const isPlan = entry.kind === 'plan'

	return (
		<li className="flex items-baseline gap-3">
			{/* Filled marks work that happened; hollow marks work that is only intended. */}
			<span
				className={cn([
					'mt-1.5 size-2 shrink-0 rounded-full',
					isPlan ? 'border border-muted-foreground' : 'bg-foreground',
				])}
			/>

			<div className="flex min-w-0 flex-1 flex-col">
				<span className="flex items-center gap-1.5 truncate font-medium">
					{entry.isConfirmed && <CircleCheck className="size-3 shrink-0 text-muted-foreground" />}
					<span className="truncate">{entry.title}</span>
				</span>

				<span className="text-xs text-muted-foreground tabular-nums">
					{format(entry.startDate, 'HH:mm')} – {format(entry.endDate, 'HH:mm')}
					{` · ${formatDuration(entry.startDate, entry.endDate)}`}
				</span>
			</div>

			<span className="shrink-0 text-xs text-muted-foreground">{isPlan ? 'Plan' : 'Logged'}</span>
		</li>
	)
}

export function TaskDetailsSheet({
	task,
	entries,
	summary,
	loading,
	error,
	onRetry,
	onOpenChange,
	onOpenPlans,
	onOpenWorkLogs,
}: ITaskDetailsSheetProps) {
	// The sheet animates out, so it must survive the task going away.
	if (!task) {
		return <Sheet open={false} onOpenChange={onOpenChange} />
	}

	const plannedMinutes = summary?.plannedMinutes ?? sumEntryMinutes(entries, 'plan')
	const loggedMinutes = summary?.loggedMinutes ?? sumEntryMinutes(entries, 'work-log')
	const days = groupEntriesByDay(entries)

	// Without a plan there is nothing to compare against, so no number is shown
	// rather than one that reads as a full overrun.
	const difference = loggedMinutes - plannedMinutes
	const balanceLabel =
		plannedMinutes === 0
			? '—'
			: difference === 0
				? 'On plan'
				: `${formatMinutes(Math.abs(difference))} ${difference > 0 ? 'over' : 'left'}`

	return (
		<Sheet open onOpenChange={onOpenChange}>
			<SheetContent className="flex flex-col gap-0 overflow-y-auto">
				<SheetHeader>
					<SheetTitle className="pr-8">{task.title}</SheetTitle>

					<div className="flex flex-wrap items-center gap-2 pt-1">
						<TaskStatusBadge status={task.status} />
						<TaskPriorityBadge priority={task.priority} />
					</div>

					{task.description ? (
						<SheetDescription className="pt-2">{task.description}</SheetDescription>
					) : (
						<SheetDescription className="pt-2 italic">No description</SheetDescription>
					)}
				</SheetHeader>

				<div className="flex flex-col gap-4 px-4 pb-4">
					{loading && <p role="status" className="text-sm text-muted-foreground">Loading details…</p>}
					{error && <><Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert><Button variant="outline" size="sm" onClick={onRetry}>Try again</Button></>}
					<div className="grid grid-cols-2 gap-2 text-sm">
						<div className="flex flex-col gap-0.5">
							<span className="text-xs text-muted-foreground">Start</span>
							<span className="tabular-nums">
								{task.startDate ? format(task.startDate, 'dd/MM/yy') : '-'}
							</span>
						</div>

						<div className="flex flex-col gap-0.5">
							<span className="text-xs text-muted-foreground">Due</span>
							<span className="tabular-nums">
								{task.dueDate ? format(task.dueDate, 'dd/MM/yy') : '-'}
							</span>
						</div>
					</div>

					<Separator />

					{!loading && !error && <div className="grid grid-cols-3 gap-2">
						<SummaryTile label="Planned" value={formatMinutes(plannedMinutes)} />
						<SummaryTile label="Logged" value={formatMinutes(loggedMinutes)} />
						<SummaryTile label="Balance" value={balanceLabel} muted={plannedMinutes === 0} />
					</div>}

					{!loading && !error && <div className="flex flex-col gap-3">
						<span className="text-sm font-medium">Activity</span>

						{days.length === 0 ? (
							<div className="flex flex-col items-center gap-3 rounded-md border border-dashed py-8 text-center">
								<CalendarRange className="size-5 text-muted-foreground" />

								<div className="space-y-1 px-4">
									<p className="text-sm font-medium">Nothing scheduled yet</p>
									<p className="text-xs text-muted-foreground">
										Plans and work logs linked to this task show up here.
									</p>
								</div>

								<div className="flex flex-wrap justify-center gap-2">
									{canPlanTask(task.status) && (
										<Button variant="outline" size="sm" onClick={() => onOpenPlans(task)}>
											<CalendarPlus />
											Plan it
										</Button>
									)}

									{canLogWorkForTask(task.status) && (
										<Button variant="outline" size="sm" onClick={() => onOpenWorkLogs(task)}>
											<Clock />
											Log work
										</Button>
									)}
								</div>
							</div>
						) : (
							days.map((day) => (
								<div key={day.date.toISOString()} className="flex flex-col gap-2">
									<span className="text-xs font-medium text-muted-foreground">
										{format(day.date, 'EEE, dd MMM')}
									</span>

									<ul className="flex flex-col gap-3">
										{day.entries.map((entry) => (
											<ActivityRow key={`${entry.kind}-${entry.id}`} entry={entry} />
										))}
									</ul>
								</div>
							))
						)}
					</div>}
				</div>

				<SheetFooter className="mt-auto flex-row gap-2">
					<Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenPlans(task)}>
						<ExternalLink />
						Plans
					</Button>

					<Button
						variant="outline"
						size="sm"
						className="flex-1"
						onClick={() => onOpenWorkLogs(task)}
					>
						<ExternalLink />
						Work logs
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
