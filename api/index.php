<?php

/**
 * BudgetKu — Vercel Serverless Entrypoint
 * Prepares writable /tmp directory structure for Laravel compiled views
 * and bootstrap caches, sanitizes empty env variables, then forwards to public/index.php.
 */

$_ENV['VERCEL'] = '1';
$_SERVER['VERCEL'] = '1';
putenv('VERCEL=1');

chdir(__DIR__ . '/..');

// Sanitasi variabel lingkungan agar tidak bernilai string kosong ("")
$envDefaults = [
    'SESSION_DRIVER' => 'cookie',
    'CACHE_STORE' => 'database',
    'LOG_CHANNEL' => 'stderr',
    'DB_CONNECTION' => 'pgsql',
    'DB_HOST' => 'aws-0-ap-southeast-1.pooler.supabase.com',
    'DB_PORT' => '5432',
    'DB_DATABASE' => 'postgres',
    'DB_USERNAME' => 'postgres.dmhifcfsloncgjrxzvnl',
    'DB_SSLMODE' => 'require',
    'FILESYSTEM_DISK' => 'local',
    'QUEUE_CONNECTION' => 'database',
    'MAIL_MAILER' => 'log',
    'APP_MAINTENANCE_DRIVER' => 'file',
    'APP_MAINTENANCE_STORE' => 'database',
];

foreach ($envDefaults as $key => $defaultVal) {
    if (empty($_ENV[$key]) || trim($_ENV[$key]) === '') {
        $_ENV[$key] = $defaultVal;
        $_SERVER[$key] = $defaultVal;
        putenv("{$key}={$defaultVal}");
    }
}

$tmpDirs = [
    '/tmp/storage',
    '/tmp/storage/framework',
    '/tmp/storage/framework/views',
    '/tmp/storage/framework/cache',
    '/tmp/storage/framework/cache/data',
    '/tmp/storage/framework/sessions',
    '/tmp/storage/logs',
    '/tmp/storage/app',
    '/tmp/bootstrap',
    '/tmp/bootstrap/cache',
];

foreach ($tmpDirs as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
}

// Set environment path untuk compiler blade view Laravel & bootstrap cache
putenv("VIEW_COMPILED_PATH=/tmp/storage/framework/views");
putenv("APP_CONFIG_CACHE=/tmp/bootstrap/cache/config.php");
putenv("APP_EVENTS_CACHE=/tmp/bootstrap/cache/events.php");
putenv("APP_PACKAGES_CACHE=/tmp/bootstrap/cache/packages.php");
putenv("APP_ROUTES_CACHE=/tmp/bootstrap/cache/routes.php");
putenv("APP_SERVICES_CACHE=/tmp/bootstrap/cache/services.php");

$_ENV['VIEW_COMPILED_PATH'] = "/tmp/storage/framework/views";
$_SERVER['VIEW_COMPILED_PATH'] = "/tmp/storage/framework/views";

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
