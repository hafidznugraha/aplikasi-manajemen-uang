<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Budget extends Model
{
    use HasFactory;

    protected $table = 'budgets';

    protected $fillable = [
        'user_id',
        'month',
        'total_budget',
    ];

    protected $casts = [
        'total_budget' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
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

    public function getTotalAllocatedAttribute(): int
    {
        return (int) $this->categories()->sum('budget_amount');
    }

    public function getRemainingBudgetAttribute(): int
    {
        return (int) ($this->total_budget - $this->total_spent);
    }

    public function getFormattedMonthAttribute(): string
    {
        return Carbon::parse($this->month . '-01')->translatedFormat('F Y');
    }

    public function getFormattedTotalBudgetAttribute(): string
    {
        return 'Rp ' . number_format($this->total_budget, 0, ',', '.');
    }
}