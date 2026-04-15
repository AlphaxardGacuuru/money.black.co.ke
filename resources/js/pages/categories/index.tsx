import { Head, Link } from '@inertiajs/react';
import { Plus, Tags } from 'lucide-react';
import CategoryController from '@/actions/App/Http/Controllers/CategoryController';
import CategoryGrid from '@/components/categories/category-grid';
import type {
    Account,
    CategoriesPageProps,
    Category,
    PaginatedAccounts,
    PaginatedCategories,
} from '@/components/categories/types';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';

function getCategories(categories?: Category[] | PaginatedCategories): Category[] {
    if (Array.isArray(categories)) {
        return categories;
    }

    return categories?.data ?? [];
}

function getAccounts(accounts?: Account[] | PaginatedAccounts): Account[] {
    if (Array.isArray(accounts)) {
        return accounts;
    }

    return accounts?.data ?? [];
}


export default function CategoriesIndex({ categories, accounts }: CategoriesPageProps) {
    const categoryList = getCategories(categories);
    const accountList = getAccounts(accounts);

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
                        </div>
                    </div>

                    {categoryList.length > 0 ? (
                        <CategoryGrid categories={categoryList} accounts={accountList} />
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
                                <Button asChild>
                                    <Link href={CategoryController.create.url({ query: { type: 'expense' } })}>
                                        <Plus className="size-4" />
                                        Create category
                                    </Link>
                                </Button>
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