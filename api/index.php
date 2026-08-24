<?php

/**
 * BudgetKu — Vercel Serverless Entrypoint
 * Prepares writable /tmp directory structure for Laravel compiled views
 * and forwards the HTTP request to public/index.php.
 */

$tmpStorage = '/tmp/storage';
$tmpDirectories = [
    $tmpStorage,
    $tmpStorage . '/framework',
    $tmpStorage . '/framework/views',
    $tmpStorage . '/framework/cache',
    $tmpStorage . '/framework/cache/data',
    $tmpStorage . '/framework/sessions',
    $tmpStorage . '/logs',
    $tmpStorage . '/app',
];

foreach ($tmpDirectories as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
}

// Set environment path untuk compiler blade view Laravel
putenv("VIEW_COMPILED_PATH={$tmpStorage}/framework/views");
$_ENV['VIEW_COMPILED_PATH'] = "{$tmpStorage}/framework/views";
$_SERVER['VIEW_COMPILED_PATH'] = "{$tmpStorage}/framework/views";

// Load entrypoint utama Laravel
require __DIR__ . '/../public/index.php';
