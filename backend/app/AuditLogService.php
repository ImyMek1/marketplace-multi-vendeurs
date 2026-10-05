<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AuditLogService
{
    public function create(
        User $user,
        string $action,
        Model $entity,
        string $description,
        ?string $ipAddress = null
    ): AuditLog {
        return AuditLog::create([
            'user_id' => $user->id,
            'action' => $action,
            'entity_type' => $entity->getMorphClass(),
            'entity_id' => $entity->getKey(),
            'description' => $description,
            'ip_address' => $ipAddress,
            'created_at' => now(),
        ]);
    }
}