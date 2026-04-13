import { Head, Link } from '@inertiajs/react';
import { ChevronRight, Plus, Wallet } from 'lucide-react';
import AccountController from '@/actions/App/Http/Controllers/AccountController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';

type Account = {
    id: number | string;
    name: string;
    color?: string | null;
    icon?: string | null;
    currency?: string | null;
    balance?: number | string | null;
    type?: string | null;
    description?: string | null;
    isDefault?: boolean;
};

type PaginatedAccounts = {
    data?: Account[];
};

type AccountsPageProps = {
    accounts?: Account[] | PaginatedAccounts;
};

function getAccounts(accounts?: Account[] | PaginatedAccounts): Account[] {
    if (Array.isArray(accounts)) {
        return accounts;
    }

    return accounts?.data ?? [];
}

function formatBalance(account: Account): string {
    const balance = Number(account.balance ?? 0);

    if (Number.isNaN(balance)) {
        return String(account.balance ?? 0);
    }

    return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(balance);
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export default function AccountsIndex({ accounts }: AccountsPageProps) {
    const accountList = getAccounts(accounts);

    return (
        <>
            <Head title="Accounts" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Accounts"
                        description="Track the wallets, banks, and cash accounts that power the rest of your bookkeeping."
                    />

                    <Button asChild className="sm:self-start">
                        <Link href={AccountController.create.url()}>
                            <Plus />
                            Create account
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {accountList.length > 0 ? (
                        accountList.map((account) => (
                            <Link
                                key={account.id}
                                href={AccountController.edit.url(account.id)}
                                className="group block"
                            >
                                <Card className="h-full border-border/80 transition-colors group-hover:border-primary/40 group-hover:bg-accent/20">
                                    <CardHeader className="gap-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="flex size-12 items-center justify-center rounded-xl border border-border/60 text-white shadow-sm"
                                                    style={{
                                                        backgroundColor:
                                                            account.color ??
                                                            '#0f172a',
                                                    }}
                                                >
                                                    <span className="text-sm font-semibold">
                                                        {getInitials(
                                                            account.name,
                                                        ) || 'A'}
                                                    </span>
                                                </div>

                                                <div className="space-y-1">
                                                    <CardTitle>
                                                        {account.name}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        {account.description ||
                                                            'No description added yet.'}
                                                    </CardDescription>
                                                </div>
                                            </div>

                                            <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="secondary">
                                                {account.currency ?? 'KES'}
                                            </Badge>
                                            {account.type ? (
                                                <Badge variant="outline">
                                                    {account.type}
                                                </Badge>
                                            ) : null}
                                            {account.isDefault ? (
                                                <Badge>Default</Badge>
                                            ) : null}
                                        </div>

                                        <div className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3">
                                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                                Balance
                                            </p>
                                            <p className="mt-2 text-2xl font-semibold tracking-tight">
                                                {account.currency ?? 'KES'}{' '}
                                                {formatBalance(account)}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <Card className="relative overflow-hidden border-dashed md:col-span-2 xl:col-span-3">
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-muted-foreground/15" />
                            <CardContent className="relative flex min-h-72 flex-col items-center justify-center gap-4 text-center">
                                <div className="flex size-14 items-center justify-center rounded-full border bg-background shadow-sm">
                                    <Wallet className="size-6 text-muted-foreground" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-lg font-semibold">
                                        No accounts yet
                                    </h2>
                                    <p className="max-w-md text-sm text-muted-foreground">
                                        Create your first account to start tracking balances, defaults, and account-specific activity inside the app.
                                    </p>
                                </div>
                                <Button asChild>
                                    <Link href="/accounts/create">
                                        <Plus />
                                        Create your first account
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}

AccountsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Accounts',
            href: '/accounts',
        },
    ],
};