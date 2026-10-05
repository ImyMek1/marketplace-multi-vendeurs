<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role?->name === 'client';
    }

    public function rules(): array
    {
        return [
            'address_id' => [
                'required',
                'integer',
                Rule::exists('addresses', 'id')
                    ->where(fn ($query) => $query->where(
                        'user_id',
                        $this->user()->id
                    )),
            ],

            'coupon_code' => [
                'nullable',
                'string',
                'max:100',
            ],
        ];
    }
}
