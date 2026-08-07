import { ListFilter } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'

export interface IFacetOption<TValue extends string> {
	value: TValue
	label: string
	/** Same mark used for the value in the table, so the menu reads as the rows do. */
	icon?: ReactNode
}

interface ITaskFacetFilterProps<TValue extends string> {
	label: string
	options: IFacetOption<TValue>[]
	selected: TValue[]
	counts?: Record<string, number>
	onToggle: (value: TValue) => void
	onClear: () => void
}

/** Selected values are named in the trigger while they still fit. */
const MAX_TRIGGER_LABELS = 2

export function TaskFacetFilter<TValue extends string>({
	label,
	options,
	selected,
	counts,
	onToggle,
	onClear,
}: ITaskFacetFilterProps<TValue>) {
	const hasSelection = selected.length > 0
	const selectedOptions = options.filter((option) => selected.includes(option.value))

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
				<ListFilter />
				{label}

				{hasSelection && (
					<>
						<Separator orientation="vertical" className="mx-0.5 h-3.5" />

						{selectedOptions.length > MAX_TRIGGER_LABELS ? (
							<Badge variant="secondary">{selectedOptions.length} selected</Badge>
						) : (
							selectedOptions.map((option) => (
								<Badge key={option.value} variant="secondary">
									{option.label}
								</Badge>
							))
						)}
					</>
				)}
			</DropdownMenuTrigger>

			<DropdownMenuContent align="start" className="w-52">
				<DropdownMenuGroup>
					{options.map((option) => (
						<DropdownMenuCheckboxItem
							key={option.value}
							checked={selected.includes(option.value)}
							onCheckedChange={() => onToggle(option.value)}
						>
							<span className="flex flex-1 items-center gap-2">
								{option.icon}
								{option.label}
							</span>

							{counts && (
								<span className="text-xs text-muted-foreground tabular-nums">
									{counts[option.value] ?? 0}
								</span>
							)}
						</DropdownMenuCheckboxItem>
					))}
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				<DropdownMenuItem disabled={!hasSelection} onClick={onClear}>
					Clear {label.toLowerCase()}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
