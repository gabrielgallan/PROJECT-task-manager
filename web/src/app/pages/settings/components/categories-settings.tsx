import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel, FieldSeparator } from '@/components/ui/field'
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from '@/components/ui/item'
import { CategoryColorSelect } from '@/features/categories/components/category-color-select'
import { CATEGORY_COLOR_LABELS, CATEGORY_DOT } from '@/features/categories/model/category-colors'
import type { ICategory } from '@/features/categories/model/category-types'
import { useCategories } from '@/features/categories/store/categories-store'
import { usePlans } from '@/features/plans/store/plans-store'
import { useWorkLogs } from '@/features/work-logs/store/work-logs-store'
import { cn } from '@/lib/utils'
import { CategoryDialog, type TCategoryDialogState } from './category-dialog'
import { DeleteCategoryDialog } from './delete-category-dialog'

export function CategoriesSettings() {
	const {
		categories,
		uncategorizedColor,
		addCategory,
		updateCategory,
		removeCategory,
		setUncategorizedColor,
	} = useCategories()
	const { plans, clearCategory: clearPlanCategory } = usePlans()
	const { workLogs, clearCategory: clearWorkLogCategory } = useWorkLogs()
	const [dialog, setDialog] = useState<TCategoryDialogState>({ mode: 'closed' })
	const [deleteTarget, setDeleteTarget] = useState<ICategory | null>(null)

	const usage = useMemo(() => {
		if (!deleteTarget) return { planCount: 0, workLogCount: 0 }

		return {
			planCount: plans.filter((plan) => plan.categoryId === deleteTarget.id).length,
			workLogCount: workLogs.filter((workLog) => workLog.categoryId === deleteTarget.id).length,
		}
	}, [deleteTarget, plans, workLogs])

	const closeDialog = () => setDialog({ mode: 'closed' })

	const createCategory = (category: ICategory) => {
		addCategory(category)
		closeDialog()
		toast.success('Category created')
	}

	const saveCategory = (category: ICategory) => {
		updateCategory(category)
		closeDialog()
		toast.success('Category updated')
	}

	const deleteCategory = (category: ICategory) => {
		clearPlanCategory(category.id)
		clearWorkLogCategory(category.id)
		removeCategory(category.id)
		setDeleteTarget(null)
		toast.success('Category deleted', {
			description: 'Associated plans and work logs are now uncategorized.',
		})
	}

	return (
		<>
			<Card className="bg-transparent ring-transparent">
				<CardHeader>
					<CardTitle className="text-lg">Categories</CardTitle>
					<CardDescription>
						Use categories to color plans and work logs consistently.
					</CardDescription>
					<CardAction>
						<Button size="sm" onClick={() => setDialog({ mode: 'create' })}>
							<Plus />
							New category
						</Button>
					</CardAction>
				</CardHeader>

				<CardContent className="flex flex-col gap-4">
					<Field>
						<div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
							<div className="min-w-0">
								<FieldLabel htmlFor="uncategorized-color">Uncategorized items</FieldLabel>
								<FieldDescription>
									Color used by plans and work logs without a category.
								</FieldDescription>
							</div>

							<CategoryColorSelect
								id="uncategorized-color"
								className="sm:w-44"
								value={uncategorizedColor}
								onChange={(color) => {
									setUncategorizedColor(color)
									toast.success('Fallback color updated')
								}}
							/>
						</div>
					</Field>

					<FieldSeparator />

					{categories.length > 0 ? (
						<ItemGroup className="gap-2">
							{categories.map((category) => (
								<Item key={category.id} variant="outline">
									<ItemMedia>
										<span className={cn('size-3 rounded-xs', CATEGORY_DOT[category.color])} />
									</ItemMedia>
									<ItemContent>
										<ItemTitle>{category.name}</ItemTitle>
										<ItemDescription>{CATEGORY_COLOR_LABELS[category.color]}</ItemDescription>
									</ItemContent>
									<ItemActions>
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label={`Edit ${category.name}`}
											onClick={() => setDialog({ mode: 'edit', category })}
										>
											<Pencil />
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											className="text-destructive hover:text-destructive"
											aria-label={`Delete ${category.name}`}
											onClick={() => setDeleteTarget(category)}
										>
											<Trash2 />
										</Button>
									</ItemActions>
								</Item>
							))}
						</ItemGroup>
					) : (
						<Item variant="muted" className="justify-center py-8 text-center">
							<ItemMedia>
								<Tags className="size-5 text-muted-foreground" />
							</ItemMedia>
							<ItemContent className="max-w-sm flex-none">
								<ItemTitle className="w-full justify-center">No categories yet</ItemTitle>
								<ItemDescription>
									Plans and work logs will use the uncategorized color until you create one.
								</ItemDescription>
							</ItemContent>
						</Item>
					)}
				</CardContent>
			</Card>

			<CategoryDialog
				state={dialog}
				categories={categories}
				onClose={closeDialog}
				onCreate={createCategory}
				onUpdate={saveCategory}
			/>
			<DeleteCategoryDialog
				category={deleteTarget}
				planCount={usage.planCount}
				workLogCount={usage.workLogCount}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
				onConfirm={deleteCategory}
			/>
		</>
	)
}
