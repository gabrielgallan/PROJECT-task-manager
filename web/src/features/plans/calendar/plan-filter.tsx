import { Check, ListFilter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PLAN_COLORS, PLAN_DOT, type TPlanColor } from '@/features/plans/model/plan-colors'
import { cn } from '@/lib/utils'

interface IPlanFilterProps {
	selectedColors: TPlanColor[]
	onToggle: (color: TPlanColor) => void
	onClear: () => void
}

export function PlanFilter({ selectedColors, onToggle, onClear }: IPlanFilterProps) {
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
				<DropdownMenuGroup>
					<DropdownMenuLabel>Color</DropdownMenuLabel>

					{PLAN_COLORS.map((color) => (
						<DropdownMenuItem
							key={color}
							closeOnClick={false}
							onClick={() => onToggle(color)}
							className="justify-between capitalize"
						>
							<span className="flex items-center gap-2">
								<span className={cn('size-3 rounded-full', PLAN_DOT[color])} />
								{color}
							</span>
							{selectedColors.includes(color) && <Check className="size-4" />}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>

				<DropdownMenuSeparator />
				<DropdownMenuItem disabled={!hasFilters} onClick={onClear}>
					Clear filters
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
