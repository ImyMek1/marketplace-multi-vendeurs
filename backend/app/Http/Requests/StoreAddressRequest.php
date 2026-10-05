<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role?->name === 'client';
    }

    public function rules(): array
    {
        return [
            'label' => [
                'required',
                'string',
                'max:100',
                'regex:/.*\S.*/',
            ],

            'recipient_name' => [
                'required',
                'string',
                'max:150',
                'regex:/.*\S.*/',
            ],

            'phone' => [
                'required',
                'string',
                'max:30',
                'regex:/^\+?[0-9\s().-]{7,30}$/',
            ],

            'address_line' => [
                'required',
                'string',
                'max:500',
                'regex:/.*\S.*/',
            ],

            'city' => [
                'required',
                'string',
                'max:100',
                'regex:/.*\S.*/',
            ],

            'postal_code' => [
                'nullable',
                'string',
                'max:20',
            ],

            'additional_info' => [
                'nullable',
                'string',
                'max:500',
            ],
        ];
    }
}
