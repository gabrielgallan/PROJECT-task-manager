import {
	Bot,
	Search,
	Settings,
} from 'lucide-react'
import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { APP_NAVIGATION_ITEMS } from '@/app/navigation'
import { AppCommand, useAppCommand } from '@/components/app-command'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileBottomNav } from '@/components/mobile-botton-nav'
import { Button } from '@/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AiChat } from './components/ai-chat'

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
			<AppSidebar variant="inset" />

			<SidebarInset className="min-h-0 overflow-hidden">
				<div className="flex min-h-0 flex-1 flex-col">
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
						<Button size="icon" variant="ghost" onClick={() => navigate('/settings')}>
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
					</header>

					<div className="styled-scrollbar flex min-h-0 flex-1 flex-col">
						{aiChatIsOpen ? (
							<ResizablePanelGroup orientation="horizontal">
								<ResizablePanel defaultSize="70%">
									<Outlet />
								</ResizablePanel>

								<ResizableHandle withHandle />

								<ResizablePanel defaultSize="40%" maxSize="40%">
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
