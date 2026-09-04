import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from './app/layouts/auth'
import { DefaultLayout } from './app/layouts/default'
import { NotFoundPage } from './app/pages/404'
import { GithubOauthCallback } from './app/pages/api/oauth/github'
import { GoogleOauthCallback } from './app/pages/api/oauth/google'
import { ForgotPasswordPage } from './app/pages/auth/forgot-password'
import { ResetPasswordPage } from './app/pages/auth/reset-password'
import { SignInPage } from './app/pages/auth/sign-in'
import { SignUpPage } from './app/pages/auth/sign-up'
import { ErrorPage } from './app/pages/error'
import { PlansPage } from './app/pages/registers/plans'
import { TasksPage } from './app/pages/registers/tasks'
import { WorkLogsPage } from './app/pages/registers/work-logs'
import { SettingsPage } from './app/pages/settings'

export const router = createBrowserRouter([
	{
		path: '/',
		errorElement: <ErrorPage />,
		children: [
			{
				index: true,
				element: <Navigate to="/registers/tasks" replace />,
			},
			{
				path: 'auth',
				element: <AuthLayout />,
				children: [
					{ path: 'sign-in', element: <SignInPage /> },
					{ path: 'sign-up', element: <SignUpPage /> },
					{ path: 'forgot-password', element: <ForgotPasswordPage /> },
					{ path: 'reset-password', element: <ResetPasswordPage /> },
				],
			},
			{
				path: 'registers',
				element: <DefaultLayout />,
				children: [
					{ path: 'tasks', element: <TasksPage /> },
					{ path: 'plans', element: <PlansPage /> },
					{ path: 'work-logs', element: <WorkLogsPage /> },
				],
			},
			// {
			// 	path: 'analytics',
			// 	element: <DefaultLayout />,
			// 	children: [
			// 		{
			// 			path: 'dashboard',
			// 			element: <DashboardPage />,
			// 		},
			// 		{ path: 'reports', element: <ReportsPage /> },
			// 	],
			// },
			{
				path: 'settings',
				element: <DefaultLayout />,
				children: [
					{
						index: true,
						element: <SettingsPage />,
					},
				],
			},
		],
	},
	{
		path: 'api/oauth/github',
		element: <GithubOauthCallback />,
	},
	{
		path: 'api/oauth/google',
		element: <GoogleOauthCallback />,
	},
	{
		path: '*',
		element: <NotFoundPage />,
	},
	{
		path: '404',
		element: <NotFoundPage />,
	},
])
