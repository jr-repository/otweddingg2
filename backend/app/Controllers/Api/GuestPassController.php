<?php

namespace App\Controllers\Api;

use App\Services\GuestPassService;
use CodeIgniter\HTTP\ResponseInterface;

class GuestPassController extends ApiController
{
    public function show(string $guestCode): ResponseInterface
    {
        $token = trim((string) $this->request->getGet('token'));
        $payload = (new GuestPassService())->getPublicGuestPass($guestCode, $token);

        if ($payload === null) {
            return $this->withCors(
                $this->response
                    ->setStatusCode(404)
                    ->setJSON([
                        'message' => 'Guest pass not found or no longer valid.',
                    ]),
            );
        }

        return $this->withCors($this->response->setJSON($payload));
    }
}
