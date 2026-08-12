import { Search, Settings, Workflow } from 'lucide-react'
import type * as React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { APP_NAVIGATION_GROUPS, APP_NAVIGATION_ITEMS } from '@/app/navigation'
import { useAppCommand } from '@/components/app-command'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'
import { NavUser } from './nav-user'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { pathname } = useLocation()
	const { openCommand } = useAppCommand()

	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<div className="flex gap-2 items-center">
					<span className="p-2 bg-primary rounded-lg">
						<Workflow className="text-primary-foreground size-4" />
					</span>

					<span className="text-base font-semibold">task_manager</span>
				</div>

				<SidebarMenu className="mt-1">
					<SidebarMenuItem>
						<SidebarMenuButton
							variant="outline"
							tooltip="Search"
							onClick={openCommand}
							aria-label="Open command menu"
							aria-keyshortcuts="Control+K Meta+K"
						>
							<Search />
							<span>Search...</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				{APP_NAVIGATION_GROUPS.map((group) => (
					<SidebarGroup key={group.value}>
						{group.label && (
							<SidebarGroupLabel className="font-medium text-muted-foreground">
								{group.label}
							</SidebarGroupLabel>
						)}

						<SidebarGroupContent>
							<SidebarMenu className="space-y-1">
								{APP_NAVIGATION_ITEMS.filter((item) => item.group === group.value).map((item) => (
									<SidebarMenuItem key={item.label}>
										<SidebarMenuButton
											// The bar is always rendered and only changes colour, and being a pseudo
											// element it stays square instead of following the button's rounding.
											className="py-5 relative before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded before:bg-transparent data-active:before:bg-primary"
											tooltip={item.label}
											isActive={pathname.startsWith(item.path)}
										>
											<Link to={item.path} className="flex gap-2 items-center w-full">
												{item.icon && <item.icon />}

												<span>{item.label}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>

			<SidebarFooter>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu className="space-y-1">
							<SidebarMenuItem>
								<SidebarMenuButton
									className="py-5 relative before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded before:bg-transparent data-active:before:bg-primary"
									tooltip="Settings"
									isActive={pathname.startsWith('/settings')}
								>
									<Link to="/settings" className="flex gap-2 items-center w-full">
										<Settings />
										<span>Settings</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<NavUser />
			</SidebarFooter>
		</Sidebar>
	)
}
