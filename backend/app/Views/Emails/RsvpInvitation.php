<?php

$title = $isUpdate ? 'RSVP Updated' : 'Guest Pass';
$eventList = is_array($events ?? null) ? $events : [];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= esc($title) ?></title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#201b18;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background:#ffffff;border:1px solid #e8ddd0;border-radius:22px;overflow:hidden;">
                    <tr>
                        <td style="padding:32px 28px 28px 28px;background:linear-gradient(180deg,#5d4d41 0%,#7a6556 100%);text-align:center;">
                            <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#ead8c1;margin-bottom:14px;">Guest Pass</div>
                            <div style="font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.18;color:#fff9f2;margin-bottom:10px;">Luis Meraz &amp; Angel Mayjesty</div>
                            <div style="font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#ead8c1;">Save this QR for venue check-in</div>
                        </td>
                    </tr>

                    <?php if (! empty($qrCodeImageSrc)): ?>
                        <tr>
                            <td align="center" style="padding:28px 28px 18px 28px;">
                                <img
                                    src="<?= esc($qrCodeImageSrc) ?>"
                                    alt="Guest QR code"
                                    width="220"
                                    height="220"
                                    style="display:block;width:220px;height:220px;border:1px solid #eadfce;border-radius:18px;background:#ffffff;padding:12px;"
                                >
                            </td>
                        </tr>
                    <?php endif; ?>

                    <tr>
                        <td style="padding:0 28px 28px 28px;">
                            <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#a98b68;margin-bottom:12px;">Registered Guest</div>
                            <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.6;color:#201b18;margin-bottom:6px;"><?= esc($fullName) ?></div>
                            <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#9a866f;">Guest Code <?= esc($guestCode) ?></div>
                        </td>
                    </tr>

                    <?php if ($eventList !== []): ?>
                        <tr>
                            <td style="padding:0 28px 18px 28px;">
                                <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#a98b68;margin-bottom:12px;">Reserved Event</div>
                                <?php foreach ($eventList as $eventName): ?>
                                    <span style="display:inline-block;margin:0 8px 8px 0;padding:10px 14px;border-radius:999px;background:#f5eadb;border:1px solid #e2d2bc;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6f573f;">
                                        <?= esc($eventName) ?>
                                    </span>
                                <?php endforeach; ?>
                            </td>
                        </tr>
                    <?php endif; ?>

                    <tr>
                        <td style="padding:0 28px 30px 28px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #efe4d5;border-bottom:1px solid #efe4d5;">
                                <tr>
                                    <td style="padding:14px 0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#a98b68;">Response</td>
                                    <td align="right" style="padding:14px 0;font-size:16px;line-height:1.5;color:#201b18;"><?= esc($attendanceLabel) ?></td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 0;border-top:1px solid #efe4d5;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#a98b68;">Guests</td>
                                    <td align="right" style="padding:14px 0;border-top:1px solid #efe4d5;font-size:16px;line-height:1.5;color:#201b18;"><?= esc($guestCountLabel) ?></td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 0;border-top:1px solid #efe4d5;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#a98b68;">Date</td>
                                    <td align="right" style="padding:14px 0;border-top:1px solid #efe4d5;font-size:16px;line-height:1.5;color:#201b18;"><?= esc($dateLabel) ?></td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 0;border-top:1px solid #efe4d5;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#a98b68;">Location</td>
                                    <td align="right" style="padding:14px 0;border-top:1px solid #efe4d5;font-size:16px;line-height:1.5;color:#201b18;"><?= esc($locationLabel) ?></td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:0 28px 30px 28px;">
                            <a
                                href="<?= esc($buttonUrl) ?>"
                                style="display:inline-block;padding:14px 22px;border-radius:999px;background:#2c211c;color:#fff9f2;text-decoration:none;font-size:12px;letter-spacing:3px;text-transform:uppercase;"
                            >
                                <?= esc($buttonLabel) ?>
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
