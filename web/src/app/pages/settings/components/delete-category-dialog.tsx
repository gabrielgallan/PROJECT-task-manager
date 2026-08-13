import { Trash2 } from 'lucide-react'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { ICategory } from '@/features/categories/model/category-types'

interface IDeleteCategoryDialogProps {
	category: ICategory | null
	planCount: number
	workLogCount: number
	onOpenChange: (open: boolean) => void
	onConfirm: (category: ICategory) => void
}

function getCountLabel(count: number, singular: string, plural: string) {
	return `${count} ${count === 1 ? singular : plural}`
}

export function DeleteCategoryDialog({
	category,
	planCount,
	workLogCount,
	onOpenChange,
	onConfirm,
}: IDeleteCategoryDialogProps) {
	return (
		<AlertDialog open={Boolean(category)} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogMedia>
						<Trash2 className="text-destructive" />
					</AlertDialogMedia>

					<AlertDialogTitle>Delete category</AlertDialogTitle>

					<AlertDialogDescription>
						“{category?.name}” will be removed. {getCountLabel(planCount, 'plan', 'plans')} and{' '}
						{getCountLabel(workLogCount, 'work log', 'work logs')} will become uncategorized.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onClick={() => category && onConfirm(category)}
					>
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
