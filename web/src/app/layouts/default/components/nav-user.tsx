import { EllipsisVertical, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'

export interface User {
	name: string | null
	email: string
	avatarUrl: string | null
	jobTitle: string | null
}

export function getUserInitials(user: User): string {
	if (!user.name?.trim()) {
		return user.email.charAt(0).toUpperCase()
	}

	const names = user.name.trim().split(/\s+/)

	const firstInitial = names[0].charAt(0)
	const lastInitial = names.length > 1 ? names[names.length - 1].charAt(0) : ''

	return `${firstInitial}${lastInitial}`.toUpperCase()
}

interface NavUserProps {
	user: User
}

export function NavUser({ user }: NavUserProps) {
	const navigate = useNavigate()

	function handleSignOut() {
		navigate('/auth/sign-in')
	}

	const initials = getUserInitials(user)

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger className="flex w-full">
						<SidebarMenuButton className="py-6">
							<Avatar>
								<AvatarImage src={user.avatarUrl ?? ''} alt={user.email} />
								<AvatarFallback>{initials}</AvatarFallback>
							</Avatar>

							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{user.name ?? initials}</span>

								<span className="truncate text-xs text-muted-foreground">
									{user.jobTitle ?? '-'}
								</span>
							</div>

							<Button size="icon" className="ml-auto" variant="ghost">
								<EllipsisVertical className="size-4" />
							</Button>
						</SidebarMenuButton>
					</DropdownMenuTrigger>

					<DropdownMenuContent side="right" align="end">
						<DropdownMenuItem onClick={handleSignOut}>
							<LogOut />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
