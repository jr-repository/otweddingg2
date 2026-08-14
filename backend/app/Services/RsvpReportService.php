<?php

namespace App\Services;

use App\Models\RsvpSubmissionModel;
use CodeIgniter\I18n\Time;

class RsvpReportService
{
    public function __construct(private readonly ?RsvpSubmissionModel $model = null)
    {
    }

    public function getDashboardPayload(): array
    {
        $records = $this->getModel()->orderBy('submitted_at', 'DESC')->findAll();

        return [
            'summary'     => $this->buildSummary($records),
            'records'     => $this->transformRecords($records),
            'generatedAt' => Time::now('Asia/Jakarta'),
        ];
    }

    /**
     * @param array<string, string> $filters
     */
    public function getAdminRecords(array $filters = []): array
    {
        $builder = $this->getModel()->builder();
        $builder->orderBy('submitted_at', 'DESC');
        $search = trim((string) ($filters['search'] ?? ''));
        $attending = trim((string) ($filters['attending'] ?? ''));
        $event = trim((string) ($filters['event'] ?? ''));

        if ($search !== '') {
            $builder
                ->groupStart()
                ->like('first_name', $search)
                ->orLike('last_name', $search)
                ->orLike('email', $search)
                ->orLike('phone', $search)
                ->orLike('guest_code', $search)
                ->groupEnd();
        }

        if (in_array($attending, ['yes', 'no'], true)) {
            $builder->where('attending', $attending);
        }

        if (in_array($event, ['holy_matrimony', 'syukuran'], true)) {
            $builder->like('events', '"' . $event . '"');
        }

        return $this->transformRecords($builder->get()->getResultArray());
    }

    public function getAdminSummary(): array
    {
        return $this->buildSummary(
            $this->getModel()->orderBy('submitted_at', 'DESC')->findAll(),
        );
    }

    public function getAdminRecordById(int $id): ?array
    {
        $record = $this->getModel()->find($id);
        if (! is_array($record)) {
            return null;
        }

        $transformed = $this->transformRecords([$record]);

        return $transformed[0] ?? null;
    }

    public function getExportRows(): array
    {
        return $this->transformRecords(
            $this->getModel()->orderBy('submitted_at', 'DESC')->findAll(),
        );
    }

    private function getModel(): RsvpSubmissionModel
    {
        return $this->model ?? new RsvpSubmissionModel();
    }

    /**
     * @param list<array<string, mixed>> $records
     * @return array<string, int|string|null>
     */
    private function buildSummary(array $records): array
    {
        $attendingYes = 0;
        $attendingNo = 0;
        $confirmedSeats = 0;
        $checkedInHolyMatrimony = 0;
        $checkedInSyukuran = 0;
        $fullyCheckedIn = 0;
        $latestSubmittedAt = null;

        foreach ($records as $record) {
            if (($record['attending'] ?? null) === 'yes') {
                $attendingYes++;
                $confirmedSeats += (int) ($record['guests'] ?? 0);
            } else {
                $attendingNo++;
            }

            $holyCheckedIn = ! empty($record['holy_matrimony_checked_in_at']);
            $syukuranCheckedIn = ! empty($record['syukuran_checked_in_at']);

            if ($holyCheckedIn) {
                $checkedInHolyMatrimony++;
            }

            if ($syukuranCheckedIn) {
                $checkedInSyukuran++;
            }

            if ($holyCheckedIn || $syukuranCheckedIn) {
                $fullyCheckedIn++;
            }

            if ($latestSubmittedAt === null && ! empty($record['submitted_at'])) {
                $latestSubmittedAt = $record['submitted_at'];
            }
        }

        return [
            'totalResponses'   => count($records),
            'attendingYes'     => $attendingYes,
            'attendingNo'      => $attendingNo,
            'confirmedSeats'   => $confirmedSeats,
            'checkedInHolyMatrimony' => $checkedInHolyMatrimony,
            'checkedInSyukuran' => $checkedInSyukuran,
            'checkedInGuests' => $fullyCheckedIn,
            'pendingCheckIns' => max(0, $attendingYes - $fullyCheckedIn),
            'latestSubmittedAt' => $latestSubmittedAt !== null
                ? $this->formatDateTime((string) $latestSubmittedAt)
                : null,
        ];
    }

