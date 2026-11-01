import { useQuery } from "@tanstack/react-query"
import { Sparkles } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Axios from "@/lib/axios"
import { show } from "@/routes/api/monthly-summaries"

type MonthlySummary = {
	period: string
	headline: string
	summary: string
	generatedAt: string
}

/**
 * The AI-written summary of a month's spending. Summaries are made on the 1st
 * for the month before, so the current month never has one; nothing is shown then.
 */
export default function MonthlySummaryCard({ period }: { period: string }) {
	const { data: summary, isPending } = useQuery({
		queryKey: ["monthly-summaries", period],
		queryFn: () =>
			Axios.get<{ data: MonthlySummary | null }>(show(period).url).then(
				(response) => response.data.data
			),
		staleTime: 10 * 60 * 1000,
	})

	if (isPending) {
		return <Skeleton className="h-24 w-full rounded-xl" />
	}

	if (!summary) {
		return null
	}

	return (
		<section
			aria-label="Monthly summary"
			className="relative overflow-hidden rounded-xl border bg-card p-4">
			<div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/6 via-transparent to-transparent" />

			<div className="relative space-y-1.5">
				<p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
					<Sparkles className="size-3.5 text-primary" />
					AI summary
				</p>
				<h2 className="font-semibold">{summary.headline}</h2>
				<p className="text-sm text-muted-foreground">{summary.summary}</p>
			</div>
		</section>
	)
}
