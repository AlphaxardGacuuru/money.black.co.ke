import { Form, Head, Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import CategoryController from '@/actions/App/Http/Controllers/CategoryController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import LucideIconPicker from '@/components/lucide-icon-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function CreateCategory() {
    return (
        <>
            <Head title="Create Category" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <Heading
                    title="Create Category"
                    description="Add a category for your income or expenses."
                />

                <Form
                    {...CategoryController.store['/categories'].form()}
                    options={{ preserveScroll: true }}
                    onSuccess={() =>
                        router.visit(CategoryController.index['/categories'].url())
                    }
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
                                        placeholder="Pick an Icon"
                                    />
                                    <InputError message={errors.icon} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="color">Color</Label>
                                    <Input
                                        id="color"
                                        type="color"
                                        name="color"
                                        defaultValue="#0f172a"
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
                                    placeholder="e.g., Groceries"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Type</Label>
                                <Select name="type">
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="expense">Expense</SelectItem>
                                        <SelectItem value="income">Income</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.type} />
                            </div>

                            <div className="flex justify-between">
                                <Button variant="outline" asChild>
                                    <Link href={CategoryController.index['/categories'].url()}>
                                        <ArrowLeft className="size-4" />
                                        Back to Categories
                                    </Link>
                                </Button>

                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Create Category
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

CreateCategory.layout = {
    breadcrumbs: [
        { title: 'Categories', href: '/categories' },
        { title: 'Create', href: '/categories/create' },
    ],
};