    /**
     * @param list<array<string, mixed>> $records
     * @return list<array<string, mixed>>
     */
    private function transformRecords(array $records): array
    {
        return array_map(function (array $record): array {
            $firstName = trim((string) ($record['first_name'] ?? ''));
            $lastName = trim((string) ($record['last_name'] ?? ''));
            $fullName = trim($firstName . ' ' . $lastName);
            $events = $this->parseEvents($record['events'] ?? null);
            $guestPassService = new GuestPassService();
            $guestPassUrl = trim((string) ($record['guest_code'] ?? '')) !== '' && trim((string) ($record['qr_token'] ?? '')) !== ''
                ? $guestPassService->buildPassUrl($record)
                : '';

            return [
                'id'                => (int) ($record['id'] ?? 0),
                'fullName'          => $fullName !== '' ? $fullName : 'Unknown Guest',
                'firstName'         => $firstName,
                'lastName'          => $lastName,
                'guestCode'         => (string) ($record['guest_code'] ?? ''),
                'phone'             => trim((string) ($record['phone'] ?? '')),
                'email'             => (string) ($record['email'] ?? ''),
                'attending'         => (string) ($record['attending'] ?? 'no'),
                'attendingLabel'    => ($record['attending'] ?? 'no') === 'yes'
                    ? 'Attending'
                    : 'Unable to Attend',
                'guests'            => $record['guests'] !== null ? (int) $record['guests'] : null,
                'guestsLabel'       => $record['guests'] !== null
                    ? (string) $record['guests'] . ' Guest' . ((int) $record['guests'] > 1 ? 's' : '')
                    : '-',
                'events'            => $events,
                'eventsLabel'       => $events !== [] ? implode(', ', $events) : '-',
                'passUrl'           => $guestPassUrl,
                'qrCodeDataUrl'     => $guestPassUrl !== '' ? $guestPassService->buildQrDataUrl($record) : null,
                'submittedAt'       => (string) ($record['submitted_at'] ?? ''),
                'submittedAtLabel'  => $this->formatDateTime((string) ($record['submitted_at'] ?? '')),
                'holyMatrimonyCheckedInAt' => (string) ($record['holy_matrimony_checked_in_at'] ?? ''),
                'holyMatrimonyCheckedInLabel' => ! empty($record['holy_matrimony_checked_in_at'])
                    ? $this->formatDateTime((string) $record['holy_matrimony_checked_in_at'])
                    : 'Pending',
                'holyMatrimonyCheckedInBy' => (string) ($record['holy_matrimony_checked_in_by'] ?? ''),
                'syukuranCheckedInAt' => (string) ($record['syukuran_checked_in_at'] ?? ''),
                'syukuranCheckedInLabel' => ! empty($record['syukuran_checked_in_at'])
                    ? $this->formatDateTime((string) $record['syukuran_checked_in_at'])
                    : 'Pending',
                'syukuranCheckedInBy' => (string) ($record['syukuran_checked_in_by'] ?? ''),
                'lastCheckInAtLabel' => ! empty($record['last_check_in_at'])
                    ? $this->formatDateTime((string) $record['last_check_in_at'])
                    : 'Not checked in yet',
                'createdAt'         => (string) ($record['created_at'] ?? ''),
                'updatedAt'         => (string) ($record['updated_at'] ?? ''),
            ];
        }, $records);
    }

    /**
     * @param mixed $events
     * @return list<string>
     */
    private function parseEvents(mixed $events): array
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
                'syukuran' => 'Lunch Celebration',
                default => '',
            };
        }

        return array_values(array_filter($mapped, static fn (string $value): bool => $value !== ''));
    }

    private function formatDateTime(string $value): string
    {
        if ($value === '') {
            return '-';
        }

        return Time::parse($value, 'Asia/Jakarta')->format('d M Y, H:i');
    }
}
