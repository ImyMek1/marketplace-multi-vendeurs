<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDeliveryStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array(
            $this->user()?->role?->name,
            ['driver', 'admin'],
            true
        );
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                'string',
                Rule::in([
                    'picked_up',
                    'in_transit',
                    'delivered',
                    'failed',
                ]),
            ],

            'note' => [
                'nullable',
                'string',
                'max:1000',
                'required_if:status,failed',
            ],
        ];
    }
}
