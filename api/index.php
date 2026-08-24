<?php

/**
 * BudgetKu — Vercel Serverless Entrypoint
 * Prepares writable /tmp directory structure for Laravel compiled views
 * and forwards the HTTP request to public/index.php.
 */

chdir(__DIR__ . '/..');

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

try {
    require __DIR__ . '/../public/index.php';
} catch (\Throwable $e) {
    http_response_code(500);
    echo '<!DOCTYPE html><html><head><title>BudgetKu Error</title></head><body style="font-family: monospace; padding: 20px; background: #1e1e1e; color: #ff6b6b;">';
    echo '<h2>[BudgetKu Vercel Exception]</h2>';
    echo '<p><strong>' . get_class($e) . ':</strong> ' . htmlspecialchars($e->getMessage()) . '</p>';
    echo '<p><strong>File:</strong> ' . htmlspecialchars($e->getFile()) . ' on line ' . $e->getLine() . '</p>';
    echo '<pre style="background: #2d2d2d; color: #ccc; padding: 15px; border-radius: 6px; overflow: auto;">' . htmlspecialchars($e->getTraceAsString()) . '</pre>';
    echo '</body></html>';
    exit;
}
