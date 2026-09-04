import { useMutation } from '@tanstack/react-query'
import { Laptop, Monitor, Smartphone, Tablet } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { revokeAllSessions } from '@/api/revoke-all-sessions'
import { revokeSession } from '@/api/revoke-session'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useEndSession } from '@/features/identity/hooks/use-end-session'
import { useSessions } from '@/features/identity/hooks/use-sessions'
import {
	getSessionDetails,
	getSessionLabel,
	type IdentitySession,
	sessionsQueryKey,
} from '@/features/identity/model/identity'
import { getHttpStatus, getIdentityError } from '@/features/identity/model/identity-errors'

export function ActiveSessions({ active }: { active: boolean }) {
	const query = useSessions(active)
	const { client, capture, revalidateSession, endSession, busy } = useEndSession()
	const [error, setError] = useState<string | null>(null)
	const [dialogError, setDialogError] = useState<string | null>(null)
	const [open, setOpen] = useState(false)
	const handledError = useRef(0)
	const revoke = useMutation({
		mutationKey: ['identity', 'revoke-session'],
		mutationFn: revokeSession,
		retry: false,
		networkMode: 'always',
		gcTime: 0,
	})
	const revokeAll = useMutation({
		mutationKey: ['identity', 'revoke-all-sessions'],
		mutationFn: revokeAllSessions,
		retry: false,
		networkMode: 'always',
		gcTime: 0,
	})
	const pending = revoke.isPending || revokeAll.isPending || busy
	useEffect(() => {
		if (
			active &&
			getHttpStatus(query.error) === 401 &&
			handledError.current !== query.errorUpdatedAt
		) {
			handledError.current = query.errorUpdatedAt
			void revalidateSession(query.error)
		}
	}, [active, query.error, query.errorUpdatedAt, revalidateSession])
	async function revokeOne(sessionId: string) {
		if (pending) return
		const current = capture()
		setError(null)
		try {
			await revoke.mutateAsync({ sessionId })
			if (!current()) return
			await client.cancelQueries({ queryKey: sessionsQueryKey, exact: true })
			if (!current()) return
			client.setQueryData<{ sessions: IdentitySession[] }>(sessionsQueryKey, (previous) =>
				previous
					? { sessions: previous.sessions.filter((session) => session.id !== sessionId) }
					: previous,
			)
			toast.success('Session revoked')
			void client.invalidateQueries({ queryKey: sessionsQueryKey })
		} catch (failure) {
			if (!current() || (await revalidateSession(failure)) || !current()) return
			setError(getIdentityError(failure, 'revoke'))
			if (getHttpStatus(failure) === 404)
				void client.invalidateQueries({ queryKey: sessionsQueryKey })
		}
	}
	async function revokeEverySession() {
		if (pending) return
		const current = capture()
		setDialogError(null)
		try {
			await revokeAll.mutateAsync()
			if (current()) await endSession('You have been signed out of all devices.')
		} catch (failure) {
			if (current() && !(await revalidateSession(failure)) && current())
				setDialogError(getIdentityError(failure, 'revoke'))
		}
	}
	return (
		<section className="space-y-4" aria-labelledby="sessions-heading">
			<div className="space-y-1">
				<h2 id="sessions-heading" className="font-medium">
					Active sessions
				</h2>
				<p className="text-sm text-muted-foreground">
					Devices that are currently signed in to your account.
				</p>
			</div>
			{query.error && (
				<Alert variant="destructive">
					<AlertDescription>Unable to refresh your sessions.</AlertDescription>
					<Button disabled={query.isFetching || pending} onClick={() => void query.refetch()}>
						Try again
					</Button>
				</Alert>
			)}
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			{!query.data && query.isPending ? (
				<div role="status" aria-label="Loading sessions">
					<Skeleton className="h-20 w-full" />
				</div>
			) : query.data?.sessions.length === 0 ? (
				<p className="text-sm text-muted-foreground">No active sessions found</p>
			) : (
				<ul className="divide-y">
					{query.data?.sessions.map((session) => {
						const Icon =
							session.userAgent?.deviceType === 'mobile'
								? Smartphone
								: session.userAgent?.deviceType === 'tablet'
									? Tablet
									: session.userAgent?.deviceType === 'desktop'
										? Laptop
										: Monitor
						const label = getSessionLabel(session)
						return (
							<li key={session.id} className="flex justify-between items-center">
								<div className="p-2 mx-2 my-4 rounded-lg bg-muted/25 text-muted-foreground">
									<Icon className="size-5 shrink-0" />
								</div>
								<div className="min-w-0 flex-1 basis-40">
									<p className="wrap-break-word text-sm font-medium">{label}</p>
									<p className="wrap-break-word text-xs text-muted-foreground">
										{getSessionDetails(session)}
									</p>
								</div>
								{session.isCurrent ? (
									<span className="rounded-sm bg-indigo-500/20 text-indigo-500 px-2 py-1 text-xs">
										Current
									</span>
								) : (
									<Button
										variant="ghost"
										size="sm"
										disabled={pending}
										aria-label={`Revoke ${label}`}
										onClick={() => void revokeOne(session.id)}
									>
										{revoke.isPending && revoke.variables?.sessionId === session.id
											? 'Revoking…'
											: 'Revoke'}
									</Button>
								)}
							</li>
						)
					})}
				</ul>
			)}
			<AlertDialog
				open={open}
				onOpenChange={(next) => {
					if (!pending) {
						setOpen(next)
						setDialogError(null)
					}
				}}
			>
				<AlertDialogTrigger render={<Button variant="outline" disabled={pending} />}>
					Sign out of all devices
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Sign out of all devices?</AlertDialogTitle>
						<AlertDialogDescription>
							This includes this device. You will need to sign in again.
						</AlertDialogDescription>
					</AlertDialogHeader>
					{dialogError && (
						<Alert variant="destructive">
							<AlertDescription>{dialogError}</AlertDescription>
						</Alert>
					)}
					<AlertDialogFooter>
						<AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
						<AlertDialogAction disabled={pending} onClick={() => void revokeEverySession()}>
							{pending ? 'Signing out…' : 'Sign out of all devices'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	)
}
