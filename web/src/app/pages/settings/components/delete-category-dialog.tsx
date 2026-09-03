import { Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { Button } from '@/components/ui/button'
import type { ICategory } from '@/features/categories/model/category-types'
import { useDeleteCategoryDialog } from '../hooks/use-delete-category-dialog'

interface IDeleteCategoryDialogProps {
	category: ICategory
	onClose: () => void
}

function getCountLabel(count: number, singular: string, plural: string) {
	return `${count} ${count === 1 ? singular : plural}`
}

export function DeleteCategoryDialog({ category, onClose }: IDeleteCategoryDialogProps) {
	const {
		confirm,
		close,
		retry,
		pending,
		disabled,
		canConfirm,
		error,
		counts,
		checking,
		canRetry,
	} = useDeleteCategoryDialog(category, onClose)
	return (
		<AlertDialog open onOpenChange={(open) => !open && close()}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogMedia>
						<Trash2 className="text-destructive" />
					</AlertDialogMedia>
					<AlertDialogTitle>Delete category</AlertDialogTitle>
					<AlertDialogDescription>
						“{category.name}” will be removed. Plans and work logs will be kept without this
						category.
					</AlertDialogDescription>
				</AlertDialogHeader>
				{checking && (
					<p role="status" className="text-sm text-muted-foreground">
						Checking category usage…
					</p>
				)}
				{counts && (
					<p className="text-sm text-muted-foreground">
						{getCountLabel(counts.plansCount, 'plan', 'plans')} and{' '}
						{getCountLabel(counts.workLogsCount, 'work log', 'work logs')} will become
						uncategorized.
					</p>
				)}
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
				{error && canRetry && (
					<Button variant="outline" onClick={retry}>
						Try again
					</Button>
				)}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={disabled}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onClick={() => void confirm()}
						disabled={!canConfirm}
					>
						{pending ? 'Deleting…' : 'Delete'}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
