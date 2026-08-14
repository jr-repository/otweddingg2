<?php

namespace App\Controllers\Api;

use App\Models\RsvpSubmissionModel;
use App\Services\PhotoboothCaptureService;
use App\Services\PhotoboothStorageService;
use CodeIgniter\HTTP\ResponseInterface;

class AdminPhotoboothController extends ApiController
{
    public function options(): ResponseInterface
    {
        return $this->jsonOptions();
    }

    public function index(): ResponseInterface
    {
        $admin = $this->authenticateAdmin();
        if ($admin instanceof ResponseInterface) {
            return $admin;
        }

        return $this->withCors(
            $this->response->setJSON([
                'records' => (new PhotoboothCaptureService())->getCaptures([
                    'search' => (string) $this->request->getGet('search'),
                    'event' => (string) $this->request->getGet('event'),
                ]),
            ]),
        );
    }

    public function store(): ResponseInterface
    {
        $admin = $this->authenticateAdmin();
        if ($admin instanceof ResponseInterface) {
            return $admin;
        }

        $payload = $this->request->getJSON(true);
        if (! is_array($payload) || $payload === []) {
            $payload = $this->request->getPost();
        }

        $guestId = (int) ($payload['guestId'] ?? 0);
        if ($guestId < 1) {
            return $this->withCors(
                $this->response
                    ->setStatusCode(422)
                    ->setJSON(['message' => 'Photobooth guest record is required.']),
            );
        }

        $guest = (new RsvpSubmissionModel())->find($guestId);
        if (! is_array($guest)) {
            return $this->withCors(
                $this->response
                    ->setStatusCode(404)
                    ->setJSON(['message' => 'Guest record for photobooth was not found.']),
            );
        }

        try {
            $result = (new PhotoboothStorageService())->saveCapture(
                $guest,
                $payload,
                (string) ($admin['sub'] ?? 'admin'),
            );
        } catch (\Throwable $exception) {
            return $this->withCors(
                $this->response
                    ->setStatusCode(422)
                    ->setJSON([
                        'message' => $exception->getMessage() !== ''
                            ? $exception->getMessage()
                            : 'Photobooth capture could not be saved.',
                    ]),
            );
        }

        return $this->withCors(
            $this->response
                ->setStatusCode(201)
                ->setJSON([
                    'message' => 'Photobooth capture saved successfully.',
                    ...$result,
                ]),
        );
    }
}
