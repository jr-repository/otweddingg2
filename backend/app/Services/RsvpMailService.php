<?php

namespace App\Services;

use PHPMailer\PHPMailer\Exception as MailException;
use PHPMailer\PHPMailer\PHPMailer;

class RsvpMailService
{
    /**
     * @param array<string, mixed> $rsvp
     * @return array{sent: bool, error: string|null}
     */
    public function sendInvitationEmail(array $rsvp, bool $isUpdate = false): array
    {
        $to = strtolower(trim((string) ($rsvp['email'] ?? '')));
        if ($to === '') {
            return [
                'sent'  => false,
                'error' => 'Missing recipient email address.',
            ];
        }

        $templateData = $this->buildTemplateData($rsvp, $isUpdate);
        $subject = $this->buildSubject($isUpdate);
        $config = $this->getConfig();

        $logContext = [
            'to' => $to,
            'subject' => $subject,
            'smtp_host' => $config['host'] ?? '',
            'smtp_port' => $config['port'] ?? '',
            'smtp_crypto' => $config['secure'] ?? '',
            'smtp_user' => $config['username'] ?? '',
            'from_email' => $config['fromEmail'] ?? '',
            'from_name' => $config['fromName'] ?? '',
            'mail_type' => 'html',
        ];

        log_message(
            'info',
            'RSVP email attempt: ' . json_encode($logContext, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        );

        try {
            $mailer = new PHPMailer(true);
            $mailer->isSMTP();
            $mailer->Host = (string) $config['host'];
            $mailer->SMTPAuth = true;
            $mailer->Username = (string) $config['username'];
            $mailer->Password = (string) $config['password'];
            $mailer->Port = (int) $config['port'];
            $mailer->SMTPSecure = (string) $config['secure'];
            $mailer->CharSet = 'UTF-8';
            $mailer->WordWrap = (int) ($config['wordWrap'] ? 76 : 0);
            $mailer->Timeout = 20;
            $mailer->setFrom(
                (string) $config['fromEmail'],
                (string) $config['fromName'],
            );
            $mailer->addAddress($to);
            $mailer->Subject = $subject;
            $mailer->isHTML(true);
            $mailer->Body = view('Emails/RsvpInvitation', $templateData);
            $mailer->AltBody = $this->buildPlainTextMessage($templateData);

            $mailer->send();

            log_message(
                'info',
                'RSVP email sent: ' . json_encode($logContext, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            );

            return [
                'sent'  => true,
                'error' => null,
            ];
        } catch (MailException $exception) {
            $error = $exception->getMessage();
            log_message(
                'error',
                'RSVP email failed: '
                . json_encode($logContext, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                . ' Error: '
                . $error,
            );

            return [
                'sent'  => false,
                'error' => $error !== '' ? $error : 'Unknown email delivery error.',
            ];
        } catch (\Throwable $exception) {
            log_message(
                'error',
                'RSVP email exception: '
                . json_encode($logContext, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                . ' Exception: '
                . $exception->getMessage(),
            );

            return [
                'sent'  => false,
                'error' => $exception->getMessage(),
            ];
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function getConfig(): array
    {
        return [
            'host'      => (string) env('email.SMTPHost', 'smtp.hostinger.com'),
            'username'  => (string) env('email.SMTPUser', ''),
            'password'  => preg_replace('/\s+/', '', (string) env('email.SMTPPass', '')) ?? '',
            'port'      => (int) env('email.SMTPPort', 587),
            'secure'    => strtolower((string) env('email.SMTPCrypto', 'tls')),
            'charset'   => (string) env('email.charset', 'UTF-8'),
            'wordWrap'  => filter_var((string) env('email.wordWrap', 'true'), FILTER_VALIDATE_BOOLEAN),
            'fromEmail' => (string) env('email.fromEmail', ''),
            'fromName'  => (string) env('email.fromName', 'Notification Email'),
        ];
    }

    private function buildSubject(bool $isUpdate): string
    {
        return $isUpdate
            ? 'RSVP Update'
            : 'RSVP Confirmation';
    }

    private function normalizeNewline(string $value): string
    {
        return str_replace(['\r', '\n'], ["\r", "\n"], $value);
    }

    private function getLineBreak(): string
    {
        return $this->normalizeNewline((string) env('email.newline', '\r\n'));
    }

    /**
     * @param array<string, mixed> $rsvp
     * @return array<string, mixed>
     */
    private function buildTemplateData(array $rsvp, bool $isUpdate): array
    {
        $firstName = trim((string) ($rsvp['first_name'] ?? ''));
        $lastName = trim((string) ($rsvp['last_name'] ?? ''));
        $fullName = trim($firstName . ' ' . $lastName);
        $attending = (string) ($rsvp['attending'] ?? 'no');
        $guestCount = $attending === 'yes' ? max(1, (int) ($rsvp['guests'] ?? 1)) : null;
        $guestPassService = new GuestPassService();
        $events = $guestPassService->parseEvents($rsvp['events'] ?? null);
        $buttonUrl = trim((string) ($rsvp['guest_code'] ?? '')) !== '' && trim((string) ($rsvp['qr_token'] ?? '')) !== ''
            ? $guestPassService->buildPassUrl($rsvp)
            : rtrim((string) env('app.frontendUrl', 'http://localhost:5173'), '/') . '/#rsvp';
        $guestCode = (string) ($rsvp['guest_code'] ?? '');
        $qrCodeDataUrl = $guestCode !== '' && trim((string) ($rsvp['qr_token'] ?? '')) !== ''
            ? $guestPassService->buildQrDataUrl($rsvp)
            : '';

        return [
            'fullName'         => $fullName !== '' ? $fullName : 'Dear Guest',
            'firstName'        => $firstName !== '' ? $firstName : 'Dear Guest',
            'guestCode'        => $guestCode,
            'isUpdate'         => $isUpdate,
            'attending'        => $attending,
            'attendanceLabel'  => $attending === 'yes' ? 'Attending' : 'Unable to attend',
            'guestCountLabel'  => $guestCount !== null ? $guestCount . ' guest' . ($guestCount > 1 ? 's' : '') : 'Not attending',
            'events'           => $events,
            'eventsLabel'      => implode(', ', $events) ?: '-',
            'dateLabel'        => '23 - 24 April 2027',
            'locationLabel'    => 'Jakarta, Indonesia',
            'buttonUrl'        => $buttonUrl,
            'buttonLabel'      => 'Open Guest Pass',
            'qrCodeDataUrl'    => $qrCodeDataUrl,
            'submittedLabel'   => $isUpdate
                ? 'This email confirms that your RSVP details have been updated successfully.'
                : 'This email confirms that your RSVP has been received successfully.',
        ];
    }

    /**
     * @param array<string, mixed> $data
     */
    private function buildPlainTextMessage(array $data): string
    {
        $newline = $this->getLineBreak();
        $firstName = trim((string) ($data['firstName'] ?? 'Guest'));
        $submittedLabel = trim((string) ($data['submittedLabel'] ?? ''));
        $attendanceLabel = trim((string) ($data['attendanceLabel'] ?? ''));
        $guestCountLabel = trim((string) ($data['guestCountLabel'] ?? ''));
        $eventsLabel = trim((string) ($data['eventsLabel'] ?? ''));
        $dateLabel = trim((string) ($data['dateLabel'] ?? ''));
        $locationLabel = trim((string) ($data['locationLabel'] ?? ''));
        $buttonUrl = trim((string) ($data['buttonUrl'] ?? ''));
        $guestCode = trim((string) ($data['guestCode'] ?? ''));

        return 'RSVP Confirmation'
            . $newline . $newline
            . 'Dear ' . $firstName . ','
            . $newline . $newline
            . $submittedLabel
            . $newline . $newline
            . 'Guest Code: ' . $guestCode
            . $newline
            . 'Response: ' . $attendanceLabel
            . $newline
            . 'Events: ' . $eventsLabel
            . $newline
            . 'Guests: ' . $guestCountLabel
            . $newline
            . 'Date: ' . $dateLabel
            . $newline
            . 'Location: ' . $locationLabel
            . $newline . $newline
            . 'Guest pass link: ' . $buttonUrl
            . $newline . $newline
            . 'Thank you.'
            . $newline
            . 'Luis Meraz and Angel Mayjesty';
    }
}
