import { formatDistanceToNowStrict } from 'date-fns'
import { CircleCheck, EllipsisVertical, Loader, Plus, Search, X } from 'lucide-react'
import { BrowserTitle } from '@/components/browser-title'
import { Pagination } from '@/components/pagination'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

export function TasksPage() {
	return (
		<>
			<BrowserTitle title="Manage Tasks" />
			<div className="flex flex-col p-4 gap-4">
				<div className="flex items-center justify-between">
					<form>
						<div className="flex gap-2">
							<InputGroup className="max-w-xs">
								<InputGroupInput />

								<InputGroupAddon>
									<Search />
								</InputGroupAddon>
							</InputGroup>

							<Button type="submit">Search</Button>

							<Button type="button" variant="ghost">
								<X />
								Clear filters
							</Button>
						</div>
					</form>

					<Button>
						<Plus />
						New task
					</Button>
				</div>

				<div className="rounded-md border overflow-hidden">
					<Table>
						<TableHeader className="bg-muted">
							<TableRow>
								<TableHead className="w-92">Title</TableHead>
								<TableHead className="w-42">Status</TableHead>
								<TableHead className="w-42">Priority</TableHead>
								<TableHead className="w-60">Date Range</TableHead>
								<TableHead className="text-right">Last update</TableHead>
								<TableHead className="text-right w-8" />
							</TableRow>
						</TableHeader>

						<TableBody>
							<TableRow>
								<TableCell>
									<span className="font-medium">Integração HIKVISION</span>
								</TableCell>

								<TableCell>
									<div className="flex items-center gap-2 px-2 py-0.5 border rounded-2xl w-fit">
										<Loader className="size-2.5" />
										<span className="text-xs text-muted-foreground">In progress</span>
									</div>
								</TableCell>

								<TableCell>
									<div className="flex items-center gap-2">
										<span className="block size-1.5 rounded-xs bg-amber-500" />
										<span className="text-sm">Medium</span>
									</div>
								</TableCell>

								<TableCell>-</TableCell>

								<TableCell className="text-right">
									<span className="text-muted-foreground">
										{formatDistanceToNowStrict(new Date(), {
											addSuffix: true,
										})}
									</span>
								</TableCell>
								<TableCell className="text-right">
									<Button variant="outline" size="icon-xs">
										<EllipsisVertical className="size-3" />
									</Button>
								</TableCell>
							</TableRow>

							<TableRow className="opacity-45">
								<TableCell>
									<span className="font-medium line-through">Revisão Auto Guide</span>
								</TableCell>

								<TableCell>
									<div className="flex items-center gap-2 px-2 py-0.5 border rounded-2xl w-fit">
										<CircleCheck className="size-2.5 fill-emerald-500 stroke-emerald-500 [&>path]:stroke-background" />
										<span className="block text-xs text-muted-foreground">Done</span>
									</div>
								</TableCell>

								<TableCell>
									<div className="flex items-center gap-2">
										<span className="block size-1.5 rounded-xs bg-teal-500" />
										<span className="text-sm">Low</span>
									</div>
								</TableCell>

								<TableCell>-</TableCell>
								<TableCell className="text-right">
									<span className="text-muted-foreground">
										{formatDistanceToNowStrict(new Date(), {
											addSuffix: true,
										})}
									</span>
								</TableCell>
								<TableCell className="text-right">
									<Button variant="outline" size="icon-xs">
										<EllipsisVertical className="size-3" />
									</Button>
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>

				<Pagination limit={10} page={1} total={28} onPageChange={() => {}} />
			</div>
		</>
	)
}
