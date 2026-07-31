<?php

namespace App\Services;

use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\RoundBlockSizeMode;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\Writer\Result\ResultInterface;

class QrCodeService
{
    public function createDataUrl(string $payload): string
    {
        return $this->buildResult($payload)->getDataUri();
    }

    public function createPngBinary(string $payload): string
    {
        return $this->buildResult($payload)->getString();
    }

    private function buildResult(string $payload): ResultInterface
    {
        return (new Builder(
            writer: new PngWriter(),
            data: $payload,
            encoding: new Encoding('UTF-8'),
            errorCorrectionLevel: ErrorCorrectionLevel::Medium,
            size: 640,
            margin: 16,
            roundBlockSizeMode: RoundBlockSizeMode::Margin,
        ))->build();
    }
}
