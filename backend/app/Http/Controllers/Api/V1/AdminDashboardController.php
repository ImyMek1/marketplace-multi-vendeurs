<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AdminDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function __construct(
        private readonly AdminDashboardService $adminDashboardService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $dashboard = $this->adminDashboardService->getDashboard(
            $request->user()
        );

        return response()->json(
            [
                'data' => $dashboard,
            ],
            200,
            [],
            JSON_PRESERVE_ZERO_FRACTION,
        );
    }
}
