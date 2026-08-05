import { EllipsisVertical, LogOut } from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'

export function NavUser() {
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger className="flex w-full">
						<SidebarMenuButton className="py-6">
							<Avatar>
								<AvatarImage src="https://github.com/gabrielgallan.png" alt="gabrielgallan" />
								<AvatarFallback>GG</AvatarFallback>
							</Avatar>

							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">Gabriel Gallan</span>

								<span className="truncate text-xs text-muted-foreground">
									gabriel31.gal@gmail.com
								</span>
							</div>

							<Button size="icon" className="ml-auto" variant="ghost">
								<EllipsisVertical className="size-4" />
							</Button>
						</SidebarMenuButton>
					</DropdownMenuTrigger>

					<DropdownMenuContent side="right" align="end">
						<DropdownMenuItem>
							<LogOut />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
