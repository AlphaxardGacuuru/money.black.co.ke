<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Admin Email
    |--------------------------------------------------------------------------
    |
    | Only the user with this email address may access the /admin section
    | of the application (both the API routes and the SPA pages).
    |
    */

    'email' => env('ADMIN_EMAIL', 'alphaxardgacuuru47@gmail.com'),

    /*
    |--------------------------------------------------------------------------
    | Dashboard Emails
    |--------------------------------------------------------------------------
    |
    | Comma-separated allowlist of users who may open the Telescope dashboard
    | outside the local environment. Checked against the web session user.
    |
    */

    'dashboard_emails' => array_filter(explode(',', env('ADMIN_DASHBOARD_EMAILS', ''))),
];
