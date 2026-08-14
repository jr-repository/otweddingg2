<?php

namespace App\Services;

use App\Models\PhotoboothCaptureModel;
use CodeIgniter\I18n\Time;
use Config\App;

class PhotoboothStorageService
{
    /**
     * @param array<string, mixed> $guestRecord
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function saveCapture(array $guestRecord, array $payload, string $adminUsername): array
    {
        $eventKey = trim((string) ($payload['eventKey'] ?? ''));
        if (! in_array($eventKey, ['holy_matrimony', 'syukuran'], true)) {
            throw new \RuntimeException('Photobooth event key is invalid.');
        }

        $shots = is_array($payload['shots'] ?? null) ? $payload['shots'] : [];
        if ($shots === []) {
            throw new \RuntimeException('No photobooth shots were submitted.');
        }

        $finalImage = trim((string) ($payload['finalImageDataUrl'] ?? ''));
        if ($finalImage === '') {
            throw new \RuntimeException('Final photobooth image is required.');
        }

        $guestCode = trim((string) ($guestRecord['guest_code'] ?? ''));
        $guestName = trim(
            trim((string) ($guestRecord['first_name'] ?? ''))
            . ' '
            . trim((string) ($guestRecord['last_name'] ?? '')),
        );
        $guestName = $guestName !== '' ? $guestName : 'Guest';

        $timestamp = Time::now('Asia/Jakarta');
        $captureId = $timestamp->format('Ymd-His') . '-' . bin2hex(random_bytes(3));
        $relativeDir = 'uploads/photobooth/' . $timestamp->format('Y/m') . '/' . $guestCode;
        $absoluteDir = rtrim(FCPATH, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relativeDir);

        if (! is_dir($absoluteDir) && ! mkdir($absoluteDir, 0775, true) && ! is_dir($absoluteDir)) {
            throw new \RuntimeException('Unable to create photobooth storage directory.');
        }

        $savedShots = [];
        foreach ($shots as $index => $shot) {
            $shotDataUrl = is_array($shot) ? trim((string) ($shot['dataUrl'] ?? '')) : '';
            if ($shotDataUrl === '') {
                continue;
            }

            $savedShots[] = $this->writeDataUrl(
                $shotDataUrl,
                $absoluteDir,
                $relativeDir,
                $captureId . '-shot-' . ($index + 1),
            );
        }

        $savedFinal = $this->writeDataUrl(
            $finalImage,
            $absoluteDir,
            $relativeDir,
            $captureId . '-final',
        );

        $settings = [
            'filterId' => trim((string) ($payload['filterId'] ?? 'original')),
            'effectId' => trim((string) ($payload['effectId'] ?? 'none')),
            'frameId' => trim((string) ($payload['frameId'] ?? 'polaroid')),
            'beautyLevel' => (int) ($payload['beautyLevel'] ?? 30),
            'layoutMode' => trim((string) ($payload['layoutMode'] ?? 'strip-3')),
            'weddingLabel' => trim((string) ($payload['weddingLabel'] ?? 'Luis & Angel')),
            'guestLabel' => trim((string) ($payload['guestLabel'] ?? $guestName)),
        ];

        $model = new PhotoboothCaptureModel();
        $model->insert([
            'rsvp_submission_id' => (int) ($guestRecord['id'] ?? 0),
            'guest_code' => $guestCode,
            'guest_name' => $guestName,
            'event_key' => $eventKey,
            'layout_mode' => $settings['layoutMode'],
            'shot_count' => count($savedShots),
            'filter_id' => $settings['filterId'],
            'effect_id' => $settings['effectId'],
            'frame_id' => $settings['frameId'],
            'beauty_level' => $settings['beautyLevel'],
            'settings_json' => json_encode($settings),
            'shot_paths_json' => json_encode(array_column($savedShots, 'path')),
            'final_image_path' => $savedFinal['path'],
            'created_by' => $adminUsername,
            'captured_at' => $timestamp->toDateTimeString(),
        ]);

        $savedRecord = $model->find((int) $model->getInsertID());

        return [
            'capture' => [
                'id' => (int) ($savedRecord['id'] ?? 0),
                'guestId' => (int) ($guestRecord['id'] ?? 0),
                'guestCode' => $guestCode,
                'guestName' => $guestName,
                'eventKey' => $eventKey,
                'layoutMode' => $settings['layoutMode'],
                'shotCount' => count($savedShots),
                'filterId' => $settings['filterId'],
                'effectId' => $settings['effectId'],
                'frameId' => $settings['frameId'],
                'beautyLevel' => $settings['beautyLevel'],
                'capturedAt' => $timestamp->toDateTimeString(),
                'finalImageUrl' => $savedFinal['url'],
                'shotUrls' => array_column($savedShots, 'url'),
            ],
        ];
    }

    /**
     * @return array{path: string, url: string}
     */
    private function writeDataUrl(string $dataUrl, string $absoluteDir, string $relativeDir, string $filenameStem): array
    {
        if (! preg_match('#^data:image/(png|jpeg|jpg);base64,(.+)$#', $dataUrl, $matches)) {
            throw new \RuntimeException('Photobooth image format is invalid.');
        }

        $extension = strtolower($matches[1]) === 'png' ? 'png' : 'jpg';
        $binary = base64_decode($matches[2], true);
        if ($binary === false) {
            throw new \RuntimeException('Photobooth image payload could not be decoded.');
        }

        $relativePath = $relativeDir . '/' . $filenameStem . '.' . $extension;
        $absolutePath = $absoluteDir . DIRECTORY_SEPARATOR . $filenameStem . '.' . $extension;

        if (file_put_contents($absolutePath, $binary) === false) {
            throw new \RuntimeException('Photobooth image could not be written to storage.');
        }

        return [
            'path' => $relativePath,
            'url' => $this->buildPublicUrl($relativePath),
        ];
    }

    private function buildPublicUrl(string $relativePath): string
    {
        /** @var App $appConfig */
        $appConfig = config(App::class);
        $baseUrl = rtrim((string) $appConfig->baseURL, '/');

        return $baseUrl . '/' . ltrim(str_replace(DIRECTORY_SEPARATOR, '/', $relativePath), '/');
    }
}
