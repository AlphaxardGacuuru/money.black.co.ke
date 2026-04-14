import { Head, Link } from '@inertiajs/react';
import { Plus, Tags } from 'lucide-react';
import { useState } from 'react';
import CategoryController from '@/actions/App/Http/Controllers/CategoryController';
import Heading from '@/components/heading';
import LucideIconDisplay from '@/components/lucide-icon-display';
import { Button } from '@/components/ui/button';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';

type Category = {
    id: number | string;
    name: string;
    color?: string | null;
    icon?: string | null;
    type?: string | null;
    total?: number | string | null;
};

type PaginatedCategories = {
    data?: Category[];
};

type CategoriesPageProps = {
    categories?: Category[] | PaginatedCategories;
};

function getCategories(categories?: Category[] | PaginatedCategories): Category[] {
    if (Array.isArray(categories)) {
        return categories;
    }

    return categories?.data ?? [];
}

function getNumericTotal(category: Category): number {
    const total = Number(category.total ?? 0);

    return Number.isNaN(total) ? 0 : total;
}

function getCategoryType(type?: string | null): 'expense' | 'income' | 'other' {
    if (type === 'expense' || type === 'income') {
        return type;
    }

    return 'other';
}

function formatInteger(value: number): string {
    return new Intl.NumberFormat(undefined, {
        maximumFractionDigits: 0,
    }).format(value);
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function resolveCardColor(color: string | null | undefined, index: number): string {
    const fallbackColors = ['#0ea5e9', '#10b981', '#f97316', '#e11d48', '#8b5cf6', '#14b8a6', '#f59e0b'];

    if (typeof color === 'string' && color.trim() !== '') {
        return color;
    }

    return fallbackColors[index % fallbackColors.length];
}

function CategoryGrid({ categories }: { categories: Category[] }) {
    const [activeType, setActiveType] = useState<'expense' | 'income'>('expense');
    const sortedCategories = [...categories].sort(
        (left, right) => getNumericTotal(right) - getNumericTotal(left) || left.name.localeCompare(right.name),
    );
    const visibleCategories = sortedCategories.filter((category) => getCategoryType(category.type) === activeType);

    return (
        <section className="rounded-2xl border bg-card p-4 shadow-xs sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-semibold tracking-tight">Categories</p>
                    <p className="text-xs text-muted-foreground">Tap a category to edit details</p>
                </div>

                <div className="inline-flex justify-between rounded-lg border bg-background p-1">
                    <button
                        type="button"
                        onClick={() => setActiveType('expense')}
                        className={`rounded-md w-50 px-3 py-1.5 text-xs font-semibold transition-colors ${
                            activeType === 'expense' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Expense
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveType('income')}
                        className={`rounded-md w-50 px-3 py-1.5 text-xs font-semibold transition-colors ${
                            activeType === 'income' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Income
                    </button>
                </div>
            </div>

            {visibleCategories.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                    {visibleCategories.map((category, index) => (
                        <Link
                            key={category.id}
                            href={CategoryController.edit.url(category.id)}
                            className="group flex min-h-28 flex-col rounded-xl border border-border/70 bg-background p-3 text-center transition-colors hover:bg-accent/20"
                        >
                            <p className="truncate text-xs font-medium leading-tight">{category.name}</p>

                            <div className="flex flex-1 items-center justify-center">
                                <div
                                    className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/60 text-white"
                                    style={{ backgroundColor: resolveCardColor(category.color, index) }}
                                >
                                    <LucideIconDisplay
                                        icon={category.icon}
                                        className="size-4"
                                        fallback={<span className="text-[11px] font-semibold">{getInitials(category.name) || 'C'}</span>}
                                    />
                                </div>
                            </div>

                            <div className="text-center">
                                <p className="font-semibold text-xs leading-none">{formatInteger(getNumericTotal(category))}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-foreground">
                    No {activeType} categories yet.
                </div>
            )}
        </section>
    );
}

export default function CategoriesIndex({ categories }: CategoriesPageProps) {
    const categoryList = getCategories(categories);

    return (
        <>
            <Head title="Categories" />

            <div className="flex flex-1 justify-center p-3 sm:p-4">
                <div className="w-full max-w-3xl space-y-4">
                    <div className="relative overflow-hidden rounded-2xl border bg-card px-4 py-4 shadow-xs sm:px-5">
                        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/8 via-transparent to-transparent" />

                        <div className="relative flex items-start justify-between gap-3">
                            <Heading
                                title="Categories"
                                description="Group transactions in a way that makes monthly reviews effortless."
                            />

                            <Button asChild size="sm" className="shrink-0">
                                <Link href={CategoryController.create.url()}>
                                    <Plus className="size-4" />
                                    Add
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {categoryList.length > 0 ? (
                        <CategoryGrid categories={categoryList} />
                    ) : (
                        <div className="relative overflow-hidden rounded-2xl border border-dashed bg-card">
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-muted-foreground/15" />
                            <div className="relative flex min-h-72 flex-col items-center justify-center gap-4 p-6 text-center">
                                <div className="flex size-14 items-center justify-center rounded-full border bg-background shadow-sm">
                                    <Tags className="size-6 text-muted-foreground" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-lg font-semibold">No categories yet</h2>
                                    <p className="max-w-md text-sm text-muted-foreground">
                                        Create your first category to start organizing spending and income like a real budget app.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

CategoriesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Categories',
            href: '/categories',
        },
    ],
};
