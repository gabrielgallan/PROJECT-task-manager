import { env } from '@/env'

export function useOAuthProvider(provider: 'github' | 'google') {
	if (provider === 'github') {
		const githubOAuthURL = new URL('https://github.com/login/oauth/authorize')

		githubOAuthURL.searchParams.set('client_id', env.VITE_GITHUB_OAUTH_CLIENT_ID)
		githubOAuthURL.searchParams.set('redirect_uri', env.VITE_GITHUB_OAUTH_CLIENT_REDIRECT_URI)
		githubOAuthURL.searchParams.set('scope', 'user:email')

		return { link: githubOAuthURL }
	} else {
		const googleOAuthURL = new URL('https://accounts.google.com/o/oauth2/v2/auth')

		googleOAuthURL.searchParams.set('client_id', env.VITE_GOOGLE_OAUTH_CLIENT_ID)
		googleOAuthURL.searchParams.set('redirect_uri', env.VITE_GOOGLE_OAUTH_REDIRECT_URI)
		googleOAuthURL.searchParams.set('response_type', 'code')
		googleOAuthURL.searchParams.set('scope', 'email profile')

		return { link: googleOAuthURL }
	}
}
