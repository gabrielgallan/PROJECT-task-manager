import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export interface DotPatternBackgroundProps {
	className?: string
	children?: React.ReactNode
	/** Dot diameter in pixels */
	dotSize?: number
	/** Gap between dots in pixels */
	gap?: number
	/** Base dot color (any CSS color, `var(--token)` included) */
	baseColor?: string
	/** Glow color on hover (any CSS color, `var(--token)` included) */
	glowColor?: string
	/** Mouse proximity radius for highlighting */
	proximity?: number
	/** Glow intensity multiplier */
	glowIntensity?: number
	/** Wave animation speed (0 to disable) */
	waveSpeed?: number
	/** Color fading in towards the edges (omit to skip the vignette) */
	vignetteColor?: string
}

interface Rgb {
	r: number
	g: number
	b: number
}

const TRANSPARENT: Rgb = { r: 0, g: 0, b: 0 }

/**
 * Paints one pixel to read the color back as RGB, so any CSS color the browser
 * accepts works here — including the `oklch()` design tokens that a hex parser
 * would silently collapse to black.
 */
function resolveRgb(color: string, probe: HTMLElement | null): Rgb {
	if (typeof document === 'undefined') return TRANSPARENT

	let resolved = color
	if (probe) {
		const previous = probe.style.color
		probe.style.color = color
		resolved = getComputedStyle(probe).color
		probe.style.color = previous
	}

	const canvas = document.createElement('canvas')
	canvas.width = 1
	canvas.height = 1

	const ctx = canvas.getContext('2d', { willReadFrequently: true })
	if (!ctx) return TRANSPARENT

	ctx.fillStyle = resolved
	ctx.fillRect(0, 0, 1, 1)

	const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
	return { r, g, b }
}

/** Bumps whenever the theme class on `<html>` flips, so tokens stay in sync. */
function useThemeRevision() {
	const [revision, setRevision] = useState(0)

	useEffect(() => {
		const observer = new MutationObserver(() => setRevision((current) => current + 1))
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class', 'style'],
		})

		return () => observer.disconnect()
	}, [])

	return revision
}

interface Dot {
	x: number
	y: number
	baseOpacity: number
}

