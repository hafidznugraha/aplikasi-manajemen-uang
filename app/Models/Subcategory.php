<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subcategory extends Model
{
    use HasFactory;

    protected $table = 'subcategories';

    protected $fillable = [
        'category_id',
        'name',
        'budget_amount',
    ];

    protected $casts = [
        'budget_amount' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
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

    public function getFormattedBudgetAttribute(): string
    {
        return 'Rp ' . number_format($this->budget_amount, 0, ',', '.');
    }
}