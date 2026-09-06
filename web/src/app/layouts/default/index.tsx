import { Bot, Search, Settings, Workflow } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { AppCommand, useAppCommand } from '@/app/layouts/default/components/app-command'
import { MobileBottomNav } from '@/app/layouts/default/components/mobile-botton-nav'
import { APP_NAVIGATION_ITEMS } from '@/app/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useEndSession } from '@/features/identity/hooks/use-end-session'
import { useProfile } from '@/features/identity/hooks/use-profile'
import { getHttpStatus } from '@/features/identity/model/identity-errors'
import { AiChat } from './components/ai-chat'
import { AppSidebar } from './components/app-sidebar'
import { MobileNavUser } from './components/mobile-nav-user'

const mobileNavItems = [
	...APP_NAVIGATION_ITEMS.map((item) => ({
		title: item.mobileLabel,
		url: item.path,
		icon: item.icon,
	})),
]

export function DefaultLayout() {
	return (
		<AppCommand>
			<DefaultLayoutContent />
		</AppCommand>
	)
}

function DefaultLayoutContent() {
	const navigate = useNavigate()
	const { openCommand } = useAppCommand()
	const [aiChatIsOpen, setAiChatIsOpen] = useState<boolean>(false)

	const { data, error, refetch, isFetching } = useProfile()
	const { endSession, busy, ended } = useEndSession()
	const unauthorized = getHttpStatus(error) === 401

	useEffect(() => {
		if (unauthorized && !ended) void endSession()
	}, [unauthorized, ended, endSession])

	if (ended) return busy ? null : <Navigate to="/auth/sign-in" replace />
	if (unauthorized) return null
	if (!data) {
		return (
			<div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-4 p-6">
				{error ? (
					<Alert variant="destructive">
						<AlertDescription>Unable to load your profile. Please try again.</AlertDescription>
						<Button disabled={isFetching || busy} onClick={() => void refetch()}>
							Try again
						</Button>
					</Alert>
				) : (
					<div role="status" aria-label="Loading your profile" className="space-y-4">
						<Skeleton className="h-12 w-48" />
						<Skeleton className="h-64 w-full" />
						<span className="sr-only">Loading your profile…</span>
					</div>
				)}
			</div>
		)
	}

	return (
		<SidebarProvider
			className="h-svh"
			style={
				{
					'--sidebar-width': 'calc(var(--spacing) * 72)',
					'--header-height': 'calc(var(--spacing) * 12)',
				} as React.CSSProperties
			}
		>
			<AppSidebar variant="inset" user={data.profile} />

			<SidebarInset className="min-h-0 overflow-hidden">
				<div className="flex min-h-0 flex-1 flex-col">
					{error && (
						<Alert variant="destructive">
							<AlertDescription>Your profile could not be refreshed.</AlertDescription>
							<Button disabled={isFetching || busy} onClick={() => void refetch()}>
								Try again
							</Button>
						</Alert>
					)}
					{/* Desktop */}
					<header className="hidden md:flex shrink-0 items-center border-b px-4 py-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
						<div className="flex w-full items-center gap-3">
							<SidebarTrigger />

							{/* AI features not avaliable in this version */}
							<Button
								size="icon"
								variant={aiChatIsOpen ? 'default' : 'outline'}
								className="hidden ml-auto"
								onClick={() => setAiChatIsOpen(!aiChatIsOpen)}
							>
								<Bot />
							</Button>
						</div>
					</header>

					{/* Mobile */}
					<header className="md:hidden flex shrink-0 items-center justify-between border-b p-2">
						<div className="flex items-center gap-2">
							<div className="p-2 bg-primary rounded-lg">
								<Workflow className="text-primary-foreground size-4.5" />
							</div>

							<Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
								<Settings />
							</Button>

							<Button
								size="icon"
								variant="ghost"
								onClick={openCommand}
								aria-label="Open command menu"
								aria-keyshortcuts="Control+K Meta+K"
							>
								<Search />
							</Button>
						</div>

						<MobileNavUser user={data.profile} />
					</header>

					<div className="styled-scrollbar flex min-h-0 flex-1 flex-col">
						{aiChatIsOpen ? (
							<ResizablePanelGroup orientation="horizontal">
								<ResizablePanel defaultSize="70%">
									<Outlet />
								</ResizablePanel>

								<ResizableHandle withHandle />

								<ResizablePanel defaultSize="40%" maxSize="40%" minSize="20%">
									<AiChat />
								</ResizablePanel>
							</ResizablePanelGroup>
						) : (
							<Outlet />
						)}
					</div>

					<MobileBottomNav items={mobileNavItems} />
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
