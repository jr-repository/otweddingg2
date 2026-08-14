<?php

namespace App\Models;

use CodeIgniter\Model;

class PhotoboothCaptureModel extends Model
{
    protected $table            = 'PhotoboothCaptures';
    protected $primaryKey       = 'id';
    protected $returnType       = 'array';
    protected $useAutoIncrement = true;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'rsvp_submission_id',
        'guest_code',
        'guest_name',
        'event_key',
        'layout_mode',
        'shot_count',
        'filter_id',
        'effect_id',
        'frame_id',
        'beauty_level',
        'settings_json',
        'shot_paths_json',
        'final_image_path',
        'created_by',
        'captured_at',
    ];

    protected bool $allowEmptyInserts = false;
    protected bool $updateOnlyChanged = true;

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected array $casts = [
        'id' => 'integer',
        'rsvp_submission_id' => 'integer',
        'shot_count' => 'integer',
        'beauty_level' => 'integer',
    ];
}
