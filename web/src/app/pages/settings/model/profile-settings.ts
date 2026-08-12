export interface IUserProfileSettings {
	name: string
	email: string
	username: string
	jobTitle: string
	avatarUrl: string
}

export const PROFILE_MOCK: IUserProfileSettings = {
	name: 'Gabriel Gallan',
	email: 'gabriel31.gal@gmail.com',
	username: 'gabrielgallan',
	jobTitle: 'Developer',
	avatarUrl: 'https://github.com/gabrielgallan.png',
}
