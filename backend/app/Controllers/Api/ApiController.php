<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Services\AdminAuthService;
use CodeIgniter\HTTP\ResponseInterface;

abstract class ApiController extends BaseController
{
    protected function withCors(ResponseInterface $response): ResponseInterface
    {
        $origin = (string) env('app.frontendUrl', '');
        if ($origin === '') {
            $origin = $this->request->getHeaderLine('Origin') ?: '*';
        }

        return $response
            ->setHeader('Access-Control-Allow-Origin', $origin)
            ->setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            ->setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Authorization')
            ->setHeader('Vary', 'Origin');
    }

    protected function jsonOptions(): ResponseInterface
    {
        return $this->withCors($this->response->setStatusCode(204));
    }

    /**
     * @return array<string, mixed>|ResponseInterface
     */
    protected function authenticateAdmin(): array|ResponseInterface
    {
        $token = $this->extractBearerToken();
        $payload = (new AdminAuthService())->validateToken($token);

        if ($payload === null) {
            return $this->withCors(
                $this->response
                    ->setStatusCode(401)
                    ->setJSON([
                        'message' => 'Your admin session is invalid or has expired.',
                    ]),
            );
        }

        return $payload;
    }

    protected function extractBearerToken(): string
    {
        $header = trim($this->request->getHeaderLine('Authorization'));
        if ($header === '') {
            return '';
        }

        if (preg_match('/^Bearer\s+(.+)$/i', $header, $matches) === 1) {
            return trim($matches[1]);
        }

        return '';
    }
}