export function DotPatternBackground({
	className,
	children,
	dotSize = 2,
	gap = 24,
	baseColor = '#404040',
	glowColor = '#22d3ee',
	proximity = 120,
	glowIntensity = 1,
	waveSpeed = 0.5,
	vignetteColor,
}: DotPatternBackgroundProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const dotsRef = useRef<Dot[]>([])
	const mouseRef = useRef({ x: -1000, y: -1000 })
	const animationRef = useRef<number | null>(null)
	const startTimeRef = useRef(Date.now())

	const themeRevision = useThemeRevision()

	// `themeRevision` is a dependency on purpose: it re-resolves the tokens whenever the theme flips.
	const baseRgb = useMemo(
		() => resolveRgb(baseColor, containerRef.current),
		[baseColor, themeRevision],
	)
	const glowRgb = useMemo(
		() => resolveRgb(glowColor, containerRef.current),
		[glowColor, themeRevision],
	)

	const buildGrid = useCallback(() => {
		const canvas = canvasRef.current
		const container = containerRef.current
		if (!canvas || !container) return

		const rect = container.getBoundingClientRect()
		const dpr = window.devicePixelRatio || 1

		canvas.width = rect.width * dpr
		canvas.height = rect.height * dpr
		canvas.style.width = `${rect.width}px`
		canvas.style.height = `${rect.height}px`

		const ctx = canvas.getContext('2d')
		if (ctx) ctx.scale(dpr, dpr)

		const cellSize = dotSize + gap
		const cols = Math.ceil(rect.width / cellSize) + 1
		const rows = Math.ceil(rect.height / cellSize) + 1

		const offsetX = (rect.width - (cols - 1) * cellSize) / 2
		const offsetY = (rect.height - (rows - 1) * cellSize) / 2

		const dots: Dot[] = []
		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				dots.push({
					x: offsetX + col * cellSize,
					y: offsetY + row * cellSize,
					baseOpacity: 0.3 + Math.random() * 0.2,
				})
			}
		}
		dotsRef.current = dots
	}, [dotSize, gap])

	const draw = useCallback(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		const dpr = window.devicePixelRatio || 1
		ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)

		const { x: mx, y: my } = mouseRef.current
		const proxSq = proximity * proximity
		const time = (Date.now() - startTimeRef.current) * 0.001 * waveSpeed

		for (const dot of dotsRef.current) {
			const dx = dot.x - mx
			const dy = dot.y - my
			const distSq = dx * dx + dy * dy

			// Wave animation
			const wave = Math.sin(dot.x * 0.02 + dot.y * 0.02 + time) * 0.5 + 0.5
			const waveOpacity = dot.baseOpacity + wave * 0.15
			const waveScale = 1 + wave * 0.2

			let opacity = waveOpacity
			let scale = waveScale
			let r = baseRgb.r
			let g = baseRgb.g
			let b = baseRgb.b
			let glow = 0

			// Mouse proximity effect
			if (distSq < proxSq) {
				const dist = Math.sqrt(distSq)
				const t = 1 - dist / proximity
				const easedT = t * t * (3 - 2 * t) // smoothstep

				// Interpolate color
				r = Math.round(baseRgb.r + (glowRgb.r - baseRgb.r) * easedT)
				g = Math.round(baseRgb.g + (glowRgb.g - baseRgb.g) * easedT)
				b = Math.round(baseRgb.b + (glowRgb.b - baseRgb.b) * easedT)

				opacity = Math.min(1, waveOpacity + easedT * 0.7)
				scale = waveScale + easedT * 0.8
				glow = easedT * glowIntensity
			}

			const radius = (dotSize / 2) * scale

			// Draw glow
			if (glow > 0) {
				const gradient = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, radius * 4)
				gradient.addColorStop(0, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${glow * 0.4})`)
				gradient.addColorStop(0.5, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${glow * 0.1})`)
				gradient.addColorStop(1, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, 0)`)
				ctx.beginPath()
				ctx.arc(dot.x, dot.y, radius * 4, 0, Math.PI * 2)
				ctx.fillStyle = gradient
				ctx.fill()
			}

			// Draw dot
			ctx.beginPath()
			ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2)
			ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`
			ctx.fill()
		}

		animationRef.current = requestAnimationFrame(draw)
	}, [proximity, baseRgb, glowRgb, dotSize, glowIntensity, waveSpeed])

	useEffect(() => {
		buildGrid()

		const container = containerRef.current
		if (!container) return

		const ro = new ResizeObserver(buildGrid)
		ro.observe(container)

		return () => ro.disconnect()
	}, [buildGrid])

	useEffect(() => {
		animationRef.current = requestAnimationFrame(draw)
		return () => {
			if (animationRef.current) cancelAnimationFrame(animationRef.current)
		}
	}, [draw])

	useEffect(() => {
		// Tracked on `window` instead of the container so the layer can stay
		// `pointer-events-none` and keep the content above it clickable.
		const handleMouseMove = (event: MouseEvent) => {
			const container = containerRef.current
			if (!container) return

			const rect = container.getBoundingClientRect()
			mouseRef.current = {
				x: event.clientX - rect.left,
				y: event.clientY - rect.top,
			}
		}

		const handleMouseLeave = () => {
			mouseRef.current = { x: -1000, y: -1000 }
		}

		window.addEventListener('mousemove', handleMouseMove)
		document.addEventListener('mouseleave', handleMouseLeave)

		return () => {
			window.removeEventListener('mousemove', handleMouseMove)
			document.removeEventListener('mouseleave', handleMouseLeave)
		}
	}, [])

	return (
		<div
			ref={containerRef}
			aria-hidden
			className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
		>
			<canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

			{/* Vignette overlay */}
			{vignetteColor && (
				<div
					className="absolute inset-0"
					style={{
						background: `radial-gradient(ellipse at center, transparent 0%, transparent 40%, ${vignetteColor} 100%)`,
					}}
				/>
			)}

			{/* Content layer */}
			{children && <div className="relative z-10 h-full w-full">{children}</div>}
		</div>
	)
}
