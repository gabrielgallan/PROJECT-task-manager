import { useCallback, useState } from 'react'

type TStoredValue<T> = T | ((previous: T) => T)

export function useLocalStorage<T>(
	key: string,
	initialValue: T,
): [T, (value: TStoredValue<T>) => void] {
	const [storedValue, setStoredValue] = useState<T>(() => {
		if (typeof window === 'undefined') return initialValue

		try {
			const item = window.localStorage.getItem(key)
			return item ? (JSON.parse(item) as T) : initialValue
		} catch (error) {
			console.warn(`Error reading localStorage key "${key}":`, error)
			return initialValue
		}
	})

	const setValue = useCallback(
		(value: TStoredValue<T>) => {
			setStoredValue((previous) => {
				const valueToStore = value instanceof Function ? value(previous) : value

				try {
					window.localStorage.setItem(key, JSON.stringify(valueToStore))
				} catch (error) {
					console.warn(`Error setting localStorage key "${key}":`, error)
				}

				return valueToStore
			})
		},
		[key],
	)

	return [storedValue, setValue]
}
