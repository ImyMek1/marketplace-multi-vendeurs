<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAddressRequest;
use App\Http\Requests\UpdateAddressRequest;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()
                ->addresses()
                ->latest()
                ->get(),
        ]);
    }

    public function store(StoreAddressRequest $request): JsonResponse
    {
        $address = $request->user()
            ->addresses()
            ->create($request->validated());

        return response()->json([
            'message' => 'Address created successfully.',
            'data' => $address,
        ], 201);
    }

    public function update(
        UpdateAddressRequest $request,
        Address $address
    ): JsonResponse {
        if ($address->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Forbidden.',
            ], 403);
        }

        $address->update($request->validated());

        return response()->json([
            'message' => 'Address updated successfully.',
            'data' => $address->fresh(),
        ]);
    }

    public function destroy(
        Request $request,
        Address $address
    ): JsonResponse {
        if ($address->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Forbidden.',
            ], 403);
        }

        $address->delete();

        return response()->json([
            'message' => 'Address deleted successfully.',
        ]);
    }
}
