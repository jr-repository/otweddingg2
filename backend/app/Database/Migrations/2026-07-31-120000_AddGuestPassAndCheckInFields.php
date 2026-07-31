<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddGuestPassAndCheckInFields extends Migration
{
    public function up(): void
    {
        $table = 'RsvpSubmissions';

        $fields = [];

        if (! $this->db->fieldExists('guest_code', $table)) {
            $fields['guest_code'] = [
                'type' => 'VARCHAR',
                'constraint' => 32,
                'null' => true,
                'after' => 'events',
            ];
        }

        if (! $this->db->fieldExists('qr_token', $table)) {
            $fields['qr_token'] = [
                'type' => 'VARCHAR',
                'constraint' => 64,
                'null' => true,
                'after' => 'guest_code',
            ];
        }

        if (! $this->db->fieldExists('holy_matrimony_checked_in_at', $table)) {
            $fields['holy_matrimony_checked_in_at'] = [
                'type' => 'DATETIME',
                'null' => true,
                'after' => 'qr_token',
            ];
        }

        if (! $this->db->fieldExists('holy_matrimony_checked_in_by', $table)) {
            $fields['holy_matrimony_checked_in_by'] = [
                'type' => 'VARCHAR',
                'constraint' => 120,
                'null' => true,
                'after' => 'holy_matrimony_checked_in_at',
            ];
        }

        if (! $this->db->fieldExists('syukuran_checked_in_at', $table)) {
            $fields['syukuran_checked_in_at'] = [
                'type' => 'DATETIME',
                'null' => true,
                'after' => 'holy_matrimony_checked_in_by',
            ];
        }

        if (! $this->db->fieldExists('syukuran_checked_in_by', $table)) {
            $fields['syukuran_checked_in_by'] = [
                'type' => 'VARCHAR',
                'constraint' => 120,
                'null' => true,
                'after' => 'syukuran_checked_in_at',
            ];
        }

        if (! $this->db->fieldExists('last_check_in_at', $table)) {
            $fields['last_check_in_at'] = [
                'type' => 'DATETIME',
                'null' => true,
                'after' => 'syukuran_checked_in_by',
            ];
        }

        if ($fields !== []) {
            $this->forge->addColumn($table, $fields);
        }

        $records = $this->db->table($table)->get()->getResultArray();
        foreach ($records as $record) {
            $updates = [];

            if (empty($record['guest_code'])) {
                $updates['guest_code'] = $this->generateGuestCode();
            }

            if (empty($record['qr_token'])) {
                $updates['qr_token'] = bin2hex(random_bytes(20));
            }

            if ($updates !== []) {
                $this->db->table($table)->where('id', $record['id'])->update($updates);
            }
        }

        $this->createUniqueIndexIfMissing($table, 'guest_code_unique', 'guest_code');
        $this->createUniqueIndexIfMissing($table, 'qr_token_unique', 'qr_token');
    }

    public function down(): void
    {
        $table = 'RsvpSubmissions';

        foreach ([
            'last_check_in_at',
            'syukuran_checked_in_by',
            'syukuran_checked_in_at',
            'holy_matrimony_checked_in_by',
            'holy_matrimony_checked_in_at',
            'qr_token',
            'guest_code',
        ] as $column) {
            if ($this->db->fieldExists($column, $table)) {
                $this->forge->dropColumn($table, $column);
            }
        }
    }

    private function createUniqueIndexIfMissing(string $table, string $indexName, string $column): void
    {
        $result = $this->db->query("SHOW INDEX FROM `{$table}` WHERE Key_name = " . $this->db->escape($indexName));
        if ($result->getNumRows() === 0) {
            $this->db->query("ALTER TABLE `{$table}` ADD UNIQUE KEY `{$indexName}` (`{$column}`)");
        }
    }

    private function generateGuestCode(): string
    {
        return 'LNA-' . strtoupper(substr(bin2hex(random_bytes(5)), 0, 10));
    }
}
