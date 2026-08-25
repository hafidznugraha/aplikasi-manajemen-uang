<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use HasFactory;

    protected $table = 'transactions';

    protected $fillable = [
        'user_id',
        'budget_id',
        'type',
        'fund_source',
        'is_system',
        'category_id',
        'subcategory_id',
        'date',
        'description',
        'amount',
        'receipt_url',
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'integer',
        'is_system' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function budget(): BelongsTo
    {
        return $this->belongsTo(Budget::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function subcategory(): BelongsTo
    {
        return $this->belongsTo(Subcategory::class);
    }

    /* Accessors & Helpers */
    public function getHasReceiptAttribute(): bool
    {
        return !empty($this->receipt_url);
    }

    public function getFormattedDateShortAttribute(): string
    {
        return $this->date ? Carbon::parse($this->date)->format('d/m/Y') : '-';
    }

    public function getFormattedDateLongAttribute(): string
    {
        return $this->date ? Carbon::parse($this->date)->translatedFormat('d F Y') : '-';
    }

    public function getFormattedAmountAttribute(): string
    {
        return 'Rp ' . number_format($this->amount, 0, ',', '.');
    }
}