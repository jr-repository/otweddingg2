import type { AdminRecord, AdminSummary, EventKey, ScanFeedback } from "@/admin/types";

export const EMPTY_SUMMARY: AdminSummary = {
  totalResponses: 0,
  attendingYes: 0,
  attendingNo: 0,
  confirmedSeats: 0,
  checkedInHolyMatrimony: 0,
  checkedInSyukuran: 0,
  checkedInGuests: 0,
  pendingCheckIns: 0,
  latestSubmittedAt: null,
};

export const EVENT_LABELS: Record<EventKey, string> = {
  holy_matrimony: "Holy Matrimony",
  syukuran: "Lunch Celebration",
};

export function getEventLabel(eventKey: EventKey) {
  return EVENT_LABELS[eventKey];
}

export function normalizeAdminRecord(input: Partial<AdminRecord> | null | undefined): AdminRecord {
  const firstName = typeof input?.firstName === "string" ? input.firstName.trim() : "";
  const lastName = typeof input?.lastName === "string" ? input.lastName.trim() : "";
  const fullNameSource = typeof input?.fullName === "string" ? input.fullName.trim() : "";
  const normalizedEvents = Array.isArray(input?.events)
    ? input.events
        .filter((eventName): eventName is string => typeof eventName === "string")
        .map((eventName) => eventName.trim())
        .filter(Boolean)
    : [];
  const fullName =
    fullNameSource || [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown Guest";
  const guestCount =
    typeof input?.guestsLabel === "string" && input.guestsLabel.trim() !== ""
      ? input.guestsLabel
      : "-";

  return {
    id: typeof input?.id === "number" ? input.id : Number(input?.id ?? 0) || 0,
    fullName,
    firstName,
    lastName,
    guestCode: typeof input?.guestCode === "string" ? input.guestCode.trim() : "",
    phone: typeof input?.phone === "string" ? input.phone.trim() : "",
    email: typeof input?.email === "string" ? input.email.trim() : "",
    attending: input?.attending === "yes" ? "yes" : "no",
    attendingLabel:
      typeof input?.attendingLabel === "string" && input.attendingLabel.trim() !== ""
        ? input.attendingLabel
        : input?.attending === "yes"
          ? "Attending"
          : "Unable to Attend",
    guestsLabel: guestCount,
    events: normalizedEvents,
    eventsLabel:
      typeof input?.eventsLabel === "string" && input.eventsLabel.trim() !== ""
        ? input.eventsLabel
        : normalizedEvents.length > 0
          ? normalizedEvents.join(", ")
          : "-",
    passUrl: typeof input?.passUrl === "string" ? input.passUrl : "",
    qrCodeDataUrl: typeof input?.qrCodeDataUrl === "string" ? input.qrCodeDataUrl : null,
    submittedAtLabel:
      typeof input?.submittedAtLabel === "string" && input.submittedAtLabel.trim() !== ""
        ? input.submittedAtLabel
        : "-",
    holyMatrimonyCheckedInLabel:
      typeof input?.holyMatrimonyCheckedInLabel === "string" &&
      input.holyMatrimonyCheckedInLabel.trim() !== ""
        ? input.holyMatrimonyCheckedInLabel
        : "Pending",
    holyMatrimonyCheckedInBy:
      typeof input?.holyMatrimonyCheckedInBy === "string" ? input.holyMatrimonyCheckedInBy : "",
    syukuranCheckedInLabel:
      typeof input?.syukuranCheckedInLabel === "string" &&
      input.syukuranCheckedInLabel.trim() !== ""
        ? input.syukuranCheckedInLabel
        : "Pending",
    syukuranCheckedInBy:
      typeof input?.syukuranCheckedInBy === "string" ? input.syukuranCheckedInBy : "",
    lastCheckInAtLabel:
      typeof input?.lastCheckInAtLabel === "string" && input.lastCheckInAtLabel.trim() !== ""
        ? input.lastCheckInAtLabel
        : "Not checked in yet",
  };
}

export function normalizeAdminRecords(input: unknown): AdminRecord[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter(
      (record): record is Partial<AdminRecord> => Boolean(record) && typeof record === "object",
    )
    .map((record) => normalizeAdminRecord(record));
}

export function recordBelongsToEvent(record: AdminRecord, eventKey: EventKey) {
  const target = getEventLabel(eventKey).toLowerCase();
  const events = Array.isArray(record.events) ? record.events : [];

  return events.some(
    (eventName) => typeof eventName === "string" && eventName.toLowerCase() === target,
  );
}

export function buildCheckInFeedback(
  eventKey: EventKey,
  kind: "success" | "error",
  message: string,
) {
  const eventLabel = getEventLabel(eventKey);
  const normalized = message.trim().toLowerCase();

  if (kind === "success") {
    return {
      kind,
      title: `${eventLabel} check-in confirmed`,
      body: message,
    } satisfies ScanFeedback;
  }

  if (normalized.includes("already been used") || normalized.includes("already checked in")) {
    return {
      kind,
      title: `Already checked in for ${eventLabel}`,
      body: `This guest has already checked in for ${eventLabel}.`,
    } satisfies ScanFeedback;
  }

  if (normalized.includes("did not rsvp for the selected event")) {
    return {
      kind,
      title: `Not registered for ${eventLabel}`,
      body: `This guest is not registered for ${eventLabel}.`,
    } satisfies ScanFeedback;
  }

  if (normalized.includes("unable to attend") || normalized.includes("not attending")) {
    return {
      kind,
      title: "Marked as not attending",
      body: "This guest previously responded that they are unable to attend.",
    } satisfies ScanFeedback;
  }

  return {
    kind,
    title: `${eventLabel} check-in could not be completed`,
    body: message,
  } satisfies ScanFeedback;
}
