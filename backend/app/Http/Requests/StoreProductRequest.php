<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
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
        return [
            'shop_id' => [
                'required',
                'integer',
                'exists:shops,id',
                Rule::exists('shops', 'id')->where(function ($query) {
                    if ($this->user()?->role?->name === 'seller') {
                        $query->where('seller_id', $this->user()->id);
                    }

                    $query->where('status', 'active');
                }),
            ],

            'category_id' => [
                'required',
                'integer',
                Rule::exists('categories', 'id')
                    ->where(fn ($query) => $query->where('status', 'active')),
            ],

            'name' => [
                'required',
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
                'required',
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
                'required',
                'integer',
                'min:0',
            ],

            'alert_threshold' => [
                'sometimes',
                'integer',
                'min:0',
            ],

            'status' => [
                'sometimes',
                Rule::in([
                    'draft',
                    'pending',
                ]),
            ],
        ];
    }
}
