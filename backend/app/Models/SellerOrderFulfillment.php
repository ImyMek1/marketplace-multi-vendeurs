<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SellerOrderFulfillment extends Model
{
    protected $fillable = [
        'order_id',
        'seller_id',
        'status',
        'confirmed_at',
        'prepared_at',
    ];

    protected function casts(): array
    {
        return [
            'confirmed_at' => 'datetime',
            'prepared_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }
}
