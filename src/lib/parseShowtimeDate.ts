const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** Returns the YYYY-MM-DD date of a label like "Sat 31 Oct 19:45", which has no year. */
export function parseShowtimeDate(label: string): string | null {
  const match = label.match(/(\d{1,2})\s+([A-Z][a-z]{2})/)
  if (!match) return null

  const month = MONTHS.indexOf(match[2])
  if (month === -1) return null

  // Listings are upcoming, so a month far behind the current one is in the next year
  const now = new Date()
  const year = month + 6 < now.getMonth() ? now.getFullYear() + 1 : now.getFullYear()

  return `${year}-${String(month + 1).padStart(2, "0")}-${match[1].padStart(2, "0")}`
}
