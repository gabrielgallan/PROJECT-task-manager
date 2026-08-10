import { Bell, Brush, User } from 'lucide-react'
import { BrowserTitle } from '@/components/browser-title'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function SettingsPage() {
	return (
		<>
			<BrowserTitle title="Settings" />

			<div className="flex min-h-0 flex-1 flex-col p-4 w-full mx-auto">
				<Tabs defaultValue="account" orientation="vertical">
					<TabsList>
						<TabsTrigger value="account" className="p-1.5 pr-10">
							<User />
							Account
						</TabsTrigger>
						<TabsTrigger value="notifications" className="p-1.5 pr-10">
							<Bell />
							Notifications
						</TabsTrigger>
						<TabsTrigger value="appearance" className="p-1.5 pr-10">
							<Brush />
							Appearance
						</TabsTrigger>
					</TabsList>
					<TabsContent value="account">
						<Card className="h-100">
							<CardHeader>
								<CardTitle>Account settings</CardTitle>
							</CardHeader>
							<CardContent></CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="notifications">
						<Card className="h-100">
							<CardHeader>
								<CardTitle>Notifications settings</CardTitle>
							</CardHeader>
							<CardContent></CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="appearance">
						<Card className="h-100">
							<CardHeader>
								<CardTitle>Appearance settings</CardTitle>
							</CardHeader>
							<CardContent></CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</>
	)
}
