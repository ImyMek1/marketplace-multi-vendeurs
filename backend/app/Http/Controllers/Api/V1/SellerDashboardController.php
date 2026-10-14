<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\SellerDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SellerDashboardController extends Controller
{
    public function __construct(
        private SellerDashboardService $sellerDashboardService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $dashboard = $this->sellerDashboardService->getDashboard(
            $request->user()
        );

        return response()->json([
            'data' => $dashboard,
        ]);
    }
}