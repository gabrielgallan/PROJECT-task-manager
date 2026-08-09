import { createBrowserRouter, Navigate } from 'react-router-dom'
import { TASK_VIEWS } from '@/features/tasks/model/task-views'
import type { IRouteHandle } from '@/hooks/use-route-handle'
import { AuthLayout } from './app/layouts/auth'
import { DefaultLayout } from './app/layouts/default'
import { NotFoundPage } from './app/pages/404'
import { DashboardPage } from './app/pages/analytics/dashboard'
import { ReportsPage } from './app/pages/analytics/reports'
import { REPORT_VIEWS } from './app/pages/analytics/reports/model/report-views'
import { ForgotPasswordPage } from './app/pages/auth/forgot-password'
import { SignInPage } from './app/pages/auth/sign-in'
import { SignUpPage } from './app/pages/auth/sign-up'
import { ErrorPage } from './app/pages/error'
import { PlansPage } from './app/pages/registers/plans'
import { TasksPage } from './app/pages/registers/tasks'
import { WorkLogsPage } from './app/pages/registers/work-logs'
import { TestPage } from './app/pages/test'

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
				],
			},
			{
				path: 'registers',
				element: <DefaultLayout />,
				children: [
					{
						path: 'tasks',
						element: <TasksPage />,
						handle: { views: TASK_VIEWS } satisfies IRouteHandle,
					},
					{ path: 'plans', element: <PlansPage /> },
					{ path: 'work-logs', element: <WorkLogsPage /> },
				],
			},
			{
				path: 'analytics',
				element: <DefaultLayout />,
				children: [
					{
						path: 'dashboard',
						element: <DashboardPage />,
					},
					{
						path: 'reports',
						element: <ReportsPage />,
						handle: { views: REPORT_VIEWS } satisfies IRouteHandle,
					},
				],
			},
			{
				path: 'test',
				element: <TestPage />,
			},
		],
	},
	{
		path: '*',
		element: <NotFoundPage />,
	},
])
