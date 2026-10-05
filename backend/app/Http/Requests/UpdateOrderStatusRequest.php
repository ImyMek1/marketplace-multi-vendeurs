<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->user()?->role?->name;

        if ($role === 'admin') {
            return true;
        }

        if ($role !== 'seller') {
            return false;
        }

        $order = $this->route('order');
        $status = $this->input('status');

        if (!$order) {
            return false;
        }

        return match ($order->status) {
            'pending' => $status === 'confirmed',
            'confirmed' => $status === 'prepared',
            default => false,
        };
    }

    public function rules(): array
    {
        $role = $this->user()?->role?->name;

        if ($role === 'admin') {
            return [
                'status' => [
                    'required',
                    'string',
                    Rule::in([
                        'confirmed',
                        'prepared',
                        'shipped',
                        'delivered',
                        'cancelled',
                    ]),
                ],
            ];
        }

        return [
            'status' => [
                'required',
                'string',
                Rule::in([
                    'confirmed',
                    'prepared',
                ]),
            ],
        ];
    }
}
