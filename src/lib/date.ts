/**
 * Today's date as "YYYY-MM-DD" in the browser's own local timezone.
 *
 * Deliberately NOT `new Date().toISOString().slice(0, 10)` - toISOString()
 * always converts to UTC first, so for any timezone ahead of UTC (e.g. East
 * Africa Time, UTC+3) that returns YESTERDAY's date during the first few
 * hours after local midnight, right when a CR is most likely to be picking
 * "today" for a booking.
 */
export function todayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
