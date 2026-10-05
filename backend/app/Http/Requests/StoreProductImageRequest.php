<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductImageRequest extends FormRequest
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
            'images' => [
                'required',
                'array',
                'min:1',
                'max:10',
            ],

            'images.*' => [
                'bail',
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

            'primary_index' => [
                'nullable',
                'integer',
                'min:0',
                Rule::when(
                    $this->has('images'),
                    Rule::in(
                        array_keys($this->input('images', []))
                    )
                ),
            ],
        ];
    }
}