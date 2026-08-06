import { CalendarDays, CalendarFold, CalendarRange, Info, ZoomIn, ZoomOut } from 'lucide-react'
import type { Range } from '@/components/kibo-ui/gantt'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MAX_GANTT_ZOOM, MIN_GANTT_ZOOM } from '@/app/pages/registers/tasks/components/gantt/tasks-gantt-constants'

const RANGE_OPTIONS: Record<Range, { label: string; icon: typeof CalendarDays }> = {
	daily: { label: 'Day', icon: CalendarDays },
	monthly: { label: 'Month', icon: CalendarRange },
	quarterly: { label: 'Quarter', icon: CalendarFold },
}

interface ITasksGanttToolbarProps {
	range: Range
	zoom: number
	undatedCount: number
	onRangeChange: (range: Range) => void
	onZoomChange: (zoom: number) => void
}

export function TasksGanttToolbar({
	range,
	zoom,
	undatedCount,
	onRangeChange,
	onZoomChange,
}: ITasksGanttToolbarProps) {
	return (
		<header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-3 py-2">
			<div className="flex items-center gap-2">
				<span className="text-sm font-semibold">Delivery timeline</span>

				{undatedCount > 0 && (
					<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<Info className="size-3.5" />
						{undatedCount} {undatedCount === 1 ? 'task' : 'tasks'} without due date
					</span>
				)}
			</div>

			<div className="flex items-center gap-2">
				<div className="flex items-center">
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Zoom out"
						disabled={zoom <= MIN_GANTT_ZOOM}
						onClick={() => onZoomChange(zoom - 25)}
					>
						<ZoomOut />
					</Button>

					<span className="w-11 text-center text-xs text-muted-foreground tabular-nums">
						{zoom}%
					</span>

					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Zoom in"
						disabled={zoom >= MAX_GANTT_ZOOM}
						onClick={() => onZoomChange(zoom + 25)}
					>
						<ZoomIn />
					</Button>
				</div>

				<Tabs value={range} onValueChange={(value) => onRangeChange(value as Range)}>
					<TabsList>
						{(Object.keys(RANGE_OPTIONS) as Range[]).map((value) => {
							const { label, icon: Icon } = RANGE_OPTIONS[value]

							return (
								<TabsTrigger key={value} value={value} className="gap-1.5">
									<Icon className="size-4" />
									<span className="max-md:sr-only">{label}</span>
								</TabsTrigger>
							)
						})}
					</TabsList>
				</Tabs>
			</div>
		</header>
	)
}
