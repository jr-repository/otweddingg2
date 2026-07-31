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
  syukuran: "Syukuran",
};

export function getEventLabel(eventKey: EventKey) {
  return EVENT_LABELS[eventKey];
}

export function recordBelongsToEvent(record: AdminRecord, eventKey: EventKey) {
  const target = getEventLabel(eventKey).toLowerCase();
  return record.events.some((eventName) => eventName.toLowerCase() === target);
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
