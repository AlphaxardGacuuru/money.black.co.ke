export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    twoFactorEnabled?: boolean;
    home_page?: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
