import { createBrowserRouter, Navigate } from 'react-router-dom'
import { TASK_VIEWS } from '@/features/tasks/model/task-views'
import type { IRouteHandle } from '@/hooks/use-route-handle'
import { AuthLayout } from './app/layouts/auth'
import { DefaultLayout } from './app/layouts/default'
import { SignInPage } from './app/pages/auth/sign-in'
import { SignUpPage } from './app/pages/auth/sign-up'
import { PlansPage } from './app/pages/registers/plans'
import { TasksPage } from './app/pages/registers/tasks'
import { WorkLogsPage } from './app/pages/registers/work-logs'
import { GanttTestPage } from './app/pages/test/gantt'

export const router = createBrowserRouter([
	{
		path: '/',
		element: <Navigate to="/registers/tasks" />,
	},
	{
		path: '/',
		element: <AuthLayout />,
		children: [
			{
				path: 'auth/sign-in',
				element: <SignInPage />,
			},
			{
				path: 'auth/sign-up',
				element: <SignUpPage />,
			},
		],
	},
	{
		path: '/',
		element: <DefaultLayout />,
		children: [
			{
				path: 'registers/tasks',
				element: <TasksPage />,
				handle: { views: TASK_VIEWS } satisfies IRouteHandle,
			},
			{
				path: 'registers/plans',
				element: <PlansPage />,
			},
			{
				path: 'registers/work-logs',
				element: <WorkLogsPage />,
			},
			{
				// Temporary playground route, intentionally out of the sidebar navigation.
				path: 'test/gantt',
				element: <GanttTestPage />,
			},
		],
	},
])
