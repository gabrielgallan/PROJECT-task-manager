import { useMutation } from '@tanstack/react-query'
import { useId } from 'react'
import { confirmPlan } from '@/api/confirm-plan'
import { createPlan } from '@/api/create-plan'
import { deletePlan } from '@/api/delete-plan'
import { editPlan } from '@/api/edit-plan'
import { type EditPlanScheduleRequest, editPlanSchedule } from '@/api/edit-plan-schedule'
import { useEndSession, useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { getHttpStatus } from '@/features/identity/model/identity-errors'
import { workLogKeys } from '@/features/work-logs/model/work-log-query-keys'
import { reconcilePlans } from '../model/plan-cache'
import { PlanActionBlockedError } from '../model/plan-errors'
import { type PlanMutationOperation, planKeys } from '../model/plan-query-keys'
import { acquirePlanLock, markPlanConfirmed } from '../model/plan-runtime'
import { planIdSchema } from '../model/plan-schema'

function usePlanMutation<TData, TVariables>(
	operation: PlanMutationOperation,
	call: (variables: TVariables) => Promise<TData>,
	getId?: (variables: TVariables) => string,
) {
	const { generation, capture, client, busy, ended } = useIdentityLifecycle()
	const { revalidateSession } = useEndSession()
	const instance = useId()
	const mutation = useMutation({
		mutationKey: planKeys.mutation(generation, operation),
		retry: false,
		networkMode: 'always',
		gcTime: 0,
		mutationFn: async ({
			variables,
			current,
		}: {
			variables: TVariables
			current: () => boolean
		}) => {
			if (!current()) throw new PlanActionBlockedError()
			const id = getId?.(variables)
			let data: TData
			try {
				data = await call(variables)
			} catch (error) {
				if (current()) {
					const status = getHttpStatus(error)
					if (id && (status === 404 || (operation === 'confirm' && status === 409))) {
						if (operation === 'confirm' && status === 409) markPlanConfirmed(client, generation, id)
						await reconcilePlans(
							client,
							generation,
							current,
							status === 404 ? { removeId: id } : {},
						)
					} else await revalidateSession(error)
				}
				throw error
			}
			if (!current()) return data
			if (operation === 'confirm' && id) {
				markPlanConfirmed(client, generation, id)
				await Promise.all([
					reconcilePlans(client, generation, current),
					client.invalidateQueries({ queryKey: workLogKeys.all }, { throwOnError: false }),
				])
			} else if (operation === 'schedule') {
				await reconcilePlans(client, generation, current, {
					schedule: variables as EditPlanScheduleRequest,
				})
			} else
				await reconcilePlans(
					client,
					generation,
					current,
					operation === 'delete' && id ? { removeId: id } : {},
				)
			return data
		},
	})
	async function mutateAsync(variables: TVariables) {
		const current = capture()
		const id = getId?.(variables)
		if (busy || ended || !current()) throw new PlanActionBlockedError()
		if (id && !planIdSchema.safeParse(id).success) throw new PlanActionBlockedError()
		const release = acquirePlanLock(
			client,
			generation,
			id ?? `create:${instance}`,
			operation === 'confirm',
		)
		if (!release) throw new PlanActionBlockedError()
		try {
			return await mutation.mutateAsync({ variables, current })
		} finally {
			release()
		}
	}
	return { mutateAsync, isPending: mutation.isPending, reset: mutation.reset }
}

export function useCreatePlan() {
	return usePlanMutation('create', createPlan)
}
export function useEditPlan() {
	return usePlanMutation('edit', editPlan, (value) => value.planId)
}
export function useDeletePlan() {
	return usePlanMutation('delete', deletePlan, (value) => value.planId)
}
export function useEditPlanSchedule() {
	return usePlanMutation('schedule', editPlanSchedule, (value) => value.planId)
}
export function useConfirmPlan() {
	return usePlanMutation('confirm', confirmPlan, (value) => value.planId)
}
