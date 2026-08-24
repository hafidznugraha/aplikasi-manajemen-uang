<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();

// Arahkan storage path ke /tmp/storage saat berjalan di serverless Vercel
if (isset($_ENV['VERCEL']) || isset($_SERVER['VERCEL']) || (is_dir('/tmp') && is_writable('/tmp'))) {
    $storagePath = '/tmp/storage';
    $subDirs = [
        $storagePath,
        $storagePath . '/framework',
        $storagePath . '/framework/views',
        $storagePath . '/framework/cache',
        $storagePath . '/framework/cache/data',
        $storagePath . '/framework/sessions',
        $storagePath . '/logs',
        $storagePath . '/app',
    ];
    foreach ($subDirs as $dir) {
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
    }
    $app->useStoragePath($storagePath);
}

return $app;
