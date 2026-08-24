<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

// Deteksi apakah sedang berjalan di lingkungan Serverless Vercel
$isVercel = isset($_ENV['VERCEL']) || isset($_SERVER['VERCEL']) || (is_dir('/tmp') && is_writable('/tmp'));

if ($isVercel) {
    $storagePath = '/tmp/storage';
    $bootstrapPath = '/tmp/bootstrap';
    
    $tmpDirs = [
        $storagePath,
        $storagePath . '/framework',
        $storagePath . '/framework/views',
        $storagePath . '/framework/cache',
        $storagePath . '/framework/cache/data',
        $storagePath . '/framework/sessions',
        $storagePath . '/logs',
        $storagePath . '/app',
        $bootstrapPath,
        $bootstrapPath . '/cache',
    ];
    
    foreach ($tmpDirs as $dir) {
        if (!is_dir($dir)) {
            @mkdir($dir, 0777, true);
        }
    }
}

$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Percayai reverse proxy Vercel untuk membaca header HTTPS & IP
        $middleware->trustProxies(at: '*');

        $middleware->validateCsrfTokens(except: [
            'api/*',
            'login',
            'register',
            'forgot-password',
            'reset-password',
            'api/login',
            'api/register',
            'api/auth/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();

// Arahkan storage dan bootstrap cache path ke /tmp di Vercel
if ($isVercel) {
    $app->useStoragePath('/tmp/storage');
    $app->useBootstrapPath('/tmp/bootstrap');
}

return $app;
