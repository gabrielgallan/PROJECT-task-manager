import { Link, useRouteError } from 'react-router-dom'

export function ErrorPage() {
	const error = useRouteError() as Error

	return (
		<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-10">
			<div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:48px_48px] opacity-35" />
			<div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />

			<section className="relative flex w-full max-w-3xl flex-col items-center gap-3 text-center">
				<h1 className="text-4xl font-bold">Something unexpected happened...</h1>
				<p>An error was triggered in the application, below you can find more details:</p>

				<pre>{error?.message || JSON.stringify(error)}</pre>

				<p className="text-base leading-7 text-muted-foreground">
					Back to the{' '}
					<Link to="/">
						<span className="text-primary font-medium">Main</span>
					</Link>
				</p>
			</section>
		</main>
	)
}
