import { Head } from "@inertiajs/react"
import { Upload } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import Heading from "@/components/heading"
import Axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

type ImportSummary = {
	rows: number
	imported: number
	duplicates: number
	skipped: number
	createdAccounts: number
	createdCategories: number
}

export default function OneMoneyImportPage() {
	const [file, setFile] = useState<File | null>(null)
	const [loading, setLoading] = useState(false)
	const [summary, setSummary] = useState<ImportSummary | null>(null)

	async function handleImport() {
		if (!file) {
			toast.error("Choose a file to import.")

			return
		}

		setLoading(true)

		try {
			const formData = new FormData()
			formData.append("file", file)

			const response = await Axios.post("/api/imports/one-money", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			})

			const importSummary = response.data?.summary as ImportSummary
			setSummary(importSummary)
			toast.success(response.data?.message ?? "Import completed.")
		} catch (error: unknown) {
			const message =
				(
					error as {
						response?: {
							data?: {
								message?: string
							}
						}
					}
				).response?.data?.message ??
				"Import failed. Please check the file format."

			toast.error(message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
			<Head title="Import 1Money" />

			<div className="flex flex-1 flex-col gap-6 p-4">
				<div className="rounded-xl border bg-card p-6 shadow-sm">
					<Heading
						title="Import 1Money Export"
						description="Upload a CSV/TXT export from 1Money. Data is mapped into accounts, categories, and transactions."
					/>
				</div>

				<div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
					<Input
						id="one-money-file"
						type="file"
						label="Upload file (CSV or TXT)"
						helperText="Choose a 1Money export in CSV or TXT format."
						accept=".csv,.txt"
						onChange={(event) => setFile(event.target.files?.[0] ?? null)}
					/>

					<div className="flex justify-end">
						<Button
							type="button"
							onClick={handleImport}
							disabled={loading}>
							{loading ? <Spinner /> : <Upload className="size-4" />}
							Import to App
						</Button>
					</div>
				</div>

				{summary ? (
					<div className="grid gap-3 rounded-xl border bg-card p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
						<div className="rounded-lg border border-border/70 p-3">
							<p className="text-xs text-muted-foreground">Rows read</p>
							<p className="text-2xl font-semibold">{summary.rows}</p>
						</div>
						<div className="rounded-lg border border-border/70 p-3">
							<p className="text-xs text-muted-foreground">Imported</p>
							<p className="text-2xl font-semibold">{summary.imported}</p>
						</div>
						<div className="rounded-lg border border-border/70 p-3">
							<p className="text-xs text-muted-foreground">
								Duplicates skipped
							</p>
							<p className="text-2xl font-semibold">{summary.duplicates}</p>
						</div>
						<div className="rounded-lg border border-border/70 p-3">
							<p className="text-xs text-muted-foreground">
								Invalid rows skipped
							</p>
							<p className="text-2xl font-semibold">{summary.skipped}</p>
						</div>
						<div className="rounded-lg border border-border/70 p-3">
							<p className="text-xs text-muted-foreground">Accounts created</p>
							<p className="text-2xl font-semibold">
								{summary.createdAccounts}
							</p>
						</div>
						<div className="rounded-lg border border-border/70 p-3">
							<p className="text-xs text-muted-foreground">
								Categories created
							</p>
							<p className="text-2xl font-semibold">
								{summary.createdCategories}
							</p>
						</div>
					</div>
				) : null}
			</div>
		</>
	)
}

OneMoneyImportPage.layout = {
	breadcrumbs: [{ title: "Import", href: "/imports/one-money" }],
}
