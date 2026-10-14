<?php

namespace App\Http\Requests;

use App\Models\Product;
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
        $product = $this->route('product');

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
                Rule::exists('shops', 'id')->where(
                    function ($query) use ($user) {
                        if ($user?->role?->name === 'seller') {
                            $query->where(
                                'seller_id',
                                $user->id
                            );
                        }

                        $query->where('status', 'active');
                    }
                ),
            ],

            'category_id' => [
                'sometimes',
                'integer',
                Rule::exists('categories', 'id')
                    ->where(
                        fn ($query) => $query->where(
                            'status',
                            'active'
                        )
                    ),
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

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if (!$this->filled('promotional_price')) {
                return;
            }

            $product = $this->route('product');

            if (!$product instanceof Product) {
                return;
            }

            $price = $this->input(
                'price',
                $product->price
            );

            if ((float) $this->input('promotional_price') >= (float) $price) {
                $validator->errors()->add(
                    'promotional_price',
                    'The promotional price must be lower than the regular price.'
                );
            }
        });
    }
}