import { ImageUp } from 'lucide-react'
import { type ComponentProps, useRef, useState } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

interface IAvatarUploadProps extends Omit<ComponentProps<'button'>, 'onSelect' | 'children'> {
	src: string | null
	alt: string
	initials: string
	accept: string
	pending?: boolean
	onSelect: (file: File) => void
}

export function AvatarUpload({
	src,
	alt,
	initials,
	accept,
	pending = false,
	disabled = false,
	className,
	onSelect,
	...props
}: IAvatarUploadProps) {
	const input = useRef<HTMLInputElement>(null)
	const [brokenSrc, setBrokenSrc] = useState<string | null>(null)
	const blocked = disabled || pending
	const showImage = !!src && brokenSrc !== src

	return (
		<div className="relative w-fit">
			<input
				ref={input}
				type="file"
				className="hidden"
				tabIndex={-1}
				accept={accept}
				disabled={blocked}
				onChange={(event) => {
					const selected = event.target.files?.[0]
					event.target.value = ''
					if (selected) onSelect(selected)
				}}
			/>

			<button
				type="button"
				aria-label="Change profile photo"
				disabled={blocked}
				onClick={() => input.current?.click()}
				className={cn(
					'group relative flex size-20 shrink-0 cursor-pointer overflow-hidden rounded-full outline-none select-none',
					'after:absolute after:inset-0 after:rounded-full after:border after:border-border',
					'focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:after:border-destructive',
					'disabled:cursor-default disabled:opacity-80',
					className,
				)}
				{...props}
			>
				{showImage ? (
					<img
						src={src}
						alt={alt}
						className="size-full object-cover"
						onError={() => setBrokenSrc(src)}
					/>
				) : (
					<span className="flex size-full items-center justify-center bg-muted text-lg text-muted-foreground">
						{initials}
					</span>
				)}

				<span
					className={cn(
						'pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity',
						pending ? 'opacity-100' : 'group-hover:opacity-100 group-focus-visible:opacity-100',
					)}
				>
					{pending ? <Spinner className="size-6" /> : <ImageUp className="size-6" />}
				</span>
			</button>
		</div>
	)
}
