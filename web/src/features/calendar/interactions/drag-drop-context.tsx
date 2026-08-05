import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'

interface IDragDropContext {
	activeItemId: string | null
	isDragging: boolean
	startDrag: (itemId: string) => void
	endDrag: () => void
}

const DragDropContext = createContext<IDragDropContext | null>(null)

export function DragDropProvider({ children }: { children: ReactNode }) {
	const [activeItemId, setActiveItemId] = useState<string | null>(null)
	const startDrag = useCallback((itemId: string) => setActiveItemId(itemId), [])
	const endDrag = useCallback(() => setActiveItemId(null), [])

	const value = useMemo<IDragDropContext>(
		() => ({ activeItemId, isDragging: activeItemId !== null, startDrag, endDrag }),
		[activeItemId, startDrag, endDrag],
	)

	return <DragDropContext.Provider value={value}>{children}</DragDropContext.Provider>
}

export function useDragDrop(): IDragDropContext {
	const context = useContext(DragDropContext)
	if (!context) throw new Error('useDragDrop must be used within a DragDropProvider.')
	return context
}
