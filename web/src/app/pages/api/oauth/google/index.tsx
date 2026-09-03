import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { authenticateWithGoogle } from '@/api/authenticate-with-google'

export function GoogleOauthCallback() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()

	const { mutateAsync: authenticateWithGoogleFn } = useMutation({
		mutationFn: authenticateWithGoogle,
	})

	useEffect(() => {
		const code = searchParams.get('code')

		if (!code) {
			throw new Error()
		}

		authenticateWithGoogleFn({ code })
			.then(() => {
				navigate('/', { replace: true })
			})
			.catch(() => {
				toast.error('Failed to authenticate with Google. Try again in a few minutes.')

				navigate('/auth/sign-in', { replace: true })
			})
	}, [searchParams, authenticateWithGoogleFn, navigate])

	return (
		<div className="flex h-screen items-center justify-center">
			<Loader2 className="text-muted-foreground size-6 animate-spin" />
		</div>
	)
}
