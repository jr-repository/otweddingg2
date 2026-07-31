<?php

namespace App\Controllers\Api;

use App\Services\AdminAuthService;
use CodeIgniter\HTTP\ResponseInterface;

class AdminAuthController extends ApiController
{
    public function options(): ResponseInterface
    {
        return $this->jsonOptions();
    }

    public function login(): ResponseInterface
    {
        $payload = $this->request->getJSON(true);
        if (! is_array($payload) || $payload === []) {
            $payload = $this->request->getPost();
        }

        $username = trim((string) ($payload['username'] ?? ''));
        $password = (string) ($payload['password'] ?? '');

        $token = (new AdminAuthService())->attempt($username, $password);
        if ($token === null) {
            return $this->withCors(
                $this->response
                    ->setStatusCode(401)
                    ->setJSON([
                        'message' => 'Invalid admin credentials.',
                    ]),
            );
        }

        return $this->withCors(
            $this->response->setJSON([
                'message' => 'Login successful.',
                'token' => $token,
                'user' => [
                    'username' => $username,
                    'displayName' => 'Wedding Administrator',
                ],
            ]),
        );
    }

    public function me(): ResponseInterface
    {
        $admin = $this->authenticateAdmin();
        if ($admin instanceof ResponseInterface) {
            return $admin;
        }

        return $this->withCors(
            $this->response->setJSON([
                'user' => [
                    'username' => (string) ($admin['sub'] ?? 'admin'),
                    'displayName' => 'Wedding Administrator',
                ],
            ]),
        );
    }
}
