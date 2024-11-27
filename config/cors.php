<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'], // Ensure these paths are included

    'allowed_methods' => ['*'],

    'allowed_origins' => ['http://localhost:5173','http://192.168.254.116:8000','http://192.168.254.116:5173','http://192.168.208.120:5173','http://192.168.208.120:8000', 'http://192.168.1.23:8000', 'http://192.168.1.23:5173'], // Add your frontend URL here

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true, // Important for authentication with cookies

];
