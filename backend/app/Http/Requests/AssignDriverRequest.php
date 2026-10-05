<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssignDriverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role?->name === 'admin';
    }

    public function rules(): array
    {
        return [
            'driver_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')
                    ->where(function ($query) {
                        $query
                            ->whereHas('role', function ($roleQuery) {
                                $roleQuery->where('name', 'driver');
                            })
                            ->where('status', 'active');
                    }),
            ],
        ];
    }
}
