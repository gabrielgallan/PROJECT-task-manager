import { BadGatewayException, BadRequestException, Injectable } from "@nestjs/common";
import { z } from "zod";
import { AuthProvider, SignInData } from "@/domain/identity/application/auth/auth-provider";
import type { AccountProvider } from "@/domain/identity/enterprise/entities/account";
import { EnvService } from "../env/env.service";

interface GithubRequestInit {
    method?: 'GET' | 'POST'
    headers?: Record<string, string>
}

@Injectable()
export class GithubOAuthProvider implements AuthProvider {
    readonly provider: AccountProvider = 'GITHUB'

    constructor(
        private env: EnvService
    ) { }

    async signIn({ code: OAuthCode }: SignInData) {
        const githubOAuthURL = new URL('https://github.com/login/oauth/access_token')

        githubOAuthURL.searchParams.set('client_id', this.env.get('GITHUB_OAUTH_CLIENT_ID'))
        githubOAuthURL.searchParams.set('client_secret', this.env.get('GITHUB_OAUTH_CLIENT_SECRET'))
        githubOAuthURL.searchParams.set('redirect_uri', this.env.get('GITHUB_OAUTH_CLIENT_REDIRECT_URI'))
        githubOAuthURL.searchParams.set('code', OAuthCode)

        const githubOAuthTokenResponse = await this.request(githubOAuthURL, { method: 'POST' })

        const OAuthResult = z.object({
            access_token: z.string(),
            token_type: z.literal('bearer'),
            scope: z.string()
        }).safeParse(githubOAuthTokenResponse)

        if (!OAuthResult.success) {
            throw new BadGatewayException({
                message: 'Wrong data format returned from GitHub OAuth API'
            })
        }

        const githubUserResponse = await this.request('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${OAuthResult.data.access_token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })

        const githubUserResult = z.object({
            id: z.number().int().transform(String),
            email: z.string().nullable(),
            name: z.string().nullable(),
            avatar_url: z.string().url()
        }).safeParse(githubUserResponse)

        if (!githubUserResult.success) {
            throw new BadGatewayException({
                message: 'Wrong user data returned from GitHub API'
            })
        }

        const {
            email,
            name,
            id: githubId,
            avatar_url: avatarUrl
        } = githubUserResult.data

        if (!email) {
            throw new BadRequestException({
                message: 'Provide a e-mail in your github account to authenticate!'
            })
        }

        return {
            id: githubId,
            email,
            name,
            avatarUrl
        }
    }

    private async request(url: URL | string, { method = 'GET', headers }: GithubRequestInit = {}): Promise<unknown> {
        let response: Response

        try {
            response = await fetch(url, {
                method,
                headers: {
                    // GitHub answers the token exchange with x-www-form-urlencoded unless
                    // JSON is explicitly requested, and rejects requests without User-Agent
                    'Accept': 'application/json',
                    'User-Agent': 'task-manager-api',
                    ...headers
                }
            })
        } catch {
            throw new BadGatewayException({
                message: 'Failed to connect with GitHub API'
            })
        }

        if (!response.ok) {
            throw new BadGatewayException({
                message: `GitHub API responded with status ${response.status}`
            })
        }

        try {
            return await response.json()
        } catch {
            throw new BadGatewayException({
                message: 'GitHub API returned a non-JSON response'
            })
        }
    }
}