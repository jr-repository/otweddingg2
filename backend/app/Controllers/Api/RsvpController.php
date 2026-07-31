<?php

namespace App\Controllers\Api;

use App\Models\RsvpSubmissionModel;
use App\Services\GuestPassService;
use App\Services\RsvpMailService;
use App\Services\RsvpReportService;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\I18n\Time;

class RsvpController extends ApiController
{
    public function options(): ResponseInterface
    {
        return $this->jsonOptions();
    }

    public function store(): ResponseInterface
    {
        $payload = $this->request->getJSON(true);
        if (! is_array($payload) || $payload === []) {
            $payload = $this->request->getPost();
        }

        $data = [
            'first_name' => trim((string) ($payload['firstName'] ?? '')),
            'last_name'  => trim((string) ($payload['lastName'] ?? '')),
            'phone'      => trim((string) ($payload['phone'] ?? '')),
            'email'      => strtolower(trim((string) ($payload['email'] ?? ''))),
            'attending'  => trim((string) ($payload['attending'] ?? '')),
            'guests'     => $payload['guests'] ?? null,
            'events'     => is_array($payload['events'] ?? null) ? $payload['events'] : [],
        ];

        $validationErrors = $this->validatePayload($data);
        if ($validationErrors !== []) {
            return $this->withCors(
                $this->response
                    ->setStatusCode(422)
                    ->setJSON([
                        'message' => 'Please review the RSVP form.',
                        'errors'  => $validationErrors,
                    ]),
            );
        }

        $data['guests'] = $data['attending'] === 'yes' ? (int) $data['guests'] : null;
        $data['events'] = $data['attending'] === 'yes'
            ? $this->normalizeEvents($data['events'])
            : [];

        $model = new RsvpSubmissionModel();
        $guestPassService = new GuestPassService();
        $now = Time::now('Asia/Jakarta')->toDateTimeString();
        $existing = $model->where('email', $data['email'])->first();
        $identifiers = $guestPassService->ensureIdentifiers(is_array($existing) ? $existing : []);

        $saveData = [
            ...$data,
            ...$identifiers,
            'events'       => $data['events'] !== [] ? json_encode($data['events']) : null,
            'submitted_at' => $now,
            'ip_address'   => $this->request->getIPAddress(),
            'user_agent'   => (string) $this->request->getUserAgent(),
        ];

        if ($existing !== null) {
            $model->update((int) $existing['id'], $saveData);
            $recordId = (int) $existing['id'];
        } else {
            $model->insert($saveData);
            $recordId = (int) $model->getInsertID();
        }

        $savedRecord = $model->find($recordId);
        $mailResult = (new RsvpMailService())->sendInvitationEmail($savedRecord ?? $saveData, $existing !== null);

        $message = $existing !== null
            ? 'Your RSVP has been updated.'
            : 'Your RSVP has been saved.';

        if (! $mailResult['sent']) {
            $message .= ' Your email invitation could not be sent right now.';
        }

        return $this->withCors(
            $this->response
                ->setStatusCode($existing !== null ? 200 : 201)
                ->setJSON([
                    'message'   => $message,
                    'emailSent' => $mailResult['sent'],
                    'guestPass' => $savedRecord !== null ? [
                        'guestCode' => (string) ($savedRecord['guest_code'] ?? ''),
                        'passUrl' => $guestPassService->buildPassUrl($savedRecord),
                        'qrCodeDataUrl' => $guestPassService->buildQrDataUrl($savedRecord),
                    ] : null,
                ]),
        );
    }

    public function index(): ResponseInterface
    {
        $payload = (new RsvpReportService())->getDashboardPayload();

        return $this->withCors($this->response->setJSON($payload));
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, string>
     */
    private function validatePayload(array $data): array
    {
        $errors = [];

        if ($data['first_name'] === '') {
            $errors['firstName'] = 'Please enter your first name.';
        }

        if ($data['last_name'] === '') {
            $errors['lastName'] = 'Please enter your last name.';
        }

        if ($data['email'] === '' || ! filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Please enter a valid email address.';
        }

        if (! in_array($data['attending'], ['yes', 'no'], true)) {
            $errors['attending'] = 'Please let us know if you can attend.';
        }

        if ($data['phone'] === '') {
            $errors['phone'] = 'Please enter your WhatsApp number.';
        } elseif (strlen(preg_replace('/\D+/', '', $data['phone']) ?? '') < 6) {
            $errors['phone'] = 'Please enter a valid phone number.';
        }

        if ($data['attending'] === 'yes' && ! in_array((string) $data['guests'], ['1', '2'], true)) {
            $errors['guests'] = 'Please select how many guests.';
        }

        if ($data['attending'] === 'yes' && $this->normalizeEvents($data['events'] ?? []) === []) {
            $errors['events'] = 'Please choose at least one event.';
        }

        return $errors;
    }

    /**
     * @param mixed $events
     * @return list<string>
     */
    private function normalizeEvents(mixed $events): array
    {
        if (! is_array($events)) {
            return [];
        }

        $allowed = ['holy_matrimony', 'syukuran'];
        $normalized = [];

        foreach ($events as $event) {
            $value = trim((string) $event);
            if ($value !== '' && in_array($value, $allowed, true) && ! in_array($value, $normalized, true)) {
                $normalized[] = $value;
            }
        }

        return $normalized;
    }
}
