import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { deleteUser } from '@/api/delete-user'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEndSession } from '@/features/identity/hooks/use-end-session'
import { getIdentityError } from '@/features/identity/model/identity-errors'

export function DeleteAccountDialog({ email }: { email: string }) {
	const [open, setOpen] = useState(false)
	const [confirmation, setConfirmation] = useState('')
	const [error, setError] = useState<string | null>(null)
	const { endSession, capture, revalidateSession, busy } = useEndSession()
	const mutation = useMutation({
		mutationKey: ['identity', 'delete-account'],
		mutationFn: deleteUser,
		retry: false,
		networkMode: 'always',
		gcTime: 0,
	})
	const pending = mutation.isPending || busy
	async function confirm() {
		if (pending || confirmation.trim() !== email) return
		const current = capture()
		setError(null)
		try {
			await mutation.mutateAsync()
			if (current()) await endSession('Your account has been deleted.')
		} catch (failure) {
			if (current() && !(await revalidateSession(failure)) && current())
				setError(getIdentityError(failure, 'delete'))
		}
	}
	return (
		<AlertDialog
			open={open}
			onOpenChange={(next) => {
				if (pending) return
				setOpen(next)
				if (!next) {
					setConfirmation('')
					setError(null)
				}
			}}
		>
			<AlertDialogTrigger render={<Button variant="destructive" disabled={busy} />}>
				Delete account
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete your account?</AlertDialogTitle>
					<AlertDialogDescription>
						This permanently removes your account and its data stored on the server. This cannot be
						undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<form
					onSubmit={(event) => {
						event.preventDefault()
						void confirm()
					}}
					className="space-y-4"
				>
					<div className="space-y-2">
						<Label htmlFor="delete-confirmation" className="block break-words">
							Type {email} to confirm
						</Label>
						<Input
							id="delete-confirmation"
							type="email"
							autoComplete="off"
							value={confirmation}
							onChange={(event) => setConfirmation(event.target.value)}
							disabled={pending}
						/>
					</div>
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					<AlertDialogFooter>
						<AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							type="submit"
							variant="destructive"
							disabled={pending || confirmation.trim() !== email}
						>
							{pending ? 'Deleting…' : 'Delete account'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</form>
			</AlertDialogContent>
		</AlertDialog>
	)
}
