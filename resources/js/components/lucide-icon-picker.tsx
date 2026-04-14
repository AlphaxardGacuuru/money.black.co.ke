import { icons } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createElement, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const ICON_NAMES = Object.keys(icons).sort((left, right) =>
    left.localeCompare(right),
);
const ICONS_PER_PAGE = 36;

type LucideIconPickerProps = {
    id?: string;
    name: string;
    defaultValue?: string;
    placeholder?: string;
    required?: boolean;
};

function resolveIcon(icon?: string): LucideIcon | null {
    if (!icon) {
        return null;
    }

    return (icons[icon as keyof typeof icons] as LucideIcon | undefined) ?? null;
}

function fuzzyMatch(term: string, query: string): boolean {
    if (!query) {
        return true;
    }

    const normalizedTerm = term.toLowerCase();
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
        return true;
    }

    if (normalizedTerm.includes(normalizedQuery)) {
        return true;
    }

    // Subsequence fuzzy match: "ac" matches "AlarmClock".
    let queryIndex = 0;

    for (const character of normalizedTerm) {
        if (character === normalizedQuery[queryIndex]) {
            queryIndex += 1;
        }

        if (queryIndex === normalizedQuery.length) {
            return true;
        }
    }

    return false;
}

export default function LucideIconPicker({
    id,
    name,
    defaultValue,
    placeholder = 'Select an icon',
    required,
}: LucideIconPickerProps) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(defaultValue ?? '');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const selectedIcon = resolveIcon(value);

    const filteredIconNames = useMemo(
        () => ICON_NAMES.filter((iconName) => fuzzyMatch(iconName, query)),
        [query],
    );
    const totalPages = Math.max(
        1,
        Math.ceil(filteredIconNames.length / ICONS_PER_PAGE),
    );

    const currentPageIcons = useMemo(() => {
        const start = (page - 1) * ICONS_PER_PAGE;

        return filteredIconNames.slice(start, start + ICONS_PER_PAGE);
    }, [filteredIconNames, page]);

    function onOpenChange(nextOpen: boolean) {
        setOpen(nextOpen);

        if (!nextOpen || !value) {
            return;
        }

        const selectedIndex = ICON_NAMES.indexOf(value);

        if (selectedIndex < 0) {
            return;
        }

        setPage(Math.floor(selectedIndex / ICONS_PER_PAGE) + 1);
    }

    function onSelectIcon(iconName: string) {
        setValue(iconName);
        setOpen(false);
    }

    function onSearchChange(searchValue: string) {
        setQuery(searchValue);
        setPage(1);
    }

    return (
        <>
            <input type="hidden" name={name} value={value} required={required} />
            <DropdownMenu open={open} onOpenChange={onOpenChange}>
                <DropdownMenuTrigger asChild>
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        className="w-full justify-start"
                    >
                        {selectedIcon ? (
                            <span className="flex items-center gap-2 truncate">
                                {createElement(selectedIcon, {
                                    className: 'size-4',
                                    'aria-hidden': 'true',
                                })}
                                <span className="truncate">{value}</span>
                            </span>
                        ) : (
                            <span className="text-muted-foreground">
                                {placeholder}
                            </span>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="start"
                    sideOffset={6}
                    className="w-88 p-3"
                >
                    <Input
                        type="search"
                        value={query}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Search Icon"
                        className="mb-3"
                    />

                    <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                            {filteredIconNames.length} result{filteredIconNames.length === 1 ? '' : 's'} • Page {page} of {totalPages}
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                disabled={page === 1}
                                aria-label="Previous icon page"
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setPage((prev) =>
                                        Math.min(totalPages, prev + 1),
                                    )
                                }
                                disabled={page === totalPages}
                                aria-label="Next icon page"
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid max-h-80 grid-cols-6 gap-2 overflow-y-auto pr-1">
                        {currentPageIcons.map((iconName) => {
                            const iconComponent = resolveIcon(iconName);

                            if (!iconComponent) {
                                return null;
                            }

                            return (
                                <button
                                    key={iconName}
                                    type="button"
                                    onClick={() => onSelectIcon(iconName)}
                                    title={iconName}
                                    className={cn(
                                        'flex h-10 w-full items-center justify-center rounded-md border border-input bg-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none',
                                        value === iconName &&
                                            'border-primary bg-primary/10 text-primary',
                                    )}
                                >
                                    {createElement(iconComponent, {
                                        className: 'size-4',
                                        'aria-hidden': 'true',
                                    })}
                                </button>
                            );
                        })}

                        {currentPageIcons.length === 0 ? (
                            <p className="col-span-6 py-6 text-center text-xs text-muted-foreground">
                                No icons match your search.
                            </p>
                        ) : null}
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                        Selected: {value || 'None'}
                    </p>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}