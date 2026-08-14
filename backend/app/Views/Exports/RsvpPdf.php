<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Wedding RSVP Report</title>
    <style>
      body {
        font-family: DejaVu Sans, sans-serif;
        color: #2b221c;
        font-size: 8px;
        line-height: 1.25;
        margin: 14px 16px 18px;
      }

      h1, h2, h3 {
        font-family: Georgia, serif;
        margin: 0;
        font-weight: normal;
      }

      .report-shell {
        border: 1px solid #dccfc3;
        padding: 12px 12px 10px;
      }

      .header-table,
      .report-table {
        width: 100%;
        border-collapse: collapse;
      }

      .header-table td {
        vertical-align: top;
      }

      .brand {
        font-size: 18px;
        color: #241b15;
      }

      .subtitle {
        margin-top: 3px;
        text-transform: uppercase;
        letter-spacing: 0.28em;
        font-size: 7px;
        color: #8b7664;
      }

      .meta-block {
        text-align: right;
        font-size: 7px;
        color: #6f6257;
        white-space: nowrap;
      }

      .meta-line {
        margin-bottom: 3px;
      }

      .section-line {
        margin: 10px 0 8px;
        border-top: 1px solid #dccfc3;
      }

      .table-title {
        margin-bottom: 6px;
        font-size: 11px;
        color: #241b15;
      }

      .report-table thead th {
        padding: 6px 4px;
        background: #5f4d40;
        border: 1px solid #5f4d40;
        color: #fffaf5;
        font-size: 6.8px;
        font-weight: bold;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        text-align: center;
        white-space: nowrap;
      }

      .report-table tbody td {
        padding: 5px 4px;
        border: 1px solid #e4d8cd;
        font-size: 7px;
        vertical-align: middle;
        white-space: nowrap;
      }

      .report-table tbody tr:nth-child(even) {
        background: #faf6f1;
      }

      .center {
        text-align: center;
      }

      .right {
        text-align: right;
      }

      .footer {
        margin-top: 8px;
        padding-top: 6px;
        border-top: 1px solid #e4d8cd;
        text-align: center;
        font-size: 6.8px;
        color: #8a7a6e;
        white-space: nowrap;
      }
    </style>
  </head>
  <body>
    <section class="report-shell">
      <table class="header-table">
        <tr>
          <td>
            <h1 class="brand">Luis &amp; Angel RSVP Report</h1>
            <div class="subtitle">Wedding Administration Report</div>
          </td>
          <td class="meta-block">
            <div class="meta-line">Generated: <?= esc($generatedAt->format('d M Y H:i')) ?> WIB</div>
            <div class="meta-line">Date: 23 - 24 April 2027</div>
            <div class="meta-line">Location: Jakarta, Indonesia</div>
          </td>
        </tr>
      </table>

      <div class="section-line"></div>

      <h2 class="table-title">Guest Responses</h2>

      <table class="report-table">
        <thead>
          <tr>
            <th style="width:4%;">No</th>
            <th style="width:13%;">Submitted</th>
            <th style="width:16%;">Guest Name</th>
            <th style="width:28%;">Contact</th>
            <th style="width:11%;">Response</th>
            <th style="width:8%;">Guests</th>
            <th style="width:20%;">Reserved Event</th>
          </tr>
        </thead>
        <tbody>
          <?php if ($records === []): ?>
            <tr>
              <td colspan="7" class="center">No RSVP responses are available.</td>
            </tr>
          <?php endif; ?>

          <?php foreach ($records as $index => $record): ?>
            <?php
              $submitted = str_replace(', ', ' ', (string) $record['submittedAtLabel']);
              $contact = trim($record['email'] . ($record['phone'] !== '' ? ' · ' . $record['phone'] : ''));
              $events = str_replace(', ', ' · ', (string) $record['eventsLabel']);
            ?>
            <tr>
              <td class="center"><?= esc((string) ($index + 1)) ?></td>
              <td class="center"><?= esc($submitted) ?></td>
              <td><?= esc($record['fullName']) ?></td>
              <td><?= esc($contact !== '' ? $contact : '-') ?></td>
              <td class="center"><?= esc($record['attendingLabel']) ?></td>
              <td class="center"><?= esc($record['guestsLabel']) ?></td>
              <td><?= esc($events) ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>

      <div class="footer">
        Total Responses: <?= esc((string) $summary['totalResponses']) ?> · Attending: <?= esc((string) $summary['attendingYes']) ?> · Unable to Attend: <?= esc((string) $summary['attendingNo']) ?> · Confirmed Seats: <?= esc((string) $summary['confirmedSeats']) ?>
      </div>
    </section>
  </body>
</html>
