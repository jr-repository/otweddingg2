<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePhotoboothCaptures extends Migration
{
    public function up(): void
    {
        if ($this->db->tableExists('PhotoboothCaptures')) {
            return;
        }

        $this->forge->addField([
            'id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'rsvp_submission_id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
            ],
            'guest_code' => [
                'type' => 'VARCHAR',
                'constraint' => 32,
            ],
            'guest_name' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'event_key' => [
                'type' => 'VARCHAR',
                'constraint' => 64,
            ],
            'layout_mode' => [
                'type' => 'VARCHAR',
                'constraint' => 32,
                'default' => 'strip-3',
            ],
            'shot_count' => [
                'type' => 'TINYINT',
                'unsigned' => true,
                'default' => 3,
            ],
            'filter_id' => [
                'type' => 'VARCHAR',
                'constraint' => 80,
                'default' => 'original',
            ],
            'effect_id' => [
                'type' => 'VARCHAR',
                'constraint' => 80,
                'default' => 'none',
            ],
            'frame_id' => [
                'type' => 'VARCHAR',
                'constraint' => 80,
                'default' => 'polaroid',
            ],
            'beauty_level' => [
                'type' => 'TINYINT',
                'unsigned' => true,
                'default' => 30,
            ],
            'settings_json' => [
                'type' => 'LONGTEXT',
                'null' => true,
            ],
            'shot_paths_json' => [
                'type' => 'LONGTEXT',
                'null' => true,
            ],
            'final_image_path' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
            ],
            'created_by' => [
                'type' => 'VARCHAR',
                'constraint' => 120,
                'null' => true,
            ],
            'captured_at' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addKey('rsvp_submission_id');
        $this->forge->addKey('guest_code');
        $this->forge->addKey('event_key');
        $this->forge->addKey('captured_at');
        $this->forge->createTable('PhotoboothCaptures', true);
    }

    public function down(): void
    {
        $this->forge->dropTable('PhotoboothCaptures', true);
    }
}
