<?php

/**
 * BudgetKu — Vercel Serverless Entrypoint
 * Prepares writable /tmp directory structure for Laravel compiled views
 * and forwards the HTTP request to public/index.php.
 */

// Pastikan direktori cache dan views di /tmp dibuat secara dinamis
$tmpDirectories = [
    '/tmp/views',
    '/tmp/cache',
    '/tmp/cache/data',
    '/tmp/sessions',
    '/tmp/logs',
];

foreach ($tmpDirectories as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
}

// Set environment path untuk compiler blade view Laravel
putenv('VIEW_COMPILED_PATH=/tmp/views');
$_ENV['VIEW_COMPILED_PATH'] = '/tmp/views';

// Load entrypoint utama Laravel
require __DIR__ . '/../public/index.php';
