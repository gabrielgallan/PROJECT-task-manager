import { createBrowserRouter, Navigate } from 'react-router-dom'
import { TASK_VIEWS } from '@/features/tasks/model/task-views'
import type { IRouteHandle } from '@/hooks/use-route-handle'
import { AuthLayout } from './app/layouts/auth'
import { DefaultLayout } from './app/layouts/default'
import { NotFoundPage } from './app/pages/404'
import { SignInPage } from './app/pages/auth/sign-in'
import { SignUpPage } from './app/pages/auth/sign-up'
import { ErrorPage } from './app/pages/error'
import { PlansPage } from './app/pages/registers/plans'
import { TasksPage } from './app/pages/registers/tasks'
import { WorkLogsPage } from './app/pages/registers/work-logs'
import { GanttTestPage } from './app/pages/test/gantt'

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
				path: 'test/gantt',
				element: <GanttTestPage />,
			},
		],
	},
	{
		path: '*',
		element: <NotFoundPage />,
	},
])
