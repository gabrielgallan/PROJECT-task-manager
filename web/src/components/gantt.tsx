import { faker } from '@faker-js/faker'
import { EyeIcon, LinkIcon, TrashIcon } from 'lucide-react'
import { useState } from 'react'
import {
	GanttCreateMarkerTrigger,
	GanttFeatureItem,
	GanttFeatureList,
	GanttHeader,
	GanttMarker,
	GanttProvider,
	GanttSidebar,
	GanttSidebarItem,
	GanttTimeline,
	GanttToday,
} from '@/components/kibo-ui/gantt'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '@/components/ui/context-menu'

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

const statuses = [
	{ id: faker.string.uuid(), name: 'Planned', color: '#6B7280' },
	{ id: faker.string.uuid(), name: 'In Progress', color: '#F59E0B' },
	{ id: faker.string.uuid(), name: 'Done', color: '#10B981' },
]

const users = Array.from({ length: 4 }).map(() => ({
	id: faker.string.uuid(),
	name: faker.person.fullName(),
	image: faker.image.avatar(),
}))

const exampleFeatures = Array.from({ length: 20 }).map(() => {
	const startAt = faker.date.recent({ days: 90 })

	const endAt = faker.date.soon({
		days: faker.number.int({ min: 1, max: 60 }),
		refDate: startAt,
	})

	return {
		id: faker.string.uuid(),
		name: capitalize(faker.company.buzzPhrase()),
		startAt,
		endAt,
		status: faker.helpers.arrayElement(statuses),
		owner: faker.helpers.arrayElement(users),
	}
})

const exampleMarkers = Array.from({ length: 6 }).map(() => ({
	id: faker.string.uuid(),
	date: faker.date.past({
		years: 0.5,
		refDate: new Date(),
	}),
	label: capitalize(faker.company.buzzPhrase()),
	className: faker.helpers.arrayElement([
		'bg-blue-100 text-blue-900',
		'bg-green-100 text-green-900',
		'bg-purple-100 text-purple-900',
		'bg-red-100 text-red-900',
		'bg-orange-100 text-orange-900',
		'bg-teal-100 text-teal-900',
	]),
}))

export const ExampleGantt = () => {
	const [features, setFeatures] = useState(exampleFeatures)

	const handleViewFeature = (id: string) => {
		console.log(`Feature selected: ${id}`)
	}

	const handleCopyLink = (id: string) => {
		console.log(`Copy link: ${id}`)
	}

	const handleRemoveFeature = (id: string) => {
		setFeatures((currentFeatures) => currentFeatures.filter((feature) => feature.id !== id))
	}

	const handleRemoveMarker = (id: string) => {
		console.log(`Remove marker: ${id}`)
	}

	const handleCreateMarker = (date: Date) => {
		console.log(`Create marker: ${date.toISOString()}`)
	}

	const handleMoveFeature = (id: string, startAt: Date, endAt: Date | null) => {
		if (!endAt) {
			return
		}

		setFeatures((currentFeatures) =>
			currentFeatures.map((feature) =>
				feature.id === id
					? {
							...feature,
							startAt,
							endAt,
						}
					: feature,
			),
		)
	}

	const handleAddFeature = (date: Date) => {
		console.log(`Add feature: ${date.toISOString()}`)
	}

	return (
		<GanttProvider className="" onAddItem={handleAddFeature} range="monthly" zoom={100}>
			<GanttSidebar>
				{features.map((feature) => (
					<GanttSidebarItem key={feature.id} feature={feature} onSelectItem={handleViewFeature} />
				))}
			</GanttSidebar>

			<GanttTimeline>
				<GanttHeader />

				<GanttFeatureList>
					{features.map((feature) => (
						<div className="flex" key={feature.id}>
							<ContextMenu>
								<ContextMenuTrigger>
									<button type="button" onClick={() => handleViewFeature(feature.id)}>
										<GanttFeatureItem {...feature} onMove={handleMoveFeature}>
											<p className="flex-1 truncate text-xs">{feature.name}</p>

											{feature.owner && (
												<Avatar className="size-4">
													<AvatarImage src={feature.owner.image} alt={feature.owner.name} />
													<AvatarFallback>{feature.owner.name.slice(0, 2)}</AvatarFallback>
												</Avatar>
											)}
										</GanttFeatureItem>
									</button>
								</ContextMenuTrigger>

								<ContextMenuContent>
									<ContextMenuItem
										className="flex items-center gap-2"
										onClick={() => handleViewFeature(feature.id)}
									>
										<EyeIcon className="text-muted-foreground" size={16} />
										View task
									</ContextMenuItem>

									<ContextMenuItem
										className="flex items-center gap-2"
										onClick={() => handleCopyLink(feature.id)}
									>
										<LinkIcon className="text-muted-foreground" size={16} />
										Copy link
									</ContextMenuItem>

									<ContextMenuItem
										className="flex items-center gap-2 text-destructive"
										onClick={() => handleRemoveFeature(feature.id)}
									>
										<TrashIcon size={16} />
										Remove task
									</ContextMenuItem>
								</ContextMenuContent>
							</ContextMenu>
						</div>
					))}
				</GanttFeatureList>

				{exampleMarkers.map((marker) => (
					<GanttMarker key={marker.id} {...marker} onRemove={handleRemoveMarker} />
				))}

				<GanttToday />

				<GanttCreateMarkerTrigger onCreateMarker={handleCreateMarker} />
			</GanttTimeline>
		</GanttProvider>
	)
}
