<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array(
            $this->user()?->role?->name,
            ['admin', 'seller'],
            true
        );
    }

    public function rules(): array
    {
        $role = $this->user()?->role?->name;

        return [
            'status' => [
                'required',
                'string',
                Rule::in(
                    $role === 'admin'
                        ? [
                            'confirmed',
                            'prepared',
                            'shipped',
                            'delivered',
                            'cancelled',
                        ]
                        : [
                            'confirmed',
                            'prepared',
                        ]
                ),
            ],
        ];
    }
}