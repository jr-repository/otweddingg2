<?php

namespace App\Services;

use App\Models\RsvpSubmissionModel;

class GuestPassService
{
    public function ensureIdentifiers(array $record): array
    {
        return [
            'guest_code' => trim((string) ($record['guest_code'] ?? '')) !== ''
                ? (string) $record['guest_code']
                : $this->generateGuestCode(),
            'qr_token' => trim((string) ($record['qr_token'] ?? '')) !== ''
                ? (string) $record['qr_token']
                : $this->generateQrToken(),
        ];
    }

    public function buildPassUrl(array $record): string
    {
        $frontendUrl = rtrim((string) env('app.frontendUrl', 'http://localhost:5173'), '/');
        $guestCode = (string) ($record['guest_code'] ?? '');
        $qrToken = (string) ($record['qr_token'] ?? '');

        return $frontendUrl . '/guest-pass/' . rawurlencode($guestCode) . '?token=' . rawurlencode($qrToken);
    }

    public function buildQrPayload(array $record): string
    {
        return $this->buildPassUrl($record);
    }

    public function buildQrDataUrl(array $record): string
    {
        return (new QrCodeService())->createDataUrl($this->buildQrPayload($record));
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getPublicGuestPass(string $guestCode, string $token): ?array
    {
        $guestCode = trim($guestCode);
        $token = trim($token);
        if ($guestCode === '' || $token === '') {
            return null;
        }

        $record = (new RsvpSubmissionModel())
            ->where('guest_code', $guestCode)
            ->where('qr_token', $token)
            ->first();

        if (! is_array($record)) {
            return null;
        }

        $events = $this->parseEvents($record['events'] ?? null);
        $fullName = trim(trim((string) ($record['first_name'] ?? '')) . ' ' . trim((string) ($record['last_name'] ?? '')));

        return [
            'guestCode' => (string) $record['guest_code'],
            'fullName' => $fullName !== '' ? $fullName : 'Guest',
            'firstName' => trim((string) ($record['first_name'] ?? '')) ?: 'Guest',
            'attending' => (string) ($record['attending'] ?? 'no'),
            'attendingLabel' => (string) ($record['attending'] ?? 'no') === 'yes' ? 'Attending' : 'Unable to Attend',
            'guestsLabel' => ($record['guests'] ?? null) !== null
                ? (string) $record['guests'] . ' Guest' . ((int) $record['guests'] > 1 ? 's' : '')
                : '-',
            'events' => $events,
            'eventsLabel' => $events !== [] ? implode(', ', $events) : 'No event selected',
            'dateLabel' => '23 - 24 April 2027',
            'locationLabel' => 'Jakarta, Indonesia',
            'passUrl' => $this->buildPassUrl($record),
            'qrPayload' => $this->buildQrPayload($record),
            'qrCodeDataUrl' => $this->buildQrDataUrl($record),
        ];
    }

    /**
     * @param mixed $events
     * @return list<string>
     */
    public function parseEvents(mixed $events): array
    {
        if (! is_string($events) || trim($events) === '') {
            return [];
        }

        $decoded = json_decode($events, true);
        if (! is_array($decoded)) {
            return [];
        }

        $mapped = [];
        foreach ($decoded as $event) {
            $mapped[] = match ((string) $event) {
                'holy_matrimony' => 'Holy Matrimony',
                'syukuran' => 'Syukuran',
                default => '',
            };
        }

        return array_values(array_filter($mapped, static fn (string $value): bool => $value !== ''));
    }

    private function generateGuestCode(): string
    {
        return 'LNA-' . strtoupper(substr(bin2hex(random_bytes(5)), 0, 10));
    }

    private function generateQrToken(): string
    {
        return bin2hex(random_bytes(20));
    }
}
