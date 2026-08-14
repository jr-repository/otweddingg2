<?php

namespace App\Services;

use App\Models\PhotoboothCaptureModel;
use CodeIgniter\I18n\Time;
use Config\App;

class PhotoboothCaptureService
{
    public function __construct(private readonly ?PhotoboothCaptureModel $model = null)
    {
    }

    /**
     * @param array<string, string> $filters
     * @return list<array<string, mixed>>
     */
    public function getCaptures(array $filters = []): array
    {
        $builder = $this->getModel()->builder();
        $builder->orderBy('captured_at', 'DESC');

        $search = trim((string) ($filters['search'] ?? ''));
        $event = trim((string) ($filters['event'] ?? ''));

        if ($search !== '') {
            $builder
                ->groupStart()
                ->like('guest_name', $search)
                ->orLike('guest_code', $search)
                ->groupEnd();
        }

        if (in_array($event, ['holy_matrimony', 'syukuran'], true)) {
            $builder->where('event_key', $event);
        }

        return $this->transformRows($builder->get()->getResultArray());
    }

    private function getModel(): PhotoboothCaptureModel
    {
        return $this->model ?? new PhotoboothCaptureModel();
    }

    /**
     * @param list<array<string, mixed>> $rows
     * @return list<array<string, mixed>>
     */
    private function transformRows(array $rows): array
    {
        return array_map(function (array $row): array {
            $shotPaths = json_decode((string) ($row['shot_paths_json'] ?? '[]'), true);
            $shotPaths = is_array($shotPaths) ? $shotPaths : [];

            return [
                'id' => (int) ($row['id'] ?? 0),
                'guestId' => (int) ($row['rsvp_submission_id'] ?? 0),
                'guestCode' => trim((string) ($row['guest_code'] ?? '')),
                'guestName' => trim((string) ($row['guest_name'] ?? '')) !== ''
                    ? trim((string) ($row['guest_name'] ?? ''))
                    : 'Guest',
                'eventKey' => (string) ($row['event_key'] ?? ''),
                'eventLabel' => $this->formatEventLabel((string) ($row['event_key'] ?? '')),
                'layoutMode' => (string) ($row['layout_mode'] ?? ''),
                'shotCount' => (int) ($row['shot_count'] ?? 0),
                'filterId' => (string) ($row['filter_id'] ?? ''),
                'effectId' => (string) ($row['effect_id'] ?? ''),
                'frameId' => (string) ($row['frame_id'] ?? ''),
                'beautyLevel' => (int) ($row['beauty_level'] ?? 0),
                'capturedAt' => (string) ($row['captured_at'] ?? ''),
                'capturedAtLabel' => $this->formatDateTime((string) ($row['captured_at'] ?? '')),
                'finalImageUrl' => $this->buildPublicUrl((string) ($row['final_image_path'] ?? '')),
                'shotUrls' => array_values(array_filter(array_map(
                    fn ($path): string => is_string($path) ? $this->buildPublicUrl($path) : '',
                    $shotPaths,
                ))),
                'createdBy' => (string) ($row['created_by'] ?? ''),
            ];
        }, $rows);
    }

    private function formatEventLabel(string $eventKey): string
    {
        return $eventKey === 'holy_matrimony' ? 'Holy Matrimony' : 'Lunch Celebration';
    }

    private function formatDateTime(string $value): string
    {
        if ($value === '') {
            return '-';
        }

        return Time::parse($value, 'Asia/Jakarta')->format('d M Y, H:i');
    }

    private function buildPublicUrl(string $relativePath): string
    {
        if (trim($relativePath) === '') {
            return '';
        }

        /** @var App $appConfig */
        $appConfig = config(App::class);
        $baseUrl = rtrim((string) $appConfig->baseURL, '/');

        return $baseUrl . '/' . ltrim(str_replace(DIRECTORY_SEPARATOR, '/', $relativePath), '/');
    }
}
