<?php

namespace App\Controllers\Api;

use App\Models\RsvpSubmissionModel;
use App\Services\GuestPassService;
use App\Services\RsvpReportService;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\I18n\Time;

class AdminGuestController extends ApiController
{
    public function options(...$params): ResponseInterface
    {
        return $this->jsonOptions();
    }

    public function dashboard(): ResponseInterface
    {
        $admin = $this->authenticateAdmin();
        if ($admin instanceof ResponseInterface) {
            return $admin;
        }

        $service = new RsvpReportService();

        return $this->withCors(
            $this->response->setJSON([
                'summary' => $service->getAdminSummary(),
                'records' => $service->getAdminRecords([
                    'search' => (string) $this->request->getGet('search'),
                    'attending' => (string) $this->request->getGet('attending'),
                    'event' => (string) $this->request->getGet('event'),
                ]),
                'generatedAt' => Time::now('Asia/Jakarta'),
            ]),
        );
    }

    public function index(): ResponseInterface
    {
        $admin = $this->authenticateAdmin();
        if ($admin instanceof ResponseInterface) {
            return $admin;
        }

        return $this->withCors(
            $this->response->setJSON([
                'records' => (new RsvpReportService())->getAdminRecords([
                    'search' => (string) $this->request->getGet('search'),
                    'attending' => (string) $this->request->getGet('attending'),
                    'event' => (string) $this->request->getGet('event'),
                ]),
            ]),
        );
    }

    public function show(int $id): ResponseInterface
    {
        $admin = $this->authenticateAdmin();
        if ($admin instanceof ResponseInterface) {
            return $admin;
        }

        $record = (new RsvpReportService())->getAdminRecordById($id);
        if ($record === null) {
            return $this->withCors(
                $this->response
                    ->setStatusCode(404)
                    ->setJSON([
                        'message' => 'Guest record not found.',
                    ]),
            );
        }

        return $this->withCors($this->response->setJSON($record));
    }

    public function manualCheckIn(): ResponseInterface
    {
        $admin = $this->authenticateAdmin();
        if ($admin instanceof ResponseInterface) {
            return $admin;
        }

        $payload = $this->request->getJSON(true);
        if (! is_array($payload) || $payload === []) {
            $payload = $this->request->getPost();
        }

        $id = (int) ($payload['id'] ?? 0);
        $eventKey = trim((string) ($payload['eventKey'] ?? ''));

        return $this->handleCheckInByRecordId($id, $eventKey, (string) ($admin['sub'] ?? 'admin'), 'manual');
    }

    public function scanCheckIn(): ResponseInterface
    {
        $admin = $this->authenticateAdmin();
        if ($admin instanceof ResponseInterface) {
            return $admin;
        }

        $payload = $this->request->getJSON(true);
        if (! is_array($payload) || $payload === []) {
            $payload = $this->request->getPost();
        }

        $eventKey = trim((string) ($payload['eventKey'] ?? ''));
        $scannedValue = trim((string) ($payload['scannedValue'] ?? ''));
        $token = $this->extractTokenFromScan($scannedValue);

        if ($eventKey === '' || $token === '') {
            return $this->withCors(
                $this->response
                    ->setStatusCode(422)
                    ->setJSON([
                        'message' => 'Scan data or event selection is invalid.',
                    ]),
            );
        }

        $model = new RsvpSubmissionModel();
        $record = $model->where('qr_token', $token)->first();
        if (! is_array($record)) {
            return $this->withCors(
                $this->response
                    ->setStatusCode(404)
                    ->setJSON([
                        'message' => 'QR code was not recognized.',
                    ]),
            );
        }

        return $this->handleCheckInByRecordId(
            (int) $record['id'],
            $eventKey,
            (string) ($admin['sub'] ?? 'admin'),
            'qr',
        );
    }

    private function handleCheckInByRecordId(int $id, string $eventKey, string $adminUsername, string $method): ResponseInterface
    {
        $eventKey = $this->normalizeEventKey($eventKey);
        if ($id < 1 || $eventKey === '') {
            return $this->withCors(
                $this->response
                    ->setStatusCode(422)
                    ->setJSON([
                        'message' => 'Invalid guest record or event.',
                    ]),
            );
        }

        $model = new RsvpSubmissionModel();
        $record = $model->find($id);

        if (! is_array($record)) {
            return $this->withCors(
                $this->response
                    ->setStatusCode(404)
                    ->setJSON([
                        'message' => 'Guest record not found.',
                    ]),
            );
        }

        if ((string) ($record['attending'] ?? 'no') !== 'yes') {
            return $this->withCors(
                $this->response
                    ->setStatusCode(422)
                    ->setJSON([
                        'message' => 'This guest marked themselves as unable to attend.',
                    ]),
            );
        }

        $selectedEvents = (new GuestPassService())->parseEvents($record['events'] ?? null);
        $selectedEventKeys = array_map(
            static fn (string $event): string => $event === 'Holy Matrimony' ? 'holy_matrimony' : 'syukuran',
            $selectedEvents,
        );

        if (! in_array($eventKey, $selectedEventKeys, true)) {
            return $this->withCors(
                $this->response
                    ->setStatusCode(422)
                    ->setJSON([
                        'message' => 'This guest did not RSVP for the selected event.',
                    ]),
            );
        }

        $time = Time::now('Asia/Jakarta')->toDateTimeString();
        $timeField = $eventKey . '_checked_in_at';
        $userField = $eventKey . '_checked_in_by';

        if (! empty($record[$timeField])) {
            return $this->withCors(
                $this->response
                    ->setStatusCode(409)
                    ->setJSON([
                        'message' => 'This QR has already been used for ' . $this->formatEventLabel($eventKey) . '.',
                        'record' => (new RsvpReportService())->getAdminRecordById((int) $record['id']),
                    ]),
            );
        }

        $model->update((int) $record['id'], [
            $timeField => $time,
            $userField => $adminUsername . ' (' . $method . ')',
            'last_check_in_at' => $time,
        ]);

        return $this->withCors(
            $this->response->setJSON([
                'message' => 'Check-in successful for ' . $this->formatEventLabel($eventKey) . '.',
                'record' => (new RsvpReportService())->getAdminRecordById((int) $record['id']),
            ]),
        );
    }

    private function extractTokenFromScan(string $value): string
    {
        if ($value === '') {
            return '';
        }

        $parsedUrl = parse_url($value);
        if (is_array($parsedUrl) && isset($parsedUrl['query'])) {
            parse_str($parsedUrl['query'], $params);
            if (is_string($params['token'] ?? null) && trim($params['token']) !== '') {
                return trim($params['token']);
            }
        }

        if (preg_match('/token=([a-f0-9]+)/i', $value, $matches) === 1) {
            return strtolower($matches[1]);
        }

        if (preg_match('/^[a-f0-9]{40}$/i', $value) === 1) {
            return strtolower($value);
        }

        return '';
    }

    private function normalizeEventKey(string $value): string
    {
        return in_array($value, ['holy_matrimony', 'syukuran'], true) ? $value : '';
    }

    private function formatEventLabel(string $eventKey): string
    {
        return $eventKey === 'holy_matrimony' ? 'Holy Matrimony' : 'Lunch Celebration';
    }
}
