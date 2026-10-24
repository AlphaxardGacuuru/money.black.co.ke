import { Lightbulb, X } from "lucide-react"
import { useEffect, useState } from "react"
import LucideIconDisplay from "@/components/lucide-icon-display"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import Axios from "@/lib/axios"
import { toast } from "@/lib/toast"
import { accept, dismiss, index } from "@/routes/api/category-suggestions"
import type { CategorySuggestion } from "@/types/category-suggestion"

type Props = {
	onChanged: () => void
}

/**
 * The monthly category ideas. Nothing changes until the user accepts one.
 */
export default function CategorySuggestionsCard({ onChanged }: Props) {
	const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([])
	const [busyId, setBusyId] = useState<string | null>(null)

	useEffect(() => {
		Axios.get<{ suggestions: CategorySuggestion[] }>(index().url).then((response) =>
			setSuggestions(response.data.suggestions)
		)
	}, [])

	function remove(id: string) {
		setSuggestions((current) => current.filter((suggestion) => suggestion.id !== id))
	}

	function handleAccept(suggestion: CategorySuggestion) {
		setBusyId(suggestion.id)
		const { url, method } = accept(suggestion.id)

		Axios.request<{ message: string }>({ url, method })
			.then((response) => {
				toast.success(response.data.message)
				remove(suggestion.id)
				onChanged()
			})
			.catch((error: unknown) => {
				const message = (error as { response?: { data?: { errors?: { suggestion?: string[] } } } }).response
					?.data?.errors?.suggestion?.[0]

				toast.error(message ?? "Couldn't apply that suggestion.")

				if (message) {
					remove(suggestion.id)
				}
			})
			.finally(() => setBusyId(null))
	}

	function handleDismiss(suggestion: CategorySuggestion) {
		remove(suggestion.id)
		const { url, method } = dismiss(suggestion.id)

		Axios.request({ url, method }).catch(() => setSuggestions((current) => [suggestion, ...current]))
	}

	if (suggestions.length === 0) {
		return null
	}

	return (
		<section
			aria-label="Category suggestions"
			className="space-y-3 rounded-2xl border bg-card p-4">
			<div className="flex items-center gap-2">
				<Lightbulb className="size-4 text-amber-500" />
				<h2 className="text-sm font-medium">Ideas from last month's spending</h2>
			</div>

			<ul className="space-y-2">
				{suggestions.map((suggestion) => (
					<li
						key={suggestion.id}
						className="flex items-start gap-3 rounded-xl border p-3">
						<span
							className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted"
							style={{ color: suggestion.color }}>
							<LucideIconDisplay
								icon={suggestion.icon}
								className="size-4"
							/>
						</span>

						<div className="min-w-0 flex-1 space-y-1">
							<p className="text-sm font-medium">
								{suggestion.action === "rename"
									? `Rename "${suggestion.currentName}" to "${suggestion.name}"`
									: `Add a "${suggestion.name}" category`}
							</p>
							{suggestion.reason && <p className="text-xs text-muted-foreground">{suggestion.reason}</p>}
						</div>

						<div className="flex shrink-0 items-center gap-1">
							<Button
								type="button"
								size="sm"
								disabled={busyId === suggestion.id}
								onClick={() => handleAccept(suggestion)}>
								{busyId === suggestion.id && <Spinner />}
								{suggestion.action === "rename" ? "Rename" : "Add"}
							</Button>
							<Button
								type="button"
								size="icon"
								variant="ghost"
								aria-label="Dismiss suggestion"
								disabled={busyId === suggestion.id}
								onClick={() => handleDismiss(suggestion)}>
								<X />
							</Button>
						</div>
					</li>
				))}
			</ul>
		</section>
	)
}
