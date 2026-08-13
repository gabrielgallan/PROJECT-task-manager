import { Tags, X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CATEGORY_DOT } from '@/features/categories/model/category-colors'
import { NO_CATEGORY_FILTER } from '@/features/categories/model/category-rules'
import type { ICategory } from '@/features/categories/model/category-types'
import { cn } from '@/lib/utils'

interface ICategoryFilterProps {
	categories: ICategory[]
	selectedCategoryIds: string[]
	onToggle: (categoryId: string) => void
	onClear: () => void
	compactOnMobile?: boolean
}

export function CategoryFilter({
	categories,
	selectedCategoryIds,
	onToggle,
	onClear,
	compactOnMobile = false,
}: ICategoryFilterProps) {
	const [open, setOpen] = useState(false)
	const hasSelection = selectedCategoryIds.length > 0

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger render={<Button variant="outline" size="sm" />}>
				<Tags />
				<span className={cn(compactOnMobile && 'max-md:sr-only')}>
					{hasSelection ? 'Categories' : 'All categories'}
				</span>
				{hasSelection && (
					<Badge variant="secondary" className="ml-0.5">
						{selectedCategoryIds.length}
					</Badge>
				)}
			</PopoverTrigger>

			<PopoverContent align="start" className="w-72 gap-0 p-0">
				<Command>
					<CommandInput placeholder="Search categories..." />
					<CommandList>
						<CommandEmpty>No categories found.</CommandEmpty>
						<CommandGroup heading="Include">
							<CommandItem
								value="No category"
								data-checked={selectedCategoryIds.includes(NO_CATEGORY_FILTER)}
								onSelect={() => onToggle(NO_CATEGORY_FILTER)}
							>
								<span className="size-3 shrink-0 rounded-xs bg-muted-foreground/40" />
								<span className="text-muted-foreground">No category</span>
							</CommandItem>

							{categories.map((category) => (
								<CommandItem
									key={category.id}
									value={`${category.name} ${category.id}`}
									data-checked={selectedCategoryIds.includes(category.id)}
									onSelect={() => onToggle(category.id)}
								>
									<span
										className={cn('size-3 shrink-0 rounded-xs', CATEGORY_DOT[category.color])}
									/>
									<span className="truncate">{category.name}</span>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>

					<div className="border-t p-1">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="w-full justify-start"
							disabled={!hasSelection}
							onClick={onClear}
						>
							<X />
							Clear category filter
						</Button>
					</div>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
