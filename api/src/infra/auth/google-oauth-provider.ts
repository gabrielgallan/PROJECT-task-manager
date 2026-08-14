import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common'
import { z } from 'zod'
import { AuthProvider, SignInData } from '@/domain/identity/application/auth/auth-provider'
import type { AccountProvider } from '@/domain/identity/enterprise/entities/account'
import { EnvService } from '../env/env.service'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo'

interface GoogleRequestInit {
	method?: 'GET' | 'POST'
	headers?: Record<string, string>
	body?: URLSearchParams
}

@Injectable()
export class GoogleOAuthProvider implements AuthProvider {
	readonly provider: AccountProvider = 'GOOGLE'

	constructor(private env: EnvService) {}

	async signIn({ code: OAuthCode }: SignInData) {
		// O Google exige os parametros no corpo form-encoded, ao contrario do GitHub
		const googleOAuthBody = new URLSearchParams({
			code: OAuthCode,
			client_id: this.env.get('GOOGLE_OAUTH_CLIENT_ID'),
			client_secret: this.env.get('GOOGLE_OAUTH_CLIENT_SECRET'),
			redirect_uri: this.env.get('GOOGLE_OAUTH_CLIENT_REDIRECT_URI'),
			grant_type: 'authorization_code',
		})

		const googleOAuthTokenResponse = await this.request(GOOGLE_TOKEN_URL, {
			method: 'POST',
			body: googleOAuthBody,
		})

		const OAuthResult = z
			.object({
				access_token: z.string(),
				token_type: z.literal('Bearer'),
				scope: z.string(),
			})
			.safeParse(googleOAuthTokenResponse)

		if (!OAuthResult.success) {
			throw new BadGatewayException({
				message: 'Wrong data format returned from Google OAuth API',
			})
		}

		const googleUserResponse = await this.request(GOOGLE_USERINFO_URL, {
			headers: {
				Authorization: `Bearer ${OAuthResult.data.access_token}`,
			},
		})

		const googleUserResult = z
			.object({
				sub: z.string(),
				email: z.string().nullish(),
				email_verified: z.boolean().default(false),
				name: z.string().nullish(),
				picture: z.url().nullish(),
			})
			.safeParse(googleUserResponse)

		if (!googleUserResult.success) {
			throw new BadGatewayException({
				message: 'Wrong user data returned from Google API',
			})
		}

		const {
			sub: googleId,
			email,
			email_verified: isEmailVerified,
			name,
			picture: avatarUrl,
		} = googleUserResult.data

		if (!email) {
			throw new BadRequestException({
				message: 'Provide a e-mail in your google account to authenticate!',
			})
		}

		// Sem esta checagem, um e-mail nao verificado cairia no findByEmail do use case
		// e assumiria uma conta ja existente
		if (!isEmailVerified) {
			throw new BadRequestException({
				message: 'Verify your google account e-mail before authenticating!',
			})
		}

		return {
			id: googleId,
			email,
			name: name ?? null,
			avatarUrl: avatarUrl ?? null,
		}
	}

	private async request(
		url: string,
		{ method = 'GET', headers, body }: GoogleRequestInit = {},
	): Promise<unknown> {
		let response: Response

		try {
			response = await fetch(url, {
				method,
				headers: {
					Accept: 'application/json',
					...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
					...headers,
				},
				body,
			})
		} catch {
			throw new BadGatewayException({
				message: 'Failed to connect with Google API',
			})
		}

		if (!response.ok) {
			throw new BadGatewayException({
				message: `Google API responded with status ${response.status}`,
			})
		}

		try {
			return await response.json()
		} catch {
			throw new BadGatewayException({
				message: 'Google API returned a non-JSON response',
			})
		}
	}
}
