<?php

namespace App\Services;

use App\Models\Coupon;
use Illuminate\Validation\ValidationException;

class CouponService
{
    public function validateCoupon(Coupon $coupon, float $subtotal): Coupon
    {
        if ($coupon->status !== 'active') {
            throw ValidationException::withMessages([
                'coupon_code' => ['This coupon is inactive.'],
            ]);
        }

        if ($coupon->starts_at && now()->lt($coupon->starts_at)) {
            throw ValidationException::withMessages([
                'coupon_code' => ['This coupon is not active yet.'],
            ]);
        }

        if ($coupon->expires_at && now()->gt($coupon->expires_at)) {
            throw ValidationException::withMessages([
                'coupon_code' => ['This coupon has expired.'],
            ]);
        }

        if (
            $coupon->max_usage !== null &&
            $coupon->used_count >= $coupon->max_usage
        ) {
            throw ValidationException::withMessages([
                'coupon_code' => ['This coupon has reached its usage limit.'],
            ]);
        }

        if ($subtotal < $coupon->min_order_amount) {
            throw ValidationException::withMessages([
                'coupon_code' => [
                    "Minimum order amount for this coupon is {$coupon->min_order_amount}.",
                ],
            ]);
        }

        if (
            $coupon->type === 'percentage' &&
            $coupon->value > 100
        ) {
            throw ValidationException::withMessages([
                'coupon_code' => ['Percentage discount cannot exceed 100%.'],
            ]);
        }

        return $coupon;
    }

    public function calculateDiscount(
        Coupon $coupon,
        float $subtotal
    ): float {
        $this->validateCoupon($coupon, $subtotal);

        if ($coupon->type === 'fixed') {
            return min((float) $coupon->value, $subtotal);
        }

        $discount = $subtotal * ((float) $coupon->value / 100);

        return min($discount, $subtotal);
    }

    public function findValidCoupon(
        string $code,
        float $subtotal
    ): Coupon {
        $coupon = Coupon::where('code', $code)->first();

        if (!$coupon) {
            throw ValidationException::withMessages([
                'coupon_code' => ['Invalid coupon code.'],
            ]);
        }

        return $this->validateCoupon($coupon, $subtotal);
    }

    public function incrementUsage(Coupon $coupon): void
    {
        $coupon->increment('used_count');
    }
}