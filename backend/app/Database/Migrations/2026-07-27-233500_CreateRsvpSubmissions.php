<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateRsvpSubmissions extends Migration
{
    public function up(): void
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'BIGINT',
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'first_name' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
            ],
            'last_name' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'null'       => true,
            ],
            'phone' => [
                'type'       => 'VARCHAR',
                'constraint' => 30,
                'null'       => true,
            ],
            'email' => [
                'type'       => 'VARCHAR',
                'constraint' => 190,
            ],
            'attending' => [
                'type'       => 'ENUM',
                'constraint' => ['yes', 'no'],
            ],
            'guests' => [
                'type'       => 'TINYINT',
                'unsigned'   => true,
                'null'       => true,
                'default'    => null,
            ],
            'submitted_at' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
            'ip_address' => [
                'type'       => 'VARCHAR',
                'constraint' => 45,
                'null'       => true,
            ],
            'user_agent' => [
                'type' => 'TEXT',
                'null' => true,
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
        $this->forge->addUniqueKey('email');
        $this->forge->addKey(['attending', 'submitted_at']);
        $this->forge->createTable('RsvpSubmissions', true);
    }

    public function down(): void
    {
        $this->forge->dropTable('RsvpSubmissions', true);
    }
}
