import { Check, ListFilter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PLAN_DOT } from '@/features/calendar/colors'
import { PLAN_COLORS } from '@/features/calendar/constants'
import { useCalendar } from '@/features/calendar/contexts/calendar-context'
import { cn } from '@/lib/utils'

export function PlanFilter() {
	const { selectedColors, toggleColorFilter, clearFilters } = useCalendar()
	const hasFilters = selectedColors.length > 0

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
				<ListFilter />
				<span className="max-md:sr-only">Filter</span>
				{hasFilters && (
					<Badge variant="secondary" className="ml-1">
						{selectedColors.length}
					</Badge>
				)}
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" className="w-44">
				<DropdownMenuLabel>Color</DropdownMenuLabel>

				{PLAN_COLORS.map((color) => (
					<DropdownMenuItem
						key={color}
						closeOnClick={false}
						onClick={() => toggleColorFilter(color)}
						className="justify-between capitalize"
					>
						<span className="flex items-center gap-2">
							<span className={cn('size-3 rounded-full', PLAN_DOT[color])} />
							{color}
						</span>
						{selectedColors.includes(color) && <Check className="size-4" />}
					</DropdownMenuItem>
				))}

				<DropdownMenuSeparator />
				<DropdownMenuItem disabled={!hasFilters} onClick={clearFilters}>
					Clear filters
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
