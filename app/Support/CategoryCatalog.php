<?php

namespace App\Support;

/**
 * Built-in category presets: the starter set offered to users with no
 * categories, plus the icons and colours AI suggestions may use.
 *
 * Icons are lucide-react component names (PascalCase), which is what the
 * category icon picker stores.
 */
class CategoryCatalog
{
    /**
     * Common household categories in Kenya. `recommended` ones are preselected.
     *
     * @var array<int, array{name: string, type: 'expense'|'income', icon: string, color: string, recommended: bool}>
     */
    public const STARTER = [
        ['name' => 'Food & Groceries', 'type' => 'expense', 'icon' => 'ShoppingCart', 'color' => '#16a34a', 'recommended' => true],
        ['name' => 'Eating Out', 'type' => 'expense', 'icon' => 'Utensils', 'color' => '#ea580c', 'recommended' => true],
        ['name' => 'Transport', 'type' => 'expense', 'icon' => 'Bus', 'color' => '#2563eb', 'recommended' => true],
        ['name' => 'Fuel', 'type' => 'expense', 'icon' => 'Fuel', 'color' => '#0f766e', 'recommended' => false],
        ['name' => 'Rent', 'type' => 'expense', 'icon' => 'House', 'color' => '#7c3aed', 'recommended' => true],
        ['name' => 'Electricity', 'type' => 'expense', 'icon' => 'Zap', 'color' => '#ca8a04', 'recommended' => true],
        ['name' => 'Water', 'type' => 'expense', 'icon' => 'Droplet', 'color' => '#0284c7', 'recommended' => false],
        ['name' => 'Airtime & Data', 'type' => 'expense', 'icon' => 'Smartphone', 'color' => '#059669', 'recommended' => true],
        ['name' => 'Internet', 'type' => 'expense', 'icon' => 'Wifi', 'color' => '#4f46e5', 'recommended' => false],
        ['name' => 'M-Pesa & Bank Charges', 'type' => 'expense', 'icon' => 'Landmark', 'color' => '#64748b', 'recommended' => true],
        ['name' => 'Health', 'type' => 'expense', 'icon' => 'HeartPulse', 'color' => '#dc2626', 'recommended' => true],
        ['name' => 'School Fees', 'type' => 'expense', 'icon' => 'GraduationCap', 'color' => '#9333ea', 'recommended' => false],
        ['name' => 'Clothing', 'type' => 'expense', 'icon' => 'Shirt', 'color' => '#db2777', 'recommended' => false],
        ['name' => 'Household', 'type' => 'expense', 'icon' => 'Sofa', 'color' => '#a16207', 'recommended' => false],
        ['name' => 'Personal Care', 'type' => 'expense', 'icon' => 'Sparkles', 'color' => '#c026d3', 'recommended' => false],
        ['name' => 'Entertainment', 'type' => 'expense', 'icon' => 'Film', 'color' => '#e11d48', 'recommended' => false],
        ['name' => 'Subscriptions', 'type' => 'expense', 'icon' => 'Repeat', 'color' => '#0891b2', 'recommended' => false],
        ['name' => 'Family Support', 'type' => 'expense', 'icon' => 'HandHeart', 'color' => '#be123c', 'recommended' => false],
        ['name' => 'Church & Giving', 'type' => 'expense', 'icon' => 'HandCoins', 'color' => '#b45309', 'recommended' => false],
        ['name' => 'Loan Repayments', 'type' => 'expense', 'icon' => 'CreditCard', 'color' => '#475569', 'recommended' => false],
        ['name' => 'Savings', 'type' => 'expense', 'icon' => 'PiggyBank', 'color' => '#15803d', 'recommended' => false],
        ['name' => 'Salary', 'type' => 'income', 'icon' => 'Briefcase', 'color' => '#15803d', 'recommended' => true],
        ['name' => 'Business', 'type' => 'income', 'icon' => 'Store', 'color' => '#0d9488', 'recommended' => false],
        ['name' => 'Side Hustle', 'type' => 'income', 'icon' => 'Laptop', 'color' => '#16a34a', 'recommended' => false],
        ['name' => 'Rental Income', 'type' => 'income', 'icon' => 'Building2', 'color' => '#4338ca', 'recommended' => false],
        ['name' => 'Gifts Received', 'type' => 'income', 'icon' => 'Gift', 'color' => '#db2777', 'recommended' => false],
        ['name' => 'Interest & Dividends', 'type' => 'income', 'icon' => 'TrendingUp', 'color' => '#2563eb', 'recommended' => false],
    ];

    /**
     * Icons an AI suggestion may pick from.
     *
     * @var array<int, string>
     */
    public const ICONS = [
        'ShoppingCart', 'Utensils', 'Coffee', 'Beer', 'Bus', 'Car', 'Bike', 'Plane', 'Fuel', 'House', 'Zap',
        'Droplet', 'Smartphone', 'Wifi', 'Tv', 'Landmark', 'Receipt', 'Wallet', 'Banknote', 'CreditCard',
        'PiggyBank', 'HandCoins', 'HeartPulse', 'Pill', 'Stethoscope', 'Dumbbell', 'GraduationCap', 'BookOpen',
        'Baby', 'PawPrint', 'Shirt', 'Scissors', 'Sparkles', 'Sofa', 'Wrench', 'Hammer', 'Leaf', 'Film', 'Music',
        'Gamepad2', 'Gift', 'HandHeart', 'Heart', 'Church', 'Users', 'ShieldCheck', 'Repeat', 'Briefcase',
        'Store', 'Laptop', 'Building2', 'TrendingUp', 'Tags',
    ];

    /**
     * @var array<int, string>
     */
    public const PALETTE = [
        '#16a34a', '#ea580c', '#2563eb', '#7c3aed', '#ca8a04', '#0284c7', '#dc2626', '#db2777',
        '#0d9488', '#4f46e5', '#a16207', '#64748b',
    ];

    /**
     * @return array<string, array{name: string, type: 'expense'|'income', icon: string, color: string, recommended: bool}>
     */
    public static function starterByName(): array
    {
        return array_column(self::STARTER, null, 'name');
    }

    /**
     * Pick a stable colour for a category name.
     */
    public static function colorFor(string $name): string
    {
        return self::PALETTE[crc32(strtolower($name)) % count(self::PALETTE)];
    }

    public static function iconOrDefault(?string $icon): string
    {
        return in_array($icon, self::ICONS, true) ? $icon : 'Tags';
    }
}
