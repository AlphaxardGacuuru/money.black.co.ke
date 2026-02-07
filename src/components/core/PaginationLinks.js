import React from "react"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import Btn from "@/components/ui/button"

const PaginationLinks = ({ getPaginated, setState, list }) => {
	const onPageSizeChange = (newPageSize) => {
		// Try to find a valid link to extract base URL and existing filters
		const validLink =
			list.meta?.links?.find((link) => link.url && link.active) ||
			list.meta?.links?.find((link) => link.url)

		if (validLink) {
			const tempUrl = new URL(validLink.url)
			tempUrl.searchParams.set("per_page", newPageSize)
			tempUrl.searchParams.set("page", 1)

			const fullString = tempUrl.toString()
			// Remove domain and /api/ prefix to get relative path for getPaginated
			const url = fullString.replace(/^(?:\/\/|[^/]+)*\/api\//, "")

			getPaginated(url, setState)
		}
	}

	return (
		<div className="flex items-center gap-6">
			{list.meta && (
				<div className="flex items-center gap-2">
					<span className="text-sm font-light font-nunito text-white/50">
						Rows per page
					</span>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button className="inline-flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-3 text-base font-light font-nunito text-white backdrop-blur-md transition-all duration-700 ease-out hover:bg-white/10 focus:outline-none">
								{list.meta.per_page}
								<ChevronDown className="h-4 w-4 opacity-50" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="min-w-[unset] w-[var(--radix-dropdown-menu-trigger-width)]">
							<DropdownMenuRadioGroup
								value={list.meta.per_page.toString()}
								onValueChange={(value) => onPageSizeChange(Number(value))}>
								{[5, 10, 15, 20, 30, 40, 50].map((pageSize) => (
									<DropdownMenuRadioItem
										key={pageSize}
										value={pageSize.toString()}
										className="justify-center">
										{pageSize}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)}

			<nav
				aria-label="Page navigation example"
				className="">
				<ul className="flex list-none flex-wrap items-center justify-end gap-1 p-0">
					{list.meta?.links.map((link, key) => (
						<li
							key={key}
							className={`
                            inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-3xl border text-base font-light font-nunito transition-all duration-700 ease-out
                            ${
															link.active
																? "border-white bg-white font-normal text-black"
																: "border-white/10 bg-white/5 backdrop-blur-md text-white hover:bg-white/10"
														}
                            ${!link.url ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        `}
							onClick={() => {
								// Check if url is available
								if (link.url) {
									// Use URL API to remove domain
									var url = link.url.replace(/^(?:\/\/|[^/]+)*\/api\//, "")

									getPaginated(url, setState)
								}
							}}>
							{link.label.includes("Previous") ||
							link.label.includes("&laquo;") ? (
								<ChevronLeft className="h-4 w-4" />
							) : link.label.includes("Next") ||
							  link.label.includes("&raquo;") ? (
								<ChevronRight className="h-4 w-4" />
							) : (
								<span
									className="px-3"
									dangerouslySetInnerHTML={{
										__html: link.label,
									}}
								/>
							)}
						</li>
					))}
				</ul>
			</nav>
		</div>
	)
}

export default PaginationLinks
