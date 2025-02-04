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

    'allowed_origins' => ['http://localhost:5173','http://localhost:8000','http://192.168.1.21:8000','http:// 192.168.254.107:5173','http://192.168.208.120:5173','http://192.168.208.120:8000', 'http://192.168.254.115:8000', 'http://192.168.254.115:5173','https://talentobooking.netlify.app','https://palegoldenrod-weasel-648342.hostingersite.com','http://192.168.254.109:8000','http://192.168.254.109:5173','http://192.168.254.110:8000','http://192.168.254.110:5173','http://192.168.254.106:5173','http://192.168.254.106:8000','http://127.0.0.1:5000'], // Add your frontend URL here

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true, 

];
