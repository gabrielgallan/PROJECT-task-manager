import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { cn } from '@/lib/utils'
import { useCategoriesSettings } from '../hooks/use-categories-settings'
import { CategoryDialog } from './category-dialog'
import { DeleteCategoryDialog } from './delete-category-dialog'

export function CategoriesSettings() {
	const {
		categories,
		uncategorizedColor,
		changeFallbackColor,
		dialog,
		setDialog,
		closeDialog,
		deleteTarget,
		setDeleteTarget,
		data,
		isPending,
		isFetching,
		error,
		refetch,
		busy,
		generation,
	} = useCategoriesSettings()
	return (
		<>
			<Card className="bg-transparent ring-transparent">
				<CardHeader>
					<CardTitle className="text-lg">Categories</CardTitle>
					<CardDescription>
						Use categories to color plans and work logs consistently.
					</CardDescription>
					<CardAction>
						<Button size="sm" disabled={busy} onClick={() => setDialog({ mode: 'create' })}>
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
								onChange={changeFallbackColor}
							/>
						</div>
					</Field>

					<FieldSeparator />
					{error && (
						<Alert variant="destructive">
							<AlertDescription>
								{data && (
									<span>Categories could not be refreshed. Displayed items may be outdated. </span>
								)}
								{error}
							</AlertDescription>
							<Button
								variant="outline"
								size="sm"
								disabled={isFetching || busy}
								onClick={() => void refetch()}
							>
								Try again
							</Button>
						</Alert>
					)}
					{isPending && !data && (
						<p role="status" className="text-sm text-muted-foreground">
							Loading categories…
						</p>
					)}
					{isFetching && data && (
						<p role="status" className="text-sm text-muted-foreground">
							Refreshing categories…
						</p>
					)}

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
											disabled={busy}
											aria-label={`Edit ${category.name}`}
											onClick={() => setDialog({ mode: 'edit', category })}
										>
											<Pencil />
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											className="text-destructive hover:text-destructive"
											disabled={busy}
											aria-label={`Delete ${category.name}`}
											onClick={() => setDeleteTarget(category)}
										>
											<Trash2 />
										</Button>
									</ItemActions>
								</Item>
							))}
						</ItemGroup>
					) : data && !error ? (
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
					) : null}
				</CardContent>
			</Card>

			<CategoryDialog key={generation} state={dialog} onClose={closeDialog} />
			{deleteTarget && (
				<DeleteCategoryDialog
					key={`${generation}:${deleteTarget.id}`}
					category={deleteTarget}
					onClose={() => setDeleteTarget(null)}
				/>
			)}
		</>
	)
}
