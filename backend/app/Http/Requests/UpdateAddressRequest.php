<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role?->name === 'client';
    }

    public function rules(): array
    {
        return [
            'label' => [
                'sometimes',
                'string',
                'max:100',
                'regex:/.*\S.*/',
            ],

            'recipient_name' => [
                'sometimes',
                'string',
                'max:150',
                'regex:/.*\S.*/',
            ],

            'phone' => [
                'sometimes',
                'string',
                'max:30',
                'regex:/^\+?[0-9\s().-]{7,30}$/',
            ],

            'address_line' => [
                'sometimes',
                'string',
                'max:500',
                'regex:/.*\S.*/',
            ],

            'city' => [
                'sometimes',
                'string',
                'max:100',
                'regex:/.*\S.*/',
            ],

            'postal_code' => [
                'sometimes',
                'nullable',
                'string',
                'max:20',
            ],

            'additional_info' => [
                'sometimes',
                'nullable',
                'string',
                'max:500',
            ],
        ];
    }
}