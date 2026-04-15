import { Form, Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import AccountController from '@/actions/App/Http/Controllers/AccountController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import LucideIconPicker from '@/components/lucide-icon-picker';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

type Account = {
    id: string;
    name: string;
    icon: string;
    color: string;
    currency: string;
    type: string | null;
    description: string | null;
    isDefault: boolean;
};

type EditAccountProps = {
    account?: Account | { data?: Account };
};

function normalizeAccount(
    account?: Account | { data?: Account },
): Account | null {
    if (!account) {
        return null;
    }

    if ('data' in account) {
        return (account as { data?: Account }).data ?? null;
    }

    return account as Account;
}

export default function EditAccount({ account }: EditAccountProps) {
    const accountData = normalizeAccount(account);
    const [isDefault, setIsDefault] = useState(accountData?.isDefault ?? false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = (): void => {
        setIsDeleting(true);
        router.delete(
            AccountController.destroy['/accounts/{account}'].url(accountData?.id ?? ''),
            {
                preserveScroll: true,
                onSuccess: () => setIsDeleteDialogOpen(false),
                onFinish: () => setIsDeleting(false),
            },
        );
    };

    if (!accountData?.id) {
        return (
            <div className="p-4">
                <Heading
                    title="Account not found"
                    description="We couldn't load this account. Please go back and try again."
                />
            </div>
        );
    }

    return (
        <>
            <Head title={`Edit ${accountData.name}`} />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <Heading
                    title={`Edit ${accountData.name}`}
                    description="Update your account details."
                />

                <Form
                    {...AccountController.update['/accounts/{account}'].form(
                        accountData.id,
                    )}
                    options={{ preserveScroll: true }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="icon">Icon</Label>
                                    <LucideIconPicker
                                        id="icon"
                                        name="icon"
                                        required
                                        defaultValue={accountData.icon}
                                        placeholder="Select account icon"
                                    />
                                    <InputError message={errors.icon} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="color">Color</Label>
                                    <Input
                                        id="color"
                                        type="color"
                                        name="color"
                                        defaultValue={accountData.color}
                                        required
                                    />
                                    <InputError message={errors.color} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    defaultValue={accountData.name}
                                    placeholder="e.g., Equity Bank, M-Pesa"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label>Currency</Label>
                                    <Select name="currency" defaultValue={accountData.currency ?? 'KES'}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="KES">KES</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.currency} />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <Select
                                        name="type"
                                        defaultValue={
                                            accountData.type ?? undefined
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="regular">Regular</SelectItem>
                                            <SelectItem value="savings">Savings</SelectItem>
                                            <SelectItem value="mobile">Mobile</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.type} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={3}
                                    placeholder="Optional details about this account..."
                                    defaultValue={
                                        accountData.description ?? undefined
                                    }
                                    className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="flex items-center gap-3">
                                <input type="hidden" name="is_default" value={isDefault ? '1' : '0'} />
                                <Switch
                                    id="is_default"
                                    checked={isDefault}
                                    onCheckedChange={setIsDefault}
                                />
                                <Label htmlFor="is_default" className="cursor-pointer">
                                    Set as Default Account
                                </Label>
                            </div>

                            <div className="flex justify-between gap-3">
                                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button type="button" variant="destructive">
                                            Delete Account
                                        </Button>
                                    </DialogTrigger>

                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Delete this account?</DialogTitle>
                                            <DialogDescription>
                                                This action cannot be undone. All data linked to this account may become inaccessible.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button type="button" variant="secondary" disabled={isDeleting}>
                                                    Cancel
                                                </Button>
                                            </DialogClose>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={handleDelete}
                                                disabled={isDeleting}
                                            >
                                                {isDeleting && <Spinner />}
                                                Yes, Delete Account
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                    <Button type="submit" disabled={processing}>
                                        {processing && <Spinner />}
                                        Save Changes
                                    </Button>
                            </div>
							<div className="flex justify-center">
                                <Button variant="outline" asChild>
                                    <Link href={AccountController.index['/accounts'].url()}>
                                                                            <ArrowLeft className="size-4" />
                                    Back to Accounts
                                    </Link>
                                </Button>
							</div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

EditAccount.layout = {
    breadcrumbs: [
        { title: 'Accounts', href: '/accounts' },
        { title: 'Edit', href: '#' },
    ],
};
