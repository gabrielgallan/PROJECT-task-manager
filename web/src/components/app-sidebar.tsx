import { Calendar, ChartNoAxesGantt, Clock, Workflow } from 'lucide-react'
import type * as React from 'react'
import { Link, useLocation } from 'react-router-dom'
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

const groups = [
	{
		label: 'Manage',
		items: [
			{
				label: 'Tasks',
				url: '/registers/tasks',
				icon: ChartNoAxesGantt,
			},
			{
				label: 'Plans',
				url: '/registers/plans',
				icon: Calendar,
			},
			{
				label: 'Work Logs',
				url: '/registers/work-logs',
				icon: Clock,
			},
		],
	},
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { pathname } = useLocation()

	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<div className="flex gap-2 items-center">
					<span className="p-2 bg-primary rounded-lg">
						<Workflow className="text-primary-foreground size-4" />
					</span>

					<span className="text-base font-semibold">task_manager</span>
				</div>
			</SidebarHeader>

			<SidebarContent>
				{groups.map((group) => (
					<SidebarGroup key={group.label}>
						<SidebarGroupLabel className="font-medium text-muted-foreground">
							{group.label}
						</SidebarGroupLabel>

						<SidebarGroupContent>
							<SidebarMenu className="space-y-1">
								{group.items.map((item) => (
									<SidebarMenuItem key={item.label}>
										<SidebarMenuButton
											className="py-5"
											tooltip={item.label}
											isActive={item.url === '/' ? pathname === '/' : pathname.startsWith(item.url)}
										>
											<Link to={item.url} className="flex gap-2 items-center w-full">
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
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	)
}
