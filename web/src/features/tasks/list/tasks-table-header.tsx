import { Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

export function TasksTableHeader() {
	return (
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
	)
}
