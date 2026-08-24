<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasFactory;

    protected $table = 'categories';

    protected $fillable = [
        'budget_id',
        'name',
        'budget_amount',
    ];

    protected $casts = [
        'budget_amount' => 'integer',
    ];

    public function budget(): BelongsTo
    {
        return $this->belongsTo(Budget::class);
    }

    public function subcategories(): HasMany
    {
        return $this->hasMany(Subcategory::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /* Accessors & Helpers */
    public function getTotalSpentAttribute(): int
    {
        return (int) $this->transactions()->sum('amount');
    }

    public function getRemainingBudgetAttribute(): int
    {
        return (int) ($this->budget_amount - $this->total_spent);
    }

    public function getSpendingPercentageAttribute(): int
    {
        if ($this->budget_amount <= 0) {
            return $this->total_spent > 0 ? 100 : 0;
        }

        return (int) round(($this->total_spent / $this->budget_amount) * 100);
    }

    public function getProgressColorClassAttribute(): string
    {
        $pct = $this->spending_percentage;
        if ($pct <= 60) return 'bg-safe';
        if ($pct <= 90) return 'bg-caution';
        return 'bg-over';
    }

    public function getFormattedBudgetAttribute(): string
    {
        return 'Rp ' . number_format($this->budget_amount, 0, ',', '.');
    }
}