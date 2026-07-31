<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Wedding RSVP Report</title>
    <style>
      body { font-family: DejaVu Sans, sans-serif; color: #30261f; font-size: 12px; margin: 24px; }
      h1, h2 { font-family: Georgia, serif; margin: 0; }
      .eyebrow { text-transform: uppercase; letter-spacing: 0.35em; color: #8f7f72; font-size: 10px; margin-bottom: 12px; }
      .hero { border: 1px solid #e3d6c9; border-radius: 18px; padding: 24px; background: #fcf8f2; }
      .hero p { margin: 8px 0 0; color: #6e6258; }
      .summary { width: 100%; border-collapse: separate; border-spacing: 10px; margin: 20px 0; }
      .summary td { width: 25%; border: 1px solid #eadfd4; background: #fffdf9; border-radius: 14px; padding: 16px; vertical-align: top; }
      .summary-label { display: block; text-transform: uppercase; letter-spacing: 0.25em; color: #8f7f72; font-size: 9px; margin-bottom: 8px; }
      .summary-value { font-family: Georgia, serif; font-size: 24px; color: #30261f; }
      table.report { width: 100%; border-collapse: collapse; margin-top: 20px; }
      .report th { background: #6f5946; color: #fff; padding: 10px; text-align: left; font-size: 11px; }
      .report td { border: 1px solid #eadfd4; padding: 10px; font-size: 11px; }
      .report tbody tr:nth-child(even) { background: #fbf7f2; }
      .badge { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 10px; }
      .badge-yes { background: #efe1cc; color: #5c4332; }
      .badge-no { background: #f3ebe3; color: #7d6552; }
    </style>
  </head>
  <body>
    <section class="hero">
      <p class="eyebrow">Wedding RSVP Report</p>
      <h1>L &amp; A Invitation Dashboard</h1>
      <p>Generated on <?= esc($generatedAt->format('d M Y, H:i')) ?> WIB</p>
    </section>

    <table class="summary">
      <tr>
        <td><span class="summary-label">Total Responses</span><span class="summary-value"><?= esc((string) $summary['totalResponses']) ?></span></td>
        <td><span class="summary-label">Attending</span><span class="summary-value"><?= esc((string) $summary['attendingYes']) ?></span></td>
        <td><span class="summary-label">Unable to Attend</span><span class="summary-value"><?= esc((string) $summary['attendingNo']) ?></span></td>
        <td><span class="summary-label">Confirmed Seats</span><span class="summary-value"><?= esc((string) $summary['confirmedSeats']) ?></span></td>
      </tr>
    </table>

    <table class="report">
      <thead>
        <tr>
          <th>Submitted</th>
          <th>Guest Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Attendance</th>
          <th>Guests</th>
          <th>Events</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($records as $record): ?>
          <tr>
            <td><?= esc($record['submittedAtLabel']) ?></td>
            <td><?= esc($record['fullName']) ?></td>
            <td><?= esc($record['email']) ?></td>
            <td><?= esc($record['phone'] !== '' ? $record['phone'] : '-') ?></td>
            <td>
              <span class="badge <?= $record['attending'] === 'yes' ? 'badge-yes' : 'badge-no' ?>">
                <?= esc($record['attendingLabel']) ?>
              </span>
            </td>
            <td><?= esc($record['guestsLabel']) ?></td>
            <td><?= esc($record['eventsLabel']) ?></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </body>
</html>
