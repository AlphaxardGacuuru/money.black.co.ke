import { Check, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import LucideIconDisplay from "@/components/lucide-icon-display"
import { Button } from "@/components/ui/button"
import { Link } from "@/components/ui/link"
import { Spinner } from "@/components/ui/spinner"
import Axios from "@/lib/axios"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { index, starter } from "@/routes/api/category-suggestions"
import type { StarterCategory } from "@/types/category-suggestion"

type Props = {
	onCreated: () => void
}

const groups = [
	{ type: "expense", title: "Spending" },
	{ type: "income", title: "Income" },
] as const

/**
 * Shown when a user has no categories: a ready-made list to pick from,
 * with the most common ones preselected.
 */
export default function StarterCategories({ onCreated }: Props) {
	const [presets, setPresets] = useState<StarterCategory[]>([])
	const [selected, setSelected] = useState<Set<string>>(new Set())
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		Axios.get<{ starter: StarterCategory[] }>(index().url)
			.then((response) => {
				setPresets(response.data.starter)
				setSelected(
					new Set(response.data.starter.filter((preset) => preset.recommended).map((preset) => preset.name))
				)
			})
			.finally(() => setLoading(false))
	}, [])

	function toggle(name: string) {
		setSelected((current) => {
			const next = new Set(current)

			if (next.has(name)) {
				next.delete(name)
			} else {
				next.add(name)
			}

			return next
		})
	}

	function handleCreate() {
		setSaving(true)
		const { url, method } = starter()

		Axios.request<{ message: string }>({ url, method, data: { names: [...selected] } })
			.then((response) => {
				toast.success(response.data.message)
				onCreated()
			})
			.catch(() => toast.error("Couldn't add the categories. Please try again."))
			.finally(() => setSaving(false))
	}

	return (
		<div className="space-y-6 rounded-2xl border bg-card p-6 text-left">
			<div className="space-y-1">
				<h2 className="text-lg font-semibold">Start with some categories</h2>
				<p className="text-sm text-muted-foreground">
					We've picked the ones most people use. Tap to add or remove; you can rename or change any of them
					later.
				</p>
			</div>

			{loading ? (
				<div className="flex justify-center py-6">
					<Spinner />
				</div>
			) : (
				groups.map((group) => (
					<div
						key={group.type}
						className="space-y-2">
						<h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
							{group.title}
						</h3>
						<div className="flex flex-wrap gap-2">
							{presets
								.filter((preset) => preset.type === group.type)
								.map((preset) => {
									const isSelected = selected.has(preset.name)

									return (
										<button
											key={preset.name}
											type="button"
											aria-pressed={isSelected}
											onClick={() => toggle(preset.name)}
											className={cn(
												"flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
												isSelected
													? "border-transparent bg-primary text-primary-foreground"
													: "bg-background hover:bg-accent"
											)}>
											{isSelected ? (
												<Check className="size-3.5" />
											) : (
												<span style={{ color: preset.color }}>
													<LucideIconDisplay
														icon={preset.icon}
														className="size-3.5"
													/>
												</span>
											)}
											{preset.name}
										</button>
									)
								})}
						</div>
					</div>
				))
			)}

			<div className="flex flex-wrap items-center gap-3">
				<Button
					type="button"
					disabled={saving || selected.size === 0}
					onClick={handleCreate}
					data-test="add-starter-categories-button">
					{saving ? <Spinner /> : <Check />}
					Add {selected.size} {selected.size === 1 ? "category" : "categories"}
				</Button>
				<Button
					asChild
					variant="ghost">
					<Link
						href="/categories/create?type=expense"
						variant="unstyled"
						size="none">
						<Plus className="size-4" />
						Create my own
					</Link>
				</Button>
			</div>
		</div>
	)
}
