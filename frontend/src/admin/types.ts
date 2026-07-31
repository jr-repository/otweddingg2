export type AdminSummary = {
  totalResponses: number;
  attendingYes: number;
  attendingNo: number;
  confirmedSeats: number;
  checkedInHolyMatrimony: number;
  checkedInSyukuran: number;
  checkedInGuests: number;
  pendingCheckIns: number;
  latestSubmittedAt: string | null;
};

export type AdminRecord = {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  guestCode: string;
  phone: string;
  email: string;
  attending: "yes" | "no";
  attendingLabel: string;
  guestsLabel: string;
  events: string[];
  eventsLabel: string;
  passUrl: string;
  qrCodeDataUrl: string | null;
  submittedAtLabel: string;
  holyMatrimonyCheckedInLabel: string;
  holyMatrimonyCheckedInBy: string;
  syukuranCheckedInLabel: string;
  syukuranCheckedInBy: string;
  lastCheckInAtLabel: string;
};

export type DashboardPayload = {
  summary: AdminSummary;
  records: AdminRecord[];
};

export type AdminUser = {
  username: string;
  displayName: string;
};

export type ScanFeedback = {
  kind: "success" | "error";
  title: string;
  body: string;
};

export type AdminView = "overview" | "guests" | "scanner";
export type EventKey = "holy_matrimony" | "syukuran";
