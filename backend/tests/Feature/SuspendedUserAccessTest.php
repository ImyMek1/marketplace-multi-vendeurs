<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SuspendedUserAccessTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->nullable()->constrained('roles');
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('status', ['active', 'suspended'])->default('active');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('action');
            $table->string('entity_type');
            $table->unsignedBigInteger('entity_id');
            $table->text('description');
            $table->string('ip_address')->nullable();
            $table->timestamp('created_at')->nullable();
        });
    }

    public function test_active_user_can_access_protected_api(): void
    {
        $user = $this->makeUser('client', 'active', 'active@example.test');
        $token = $user->createToken('test-token')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('user.id', $user->id);
    }

    public function test_public_registration_ignores_privileged_role_input(): void
    {
        Role::firstOrCreate(['name' => 'client']);

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'New Customer',
            'email' => 'new-customer@example.test',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'admin',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.role.name', 'client')
            ->assertJsonStructure(['user' => ['id'], 'token']);

        $this->assertDatabaseHas('users', [
            'email' => 'new-customer@example.test',
            'role_id' => Role::where('name', 'client')->value('id'),
        ]);
    }

    public function test_suspended_user_cannot_login_or_obtain_a_token(): void
    {
        $user = $this->makeUser('client', 'suspended', 'suspended@example.test');

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertForbidden()
            ->assertJsonPath('message', 'Your account is suspended.');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_suspended_user_existing_token_is_rejected(): void
    {
        $user = $this->makeUser('client', 'active', 'existing-token@example.test');
        $token = $user->createToken('test-token')->plainTextToken;
        $user->status = 'suspended';
        $user->save();

        $this->withToken($token)
            ->getJson('/api/v1/auth/me')
            ->assertForbidden()
            ->assertJsonPath('message', 'Your account is suspended.');
    }

    public function test_admin_suspension_revokes_all_existing_tokens(): void
    {
        $admin = $this->makeUser('admin', 'active', 'admin@example.test');
        $adminToken = $admin->createToken('admin-token')->plainTextToken;
        $user = $this->makeUser('seller', 'active', 'seller@example.test');
        $userToken = $user->createToken('first-token')->plainTextToken;
        $user->createToken('second-token');

        $this->withToken($adminToken)
            ->patchJson("/api/v1/admin/users/{$user->id}/status", [
                'status' => 'suspended',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'suspended');

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_type' => $user->getMorphClass(),
            'tokenable_id' => $user->id,
        ]);

        Auth::forgetGuards();
        $this->withToken($userToken)
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }

    public function test_reactivated_user_can_login_and_access_api_with_new_token(): void
    {
        $admin = $this->makeUser('admin', 'active', 'reactivation-admin@example.test');
        $adminToken = $admin->createToken('admin-token')->plainTextToken;
        $user = $this->makeUser('client', 'active', 'reactivated@example.test');
        $oldToken = $user->createToken('old-token')->plainTextToken;

        $this->withToken($adminToken)
            ->patchJson("/api/v1/admin/users/{$user->id}/status", [
                'status' => 'suspended',
            ])
            ->assertOk();

        Auth::forgetGuards();
        $this->withToken($adminToken)
            ->patchJson("/api/v1/admin/users/{$user->id}/status", [
                'status' => 'active',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'active');

        Auth::forgetGuards();
        $this->withToken($oldToken)
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk();

        Auth::forgetGuards();
        $this->withToken($login->json('token'))
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('user.id', $user->id);
    }

    private function makeUser(string $roleName, string $status, string $email): User
    {
        $role = Role::firstOrCreate(['name' => $roleName]);

        $user = User::create([
            'role_id' => $role->id,
            'name' => ucfirst($roleName),
            'email' => $email,
            'password' => Hash::make('password'),
        ]);
        $user->status = $status;
        $user->save();

        return $user;
    }
}
