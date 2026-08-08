import {
	Calendar,
	ChartColumnBig,
	FileChartLine,
	ListOrdered,
	type LucideIcon,
	Settings,
	SquareCheck,
	Workflow,
} from 'lucide-react'
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

interface SidebarGroupItem {
	label?: string
	items: {
		label: string
		url: string
		icon: LucideIcon
	}[]
}

const sidebarGroups: SidebarGroupItem[] = [
	{
		items: [
			{
				label: 'Tasks',
				url: '/registers/tasks',
				icon: ListOrdered,
			},
			{
				label: 'Plans',
				url: '/registers/plans',
				icon: Calendar,
			},
			{
				label: 'Work logs',
				url: '/registers/work-logs',
				icon: SquareCheck,
			},
		],
	},
	{
		label: 'Analytics',
		items: [
			{
				label: 'Dashboard',
				url: '/analytics/dashboard',
				icon: ChartColumnBig,
			},
			{
				label: 'Reports',
				url: '/analytics/reports',
				icon: FileChartLine,
			},
		],
	},
]

const sidebarFooter: SidebarGroupItem[] = [
	{
		items: [
			{
				label: 'Settings',
				url: '/settings',
				icon: Settings,
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
				{sidebarGroups.map((group) => (
					<SidebarGroup key={group.label}>
						{group.label && (
							<SidebarGroupLabel className="font-medium text-muted-foreground">
								{group.label}
							</SidebarGroupLabel>
						)}

						<SidebarGroupContent>
							<SidebarMenu className="space-y-1">
								{group.items.map((item) => (
									<SidebarMenuItem key={item.label}>
										<SidebarMenuButton
											// The bar is always rendered and only changes colour, and being a pseudo
											// element it stays square instead of following the button's rounding.
											className="py-5 relative before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded before:bg-transparent data-active:before:bg-primary"
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
				{sidebarFooter.map((group) => (
					<SidebarGroup key={group.label}>
						{group.label && (
							<SidebarGroupLabel className="font-medium text-muted-foreground">
								{group.label}
							</SidebarGroupLabel>
						)}

						<SidebarGroupContent>
							<SidebarMenu className="space-y-1">
								{group.items.map((item) => (
									<SidebarMenuItem key={item.label}>
										<SidebarMenuButton
											// The bar is always rendered and only changes colour, and being a pseudo
											// element it stays square instead of following the button's rounding.
											className="py-5 relative before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded before:bg-transparent data-active:before:bg-primary"
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

				<NavUser />
			</SidebarFooter>
		</Sidebar>
	)
}
