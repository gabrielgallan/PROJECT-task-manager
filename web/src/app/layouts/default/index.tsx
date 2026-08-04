import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

export function DefaultLayout() {
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

			{/* min-h-0 lets pages own their scrolling instead of growing the whole document. */}
			<SidebarInset className="min-h-0 overflow-hidden">
				<div className="flex min-h-0 flex-1 flex-col">
					<header className="flex shrink-0 items-center border-b px-4 py-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
						<div className="flex w-full items-center">
							<SidebarTrigger />
						</div>
					</header>

					<div className="flex min-h-0 flex-1 flex-col">
						<Outlet />
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
