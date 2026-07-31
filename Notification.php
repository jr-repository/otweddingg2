<?php namespace App\Libraries;

use CodeIgniter\Config\Services;

class Notification
{
    protected $emailConfig = [
        'protocol' => 'smtp',
        'SMTPHost' => 'smtp.hostinger.com',
        'SMTPUser' => 'admin@antlia.id',
        'SMTPPass' => '182214Db@AA',
        'SMTPPort' => 465,
        'SMTPCrypto' => 'ssl',
        'mailType' => 'text',
        'charset' => 'iso-8859-1',
        'wordWrap' => true,
        'newline' => "\r\n",
        'fromEmail' => 'admin@antlia.id',
        'fromName' => 'Support',
    ];

    protected $fonnteApiUrl = 'https://api.fonnte.com/send';
    protected $fonnteApiKey = 'EVRYGebAJ7moyPgnYgRx';

    public function sendEmail(string|array $to, string $subject, string $message, array $context = []) : bool
    {
        $email = Services::email();
        $config = $this->emailConfig;
        if (!empty($context['mailType'])) {
            $config['mailType'] = (string) $context['mailType'];
        }
        if (!empty($context['charset'])) {
            $config['charset'] = (string) $context['charset'];
        }

        $email->initialize($config);

        $email->setFrom($config['fromEmail'], $config['fromName']);
        $email->setTo($to);
        $email->setSubject($subject);
        $email->setMessage($message);

        $logContext = [
            'to'          => $to,
            'subject'     => $subject,
            'smtp_host'   => $config['SMTPHost'] ?? '',
            'smtp_port'   => $config['SMTPPort'] ?? '',
            'smtp_crypto' => $config['SMTPCrypto'] ?? '',
            'smtp_user'   => $config['SMTPUser'] ?? '',
            'from_email'  => $config['fromEmail'] ?? '',
            'from_name'   => $config['fromName'] ?? '',
            'mail_type'   => $config['mailType'] ?? '',
            'context'     => $context,
        ];

        log_message('info', 'Email notification attempt: ' . json_encode($logContext, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        
        try {
            if ($email->send()) {
                log_message('info', 'Email notification sent: ' . json_encode($logContext, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
                return true;
            } else {
                log_message('error', 'Email failed to send: ' . json_encode($logContext, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . ' Error: ' . $email->printDebugger(['headers']));
                return false;
            }
        } catch (\Throwable $e) {
            log_message('error', 'Email exception: ' . json_encode($logContext, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . ' Exception: ' . $e->getMessage());
            return false;
        }
    }

    public function sendEmailWithAttachment(string|array $to, string $subject, string $message, string $attachmentPath, string $attachmentName = '', array $context = []) : bool
    {
        if (!is_file($attachmentPath)) {
            log_message('error', 'Email attachment missing: ' . $attachmentPath);
            return false;
        }

        $email = Services::email();
        $config = $this->emailConfig;
        if (!empty($context['mailType'])) {
            $config['mailType'] = (string) $context['mailType'];
        }
        if (!empty($context['charset'])) {
            $config['charset'] = (string) $context['charset'];
        }

        $email->initialize($config);
        $email->setFrom($config['fromEmail'], $config['fromName']);
        $email->setTo($to);
        $email->setSubject($subject);
        $email->setMessage($message);
        $email->attach($attachmentPath, 'attachment', $attachmentName !== '' ? $attachmentName : basename($attachmentPath));

        $logContext = [
            'to'          => $to,
            'subject'     => $subject,
            'attachment'  => $attachmentPath,
            'smtp_host'   => $config['SMTPHost'] ?? '',
            'smtp_port'   => $config['SMTPPort'] ?? '',
            'smtp_crypto' => $config['SMTPCrypto'] ?? '',
            'smtp_user'   => $config['SMTPUser'] ?? '',
            'from_email'  => $config['fromEmail'] ?? '',
            'from_name'   => $config['fromName'] ?? '',
            'mail_type'   => $config['mailType'] ?? '',
            'context'     => $context,
        ];

        log_message('info', 'Email notification with attachment attempt: ' . json_encode($logContext, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        try {
            if ($email->send()) {
                log_message('info', 'Email notification with attachment sent: ' . json_encode($logContext, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
                return true;
            }

            log_message('error', 'Email with attachment failed to send: ' . json_encode($logContext, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . ' Error: ' . $email->printDebugger(['headers']));
            return false;
        } catch (\Throwable $e) {
            log_message('error', 'Email with attachment exception: ' . json_encode($logContext, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . ' Exception: ' . $e->getMessage());
            return false;
        }
    }

    public function sendWhatsapp(string $toPhone, string $message) : bool
    {
        $toPhone = preg_replace('/[^0-9]/', '', $toPhone);
        if (substr($toPhone, 0, 1) === '0') {
            $toPhone = '62' . substr($toPhone, 1);
        } elseif (substr($toPhone, 0, 2) !== '62') {
            $toPhone = '62' . $toPhone;
        }
        
        $data = [
            'target' => $toPhone,
            'message' => $message,
            'countryCode' => '62',
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->fonnteApiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: ' . $this->fonnteApiKey,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $result = json_decode($response, true);

        if ($httpCode === 200 && (isset($result['status']) && $result['status'] === true)) {
            log_message('info', 'WhatsApp notification sent to: ' . $toPhone . ' Response: ' . $response);
            return true;
        } else {
            log_message('error', 'WhatsApp failed to send to: ' . $toPhone . ' HTTP Code: ' . $httpCode . ' Response: ' . $response);
            return false;
        }
    }
}
