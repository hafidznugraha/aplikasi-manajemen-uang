<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SupabaseStorageService
{
    protected string $supabaseUrl;
    protected string $secretKey;
    protected string $bucket;

    public function __construct()
    {
        $this->supabaseUrl = rtrim(env('SUPABASE_URL', ''), '/');
        $this->secretKey = env('SUPABASE_SECRET_KEY', '');
        $this->bucket = env('SUPABASE_STORAGE_BUCKET', 'receipts');
    }

    /**
     * Pastikan bucket public 'receipts' sudah ada di Supabase
     */
    public function ensureBucketExists(): bool
    {
        if (empty($this->supabaseUrl) || empty($this->secretKey)) {
            return false;
        }

        try {
            // Cek daftar bucket
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'apikey' => $this->secretKey,
            ])->get("{$this->supabaseUrl}/storage/v1/bucket");

            if ($response->successful()) {
                $buckets = $response->json();
                foreach ($buckets as $b) {
                    if (($b['id'] ?? '') === $this->bucket) {
                        return true;
                    }
                }
            }

            // Jika belum ada, buat bucket baru dengan akses public
            $createResponse = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'apikey' => $this->secretKey,
                'Content-Type' => 'application/json',
            ])->post("{$this->supabaseUrl}/storage/v1/bucket", [
                'id' => $this->bucket,
                'name' => $this->bucket,
                'public' => true,
            ]);

            return $createResponse->successful();
        } catch (\Throwable $e) {
            Log::error('Supabase ensureBucketExists error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Upload file struk ke Supabase Storage
     * 
     * @param UploadedFile|string $file UploadedFile instance atau base64/binary string
     * @param string|null $customFilename
     * @return string|null Public URL file struk
     */
    public function uploadReceipt($file, ?string $customFilename = null): ?string
    {
        if (empty($this->supabaseUrl) || empty($this->secretKey)) {
            return null;
        }

        $this->ensureBucketExists();

        try {
            if ($file instanceof UploadedFile) {
                $extension = $file->getClientOriginalExtension() ?: 'jpg';
                $filename = $customFilename ?: 'receipt_' . time() . '_' . uniqid() . '.' . $extension;
                $fileContents = file_get_contents($file->getRealPath());
                $mimeType = $file->getMimeType() ?: 'image/jpeg';
            } elseif (is_string($file)) {
                // Base64 string handling jika dikirim dalam bentuk data URI
                if (preg_match('/^data:image\/(\w+);base64,/', $file, $matches)) {
                    $extension = $matches[1];
                    $file = substr($file, strpos($file, ',') + 1);
                    $fileContents = base64_decode($file);
                    $mimeType = 'image/' . $extension;
                    $filename = $customFilename ?: 'receipt_' . time() . '_' . uniqid() . '.' . $extension;
                } else {
                    $fileContents = $file;
                    $filename = $customFilename ?: 'receipt_' . time() . '_' . uniqid() . '.jpg';
                    $mimeType = 'image/jpeg';
                }
            } else {
                return null;
            }

            $uploadUrl = "{$this->supabaseUrl}/storage/v1/object/{$this->bucket}/{$filename}";

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'apikey' => $this->secretKey,
                'Content-Type' => $mimeType,
                'x-upsert' => 'true',
            ])->withBody($fileContents, $mimeType)->post($uploadUrl);

            if ($response->successful()) {
                return "{$this->supabaseUrl}/storage/v1/object/public/{$this->bucket}/{$filename}";
            }

            Log::error('Supabase upload failed: ' . $response->body());
            return null;
        } catch (\Throwable $e) {
            Log::error('Supabase uploadReceipt exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Hapus file struk dari Supabase Storage
     */
    public function deleteReceipt(string $urlOrPath): bool
    {
        if (empty($this->supabaseUrl) || empty($this->secretKey)) {
            return false;
        }

        try {
            $filename = basename(parse_url($urlOrPath, PHP_URL_PATH));

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'apikey' => $this->secretKey,
                'Content-Type' => 'application/json',
            ])->delete("{$this->supabaseUrl}/storage/v1/object/{$this->bucket}", [
                'prefixes' => [$filename],
            ]);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::error('Supabase deleteReceipt exception: ' . $e->getMessage());
            return false;
        }
    }
}
