<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function __construct(
        private AuditLogService $auditLogService
    ) {
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
            $clientRole = Role::where('name', 'client')->firstOrFail();

            $user = User::create([
                'role_id' => $clientRole->id,
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'status' => 'active',
            ]);

            $this->auditLogService->create(
                $user,
                'account_registered',
                $user,
                "User account {$user->email} was registered.",
                $request->ip()
            );

            return $user;
        });

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Account created successfully.',
            'user' => $user->load('role'),
            'token' => $token,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::with('role')
            ->where('email', $request->email)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Your account is suspended.',
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        $this->auditLogService->create(
            $user,
            'login',
            $user,
            "User {$user->email} logged in successfully.",
            $request->ip()
        );

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        $this->auditLogService->create(
            $user,
            'logout',
            $user,
            "User {$user->email} logged out.",
            $request->ip()
        );

        $user->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logout successful.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('role'),
        ]);
    }

    public function forgotPassword(
        ForgotPasswordRequest $request
    ): JsonResponse {
        $user = User::where('email', $request->email)->first();

        if ($user) {
            $token = Str::random(64);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                [
                    'token' => Hash::make($token),
                    'created_at' => now(),
                ]
            );

            $this->auditLogService->create(
                $user,
                'password_reset_requested',
                $user,
                "Password reset was requested for {$user->email}.",
                $request->ip()
            );

            /*
             * The reset token must be delivered through a secure channel
             * such as email. It must never be returned in the API response.
             */
        }

        return response()->json([
            'message' => 'If the email exists, a password reset link will be sent.',
        ]);
    }

    public function resetPassword(
        ResetPasswordRequest $request
    ): JsonResponse {
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (
            !$resetRecord ||
            !Hash::check($request->token, $resetRecord->token)
        ) {
            return response()->json([
                'message' => 'Invalid or expired reset token.',
            ], 422);
        }

        if (
            !$resetRecord->created_at ||
            now()->diffInMinutes($resetRecord->created_at) > 60
        ) {
            DB::table('password_reset_tokens')
                ->where('email', $request->email)
                ->delete();

            return response()->json([
                'message' => 'Invalid or expired reset token.',
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Invalid or expired reset token.',
            ], 422);
        }

        DB::transaction(function () use ($user, $request) {
            $user->update([
                'password' => Hash::make($request->password),
            ]);

            DB::table('password_reset_tokens')
                ->where('email', $user->email)
                ->delete();

            $user->tokens()->delete();

            $this->auditLogService->create(
                $user,
                'password_reset',
                $user,
                "Password was reset successfully for {$user->email}.",
                $request->ip()
            );
        });

        return response()->json([
            'message' => 'Password reset successfully.',
        ]);
    }
}
