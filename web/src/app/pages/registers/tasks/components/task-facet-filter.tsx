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
	onToggle: (value: TValue) => void
	onClear: () => void
}

export function TaskFacetFilter<TValue extends string>({
	label,
	options,
	selected,
	onToggle,
	onClear,
}: ITaskFacetFilterProps<TValue>) {
	const hasSelection = selected.length > 0

	return (
		<DropdownMenu>
			{/* Only the count rides along, so the trigger keeps a steady width
			    however many values are picked. */}
			<DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
				<ListFilter />
				{label}

				{hasSelection && (
					<Badge variant="secondary" className="ml-1">
						{selected.length}
					</Badge>
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
