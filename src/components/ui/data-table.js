"use client"

import { useState } from "react"
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table"
import { ChevronDown } from "lucide-react"

import Btn from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import NoData from "@/components/core/NoData"
import PaginationLinks from "@/components/core/PaginationLinks"

export function DataTable({
	columns,
	data,
	pagination,
	rowSelection,
	setRowSelection,
}) {
	const [sorting, setSorting] = useState([])
	const [columnFilters, setColumnFilters] = useState([])
	const [columnVisibility, setColumnVisibility] = useState({})
	const [internalRowSelection, setInternalRowSelection] = useState({})

	const finalRowSelection = rowSelection ?? internalRowSelection
	const finalSetRowSelection = setRowSelection ?? setInternalRowSelection

	const table = useReactTable({
		data,
		columns,
		getRowId: (row) => row.id,
		pageCount: pagination?.list?.meta?.last_page ?? -1,
		manualPagination: !!pagination,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: finalSetRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection: finalRowSelection,
		},
	})

	const PaginationControl = (
		<div className="flex items-center justify-end space-x-4 py-4">
			{/* Rows selected Start */}
			<div className="flex-1 text-sm text-muted-foreground text-white">
				{table.getFilteredSelectedRowModel().rows.length} of{" "}
				{table.getFilteredRowModel().rows.length} row
				{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""} selected.
			</div>
			{/* Rows selected End */}

			{/* Columns Visibility Start */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Btn
						variant="outline"
						size="sm">
						Columns <ChevronDown className="ml-2 h-4 w-4" />
					</Btn>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{table
						.getAllColumns()
						.filter((column) => column.getCanHide())
						.map((column) => {
							return (
								<DropdownMenuCheckboxItem
									key={column.id}
									className="capitalize"
									checked={column.getIsVisible()}
									onCheckedChange={(value) => column.toggleVisibility(!!value)}>
									{column.id}
								</DropdownMenuCheckboxItem>
							)
						})}
				</DropdownMenuContent>
			</DropdownMenu>
			{/* Columns Visibility End */}

			{/* Pagination Start */}
			{pagination ? (
				<PaginationLinks {...pagination} />
			) : (
				<div className="flex items-center space-x-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Btn
								variant="outline"
								size="sm">
								Rows Per Page: {table.getState().pagination.pageSize}{" "}
								<ChevronDown className="ml-2 h-4 w-4" />
							</Btn>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuRadioGroup
								value={table.getState().pagination.pageSize.toString()}
								onValueChange={(value) => table.setPageSize(Number(value))}>
								{[5, 10, 20, 30, 40, 50].map((pageSize) => (
									<DropdownMenuRadioItem
										key={pageSize}
										value={pageSize.toString()}>
										{pageSize}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
					<Btn
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}>
						Previous
					</Btn>
					<Btn
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}>
						Next
					</Btn>
				</div>
			)}
			{/* Pagination End */}
		</div>
	)

	return (
		<div className="w-full">
			{PaginationControl}
			<div className="rounded-md border border-white/20">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow
								key={headerGroup.id}
								className="border-white/20 text-white">
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext()
													)}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									className="border-white/20 text-white"
									data-state={row.getIsSelected() && "selected"}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="p-0">
									<NoData />
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			{PaginationControl}
		</div>
	)
}
