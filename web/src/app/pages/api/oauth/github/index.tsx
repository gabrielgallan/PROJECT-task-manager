import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { authenticateWithGithub } from '@/api/authenticate-with-github'

export function GithubOauthCallback() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()

	const { mutateAsync: authenticateWithGithubFn } = useMutation({
		mutationFn: authenticateWithGithub,
	})

	useEffect(() => {
		const code = searchParams.get('code')

		if (!code) {
			navigate('/auth/sign-in')
			return
		}

		authenticateWithGithubFn({ code })
			.then(() => {
				navigate('/', { replace: true })
			})
			.catch(() => {
				toast.error('Failed to authenticate with GitHub. Try again in a few minutes.')

				navigate('/auth/sign-in', { replace: true })
			})
	}, [searchParams, authenticateWithGithubFn, navigate])

	return (
		<div className="flex h-screen items-center justify-center">
			<Loader2 className="text-muted-foreground size-6 animate-spin" />
		</div>
	)
}
