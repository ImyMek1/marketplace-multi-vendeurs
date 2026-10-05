<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateShopRequest extends FormRequest
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
            'name' => [
                'sometimes',
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
