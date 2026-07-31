<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddEventsToRsvpSubmissions extends Migration
{
    public function up(): void
    {
        if (! $this->db->fieldExists('events', 'RsvpSubmissions')) {
            $this->forge->addColumn('RsvpSubmissions', [
                'events' => [
                    'type' => 'TEXT',
                    'null' => true,
                    'after' => 'guests',
                ],
            ]);
        }
    }

    public function down(): void
    {
        if ($this->db->fieldExists('events', 'RsvpSubmissions')) {
            $this->forge->dropColumn('RsvpSubmissions', 'events');
        }
    }
}
