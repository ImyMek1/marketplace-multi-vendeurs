<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role?->name === 'admin';
    }

    public function rules(): array
    {
        $couponId = $this->route('coupon')?->id ?? $this->route('coupon');

        return [
            'code' => [
                'required',
                'string',
                'max:100',
                'regex:/^[A-Za-z0-9_-]+$/',
                Rule::unique('coupons', 'code')->ignore($couponId),
            ],

            'type' => [
                'required',
                'string',
                Rule::in([
                    'fixed',
                    'percentage',
                ]),
            ],

            'value' => [
                'required',
                'numeric',
                'gt:0',
            ],

            'starts_at' => [
                'required',
                'date',
            ],

            'ends_at' => [
                'required',
                'date',
                'after:starts_at',
            ],

            'minimum_order' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'maximum_uses' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'status' => [
                'required',
                'string',
                Rule::in([
                    'active',
                    'inactive',
                ]),
            ],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $type = $this->input('type');
            $value = $this->input('value');

            if ($type === 'percentage' && $value > 100) {
                $validator->errors()->add(
                    'value',
                    'The percentage value cannot exceed 100.'
                );
            }
        });
    }
}