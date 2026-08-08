import { atom, useAtom } from 'jotai'
import { useCallback } from 'react'
import { PLANS_MOCK } from '@/features/plans/mocks/plans'
import type { IPlan } from '@/features/plans/model/plan-types'

/**
 * Prototype-scoped state, not a data layer. It exists so a plan survives leaving
 * the page: what was created, edited or recorded as done has to still be there
 * on the way back.
 */
const plansAtom = atom<IPlan[]>(PLANS_MOCK)

export function usePlans() {
	const [plans, setPlans] = useAtom(plansAtom)

	const addPlan = useCallback(
		(plan: IPlan) => setPlans((previous) => [...previous, plan]),
		[setPlans],
	)

	const updatePlan = useCallback(
		(plan: IPlan) =>
			setPlans((previous) => previous.map((item) => (item.id === plan.id ? plan : item))),
		[setPlans],
	)

	const removePlan = useCallback(
		(plan: IPlan) => setPlans((previous) => previous.filter((item) => item.id !== plan.id)),
		[setPlans],
	)

	return { plans, addPlan, updatePlan, removePlan }
}
