<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array(
            $this->user()?->role?->name,
            ['seller', 'admin'],
            true
        );
    }

    public function rules(): array
    {
        $user = $this->user();

        $statusRules = [
            'sometimes',
            Rule::in([
                'draft',
                'pending',
            ]),
        ];

        if ($user?->role?->name === 'admin') {
            $statusRules = [
                'sometimes',
                Rule::in([
                    'draft',
                    'pending',
                    'approved',
                    'published',
                    'rejected',
                ]),
            ];
        }

        return [
            'shop_id' => [
                'sometimes',
                'integer',
                Rule::exists('shops', 'id')->where(function ($query) use ($user) {
                    if ($user?->role?->name === 'seller') {
                        $query->where('seller_id', $user->id);
                    }

                    $query->where('status', 'active');
                }),
            ],

            'category_id' => [
                'sometimes',
                'integer',
                Rule::exists('categories', 'id')
                    ->where(fn ($query) => $query->where('status', 'active')),
            ],

            'name' => [
                'sometimes',
                'string',
                'max:200',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'brand' => [
                'nullable',
                'string',
                'max:150',
            ],

            'price' => [
                'sometimes',
                'numeric',
                'gt:0',
            ],

            'promotional_price' => [
                'nullable',
                'numeric',
                'gt:0',
                'lt:price',
            ],

            'stock' => [
                'sometimes',
                'integer',
                'min:0',
            ],

            'alert_threshold' => [
                'sometimes',
                'integer',
                'min:0',
            ],

            'status' => $statusRules,
        ];
    }
}
