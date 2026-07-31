<?php

namespace App\Services;

class AdminAuthService
{
    public function attempt(string $username, string $password): ?string
    {
        $configuredUsername = trim((string) env('admin.username', 'admin'));
        $configuredPassword = (string) env('admin.password', 'LNA2027Admin!');

        if (
            ! hash_equals($configuredUsername, trim($username))
            || ! hash_equals($configuredPassword, $password)
        ) {
            return null;
        }

        return $this->createToken($configuredUsername);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function validateToken(string $token): ?array
    {
        if ($token === '') {
            return null;
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$encodedHeader, $encodedPayload, $signature] = $parts;
        $expectedSignature = $this->base64UrlEncode(
            hash_hmac('sha256', $encodedHeader . '.' . $encodedPayload, $this->getSecret(), true),
        );

        if (! hash_equals($expectedSignature, $signature)) {
            return null;
        }

        $payload = json_decode($this->base64UrlDecode($encodedPayload), true);
        if (! is_array($payload)) {
            return null;
        }

        $expiresAt = (int) ($payload['exp'] ?? 0);
        $subject = (string) ($payload['sub'] ?? '');

        if ($subject === '' || $expiresAt < time()) {
            return null;
        }

        return $payload;
    }

    private function createToken(string $username): string
    {
        $header = $this->base64UrlEncode((string) json_encode([
            'alg' => 'HS256',
            'typ' => 'JWT',
        ]));
        $payload = $this->base64UrlEncode((string) json_encode([
            'sub' => $username,
            'exp' => time() + (int) env('admin.tokenTtl', 43200),
        ]));
        $signature = $this->base64UrlEncode(
            hash_hmac('sha256', $header . '.' . $payload, $this->getSecret(), true),
        );

        return $header . '.' . $payload . '.' . $signature;
    }

    private function getSecret(): string
    {
        $secret = (string) env('admin.tokenSecret', '');
        if ($secret !== '') {
            return $secret;
        }

        $fallback = (string) env('encryption.key', '');
        if ($fallback !== '') {
            return $fallback;
        }

        return 'otweddingg-admin-token-secret';
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string
    {
        $padding = strlen($value) % 4;
        if ($padding > 0) {
            $value .= str_repeat('=', 4 - $padding);
        }

        return (string) base64_decode(strtr($value, '-_', '+/'));
    }
}
