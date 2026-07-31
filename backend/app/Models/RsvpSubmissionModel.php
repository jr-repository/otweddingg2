<?php

namespace App\Models;

use CodeIgniter\Model;

class RsvpSubmissionModel extends Model
{
    protected $table            = 'RsvpSubmissions';
    protected $primaryKey       = 'id';
    protected $returnType       = 'array';
    protected $useAutoIncrement = true;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'first_name',
        'last_name',
        'phone',
        'email',
        'attending',
        'guests',
        'events',
        'guest_code',
        'qr_token',
        'holy_matrimony_checked_in_at',
        'holy_matrimony_checked_in_by',
        'syukuran_checked_in_at',
        'syukuran_checked_in_by',
        'last_check_in_at',
        'submitted_at',
        'ip_address',
        'user_agent',
    ];

    protected bool $allowEmptyInserts = false;
    protected bool $updateOnlyChanged = true;

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected array $casts = [
        'id'     => 'integer',
        'guests' => '?integer',
    ];
}
