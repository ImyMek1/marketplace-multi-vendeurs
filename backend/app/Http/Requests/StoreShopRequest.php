<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreShopRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role?->name === 'seller';
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:200',
                'regex:/.*\S.*/',
            ],

            'description' => [
                'nullable',
                'string',
            ],
        ];
    }
}
