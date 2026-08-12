import { ChevronDown, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function MobileNavUser() {
	const navigate = useNavigate()

	function handleSignOut() {
		navigate('/auth/sign-in')
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<div className="flex items-center">
					<Button variant="ghost" size="icon-xs">
						<ChevronDown />
					</Button>

					<Avatar>
						<AvatarImage src="https://github.com/gabrielgallan.png" alt="gabrielgallan" />
						<AvatarFallback>GG</AvatarFallback>
					</Avatar>
				</div>
			</DropdownMenuTrigger>

			<DropdownMenuContent>
				<DropdownMenuItem>
					<div className="grid flex-1 text-left text-sm leading-tight">
						<span className="truncate font-medium">Gabriel Gallan</span>

						<span className="truncate text-xs text-muted-foreground">@gabrielgallan</span>
					</div>
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<DropdownMenuItem onClick={handleSignOut}>
					<LogOut />
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
